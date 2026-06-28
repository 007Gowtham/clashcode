package com.clashcode.dsa_multiplayer.submission.service;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import com.clashcode.dsa_multiplayer.room.entity.Room;
import com.clashcode.dsa_multiplayer.room.repository.RoomRepository;
import com.clashcode.dsa_multiplayer.submission.dto.*;
import com.clashcode.dsa_multiplayer.submission.entity.Submission;
import com.clashcode.dsa_multiplayer.submission.entity.SubmissionStatus;
import com.clashcode.dsa_multiplayer.submission.repository.SubmissionRepository;
import com.clashcode.dsa_multiplayer.submission.sandbox.SandboxService;
import io.awspring.cloud.sqs.operations.SqsTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepo;
    private final ProblemService problemService;
    private final RoomRepository roomRepo;
    private final SandboxService sandbox;
    private final SqsTemplate sqsTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Value("${app.sqs.judge-queue}")
    private String judgeQueueName;

    // ── Run — synchronous, no SQS, sample test cases only ───────────────────
    public RunResponse run(RunRequest req, User user) {
        var problem = problemService.getEntityById(req.getProblemId());

        SubmissionJudgeEngine.JudgeResult result = SubmissionJudgeEngine.judge(
                sandbox, problem, req.getLanguage(), req.getCode(), true);

        String error = null;
        if (result.resultMap().containsKey("error")) {
            error = (String) result.resultMap().get("error");
        }

        return RunResponse.builder()
                .status(result.status().name())
                .testResults((List<java.util.Map<String, Object>>) result.resultMap().get("testResults"))
                .error(error)
                .executionTimeMs(result.maxTimeMs())
                .compilationError(result.status() == SubmissionStatus.COMPILE_ERROR)
                .build();
    }

    // ── Submit — save PENDING, drop note on SQS, return immediately ─────────
    @Transactional
    public SubmissionResponse submit(SubmitRequest req, User user) {
        var problem = problemService.getEntityById(req.getProblemId());

        Room room = null;
        if (req.getRoomId() != null) {
            room = roomRepo.findById(req.getRoomId())
                    .orElseThrow(() -> new ApiException(
                            "ROOM_NOT_FOUND: Room not found", HttpStatus.NOT_FOUND));
        }

        Submission submission = Submission.builder()
                .user(user)
                .problem(problem)
                .room(room)
                .language(req.getLanguage())
                .code(req.getCode())
                .status(SubmissionStatus.PENDING)
                .submittedAt(Instant.now())
                .build();
        Submission saved = submissionRepo.save(submission);

        final UUID submissionId = saved.getId();

        // Send the SQS message AFTER the transaction commits.
        // If we sent it inside the transaction the worker can race and query
        // the DB before the INSERT is visible, causing "not found" drops.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    String payload = objectMapper.writeValueAsString(
                            JudgeMessage.builder().submissionId(submissionId).build());
                    sqsTemplate.send(to -> to.queue(judgeQueueName).payload(payload));
                    log.info("Submission {} queued for judging (user={}, problem={})",
                            submissionId, user.getId(), problem.getId());
                } catch (Exception e) {
                    log.error("Failed to queue submission {} for judging", submissionId, e);
                }
            }
        });

        return SubmissionResponse.from(saved);
    }

    // ── History ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<SubmissionResponse> mySubmissions(User user) {
        return submissionRepo.findByUserIdOrderBySubmittedAtDesc(user.getId())
                .stream().map(SubmissionResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> submissionsByRoom(UUID roomId, User user) {
        return submissionRepo.findByRoomIdOrderBySubmittedAtDesc(roomId)
                .stream()
                .filter(s -> s.getUser().getId().equals(user.getId()))
                .map(SubmissionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getById(UUID id, User user) {
        Submission sub = submissionRepo.findById(id)
                .orElseThrow(() -> new ApiException(
                        "SUBMISSION_NOT_FOUND: Submission not found", HttpStatus.NOT_FOUND));
        if (!sub.getUser().getId().equals(user.getId())) {
            throw new ApiException("FORBIDDEN: Access denied", HttpStatus.FORBIDDEN);
        }
        return SubmissionResponse.from(sub);
    }
}
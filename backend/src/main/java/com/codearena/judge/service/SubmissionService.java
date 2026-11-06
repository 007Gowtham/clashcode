package com.codearena.judge.service;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.SubmissionStatus;
import com.codearena.judge.domain.Verdict;
import com.codearena.judge.dto.CreateSubmissionRequest;
import com.codearena.judge.dto.LeaderboardScoreDto;
import com.codearena.judge.dto.SubmissionResponse;
import com.codearena.judge.event.SubmissionEvent;
import com.codearena.judge.exception.RateLimitExceededException;
import com.codearena.judge.exception.SubmissionNotFoundException;
import com.codearena.judge.queue.JudgeQueue;
import com.codearena.judge.repository.SubmissionRepository;
import com.codearena.judge.sandbox.SampleResult;
import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.ProblemStatus;
import com.codearena.problem.exception.ProblemNotFoundException;
import com.codearena.problem.exception.ProblemRuleViolationException;
import com.codearena.problem.exception.UnauthorizedProblemActionException;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomStatus;
import com.codearena.room.exception.IllegalRoomStateException;
import com.codearena.room.exception.NotRoomMemberException;
import com.codearena.room.exception.RoomNotFoundException;
import com.codearena.room.repository.RoomMemberRepository;
import com.codearena.room.repository.RoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private static final int RATE_LIMIT_SECONDS = 5;
    private static final int MAX_SUBMISSIONS_PER_PROBLEM = 50;

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;
    private final JudgeQueue judgeQueue;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    /**
     * Ingests a new submission: validates rate limits and contest rules,
     * persists with PENDING status, and immediately enqueues for judging.
     * Guaranteed: Never runs code inside the HTTP request thread.
     */
    @Transactional
    public SubmissionResponse createSubmission(CreateSubmissionRequest request, UUID userId) {
        // 1. Rate Limit Checks
        long recentSubmissions = submissionRepository.countByUserIdAndCreatedAtAfter(
                userId, Instant.now().minusSeconds(RATE_LIMIT_SECONDS)
        );
        if (recentSubmissions > 0) {
            throw new RateLimitExceededException("Please wait at least " + RATE_LIMIT_SECONDS + " seconds between submissions");
        }

        long problemSubmissions = submissionRepository.countByUserIdAndProblemId(userId, request.getProblemId());
        if (problemSubmissions >= MAX_SUBMISSIONS_PER_PROBLEM) {
            throw new RateLimitExceededException("Maximum submission count (" + MAX_SUBMISSIONS_PER_PROBLEM + ") reached for this problem");
        }

        // 2. Validate Problem and Room status
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + request.getProblemId()));

        if (request.getRoomId() != null) {
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + request.getRoomId()));

            boolean isMember = roomMemberRepository.existsByRoomIdAndUserIdAndStatus(room.getId(), userId, MemberStatus.ACTIVE);
            boolean isAdmin = room.getAdminId().equals(userId);
            if (!isMember && !isAdmin) {
                throw new NotRoomMemberException("You are not an active member of room: " + room.getId());
            }

            if (room.getStatus() != RoomStatus.IN_PROGRESS) {
                throw new IllegalRoomStateException("Submissions are only accepted while the room contest is IN_PROGRESS");
            }
        } else {
            // Standalone practice: problem must be PUBLISHED
            if (problem.getStatus() != ProblemStatus.PUBLISHED) {
                throw new ProblemRuleViolationException("Cannot submit to problem that is not PUBLISHED");
            }
        }

        // 3. Create Submission in PENDING status
        Submission submission = Submission.builder()
                .userId(userId)
                .roomId(request.getRoomId())
                .problemId(request.getProblemId())
                .language(request.getLanguage())
                .sourceCode(request.getSourceCode().trim())
                .mode(request.getMode())
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Submission saved = submissionRepository.saveAndFlush(submission);

        // 4. Publish initial PENDING status event
        eventPublisher.publishEvent(SubmissionEvent.builder()
                .submissionId(saved.getId())
                .userId(saved.getUserId())
                .roomId(saved.getRoomId())
                .problemId(saved.getProblemId())
                .mode(saved.getMode())
                .status(SubmissionStatus.PENDING)
                .build());

        // 5. Asynchronous handoff to judging queue - MUST RUN AFTER TRANSACTION COMMITS
        // This prevents race condition where worker thread attempts to load the submission
        // before the HTTP request thread has committed the transaction to PostgreSQL.
        final UUID finalSubmissionId = saved.getId();
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    judgeQueue.publish(finalSubmissionId);
                }
            });
        } else {
            judgeQueue.publish(finalSubmissionId);
        }

        log.info("Created submission {} (mode: {}, language: {}) for user {}",
                saved.getId(), saved.getMode(), saved.getLanguage(), userId);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(UUID submissionId, UUID userId, boolean isGlobalAdmin) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new SubmissionNotFoundException("Submission not found with ID: " + submissionId));

        boolean isAuthor = submission.getUserId().equals(userId);
        boolean isRoomAdmin = false;
        if (submission.getRoomId() != null) {
            isRoomAdmin = roomRepository.findById(submission.getRoomId())
                    .map(r -> r.getAdminId().equals(userId))
                    .orElse(false);
        }

        if (!isAuthor && !isRoomAdmin && !isGlobalAdmin) {
            throw new UnauthorizedProblemActionException("You are not authorized to view this submission");
        }

        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public Page<SubmissionResponse> listUserSubmissions(UUID userId, Pageable pageable) {
        return submissionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<SubmissionResponse> listRoomSubmissions(UUID roomId, UUID userId, Pageable pageable) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        boolean isMember = roomMemberRepository.existsByRoomIdAndUserIdAndStatus(roomId, userId, MemberStatus.ACTIVE);
        boolean isAdmin = room.getAdminId().equals(userId);

        if (!isMember && !isAdmin) {
            throw new NotRoomMemberException("You are not an active member of room: " + roomId);
        }

        // Scope submissions: In TEAM mode, return submissions of own team members. In SOLO mode, return submissions of current user.
        if (room.getMode() == com.codearena.room.domain.RoomMode.TEAM) {
            java.util.Optional<com.codearena.room.domain.RoomMember> currentMember =
                    roomMemberRepository.findByRoomIdAndUserId(roomId, userId);

            if (currentMember.isPresent() && currentMember.get().getTeamId() != null) {
                List<UUID> teamUserIds = roomMemberRepository.findByTeamId(currentMember.get().getTeamId()).stream()
                        .map(com.codearena.room.domain.RoomMember::getUserId)
                        .toList();
                return submissionRepository.findByRoomIdAndModeAndUserIdInOrderByCreatedAtDesc(
                        roomId, SubmissionMode.SUBMIT, teamUserIds, pageable
                ).map(this::toResponse);
            }
        }

        // SOLO mode (or unassigned/admin): return current user's submissions
        return submissionRepository.findByRoomIdAndModeAndUserIdOrderByCreatedAtDesc(
                roomId, SubmissionMode.SUBMIT, userId, pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardScoreDto> getRoomLeaderboard(UUID roomId) {
        List<Submission> acceptedSubmissions = submissionRepository.findByRoomIdAndModeAndVerdict(
                roomId, SubmissionMode.SUBMIT, Verdict.ACCEPTED
        );

        // Group by user ID
        Map<UUID, List<Submission>> byUser = acceptedSubmissions.stream()
                .collect(Collectors.groupingBy(Submission::getUserId));

        List<LeaderboardScoreDto> result = new ArrayList<>();
        for (Map.Entry<UUID, List<Submission>> entry : byUser.entrySet()) {
            UUID userId = entry.getKey();
            List<Submission> userSubs = entry.getValue();

            // Distinct problems solved and their max score
            Map<UUID, Integer> problemScores = userSubs.stream()
                    .collect(Collectors.toMap(
                            Submission::getProblemId,
                            Submission::getScore,
                            Math::max
                    ));
            int totalScore = problemScores.values().stream().mapToInt(Integer::intValue).sum();
            int solvedCount = problemScores.size();
            Instant lastAcceptedAt = userSubs.stream()
                    .map(Submission::getCreatedAt)
                    .max(Instant::compareTo)
                    .orElse(Instant.now());

            String username = userRepository.findById(userId)
                    .map(User::getUsername)
                    .orElse("Unknown");

            result.add(LeaderboardScoreDto.builder()
                    .userId(userId)
                    .username(username)
                    .score(totalScore)
                    .solvedCount(solvedCount)
                    .lastAcceptedAt(lastAcceptedAt)
                    .build());
        }

        // Sort descending by score, then ascending by lastAcceptedAt
        result.sort((a, b) -> {
            int scoreCmp = Integer.compare(b.getScore(), a.getScore());
            if (scoreCmp != 0) return scoreCmp;
            return a.getLastAcceptedAt().compareTo(b.getLastAcceptedAt());
        });

        return result;
    }

    private SubmissionResponse toResponse(Submission s) {
        List<SampleResult> sampleResults = null;
        if (s.getSampleResultsJson() != null && !s.getSampleResultsJson().isBlank()) {
            try {
                sampleResults = objectMapper.readValue(s.getSampleResultsJson(), new TypeReference<>() {});
            } catch (Exception e) {
                log.warn("Failed to deserialize sample results for submission {}", s.getId(), e);
            }
        }

        String username = userRepository.findById(s.getUserId())
                .map(User::getUsername)
                .orElse("Unknown");

        return SubmissionResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .username(username)
                .roomId(s.getRoomId())
                .problemId(s.getProblemId())
                .language(s.getLanguage())
                .mode(s.getMode())
                .status(s.getStatus())
                .verdict(s.getVerdict())
                .score(s.getScore())
                .runtimeMs(s.getRuntimeMs())
                .memoryKb(s.getMemoryKb())
                .compilerOutput(s.getCompilerOutput())
                .failedCaseIndex(s.getFailedCaseIndex())
                .sampleResults(sampleResults)
                .createdAt(s.getCreatedAt())
                .build();
    }
}


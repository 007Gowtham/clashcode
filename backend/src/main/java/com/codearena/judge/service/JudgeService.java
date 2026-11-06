package com.codearena.judge.service;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.SubmissionStatus;
import com.codearena.judge.domain.Verdict;
import com.codearena.judge.event.LeaderboardUpdateEvent;
import com.codearena.judge.event.SubmissionEvent;
import com.codearena.judge.metrics.JudgeMetricsService;
import com.codearena.judge.repository.SubmissionRepository;
import com.codearena.judge.sandbox.SandboxResult;
import com.codearena.judge.sandbox.SandboxRunner;
import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.TestCase;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.TestCaseRepository;
import com.codearena.room.domain.Room;
import com.codearena.room.repository.RoomRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final SandboxRunner sandboxRunner;
    private final JudgeMetricsService metricsService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    /**
     * Judges a submission in the sandbox, saves the verdict, and publishes results.
     * Architectural requirement: This service does not know where the job came from.
     *
     * @param submissionId the unique ID of the submission to judge
     */
    @Transactional
    public void judge(UUID submissionId) {
        Submission submission = null;
        for (int i = 0; i < 10; i++) {
            submission = submissionRepository.findById(submissionId).orElse(null);
            if (submission != null) {
                break;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        if (submission == null) {
            log.warn("Cannot judge submission: not found with ID {}", submissionId);
            return;
        }

        long waitTimeMs = System.currentTimeMillis() - submission.getCreatedAt().toEpochMilli();
        metricsService.recordQueueWaitTime(waitTimeMs);

        // 1. Transition to RUNNING state
        submission.setStatus(SubmissionStatus.RUNNING);
        submission.setUpdatedAt(Instant.now());
        submissionRepository.save(submission);

        eventPublisher.publishEvent(SubmissionEvent.builder()
                .submissionId(submission.getId())
                .userId(submission.getUserId())
                .roomId(submission.getRoomId())
                .problemId(submission.getProblemId())
                .mode(submission.getMode())
                .status(SubmissionStatus.RUNNING)
                .build());

        log.info("Judging submission {} (mode: {}, language: {})",
                submissionId, submission.getMode(), submission.getLanguage());

        // 2. Load problem and test cases
        Problem problem = problemRepository.findById(submission.getProblemId()).orElse(null);
        if (problem == null) {
            log.error("Problem {} not found for submission {}", submission.getProblemId(), submissionId);
            markInternalError(submission, "Problem definition not found");
            return;
        }

        List<TestCase> testCases;
        if (submission.getMode() == SubmissionMode.RUN) {
            // RUN mode executes ONLY sample test cases
            testCases = testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problem.getId());
        } else {
            // SUBMIT mode executes ALL test cases
            testCases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId());
        }

        // 3. Execute in Docker sandbox
        SandboxResult result = sandboxRunner.execute(
                submission,
                testCases,
                problem.getTimeLimitMs(),
                problem.getMemoryLimitMb()
        );

        // 4. Record execution metrics
        metricsService.recordJudgeDuration(result.getRuntimeMs());
        metricsService.recordSubmission(result.getVerdict(), submission.getLanguage(), submission.getMode().name());

        // 5. Calculate Score
        int score = 0;
        if (submission.getMode() == SubmissionMode.SUBMIT && result.getVerdict() == Verdict.ACCEPTED) {
            score = problem.getPoints();
        }

        // 6. Persist final verdict and outcome
        submission.setStatus(SubmissionStatus.DONE);
        submission.setVerdict(result.getVerdict());
        submission.setScore(score);
        submission.setRuntimeMs(result.getRuntimeMs());
        submission.setMemoryKb(result.getMemoryKb());
        submission.setCompilerOutput(result.getCompilerOutput());
        submission.setFailedCaseIndex(result.getFailedCaseIndex());
        submission.setUpdatedAt(Instant.now());

        if (submission.getMode() == SubmissionMode.RUN && result.getSampleResults() != null) {
            try {
                submission.setSampleResultsJson(objectMapper.writeValueAsString(result.getSampleResults()));
            } catch (Exception e) {
                log.warn("Failed to serialize sample results for submission {}", submissionId, e);
            }
        }

        Submission saved = submissionRepository.save(submission);
        log.info("Judged submission {}: verdict={}, score={}, runtime={}ms",
                saved.getId(), saved.getVerdict(), saved.getScore(), saved.getRuntimeMs());

        // 7. Publish completion event to user
        eventPublisher.publishEvent(SubmissionEvent.builder()
                .submissionId(saved.getId())
                .userId(saved.getUserId())
                .roomId(saved.getRoomId())
                .problemId(saved.getProblemId())
                .mode(saved.getMode())
                .status(SubmissionStatus.DONE)
                .verdict(saved.getVerdict())
                .score(saved.getScore())
                .runtimeMs(saved.getRuntimeMs())
                .memoryKb(saved.getMemoryKb())
                .compilerOutput(saved.getCompilerOutput())
                .failedCaseIndex(saved.getFailedCaseIndex())
                .sampleResults(result.getSampleResults())
                .build());

        // 8. Publish leaderboard score update for rooms in SUBMIT mode
        if (saved.getRoomId() != null && saved.getMode() == SubmissionMode.SUBMIT) {
            String username = userRepository.findById(saved.getUserId())
                    .map(User::getUsername)
                    .orElse("Unknown");

            String roomCode = roomRepository.findById(saved.getRoomId())
                    .map(Room::getRoomCode)
                    .orElse(null);

            // Compute cumulative total score across all distinct problems solved by this user in this room
            List<Submission> acceptedSubmissions = submissionRepository.findByRoomIdAndModeAndVerdict(
                    saved.getRoomId(), SubmissionMode.SUBMIT, Verdict.ACCEPTED
            );
            Map<UUID, Integer> userBestScores = acceptedSubmissions.stream()
                    .filter(s -> s.getUserId().equals(saved.getUserId()))
                    .collect(Collectors.toMap(
                            Submission::getProblemId,
                            Submission::getScore,
                            Math::max
                    ));
            int cumulativeScore = userBestScores.values().stream().mapToInt(Integer::intValue).sum();

            eventPublisher.publishEvent(LeaderboardUpdateEvent.builder()
                    .roomId(saved.getRoomId())
                    .roomCode(roomCode)
                    .userId(saved.getUserId())
                    .username(username)
                    .problemId(saved.getProblemId())
                    .score(cumulativeScore)
                    .verdict(saved.getVerdict())
                    .build());
        }
    }

    private void markInternalError(Submission submission, String message) {
        submission.setStatus(SubmissionStatus.DONE);
        submission.setVerdict(Verdict.INTERNAL_ERROR);
        submission.setCompilerOutput(message);
        submission.setUpdatedAt(Instant.now());
        submissionRepository.save(submission);

        eventPublisher.publishEvent(SubmissionEvent.builder()
                .submissionId(submission.getId())
                .userId(submission.getUserId())
                .roomId(submission.getRoomId())
                .problemId(submission.getProblemId())
                .mode(submission.getMode())
                .status(SubmissionStatus.DONE)
                .verdict(Verdict.INTERNAL_ERROR)
                .compilerOutput(message)
                .build());
    }
}


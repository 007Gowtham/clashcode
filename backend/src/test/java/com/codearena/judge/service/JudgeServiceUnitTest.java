package com.codearena.judge.service;

import com.codearena.auth.entity.User;
import com.codearena.auth.repository.UserRepository;
import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.SubmissionStatus;
import com.codearena.judge.domain.Verdict;
import com.codearena.judge.event.SubmissionEvent;
import com.codearena.judge.metrics.JudgeMetricsService;
import com.codearena.judge.repository.SubmissionRepository;
import com.codearena.judge.sandbox.FakeSandboxRunner;
import com.codearena.judge.sandbox.SandboxRunner;
import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.domain.ProblemStatus;
import com.codearena.problem.domain.ProgrammingLanguage;
import com.codearena.problem.domain.TestCase;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JudgeServiceUnitTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private TestCaseRepository testCaseRepository;

    @Mock
    private com.codearena.auth.repository.UserRepository userRepository;

    @Mock
    private com.codearena.room.repository.RoomRepository roomRepository;

    @Mock
    private JudgeMetricsService metricsService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private SandboxRunner sandboxRunner;
    private ObjectMapper objectMapper;
    private JudgeService judgeService;

    private UUID submissionId;
    private UUID problemId;
    private UUID userId;
    private Problem problem;
    private List<TestCase> testCases;

    @BeforeEach
    void setUp() {
        sandboxRunner = new FakeSandboxRunner();
        objectMapper = new ObjectMapper();
        judgeService = new JudgeService(
                submissionRepository,
                problemRepository,
                testCaseRepository,
                userRepository,
                roomRepository,
                sandboxRunner,
                metricsService,
                eventPublisher,
                objectMapper
        );

        submissionId = UUID.randomUUID();
        problemId = UUID.randomUUID();
        userId = UUID.randomUUID();

        problem = Problem.builder()
                .id(problemId)
                .title("Two Sum")
                .points(100)
                .timeLimitMs(2000)
                .memoryLimitMb(256)
                .status(ProblemStatus.PUBLISHED)
                .build();

        testCases = List.of(
                TestCase.builder().id(UUID.randomUUID()).problemId(problemId).input("input1").expectedOutput("out1").isSample(true).orderIndex(1).build(),
                TestCase.builder().id(UUID.randomUUID()).problemId(problemId).input("input2").expectedOutput("out2").isSample(false).orderIndex(2).build()
        );

        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        lenient().when(testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId)).thenReturn(testCases);
        lenient().when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("Verdict ACCEPTED in SUBMIT mode awards points and marks status DONE")
    void testAcceptedVerdictInSubmitMode() {
        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode("print('accepted')")
                .mode(SubmissionMode.SUBMIT)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getStatus()).isEqualTo(SubmissionStatus.DONE);
        assertThat(submission.getVerdict()).isEqualTo(Verdict.ACCEPTED);
        assertThat(submission.getScore()).isEqualTo(100);

        verify(eventPublisher, atLeastOnce()).publishEvent(any(SubmissionEvent.class));
        verify(metricsService).recordSubmission(Verdict.ACCEPTED, ProgrammingLanguage.PYTHON, "SUBMIT");
    }

    @Test
    @DisplayName("Verdict ACCEPTED in RUN mode sets score 0 and saves sample results")
    void testAcceptedVerdictInRunMode() {
        when(testCaseRepository.findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problemId))
                .thenReturn(List.of(testCases.get(0)));

        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.JAVA)
                .sourceCode("class Solution {}")
                .mode(SubmissionMode.RUN)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getStatus()).isEqualTo(SubmissionStatus.DONE);
        assertThat(submission.getVerdict()).isEqualTo(Verdict.ACCEPTED);
        assertThat(submission.getScore()).isEqualTo(0);
        assertThat(submission.getSampleResultsJson()).isNotEmpty();
    }

    @Test
    @DisplayName("Verdict WRONG_ANSWER stops at failed case with score 0")
    void testWrongAnswerVerdict() {
        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode("// VERDICT: WRONG_ANSWER")
                .mode(SubmissionMode.SUBMIT)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getVerdict()).isEqualTo(Verdict.WRONG_ANSWER);
        assertThat(submission.getScore()).isEqualTo(0);
        assertThat(submission.getFailedCaseIndex()).isEqualTo(1);
    }

    @Test
    @DisplayName("Verdict TIME_LIMIT_EXCEEDED records timeout and score 0")
    void testTimeLimitExceededVerdict() {
        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.CPP)
                .sourceCode("// VERDICT: TIME_LIMIT_EXCEEDED")
                .mode(SubmissionMode.SUBMIT)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getVerdict()).isEqualTo(Verdict.TIME_LIMIT_EXCEEDED);
        assertThat(submission.getScore()).isEqualTo(0);
    }

    @Test
    @DisplayName("Verdict MEMORY_LIMIT_EXCEEDED records memory violation and score 0")
    void testMemoryLimitExceededVerdict() {
        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode("// VERDICT: MEMORY_LIMIT_EXCEEDED")
                .mode(SubmissionMode.SUBMIT)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getVerdict()).isEqualTo(Verdict.MEMORY_LIMIT_EXCEEDED);
        assertThat(submission.getScore()).isEqualTo(0);
    }

    @Test
    @DisplayName("Verdict COMPILE_ERROR captures compiler message")
    void testCompileErrorVerdict() {
        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.JAVA)
                .sourceCode("// VERDICT: COMPILE_ERROR")
                .mode(SubmissionMode.SUBMIT)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getVerdict()).isEqualTo(Verdict.COMPILE_ERROR);
        assertThat(submission.getCompilerOutput()).contains("SyntaxError");
        assertThat(submission.getScore()).isEqualTo(0);
    }

    @Test
    @DisplayName("Verdict RUNTIME_ERROR captures exception message")
    void testRuntimeErrorVerdict() {
        Submission submission = Submission.builder()
                .id(submissionId)
                .userId(userId)
                .problemId(problemId)
                .language(ProgrammingLanguage.PYTHON)
                .sourceCode("// VERDICT: RUNTIME_ERROR")
                .mode(SubmissionMode.SUBMIT)
                .status(SubmissionStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        judgeService.judge(submissionId);

        assertThat(submission.getVerdict()).isEqualTo(Verdict.RUNTIME_ERROR);
        assertThat(submission.getCompilerOutput()).contains("NullPointerException");
    }
}


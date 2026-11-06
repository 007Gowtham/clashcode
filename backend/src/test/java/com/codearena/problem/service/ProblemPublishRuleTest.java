package com.codearena.problem.service;

import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.domain.ProblemStatus;
import com.codearena.problem.domain.TestCase;
import com.codearena.problem.dto.AdminProblemResponse;
import com.codearena.problem.exception.ProblemPublishValidationException;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProblemPublishRuleTest {

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private TestCaseRepository testCaseRepository;

    @Mock
    private StarterCodeRepository starterCodeRepository;

    @InjectMocks
    private AdminProblemService adminProblemService;

    private UUID problemId;
    private Problem draftProblem;

    @BeforeEach
    void setUp() {
        problemId = UUID.randomUUID();
        draftProblem = Problem.builder()
                .id(problemId)
                .title("Binary Search")
                .slug("binary-search")
                .statementMarkdown("Find target in sorted array")
                .difficulty(ProblemDifficulty.EASY)
                .status(ProblemStatus.DRAFT)
                .createdBy(UUID.randomUUID())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(problemRepository.findById(problemId)).thenReturn(Optional.of(draftProblem));
    }

    @Test
    @DisplayName("Publish fails when problem has 0 sample test cases")
    void testPublishFailsWithZeroSampleCases() {
        when(testCaseRepository.countByProblemIdAndIsSampleTrue(problemId)).thenReturn(0L);
        when(testCaseRepository.countByProblemId(problemId)).thenReturn(3L);

        assertThatThrownBy(() -> adminProblemService.publishProblem(problemId))
                .isInstanceOf(ProblemPublishValidationException.class)
                .hasMessageContaining("Must have at least 1 sample test case");

        assertThat(draftProblem.getStatus()).isEqualTo(ProblemStatus.DRAFT);
        verify(problemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Publish fails when problem has fewer than 3 total test cases")
    void testPublishFailsWithFewerThanThreeTotalCases() {
        when(testCaseRepository.countByProblemIdAndIsSampleTrue(problemId)).thenReturn(1L);
        when(testCaseRepository.countByProblemId(problemId)).thenReturn(2L);

        assertThatThrownBy(() -> adminProblemService.publishProblem(problemId))
                .isInstanceOf(ProblemPublishValidationException.class)
                .hasMessageContaining("Must have at least 3 total test cases");

        assertThat(draftProblem.getStatus()).isEqualTo(ProblemStatus.DRAFT);
        verify(problemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Publish succeeds when problem has 1 sample and 2 hidden (total 3)")
    void testPublishSucceedsWithExactMinimumCases() {
        when(testCaseRepository.countByProblemIdAndIsSampleTrue(problemId)).thenReturn(1L);
        when(testCaseRepository.countByProblemId(problemId)).thenReturn(3L);
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProblemResponse response = adminProblemService.publishProblem(problemId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ProblemStatus.PUBLISHED);
        assertThat(draftProblem.getStatus()).isEqualTo(ProblemStatus.PUBLISHED);
        verify(problemRepository).save(draftProblem);
    }

    @Test
    @DisplayName("Publish succeeds when problem has multiple samples and total exceeds 3")
    void testPublishSucceedsWithAbundantCases() {
        when(testCaseRepository.countByProblemIdAndIsSampleTrue(problemId)).thenReturn(2L);
        when(testCaseRepository.countByProblemId(problemId)).thenReturn(10L);
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminProblemResponse response = adminProblemService.publishProblem(problemId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ProblemStatus.PUBLISHED);
        verify(problemRepository).save(draftProblem);
    }
}


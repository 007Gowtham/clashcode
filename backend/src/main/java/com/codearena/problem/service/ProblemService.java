package com.codearena.problem.service;

import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.domain.ProblemStatus;
import com.codearena.problem.domain.TestCase;
import com.codearena.problem.dto.ProblemDetailResponse;
import com.codearena.problem.dto.ProblemSummaryResponse;
import com.codearena.problem.dto.SampleTestCaseDto;
import com.codearena.problem.dto.StarterCodeDto;
import com.codearena.problem.exception.ProblemNotFoundException;
import com.codearena.problem.repository.ProblemRepository;
import com.codearena.problem.repository.StarterCodeRepository;
import com.codearena.problem.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final StarterCodeRepository starterCodeRepository;

    /**
     * Lists PUBLISHED problems for players with optional filtering by difficulty and tag.
     */
    @Transactional(readOnly = true)
    public Page<ProblemSummaryResponse> listPublishedProblems(ProblemDifficulty difficulty, String tag, Pageable pageable) {
        Page<Problem> problems;

        boolean hasDifficulty = difficulty != null;
        boolean hasTag = StringUtils.hasText(tag);

        if (hasDifficulty && hasTag) {
            problems = problemRepository.findByStatusAndDifficultyAndTag(ProblemStatus.PUBLISHED, difficulty, tag.trim(), pageable);
        } else if (hasDifficulty) {
            problems = problemRepository.findByStatusAndDifficulty(ProblemStatus.PUBLISHED, difficulty, pageable);
        } else if (hasTag) {
            problems = problemRepository.findByStatusAndTag(ProblemStatus.PUBLISHED, tag.trim(), pageable);
        } else {
            problems = problemRepository.findByStatus(ProblemStatus.PUBLISHED, pageable);
        }

        return problems.map(this::toSummaryResponse);
    }

    /**
     * Retrieves full problem details for a player by slug.
     * Guaranteed: ONLY sample test cases are returned. Hidden test cases are NEVER returned.
     */
    @Transactional(readOnly = true)
    public ProblemDetailResponse getPublishedProblemBySlug(String slug) {
        Problem problem = problemRepository.findBySlug(slug)
                .filter(p -> p.getStatus() == ProblemStatus.PUBLISHED)
                .orElseThrow(() -> new ProblemNotFoundException("Published problem not found with slug: " + slug));

        List<StarterCodeDto> starterCodes = starterCodeRepository.findByProblemId(problem.getId())
                .stream()
                .map(sc -> StarterCodeDto.builder()
                        .language(sc.getLanguage())
                        .templateCode(sc.getTemplateCode())
                        .build())
                .toList();

        // Security rule: Only fetch sample test cases. Never load or leak hidden cases to players!
        List<SampleTestCaseDto> sampleTestCases = testCaseRepository
                .findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(problem.getId())
                .stream()
                .map(this::toSampleTestCaseDto)
                .toList();

        return ProblemDetailResponse.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .statementMarkdown(problem.getStatementMarkdown())
                .difficulty(problem.getDifficulty())
                .tags(problem.getTags())
                .timeLimitMs(problem.getTimeLimitMs())
                .memoryLimitMb(problem.getMemoryLimitMb())
                .points(problem.getPoints())
                .starterCodes(starterCodes)
                .sampleTestCases(sampleTestCases)
                .build();
    }

    private ProblemSummaryResponse toSummaryResponse(Problem problem) {
        return ProblemSummaryResponse.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .difficulty(problem.getDifficulty())
                .tags(problem.getTags())
                .timeLimitMs(problem.getTimeLimitMs())
                .memoryLimitMb(problem.getMemoryLimitMb())
                .points(problem.getPoints())
                .build();
    }

    private SampleTestCaseDto toSampleTestCaseDto(TestCase tc) {
        return SampleTestCaseDto.builder()
                .id(tc.getId())
                .input(tc.getInput())
                .expectedOutput(tc.getExpectedOutput())
                .orderIndex(tc.getOrderIndex())
                .build();
    }
}


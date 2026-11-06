package com.codearena.problem.service;

import com.codearena.problem.domain.*;
import com.codearena.problem.dto.*;
import com.codearena.problem.exception.DuplicateProblemException;
import com.codearena.problem.exception.ProblemNotFoundException;
import com.codearena.problem.exception.ProblemPublishValidationException;
import com.codearena.problem.exception.TestCaseNotFoundException;
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

import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProblemService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final StarterCodeRepository starterCodeRepository;

    @Transactional
    public AdminProblemResponse createProblem(CreateProblemRequest request, UUID adminUserId) {
        String slug = request.getSlug();
        if (!StringUtils.hasText(slug)) {
            slug = toSlug(request.getTitle());
        } else {
            slug = slug.trim().toLowerCase(Locale.ROOT);
        }

        if (problemRepository.existsBySlug(slug)) {
            throw new DuplicateProblemException("Problem with slug '" + slug + "' already exists");
        }

        Problem problem = Problem.builder()
                .title(request.getTitle().trim())
                .slug(slug)
                .statementMarkdown(request.getStatementMarkdown().trim())
                .difficulty(request.getDifficulty())
                .tags(request.getTags() != null ? new HashSet<>(request.getTags()) : new HashSet<>())
                .timeLimitMs(request.getTimeLimitMs())
                .memoryLimitMb(request.getMemoryLimitMb())
                .points(request.getPoints())
                .createdBy(adminUserId)
                .status(ProblemStatus.DRAFT)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Problem saved = problemRepository.save(problem);

        if (request.getStarterCodes() != null) {
            for (StarterCodeDto scDto : request.getStarterCodes()) {
                StarterCode sc = StarterCode.builder()
                        .problemId(saved.getId())
                        .language(scDto.getLanguage())
                        .templateCode(scDto.getTemplateCode())
                        .build();
                starterCodeRepository.save(sc);
            }
        }

        log.info("Admin {} created problem '{}' (id: {}, slug: {}) in DRAFT status",
                adminUserId, saved.getTitle(), saved.getId(), saved.getSlug());

        return toAdminResponse(saved);
    }

    @Transactional
    public AdminProblemResponse updateProblem(UUID problemId, UpdateProblemRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + problemId));

        problem.setTitle(request.getTitle().trim());
        problem.setStatementMarkdown(request.getStatementMarkdown().trim());
        problem.setDifficulty(request.getDifficulty());
        if (request.getTags() != null) {
            problem.setTags(new HashSet<>(request.getTags()));
        }
        problem.setTimeLimitMs(request.getTimeLimitMs());
        problem.setMemoryLimitMb(request.getMemoryLimitMb());
        problem.setPoints(request.getPoints());
        problem.setUpdatedAt(Instant.now());

        Problem updated = problemRepository.save(problem);
        log.info("Problem {} updated by admin", problemId);
        return toAdminResponse(updated);
    }

    /**
     * Publishes a problem.
     * Enforces the rule: Must have at least 1 sample case and at least 3 total cases.
     */
    @Transactional
    public AdminProblemResponse publishProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + problemId));

        long sampleCount = testCaseRepository.countByProblemIdAndIsSampleTrue(problemId);
        long totalCount = testCaseRepository.countByProblemId(problemId);

        if (sampleCount < 1) {
            throw new ProblemPublishValidationException(
                    "Cannot publish problem: Must have at least 1 sample test case (found " + sampleCount + ")");
        }

        if (totalCount < 3) {
            throw new ProblemPublishValidationException(
                    "Cannot publish problem: Must have at least 3 total test cases (found " + totalCount + ")");
        }

        problem.setStatus(ProblemStatus.PUBLISHED);
        problem.setUpdatedAt(Instant.now());
        Problem published = problemRepository.save(problem);

        log.info("Problem '{}' ({}) published successfully with {} sample and {} total test cases",
                published.getTitle(), published.getId(), sampleCount, totalCount);

        return toAdminResponse(published);
    }

    @Transactional
    public void deleteProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + problemId));

        testCaseRepository.deleteByProblemId(problemId);
        starterCodeRepository.deleteByProblemId(problemId);
        problemRepository.delete(problem);

        log.info("Problem '{}' ({}) deleted by admin", problem.getTitle(), problemId);
    }

    @Transactional
    public AdminTestCaseResponse addTestCase(UUID problemId, CreateTestCaseRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + problemId));

        TestCase testCase = TestCase.builder()
                .problemId(problem.getId())
                .input(request.getInput())
                .expectedOutput(request.getExpectedOutput())
                .isSample(Boolean.TRUE.equals(request.getIsSample()))
                .orderIndex(request.getOrderIndex())
                .build();

        TestCase saved = testCaseRepository.save(testCase);
        log.info("Added testcase (sample={}) to problem {}", saved.isSample(), problemId);
        return toAdminTestCaseResponse(saved);
    }

    @Transactional
    public AdminTestCaseResponse updateTestCase(UUID problemId, UUID testCaseId, UpdateTestCaseRequest request) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new TestCaseNotFoundException("TestCase not found with ID: " + testCaseId));

        if (!testCase.getProblemId().equals(problemId)) {
            throw new TestCaseNotFoundException("TestCase does not belong to problem ID: " + problemId);
        }

        testCase.setInput(request.getInput());
        testCase.setExpectedOutput(request.getExpectedOutput());
        testCase.setSample(Boolean.TRUE.equals(request.getIsSample()));
        testCase.setOrderIndex(request.getOrderIndex());

        TestCase updated = testCaseRepository.save(testCase);
        log.info("Updated testcase {} for problem {}", testCaseId, problemId);
        return toAdminTestCaseResponse(updated);
    }

    @Transactional
    public void deleteTestCase(UUID problemId, UUID testCaseId) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new TestCaseNotFoundException("TestCase not found with ID: " + testCaseId));

        if (!testCase.getProblemId().equals(problemId)) {
            throw new TestCaseNotFoundException("TestCase does not belong to problem ID: " + problemId);
        }

        testCaseRepository.delete(testCase);
        log.info("Deleted testcase {} from problem {}", testCaseId, problemId);
    }

    @Transactional
    public StarterCodeDto upsertStarterCode(UUID problemId, StarterCodeDto request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + problemId));

        StarterCode starterCode = starterCodeRepository.findByProblemIdAndLanguage(problem.getId(), request.getLanguage())
                .orElseGet(() -> StarterCode.builder()
                        .problemId(problem.getId())
                        .language(request.getLanguage())
                        .build());

        starterCode.setTemplateCode(request.getTemplateCode());
        StarterCode saved = starterCodeRepository.save(starterCode);

        log.info("Upserted starter code for problem {} language {}", problemId, request.getLanguage());
        return StarterCodeDto.builder()
                .language(saved.getLanguage())
                .templateCode(saved.getTemplateCode())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminProblemResponse getAdminProblem(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + problemId));
        return toAdminResponse(problem);
    }

    @Transactional(readOnly = true)
    public Page<AdminProblemResponse> listAdminProblems(Pageable pageable) {
        return problemRepository.findAll(pageable).map(this::toAdminResponse);
    }

    @Transactional(readOnly = true)
    public List<AdminTestCaseResponse> listAdminTestCases(UUID problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new ProblemNotFoundException("Problem not found with ID: " + problemId);
        }
        return testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problemId)
                .stream()
                .map(this::toAdminTestCaseResponse)
                .toList();
    }

    private AdminProblemResponse toAdminResponse(Problem p) {
        List<StarterCodeDto> starterCodes = starterCodeRepository.findByProblemId(p.getId())
                .stream()
                .map(sc -> StarterCodeDto.builder()
                        .language(sc.getLanguage())
                        .templateCode(sc.getTemplateCode())
                        .build())
                .toList();

        long sampleCount = testCaseRepository.countByProblemIdAndIsSampleTrue(p.getId());
        long totalCount = testCaseRepository.countByProblemId(p.getId());

        return AdminProblemResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .slug(p.getSlug())
                .statementMarkdown(p.getStatementMarkdown())
                .difficulty(p.getDifficulty())
                .tags(p.getTags())
                .timeLimitMs(p.getTimeLimitMs())
                .memoryLimitMb(p.getMemoryLimitMb())
                .points(p.getPoints())
                .createdBy(p.getCreatedBy())
                .status(p.getStatus())
                .starterCodes(starterCodes)
                .sampleTestCasesCount(sampleCount)
                .totalTestCasesCount(totalCount)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private AdminTestCaseResponse toAdminTestCaseResponse(TestCase tc) {
        return AdminTestCaseResponse.builder()
                .id(tc.getId())
                .problemId(tc.getProblemId())
                .input(tc.getInput())
                .expectedOutput(tc.getExpectedOutput())
                .isSample(tc.isSample())
                .orderIndex(tc.getOrderIndex())
                .build();
    }

    private String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input.trim().toLowerCase(Locale.ROOT)).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        slug = slug.replaceAll("-+", "-");
        return slug.replaceAll("^-|-$", "");
    }
}


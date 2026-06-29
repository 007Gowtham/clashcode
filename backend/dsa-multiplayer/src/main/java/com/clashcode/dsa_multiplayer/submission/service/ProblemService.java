package com.clashcode.dsa_multiplayer.submission.service;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.auth.entity.UserRole;
import com.clashcode.dsa_multiplayer.common.exception.ApiException;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemCreateRequest;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemResponse;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemUpdateRequest;
import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import com.clashcode.dsa_multiplayer.submission.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepo;

    // ── Admin: Create ─────────────────────────────────────────────────────────

    @Transactional
    public ProblemResponse create(ProblemCreateRequest req, User admin) {
      

        Problem problem = Problem.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .difficulty(req.getDifficulty().toUpperCase())
                .tags(req.getTags() != null ? req.getTags().toArray(new String[0]) : new String[0])
                .templateCode(req.getTemplateCode())
                .testCases(toTestCaseMaps(req.getTestCases()))
                .timeLimitMs(req.getTimeLimitMs())
                .memoryLimitMb(req.getMemoryLimitMb())
                .createdBy(admin)
                .build();

        Problem saved = problemRepo.save(problem);
        log.info("Problem created: id={} title={}", saved.getId(), saved.getTitle());
        return ProblemResponse.from(saved);
    }

    // ── Admin: Update ─────────────────────────────────────────────────────────

    @Transactional
    public ProblemResponse update(UUID id, ProblemUpdateRequest req, User admin) {
        Problem problem = getOrThrow(id);

        if (req.getTitle()        != null) problem.setTitle(req.getTitle());
        if (req.getDescription()  != null) problem.setDescription(req.getDescription());
        if (req.getDifficulty()   != null) problem.setDifficulty(req.getDifficulty().toUpperCase());
        if (req.getTags()         != null) problem.setTags(req.getTags().toArray(new String[0]));
        if (req.getTemplateCode() != null) problem.setTemplateCode(req.getTemplateCode());
        if (req.getTestCases()    != null) problem.setTestCases(toTestCaseMaps(req.getTestCases()));
        if (req.getTimeLimitMs()  != null) problem.setTimeLimitMs(req.getTimeLimitMs());
        if (req.getMemoryLimitMb()!= null) problem.setMemoryLimitMb(req.getMemoryLimitMb());

        return ProblemResponse.from(problemRepo.save(problem));
    }

    // ── Admin: Delete ─────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id, User admin) {
        if (!problemRepo.existsById(id)) {
            throw new ApiException("PROBLEM_NOT_FOUND: Problem not found", HttpStatus.NOT_FOUND);
        }
        problemRepo.deleteById(id);
        log.info("Problem deleted: id={}", id);
    }

    // ── Public: Read ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProblemResponse> listAll(String difficulty) {
        List<Problem> problems = difficulty != null && !difficulty.isBlank()
                ? problemRepo.findByDifficultyIgnoreCase(difficulty)
                : problemRepo.findAll();
        return problems.stream().map(ProblemResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProblemResponse getById(UUID id) {
        return ProblemResponse.from(getOrThrow(id));
    }

    // ── Package-private: Raw entity for judge ────────────────────────────────

    @Transactional(readOnly = true)
    public Problem getEntityById(UUID id) {
        return getOrThrow(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Problem getOrThrow(UUID id) {
        return problemRepo.findById(id)
                .orElseThrow(() -> new ApiException(
                        "PROBLEM_NOT_FOUND: Problem not found", HttpStatus.NOT_FOUND));
    }

    private void requireAdmin(User user) {
        if (user == null || user.getRole() != UserRole.ADMIN) {
            throw new ApiException("FORBIDDEN: Admin access required", HttpStatus.FORBIDDEN);
        }
    }

    private List<Map<String, Object>> toTestCaseMaps(
            List<ProblemCreateRequest.TestCaseInput> inputs) {
        if (inputs == null) return List.of();
        return inputs.stream()
                .map(tc -> Map.<String, Object>of(
                        "input",          tc.getInput(),
                        "expectedOutput", tc.getExpectedOutput(),
                        "isHidden",       tc.isHidden()))
                .collect(Collectors.toList());
    }
}

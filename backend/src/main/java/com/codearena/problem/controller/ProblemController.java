package com.codearena.problem.controller;

import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.dto.ProblemDetailResponse;
import com.codearena.problem.dto.ProblemSummaryResponse;
import com.codearena.problem.service.ProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    /**
     * Lists published problems with pagination and optional difficulty and tag filters.
     */
    @GetMapping
    public ResponseEntity<Page<ProblemSummaryResponse>> listProblems(
            @RequestParam(name = "difficulty", required = false) ProblemDifficulty difficulty,
            @RequestParam(name = "tag", required = false) String tag,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(problemService.listPublishedProblems(difficulty, tag, pageable));
    }

    /**
     * Gets problem statement, limits, starter codes, and ONLY sample test cases.
     * Hidden test cases are never returned by this endpoint.
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ProblemDetailResponse> getProblemBySlug(@PathVariable("slug") String slug) {
        return ResponseEntity.ok(problemService.getPublishedProblemBySlug(slug));
    }
}


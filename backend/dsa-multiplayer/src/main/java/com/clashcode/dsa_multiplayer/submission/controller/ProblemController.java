package com.clashcode.dsa_multiplayer.submission.controller;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemCreateRequest;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemResponse;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemUpdateRequest;
import com.clashcode.dsa_multiplayer.submission.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * ProblemController — CRUD for DSA problems.
 *
 * Public (authenticated) endpoints:
 *   GET  /problems          — list all (optionally filter by difficulty)
 *   GET  /problems/{id}     — get one
 *
 * Admin-only endpoints (enforced in ProblemService, not security config):
 *   POST   /problems         — create
 *   PUT    /problems/{id}    — update
 *   DELETE /problems/{id}    — delete
 */
@RestController
@RequestMapping("/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    // ── Admin: Create ─────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<ProblemResponse>> createProblem(
            @Valid @RequestBody ProblemCreateRequest request,
            @AuthenticationPrincipal User user) {
        ProblemResponse data = problemService.create(request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Problem created successfully", data));
    }

    // ── Admin: Update ─────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemResponse>> updateProblem(
            @PathVariable UUID id,
            @Valid @RequestBody ProblemUpdateRequest request,
            @AuthenticationPrincipal User user) {
        ProblemResponse data = problemService.update(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Problem updated successfully", data));
    }

    // ── Admin: Delete ─────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProblem(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        problemService.delete(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Problem deleted successfully"));
    }

    // ── Public: List ──────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProblemResponse>>> listProblems(
            @RequestParam(required = false) String difficulty) {
        List<ProblemResponse> data = problemService.listAll(difficulty);
        return ResponseEntity.ok(ApiResponse.ok("Problems retrieved successfully", data));
    }

    // ── Public: Get by ID ─────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemResponse>> getProblem(@PathVariable UUID id) {
        ProblemResponse data = problemService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok("Problem retrieved successfully", data));
    }
}

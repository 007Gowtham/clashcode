package com.clashcode.dsa_multiplayer.submission.controller;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import com.clashcode.dsa_multiplayer.submission.dto.RunRequest;
import com.clashcode.dsa_multiplayer.submission.dto.RunResponse;
import com.clashcode.dsa_multiplayer.submission.dto.SubmissionResponse;
import com.clashcode.dsa_multiplayer.submission.dto.SubmitRequest;
import com.clashcode.dsa_multiplayer.submission.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * SubmissionController — code execution endpoints.
 *
 * POST /submissions/run     — run code against custom input (no verdict, no persistence)
 * POST /submissions/submit  — full judge: run against all test cases, save verdict
 * GET  /submissions/my      — list current user's submission history
 * GET  /submissions/{id}    — get single submission result
 */
@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    // ── Run (no judge) ────────────────────────────────────────────────────────

    @PostMapping("/run")
    public ResponseEntity<ApiResponse<RunResponse>> run(
            @Valid @RequestBody RunRequest request,
            @AuthenticationPrincipal User user) {
        RunResponse data = submissionService.run(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Code executed successfully", data));
    }

    // ── Submit (full judge) ───────────────────────────────────────────────────

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submit(
            @Valid @RequestBody SubmitRequest request,
            @AuthenticationPrincipal User user) {
        SubmissionResponse data = submissionService.submit(request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Submission received", data));
    }

    // ── History ───────────────────────────────────────────────────────────────

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> mySubmissions(
            @AuthenticationPrincipal User user) {
        List<SubmissionResponse> data = submissionService.mySubmissions(user);
        return ResponseEntity.ok(ApiResponse.ok("Submissions retrieved successfully", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmission(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        SubmissionResponse data = submissionService.getById(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Submission retrieved successfully", data));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissionsByRoom(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User user) {
        List<SubmissionResponse> data = submissionService.submissionsByRoom(roomId, user);
        return ResponseEntity.ok(ApiResponse.ok("Room submissions retrieved successfully", data));
    }
}

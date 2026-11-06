package com.codearena.problem.controller;

import com.codearena.auth.security.UserPrincipal;
import com.codearena.problem.dto.*;
import com.codearena.problem.service.AdminProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/admin/problems")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProblemController {

    private final AdminProblemService adminProblemService;

    @PostMapping
    public ResponseEntity<AdminProblemResponse> createProblem(
            @Valid @RequestBody CreateProblemRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        AdminProblemResponse response = adminProblemService.createProblem(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<AdminProblemResponse>> listProblems(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminProblemService.listAdminProblems(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminProblemResponse> getProblem(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(adminProblemService.getAdminProblem(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminProblemResponse> updateProblem(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateProblemRequest request) {
        return ResponseEntity.ok(adminProblemService.updateProblem(id, request));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<AdminProblemResponse> publishProblem(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(adminProblemService.publishProblem(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable("id") UUID id) {
        adminProblemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/testcases")
    public ResponseEntity<AdminTestCaseResponse> addTestCase(
            @PathVariable("id") UUID id,
            @Valid @RequestBody CreateTestCaseRequest request) {
        AdminTestCaseResponse response = adminProblemService.addTestCase(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/testcases")
    public ResponseEntity<List<AdminTestCaseResponse>> listTestCases(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(adminProblemService.listAdminTestCases(id));
    }

    @PutMapping("/{id}/testcases/{testCaseId}")
    public ResponseEntity<AdminTestCaseResponse> updateTestCase(
            @PathVariable("id") UUID id,
            @PathVariable("testCaseId") UUID testCaseId,
            @Valid @RequestBody UpdateTestCaseRequest request) {
        return ResponseEntity.ok(adminProblemService.updateTestCase(id, testCaseId, request));
    }

    @DeleteMapping("/{id}/testcases/{testCaseId}")
    public ResponseEntity<Void> deleteTestCase(
            @PathVariable("id") UUID id,
            @PathVariable("testCaseId") UUID testCaseId) {
        adminProblemService.deleteTestCase(id, testCaseId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/starter-codes")
    public ResponseEntity<StarterCodeDto> upsertStarterCode(
            @PathVariable("id") UUID id,
            @Valid @RequestBody StarterCodeDto request) {
        return ResponseEntity.ok(adminProblemService.upsertStarterCode(id, request));
    }
}


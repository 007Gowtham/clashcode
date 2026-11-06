package com.codearena.judge.controller;

import com.codearena.auth.entity.Role;
import com.codearena.auth.security.UserPrincipal;
import com.codearena.judge.dto.CreateSubmissionRequest;
import com.codearena.judge.dto.LeaderboardScoreDto;
import com.codearena.judge.dto.SubmissionResponse;
import com.codearena.judge.service.SubmissionService;
import com.codearena.room.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final RoomService roomService;

    /**
     * Submit code for execution (RUN or SUBMIT mode).
     * Validates and saves as PENDING, dispatches to JudgeQueue, and returns immediately.
     * Code execution NEVER happens inside this HTTP request thread.
     */
    @PostMapping
    public ResponseEntity<SubmissionResponse> submit(
            @Valid @RequestBody CreateSubmissionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SubmissionResponse response = submissionService.createSubmission(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get submission status, verdict, runtime, and sample results.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getSubmission(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isGlobalAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(submissionService.getSubmission(id, principal.getId(), isGlobalAdmin));
    }

    /**
     * Get paginated submissions for the currently logged-in player.
     */
    @GetMapping("/user/me")
    public ResponseEntity<Page<SubmissionResponse>> getMySubmissions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(submissionService.listUserSubmissions(principal.getId(), pageable));
    }

    /**
     * Get submissions for an active room contest (SUBMIT mode only).
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<Page<SubmissionResponse>> getRoomSubmissions(
            @PathVariable("roomId") String identifier,
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID actualRoomId = roomService.resolveRoom(identifier).getId();
        return ResponseEntity.ok(submissionService.listRoomSubmissions(actualRoomId, principal.getId(), pageable));
    }

    /**
     * Get current live leaderboard scores for all participants in a room contest.
     */
    @GetMapping("/room/{roomId}/leaderboard")
    public ResponseEntity<List<LeaderboardScoreDto>> getRoomLeaderboard(
            @PathVariable("roomId") String identifier,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID actualRoomId = roomService.resolveRoom(identifier).getId();
        return ResponseEntity.ok(submissionService.getRoomLeaderboard(actualRoomId));
    }
}


package com.codearena.problem.controller;

import com.codearena.auth.security.UserPrincipal;
import com.codearena.problem.dto.ContestProblemResponse;
import com.codearena.problem.dto.SelectRoomProblemsRequest;
import com.codearena.problem.service.ContestProblemService;
import com.codearena.room.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/rooms/{roomId}/problems")
@RequiredArgsConstructor
public class RoomProblemController {

    private final ContestProblemService contestProblemService;
    private final RoomService roomService;

    /**
     * Admin selects problems for a room contest.
     * Allowed only in WAITING state, and selected problems must be PUBLISHED.
     */
    @PostMapping
    public ResponseEntity<List<ContestProblemResponse>> selectProblems(
            @PathVariable("roomId") String identifier,
            @Valid @RequestBody SelectRoomProblemsRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID actualRoomId = roomService.resolveRoom(identifier).getId();
        List<ContestProblemResponse> responses =
                contestProblemService.selectProblemsForRoom(actualRoomId, request, principal.getId());
        return ResponseEntity.ok(responses);
    }

    /**
     * Retrieves contest problems for members of the room once the contest has started.
     * Guaranteed: ONLY sample test cases are returned. Hidden test cases are never returned.
     */
    @GetMapping
    public ResponseEntity<List<ContestProblemResponse>> getContestProblems(
            @PathVariable("roomId") String identifier,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID actualRoomId = roomService.resolveRoom(identifier).getId();
        List<ContestProblemResponse> responses =
                contestProblemService.getContestProblemsForRoom(actualRoomId, principal.getId());
        return ResponseEntity.ok(responses);
    }
}


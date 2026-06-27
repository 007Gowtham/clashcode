package com.clashcode.dsa_multiplayer.team.controller;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import com.clashcode.dsa_multiplayer.team.dto.CreateTeamRequest;
import com.clashcode.dsa_multiplayer.team.dto.JoinTeamRequest;
import com.clashcode.dsa_multiplayer.team.dto.TeamResponse;
import com.clashcode.dsa_multiplayer.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @Valid @RequestBody CreateTeamRequest request,
            @AuthenticationPrincipal User user) {
        TeamResponse data = teamService.createTeam(request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Team created successfully", data));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<TeamResponse>> joinTeam(
            @Valid @RequestBody JoinTeamRequest request,
            @AuthenticationPrincipal User user) {
        TeamResponse data = teamService.joinTeamByCode(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Joined team successfully", data));
    }

    @PatchMapping("/{id}/ready")
    public ResponseEntity<ApiResponse<TeamResponse>> toggleReady(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        TeamResponse data = teamService.toggleReady(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Ready status updated", data));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveTeam(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        teamService.leaveTeam(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Left team successfully"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<TeamResponse>> kickMember(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @AuthenticationPrincipal User user) {
        TeamResponse data = teamService.kickMember(id, userId, user);
        return ResponseEntity.ok(ApiResponse.ok("Member kicked successfully", data));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeamsInRoom(@PathVariable UUID roomId) {
        List<TeamResponse> data = teamService.getTeamsInRoom(roomId);
        return ResponseEntity.ok(ApiResponse.ok("Teams retrieved successfully", data));
    }
}

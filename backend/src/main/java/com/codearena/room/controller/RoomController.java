package com.codearena.room.controller;

import com.codearena.auth.dto.MessageResponse;
import com.codearena.auth.security.UserPrincipal;
import com.codearena.room.dto.*;
import com.codearena.room.service.RoomService;
import com.codearena.room.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/rooms", "/rooms"})
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final TeamService teamService;

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<AvailableRoomDto>> getAvailableRooms(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return ResponseEntity.ok(roomService.getAvailableRooms(pageable));
    }

    @PostMapping
    public ResponseEntity<RoomSnapshotDto> createRoom(@Valid @RequestBody CreateRoomRequest request,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        RoomSnapshotDto snapshot = roomService.createRoom(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(snapshot);
    }

    @PostMapping("/join")
    public ResponseEntity<RoomSnapshotDto> joinRoom(@Valid @RequestBody JoinRoomRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        RoomSnapshotDto snapshot = roomService.joinRoom(request, principal.getId());
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/active")
    public ResponseEntity<com.codearena.room.dto.ActiveRoomDto> getActiveRoom(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.ok(com.codearena.room.dto.ActiveRoomDto.builder().hasActiveRoom(false).build());
        }
        return ResponseEntity.ok(roomService.getActiveRoomForUser(principal.getId()));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<RoomSnapshotDto> getRoomSnapshot(@PathVariable("identifier") String identifier,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        UUID viewerId = (principal != null) ? principal.getId() : null;
        RoomSnapshotDto snapshot = roomService.getRoomSnapshot(identifier, viewerId);
        return ResponseEntity.ok(snapshot);
    }

    @PostMapping("/{identifier}/leave")
    public ResponseEntity<MessageResponse> leaveRoom(@PathVariable("identifier") String identifier,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        roomService.leaveRoom(identifier, principal.getId());
        return ResponseEntity.ok(new MessageResponse("Successfully left the room"));
    }

    @PostMapping("/{identifier}/start")
    public ResponseEntity<RoomSnapshotDto> startRoom(@PathVariable("identifier") String identifier,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        RoomSnapshotDto snapshot = roomService.startRoom(identifier, principal.getId());
        return ResponseEntity.ok(snapshot);
    }

    @PostMapping("/{identifier}/close")
    public ResponseEntity<MessageResponse> closeRoom(@PathVariable("identifier") String identifier,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        roomService.closeRoom(identifier, principal.getId());
        return ResponseEntity.ok(new MessageResponse("Room successfully closed"));
    }

    @PostMapping("/{identifier}/teams")
    public ResponseEntity<TeamDto> createTeam(@PathVariable("identifier") String identifier,
                                              @Valid @RequestBody CreateTeamRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        TeamDto team = teamService.createTeam(identifier, request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(team);
    }

    @PostMapping("/{identifier}/teams/join")
    public ResponseEntity<TeamDto> joinTeam(@PathVariable("identifier") String identifier,
                                            @Valid @RequestBody JoinTeamRequest request,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        TeamDto team = teamService.joinTeam(identifier, request, principal.getId());
        return ResponseEntity.ok(team);
    }

    @PostMapping("/{identifier}/teams/{teamId}/leave")
    public ResponseEntity<MessageResponse> leaveTeam(@PathVariable("identifier") String identifier,
                                                     @PathVariable("teamId") UUID teamId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        teamService.leaveTeam(identifier, teamId, principal.getId());
        return ResponseEntity.ok(new MessageResponse("Successfully left the team"));
    }

    @DeleteMapping("/{identifier}/teams/{teamId}")
    public ResponseEntity<MessageResponse> deleteTeam(@PathVariable("identifier") String identifier,
                                                      @PathVariable("teamId") UUID teamId,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        teamService.deleteTeam(identifier, teamId, principal.getId());
        return ResponseEntity.ok(new MessageResponse("Team successfully dissolved"));
    }

    @PostMapping("/{identifier}/teams/{teamId}/kick/{userId}")
    public ResponseEntity<MessageResponse> kickTeamMember(@PathVariable("identifier") String identifier,
                                                          @PathVariable("teamId") UUID teamId,
                                                          @PathVariable("userId") UUID userId,
                                                          @AuthenticationPrincipal UserPrincipal principal) {
        teamService.kickTeamMember(identifier, teamId, userId, principal.getId());
        return ResponseEntity.ok(new MessageResponse("Team member successfully kicked"));
    }

    @PostMapping("/{identifier}/kick/{userId}")
    public ResponseEntity<MessageResponse> kickUser(@PathVariable("identifier") String identifier,
                                                    @PathVariable("userId") UUID userId,
                                                    @RequestBody(required = false) KickRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        String reason = (request != null) ? request.getReason() : null;
        roomService.kickUser(identifier, userId, principal.getId(), reason);
        return ResponseEntity.ok(new MessageResponse("User successfully kicked from room"));
    }
}

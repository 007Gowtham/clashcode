package com.clashcode.dsa_multiplayer.room.controller;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import com.clashcode.dsa_multiplayer.common.response.ApiResponse;
import com.clashcode.dsa_multiplayer.room.dto.CreateRoomRequest;
import com.clashcode.dsa_multiplayer.room.dto.JoinRoomRequest;
import com.clashcode.dsa_multiplayer.room.dto.RoomResponse;
import com.clashcode.dsa_multiplayer.room.service.RoomService;
import com.clashcode.dsa_multiplayer.submission.dto.ProblemResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal User user) {
        RoomResponse data = roomService.createRoom(request, user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created("Room created successfully", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> listRooms() {
        List<RoomResponse> data = roomService.listActiveRooms();
        return ResponseEntity.ok(ApiResponse.ok("Active rooms retrieved successfully", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable UUID id) {
        RoomResponse data = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.ok("Room details retrieved successfully", data));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<RoomResponse>> joinRoom(
            @Valid @RequestBody JoinRoomRequest request,
            @AuthenticationPrincipal User user) {
        RoomResponse data = roomService.joinRoom(request, user);
        return ResponseEntity.ok(ApiResponse.ok("Joined room successfully", data));
    }

    @PostMapping("/leave")
    public ResponseEntity<ApiResponse<Void>> leaveRoom(@AuthenticationPrincipal User user) {
        roomService.leaveRoom(user);
        return ResponseEntity.ok(ApiResponse.ok("Left room successfully"));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<RoomResponse>> startContest(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        RoomResponse data = roomService.startContest(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Contest started successfully", data));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<ApiResponse<RoomResponse>> endContest(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        RoomResponse data = roomService.endContest(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Contest ended successfully", data));
    }

    @GetMapping("/{id}/refresh")
    public ResponseEntity<ApiResponse<RoomResponse>> refreshRoom(@PathVariable UUID id) {
        RoomResponse data = roomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.ok("Room refreshed successfully", data));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoomQuestions(
            @PathVariable UUID id) {
        Map<String, Object> data = roomService.getRoomQuestions(id);
        return ResponseEntity.ok(ApiResponse.ok("Questions retrieved successfully", data));
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoomLeaderboard(
            @PathVariable UUID id) {
        List<Map<String, Object>> data = roomService.getRoomLeaderboard(id);
        return ResponseEntity.ok(ApiResponse.ok("Leaderboard retrieved successfully", data));
    }
}

package com.clashcode.dsa_multiplayer.room.dto;

import com.clashcode.dsa_multiplayer.room.entity.RoomStatus;
import com.clashcode.dsa_multiplayer.team.dto.TeamResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID adminId;
    private String adminUsername;
    private RoomStatus status;
    private String difficulty;
    private int questionsPerUser;
    private int maxTeamSize;
    private int timeLimitMinutes;
    private Instant startTime;
    private Instant endTime;
    private List<MemberResponse> members;
    private List<TeamResponse> teams;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberResponse {
        private UUID id;
        private String username;
        private String email;
    }
}

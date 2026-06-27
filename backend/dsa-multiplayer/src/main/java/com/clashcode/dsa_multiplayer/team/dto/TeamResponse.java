package com.clashcode.dsa_multiplayer.team.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {
    private UUID id;
    private String code;
    private String name;
    private UUID roomId;
    private UUID leaderId;
    private String leaderUsername;
    private int score;
    private int maxSize;
    @com.fasterxml.jackson.annotation.JsonProperty("isReady")
    private boolean isReady;
    private List<TeamMemberResponse> members;
}

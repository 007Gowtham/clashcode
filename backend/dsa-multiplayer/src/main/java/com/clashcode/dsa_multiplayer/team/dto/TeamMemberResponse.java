package com.clashcode.dsa_multiplayer.team.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberResponse {
    private UUID userId;
    private String username;
    @com.fasterxml.jackson.annotation.JsonProperty("isReady")
    private boolean isReady;
}

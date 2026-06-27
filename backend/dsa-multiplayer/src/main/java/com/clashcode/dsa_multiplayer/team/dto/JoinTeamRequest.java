package com.clashcode.dsa_multiplayer.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JoinTeamRequest {
    @NotBlank(message = "Team code is required")
    @Size(min = 6, max = 6, message = "Team code must be exactly 6 characters")
    private String code;
}

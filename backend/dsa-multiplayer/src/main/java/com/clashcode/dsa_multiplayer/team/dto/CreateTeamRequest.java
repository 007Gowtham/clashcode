package com.clashcode.dsa_multiplayer.team.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateTeamRequest {
    @NotBlank(message = "Team name is required")
    @Size(min = 3, max = 50, message = "Team name must be between 3 and 50 characters")
    private String name;

    @NotNull(message = "Room ID is required")
    private UUID roomId;

    @Min(value = 1, message = "Max size must be at least 1")
    private int maxSize = 4;
}

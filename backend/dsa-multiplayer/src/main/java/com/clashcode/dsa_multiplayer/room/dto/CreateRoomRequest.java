package com.clashcode.dsa_multiplayer.room.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRoomRequest {
    @NotBlank(message = "Room name is required")
    @Size(min = 3, max = 50, message = "Room name must be between 3 and 50 characters")
    private String name;

    @NotBlank(message = "Difficulty is required")
    private String difficulty;

    @Min(value = 5, message = "Time limit must be at least 5 minutes")
    private int timeLimitMinutes = 60;

    @Min(value = 1, message = "Must have at least 1 question per user")
    private int questionsPerUser = 3;

    @Min(value = 1, message = "Max team size must be at least 1")
    private int maxTeamSize = 4;
}

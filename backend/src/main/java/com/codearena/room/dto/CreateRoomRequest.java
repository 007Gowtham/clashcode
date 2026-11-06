package com.codearena.room.dto;

import com.codearena.room.domain.RoomMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {

    @NotBlank(message = "Room name is required")
    @Size(min = 3, max = 40, message = "Room name must be between 3 and 40 characters")
    private String roomName;

    @NotNull(message = "Room mode (SOLO or TEAM) is required")
    private RoomMode mode;

    @Min(value = 2, message = "Max teams must be at least 2")
    @Max(value = 25, message = "Max teams cannot exceed 25")
    private Integer maxTeams;

    @Min(value = 2, message = "Max players must be at least 2")
    @Max(value = 100, message = "Max players cannot exceed 100")
    private Integer maxPlayers;

    @Min(value = 5, message = "Duration must be at least 5 minutes")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    @Builder.Default
    private Integer durationMinutes = 30;
}

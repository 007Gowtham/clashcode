package com.codearena.room.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRoomRequest {

    @NotBlank(message = "Room code is required")
    @Size(min = 4, max = 12, message = "Room code must be between 4 and 12 characters")
    @JsonAlias({"code", "room_code"})
    private String roomCode;
}

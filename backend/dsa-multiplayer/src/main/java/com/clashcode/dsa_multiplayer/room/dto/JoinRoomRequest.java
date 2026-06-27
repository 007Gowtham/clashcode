package com.clashcode.dsa_multiplayer.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class JoinRoomRequest {
    @NotBlank(message = "Room code is required")
    @Size(min = 6, max = 6, message = "Room code must be exactly 6 characters")
    private String code;
}

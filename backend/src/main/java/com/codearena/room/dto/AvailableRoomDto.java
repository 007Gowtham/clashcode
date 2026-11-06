package com.codearena.room.dto;

import com.codearena.room.domain.RoomMode;
import com.codearena.room.domain.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableRoomDto {
    private UUID id;
    private String roomName;
    private RoomMode mode;
    private String adminUsername;
    private int currentPlayers;
    private int maxPlayers;
    private RoomStatus status;
    private Instant createdAt;
}


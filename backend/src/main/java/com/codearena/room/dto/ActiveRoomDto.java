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
public class ActiveRoomDto {
    private boolean hasActiveRoom;
    private UUID roomId;
    private String roomCode;
    private String roomName;
    private RoomMode mode;
    private RoomStatus status;
    private Instant startedAt;
    private Instant endsAt;
    private String route;
}


package com.codearena.room.dto;

import com.codearena.room.domain.Room;
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
public class RoomDto {
    private UUID id;
    private String roomCode;
    private String roomName;
    private UUID adminId;
    private UUID adminUserId;
    private RoomMode mode;
    private RoomStatus status;
    private int maxPlayers;
    private Integer maxTeams;
    private int durationMinutes;
    private Instant startedAt;
    private Instant endsAt;
    private Long version;
    private Instant createdAt;
    private Instant updatedAt;

    public static RoomDto fromEntity(Room room) {
        return RoomDto.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .adminId(room.getAdminId())
                .adminUserId(room.getAdminId())
                .mode(room.getMode())
                .status(room.getStatus())
                .maxPlayers(room.getMaxPlayers())
                .maxTeams(room.getMaxTeams())
                .durationMinutes(room.getDurationMinutes())
                .startedAt(room.getStartedAt())
                .endsAt(room.getEndsAt())
                .version(room.getVersion())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}

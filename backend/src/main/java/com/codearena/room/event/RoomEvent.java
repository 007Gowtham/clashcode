package com.codearena.room.event;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomEvent {

    private RoomEventType type;
    private UUID roomId;
    private String roomCode;
    private Long version;

    @Builder.Default
    private Instant timestamp = Instant.now();

    private Object data;

    /**
     * Optional user ID for targeted private notifications (e.g., KICKED, DISQUALIFIED).
     */
    private UUID targetUserId;
}


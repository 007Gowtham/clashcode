package com.codearena.room.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rooms", indexes = {
        @Index(name = "idx_rooms_room_code", columnList = "room_code", unique = true),
        @Index(name = "idx_rooms_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    public static final int FIXED_TEAM_SIZE = 4;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "room_code", nullable = false, unique = true, length = 12)
    private String roomCode;

    @Column(name = "room_name", nullable = false, length = 40)
    private String roomName;

    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 20)
    private RoomMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RoomStatus status;

    @Column(name = "max_players", nullable = false)
    private int maxPlayers;

    @Column(name = "max_teams")
    private Integer maxTeams;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        this.updatedAt = this.createdAt;
        if (this.status == null) {
            this.status = RoomStatus.WAITING;
        }
        if (this.version == null) {
            this.version = 1L;
        }
        if (this.durationMinutes <= 0) {
            this.durationMinutes = 30;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}

package com.codearena.room.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "kicked_users", indexes = {
        @Index(name = "idx_kicked_users_room", columnList = "room_id"),
        @Index(name = "idx_kicked_users_user", columnList = "user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_kicked_user_room_user", columnNames = {"room_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KickedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "kicked_by", nullable = false)
    private UUID kickedBy;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "kicked_at", nullable = false, updatable = false)
    private Instant kickedAt;

    @PrePersist
    protected void onCreate() {
        if (this.kickedAt == null) {
            this.kickedAt = Instant.now();
        }
    }
}


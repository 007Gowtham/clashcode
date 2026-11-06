package com.codearena.room.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "teams", indexes = {
        @Index(name = "idx_teams_room_id", columnList = "room_id"),
        @Index(name = "idx_teams_code", columnList = "code")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_teams_room_code", columnNames = {"room_id", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "code", nullable = false, length = 12)
    private String code;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "leader_id", nullable = false)
    private UUID leaderId;

    @Column(name = "member_count", nullable = false)
    private int memberCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.memberCount < 1) {
            this.memberCount = 1;
        }
    }
}


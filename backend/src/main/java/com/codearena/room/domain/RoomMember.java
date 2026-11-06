package com.codearena.room.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_members", indexes = {
        @Index(name = "idx_room_members_room", columnList = "room_id"),
        @Index(name = "idx_room_members_team", columnList = "team_id"),
        @Index(name = "idx_room_members_user", columnList = "user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_room_member_room_user", columnNames = {"room_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "team_id")
    private UUID teamId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private MemberRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private MemberStatus status;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @PrePersist
    protected void onCreate() {
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
        }
        if (this.status == null) {
            this.status = MemberStatus.ACTIVE;
        }
        if (this.role == null) {
            this.role = MemberRole.MEMBER;
        }
    }
}


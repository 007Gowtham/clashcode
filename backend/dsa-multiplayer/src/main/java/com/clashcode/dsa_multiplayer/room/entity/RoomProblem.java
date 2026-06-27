package com.clashcode.dsa_multiplayer.room.entity;

import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Join table linking a Room to the Problems assigned for that match.
 * Created when the room admin calls POST /rooms/{id}/start.
 */
@Entity
@Table(name = "room_problems",
       uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "problem_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    private int position;
}

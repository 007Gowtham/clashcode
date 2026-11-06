package com.codearena.problem.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "contest_problems", indexes = {
        @Index(name = "idx_contest_problems_room_id", columnList = "room_id"),
        @Index(name = "idx_contest_problems_problem_id", columnList = "problem_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_contest_problem_room_problem", columnNames = {"room_id", "problem_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContestProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "problem_id", nullable = false)
    private UUID problemId;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private int orderIndex = 0;

    @Column(name = "points", nullable = false)
    @Builder.Default
    private int points = 100;

    /**
     * Freezing fields: When a contest starts, problems are snapshotted so editing
     * the catalog problem mid-contest does not affect the active contest.
     */
    @Column(name = "is_frozen", nullable = false)
    @Builder.Default
    private boolean isFrozen = false;

    @Column(name = "frozen_title", length = 255)
    private String frozenTitle;

    @Column(name = "frozen_slug", length = 255)
    private String frozenSlug;

    @Column(name = "frozen_statement_markdown", columnDefinition = "TEXT")
    private String frozenStatementMarkdown;

    @Column(name = "frozen_difficulty", length = 20)
    private String frozenDifficulty;

    @Column(name = "frozen_time_limit_ms")
    private Integer frozenTimeLimitMs;

    @Column(name = "frozen_memory_limit_mb")
    private Integer frozenMemoryLimitMb;

    @Column(name = "frozen_starter_codes_json", columnDefinition = "TEXT")
    private String frozenStarterCodesJson;

    @Column(name = "frozen_sample_cases_json", columnDefinition = "TEXT")
    private String frozenSampleCasesJson;
}


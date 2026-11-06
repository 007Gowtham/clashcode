package com.codearena.judge.domain;

import com.codearena.problem.domain.ProgrammingLanguage;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions", indexes = {
        @Index(name = "idx_submissions_user_id", columnList = "user_id"),
        @Index(name = "idx_submissions_room_id", columnList = "room_id"),
        @Index(name = "idx_submissions_problem_id", columnList = "problem_id"),
        @Index(name = "idx_submissions_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "room_id")
    private UUID roomId;

    @Column(name = "problem_id", nullable = false)
    private UUID problemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "language", nullable = false, length = 20)
    private ProgrammingLanguage language;

    @Column(name = "source_code", nullable = false, columnDefinition = "TEXT")
    private String sourceCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 20)
    private SubmissionMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "verdict", length = 30)
    private Verdict verdict;

    @Column(name = "score", nullable = false)
    @Builder.Default
    private int score = 0;

    @Column(name = "runtime_ms", nullable = false)
    @Builder.Default
    private long runtimeMs = 0L;

    @Column(name = "memory_kb", nullable = false)
    @Builder.Default
    private long memoryKb = 0L;

    @Column(name = "compiler_output", columnDefinition = "TEXT")
    private String compilerOutput;

    @Column(name = "failed_case_index")
    private Integer failedCaseIndex;

    /**
     * In RUN mode: stores serialized sample test case outputs (visible to player).
     */
    @Column(name = "sample_results_json", columnDefinition = "TEXT")
    private String sampleResultsJson;

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
            this.status = SubmissionStatus.PENDING;
        }
        if (this.mode == null) {
            this.mode = SubmissionMode.SUBMIT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}


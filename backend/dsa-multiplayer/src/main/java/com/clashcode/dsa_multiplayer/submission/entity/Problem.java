package com.clashcode.dsa_multiplayer.submission.entity;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "problems")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** EASY | MEDIUM | HARD */
    @Column(nullable = false, length = 10)
    private String difficulty;

    /** PostgreSQL text[] — stored as native array */
    @Column(columnDefinition = "text[]")
    private String[] tags;

    /**
     * Per-language starter code.
     * Shape: { "java": "class Main {...}", "python": "def solve():..." }
     * Stored as JSONB.
     */
    @Column(name = "template_code", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private Map<String, String> templateCode;

    /**
     * List of test cases.
     * Shape: [{ "input": "1 2", "expectedOutput": "3", "isHidden": false }]
     * Stored as JSONB.
     */
    @Column(name = "test_cases", nullable = false, columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private List<Map<String, Object>> testCases;

    @Builder.Default
    @Column(name = "time_limit_ms", nullable = false)
    private int timeLimitMs = 2000;

    @Builder.Default
    @Column(name = "memory_limit_mb", nullable = false)
    private int memoryLimitMb = 256;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

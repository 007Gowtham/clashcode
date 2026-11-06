package com.codearena.problem.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "test_cases", indexes = {
        @Index(name = "idx_test_cases_problem_id", columnList = "problem_id"),
        @Index(name = "idx_test_cases_problem_sample", columnList = "problem_id, is_sample")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "problem_id", nullable = false)
    private UUID problemId;

    @Column(name = "input_text", nullable = false, columnDefinition = "TEXT")
    private String input;

    @Column(name = "expected_output", nullable = false, columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(name = "is_sample", nullable = false)
    private boolean isSample;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private int orderIndex = 0;
}


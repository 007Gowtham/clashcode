package com.codearena.problem.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "starter_codes", indexes = {
        @Index(name = "idx_starter_codes_problem_id", columnList = "problem_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_starter_code_problem_lang", columnNames = {"problem_id", "language"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StarterCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "problem_id", nullable = false)
    private UUID problemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "language", nullable = false, length = 20)
    private ProgrammingLanguage language;

    @Column(name = "template_code", nullable = false, columnDefinition = "TEXT")
    private String templateCode;
}


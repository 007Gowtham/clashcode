package com.codearena.problem.repository;

import com.codearena.problem.domain.Problem;
import com.codearena.problem.domain.ProblemDifficulty;
import com.codearena.problem.domain.ProblemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {

    Optional<Problem> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Problem> findByStatus(ProblemStatus status, Pageable pageable);

    Page<Problem> findByStatusAndDifficulty(ProblemStatus status, ProblemDifficulty difficulty, Pageable pageable);

    @Query("SELECT p FROM Problem p JOIN p.tags t WHERE p.status = :status AND LOWER(t) = LOWER(:tag)")
    Page<Problem> findByStatusAndTag(@Param("status") ProblemStatus status, @Param("tag") String tag, Pageable pageable);

    @Query("SELECT p FROM Problem p JOIN p.tags t WHERE p.status = :status AND p.difficulty = :difficulty AND LOWER(t) = LOWER(:tag)")
    Page<Problem> findByStatusAndDifficultyAndTag(@Param("status") ProblemStatus status,
                                                 @Param("difficulty") ProblemDifficulty difficulty,
                                                 @Param("tag") String tag,
                                                 Pageable pageable);
}


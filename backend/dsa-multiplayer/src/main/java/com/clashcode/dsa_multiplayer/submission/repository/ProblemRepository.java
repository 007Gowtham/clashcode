package com.clashcode.dsa_multiplayer.submission.repository;

import com.clashcode.dsa_multiplayer.submission.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {

    List<Problem> findByDifficultyIgnoreCase(String difficulty);

    boolean existsByTitleIgnoreCase(String title);
}

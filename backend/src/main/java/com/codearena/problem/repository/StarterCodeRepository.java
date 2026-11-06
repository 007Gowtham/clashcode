package com.codearena.problem.repository;

import com.codearena.problem.domain.ProgrammingLanguage;
import com.codearena.problem.domain.StarterCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StarterCodeRepository extends JpaRepository<StarterCode, UUID> {

    List<StarterCode> findByProblemId(UUID problemId);

    Optional<StarterCode> findByProblemIdAndLanguage(UUID problemId, ProgrammingLanguage language);

    void deleteByProblemId(UUID problemId);
}


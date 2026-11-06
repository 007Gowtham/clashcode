package com.codearena.problem.repository;

import com.codearena.problem.domain.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, UUID> {

    List<TestCase> findByProblemIdOrderByOrderIndexAsc(UUID problemId);

    List<TestCase> findByProblemIdAndIsSampleTrueOrderByOrderIndexAsc(UUID problemId);

    long countByProblemId(UUID problemId);

    long countByProblemIdAndIsSampleTrue(UUID problemId);

    void deleteByProblemId(UUID problemId);
}


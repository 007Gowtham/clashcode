package com.codearena.problem.repository;

import com.codearena.problem.domain.ContestProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContestProblemRepository extends JpaRepository<ContestProblem, UUID> {

    List<ContestProblem> findByRoomIdOrderByOrderIndexAsc(UUID roomId);

    Optional<ContestProblem> findByRoomIdAndProblemId(UUID roomId, UUID problemId);

    boolean existsByRoomIdAndProblemId(UUID roomId, UUID problemId);

    void deleteByRoomId(UUID roomId);

    void deleteByRoomIdAndProblemId(UUID roomId, UUID problemId);
}


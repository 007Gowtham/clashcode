package com.codearena.judge.repository;

import com.codearena.judge.domain.Submission;
import com.codearena.judge.domain.SubmissionMode;
import com.codearena.judge.domain.Verdict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Page<Submission> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Submission> findByRoomIdOrderByCreatedAtDesc(UUID roomId, Pageable pageable);

    Page<Submission> findByRoomIdAndModeOrderByCreatedAtDesc(UUID roomId, SubmissionMode mode, Pageable pageable);

    Page<Submission> findByRoomIdAndModeAndUserIdOrderByCreatedAtDesc(UUID roomId, SubmissionMode mode, UUID userId, Pageable pageable);

    Page<Submission> findByRoomIdAndModeAndUserIdInOrderByCreatedAtDesc(UUID roomId, SubmissionMode mode, java.util.Collection<UUID> userIds, Pageable pageable);

    List<Submission> findByRoomIdAndModeAndVerdict(UUID roomId, SubmissionMode mode, Verdict verdict);

    List<Submission> findByRoomId(UUID roomId);

    long countByUserIdAndCreatedAtAfter(UUID userId, Instant since);

    long countByUserIdAndProblemId(UUID userId, UUID problemId);

    Optional<Submission> findFirstByUserIdAndProblemIdOrderByCreatedAtDesc(UUID userId, UUID problemId);
}


package com.clashcode.dsa_multiplayer.submission.repository;

import com.clashcode.dsa_multiplayer.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    List<Submission> findByUserIdOrderBySubmittedAtDesc(UUID userId);

    List<Submission> findByUserIdAndProblemIdOrderBySubmittedAtDesc(UUID userId, UUID problemId);

    List<Submission> findByRoomIdOrderBySubmittedAtDesc(UUID roomId);

    /** Best submission per user for leaderboard queries */
    @Query("SELECT s FROM Submission s WHERE s.room.id = :roomId AND s.status = 'ACCEPTED' " +
           "ORDER BY s.executionTimeMs ASC")
    List<Submission> findAcceptedByRoom(UUID roomId);

    void deleteByRoomId(UUID roomId);
}

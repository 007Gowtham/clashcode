package com.codearena.room.repository;

import com.codearena.room.domain.Team;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    List<Team> findByRoomId(UUID roomId);

    Optional<Team> findByRoomIdAndCode(UUID roomId, String code);

    Optional<Team> findByCode(String code);

    boolean existsByRoomIdAndCode(UUID roomId, String code);

    long countByRoomId(UUID roomId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Team t WHERE t.id = :id")
    Optional<Team> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Team t WHERE t.roomId = :roomId AND t.code = :code")
    Optional<Team> findByRoomIdAndCodeForUpdate(@Param("roomId") UUID roomId, @Param("code") String code);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Team t SET t.memberCount = t.memberCount + 1 WHERE t.id = :id AND t.memberCount < 4")
    int incrementMemberCountIfUnderCapacity(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Team t SET t.memberCount = t.memberCount - 1 WHERE t.id = :id AND t.memberCount > 0")
    int decrementMemberCount(@Param("id") UUID id);
}

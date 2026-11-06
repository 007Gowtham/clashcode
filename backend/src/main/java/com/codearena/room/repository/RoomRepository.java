package com.codearena.room.repository;

import com.codearena.room.domain.Room;
import com.codearena.room.domain.RoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    Optional<Room> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    org.springframework.data.domain.Page<Room> findByStatusOrderByCreatedAtDesc(
            RoomStatus status, org.springframework.data.domain.Pageable pageable);

    long countByStatusIn(Collection<RoomStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") UUID id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE Room r SET r.version = r.version + 1, r.updatedAt = :now WHERE r.id = :roomId")
    int incrementVersion(@Param("roomId") UUID roomId, @Param("now") Instant now);

    @Query("SELECT r.version FROM Room r WHERE r.id = :roomId")
    Long findVersionById(@Param("roomId") UUID roomId);

    default long incrementAndGetVersion(UUID roomId) {
        incrementVersion(roomId, Instant.now());
        Long ver = findVersionById(roomId);
        return ver != null ? ver : 1L;
    }
}

package com.clashcode.dsa_multiplayer.room.repository;

import com.clashcode.dsa_multiplayer.room.entity.RoomProblem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RoomProblemRepository extends JpaRepository<RoomProblem, UUID> {

    List<RoomProblem> findByRoomIdOrderByPosition(UUID roomId);

    boolean existsByRoomId(UUID roomId);

    void deleteByRoomId(UUID roomId);
}

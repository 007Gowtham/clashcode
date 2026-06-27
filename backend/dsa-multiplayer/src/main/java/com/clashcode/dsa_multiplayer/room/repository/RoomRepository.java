package com.clashcode.dsa_multiplayer.room.repository;

import com.clashcode.dsa_multiplayer.room.entity.Room;
import com.clashcode.dsa_multiplayer.room.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByCode(String code);
    List<Room> findByStatusNot(RoomStatus status);
    List<Room> findByStatus(RoomStatus status);
}

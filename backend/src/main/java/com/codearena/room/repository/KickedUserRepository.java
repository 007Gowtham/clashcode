package com.codearena.room.repository;

import com.codearena.room.domain.KickedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KickedUserRepository extends JpaRepository<KickedUser, UUID> {

    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);

    List<KickedUser> findByRoomId(UUID roomId);
}


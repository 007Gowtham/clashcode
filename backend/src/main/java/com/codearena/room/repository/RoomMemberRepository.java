package com.codearena.room.repository;

import com.codearena.room.domain.MemberStatus;
import com.codearena.room.domain.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    List<RoomMember> findByRoomIdAndStatus(UUID roomId, MemberStatus status);

    List<RoomMember> findByRoomId(UUID roomId);

    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

    Optional<RoomMember> findByRoomIdAndUserIdAndStatus(UUID roomId, UUID userId, MemberStatus status);

    List<RoomMember> findByTeamIdAndStatus(UUID teamId, MemberStatus status);

    List<RoomMember> findByTeamId(UUID teamId);

    long countByRoomIdAndStatus(UUID roomId, MemberStatus status);

    long countByTeamIdAndStatus(UUID teamId, MemberStatus status);

    List<RoomMember> findByUserIdAndStatus(UUID userId, MemberStatus status);

    boolean existsByRoomIdAndUserIdAndStatus(UUID roomId, UUID userId, MemberStatus status);
}


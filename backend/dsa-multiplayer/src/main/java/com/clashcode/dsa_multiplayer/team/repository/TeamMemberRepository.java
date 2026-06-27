package com.clashcode.dsa_multiplayer.team.repository;

import com.clashcode.dsa_multiplayer.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    Optional<TeamMember> findByUserId(UUID userId);
    List<TeamMember> findByTeamId(UUID teamId);
    void deleteByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM TeamMember tm WHERE tm.team.room.id = :roomId")
    void deleteByTeamRoomId(UUID roomId);
}

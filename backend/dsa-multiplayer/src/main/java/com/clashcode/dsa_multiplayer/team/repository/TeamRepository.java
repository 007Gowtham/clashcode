package com.clashcode.dsa_multiplayer.team.repository;

import com.clashcode.dsa_multiplayer.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    Optional<Team> findByCode(String code);
    List<Team> findByRoomId(UUID roomId);
    void deleteByRoomId(UUID roomId);
}

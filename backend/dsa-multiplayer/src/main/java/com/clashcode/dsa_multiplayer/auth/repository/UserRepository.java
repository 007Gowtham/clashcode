package com.clashcode.dsa_multiplayer.auth.repository;

import com.clashcode.dsa_multiplayer.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    java.util.List<User> findByActiveRoomId(UUID activeRoomId);
    java.util.List<User> findByCurrentTeamId(UUID currentTeamId);
}

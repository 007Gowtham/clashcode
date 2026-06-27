package com.clashcode.dsa_multiplayer.auth.repository;

import com.clashcode.dsa_multiplayer.auth.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {

    /** Find the latest unused code for a user */
    Optional<PasswordResetCode> findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("DELETE FROM PasswordResetCode p WHERE p.user.id = :userId")
    void deleteAllByUserId(UUID userId);
}

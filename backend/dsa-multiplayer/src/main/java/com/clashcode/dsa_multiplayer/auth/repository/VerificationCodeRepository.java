package com.clashcode.dsa_multiplayer.auth.repository;

import com.clashcode.dsa_multiplayer.auth.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {

    /** Find the latest (most recently created) code for a user */
    Optional<VerificationCode> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("DELETE FROM VerificationCode v WHERE v.user.id = :userId")
    void deleteAllByUserId(UUID userId);
}

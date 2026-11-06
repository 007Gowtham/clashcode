package com.codearena.auth.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Default no-op token storage implementation for MVP.
 */
@Service
@ConditionalOnMissingBean(name = "redisTokenStorageService")
public class NoOpTokenStorageService implements TokenStorageService {

    @Override
    public void storeToken(UUID userId, String token, Duration duration) {
        // No-op for MVP; ready for Redis-based token storage
    }

    @Override
    public boolean isTokenRevoked(String token) {
        // No tokens are revoked in stateless MVP
        return false;
    }

    @Override
    public void revokeToken(String token) {
        // No-op for MVP
    }
}


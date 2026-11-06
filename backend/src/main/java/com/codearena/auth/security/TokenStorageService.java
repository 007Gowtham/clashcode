package com.codearena.auth.security;

import java.time.Duration;
import java.util.UUID;

/**
 * Extension point interface for token storage, blacklisting, and session tracking.
 * Can be implemented by a Redis or database-backed provider in future phases.
 */
public interface TokenStorageService {

    /**
     * Store an active token or session.
     */
    void storeToken(UUID userId, String token, Duration duration);

    /**
     * Check if a token has been revoked or blacklisted.
     */
    boolean isTokenRevoked(String token);

    /**
     * Revoke or invalidate a token.
     */
    void revokeToken(String token);
}


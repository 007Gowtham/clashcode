package com.codearena.auth.security;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    /**
     * Secret key for signing JWT tokens using HMAC-SHA256.
     * Must be at least 32 characters (256 bits).
     */
    private String secret;

    /**
     * Expiration time in milliseconds (default: 86400000 = 24 hours).
     */
    private long expirationMs = 86400000L;

    /**
     * Cookie name for storing the JWT access token.
     */
    private String cookieName = "access_token";

    /**
     * Cookie Secure flag. Set to true in production over HTTPS, false for local development.
     */
    private boolean cookieSecure = false;

    /**
     * Cookie SameSite flag (default: Lax).
     */
    private String cookieSameSite = "Lax";

    @PostConstruct
    public void validate() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be configured and contain at least 32 characters (256 bits) for HS256.");
        }
    }
}


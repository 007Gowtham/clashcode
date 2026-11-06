package com.codearena.auth.security;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class CookieService {

    private final JwtProperties jwtProperties;

    /**
     * Creates the access_token cookie containing the JWT.
     */
    public ResponseCookie createAccessTokenCookie(String token) {
        return ResponseCookie.from(jwtProperties.getCookieName(), token)
                .httpOnly(true)
                .secure(jwtProperties.isCookieSecure())
                .path("/")
                .maxAge(Duration.ofMillis(jwtProperties.getExpirationMs()))
                .sameSite(jwtProperties.getCookieSameSite())
                .build();
    }

    /**
     * Creates an expired cookie to clear the access_token.
     */
    public ResponseCookie createLogoutCookie() {
        return ResponseCookie.from(jwtProperties.getCookieName(), "")
                .httpOnly(true)
                .secure(jwtProperties.isCookieSecure())
                .path("/")
                .maxAge(0)
                .sameSite(jwtProperties.getCookieSameSite())
                .build();
    }
}


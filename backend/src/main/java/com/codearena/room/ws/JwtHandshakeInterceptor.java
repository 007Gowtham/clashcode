package com.codearena.room.ws;

import com.codearena.auth.security.JwtProperties;
import com.codearena.auth.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String token = null;

        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest httpServletRequest = servletRequest.getServletRequest();

            // 1. Check HTTP Cookie (standard browser flow)
            Cookie[] cookies = httpServletRequest.getCookies();
            if (cookies != null) {
                token = Arrays.stream(cookies)
                        .filter(c -> jwtProperties.getCookieName().equals(c.getName()))
                        .map(Cookie::getValue)
                        .findFirst()
                        .orElse(null);
            }

            // 2. Fallback to Authorization Header or query param if not in cookie
            if (!StringUtils.hasText(token)) {
                String authHeader = httpServletRequest.getHeader("Authorization");
                if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                } else {
                    token = httpServletRequest.getParameter("token");
                }
            }
        }

        if (StringUtils.hasText(token) && jwtService.isTokenValid(token)) {
            UUID userId = jwtService.extractUserId(token);
            String username = jwtService.extractUsername(token);

            attributes.put("userId", userId);
            attributes.put("username", username);
            log.debug("WebSocket handshake authenticated for user: {} ({})", username, userId);
            return true;
        }

        log.warn("WebSocket handshake rejected: invalid or missing JWT cookie");
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // No action needed after handshake
    }
}


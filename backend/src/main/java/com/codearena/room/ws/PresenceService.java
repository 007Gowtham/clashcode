package com.codearena.room.ws;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles online presence tracking separately from persistent room membership.
 * Disconnects do NOT remove players from their rooms.
 */
@Slf4j
@Service
public class PresenceService {

    // Map of userId -> Set of active WebSocket session IDs
    private final Map<UUID, Set<String>> userSessions = new ConcurrentHashMap<>();

    // Map of sessionId -> userId
    private final Map<String, UUID> sessionToUser = new ConcurrentHashMap<>();

    public PresenceService(MeterRegistry meterRegistry) {
        Gauge.builder("websocket_connections", this, PresenceService::getActiveConnectionCount)
                .description("Number of active WebSocket connections")
                .register(meterRegistry);
    }

    public void registerSession(UUID userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        sessionToUser.put(sessionId, userId);
        log.debug("User {} connected session {}. Total user sessions: {}",
                userId, sessionId, userSessions.get(userId).size());
    }

    public void removeSession(String sessionId) {
        UUID userId = sessionToUser.remove(sessionId);
        if (userId != null) {
            Set<String> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                    log.debug("User {} went completely offline", userId);
                }
            }
        }
    }

    public boolean isUserOnline(UUID userId) {
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public double getActiveConnectionCount() {
        return sessionToUser.size();
    }
}


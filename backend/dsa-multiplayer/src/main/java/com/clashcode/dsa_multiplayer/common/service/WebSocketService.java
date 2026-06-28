package com.clashcode.dsa_multiplayer.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Generic WebSocket push service.
 *
 * ONE method: push(topic, payload).
 * The caller owns the topic string. The payload is any serialisable object.
 * Jackson converts it to JSON automatically.
 *
 * ── Topic naming convention ──────────────────────────────────────────────
 *
 *   Pattern: /topic/{feature}/{id}/{sub-feature}
 *
 *   /topic/submission/{submissionId}          verdict push
 *   /topic/room/{roomId}/leaderboard          leaderboard push
 *   /topic/room/{roomId}/events               room events push
 *   /topic/user/{userId}/notifications        future: personal alerts
 *
 * ── Usage examples ───────────────────────────────────────────────────────
 *
 *   // submission verdict (SubmissionJudgeWorker):
 *   webSocketService.push("/topic/submission/" + submissionId, payload);
 *
 *   // leaderboard update (LeaderboardService):
 *   webSocketService.push("/topic/room/" + roomId + "/leaderboard", payload);
 *
 *   // room event (RoomService):
 *   webSocketService.push("/topic/room/" + roomId + "/events", payload);
 *
 *   // any future feature — same method, different topic string, different payload.
 *   // No new methods. No new files.
 * ─────────────────────────────────────────────────────────────────────────
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Push {@code payload} to a STOMP topic.
     *
     * @param topic   full STOMP destination — caller decides the string,
     *                e.g. "/topic/submission/abc-123"
     * @param payload any serialisable object; Jackson converts it to JSON
     */
    public void push(String topic, Object payload) {
        try {
            log.info("[WS] push → {} : {}", topic, payload);
            messagingTemplate.convertAndSend(topic, payload);
        } catch (Exception e) {
            // WebSocket failures must NEVER crash the caller (judge worker, etc.)
            log.error("[WS] push failed → topic={} error={}", topic, e.getMessage(), e);
        }
    }
}

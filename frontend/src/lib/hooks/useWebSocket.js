/**
 * useWebSocket.js — The ONLY WebSocket hook you need.
 *
 * Generic pattern:
 *   const { isConnected } = useWebSocket(topic, onMessage)
 *
 * Parameters:
 *   topic      — STOMP destination string, e.g. "/topic/submission/uuid"
 *                Pass null to skip connecting (useful before you have an ID).
 *   onMessage  — callback called with the parsed JSON payload on every message
 *
 * Returns:
 *   { isConnected }  — boolean; true once the STOMP connection is established
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
 * ── Usage examples ────────────────────────────────────────────────────────
 *
 *   // Submission verdict — only connect after submit (when we have an ID):
 *   const [submissionId, setSubmissionId] = useState(null);
 *   useWebSocket(
 *     submissionId ? `/topic/submission/${submissionId}` : null,
 *     (data) => setVerdict(data)
 *   );
 *   // then on submit: setSubmissionId(res.data.id)  ← triggers connection
 *
 *   // Leaderboard updates:
 *   useWebSocket(
 *     `/topic/room/${roomId}/leaderboard`,
 *     (data) => setLeaderboard(data.entries)
 *   );
 *
 *   // Room events:
 *   useWebSocket(
 *     `/topic/room/${roomId}/events`,
 *     (data) => handleRoomEvent(data.eventType, data)
 *   );
 *
 *   // Any future feature — same hook, different topic string and callback.
 *   // No new hook files. No new functions.
 * ─────────────────────────────────────────────────────────────────────────
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://13.201.230.50:5000';

/**
 * @param {string|null} topic      STOMP destination; pass null to stay disconnected
 * @param {Function}    onMessage  called with the parsed JSON body on every push
 * @returns {{ isConnected: boolean }}
 */
export function useWebSocket(topic, onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref current without triggering a reconnect
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  useEffect(() => {
    // null topic = "not ready yet" — do nothing
    if (!topic) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      reconnectDelay: 3000,

      onConnect: () => {
        setIsConnected(true);

        client.subscribe(topic, (frame) => {
          try {
            onMessageRef.current?.(JSON.parse(frame.body));
          } catch {
            // body wasn't JSON — pass it through as-is
            onMessageRef.current?.(frame.body);
          }
        });
      },

      onDisconnect:  () => setIsConnected(false),
      onStompError:  (frame) => {
        console.error('[useWebSocket] STOMP error', frame);
        setIsConnected(false);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [topic]); // reconnect only when the topic string changes

  return { isConnected };
}

'use client';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

/**
 * Creates and configures a STOMP client over SockJS.
 */
export function createStompClient({ onConnect, onDisconnect, onError } = {}) {
  if (typeof window === 'undefined') {
    return null;
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: () => {
      // In minimal mode, keep logs quiet or uncomment for debugging:
      // console.log('[STOMP]', str);
    },
    onConnect: (frame) => {
      if (onConnect) onConnect(frame);
    },
    onDisconnect: (frame) => {
      if (onDisconnect) onDisconnect(frame);
    },
    onStompError: (frame) => {
      console.error('[STOMP Error]', frame.headers['message'], frame.body);
      if (onError) onError(frame);
    },
    onWebSocketError: (event) => {
      console.warn('[WebSocket Warning]', event);
    },
  });

  return client;
}

/**
 * Hook or helper to manage room subscriptions.
 */
export function subscribeToRoomUpdates(client, roomId, onMessage) {
  if (!client || !client.connected || !roomId) return null;
  return client.subscribe(`/topic/room.${roomId}`, (message) => {
    try {
      const payload = JSON.parse(message.body);
      onMessage(payload);
    } catch (err) {
      console.error('Failed to parse room STOMP message', err);
    }
  });
}

/**
 * Subscribe to contest live leaderboard.
 */
export function subscribeToLeaderboard(client, roomId, onMessage) {
  if (!client || !client.connected || !roomId) return null;
  return client.subscribe(`/topic/room.${roomId}.leaderboard`, (message) => {
    try {
      const payload = JSON.parse(message.body);
      onMessage(payload);
    } catch (err) {
      console.error('Failed to parse leaderboard message', err);
    }
  });
}

/**
 * Subscribe to personal submission updates.
 */
export function subscribeToUserSubmissions(client, onMessage) {
  if (!client || !client.connected) return null;
  return client.subscribe('/user/queue/submissions', (message) => {
    try {
      const payload = JSON.parse(message.body);
      onMessage(payload);
    } catch (err) {
      console.error('Failed to parse submission STOMP message', err);
    }
  });
}

/**
 * Subscribe to personal notifications (e.g., kick, disqualification).
 */
export function subscribeToUserNotifications(client, onMessage) {
  if (!client || !client.connected) return null;
  return client.subscribe('/user/queue/notifications', (message) => {
    try {
      const payload = JSON.parse(message.body);
      onMessage(payload);
    } catch (err) {
      console.error('Failed to parse notification STOMP message', err);
    }
  });
}


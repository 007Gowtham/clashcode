'use client';

import { io } from 'socket.io-client';
import { store } from '@/store';
import { setSocketConnected } from '@/store/slices/socketSlice';
import { clearCredentials } from '@/store/slices/authSlice';

let socket = null;

export const initSocket = (accessToken) => {
  if (typeof window === 'undefined') return null;
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000', {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => store.dispatch(setSocketConnected(true)));
  socket.on('disconnect', () => store.dispatch(setSocketConnected(false)));
  socket.on('connect_error', (err) => console.error('[Socket] connect_error', err.message));

  socket.on('auth:session_expired', () => {
    store.dispatch(clearCredentials());
    window.location.href = '/login?reason=session_expired';
  });

  socket.on('auth:force_logout', () => {
    store.dispatch(clearCredentials());
    window.location.href = '/login?reason=force_logout';
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const reconnectSocket = (newToken) => {
  disconnectSocket();
  return initSocket(newToken);
};

export const emitWithTimeout = (event, data, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Socket event "${event}" timed out`)), timeout);
    getSocket().emit(event, data, (response) => {
      clearTimeout(timer);
      if (response?.error) reject(response.error);
      else resolve(response);
    });
  });
};

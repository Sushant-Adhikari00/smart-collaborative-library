import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Helper to retrieve JWT token from storage (supports both keys).
const getToken = () => {
  try {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user?.token) return user.token;
  } catch (_) {
    // ignore parse errors
  }

  const plain = localStorage.getItem('token');
  if (plain) return plain;

  return null;
};

// Create a STOMP client using SockJS transport.
const client = new Client({
  webSocketFactory: () => {
    const token = getToken();
    if (!token) {
      console.warn('[STOMP] No JWT token available, skipping WebSocket connection.');
      return null;
    }
    const defaultWsUrl = import.meta.env.PROD
      ? "https://smart-collaborative-library-1.onrender.com"
      : "http://localhost:8080";
    const wsBase = import.meta.env.VITE_WS_BASE_URL || defaultWsUrl;
    const url = `${wsBase}/ws?token=${token}`;
    return new SockJS(url);
  },
  reconnectDelay: 3000,
  connectHeaders: {},
  onStompError: (frame) => {
    console.error('[STOMP] Broker error:', frame.headers['message'], frame.body);
  },
  onWebSocketClose: (evt) => {
    console.warn('[STOMP] WebSocket connection closed, will retry in 3s...');
  },
});

/**
 * Activate the STOMP client if not already active.
 */
export const connectIfNeeded = () => {
  const token = getToken();
  if (!token) {
    console.warn('[STOMP] Cannot connect — no JWT token found.');
    return;
  }

  if (!client.active) {
    client.activate();
  }
};

/**
 * Fully disconnect the STOMP client (e.g. on logout).
 */
export const disconnect = () => {
  if (client.active) {
    client.deactivate();
  }
};

export default client;

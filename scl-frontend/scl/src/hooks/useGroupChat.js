import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api } from '../services/api';

export function useGroupChat(roomId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    let isMounted = true;
    setLoading(true);

    // 1. Fetch previous messages
    api.get(`/v1/chat/rooms/${roomId}/messages?page=0&size=50`)
      .then((res) => {
        if (isMounted) {
          const content = res.data?.data?.content || [];
          // Reverse so oldest is top, latest is bottom
          setMessages([...content].reverse());
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load previous chat messages:', err);
        if (isMounted) setLoading(false);
      });

    // 2. Connect STOMP WebSocket
    const token = localStorage.getItem('scl_auth_token');
    const socket = new SockJS('/ws');

    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // console.log('[STOMP]', str);
      },
      onConnect: () => {
        if (!isMounted) return;
        setConnected(true);

        // Subscribe to group chat channel
        stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
          try {
            const body = JSON.parse(message.body);
            setMessages((prev) => [...prev, body]);
          } catch (e) {
            console.error('Error parsing STOMP chat message:', e);
          }
        });
      },
      onDisconnect: () => {
        if (isMounted) setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP protocol error:', frame.headers['message'], frame.body);
      },
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      isMounted = false;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [roomId]);

  const sendMessage = (text, messageType = 'TEXT') => {
    if (!text.trim() || !roomId) return;

    const payload = {
      roomId: Number(roomId),
      message: text,
      messageType,
    };

    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
    } else {
      // Fallback REST call
      api.post(`/v1/chat/rooms/${roomId}/messages`, payload).then((res) => {
        setMessages((prev) => [...prev, res.data.data]);
      });
    }
  };

  return { messages, loading, connected, sendMessage };
}

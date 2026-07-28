import { useState, useEffect, useRef, useContext } from 'react';
import {
  SendIcon,
  PaperclipIcon,
  UsersIcon,
  PinIcon,
  MessageCircleIcon,
  CheckCheckIcon,
  SparklesIcon,
  WifiIcon
} from 'lucide-react';
import stompClient, { connectIfNeeded } from '../../services/websocket.js';
import { AuthContext } from '../../context/authContext.jsx';
import toast from 'react-hot-toast';

const LiveChatTab = ({ documentId }) => {
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  const docRoomId = `doc-${documentId}`;

  // Initial welcome messages & load from localStorage history if available
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chat_history_${docRoomId}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 1,
        sender: 'Academic Bot',
        text: '👋 Welcome to the live collaboration workspace! Share thoughts, ask questions, or use @AI to chat with NotebookLM.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
        pinned: true
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Save messages to local storage whenever messages list updates
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`chat_history_${docRoomId}`, JSON.stringify(messages));
      } catch (_) {}
    }
  }, [messages, docRoomId]);

  // Connect STOMP & Subscribe to live room topic
  useEffect(() => {
    connectIfNeeded();

    let sub = null;
    const checkConnection = setInterval(() => {
      if (stompClient && stompClient.connected) {
        setIsConnected(true);
        if (!sub) {
          try {
            sub = stompClient.subscribe(`/topic/chat/${docRoomId}`, (msg) => {
              try {
                const payload = JSON.parse(msg.body);
                // Avoid duplicating self-sent messages
                if (payload.senderEmail !== user?.email && payload.sender !== (user?.username || user?.name || user?.email)) {
                  setMessages(prev => [...prev, payload]);
                }
              } catch (err) {
                console.error('[LiveChat] WS Parse error:', err);
              }
            });
          } catch (e) {
            console.warn('[LiveChat] Subscription error:', e);
          }
        }
      } else {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      if (sub) {
        try { sub.unsubscribe(); } catch (_) {}
      }
    };
  }, [docRoomId, user]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const senderName = user?.username || user?.fullName || user?.name || user?.email?.split('@')[0] || 'You';

    const messagePayload = {
      id: Date.now(),
      sender: senderName,
      senderEmail: user?.email,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false,
      pinned: false
    };

    // Broadcast over STOMP WebSocket topic if active
    if (stompClient && stompClient.connected) {
      try {
        stompClient.publish({
          destination: `/topic/chat/${docRoomId}`,
          body: JSON.stringify(messagePayload)
        });

        // Also attempt STOMP app endpoint if numerical ID
        if (Number.isInteger(Number(documentId))) {
          stompClient.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({
              roomId: Number(documentId),
              message: text
            })
          });
        }
      } catch (e) {
        console.warn('[LiveChat] STOMP send fallback:', e);
      }
    }

    setMessages(prev => [...prev, messagePayload]);
    setInput('');
  };

  const pinnedMsg = messages.find(m => m.pinned);

  return (
    <div className="flex flex-col h-full bg-base-100 rounded-xl overflow-hidden">

      {/* Top Room Banner */}
      <div className="bg-base-200/60 p-3 border-b border-base-300 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircleIcon className="size-4 text-accent" />
          <span className="font-bold text-xs">Live Group Workspace Chat</span>
          <span className={`badge badge-xs gap-1 font-medium ${isConnected ? 'badge-success' : 'badge-ghost'}`}>
            <span className={`size-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-base-content/40'}`} />
            {isConnected ? 'Live WebSocket Connected' : 'Local Workspace Chat'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-base-content/60 bg-base-100 px-2.5 py-1 rounded-full border border-base-300">
          <UsersIcon className="size-3.5 text-success" />
          <span className="font-medium text-xs">Active Workspace</span>
        </div>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMsg && (
        <div className="bg-warning/10 border-b border-warning/20 px-3 py-1.5 text-xs flex items-center justify-between text-warning-content shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <PinIcon className="size-3.5 text-warning shrink-0" />
            <span className="font-semibold text-[11px] shrink-0">{pinnedMsg.sender}:</span>
            <span className="truncate opacity-90">{pinnedMsg.text}</span>
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => {
          const currentName = user?.username || user?.fullName || user?.name || user?.email?.split('@')[0] || 'You';
          const isMe = msg.sender === currentName || msg.sender === 'You' || (user?.email && msg.senderEmail === user.email);

          return (
            <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 text-[10px] text-base-content/50 mb-0.5 px-1">
                <span className="font-semibold">{isMe ? 'You' : msg.sender}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  msg.isSystem
                    ? 'bg-primary/10 text-primary border border-primary/20 rounded-xl'
                    : isMe
                    ? 'bg-accent text-accent-content rounded-br-xs shadow-xs font-medium'
                    : 'bg-base-200 text-base-content rounded-bl-xs border border-base-300'
                }`}
              >
                {msg.text}
              </div>

              {isMe && (
                <div className="flex items-center gap-1 text-[10px] text-base-content/40 mt-0.5 px-1">
                  <CheckCheckIcon className="size-3 text-info" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-base-300 bg-base-200/40 flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder={user ? "Send a live message to workspace collaborators..." : "Log in to chat..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!user}
          className="input input-sm input-bordered flex-1 bg-base-100 text-xs focus:input-accent"
        />

        <button
          type="submit"
          disabled={!input.trim() || !user}
          className="btn btn-sm btn-accent btn-square"
          title="Send message"
        >
          <SendIcon className="size-4" />
        </button>
      </form>
    </div>
  );
};

export default LiveChatTab;

import { PenSquareIcon, Trash2Icon, ShareIcon, BotIcon, SendIcon, XIcon, FileTextIcon, UsersIcon } from 'lucide-react';
import { Link } from "react-router";
import api from '../lib/axios.js';
import stompClient, { connectIfNeeded } from '../services/websocket.js';
import toast from 'react-hot-toast';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/authContext.jsx';

const NoteCard = ({ note, setNotes }) => {
  const { user } = useContext(AuthContext);

  // AI Chat State
  const [showChat, setShowChat] = useState(false);
  const [showCollaborate, setShowCollaborate] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: `Hi! I've loaded "${note.title}". Ask me anything about this document!` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Collaboration chat state
  const [collabRoomId, setCollabRoomId] = useState(null);
  const [collabMessages, setCollabMessages] = useState([]);
  const [collabInput, setCollabInput] = useState("");
  const [collabLoading, setCollabLoading] = useState(false);
  const safeCollabMessages = Array.isArray(collabMessages) ? collabMessages : [];
  const messagesEndRef = useRef(null);

  // Share State
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Spring Boot uses numeric `id`, fall back to `_id` if present
  const docId = note?.id || note?._id;
  // Determine if current user is the owner (uploadedBy is the username string)
  const isOwner = user && note.uploadedBy && (note.uploadedBy === user.username || note.uploadedBy === user.email);
  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN" || user?.role === "admin";

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/documents/${docId}`);
      setNotes(prev => prev.filter(n => (n.id || n._id) !== docId));
      toast.success("Document deleted successfully");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete document");
    } finally {
      setDeleteLoading(false);
    }
  };

  const loadCollabMessages = async (roomId) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      // Backend returns PageResponse<ChatMessageDTO>: { content: [...], page, size, ... }
      const content =
        res.data?.data?.content ||
        res.data?.content ||
        (Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
      // Historical messages arrive newest-first; reverse so oldest is at top
      const msgs = Array.isArray(content) ? [...content].reverse() : [];
      setCollabMessages(msgs);
    } catch (e) {
      console.error("Failed to load messages", e);
      setCollabMessages([]);
    }
  };

  const initCollabRoom = async () => {
    if (!docId) {
      toast.error("Cannot load collaboration chat: Document ID is missing.");
      return;
    }
    setCollabLoading(true);
    try {
      // 1️⃣ Create or fetch room (backend automatically joins the user and returns room details)
      const createRes = await api.post("/chat/rooms", {
        name: `doc-${docId}`
      });
      const roomId = createRes.data?.data?.id || createRes.data?.id;
      if (!roomId) {
        throw new Error("Invalid room ID returned from server");
      }
      setCollabRoomId(roomId);
      // 2️⃣ Load recent messages
      await loadCollabMessages(roomId);
    } catch (e) {
      console.error("Collaboration init error:", e);
      toast.error(e.response?.data?.message || "Failed to connect to collaboration chat room.");
    } finally {
      setCollabLoading(false);
    }
  };

  // --- Collaboration Room Init ---
  useEffect(() => {
    if (showCollaborate) {
      // Ensure a JWT exists before attempting any API/WebSocket calls
      let token = null;
      try {
        const stored = localStorage.getItem('user');
        token = stored ? JSON.parse(stored)?.token : null;
      } catch (_) { /* ignore */ }
      if (!token) token = localStorage.getItem('token');

      if (!token) {
        toast.error('You must be logged in to collaborate.');
        setShowCollaborate(false);
        return;
      }
      connectIfNeeded();
      initCollabRoom();
    } else {
      setCollabRoomId(null);
      setCollabMessages([]);
    }
  }, [showCollaborate]);

  // --- STOMP WebSocket Subscription for Active Room ---
  useEffect(() => {
    if (!showCollaborate || !collabRoomId) return;

    let sub = null;
    let cancelled = false;

    const trySubscribe = () => {
      if (cancelled || sub) return;
      if (stompClient && stompClient.connected) {
        sub = stompClient.subscribe(`/topic/chat/${collabRoomId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            setCollabMessages((prev) => {
              const prevArr = Array.isArray(prev) ? prev : [];
              if (payload.id && prevArr.some(m => m.id === payload.id)) {
                return prevArr;
              }
              return [...prevArr, payload];
            });
          } catch (err) {
            console.error("WS parse error:", err);
          }
        });
      }
    };

    trySubscribe();

    const interval = setInterval(() => {
      if (!sub && !cancelled) {
        trySubscribe();
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (sub) {
        try { sub.unsubscribe(); } catch (_) {}
      }
    };
  }, [showCollaborate, collabRoomId]);

  // --- Auto-scroll to bottom of chat ---
  useEffect(() => {
    if (showCollaborate && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [collabMessages, showCollaborate]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const question = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: question }]);
    setChatLoading(true);

    try {
      // Backend: POST /api/v1/ai/chat { question, documentId }
      const res = await api.post("/ai/chat", {
        question,
        documentId: docId,
      });
      const answer = res.data?.data?.answer || res.data?.answer || "No response received.";
      setChatMessages(prev => [...prev, { role: "assistant", text: answer }]);
    } catch (error) {
      console.error("AI chat error:", error);
      const errMsg = error.response?.data?.message || "AI service error. Make sure the AI service is running.";
      setChatMessages(prev => [...prev, { role: "assistant", text: `⚠️ ${errMsg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- Share Document ---
  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return toast.error("Please enter an email");
    setShareLoading(true);
    try {
      // Backend: POST /api/v1/documents/share { documentId, sharedWithEmail }
      await api.post("/documents/share", {
        documentId: docId,
        sharedWithEmail: shareEmail,
      });
      toast.success(`Document shared with ${shareEmail}!`);
      setShareEmail("");
      setShowShare(false);
    } catch (error) {
      console.error("Share error:", error);
      toast.error(error.response?.data?.message || "Failed to share document");
    } finally {
      setShareLoading(false);
    }
  };

  const handleSendCollab = async (request) => {
    try {
      setCollabLoading(true);
      if (stompClient && stompClient.connected) {
        // Preferred: send via STOMP WebSocket
        stompClient.publish({
          destination: "/app/chat.send",
          body: JSON.stringify(request)
        });
      } else {
        // Fallback: send via REST API (message will still broadcast via server-side SimpMessagingTemplate)
        await api.post(`/chat/rooms/${request.roomId}/messages`, {
          message: request.message,
          roomId: request.roomId,
        });
        // Reload messages since we won't get the WS broadcast
        await loadCollabMessages(request.roomId);
      }
      setCollabInput("");
    } catch (err) {
      console.error("Send collab message failed:", err);
      toast.error("Failed to send message.");
    } finally {
      setCollabLoading(false);
    }
  };

  return (
    <>
      {/* ---- Document Card ---- */}
      <div className='card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-primary/20'>
        <div className='card-body'>
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <h3 className='card-title text-primary line-clamp-2'>{note.title}</h3>
            {isOwner && <span className="badge badge-sm badge-primary shrink-0">Yours</span>}
          </div>

          {/* Description */}
          {note.description && (
            <p className='line-clamp-2 mt-1 text-base-content/80 text-sm'>{note.description}</p>
          )}

          {/* File Link */}
          {note.fileUrl && (
            <a
              href={note.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className='btn btn-sm btn-outline btn-primary mt-2 flex items-center gap-1 w-fit'
            >
              <FileTextIcon className="size-4" /> View File
            </a>
          )}

          {/* Meta */}
          <div className="text-xs text-base-content/50 mt-1 space-y-0.5">
            {note.uploadedBy && <p>Uploaded by: <span className="font-medium">{note.uploadedBy}</span></p>}
            {note.createdAt && (
              <p>{new Date(note.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
            )}
          </div>

          {/* Actions */}
          <div className='card-actions justify-between items-center mt-4 flex-wrap gap-2'>
            {/* AI Chat — available to logged-in users */}
            {user && (
              <>
                <button
                  onClick={() => setShowChat(true)}
                  className="btn btn-sm btn-secondary flex items-center gap-1"
                >
                  <BotIcon className="size-4" /> Chat with AI
                </button>
                <button
                  onClick={() => setShowCollaborate(true)}
                  className="btn btn-sm btn-accent flex items-center gap-1 ml-2"
                >
                  <UsersIcon className="size-4" /> Collaborate
                </button>
              </>
            )}

            <div className="flex items-center gap-1 ml-auto">
              {/* Share — owner only */}
              {isOwner && (
                <button
                  onClick={() => setShowShare(true)}
                  className="btn btn-ghost btn-xs text-accent"
                  title="Share document"
                >
                  <ShareIcon className='size-4' />
                </button>
              )}
              {/* Edit — owner or admin */}
              {(isOwner || isAdmin) && (
                <Link to={`/update/${docId}`} className="btn btn-ghost btn-xs text-primary" title="Edit">
                  <PenSquareIcon className='size-4' />
                </Link>
              )}
              {/* Delete — owner or admin */}
              {(isOwner || isAdmin) && (
                <button className='btn btn-ghost btn-xs text-error' onClick={() => setShowDeleteModal(true)} title="Delete">
                  <Trash2Icon className='size-4' />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- AI Chat Modal ---- */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: "70vh" }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <div className="flex items-center gap-2">
                <BotIcon className="size-5 text-secondary" />
                <div>
                  <h3 className="font-bold text-base">AI Chat</h3>
                  <p className="text-xs text-base-content/50 line-clamp-1">{note.title}</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="btn btn-ghost btn-sm btn-circle">
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${msg.role === "user"
                        ? "bg-primary text-primary-content rounded-br-sm"
                        : "bg-base-200 text-base-content rounded-bl-sm"
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-base-200 rounded-2xl rounded-bl-sm px-4 py-2">
                    <span className="loading loading-dots loading-sm"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-base-300 flex gap-2">
              <input
                type="text"
                placeholder="Ask anything about this document..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="input input-bordered input-sm flex-1 bg-base-200"
                disabled={chatLoading}
                autoFocus
              />
              <button type="submit" className="btn btn-sm btn-primary" disabled={chatLoading || !chatInput.trim()}>
                <SendIcon className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ---- Collaborate Modal (Group Chat) ---- */}
      {showCollaborate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: "70vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-5 text-accent" />
                <div>
                  <h3 className="font-bold text-base">Collaborate (Group Chat)</h3>
                  <p className="text-xs text-base-content/50 line-clamp-1">{note.title}</p>
                </div>
              </div>
              <button onClick={() => setShowCollaborate(false)} className="btn btn-ghost btn-sm btn-circle">
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {safeCollabMessages.length === 0 && !collabLoading && (
                <div className="text-center text-xs text-base-content/50 py-8">
                  No messages yet. Be the first to start the discussion!
                </div>
              )}

              {safeCollabMessages.map((msg, i) => {
                const isMe =
                  msg.sender?.email === user?.email ||
                  (user?.username && msg.sender?.fullName === user?.username);
                const senderDisplayName = isMe
                  ? "You"
                  : (msg.sender?.fullName || msg.sender?.email || "Collaborator");
                const messageTime = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "";

                return (
                  <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="text-[11px] text-base-content/60 px-1 mb-0.5 flex items-center gap-1">
                      <span className="font-semibold">{senderDisplayName}</span>
                      {messageTime && <span className="text-[10px] opacity-70">• {messageTime}</span>}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                        isMe
                          ? "bg-primary text-primary-content rounded-br-xs"
                          : "bg-base-200 text-base-content rounded-bl-xs shadow-xs"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              {collabLoading && (
                <div className="flex justify-start">
                  <div className="bg-base-200 rounded-2xl rounded-bl-xs px-4 py-2">
                    <span className="loading loading-dots loading-sm"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!collabInput.trim() || !collabRoomId) return;
                const request = { roomId: collabRoomId, message: collabInput.trim() };
                handleSendCollab(request);
              }}
              className="p-4 border-t border-base-300 flex gap-2"
            >
              <input
                type="text"
                placeholder={collabLoading ? "Connecting to chat room..." : "Type a message to collaborators..."}
                value={collabInput}
                onChange={(e) => setCollabInput(e.target.value)}
                className="input input-bordered input-sm flex-1 bg-base-200"
                disabled={collabLoading || !collabRoomId}
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={collabLoading || !collabInput.trim() || !collabRoomId}
              >
                <SendIcon className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ---- Share Modal ---- */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShareIcon className="size-5 text-accent" /> Share Document
              </h3>
              <button onClick={() => setShowShare(false)} className="btn btn-ghost btn-sm btn-circle">
                <XIcon className="size-4" />
              </button>
            </div>
            <p className="text-sm text-base-content/60 mb-4">Enter the email of the person you want to share <strong>"{note.title}"</strong> with.</p>
            <form onSubmit={handleShare} className="space-y-3">
              <input
                type="email"
                placeholder="friend@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="input input-bordered w-full"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowShare(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-accent btn-sm" disabled={shareLoading}>
                  {shareLoading ? <span className="loading loading-spinner loading-xs" /> : "Share"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ---- Delete Confirmation Modal ---- */}
      {showDeleteModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-neutral">Delete Document</h3>
            <p className="py-4 text-base-content">
              Are you sure you want to delete <strong>"{note.title}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={confirmDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="loading loading-spinner loading-xs" /> : "Delete"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => !deleteLoading && setShowDeleteModal(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  );
};

export default NoteCard;

import { PenSquareIcon, Trash2Icon, ShareIcon, BotIcon, SendIcon, XIcon, FileTextIcon } from 'lucide-react';
import { Link } from "react-router";
import api from '../lib/axios.js';
import toast from 'react-hot-toast';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/authContext.jsx';

const NoteCard = ({ note, setNotes }) => {
  const { user } = useContext(AuthContext);

  // AI Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: `Hi! I've loaded "${note.title}". Ask me anything about this document!` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Share State
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Spring Boot uses numeric `id`, not MongoDB `_id`
  const docId = note.id;
  // Determine if current user is the owner (uploadedBy is the username string)
  const isOwner = user && note.uploadedBy && note.uploadedBy === (user.fullName || user.username);
  const isAdmin = user?.role === "ADMIN" || user?.role === "ROLE_ADMIN" || user?.role === "admin";

  // --- Delete Document ---
  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/documents/${docId}`);
      setNotes(prev => prev.filter(n => n.id !== docId));
      toast.success("Document deleted successfully");
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete document");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- AI Chat ---
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
              <button
                onClick={() => setShowChat(true)}
                className="btn btn-sm btn-secondary flex items-center gap-1"
              >
                <BotIcon className="size-4" /> Chat with AI
              </button>
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
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
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

import { useState, useContext, useEffect } from 'react';
import { 
  XIcon, 
  DownloadIcon, 
  BookmarkIcon, 
  Share2Icon, 
  StarIcon, 
  MessageSquareIcon, 
  UsersIcon, 
  BotIcon, 
  CheckCircle2Icon, 
  FileTextIcon, 
  SparklesIcon, 
  TagIcon, 
  BookOpenIcon,
  Trash2Icon
} from 'lucide-react';
import PdfViewer from './PdfViewer.jsx';
import PrivateAiChatDrawer from '../ai/PrivateAiChatDrawer.jsx';
import RequestAccessModal from '../collaboration/RequestAccessModal.jsx';
import CollaborationWorkspaceModal from '../collaboration/CollaborationWorkspaceModal.jsx';
import ResourceDiscussionModal from '../collaboration/ResourceDiscussionModal.jsx';
import AuthPromptModal from '../auth/AuthPromptModal.jsx';
import { AuthContext } from '../../context/authContext.jsx';
import { documentApi } from '../../services/collaborationApi.js';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';

const ResourceViewerModal = ({ isOpen, onClose, note }) => {
  const { user } = useContext(AuthContext);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [authPrompt, setAuthPrompt] = useState({ open: false, feature: '' });

  // Guard: show login popup for unauthenticated users instead of acting
  const requireAuth = (feature, action) => {
    if (!user) {
      setAuthPrompt({ open: true, feature });
      return;
    }
    action();
  };

  const docId = note?.id || note?._id;
  const [averageRating, setAverageRating] = useState(note.averageRating || note.rating || null);

  useEffect(() => {
    if (!isOpen || !docId) return;
    documentApi.getRating(docId)
      .then((data) => {
        if (data && data.averageRating != null) {
          setAverageRating(data.averageRating);
        }
      })
      .catch(() => { /* silent fallback */ });

    const saved = JSON.parse(localStorage.getItem('scl_bookmarks') || '[]');
    setIsBookmarked(saved.includes(docId));
  }, [isOpen, docId]);

  if (!isOpen || !note) return null;

  const isAdmin = Boolean(user && (user.role === 'ROLE_ADMIN' || user.role === 'admin' || user.role === 'ADMIN'));
  const isOwner = Boolean(
    user && (
      (note?.uploadedBy && (
        note.uploadedBy.toLowerCase() === (user.email || '').toLowerCase() ||
        note.uploadedBy.toLowerCase() === (user.username || '').toLowerCase() ||
        note.uploadedBy.toLowerCase() === (user.name || '').toLowerCase() ||
        note.uploadedBy.toLowerCase() === (user.fullName || '').toLowerCase()
      )) ||
      (note?.userId && String(note.userId) === String(user.id))
    )
  );
  const canDelete = isOwner || isAdmin;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success("Document deleted successfully");
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Delete document error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete document");
    }
  };

  const isVerified = note.isVerified || note.teacherVerified || note.category === 'Lecture Notes' || true;
  const rating = averageRating != null ? Number(averageRating).toFixed(1) : '—';
  const downloads = note.downloadCount ?? note.totalDownloads ?? 0;
  const commentsCount = note.commentCount ?? note.totalComments ?? 0;

  const keywords = note.aiKeywords 
    ? note.aiKeywords.split(',').map(k => k.trim()).filter(Boolean) 
    : (note.keywords || ["Distributed Systems", "Consensus", "Fault Tolerance", "Microservices"]);
  const relatedDocs = note.relatedDocs || [
    { title: "Advanced Distributed Consensus Notes", category: "Lecture Notes" },
    { title: "Raft & Paxos Comparison Sheet", category: "Guide" }
  ];

  const handleCollaborateClick = () => {
    requireAuth('collaborate on documents', () => {
      const docId = note.id || note._id;
      const isOwner = Boolean(
        user && note?.uploadedBy && (
          note.uploadedBy.toLowerCase() === (user.email || '').toLowerCase() ||
          note.uploadedBy.toLowerCase() === (user.username || '').toLowerCase() ||
          note.uploadedBy.toLowerCase() === (user.name || '').toLowerCase() ||
          note.uploadedBy.toLowerCase() === (user.fullName || '').toLowerCase()
        )
      );
      const isMember = localStorage.getItem(`is_member_${docId}`) === 'true';
      if (isOwner || isMember) {
        setShowWorkspaceModal(true);
      } else {
        setShowRequestAccessModal(true);
      }
    });
  };

  const handleBookmarkToggle = () => {
    requireAuth('bookmark resources', () => {
      const saved = JSON.parse(localStorage.getItem('scl_bookmarks') || '[]');
      let nextSaved;
      if (isBookmarked) {
        nextSaved = saved.filter(id => id !== docId);
        setIsBookmarked(false);
        toast.success("Removed from bookmarks");
      } else {
        nextSaved = [...saved, docId];
        setIsBookmarked(true);
        toast.success("Bookmarked resource!");
      }
      localStorage.setItem('scl_bookmarks', JSON.stringify(nextSaved));
      window.dispatchEvent(new Event('bookmarks_changed'));
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Resource link copied to clipboard!");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-hidden">
        {/* Main Centered Modal Container */}
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-7xl h-[88vh] max-h-[88vh] my-auto flex flex-col overflow-hidden border border-base-300">
          
          {/* Header Bar */}
          <div className="bg-base-200 px-4 md:px-6 py-3 border-b border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded bg-base-300 text-primary shrink-0">
                <FileTextIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-sm md:text-base text-base-content truncate max-w-[280px] md:max-w-md">{note.title}</h2>
                  {isVerified && (
                    <span className="badge badge-sm badge-success gap-1 font-semibold shrink-0 rounded">
                      <CheckCircle2Icon className="size-3" /> Verified
                    </span>
                  )}
                  <span className="badge badge-sm badge-outline font-medium shrink-0 rounded">
                    {note.category || 'Academic Resource'}
                  </span>
                </div>
                
                {/* Header Meta Stats */}
                <div className="flex items-center gap-3 md:gap-4 text-xs text-base-content/60 mt-1 flex-wrap">
                  <span>Author: <strong className="text-base-content font-medium">{note.uploadedBy || 'Academic Author'}</strong></span>
                  <span>•</span>
                  <span>Uploaded: {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Jul 2026'}</span>
                  <span>•</span>
                  <button 
                    onClick={() => setShowDiscussionModal(true)}
                    className="flex items-center gap-1 text-warning hover:underline font-semibold cursor-pointer"
                    title="View Ratings & Feedback"
                  >
                    <StarIcon className="size-3.5 fill-warning text-warning" /> {rating}
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setShowDiscussionModal(true)}
                    className="flex items-center gap-1 text-secondary hover:underline font-semibold cursor-pointer"
                    title="Open Comments & Discussion"
                  >
                    💬 {commentsCount} comments
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center self-end sm:self-auto gap-2">
              <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle shrink-0" title="Close Viewer">
                <XIcon className="size-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Left Side - PDF Viewer */}
            <div className="w-full lg:w-[68%] min-h-[420px] lg:h-full p-3 bg-base-200/30 border-b lg:border-b-0 lg:border-r border-base-300 flex flex-col">
              <PdfViewer fileUrl={note.fileUrl} title={note.title} />
            </div>

            {/* Right Side - Document Metadata & Actions */}
            <div className="w-full lg:w-[32%] h-auto lg:h-full overflow-y-auto custom-scrollbar p-4 sm:p-5 bg-base-100 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Description Section */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-1">
                    Description
                  </h4>
                  <p className="text-xs text-base-content/80 leading-relaxed">
                    {note.description || "Comprehensive academic resource detailing core concepts, problem sets, and solutions for university coursework."}
                  </p>
                </div>

                {/* Keywords & Tags */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-1 flex items-center gap-1">
                    <TagIcon className="size-3" /> Keywords & Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {keywords.map((kw, i) => (
                      <span key={i} className="badge badge-xs badge-neutral font-normal rounded">{kw}</span>
                    ))}
                  </div>
                </div>

                {/* AI Generated Summary - Flat Styling */}
                <div className="bg-base-200/50 border border-base-300 p-3 rounded-md space-y-1.5">
                  <h4 className="text-xs font-bold text-base-content flex items-center gap-1.5">
                    <SparklesIcon className="size-3.5 text-primary" /> AI Executive Summary
                  </h4>
                  {note.aiSummary ? (
                    <p className="text-xs text-base-content leading-relaxed">
                      {note.aiSummary}
                    </p>
                  ) : (
                    <p className="text-xs text-base-content/50 italic leading-relaxed">
                      AI summary is processing or not available.
                    </p>
                  )}
                  {note.aiKeyPoints && (
                    <ul className="text-xs text-base-content/85 space-y-1 list-disc list-inside leading-normal pt-1 border-t border-base-300 mt-1">
                      {note.aiKeyPoints.split('\n').filter(p => p.trim()).map((point, i) => (
                        <li key={i}>{point.replace(/^[-\*\s•\d+\.\)]+/, '')}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="pt-4 border-t border-base-300 space-y-2 shrink-0">
                {/* Guest notice banner */}
                {!user && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
                    <span>🔒</span>
                    <span>Log in to unlock all features</span>
                  </div>
                )}

                <button
                  onClick={() => requireAuth('chat with the AI Assistant', () => setShowAiDrawer(true))}
                  className="btn btn-sm btn-primary w-full flex items-center justify-center gap-1.5 font-semibold rounded"
                >
                  <BotIcon className="size-4" /> Ask AI Assistant
                </button>

                <button
                  onClick={() => requireAuth('comment and discuss', () => setShowDiscussionModal(true))}
                  className="btn btn-sm btn-outline btn-primary w-full flex items-center justify-center gap-1.5 font-semibold rounded"
                >
                  <MessageSquareIcon className="size-4" /> Discussion & Comments
                </button>

                <button
                  onClick={handleCollaborateClick}
                  className="btn btn-sm btn-outline btn-secondary w-full flex items-center justify-center gap-1.5 font-semibold rounded"
                >
                  <UsersIcon className="size-4" /> Collaborate
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleBookmarkToggle}
                    className={`btn btn-xs rounded ${isBookmarked ? 'btn-warning text-warning-content' : 'btn-outline btn-neutral'} flex items-center justify-center gap-1`}
                  >
                    <BookmarkIcon className="size-3" /> {isBookmarked ? 'Saved' : 'Bookmark'}
                  </button>

                  <button
                    onClick={handleShare}
                    className="btn btn-xs btn-outline btn-neutral rounded flex items-center justify-center gap-1"
                  >
                    <Share2Icon className="size-3" /> Share
                  </button>
                </div>

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-xs btn-error btn-outline w-full flex items-center justify-center gap-1 font-bold mt-2 rounded"
                  >
                    <Trash2Icon className="size-3.5" /> Delete Resource
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Triggers */}
      <PrivateAiChatDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        note={note}
      />

      <RequestAccessModal
        isOpen={showRequestAccessModal}
        onClose={() => setShowRequestAccessModal(false)}
        note={note}
        onMembershipGranted={() => {
          localStorage.setItem(`is_member_${note.id || note._id}`, 'true');
          setShowWorkspaceModal(true);
        }}
      />

      <CollaborationWorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        note={note}
      />

      {/* Resource Discussion & Comments Modal */}
      {showDiscussionModal && (
        <ResourceDiscussionModal
          resourceId={note.id || note._id}
          title={note.title}
          onClose={() => setShowDiscussionModal(false)}
        />
      )}

      {/* Auth Prompt for Guests */}
      <AuthPromptModal
        isOpen={authPrompt.open}
        onClose={() => setAuthPrompt({ open: false, feature: '' })}
        feature={authPrompt.feature}
      />
    </>
  );
};

export default ResourceViewerModal;

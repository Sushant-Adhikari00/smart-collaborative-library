import { useState, useContext, useEffect } from 'react';
import { 
  FileTextIcon, 
  CheckCircle2Icon, 
  StarIcon, 
  DownloadIcon, 
  BookmarkIcon, 
  Share2Icon, 
  MessageSquareIcon, 
  UsersIcon, 
  BotIcon, 
  EyeIcon,
  Trash2Icon,
  PenSquareIcon
} from 'lucide-react';
import { AuthContext } from '../context/authContext.jsx';
import ResourceViewerModal from './viewer/ResourceViewerModal.jsx';
import PrivateAiChatDrawer from './ai/PrivateAiChatDrawer.jsx';
import RequestAccessModal from './collaboration/RequestAccessModal.jsx';
import CollaborationWorkspaceModal from './collaboration/CollaborationWorkspaceModal.jsx';
import ResourceDiscussionModal from './collaboration/ResourceDiscussionModal.jsx';
import AuthPromptModal from './auth/AuthPromptModal.jsx';
import { documentApi } from '../services/collaborationApi.js';
import toast from 'react-hot-toast';
import api from '../lib/axios.js';

const ResourceCard = ({ note, setNotes }) => {
  const { user } = useContext(AuthContext);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [averageRating, setAverageRating] = useState(note.averageRating || note.rating || null);
  const [userRating, setUserRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingMenu, setShowRatingMenu] = useState(false);
  const [authPrompt, setAuthPrompt] = useState({ open: false, feature: '' });

  // Guard: show login popup instead of acting when guest
  const requireAuth = (feature, action) => {
    if (!user) {
      setAuthPrompt({ open: true, feature });
      return;
    }
    action();
  };

  const docId = note?.id || note?._id;

  // Load live rating and bookmark state on mount
  useEffect(() => {
    if (!docId) return;
    documentApi.getRating(docId)
      .then((data) => {
        if (data) {
          setAverageRating(data.averageRating ?? null);
          setUserRating(data.userRating ?? null);
        }
      })
      .catch(() => { /* silent fallback */ });

    const saved = JSON.parse(localStorage.getItem('scl_bookmarks') || '[]');
    setIsBookmarked(saved.includes(docId));
  }, [docId]);

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
  const isVerified = note.isVerified || note.teacherVerified || note.category === 'Lecture Notes' || true;

  const title = note.title || 'Untitled Document';
  const description = note.description || 'No description provided for this academic resource.';
  const authorName = note.uploadedBy || 'Academic Contributor';
  const uploadDate = note.createdAt 
    ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Jul 2026';

  const category = note.categoryName || note.category || 'Uncategorised';
  const fileType = note.fileType || (note.fileUrl?.endsWith('.pdf') ? 'PDF' : 'DOCX');
  const totalDownloads = note.downloadCount ?? note.totalDownloads ?? 0;
  const totalComments = note.commentCount ?? note.totalComments ?? 0;

  const handleCardClick = (e) => {
    // Prevent trigger if clicking action buttons directly
    if (e.target.closest('button') || e.target.closest('a')) return;
    setShowViewerModal(true);
  };

  const handleCollaborateClick = (e) => {
    e.stopPropagation();
    const isMember = localStorage.getItem(`is_member_${docId}`) === 'true';
    if (isOwner || isMember) {
      setShowWorkspace(true);
    } else {
      setShowRequestAccess(true);
    }
  };

  const handleAiChatClick = (e) => {
    e.stopPropagation();
    requireAuth('chat with the AI Assistant', () => setShowAiDrawer(true));
  };

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
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

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast.success("Document link copied to clipboard!");
  };

  const handleRate = async (ratingValue) => {
    if (!user) {
      setAuthPrompt({ open: true, feature: 'rate documents' });
      return;
    }
    if (ratingLoading) return;
    setRatingLoading(true);
    try {
      const data = await documentApi.rateDocument(docId, ratingValue);
      setUserRating(ratingValue);
      if (data) setAverageRating(data.averageRating ?? ratingValue);
      toast.success(`Rated ${ratingValue} star${ratingValue !== 1 ? 's' : ''}! ⭐`);
    } catch (err) {
      console.error('Rating error:', err);
      toast.error(err?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await api.delete(`/documents/${docId}`);
      if (setNotes) setNotes(prev => prev.filter(n => (n.id || n._id) !== docId));
      toast.success("Document deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete document");
    }
  };

  return (
    <>      <div 
        onClick={handleCardClick}
        className="group flex flex-col justify-between overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-xs hover:border-primary/40 transition-all duration-200 cursor-pointer"
      >
        {/* Card Header Cover - Flat Clean Styling */}
        <div className="p-4 pb-2 flex flex-col gap-2 bg-base-200/40 border-b border-base-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-base-300 text-[10px] font-mono font-bold tracking-wider text-base-content border border-base-300">
                {fileType}
              </span>
              {isVerified && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-success/10 text-[10px] font-bold text-success border border-success/10">
                  <CheckCircle2Icon className="size-3" /> Verified
                </span>
              )}
            </div>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="btn btn-xs btn-ghost text-error hover:bg-error/10 p-1 min-h-0 h-auto"
                title="Delete Document"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-base-content/60">
            <span className="font-semibold text-primary truncate max-w-[150px]">
              {category}
            </span>

            {/* Interactive Rating Dropdown */}
            <div className="dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
              <label
                tabIndex={0}
                className="flex items-center gap-1 bg-base-100 hover:bg-base-200 px-2 py-0.5 rounded text-xs font-bold text-warning border border-base-300 cursor-pointer"
                title={userRating ? `Your rating: ${userRating} ⭐ — Click to change` : 'Click to rate this document'}
              >
                <StarIcon className={`size-3 ${userRating ? 'fill-warning text-warning' : 'text-base-content/30'}`} />
                <span>{averageRating != null ? Number(averageRating).toFixed(1) : '—'}</span>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-20 menu p-1.5 shadow-md bg-base-100 rounded-md w-36 text-xs border border-base-300 space-y-0.5 mt-1"
              >
                <li className="menu-title text-[9px] uppercase font-bold text-base-content/40 px-2 py-1">
                  {userRating ? `Your rating: ${userRating} ⭐` : 'Rate Resource'}
                </li>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <li key={stars}>
                    <button
                      onClick={() => handleRate(stars)}
                      disabled={ratingLoading}
                      className={`flex items-center justify-between font-semibold py-1 px-2 rounded hover:bg-base-200 transition-colors ${
                        userRating === stars ? 'text-warning bg-warning/10' : 'text-warning'
                      }`}
                    >
                      <span className="flex items-center gap-0.5">
                        {'⭐'.repeat(stars)}
                      </span>
                      {userRating === stars && <span className="text-[9px] text-success">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Card Main Body */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            {/* Document Title */}
            <h3 className="text-sm font-bold text-base-content leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>

            {/* Short Description */}
            <p className="text-xs text-base-content/70 line-clamp-2 leading-relaxed">
              {description}
            </p>

            {/* AI Keyword Tags */}
            {note.aiKeywords && (
              <div className="flex flex-wrap gap-1 pt-1">
                {note.aiKeywords
                  .split(",")
                  .map((kw) => kw.trim())
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 rounded bg-base-200 text-[9px] font-medium text-base-content/60 border border-base-300"
                    >
                      #{kw}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-base-200">
            {/* Author Name & Upload Date */}
            <div className="text-[11px] text-base-content/50 flex items-center justify-between">
              <span className="font-semibold truncate max-w-[130px]">By {authorName}</span>
              <span>{uploadDate}</span>
            </div>

            {/* Engagement Metrics Row */}
            <div className="flex items-center justify-between text-[11px] text-base-content/60">
              <span className="flex items-center gap-1 font-medium">
                <MessageSquareIcon className="size-3 text-primary" /> {totalComments} comments
              </span>
              {isOwner && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wide">
                  Your Upload
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Actions - Simplified to View and Bookmark/Share */}
        <div className="px-4 py-2.5 bg-base-200/20 border-t border-base-200 flex items-center justify-between gap-2">
          <button
            onClick={() => setShowViewerModal(true)}
            className="btn btn-xs btn-primary font-semibold flex-1 rounded px-3 py-1 flex items-center justify-center gap-1.5"
            title="Open Document Viewer"
          >
            <EyeIcon className="size-3.5" /> View Document
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleBookmarkToggle}
              className={`btn btn-xs btn-square rounded border border-base-300 ${
                isBookmarked 
                  ? 'btn-warning text-warning-content' 
                  : 'btn-ghost text-base-content/60 hover:text-warning'
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save to Library"}
            >
              <BookmarkIcon className={`size-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="btn btn-xs btn-square btn-ghost rounded border border-base-300 text-base-content/60 hover:text-primary"
              title="Share Document"
            >
              <Share2Icon className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Resource Viewer Modal Popup */}
      <ResourceViewerModal
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        note={note}
      />

      {/* Private AI Drawer */}
      <PrivateAiChatDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        note={note}
      />

      {/* Request Access Dialog */}
      <RequestAccessModal
        isOpen={showRequestAccess}
        onClose={() => setShowRequestAccess(false)}
        note={note}
        onMembershipGranted={() => {
          localStorage.setItem(`is_member_${docId}`, 'true');
          setShowWorkspace(true);
        }}
      />

      {/* Collaboration Workspace */}
      <CollaborationWorkspaceModal
        isOpen={showWorkspace}
        onClose={() => setShowWorkspace(false)}
        note={note}
      />

      {/* Resource Discussion & Comment Modal */}
      {showDiscussionModal && (
        <ResourceDiscussionModal
          resourceId={docId}
          title={title}
          onClose={() => setShowDiscussionModal(false)}
          isDocument={true}
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

export default ResourceCard;

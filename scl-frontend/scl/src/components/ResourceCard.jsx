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

  const docId = note?.id || note?._id;

  // Load live rating on mount
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
    setShowAiDrawer(true);
  };

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Bookmarked resource!");
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    toast.success("Document link copied to clipboard!");
  };

  const handleRate = async (ratingValue) => {
    if (!user) { toast.error('Please log in to rate'); return; }
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
    <>
      <div 
        onClick={handleCardClick}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
      >
        {/* Card Header Cover Gradient */}
        <div className="relative h-28 w-full bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4 flex flex-col justify-between border-b border-base-content/5">
          {/* File Type, Verified Status, and Top Delete Action */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-base-200/80 text-[10px] font-mono font-bold tracking-wider text-base-content border border-base-content/5 shadow-2xs">
                {fileType}
              </span>
              {isVerified && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/10 text-[10px] font-bold text-success border border-success/20 shadow-2xs">
                  <CheckCircle2Icon className="size-3" /> Verified
                </span>
              )}
            </div>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="btn btn-xs btn-error btn-outline hover:btn-error gap-1 px-2 text-[10px] font-bold shadow-sm z-10"
                title="Delete Document"
              >
                <Trash2Icon className="size-3" /> Delete
              </button>
            )}
          </div>

          {/* Category & Rating */}
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-base-100/90 text-[10px] font-semibold text-base-content/70 border border-base-content/5 shadow-2xs">
              {category}
            </span>

            {/* Interactive Rating Dropdown */}
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 bg-base-100/90 hover:bg-base-100 px-2.5 py-0.5 rounded-full text-xs font-bold text-warning border border-base-content/5 cursor-pointer transition-colors shadow-2xs"
                title={userRating ? `Your rating: ${userRating} ⭐ — Click to change` : 'Click to rate this document'}
              >
                <StarIcon className={`size-3 ${userRating ? 'fill-warning text-warning' : 'text-base-content/30'}`} />
                <span>{averageRating != null ? Number(averageRating).toFixed(1) : '—'}</span>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-20 menu p-2 shadow-xl bg-base-100 rounded-xl w-40 text-xs border border-base-content/10 space-y-1 mt-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <li className="menu-title text-[10px] uppercase font-bold text-base-content/40 px-2 py-1">
                  {userRating ? `Your rating: ${userRating} ⭐` : 'Rate Resource'}
                </li>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <li key={stars}>
                    <button
                      onClick={() => handleRate(stars)}
                      disabled={ratingLoading}
                      className={`flex items-center justify-between font-semibold py-1.5 px-2.5 rounded-lg transition-colors ${
                        userRating === stars ? 'text-warning bg-warning/10' : 'text-warning hover:bg-base-200'
                      }`}
                    >
                      <span className="flex items-center gap-1">
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
        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Document Title */}
            <h3 className="text-sm font-bold text-base-content leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>

            {/* Short Description */}
            <p className="text-[11px] text-base-content/70 line-clamp-2 leading-relaxed">
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
                      className="px-2 py-0.5 rounded-full bg-primary/5 text-[9px] font-bold text-primary border border-primary/10 tracking-wide"
                    >
                      #{kw}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-base-content/5">
            {/* Author Name & Upload Date */}
            <div className="text-[10px] text-base-content/50 flex items-center justify-between">
              <span className="font-semibold truncate max-w-[130px]">By {authorName}</span>
              <span>{uploadDate}</span>
            </div>

            {/* Engagement Metrics Row */}
            <div className="flex items-center gap-3 text-[10px] text-base-content/60">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDiscussionModal(true);
                }}
                className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer font-medium"
                title="Open Comments & Discussion"
              >
                <MessageSquareIcon className="size-3 text-secondary" /> {totalComments} Comments
              </button>
              {isOwner && (
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold ml-auto uppercase tracking-wide">
                  Yours
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="px-3.5 py-2 bg-base-200/30 border-t border-base-content/5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowViewerModal(true)}
              className="px-2.5 py-1 rounded-md text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
              title="View Resource Modal"
            >
              <EyeIcon className="size-3.5" /> View
            </button>

            {user && (
              <>
                <button
                  onClick={handleAiChatClick}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold text-secondary hover:bg-secondary/10 transition-colors flex items-center gap-1"
                  title="Chat with AI"
                >
                  <BotIcon className="size-3.5" /> AI
                </button>

                <button
                  onClick={handleCollaborateClick}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold text-accent hover:bg-accent/10 transition-colors flex items-center gap-1"
                  title="Collaborate"
                >
                  <UsersIcon className="size-3.5" /> Collaborate
                </button>
              </>
            )}
          </div>

          {/* Icon Quick Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDiscussionModal(true);
              }}
              className="p-1 rounded-md text-base-content/40 hover:text-primary hover:bg-base-200/50 transition-colors"
              title="Comments & Discussion"
            >
              <MessageSquareIcon className="size-3.5" />
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`p-1 rounded-md transition-colors ${isBookmarked ? 'text-warning hover:bg-warning/10' : 'text-base-content/40 hover:text-warning hover:bg-base-200/50'}`}
              title="Bookmark"
            >
              <BookmarkIcon className={`size-3.5 ${isBookmarked ? 'fill-warning' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-1 rounded-md text-base-content/40 hover:text-primary hover:bg-base-200/50 transition-colors"
              title="Share"
            >
              <Share2Icon className="size-3.5" />
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md text-error hover:bg-error/10 border border-error/20 flex items-center gap-1 text-[10px] font-bold transition-all"
                title="Delete Document"
              >
                <Trash2Icon className="size-3.5" /> Delete
              </button>
            )}
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
          isDocument={true}
          onClose={() => setShowDiscussionModal(false)}
        />
      )}
    </>
  );
};

export default ResourceCard;

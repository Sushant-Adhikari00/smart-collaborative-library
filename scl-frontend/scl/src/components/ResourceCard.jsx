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

  const isOwner = Boolean(
    user && note?.uploadedBy && (
      note.uploadedBy.toLowerCase() === (user.email || '').toLowerCase() ||
      note.uploadedBy.toLowerCase() === (user.username || '').toLowerCase() ||
      note.uploadedBy.toLowerCase() === (user.name || '').toLowerCase() ||
      note.uploadedBy.toLowerCase() === (user.fullName || '').toLowerCase()
    )
  );
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
        className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary/40 cursor-pointer overflow-hidden group flex flex-col justify-between"
      >
        {/* Card Header Thumbnail / Gradient Cover */}
        <div className="h-28 bg-gradient-to-r from-primary/15 via-secondary/15 to-accent/15 relative p-4 flex flex-col justify-between group-hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between gap-2">
            <span className="badge badge-sm badge-neutral font-mono font-medium shadow-xs">{fileType}</span>
            {isVerified && (
              <span className="badge badge-sm badge-success gap-1 font-semibold shadow-xs">
                <CheckCircle2Icon className="size-3" /> Verified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="badge badge-sm badge-outline bg-base-100/80 backdrop-blur-xs text-[10px] font-medium">
              {category}
            </span>

            {/* Interactive Rating Dropdown */}
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-base-100/90 hover:bg-base-100 backdrop-blur-xs px-2 py-0.5 rounded-full text-xs font-bold text-warning border border-base-300 cursor-pointer transition-colors"
                title={userRating ? `Your rating: ${userRating} ⭐ — Click to change` : 'Click to rate this document'}
              >
                <StarIcon className={`size-3 ${userRating ? 'fill-warning' : 'fill-base-300'}`} />
                <span>{averageRating != null ? Number(averageRating).toFixed(1) : '—'}</span>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-20 menu p-2 shadow-xl bg-base-100 rounded-box w-40 text-xs border border-base-300 space-y-1 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <li className="menu-title text-[10px] uppercase font-bold text-base-content/50 px-1">
                  {userRating ? `Your rating: ${userRating} ⭐` : 'Rate Resource'}
                </li>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <li key={stars}>
                    <button
                      onClick={() => handleRate(stars)}
                      disabled={ratingLoading}
                      className={`flex items-center justify-between font-semibold py-1 px-2 ${
                        userRating === stars ? 'text-warning bg-warning/10 rounded' : 'text-warning'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {'⭐'.repeat(stars)} {stars}
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
        <div className="card-body p-4 space-y-2 flex-1">
          {/* Document Title */}
          <h3 className="card-title text-sm font-bold text-base-content group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Short Description (2-3 lines) */}
          <p className="text-xs text-base-content/75 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* AI Keyword Tags */}
          {note.aiKeywords && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {note.aiKeywords
                .split(",")
                .map((kw) => kw.trim())
                .filter(Boolean)
                .slice(0, 4)
                .map((kw) => (
                  <span
                    key={kw}
                    className="badge badge-xs bg-primary/10 text-primary border border-primary/20 font-medium"
                  >
                    #{kw}
                  </span>
                ))}
            </div>
          )}

          {/* Author Name & Upload Date */}
          <div className="text-[11px] text-base-content/50 pt-1 flex items-center justify-between border-t border-base-200">
            <span className="font-medium truncate max-w-[140px]">By {authorName}</span>
            <span>{uploadDate}</span>
          </div>

          {/* Engagement Metrics Row */}
          <div className="flex items-center gap-3 text-[11px] text-base-content/60 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDiscussionModal(true);
              }}
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
              title="Open Comments & Discussion"
            >
              <MessageSquareIcon className="size-3 text-secondary" /> {totalComments} Comments
            </button>
            {isOwner && (
              <span className="badge badge-xs badge-primary ml-auto font-normal">Yours</span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="px-4 py-2.5 bg-base-200/50 border-t border-base-300 flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowViewerModal(true)}
              className="btn btn-ghost btn-xs text-primary gap-1"
              title="View Resource Modal"
            >
              <EyeIcon className="size-3.5" /> View
            </button>

            {user && (
              <>
                <button
                  onClick={handleAiChatClick}
                  className="btn btn-ghost btn-xs text-secondary gap-1"
                  title="Chat with AI"
                >
                  <BotIcon className="size-3.5" /> AI
                </button>

                <button
                  onClick={handleCollaborateClick}
                  className="btn btn-ghost btn-xs text-accent gap-1"
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
              className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-primary"
              title="Comments & Discussion"
            >
              <MessageSquareIcon className="size-3.5" />
            </button>

            <button
              onClick={handleBookmarkToggle}
              className={`btn btn-ghost btn-xs btn-square ${isBookmarked ? 'text-warning' : 'text-base-content/50'}`}
              title="Bookmark"
            >
              <BookmarkIcon className="size-3.5" />
            </button>

            <button
              onClick={handleShare}
              className="btn btn-ghost btn-xs btn-square text-base-content/50"
              title="Share"
            >
              <Share2Icon className="size-3.5" />
            </button>

            {isOwner && (
              <button
                onClick={handleDelete}
                className="btn btn-ghost btn-xs btn-square text-error"
                title="Delete Document"
              >
                <Trash2Icon className="size-3.5" />
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

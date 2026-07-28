import { useState, useContext } from 'react';
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
  BookOpenIcon 
} from 'lucide-react';
import PdfViewer from './PdfViewer.jsx';
import PrivateAiChatDrawer from '../ai/PrivateAiChatDrawer.jsx';
import RequestAccessModal from '../collaboration/RequestAccessModal.jsx';
import CollaborationWorkspaceModal from '../collaboration/CollaborationWorkspaceModal.jsx';
import ResourceDiscussionModal from '../collaboration/ResourceDiscussionModal.jsx';
import { AuthContext } from '../../context/authContext.jsx';
import toast from 'react-hot-toast';

const ResourceViewerModal = ({ isOpen, onClose, note }) => {
  const { user } = useContext(AuthContext);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);

  if (!isOpen || !note) return null;

  const isVerified = note.isVerified || note.teacherVerified || note.category === 'Lecture Notes' || true;
  const rating = note.rating || note.averageRating || 4.8;
  const downloads = note.downloadCount || note.totalDownloads || 142;
  const commentsCount = note.commentCount || note.totalComments || 18;

  const keywords = note.keywords || ["Distributed Systems", "Consensus", "Fault Tolerance", "Microservices"];
  const relatedDocs = note.relatedDocs || [
    { title: "Advanced Distributed Consensus Notes", category: "Lecture Notes" },
    { title: "Raft & Paxos Comparison Sheet", category: "Guide" }
  ];

  const handleCollaborateClick = () => {
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
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Bookmarked resource!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Resource link copied to clipboard!");
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-hidden">
        {/* Main 80-90% Modal Container */}
        <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-7xl h-[88vh] flex flex-col overflow-hidden border border-base-300">
          
          {/* Header Bar */}
          <div className="bg-base-200/90 px-6 py-3 border-b border-base-300 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileTextIcon className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base text-base-content truncate">{note.title}</h2>
                  {isVerified && (
                    <span className="badge badge-sm badge-success gap-1 font-semibold shrink-0">
                      <CheckCircle2Icon className="size-3" /> Teacher Verified
                    </span>
                  )}
                  <span className="badge badge-sm badge-outline font-medium shrink-0">
                    {note.category || 'Academic Resource'}
                  </span>
                </div>
                
                {/* Header Meta Stats */}
                <div className="flex items-center gap-4 text-xs text-base-content/60 mt-0.5 flex-wrap">
                  <span>Author: <strong className="text-base-content font-medium">{note.uploadedBy || 'Academic Author'}</strong></span>
                  <span>•</span>
                  <span>Uploaded: {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Jul 2026'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-warning font-semibold">
                    <StarIcon className="size-3.5 fill-warning" /> {rating}
                  </span>
                  <span>•</span>
                  <span>💬 {commentsCount} comments</span>
                </div>
              </div>
            </div>

            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle shrink-0" title="Close Viewer">
              <XIcon className="size-5" />
            </button>
          </div>

          {/* Modal Main Body (Left 68% PDF, Right 32% Info/Actions - Stacked on Mobile) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Left Side - PDF Viewer */}
            <div className="w-full lg:w-[68%] min-h-[420px] lg:h-full p-3 bg-base-300/40 border-b lg:border-b-0 lg:border-r border-base-300 flex flex-col">
              <PdfViewer fileUrl={note.fileUrl} title={note.title} />
            </div>

            {/* Right Side - Document Metadata & Actions */}
            <div className="w-full lg:w-[32%] h-auto lg:h-full overflow-y-auto p-4 sm:p-5 bg-base-100 flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                {/* Description Section */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1.5">
                    Description
                  </h4>
                  <p className="text-xs text-base-content/80 leading-relaxed">
                    {note.description || "Comprehensive academic resource detailing core concepts, problem sets, and solutions for university coursework."}
                  </p>
                </div>

                {/* Keywords & Tags */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1.5 flex items-center gap-1">
                    <TagIcon className="size-3" /> Keywords & Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw, i) => (
                      <span key={i} className="badge badge-xs badge-neutral font-normal">{kw}</span>
                    ))}
                  </div>
                </div>

                {/* AI Generated Summary */}
                <div className="bg-secondary/5 border border-secondary/20 p-3 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold text-secondary flex items-center gap-1.5">
                    <SparklesIcon className="size-3.5" /> AI Executive Summary
                  </h4>
                  <ul className="text-[11px] text-base-content/80 space-y-1 list-disc list-inside leading-normal">
                    <li>Covers architectural models and distributed algorithms.</li>
                    <li>Includes step-by-step mathematical proofs.</li>
                    <li>Highlights practical trade-offs in cloud deployments.</li>
                  </ul>
                </div>

                {/* Related Documents */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1.5 flex items-center gap-1">
                    <BookOpenIcon className="size-3" /> Related Resources
                  </h4>
                  <div className="space-y-1.5">
                    {relatedDocs.map((doc, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-base-200/60 border border-base-300 text-xs flex justify-between items-center">
                        <span className="truncate font-medium text-primary">{doc.title}</span>
                        <span className="badge badge-xs badge-ghost">{doc.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="pt-4 border-t border-base-300 space-y-2.5 shrink-0">
                <button
                  onClick={() => setShowAiDrawer(true)}
                  className="btn btn-sm btn-secondary w-full flex items-center justify-center gap-2 font-semibold shadow-xs"
                >
                  <BotIcon className="size-4" /> Chat with AI (NotebookLM)
                </button>

                <button
                  onClick={() => setShowDiscussionModal(true)}
                  className="btn btn-sm btn-primary w-full flex items-center justify-center gap-2 font-semibold shadow-xs"
                >
                  <MessageSquareIcon className="size-4" /> Discussion & Comments
                </button>

                <button
                  onClick={handleCollaborateClick}
                  className="btn btn-sm btn-accent w-full flex items-center justify-center gap-2 font-semibold shadow-xs"
                >
                  <UsersIcon className="size-4" /> Collaborate
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleBookmarkToggle}
                    className={`btn btn-xs btn-outline ${isBookmarked ? 'btn-warning' : 'btn-ghost'} flex items-center justify-center gap-1`}
                  >
                    <BookmarkIcon className="size-3" /> {isBookmarked ? 'Saved' : 'Bookmark'}
                  </button>

                  <button
                    onClick={handleShare}
                    className="btn btn-xs btn-outline btn-ghost flex items-center justify-center gap-1"
                  >
                    <Share2Icon className="size-3" /> Share
                  </button>
                </div>
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
    </>
  );
};

export default ResourceViewerModal;

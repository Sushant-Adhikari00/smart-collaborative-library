import { useState, useEffect, useContext } from 'react';
import {
  PinIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  CornerDownRightIcon,
  SendIcon,
  Trash2Icon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import { AuthContext } from '../../context/authContext.jsx';

const avatarUrl = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`;

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DiscussionTab = ({ documentId }) => {
  const { user } = useContext(AuthContext);
  const [sortOption, setSortOption] = useState('newest');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch comments from backend
  const fetchComments = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/collaboration/resources/${documentId}/comments`);
      const data = res.data?.data || [];
      setComments(data);
    } catch (err) {
      console.warn('Could not load comments:', err);
      setError('Failed to load discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  // Post a top-level comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;
    setPosting(true);
    try {
      const res = await api.post(`/collaboration/resources/${documentId}/comments`, {
        content: newComment.trim(),
        parentCommentId: null
      });
      const created = res.data?.data;
      if (created) {
        setComments(prev => [{ ...created, replies: created.replies || [] }, ...prev]);
      }
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err) {
      console.error('Failed to post comment:', err);
      toast.error(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  };

  // Post a reply
  const handlePostReply = async (parentId, parentAuthor) => {
    if (!replyText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await api.post(`/collaboration/resources/${documentId}/comments`, {
        content: replyText.trim(),
        parentCommentId: parentId
      });
      const created = res.data?.data;
      if (created) {
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), created] };
          }
          return c;
        }));
      }
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply added!');
    } catch (err) {
      console.error('Failed to post reply:', err);
      toast.error(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setPosting(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/collaboration/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment.');
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const currentUserName = user?.username || user?.email || 'You';

  return (
    <div className="flex flex-col h-full space-y-4 p-4 overflow-y-auto">

      {/* Top Header & Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-base-200/50 p-3 rounded-xl border border-base-300">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-primary" />
          Academic Discussion Board
          <span className="badge badge-xs badge-neutral">{comments.length}</span>
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={fetchComments}
            disabled={loading}
            className="btn btn-ghost btn-xs btn-square"
            title="Refresh comments"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-base-content/60">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="select select-xs select-bordered bg-base-100 font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* New Comment Input – only for logged-in users */}
      {user ? (
        <form onSubmit={handlePostComment} className="space-y-2 bg-base-200/40 p-3 rounded-xl border border-base-300">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your insights, ask questions, or @mention classmates..."
            rows={2}
            className="textarea textarea-bordered w-full text-xs bg-base-100 focus:textarea-primary"
            disabled={posting}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || posting}
              className="btn btn-xs btn-primary gap-1"
            >
              {posting ? <span className="loading loading-spinner loading-xs" /> : <SendIcon className="size-3" />}
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center text-xs text-base-content/50 py-3 bg-base-200/30 rounded-xl border border-base-300">
          Log in to participate in the discussion.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <span className="loading loading-spinner loading-md text-primary" />
          <p className="text-xs text-base-content/50">Loading discussion...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-xs text-error">
          <AlertCircleIcon className="size-8" />
          <p>{error}</p>
          <button onClick={fetchComments} className="btn btn-xs btn-outline btn-error">Retry</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedComments.length === 0 && (
        <div className="text-center py-10 text-xs text-base-content/50 space-y-1">
          <MessageSquareIcon className="size-8 mx-auto text-primary/30" />
          <p className="font-medium text-base-content/60">No comments yet</p>
          <p>Be the first to start the academic discussion!</p>
        </div>
      )}

      {/* Comments List */}
      {!loading && !error && (
        <div className="space-y-3 flex-1">
          {sortedComments.map((comment) => {
            const isOwner = user && (comment.authorId === user.id || comment.authorName === currentUserName);
            return (
              <div
                key={comment.id}
                className="p-4 rounded-xl border bg-base-100 border-base-300 shadow-xs transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={comment.authorProfilePicture || avatarUrl(comment.authorName)}
                      alt={comment.authorName}
                      className="size-7 rounded-full bg-base-300"
                    />
                    <div>
                      <span className="font-semibold text-xs text-base-content">
                        {comment.authorName || 'Anonymous'}
                      </span>
                      <span className="text-[10px] text-base-content/50 block">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="btn btn-ghost btn-xs btn-square text-error opacity-0 group-hover:opacity-100 hover:opacity-100"
                      title="Delete comment"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Comment Body */}
                <p className="text-xs text-base-content/90 leading-relaxed whitespace-pre-wrap pl-9">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 pl-9 mt-3 text-xs text-base-content/60">
                  {user && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 hover:text-secondary"
                    >
                      <CornerDownRightIcon className="size-3.5" />
                      <span>Reply</span>
                    </button>
                  )}
                </div>

                {/* Inline Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-3 pl-9 space-y-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.authorName}...`}
                      className="input input-xs input-bordered w-full bg-base-200 text-xs"
                      autoFocus
                      disabled={posting}
                    />
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="btn btn-xs btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.id, comment.authorName)}
                        disabled={!replyText.trim() || posting}
                        className="btn btn-xs btn-secondary gap-1"
                      >
                        {posting ? <span className="loading loading-spinner loading-xs" /> : <SendIcon className="size-3" />}
                        Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-9 space-y-2 border-l-2 border-base-300 ml-3">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-base-200/40 p-2.5 rounded-lg border border-base-300 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={reply.authorProfilePicture || avatarUrl(reply.authorName)}
                              alt={reply.authorName}
                              className="size-5 rounded-full bg-base-300"
                            />
                            <span className="font-semibold text-primary">{reply.authorName || 'Anonymous'}</span>
                          </div>
                          <span className="text-[10px] text-base-content/40">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="text-base-content/80">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiscussionTab;

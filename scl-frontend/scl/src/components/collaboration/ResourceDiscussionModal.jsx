import React, { useState, useEffect, useContext } from 'react';
import { collaborationApi, documentApi } from '../../services/collaborationApi';
import { MessageSquare, Send, CornerDownRight, Trash2, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/authContext';

const avatarUrl = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`;

/**
 * ResourceDiscussionModal
 *
 * Props:
 *   resourceId  — ID of the document or group resource
 *   onClose     — close callback
 *   title       — display title
 *   isDocument  — if true, uses /documents/:id/comments (library docs)
 *                 if false/undefined, uses /collaboration/resources/:id/comments (group resources)
 */
export default function ResourceDiscussionModal({ resourceId, onClose, title, isDocument = true }) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Pick the right API based on prop
  const api = isDocument ? documentApi : collaborationApi;
  const getCommentsCall = isDocument
    ? () => documentApi.getComments(resourceId)
    : () => collaborationApi.getResourceComments(resourceId);
  const addCommentCall = isDocument
    ? (content, parentId) => documentApi.addComment(resourceId, content, parentId)
    : (content, parentId) => collaborationApi.addComment(resourceId, content, parentId);
  const deleteCommentCall = isDocument
    ? (commentId) => documentApi.deleteComment(commentId)
    : (commentId) => collaborationApi.deleteComment(commentId);

  const fetchComments = async () => {
    if (!resourceId) return;
    try {
      setLoading(true);
      const data = await getCommentsCall();
      setComments(data || []);
    } catch (err) {
      console.warn('Could not load comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [resourceId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) { toast.error('Please log in to comment'); return; }

    try {
      await addCommentCall(newComment.trim(), null);
      setNewComment('');
      toast.success('Comment posted!');
      fetchComments();
    } catch (err) {
      console.error('Comment post error:', err);
      toast.error(err?.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    if (!user) { toast.error('Please log in to reply'); return; }

    try {
      await addCommentCall(replyText.trim(), parentCommentId);
      setReplyText('');
      setReplyingToId(null);
      toast.success('Reply posted!');
      fetchComments();
    } catch (err) {
      console.error('Reply post error:', err);
      toast.error(err?.response?.data?.message || 'Failed to post reply');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteCommentCall(commentId);
      toast.success('Comment deleted');
      fetchComments();
    } catch (err) {
      toast.error('Permission denied to delete comment');
    }
  };

  if (!resourceId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[92vh] sm:max-h-[85vh] flex flex-col text-base-content">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 pb-3 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <MessageSquare className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-base-content flex items-center gap-1.5 flex-wrap">
                Discussion &amp; Comments
                <span className="badge badge-xs badge-neutral">{comments.length}</span>
              </h3>
              {title && <p className="text-[11px] sm:text-xs text-base-content/60 truncate max-w-[180px] sm:max-w-md">{title}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={fetchComments} disabled={loading} className="btn btn-ghost btn-xs btn-square" title="Refresh">
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-xs btn-square" title="Close">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Comment Thread List */}
        <div className="flex-1 overflow-y-auto space-y-3 p-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <span className="loading loading-spinner loading-md text-primary" />
              <p className="text-xs text-base-content/50">Loading discussion comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-base-content/50 text-xs space-y-1">
              <MessageSquare className="size-8 mx-auto text-primary/30" />
              <p className="font-semibold text-base-content/70">No comments on this resource yet</p>
              <p>Be the first to share insights or ask questions below!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-3 sm:p-3.5 rounded-xl bg-base-200/40 border border-base-300 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={comment.authorProfilePicture || avatarUrl(comment.authorName)}
                      alt={comment.authorName}
                      className="size-6 sm:size-7 rounded-full bg-base-300 shrink-0"
                      onError={(e) => { e.currentTarget.src = avatarUrl(comment.authorName); }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-base-content block truncate">{comment.authorName || 'Anonymous'}</span>
                      <span className="text-[9px] sm:text-[10px] text-base-content/50 block">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>

                  {user && (comment.authorId === user.id || comment.authorName === user.username || comment.authorName === user.fullName) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="btn btn-ghost btn-xs btn-square text-error shrink-0"
                      title="Delete comment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-base-content/90 leading-relaxed sm:pl-8">{comment.content}</p>

                {/* Reply Trigger */}
                {user && (
                  <div className="sm:pl-8 pt-1">
                    <button
                      onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <CornerDownRight className="size-3" /> Reply
                    </button>
                  </div>
                )}

                {/* Inline Reply Form */}
                {replyingToId === comment.id && (
                  <div className="sm:pl-8 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddReply(comment.id); }}
                      placeholder="Write a reply..."
                      className="input input-xs input-bordered flex-1 bg-base-100 text-xs focus:input-primary"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="btn btn-xs btn-primary w-full sm:w-auto"
                    >
                      Reply
                    </button>
                  </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="sm:pl-8 space-y-2 pt-2 border-l-2 border-base-300 ml-2 sm:ml-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-2 sm:p-2.5 rounded-lg bg-base-100 border border-base-300 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{reply.authorName || 'Anonymous'}</span>
                          <span className="text-[10px] text-base-content/40">
                            {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : 'Recently'}
                          </span>
                        </div>
                        <p className="text-base-content/80">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Main Comment Form */}
        {user ? (
          <form onSubmit={handleAddComment} className="pt-3 border-t border-base-300 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or ask a question..."
              className="input input-sm input-bordered flex-1 bg-base-200/50 text-xs focus:input-primary"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="btn btn-sm btn-primary gap-1 w-full sm:w-auto"
            >
              <Send className="size-4" /> Post Comment
            </button>
          </form>
        ) : (
          <div className="text-center text-xs text-base-content/50 py-2 border-t border-base-300 shrink-0">
            Log in to post comments and join the discussion.
          </div>
        )}
      </div>
    </div>
  );
}

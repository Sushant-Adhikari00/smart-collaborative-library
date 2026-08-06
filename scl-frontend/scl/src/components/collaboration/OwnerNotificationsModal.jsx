import { useState, useEffect } from 'react';
import {
  BellIcon,
  XIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  MailOpenIcon,
  UsersIcon,
  SparklesIcon,
  CheckIcon,
  XCircleIcon,
  CheckCircle2Icon,
  ClockIcon
} from 'lucide-react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────────────────────────

const typeIcon = (type) => {
  switch (type) {
    case 'COLLABORATION_REQUEST': return <UsersIcon className="size-3.5 text-accent" />;
    case 'COLLABORATION_ACCEPTED': return <CheckCircle2Icon className="size-3.5 text-success" />;
    case 'COLLABORATION_REJECTED': return <XCircleIcon className="size-3.5 text-error" />;
    case 'MEMBER_JOINED':
    case 'MEMBER_LEFT': return <UsersIcon className="size-3.5 text-secondary" />;
    case 'GROUP_INVITE': return <SparklesIcon className="size-3.5 text-secondary" />;
    default: return <BellIcon className="size-3.5 text-primary" />;
  }
};

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Recently';
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Parse the request ID from targetUrl like "/collaboration/requests/42" */
const parseRequestId = (targetUrl) => {
  if (!targetUrl) return null;
  const match = targetUrl.match(/\/collaboration\/requests\/(\d+)/);
  return match ? match[1] : null;
};

// ─── Component ───────────────────────────────────────────────────────────────

const OwnerNotificationsModal = ({ isOpen, onClose, onCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState(null); // which notification is being actioned

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const data = res.data?.data || [];
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      if (onCountChange) onCountChange(unread);
    } catch (err) {
      console.warn('Could not load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchNotifications();
  }, [isOpen]);

  // Mark a single notification as read
  const markRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
      );
      const newUnread = notifications.filter(n => !n.isRead && n.id !== notifId).length;
      if (onCountChange) onCountChange(newUnread);
    } catch (err) {
      console.warn('Mark read failed:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onCountChange) onCountChange(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.warn('Mark all read failed:', err);
      toast.error('Could not mark all as read. Please try again.');
    }
  };

  // Accept a collaboration request
  const handleAccept = async (notif) => {
    const requestId = parseRequestId(notif.targetUrl);
    if (!requestId) {
      toast.error('Could not identify the request to accept.');
      return;
    }
    setActioningId(notif.id);
    try {
      await api.post(`/collaboration/requests/${requestId}/accept`);
      // Mark the notification as read and tag it as resolved in local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notif.id
            ? { ...n, isRead: true, _resolved: 'ACCEPTED' }
            : n
        )
      );
      const newUnread = notifications.filter(n => !n.isRead && n.id !== notif.id).length;
      if (onCountChange) onCountChange(newUnread);
      toast.success('✅ Collaboration request accepted! The user has been notified.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept request.';
      toast.error(msg);
    } finally {
      setActioningId(null);
    }
  };

  // Reject a collaboration request
  const handleReject = async (notif) => {
    const requestId = parseRequestId(notif.targetUrl);
    if (!requestId) {
      toast.error('Could not identify the request to reject.');
      return;
    }
    setActioningId(notif.id);
    try {
      await api.post(`/collaboration/requests/${requestId}/reject`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notif.id
            ? { ...n, isRead: true, _resolved: 'REJECTED' }
            : n
        )
      );
      const newUnread = notifications.filter(n => !n.isRead && n.id !== notif.id).length;
      if (onCountChange) onCountChange(newUnread);
      toast.success('Request rejected.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject request.';
      toast.error(msg);
    } finally {
      setActioningId(null);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-base-300">

        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BellIcon className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Notifications</h3>
              <p className="text-xs text-base-content/60">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="btn btn-xs btn-ghost text-primary gap-1"
                title="Mark all as read"
              >
                <MailOpenIcon className="size-3.5" /> All Read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="btn btn-ghost btn-xs btn-square"
              title="Refresh"
            >
              <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-xs btn-square">
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="p-4 space-y-2.5 max-h-[65vh] overflow-y-auto">
          {loading && (
            <div className="text-center py-8 space-y-2">
              <span className="loading loading-spinner loading-md text-primary" />
              <p className="text-xs text-base-content/50">Loading notifications...</p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-10 text-xs text-base-content/50 space-y-2">
              <ShieldCheckIcon className="size-10 mx-auto text-success/60" />
              <p className="font-medium text-base-content/70">No Notifications Yet</p>
              <p>Collaboration requests and updates will appear here.</p>
            </div>
          )}

          {!loading && notifications.map((notif) => {
            const isCollabRequest = notif.notificationType === 'COLLABORATION_REQUEST';
            const isPending = isCollabRequest && !notif._resolved;
            const isActioning = actioningId === notif.id;

            return (
              <div
                key={notif.id}
                className={`rounded-xl border transition-all ${
                  notif.isRead && !isPending
                    ? 'bg-base-200/40 border-base-300'
                    : 'bg-primary/5 border-primary/25'
                }`}
              >
                {/* Notification body */}
                <div
                  className="p-3.5 flex items-start gap-3 cursor-pointer"
                  onClick={() => !notif.isRead && markRead(notif.id)}
                >
                  {/* Type icon */}
                  <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${notif.isRead ? 'bg-base-300' : 'bg-primary/10'}`}>
                    {typeIcon(notif.notificationType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${notif.isRead ? 'text-base-content/70' : 'text-base-content'}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!notif.isRead && (
                          <span className="size-1.5 rounded-full bg-primary inline-block" />
                        )}
                        <span className="text-[10px] text-base-content/40">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-base-content/70 mt-0.5 leading-relaxed line-clamp-3">
                      {notif.message}
                    </p>

                    {/* Resolved badge */}
                    {notif._resolved && (
                      <span className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        notif._resolved === 'ACCEPTED'
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}>
                        {notif._resolved === 'ACCEPTED'
                          ? <><CheckCircle2Icon className="size-2.5" /> Accepted</>
                          : <><XCircleIcon className="size-2.5" /> Rejected</>
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Accept / Reject action bar — only for PENDING collaboration requests */}
                {isPending && (
                  <div className="px-3.5 pb-3.5 flex items-center gap-2 pt-0">
                    <div className="flex-1 border-t border-base-300 mt-0" />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] text-warning font-medium">
                        <ClockIcon className="size-3" /> Pending
                      </span>

                      <button
                        onClick={() => handleReject(notif)}
                        disabled={isActioning}
                        className="btn btn-xs btn-ghost text-error gap-1 border border-error/30"
                      >
                        {isActioning ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <XIcon className="size-3" />
                        )}
                        Reject
                      </button>

                      <button
                        onClick={() => handleAccept(notif)}
                        disabled={isActioning}
                        className="btn btn-xs btn-success gap-1"
                      >
                        {isActioning ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <CheckIcon className="size-3" />
                        )}
                        Accept
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {notifications.length > 0 && (
          <div className="px-4 pb-3 text-center border-t border-base-300 pt-2">
            <p className="text-[10px] text-base-content/40">
              Collaboration requests show Accept / Reject actions. Click others to mark as read.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerNotificationsModal;

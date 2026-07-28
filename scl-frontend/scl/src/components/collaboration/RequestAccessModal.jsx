import { useState, useEffect } from 'react';
import { UsersIcon, ShieldAlertIcon, XIcon, CheckCircle2Icon, SendIcon } from 'lucide-react';
import api from '../../lib/axios.js';
import toast from 'react-hot-toast';

const RequestAccessModal = ({ isOpen, onClose, note, onMembershipGranted }) => {
  const docId = note?.id || note?._id;
  const ownerName = note?.uploadedBy || "Resource Owner";
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [message, setMessage] = useState('');

  const MAX_REQUESTS = 2;

  useEffect(() => {
    if (!isOpen || !docId) return;

    const checkRequestStatus = async () => {
      setCheckingStatus(true);
      try {
        // Fetch existing request count or status for this document/group
        const res = await api.get(`/collaboration/requests/count?documentId=${docId}`);
        const count = res.data?.data?.count ?? res.data?.count ?? 0;
        setRequestCount(count);

        // Check if user is already a member
        const memberCheck = await api.get(`/collaboration/groups/check-member?documentId=${docId}`);
        if (memberCheck.data?.data?.isMember) {
          toast.success("You are already a member of this collaboration space!");
          if (onMembershipGranted) onMembershipGranted();
          onClose();
        }
      } catch (err) {
        console.warn("Error checking collaboration request status:", err);
        // Fallback: local storage tracking if backend endpoint is initializing
        const localKey = `collab_req_count_${docId}`;
        const localCount = Number(localStorage.getItem(localKey) || 0);
        setRequestCount(localCount);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkRequestStatus();
  }, [isOpen, docId, onClose, onMembershipGranted]);

  if (!isOpen) return null;

  const isLimitReached = requestCount >= MAX_REQUESTS;

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (isLimitReached) return;

    setLoading(true);
    try {
      await api.post(`/collaboration/requests`, {
        documentId: docId,
        message: message.trim() || `Request to join collaboration workspace for "${note?.title}".`
      });

      const newCount = requestCount + 1;
      setRequestCount(newCount);
      localStorage.setItem(`collab_req_count_${docId}`, newCount.toString());

      toast.success("Collaboration request sent to resource owner!");
      onClose();
    } catch (err) {
      console.error("Failed to send request:", err);
      const errorMsg = err.response?.data?.message || "Failed to send collaboration request.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-base-300">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between bg-base-200/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Request Workspace Access</h3>
              <p className="text-xs text-base-content/60">Collaboration Space</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-square">
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-sm">
          {/* Group Metadata Summary */}
          <div className="bg-base-200/60 rounded-xl p-3.5 border border-base-300 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-base-content/60">Group Name:</span>
              <span className="font-semibold text-primary">{note?.title} Group</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/60">Owner Name:</span>
              <span className="font-medium text-base-content">{ownerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/60">Current Members:</span>
              <span className="badge badge-sm badge-ghost font-medium">5 active members</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/60">Purpose:</span>
              <span className="text-base-content/80 truncate max-w-[200px]">Academic study & notes sharing</span>
            </div>
          </div>

          {/* Rule Banner & Request Counter */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            isLimitReached 
              ? 'bg-error/10 border-error/30 text-error' 
              : 'bg-info/10 border-info/30 text-info-content'
          }`}>
            <ShieldAlertIcon className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Request Limit: {requestCount} / {MAX_REQUESTS} sent
              </p>
              {isLimitReached ? (
                <p className="mt-0.5 text-error">
                  You have reached the maximum collaboration request limit.
                </p>
              ) : (
                <p className="mt-0.5 opacity-80">
                  You can send up to {MAX_REQUESTS} join requests to the owner.
                </p>
              )}
            </div>
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendRequest} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-base-content/70 mb-1">
                Message to Owner (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself or mention why you'd like to collaborate..."
                disabled={isLimitReached || loading}
                rows={3}
                className="textarea textarea-bordered w-full text-xs bg-base-200/50 focus:textarea-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLimitReached || loading || checkingStatus}
                className="btn btn-sm btn-accent flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <SendIcon className="size-4" />
                )}
                Request Access
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestAccessModal;

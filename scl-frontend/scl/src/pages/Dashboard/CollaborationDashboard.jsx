import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router';
import { collaborationApi } from '../../services/collaborationApi';
import { AuthContext } from '../../context/authContext';
import {
  Users,
  FolderOpen,
  Sparkles,
  Bell,
  Plus,
  LogIn,
  ChevronRight,
  BookOpen,
  Zap,
  Crown,
  Shield,
  CheckCircle2,
  Pin,
  BellDot,
  ArrowLeft,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CollaborationDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collaborationApi.getDashboard();
      setDashboardData(data || {});
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load collaboration data. Please check connection.");
      toast.error('Failed to load collaboration dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      setSubmitting(true);
      const group = await collaborationApi.createGroup({ name: groupName, description: groupDesc });
      toast.success(`Study group "${group.name}" created!`);
      setShowCreateModal(false);
      setGroupName('');
      setGroupDesc('');
      if (group?.id) navigate(`/collaboration/groups/${group.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    try {
      setSubmitting(true);
      const group = await collaborationApi.joinGroup(inviteCode.trim().toUpperCase());
      toast.success(`Joined study group: ${group.name}`);
      setShowJoinModal(false);
      setInviteCode('');
      if (group?.id) navigate(`/collaboration/groups/${group.id}`);
    } catch (err) {
      toast.error('Invalid invite code or group not found');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkNotifRead = async (notifId) => {
    try {
      await collaborationApi.markNotificationAsRead(notifId);
      fetchDashboard();
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-base-200/50 pb-12 text-base-content">

      {/* Header Navigation & Title Bar */}
      <div className="bg-base-100 border-b border-base-300 shadow-sm py-6 px-4">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="btn btn-ghost btn-circle btn-sm" title="Back to Library">
              <ArrowLeft className="size-5" />
            </Link>

            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
              <Users className="size-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-base-content">
                  Collaboration Hub
                </h1>
                <span className="badge badge-sm badge-primary">Study Groups</span>
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Smart Study Groups • Document Workspaces • Real-Time Collaboration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn btn-sm btn-outline gap-1.5"
            >
              <LogIn className="size-4" /> Join via Code
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-sm btn-primary gap-1.5"
            >
              <Plus className="size-4" /> Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">

        {/* Stats Row */}
        {!loading && dashboardData && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <span className="text-xs text-base-content/60 block">Active Groups</span>
                <span className="text-lg font-bold text-base-content">{dashboardData?.totalActiveGroups ?? 0}</span>
              </div>
            </div>

            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                <FolderOpen className="size-5" />
              </div>
              <div>
                <span className="text-xs text-base-content/60 block">Recent Resources</span>
                <span className="text-lg font-bold text-base-content">{dashboardData?.recentResources?.length ?? 0}</span>
              </div>
            </div>

            <div className="bg-base-100 p-4 rounded-2xl border border-base-300 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <BellDot className="size-5" />
              </div>
              <div>
                <span className="text-xs text-base-content/60 block">Unread Notifications</span>
                <span className="text-lg font-bold text-base-content">{dashboardData?.unreadNotificationsCount ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="alert alert-error shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="size-5" />
              <span>{error}</span>
            </div>
            <button onClick={fetchDashboard} className="btn btn-xs btn-outline">
              <RefreshCw className="size-3" /> Retry
            </button>
          </div>
        )}

        {/* Main Grid: Left Groups, Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column — Study Groups */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-base-content flex items-center gap-2">
                <BookOpen className="size-5 text-primary" /> Your Study Groups
              </h2>

              <button onClick={fetchDashboard} disabled={loading} className="btn btn-ghost btn-xs btn-square" title="Refresh">
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-base-100 border border-base-300 animate-pulse" />
                ))}
              </div>
            ) : !dashboardData?.activeGroups?.length ? (
              <div className="text-center py-12 bg-base-100 rounded-2xl border border-base-300 space-y-4">
                <div className="size-14 mx-auto rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40">
                  <Users className="size-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-base-content">No active study groups yet</p>
                  <p className="text-xs text-base-content/60">Create a study group or join an existing one using an 8-character invite code.</p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-sm btn-primary"
                  >
                    <Plus className="size-4" /> Create Group
                  </button>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="btn btn-sm btn-outline"
                  >
                    <LogIn className="size-4" /> Join via Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.activeGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => group?.id && navigate(`/collaboration/groups/${group.id}`)}
                    className="p-4 rounded-2xl bg-base-100 border border-base-300 hover:border-primary/40 transition-all cursor-pointer group shadow-xs hover:shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-11 rounded-xl bg-gradient-to-tr from-primary to-secondary text-primary-content font-bold text-lg flex items-center justify-center shrink-0">
                        {group?.name ? group.name.charAt(0).toUpperCase() : 'G'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-base-content truncate group-hover:text-primary transition-colors">
                            {group?.name || 'Unnamed Group'}
                          </h3>
                          {group?.currentUserRole === 'OWNER' && (
                            <span className="badge badge-xs badge-primary">Owner</span>
                          )}
                          {group?.currentUserRole === 'MODERATOR' && (
                            <span className="badge badge-xs badge-secondary">Mod</span>
                          )}
                        </div>

                        {group?.description && (
                          <p className="text-xs text-base-content/60 truncate mt-0.5">{group.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-base-content/50">
                          <span>👥 {group?.memberCount ?? 0} members</span>
                          <span>•</span>
                          <span>📁 {group?.resourceCount ?? 0} resources</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="size-5 text-base-content/40 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column — Notifications & AI Tips */}
          <div className="space-y-4">
            {/* Notifications Panel */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                  <Bell className="size-4 text-primary" /> Notifications
                </h3>
                {dashboardData?.unreadNotificationsCount > 0 && (
                  <span className="badge badge-xs badge-error">
                    {dashboardData.unreadNotificationsCount} new
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 rounded-xl bg-base-200 animate-pulse" />
                  ))}
                </div>
              ) : !dashboardData?.recentNotifications?.length ? (
                <p className="text-xs text-base-content/50 text-center py-4">No recent notifications</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {dashboardData.recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkNotifRead(notif.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        !notif.isRead
                          ? 'bg-primary/5 border-primary/20 font-semibold'
                          : 'bg-base-200/40 border-base-300 text-base-content/70'
                      }`}
                    >
                      <p className="truncate text-xs">{notif.title}</p>
                      <p className="text-[10px] text-base-content/50 truncate mt-0.5">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 border border-primary/20 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-base-content flex items-center gap-1.5">
                <Zap className="size-4 text-secondary" /> @AI Live Assistant
              </h4>
              <p className="text-base-content/70 leading-relaxed text-[11px]">
                Type <strong className="text-primary font-bold">@AI</strong> followed by your question in group live chat to receive doc-grounded answers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-base-content flex items-center gap-2">
              <Plus className="size-5 text-primary" /> Create New Study Group
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Group Name *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Distributed Systems Section A"
                  required
                  className="input input-sm input-bordered w-full bg-base-200/50 text-xs focus:input-primary"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="What topics does this study group cover?"
                  rows={3}
                  className="textarea textarea-bordered w-full bg-base-200/50 text-xs focus:textarea-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-xs btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !groupName.trim()}
                  className="btn btn-xs btn-primary gap-1"
                >
                  {submitting ? <span className="loading loading-spinner loading-xs" /> : <Plus className="size-3" />}
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-base-content flex items-center gap-2">
              <LogIn className="size-5 text-primary" /> Join Study Group
            </h3>

            <form onSubmit={handleJoinGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Invite Code *</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  required
                  maxLength={8}
                  className="input input-bordered w-full font-mono text-center text-sm font-bold tracking-widest bg-base-200/50 uppercase focus:input-primary"
                />
                <p className="text-[10px] text-base-content/50 mt-1 text-center">Enter the 8-character invite code provided by the owner.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn btn-xs btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || inviteCode.length < 4}
                  className="btn btn-xs btn-primary gap-1"
                >
                  {submitting ? <span className="loading loading-spinner loading-xs" /> : <LogIn className="size-3" />}
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

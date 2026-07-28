import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { collaborationApi } from '../../services/collaborationApi';
import GroupChatRoom from '../../components/collaboration/GroupChatRoom';
import GroupResourcesView from '../../components/collaboration/GroupResourcesView';
import ResourceDiscussionModal from '../../components/collaboration/ResourceDiscussionModal';
import GroupMembersModal from '../../components/collaboration/GroupMembersModal';
import TeacherAnnouncementsView from '../../components/collaboration/TeacherAnnouncementsView';
import {
  MessageSquare,
  FolderOpen,
  Users,
  Megaphone,
  ArrowLeft,
  Key,
  Copy,
  Check,
  Shield,
  Crown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'chat', label: 'Live Chat', icon: MessageSquare },
  { id: 'resources', label: 'Resources', icon: FolderOpen },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'members', label: 'Members', icon: Users },
];

export default function GroupWorkspacePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Get current user from localStorage (same pattern used elsewhere in the app)
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('scl_user') || '{}');
    } catch {
      return {};
    }
  })();

  const platformRole = currentUser?.role || '';

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    collaborationApi
      .getGroupById(groupId)
      .then((data) => {
        setGroup(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error('Failed to load study group details');
        setLoading(false);
      });
  }, [groupId]);

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this study group?')) return;
    try {
      await collaborationApi.leaveGroup(groupId);
      toast.success('You left the study group');
      navigate('/collaboration');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <span className="loading loading-spinner loading-lg text-indigo-500" />
          <p className="text-slate-400 text-sm">Loading study group workspace...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Study group not found or you don't have access.
      </div>
    );
  }

  const currentUserRole = group.currentUserRole;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Header Bar */}
      <div className="bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Back + Group Identity */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/collaboration')}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
              {group.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white truncate">{group.name}</h1>
                {currentUserRole === 'OWNER' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    <Crown className="w-3 h-3" /> OWNER
                  </span>
                )}
                {currentUserRole === 'MODERATOR' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    <Shield className="w-3 h-3" /> MODERATOR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>{group.memberCount} members</span>
                <span>·</span>
                <span>{group.resourceCount} resources</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Invite Code Badge */}
            <button
              onClick={handleCopyCode}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-white transition"
            >
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>{group.inviteCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Members</span>
            </button>

            {currentUserRole !== 'OWNER' && (
              <button
                onClick={handleLeaveGroup}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-400 hover:text-rose-200 transition"
              >
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-slate-800/60 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'chat' && (
          <GroupChatRoom roomId={groupId} groupName={group.name} />
        )}

        {activeTab === 'resources' && (
          <GroupResourcesView
            groupId={groupId}
            userRole={currentUserRole}
            platformRole={platformRole}
          />
        )}

        {activeTab === 'announcements' && (
          <TeacherAnnouncementsView
            groupId={groupId}
            platformRole={platformRole}
            groupRole={currentUserRole}
          />
        )}

        {activeTab === 'members' && (
          <div className="max-w-2xl mx-auto">
            <GroupMembersModal
              groupId={groupId}
              currentUserRole={currentUserRole}
              onClose={() => setActiveTab('chat')}
            />
          </div>
        )}
      </div>

      {/* Floating Members Modal */}
      {showMembersModal && (
        <GroupMembersModal
          groupId={groupId}
          currentUserRole={currentUserRole}
          onClose={() => setShowMembersModal(false)}
        />
      )}
    </div>
  );
}

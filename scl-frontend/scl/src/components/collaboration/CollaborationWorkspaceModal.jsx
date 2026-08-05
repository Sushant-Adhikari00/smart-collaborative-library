import { useState, useContext } from 'react';
import { AuthContext } from '../../context/authContext.jsx';
import { 
  XIcon, 
  MessageSquareIcon, 
  MessageCircleIcon, 
  BotIcon, 
  Share2Icon, 
  UsersIcon,
  CalendarIcon,
  ShieldCheckIcon
} from 'lucide-react';
import LiveChatTab from './LiveChatTab.jsx';
import SharedAiTab from './SharedAiTab.jsx';
import SharedResourcesTab from './SharedResourcesTab.jsx';
import MembersTab from './MembersTab.jsx';

const CollaborationWorkspaceModal = ({ isOpen, onClose, note }) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('chat');
  const docId = note?.id || note?._id;
  const isOwner = user && note?.uploadedBy &&
    (note.uploadedBy === user.email || note.uploadedBy === user.username);

  if (!isOpen) return null;

  const tabs = [
    { id: 'chat', label: 'Live Chat', icon: MessageCircleIcon, count: null, badge: 'Live' },
    { id: 'ai', label: 'Shared AI', icon: BotIcon, count: null, badge: 'Group' },
    { id: 'resources', label: 'Shared Resources', icon: Share2Icon, count: '3' },
    { id: 'members', label: 'Members', icon: UsersIcon, count: '3' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-base-300">
        
        {/* Workspace Top Header */}
        <div className="bg-base-200/80 p-4 border-b border-base-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="size-6" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                {note?.title || "Academic Document"} Collaboration Workspace
                <span className="badge badge-sm badge-outline font-mono">Public Workspace</span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-base-content/60 mt-0.5">
                <span>Owner: <strong className="text-base-content font-medium">{note?.uploadedBy || "Resource Owner"}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" /> Created: {note?.createdAt ? new Date(note.createdAt).toLocaleDateString() : "Jul 2026"}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" title="Close Workspace">
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-base-200/40 border-b border-base-300 px-4 flex items-center gap-1 overflow-x-auto shrink-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-base-content/70 hover:text-base-content hover:bg-base-200/60'
                }`}
              >
                <Icon className="size-4" />
                {t.label}
                {t.count && <span className="badge badge-xs badge-neutral">{t.count}</span>}
                {t.badge && (
                  <span className={`badge badge-xs font-bold ${
                    t.badge === 'Live' ? 'badge-accent animate-pulse' : 'badge-secondary'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Active Tab Viewport */}
        <div className="flex-1 overflow-hidden bg-base-100 relative">
          {activeTab === 'chat' && <LiveChatTab documentId={docId} />}
          {activeTab === 'ai' && <SharedAiTab documentId={docId} title={note?.title} />}
          {activeTab === 'resources' && <SharedResourcesTab documentId={docId} isOwner={!!isOwner} />}
          {activeTab === 'members' && <MembersTab documentId={docId} isOwner={!!isOwner} />}
        </div>
      </div>
    </div>
  );
};

export default CollaborationWorkspaceModal;

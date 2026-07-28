import React, { useState, useEffect } from 'react';
import { collaborationApi } from '../../services/collaborationApi';
import { Users, Shield, UserCheck, UserX, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupMembersModal({ groupId, currentUserRole, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await collaborationApi.getGroupMembers(groupId);
      setMembers(data || []);
    } catch (err) {
      toast.error('Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchMembers();
  }, [groupId]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await collaborationApi.updateMemberRole(groupId, userId, newRole);
      toast.success('Member role updated');
      fetchMembers();
    } catch (err) {
      toast.error('Only the Group Owner can change roles');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the study group?')) return;
    try {
      await collaborationApi.removeMember(groupId, userId);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Group Roster & Role Management
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center p-8 text-slate-400">
              <span className="loading loading-spinner text-indigo-500" />
            </div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-bold text-sm border border-slate-700">
                    {m.fullName ? m.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{m.fullName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          m.groupRole === 'OWNER'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : m.groupRole === 'MODERATOR'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.groupRole}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{m.email}</span>
                  </div>
                </div>

                {/* Role Switcher for Group Owner */}
                {currentUserRole === 'OWNER' && m.groupRole !== 'OWNER' && (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.groupRole}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2.5 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="MODERATOR">MODERATOR</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Remove Member"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

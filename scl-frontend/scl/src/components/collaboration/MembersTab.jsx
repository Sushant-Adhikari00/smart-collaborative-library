import { useState, useEffect, useContext } from 'react';
import {
  ShieldCheckIcon,
  UserCheckIcon,
  UserMinusIcon,
  MoreVerticalIcon,
  UsersIcon,
  RefreshCwIcon,
  LinkIcon,
  AlertCircleIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios.js';
import { AuthContext } from '../../context/authContext.jsx';

const avatarUrl = (name) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'User')}`;

const roleBadge = (role) => {
  switch (role) {
    case 'OWNER': return <span className="badge badge-xs badge-primary font-normal">Owner</span>;
    case 'MODERATOR': return <span className="badge badge-xs badge-secondary font-normal">Mod</span>;
    default: return null;
  }
};

const MembersTab = ({ documentId, isOwner = false }) => {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState(null);

  // Fetch document members or group members
  const fetchMembers = async (groupIdOverride) => {
    if (!user) return;
    setLoadingMembers(true);
    setError(null);
    try {
      if (documentId) {
        const res = await api.get(`/collaboration/documents/${documentId}/members`);
        const data = res.data?.data || [];
        setMembers(data);
      } else {
        const targetGroupId = groupIdOverride || selectedGroup?.id;
        if (targetGroupId) {
          const res = await api.get(`/collaboration/groups/${targetGroupId}/members`);
          setMembers(res.data?.data || []);
        }
      }
    } catch (err) {
      console.warn('Could not load members:', err);
      setError('Could not load active workspace members.');
    } finally {
      setLoadingMembers(false);
      setLoadingGroups(false);
    }
  };

  // Fetch user's collaboration groups if documentId is not provided
  const fetchGroups = async () => {
    if (!user || documentId) return;
    setLoadingGroups(true);
    try {
      const res = await api.get('/collaboration/groups');
      const data = res.data?.data || [];
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0]);
        fetchMembers(data[0].id);
      }
    } catch (err) {
      console.warn('Could not load groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchMembers();
    } else {
      fetchGroups();
    }
  }, [documentId, user]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    fetchMembers(group.id);
  };

  const handleAssignModerator = async (member) => {
    if (!selectedGroup) return;
    const newRole = member.groupRole === 'MODERATOR' ? 'MEMBER' : 'MODERATOR';
    try {
      await api.put(`/collaboration/groups/${selectedGroup.id}/members/${member.userId}/role`, {
        role: newRole
      });
      setMembers(prev => prev.map(m =>
        m.userId === member.userId ? { ...m, groupRole: newRole } : m
      ));
      toast.success(`${member.fullName || member.email} role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!selectedGroup) return;
    if (!window.confirm(`Remove ${member.fullName || member.email} from the workspace?`)) return;
    try {
      await api.delete(`/collaboration/groups/${selectedGroup.id}/members/${member.userId}`);
      setMembers(prev => prev.filter(m => m.userId !== member.userId));
      toast.success('Member removed from workspace');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-xs text-base-content/50">
        <UsersIcon className="size-10 text-primary/30" />
        <p>Log in to view active members.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between bg-base-200/50 p-3 rounded-xl border border-base-300">
        <div>
          <h4 className="font-bold text-xs flex items-center gap-2">
            <UserCheckIcon className="size-4 text-primary" />
            Active Workspace Members
            {members.length > 0 && (
              <span className="badge badge-xs badge-neutral">{members.length}</span>
            )}
          </h4>
          <p className="text-[11px] text-base-content/60">
            Resource owner & approved active collaborators.
          </p>
        </div>

        <button
          onClick={() => fetchMembers()}
          disabled={loadingMembers}
          className="btn btn-ghost btn-xs btn-square"
          title="Refresh"
        >
          <RefreshCwIcon className={`size-3.5 ${loadingMembers ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Group Selector – if standalone groups mode */}
      {!documentId && groups.length > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <LinkIcon className="size-3.5 text-base-content/50 shrink-0" />
          <span className="text-base-content/60 shrink-0">Group:</span>
          <select
            className="select select-xs select-bordered bg-base-100 flex-1 font-medium"
            value={selectedGroup?.id || ''}
            onChange={(e) => {
              const g = groups.find(gr => String(gr.id) === e.target.value);
              if (g) handleSelectGroup(g);
            }}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {(loadingGroups || loadingMembers) && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <span className="loading loading-spinner loading-md text-primary" />
          <p className="text-xs text-base-content/50">Loading active members...</p>
        </div>
      )}

      {/* Error */}
      {!loadingGroups && !loadingMembers && error && (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-xs text-error">
          <AlertCircleIcon className="size-8" />
          <p>{error}</p>
          <button onClick={() => fetchMembers()} className="btn btn-xs btn-outline btn-error">Retry</button>
        </div>
      )}

      {/* Empty State */}
      {!loadingGroups && !loadingMembers && !error && members.length === 0 && (
        <div className="text-center py-10 text-xs text-base-content/50 space-y-2">
          <UsersIcon className="size-10 mx-auto text-primary/20" />
          <p className="font-medium text-base-content/60">No active collaborators yet</p>
          <p>Accepted collaboration requests will display active members here.</p>
        </div>
      )}

      {/* Member Cards List */}
      {!loadingGroups && !loadingMembers && !error && members.length > 0 && (
        <div className="space-y-2">
          {members.map((member, idx) => (
            <div
              key={member.userId || member.email || idx}
              className="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-300 shadow-xs"
            >
              {/* Left: Avatar & Meta */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={member.profilePicture || avatarUrl(member.fullName || member.email)}
                    alt={member.fullName || member.email}
                    className="size-9 rounded-full bg-base-300"
                  />
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-base-100 bg-success" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-base-content">
                      {member.fullName || member.email}
                    </span>
                    {roleBadge(member.groupRole)}
                    {member.userRole && (
                      <span className="badge badge-xs badge-ghost font-normal text-[9px]">
                        {member.userRole}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-base-content/50 block">{member.email}</span>
                </div>
              </div>

              {/* Right Controls – only owner sees management options */}
              {isOwner && member.groupRole !== 'OWNER' && selectedGroup && (
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-ghost btn-xs btn-square">
                    <MoreVerticalIcon className="size-4" />
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-box w-48 text-xs border border-base-300">
                    <li>
                      <button onClick={() => handleAssignModerator(member)} className="gap-2">
                        <ShieldCheckIcon className="size-3.5 text-secondary" />
                        {member.groupRole === 'MODERATOR' ? 'Revoke Moderator' : 'Make Moderator'}
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleRemoveMember(member)} className="gap-2 text-error">
                        <UserMinusIcon className="size-3.5" /> Remove Member
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MembersTab;

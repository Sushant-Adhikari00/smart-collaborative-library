import { api } from './api';

export const collaborationApi = {
  // Dashboard
  getDashboard: async () => {
    const res = await api.get('/collaboration/dashboard');
    return res.data.data;
  },

  // Groups
  getGroups: async () => {
    const res = await api.get('/collaboration/groups');
    return res.data.data;
  },

  getGroupById: async (groupId) => {
    const res = await api.get(`/collaboration/groups/${groupId}`);
    return res.data.data;
  },

  createGroup: async (data) => {
    const res = await api.post('/collaboration/groups', data);
    return res.data.data;
  },

  updateGroup: async (groupId, data) => {
    const res = await api.put(`/collaboration/groups/${groupId}`, data);
    return res.data.data;
  },

  deleteGroup: async (groupId) => {
    const res = await api.delete(`/collaboration/groups/${groupId}`);
    return res.data.data;
  },

  joinGroup: async (inviteCode) => {
    const res = await api.post('/collaboration/groups/join', { inviteCode });
    return res.data.data;
  },

  leaveGroup: async (groupId) => {
    const res = await api.post(`/collaboration/groups/${groupId}/leave`);
    return res.data.data;
  },

  // Members
  getGroupMembers: async (groupId) => {
    const res = await api.get(`/collaboration/groups/${groupId}/members`);
    return res.data.data;
  },

  updateMemberRole: async (groupId, userId, role) => {
    const res = await api.put(`/collaboration/groups/${groupId}/members/${userId}/role`, { role });
    return res.data.data;
  },

  removeMember: async (groupId, userId) => {
    const res = await api.delete(`/collaboration/groups/${groupId}/members/${userId}`);
    return res.data.data;
  },

  // Resources
  getGroupResources: async (groupId) => {
    const res = await api.get(`/collaboration/groups/${groupId}/resources`);
    return res.data.data;
  },

  getResourceById: async (groupId, resourceId) => {
    const res = await api.get(`/collaboration/groups/${groupId}/resources/${resourceId}`);
    return res.data.data;
  },

  uploadResource: async (groupId, formData) => {
    const res = await api.post(`/collaboration/groups/${groupId}/resources`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  toggleResourceVerification: async (groupId, resourceId) => {
    const res = await api.patch(`/collaboration/groups/${groupId}/resources/${resourceId}/verify`);
    return res.data.data;
  },

  toggleResourcePin: async (groupId, resourceId) => {
    const res = await api.patch(`/collaboration/groups/${groupId}/resources/${resourceId}/pin`);
    return res.data.data;
  },

  deleteResource: async (groupId, resourceId) => {
    const res = await api.delete(`/collaboration/groups/${groupId}/resources/${resourceId}`);
    return res.data.data;
  },

  // Document resources (for Document Workspace Modal)
  getDocumentResources: async (documentId) => {
    const res = await api.get(`/collaboration/documents/${documentId}/resources`);
    return res.data.data;
  },

  uploadDocumentResource: async (documentId, formData) => {
    const res = await api.post(`/collaboration/documents/${documentId}/resources`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  deleteDocumentResource: async (documentId, resourceId) => {
    const res = await api.delete(`/collaboration/documents/${documentId}/resources/${resourceId}`);
    return res.data.data;
  },

  // Resource Comments
  getResourceComments: async (resourceId) => {
    const res = await api.get(`/collaboration/resources/${resourceId}/comments`);
    return res.data.data;
  },

  addComment: async (resourceId, content, parentCommentId = null) => {
    const res = await api.post(`/collaboration/resources/${resourceId}/comments`, { content, parentCommentId });
    return res.data.data;
  },

  deleteComment: async (commentId) => {
    const res = await api.delete(`/collaboration/comments/${commentId}`);
    return res.data.data;
  },

  // Teacher Announcements
  getGroupAnnouncements: async (groupId) => {
    const res = await api.get(`/collaboration/groups/${groupId}/announcements`);
    return res.data.data;
  },

  createAnnouncement: async (groupId, data) => {
    const res = await api.post(`/collaboration/groups/${groupId}/announcements`, data);
    return res.data.data;
  },

  // Notifications
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data.data;
  },
};

// ─── Document-level comments & ratings (library documents) ─────────────────
export const documentApi = {
  // Comments
  getComments: async (documentId) => {
    const res = await api.get(`/documents/${documentId}/comments`);
    return res.data.data || [];
  },

  addComment: async (documentId, content, parentCommentId = null) => {
    const res = await api.post(`/documents/${documentId}/comments`, { content, parentCommentId });
    return res.data.data;
  },

  deleteComment: async (commentId) => {
    const res = await api.delete(`/documents/comments/${commentId}`);
    return res.data.data;
  },

  // Ratings
  getRating: async (documentId) => {
    const res = await api.get(`/documents/${documentId}/rating`);
    return res.data.data;
  },

  rateDocument: async (documentId, rating) => {
    const res = await api.post(`/documents/${documentId}/rate`, { rating });
    return res.data.data;
  },
};


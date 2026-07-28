import React, { useState, useEffect } from 'react';
import { collaborationApi } from '../../services/collaborationApi';
import ResourceDiscussionModal from './ResourceDiscussionModal';
import {
  FileText,
  Upload,
  CheckCircle2,
  Pin,
  Sparkles,
  Download,
  MessageSquare,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Video,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupResourcesView({ groupId, userRole, platformRole }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResourceForAi, setSelectedResourceForAi] = useState(null);
  const [activeDiscussionResourceId, setActiveDiscussionResourceId] = useState(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await collaborationApi.getGroupResources(groupId);
      setResources(data || []);
    } catch (err) {
      toast.error('Failed to load group resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchResources();
  }, [groupId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      await collaborationApi.uploadResource(groupId, formData);
      toast.success('Resource uploaded & AI summary generated!');
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFile(null);
      fetchResources();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVerify = async (resourceId) => {
    try {
      const updated = await collaborationApi.toggleResourceVerification(groupId, resourceId);
      toast.success(updated.isVerified ? 'Resource verified by Teacher!' : 'Verification removed');
      fetchResources();
    } catch (err) {
      toast.error('Only teachers can verify resources');
    }
  };

  const handleTogglePin = async (resourceId) => {
    try {
      const updated = await collaborationApi.toggleResourcePin(groupId, resourceId);
      toast.success(updated.isPinned ? 'Resource pinned' : 'Resource unpinned');
      fetchResources();
    } catch (err) {
      toast.error('Failed to pin resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await collaborationApi.deleteResource(groupId, resourceId);
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error('Permission denied to delete resource');
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileText className="w-5 h-5 text-blue-400" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-400" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (fileType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-400" />;
    if (fileType.includes('video')) return <Video className="w-5 h-5 text-amber-400" />;
    return <FileCode className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div>
          <h3 className="text-lg font-semibold text-white">Group Academic Resources</h3>
          <p className="text-xs text-slate-400">Share, verify notes, view AI summaries, and discuss course materials</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl shadow-lg transition"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Resource</span>
        </button>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <span className="loading loading-spinner loading-lg text-indigo-500" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <p className="text-base font-medium">No resources shared yet</p>
          <p className="text-xs text-slate-500">Upload PDF, DOCX, PPT, CSV, Images, or Video notes to collaborate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className={`p-5 rounded-2xl border transition-all ${
                res.isPinned
                  ? 'bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/50 shadow-indigo-950/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Badges Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {res.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                  {res.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> TEACHER VERIFIED
                    </span>
                  )}
                </div>

                {/* Teacher Action Controls */}
                {(platformRole === 'TEACHER' || platformRole === 'ADMIN') && (
                  <button
                    onClick={() => handleToggleVerify(res.id)}
                    title="Toggle Teacher Verification"
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                      res.isVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {res.isVerified ? 'Verified' : 'Verify Note'}
                  </button>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
                  {getFileIcon(res.fileType)}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white leading-snug">{res.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{res.description || res.fileName}</p>
                </div>
              </div>

              {/* Uploader & Date */}
              <div className="text-xs text-slate-500 mb-4 flex items-center justify-between border-t border-b border-slate-800/80 py-2">
                <span>Uploaded by <strong className="text-slate-300">{res.uploaderName}</strong></span>
                <span>{new Date(res.uploadedAt).toLocaleDateString()}</span>
              </div>

              {/* AI Summary Preview Button */}
              {res.aiSummary && (
                <div className="mb-4 p-3 rounded-xl bg-purple-950/30 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Summary
                    </span>
                    <button
                      onClick={() => setSelectedResourceForAi(res)}
                      className="text-[11px] text-purple-400 hover:text-purple-200 underline font-medium"
                    >
                      View Full AI Note
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 italic">"{res.aiSummary}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => setActiveDiscussionResourceId(res.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Comments ({res.commentCount || 0})</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePin(res.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                    title="Pin Resource"
                  >
                    <Pin className={`w-4 h-4 ${res.isPinned ? 'text-indigo-400 fill-indigo-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" /> Upload Study Resource
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 DBMS Lecture Notes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this note covers..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">File (PDF, DOCX, XLS, PPT, PNG, MP4)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="file-input file-input-bordered file-input-primary w-full bg-slate-950 text-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl shadow-lg disabled:opacity-50"
                >
                  {uploading ? 'Processing AI...' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Full Summary Modal */}
      {selectedResourceForAi && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-purple-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> AI Generated Summary & Insights
              </h3>
              <button onClick={() => setSelectedResourceForAi(null)} className="text-slate-400 hover:text-white text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white text-base mb-1">{selectedResourceForAi.title}</h4>
                <p className="text-xs text-slate-400">{selectedResourceForAi.fileName}</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                <h5 className="font-semibold text-purple-300 text-xs uppercase tracking-wider">Executive Summary</h5>
                <p className="leading-relaxed">{selectedResourceForAi.aiSummary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Discussion Modal */}
      {activeDiscussionResourceId && (
        <ResourceDiscussionModal
          resourceId={activeDiscussionResourceId}
          onClose={() => setActiveDiscussionResourceId(null)}
        />
      )}
    </div>
  );
}

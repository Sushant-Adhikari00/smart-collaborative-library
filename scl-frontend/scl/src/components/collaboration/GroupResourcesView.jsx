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
      <div className="flex items-center justify-between bg-base-100 p-4 rounded-xl border border-base-300">
        <div>
          <h3 className="text-lg font-semibold text-base-content">Group Academic Resources</h3>
          <p className="text-xs text-base-content/60">Share, verify notes, view AI summaries, and discuss course materials</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Resource</span>
        </button>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="flex justify-center p-12 text-base-content/60">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center p-12 bg-base-100 rounded-2xl border border-base-300 text-base-content/70 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-base-content/30" />
          <p className="text-base font-medium">No resources shared yet</p>
          <p className="text-xs text-base-content/50">Upload PDF, DOCX, PPT, CSV, Images, or Video notes to collaborate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className={`p-5 rounded-2xl border transition-all ${
                res.isPinned
                  ? 'bg-gradient-to-br from-primary/10 to-base-100 border-primary shadow-sm'
                  : 'bg-base-100 border-base-300 hover:border-primary/40'
              }`}
            >
              {/* Badges Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {res.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                  {res.isVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-success/20 text-success-content border border-success/30">
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
                        ? 'bg-success/20 text-success-content border-success/40'
                        : 'bg-base-200 text-base-content/70 border-base-300 hover:text-base-content'
                    }`}
                  >
                    {res.isVerified ? 'Verified' : 'Verify Note'}
                  </button>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-base-200 border border-base-300 shrink-0">
                  {getFileIcon(res.fileType)}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-base-content leading-snug">{res.title}</h4>
                  <p className="text-xs text-base-content/70 line-clamp-2 mt-1">{res.description || res.fileName}</p>
                </div>
              </div>

              {/* Uploader & Date */}
              <div className="text-xs text-base-content/50 mb-4 flex items-center justify-between border-t border-b border-base-300 py-2">
                <span>Uploaded by <strong className="text-slate-300">{res.uploaderName}</strong></span>
                <span>{new Date(res.uploadedAt).toLocaleDateString()}</span>
              </div>

              {/* AI Summary Preview Button */}
              {res.aiSummary && (
                <div className="mb-4 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-secondary" /> AI Summary
                    </span>
                    <button
                      onClick={() => setSelectedResourceForAi(res)}
                      className="text-[11px] text-secondary hover:text-secondary-focus underline font-medium"
                    >
                      View Full AI Note
                    </button>
                  </div>
                  <p className="text-xs text-base-content/85 line-clamp-2 italic">"{res.aiSummary}"</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-outline btn-neutral"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Download</span>
                  </a>

                  <button
                    onClick={() => setActiveDiscussionResourceId(res.id)}
                    className="btn btn-xs btn-outline btn-neutral"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-secondary" />
                    <span>Comments ({res.commentCount || 0})</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePin(res.id)}
                    className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-primary"
                    title="Pin Resource"
                  >
                    <Pin className={`w-4 h-4 ${res.isPinned ? 'text-primary fill-primary' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="btn btn-ghost btn-circle btn-xs text-error/60 hover:text-error"
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
          <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-base-content">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Upload Study Resource
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/75 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 DBMS Lecture Notes"
                  className="input input-bordered w-full bg-base-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/75 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this note covers..."
                  rows={3}
                  className="textarea textarea-bordered w-full bg-base-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/75 mb-1">File (PDF, DOCX, XLS, PPT, PNG, MP4)</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="file-input file-input-bordered file-input-primary w-full bg-base-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? <span className="loading loading-spinner" /> : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Full Summary Modal */}
      {selectedResourceForAi && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto text-base-content">
            <div className="flex items-center justify-between border-b border-base-300 pb-3">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" /> AI Generated Summary & Insights
              </h3>
              <button onClick={() => setSelectedResourceForAi(null)} className="btn btn-ghost btn-circle btn-sm">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-base-content text-base mb-1">{selectedResourceForAi.title}</h4>
                <p className="text-xs text-base-content/50">{selectedResourceForAi.fileName}</p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 space-y-2">
                <h5 className="font-semibold text-secondary text-xs uppercase tracking-wider">Executive Summary</h5>
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

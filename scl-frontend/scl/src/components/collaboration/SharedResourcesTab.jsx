import { useState, useEffect, useContext } from 'react';
import { 
  FileTextIcon, 
  EyeIcon, 
  PlusIcon, 
  Share2Icon, 
  UploadIcon, 
  DownloadIcon, 
  Trash2Icon, 
  FileSpreadsheetIcon, 
  FileCodeIcon, 
  ImageIcon, 
  VideoIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collaborationApi } from '../../services/collaborationApi';
import { AuthContext } from '../../context/authContext.jsx';

const SharedResourcesTab = ({ documentId, isOwner }) => {
  const { user } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await collaborationApi.getDocumentResources(documentId);
      setResources(data || []);
    } catch (err) {
      toast.error('Failed to load shared resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchResources();
    }
  }, [documentId]);

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

      await collaborationApi.uploadDocumentResource(documentId, formData);
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

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await collaborationApi.deleteDocumentResource(documentId, resourceId);
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error('Permission denied to delete resource');
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileTextIcon className="size-4" />;
    const normalizedType = fileType.toLowerCase();
    if (normalizedType.includes('pdf')) return <FileTextIcon className="size-4 text-rose-500" />;
    if (normalizedType.includes('excel') || normalizedType.includes('spreadsheet') || normalizedType.includes('csv') || normalizedType.includes('sheet'))
      return <FileSpreadsheetIcon className="size-4 text-emerald-500" />;
    if (normalizedType.includes('image')) return <ImageIcon className="size-4 text-purple-500" />;
    if (normalizedType.includes('video')) return <VideoIcon className="size-4 text-amber-500" />;
    return <FileCodeIcon className="size-4 text-indigo-500" />;
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-base-200/50 p-3 rounded-xl border border-base-300">
        <div>
          <h4 className="font-bold text-xs flex items-center gap-2">
            <Share2Icon className="size-4 text-primary" />
            Document Resource Library
          </h4>
          <p className="text-[11px] text-base-content/60">
            Supplementary materials, notes, and datasets shared by collaborators.
          </p>
        </div>

        <button 
          onClick={() => setShowUploadModal(true)} 
          className="btn btn-xs btn-primary gap-1"
        >
          <PlusIcon className="size-3" /> Share File
        </button>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="flex justify-center p-8 text-base-content/50">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-10 text-xs text-base-content/50 space-y-2">
          <FileTextIcon className="size-8 mx-auto text-base-content/30" />
          <p className="font-medium">No resources shared yet</p>
          <p>Be the first to share a note or file!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map((res) => {
            const canDelete = isOwner || (user && res.uploaderId === user.id);
            return (
              <div 
                key={res.id}
                className="bg-base-100 p-3.5 rounded-xl border border-base-300 shadow-xs hover:border-primary/40 transition-all space-y-3"
              >
                {/* Title & File Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getFileIcon(res.fileType)}
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-base-content line-clamp-1" title={res.title}>{res.title}</h5>
                      <p className="text-[10px] text-base-content/50">
                        By {res.uploaderName} • {new Date(res.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <span className="badge badge-xs badge-outline font-mono uppercase">
                    {res.fileType?.split('/')?.pop() || 'File'}
                  </span>
                </div>

                {res.description && (
                  <p className="text-[11px] text-base-content/70 line-clamp-2 px-1">
                    {res.description}
                  </p>
                )}

                {res.aiSummary && (
                  <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[10px] text-base-content/80 italic">
                    <span className="font-bold text-purple-600 block not-italic">AI Summary:</span>
                    "{res.aiSummary}"
                  </div>
                )}

                {/* Sub Meta & Action Bar */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-base-200">
                  <span className="text-[10px] text-base-content/40">
                    {res.fileSize ? `${(res.fileSize / 1024 / 1024).toFixed(1)} MB` : '0 MB'}
                  </span>

                  <div className="flex items-center gap-1">
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-xs btn-square text-base-content/50"
                      title="Download/Open"
                    >
                      <DownloadIcon className="size-3.5" />
                    </a>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="btn btn-ghost btn-xs btn-square text-error/70 hover:text-error"
                        title="Delete Resource"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-base-content flex items-center gap-2">
              <UploadIcon className="size-5 text-primary" /> Share Study Resource
            </h3>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3 DBMS Lecture Notes"
                  className="input input-sm input-bordered w-full bg-base-200/50 text-xs focus:input-primary"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this note covers..."
                  rows={3}
                  className="textarea textarea-bordered w-full bg-base-200/50 text-xs focus:textarea-primary"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">File (PDF, DOCX, PPT, CSV, Images, etc.) *</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="file-input file-input-bordered file-input-primary file-input-sm w-full bg-base-200/50 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-xs btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-xs btn-primary gap-1"
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="size-3" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedResourcesTab;

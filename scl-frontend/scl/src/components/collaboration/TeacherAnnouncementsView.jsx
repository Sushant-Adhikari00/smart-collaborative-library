import React, { useState, useEffect } from 'react';
import { collaborationApi } from '../../services/collaborationApi';
import { Megaphone, Pin, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherAnnouncementsView({ groupId, platformRole, groupRole }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await collaborationApi.getGroupAnnouncements(groupId);
      setAnnouncements(data || []);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchAnnouncements();
  }, [groupId]);

  const canPost = platformRole === 'TEACHER' || platformRole === 'ADMIN' || groupRole === 'OWNER' || groupRole === 'MODERATOR';

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await collaborationApi.createAnnouncement(groupId, { title, content, isPinned });
      toast.success('Announcement posted to group!');
      setShowModal(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to post announcement');
    }
  };

  return (
    <div className="space-y-6 text-base-content">
      <div className="flex items-center justify-between bg-base-100 p-4 rounded-xl border border-base-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-warning/20 text-warning border border-warning/30">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">Teacher & Official Announcements</h3>
            <p className="text-xs text-base-content/60">Important course notices, schedule updates, and syllabus guidelines</p>
          </div>
        </div>

        {canPost && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-warning gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-base-content/60">
          <span className="loading loading-spinner text-warning" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center p-12 bg-base-100 rounded-2xl border border-base-300 text-base-content/70 space-y-2">
          <p className="text-base font-medium">No announcements posted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((anno) => (
            <div
              key={anno.id}
              className={`p-5 rounded-2xl border transition ${
                anno.isPinned
                  ? 'bg-gradient-to-br from-warning/15 to-base-100 border-warning/40 shadow-sm'
                  : 'bg-base-100 border-base-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-base-content">{anno.title}</h4>
                  {anno.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-warning/20 text-warning border border-warning/30">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                </div>
                <span className="text-xs text-base-content/50">{new Date(anno.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-base-content/85 leading-relaxed whitespace-pre-line mb-3">{anno.content}</p>

              <div className="text-xs text-base-content/60 font-medium">
                Posted by Teacher: <strong className="text-base-content/80">{anno.teacherName}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-base-content">
            <h3 className="text-xl font-bold text-base-content flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-warning" /> New Announcement
            </h3>

            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/75 mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination Guidelines"
                  className="input input-bordered w-full bg-base-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/75 mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write notice details here..."
                  rows={4}
                  className="textarea textarea-bordered w-full bg-base-200 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="checkbox checkbox-warning checkbox-sm"
                />
                <label htmlFor="pinCheck" className="text-xs font-semibold text-base-content/85 cursor-pointer">
                  Pin to top of study group feed
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

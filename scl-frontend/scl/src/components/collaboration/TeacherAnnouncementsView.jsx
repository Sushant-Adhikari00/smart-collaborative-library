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
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Teacher & Official Announcements</h3>
            <p className="text-xs text-slate-400">Important course notices, schedule updates, and syllabus guidelines</p>
          </div>
        </div>

        {canPost && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-medium rounded-xl shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-slate-400">
          <span className="loading loading-spinner text-amber-500" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
          <p className="text-base font-medium">No announcements posted yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((anno) => (
            <div
              key={anno.id}
              className={`p-5 rounded-2xl border transition ${
                anno.isPinned
                  ? 'bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/40 shadow-amber-950/20'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{anno.title}</h4>
                  {anno.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Pin className="w-3 h-3" /> PINNED
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{new Date(anno.createdAt).toLocaleDateString()}</span>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-3">{anno.content}</p>

              <div className="text-xs text-slate-400 font-medium">
                Posted by Teacher: <strong className="text-slate-200">{anno.teacherName}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" /> New Announcement
            </h3>

            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Examination Guidelines"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write notice details here..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
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
                <label htmlFor="pinCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Pin to top of study group feed
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-medium rounded-xl shadow-lg"
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

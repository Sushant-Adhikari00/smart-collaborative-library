import { useState } from 'react';
import { FileTextIcon, BookmarkIcon, EyeIcon, PlusIcon, Share2Icon } from 'lucide-react';
import toast from 'react-hot-toast';

const SharedResourcesTab = ({ documentId }) => {
  const [resources] = useState([
    {
      id: 101,
      title: 'Chapter 2 Supplementary Lecture Slides',
      author: 'Dr. Sarah Jenkins',
      fileType: 'PDF',
      uploadDate: 'Jul 24, 2026',
      size: '2.4 MB'
    },
    {
      id: 102,
      title: 'Group Assignment Code Examples & Notebooks',
      author: 'Sushant Adhikari',
      fileType: 'ZIP',
      uploadDate: 'Jul 26, 2026',
      size: '14.1 MB'
    },
    {
      id: 103,
      title: 'Reference Cheat Sheet & Quick Formulas',
      author: 'Alex Rivera',
      fileType: 'PDF',
      uploadDate: 'Jul 27, 2026',
      size: '850 KB'
    }
  ]);

  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const toggleBookmark = (id) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    toast.success("Bookmark updated!");
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-base-200/50 p-3 rounded-xl border border-base-300">
        <div>
          <h4 className="font-bold text-xs flex items-center gap-2">
            <Share2Icon className="size-4 text-primary" />
            Group Resource Library
          </h4>
          <p className="text-[11px] text-base-content/60">
            Supplementary materials, notes, and datasets shared by members.
          </p>
        </div>

        <button className="btn btn-xs btn-primary gap-1">
          <PlusIcon className="size-3" /> Share File
        </button>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {resources.map((res) => (
          <div 
            key={res.id}
            className="bg-base-100 p-3.5 rounded-xl border border-base-300 shadow-xs hover:border-primary/40 transition-all space-y-3"
          >
            {/* Title & File Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileTextIcon className="size-4" />
                </div>
                <div>
                  <h5 className="font-semibold text-xs text-base-content line-clamp-1">{res.title}</h5>
                  <p className="text-[10px] text-base-content/50">
                    By {res.author} • {res.uploadDate}
                  </p>
                </div>
              </div>

              <span className="badge badge-xs badge-outline font-mono">{res.fileType}</span>
            </div>

            {/* Sub Meta & Action Bar */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-base-200">
              <span className="text-[10px] text-base-content/40">{res.size}</span>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => toggleBookmark(res.id)} 
                  className={`btn btn-ghost btn-xs btn-square ${bookmarkedIds.includes(res.id) ? 'text-warning' : 'text-base-content/50'}`}
                  title="Bookmark"
                >
                  <BookmarkIcon className="size-3.5" />
                </button>

                <button className="btn btn-ghost btn-xs btn-square text-base-content/50" title="Preview">
                  <EyeIcon className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedResourcesTab;

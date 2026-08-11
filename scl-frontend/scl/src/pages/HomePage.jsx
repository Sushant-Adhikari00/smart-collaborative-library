import { useState, useEffect, useContext } from "react";
import RateLimitedUI from "../components/RateLimitedUI.jsx";
import api from "../lib/axios.js";
import toast from "react-hot-toast";
import ResourceCard from "../components/ResourceCard.jsx";
import NotesNotFound from "../components/NotesNotFound.jsx";
import NoteCardSkeleton from "../components/NoteCardSkeleton.jsx";
import { AuthContext } from "../context/authContext.jsx";
import { Link } from "react-router";
import { 
  Filter as FilterIcon, 
  Sparkles as SparklesIcon, 
  BookOpen as BookOpenIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  Users as UsersIcon, 
  Clock as ClockIcon, 
  ArrowRight as ArrowRightIcon, 
  FileText as FileTextIcon 
} from "lucide-react";
import { collaborationApi, recommendationApi } from "../services/collaborationApi.js";
import ResourceViewerModal from "../components/viewer/ResourceViewerModal.jsx";

const HomePage = ({ searchQuery }) => {
  const { user } = useContext(AuthContext);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dashboard Tab states
  const [selectedTab, setSelectedTab] = useState("all");
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  // Sidebar states
  const [groups, setGroups] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const categories = ["All", "Lecture Notes", "Research Papers", "Study Guides", "Lab Reports"];

  // Fetch all documents
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const res = await api.get("/documents");
        setNotes(res.data.data || []);
        setIsRateLimited(false);
      } catch (error) {
        console.error("Error fetching documents:", error);
        if (error.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          toast.error(error.response?.data?.message || "Failed to load documents");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [searchQuery]);

  // Load recommendations when tab switches
  useEffect(() => {
    if (!user || selectedTab !== "recommendations") return;

    const fetchRecommendations = async () => {
      try {
        setRecLoading(true);
        const data = await recommendationApi.getRecommendations();
        setRecommendations(data || []);
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      } finally {
        setRecLoading(false);
      }
    };

    fetchRecommendations();
  }, [selectedTab, user]);

  // Hydrate bookmarks dynamically
  useEffect(() => {
    const loadBookmarks = () => {
      const saved = JSON.parse(localStorage.getItem('scl_bookmarks') || '[]');
      setBookmarks(saved);
    };

    loadBookmarks();
    window.addEventListener('bookmarks_changed', loadBookmarks);
    return () => window.removeEventListener('bookmarks_changed', loadBookmarks);
  }, []);

  // Fetch active study groups for sidebar
  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      try {
        setGroupLoading(true);
        const data = await collaborationApi.getDashboard();
        setGroups(data?.activeGroups || []);
      } catch (err) {
        console.error("Failed to load dashboard groups:", err);
      } finally {
        setGroupLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Filter Logic: My Library
  const libraryNotes = notes.filter(note => {
    const docId = note.id || note._id;
    const isBookmarked = bookmarks.includes(docId);
    const isUploadedByMe = note.uploadedBy && user && (
      note.uploadedBy.toLowerCase() === (user.email || '').toLowerCase() ||
      note.uploadedBy.toLowerCase() === (user.username || '').toLowerCase() ||
      note.uploadedBy.toLowerCase() === (user.name || '').toLowerCase()
    );
    return isBookmarked || isUploadedByMe;
  });

  // Master Filter Utility
  const getFilteredList = (list) => {
    return list.filter((note) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (note.title ?? "").toLowerCase().includes(q) ||
        (note.description ?? "").toLowerCase().includes(q) ||
        (note.aiKeywords ?? "").toLowerCase().includes(q) ||
        (note.aiKeyPoints ?? "").toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All" || note.categoryName === selectedCategory || note.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  };

  // Determine active view content
  const activeList = selectedTab === 'all' 
    ? getFilteredList(notes) 
    : selectedTab === 'library' 
      ? getFilteredList(libraryNotes) 
      : getFilteredList(recommendations);

  return (
    <div className="min-h-screen bg-base-100">
      {isRateLimited && <RateLimitedUI />}

      {/* Flat Academic Sub-Header Banner */}
      <div className="bg-base-200 border-b border-base-300 py-6 px-4">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-base-content flex items-center gap-2">
              <BookOpenIcon className="size-6 text-primary" />
              {user ? `Dashboard: ${user.username || user.name || 'Scholar'}` : "Smart Collaborative Learning Platform"}
            </h1>
            <p className="text-xs md:text-sm text-base-content/60 mt-1 max-w-xl">
              Access verified study materials, collaborate in real-time study groups, and run document-grounded AI research queries.
            </p>
          </div>
          {/* Simple AI Active status indicator */}
          <div className="flex items-center gap-2 bg-base-100 px-3 py-1.5 rounded border border-base-300 text-xs text-base-content/70 shadow-2xs">
            <SparklesIcon className="size-4 text-primary" />
            <span>SCL AI Assistant Active</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-7xl mt-4">
        {/* Guest Warning Banner */}
        {!user && (
          <div className="alert alert-neutral mb-6 rounded border border-base-300 shadow-xs flex items-center justify-between py-3 px-4 text-xs md:text-sm">
            <span>📚 Browse academic resources – <strong>log in</strong> to upload materials, join study groups, and chat with the AI assistant.</span>
            <Link to="/login" className="btn btn-xs btn-primary rounded px-3">Login</Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content Directory */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dashboard Tabs for Logged-In Users */}
            {user && (
              <div className="flex border-b border-base-300 gap-1 text-xs md:text-sm">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={`pb-2.5 px-4 font-semibold border-b-2 transition-colors ${
                    selectedTab === 'all' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-base-content/60 hover:text-base-content'
                  }`}
                >
                  📖 Library Directory
                </button>
                <button
                  onClick={() => setSelectedTab('library')}
                  className={`pb-2.5 px-4 font-semibold border-b-2 transition-colors ${
                    selectedTab === 'library' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-base-content/60 hover:text-base-content'
                  }`}
                >
                  🔖 My Library ({libraryNotes.length})
                </button>
                <button
                  onClick={() => setSelectedTab('recommendations')}
                  className={`pb-2.5 px-4 font-semibold border-b-2 transition-colors ${
                    selectedTab === 'recommendations' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-base-content/60 hover:text-base-content'
                  }`}
                >
                  ✨ Recommended ({recommendations.length})
                </button>
              </div>
            )}

            {/* Category Filters Bar */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1.5 scrollbar-none border-b border-base-200">
              <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <FilterIcon className="size-3.5" />
                <span>Category:</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-xs rounded font-medium transition-all ${
                      selectedCategory === cat
                        ? "btn-primary"
                        : "btn-outline btn-neutral text-base-content/70"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources List Rendering */}
            {(loading || (selectedTab === 'recommendations' && recLoading)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, index) => (
                  <NoteCardSkeleton key={index} />
                ))}
              </div>
            ) : activeList.length === 0 ? (
              <NotesNotFound />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeList.map((note) => (
                  <ResourceCard key={note.id || note._id} note={note} setNotes={setNotes} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Dashboard Sidebar Widgets (Logged-In Users only) */}
          {user ? (
            <div className="space-y-6">
              {/* Widget 1: My Study Groups */}
              <div className="border border-base-300 rounded-lg p-4 bg-base-100 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
                  <UsersIcon className="size-4 text-primary" /> My Study Groups
                </h3>

                {groupLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-10 bg-base-200 rounded" />
                    <div className="h-10 bg-base-200 rounded" />
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-4 text-xs text-base-content/50 space-y-2">
                    <p>You haven't joined any study groups yet.</p>
                    <Link to="/collaboration" className="btn btn-xs btn-outline btn-primary rounded">
                      Join / Create Group
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groups.slice(0, 3).map((group) => (
                      <Link
                        key={group.id}
                        to={`/collaboration/groups/${group.id}`}
                        className="flex items-center justify-between p-2.5 rounded border border-base-200 bg-base-200/20 hover:bg-base-200 hover:border-primary/30 transition-all text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-base-content truncate block leading-snug">{group.name}</span>
                          <span className="text-[10px] text-base-content/50">👥 {group.memberCount} members</span>
                        </div>
                        <ArrowRightIcon className="size-3.5 text-base-content/40 shrink-0 ml-2" />
                      </Link>
                    ))}
                    <Link
                      to="/collaboration"
                      className="btn btn-xs btn-outline btn-neutral w-full rounded mt-1 text-[11px]"
                    >
                      View All Groups &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Widget 2: Recent Uploads */}
              <div className="border border-base-300 rounded-lg p-4 bg-base-100 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 flex items-center gap-1.5">
                  <ClockIcon className="size-4 text-primary" /> Recent Platform Uploads
                </h3>

                <div className="space-y-2">
                  {notes.slice(0, 4).map((doc) => (
                    <div
                      key={doc.id || doc._id}
                      onClick={() => setSelectedDoc(doc)}
                      className="flex items-center gap-3 p-2.5 rounded border border-base-200 bg-base-200/20 hover:bg-base-200 hover:border-primary/30 transition-all cursor-pointer text-xs"
                    >
                      <div className="p-1.5 bg-base-300 text-primary rounded shrink-0">
                        <FileTextIcon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-base-content truncate block leading-snug text-left">{doc.title}</span>
                        <span className="text-[10px] text-base-content/50 block text-left">
                          {doc.category || doc.categoryName || 'Notes'} • {doc.uploadedBy}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 3: AI Assistant Info */}
              <div className="border border-base-300 rounded-lg p-4 bg-base-200/40 space-y-2 text-xs">
                <h4 className="font-bold text-base-content flex items-center gap-1.5">
                  <SparklesIcon className="size-4 text-primary" /> AI Research Assistant
                </h4>
                <p className="text-base-content/75 leading-relaxed text-[11px]">
                  Need help studying? Open any document and click <strong className="text-primary font-bold">Ask AI Assistant</strong> to search the text, generate study questions, or get real-time summaries.
                </p>
              </div>
            </div>
          ) : (
            /* Sidebar hidden for guests, making main directory full-width */
            null
          )}
        </div>
      </div>

      {/* Shared Document Viewer Modal */}
      {selectedDoc && (
        <ResourceViewerModal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          note={selectedDoc}
        />
      )}
    </div>
  );
};

export default HomePage;

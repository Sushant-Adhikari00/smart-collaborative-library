import { useState, useEffect, useContext } from "react";
import RateLimitedUI from "../components/RateLimitedUI.jsx";
import api from "../lib/axios.js";
import toast from "react-hot-toast";
import ResourceCard from "../components/ResourceCard.jsx";
import NotesNotFound from "../components/NotesNotFound.jsx";
import NoteCardSkeleton from "../components/NoteCardSkeleton.jsx";
import { AuthContext } from "../context/authContext.jsx";
import { Link } from "react-router";
import { FilterIcon, SparklesIcon, BookOpenIcon, CheckCircle2Icon } from "lucide-react";

const HomePage = ({ searchQuery }) => {
  const { user } = useContext(AuthContext);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Lecture Notes", "Research Papers", "Study Guides", "Lab Reports"];


  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get("/documents");
        setNotes(res.data.data || []);
        setIsRateLimited(false);
      } catch (error) {
        console.log("Error fetching documents:", error);
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

  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (note.title ?? "").toLowerCase().includes(q) ||
      (note.description ?? "").toLowerCase().includes(q) ||
      // Search inside AI-extracted keywords/tags (comma-separated string)
      (note.aiKeywords ?? "").toLowerCase().includes(q) ||
      // Also search inside aiKeyPoints for broad semantic matching
      (note.aiKeyPoints ?? "").toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "All" || note.categoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-base-200/40">
      {isRateLimited && <RateLimitedUI />}

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 border-b border-base-300 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-base-content flex items-center justify-center md:justify-start gap-2">
              <BookOpenIcon className="size-8 text-primary" />
              Smart Collaborative Learning Platform
            </h1>
            <p className="text-xs md:text-sm text-base-content/70 max-w-xl">
              Drive, Notion & NotebookLM inspired academic workspace. Browse verified notes, conduct doc-grounded AI research, and collaborate in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-base-100 p-3 rounded-2xl border border-base-300 shadow-xs">
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <SparklesIcon className="size-6" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-base-content block">NotebookLM AI Active</span>
              <span className="text-base-content/60">Doc-grounded study assistant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-7xl mt-4">
        {!user && (
          <div className="alert alert-info mb-6 flex items-center justify-between shadow-sm border border-info/30">
            <span className="text-xs md:text-sm">📚 Browse academic resources – <strong>log in</strong> to upload, collaborate, and chat with AI!</span>
            <Link to="/login" className="btn btn-xs md:btn-sm btn-primary">Login</Link>
          </div>
        )}

        {/* Category Filters Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <FilterIcon className="size-4 text-base-content/50" />
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Categories:</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-xs rounded-full font-medium transition-all ${
                  selectedCategory === cat
                    ? "btn-primary shadow-xs"
                    : "btn-outline btn-ghost text-base-content/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        )}

        {!loading && filteredNotes.length === 0 && !isRateLimited && (
          <NotesNotFound />
        )}

        {!loading && filteredNotes.length > 0 && !isRateLimited && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <ResourceCard key={note.id || note._id} note={note} setNotes={setNotes} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

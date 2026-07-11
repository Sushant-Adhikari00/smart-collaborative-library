import { useState, useEffect, useContext } from "react";
import RateLimitedUI from "../components/RateLimitedUI.jsx";
import api from "../lib/axios.js";
import toast from "react-hot-toast";
import NoteCard from "../components/NoteCard.jsx";
import NotesNotFound from "../components/NotesNotFound.jsx";
import NoteCardSkeleton from "../components/NoteCardSkeleton.jsx";
import { AuthContext } from "../context/authContext.jsx";
import { Link } from "react-router";

const HomePage = ({ searchQuery }) => {
  const { user } = useContext(AuthContext);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // Spring Boot: GET /api/v1/documents → ApiResponse<List<Document>>
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

  const filteredNotes = notes.filter(
    (note) =>
      (note.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {isRateLimited && <RateLimitedUI />}

      <div className="container mx-auto p-4 mt-6">
        {!user && (
          <div className="alert alert-info mb-6 flex items-center justify-between">
            <span>📚 Browse the library – <strong>log in</strong> to upload and chat with documents!</span>
            <Link to="/login" className="btn btn-sm btn-primary">Login</Link>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, index) => (
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
              <NoteCard key={note.id} note={note} setNotes={setNotes} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

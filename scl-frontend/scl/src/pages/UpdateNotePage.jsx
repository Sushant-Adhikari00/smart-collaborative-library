import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios.js";

const UpdateNotePage = () => {
  const { id } = useParams(); // get note id from URL
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // fetch existing note details
  useEffect(() => {
    const fetchNote = async () => {
      try {
        // Spring Boot: GET /api/v1/documents/{id} → ApiResponse<Document>
        const res = await api.get(`/documents/${id}`);
        const doc = res.data.data;
        setTitle(doc.title || "");
        setContent(doc.description || "");
      } catch (error) {
        console.log("Error fetching document", error);
        toast.error("Failed to fetch document details");
      }
    };
    fetchNote();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      // Spring Boot: PUT /api/v1/documents/{id} with JSON body { title, description }
      await api.put(`/documents/${id}`, {
        title,
        description: content,
      });

      toast.success("Document updated successfully!");
      navigate("/");
    } catch (error) {
      console.log("Error updating document", error);
      toast.error("Failed to update document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to={"/"} className="btn btn-ghost mb-6">
            <ArrowLeftIcon className="size-5" />
            Back to Notes
          </Link>

          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Update Document</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Document Title"
                    className="input input-bordered w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    placeholder="Short description..."
                    className="textarea textarea-bordered h-32 w-full"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="card-actions justify-end">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="loading loading-spinner loading-sm" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotePage;

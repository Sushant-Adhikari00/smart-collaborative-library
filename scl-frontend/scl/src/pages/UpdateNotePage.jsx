import { useState, useEffect, useContext } from "react";
import { ArrowLeftIcon, SaveIcon, FileEditIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios.js";
import { AuthContext } from "../context/authContext.jsx";

const UpdateNotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/documents/${id}`);
        const doc = res.data.data;

        // Ownership guard — only owner or admin may edit
        const isAdmin =
          user?.role === "ADMIN" ||
          user?.role === "ROLE_ADMIN" ||
          user?.role === "admin";
        const isOwner =
          doc.uploadedBy &&
          doc.uploadedBy === (user?.fullName || user?.username);

        if (!isAdmin && !isOwner) {
          toast.error("Access Denied: you are not the owner of this document");
          navigate("/");
          return;
        }

        setTitle(doc.title || "");
        setContent(doc.description || "");
      } catch (error) {
        console.error("Error fetching document", error);
        toast.error("Failed to fetch document details");
        navigate("/");
      } finally {
        setFetching(false);
      }
    };
    fetchNote();
  }, [id, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/documents/${id}`, {
        title: title.trim(),
        description: content.trim(),
      });
      toast.success("Document updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating document", error);
      toast.error(
        error.response?.data?.message || "Failed to update document"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <Link to="/" className="btn btn-ghost mb-6 gap-2">
          <ArrowLeftIcon className="size-4" />
          Back to Documents
        </Link>

        <div className="card bg-base-100 shadow-xl border border-primary/10">
          <div className="card-body p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <FileEditIcon className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral">
                  Edit Document
                </h1>
                <p className="text-sm text-base-content/50">
                  Update the title and description of your document.
                </p>
              </div>
            </div>

            {fetching ? (
              /* Loading Skeleton */
              <div className="space-y-4 animate-pulse">
                <div>
                  <div className="h-4 bg-base-300 rounded w-16 mb-2" />
                  <div className="h-12 bg-base-300 rounded-xl w-full" />
                </div>
                <div>
                  <div className="h-4 bg-base-300 rounded w-24 mb-2" />
                  <div className="h-32 bg-base-300 rounded-xl w-full" />
                </div>
                <div className="flex justify-end gap-3">
                  <div className="h-10 bg-base-300 rounded-xl w-24" />
                  <div className="h-10 bg-primary/30 rounded-xl w-28" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium">
                      Title <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter document title..."
                    className="input input-bordered w-full focus:input-primary transition-colors"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    maxLength={255}
                  />
                  <label className="label pt-1">
                    <span className="label-text-alt text-base-content/40">
                      {title.length}/255
                    </span>
                  </label>
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium">Description</span>
                  </label>
                  <textarea
                    placeholder="Enter a short description..."
                    className="textarea textarea-bordered w-full h-36 resize-none focus:textarea-primary transition-colors"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Link to="/" className="btn btn-ghost" tabIndex={-1}>
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary gap-2"
                    disabled={loading || !title.trim()}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <SaveIcon className="size-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotePage;

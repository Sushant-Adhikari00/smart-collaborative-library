import { useState, useContext, useEffect } from "react";
import { XIcon, UploadIcon, LinkIcon, TagIcon } from "lucide-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { AuthContext } from "../context/authContext";

const CreatePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [mode, setMode] = useState("upload"); // "upload" or "url"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Category state
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    api
      .get("/documents/categories")
      .then((res) => {
        const list = res.data?.data || [];
        setCategories(list);
        if (list.length > 0) setCategoryId(String(list[0].id));
      })
      .catch(() => {
        // Fallback: keep empty — we'll block submit below
        toast.error("Could not load categories");
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!file) return toast.error("Please select a file");
    if (!categoryId) return toast.error("Please select a category");
    if (!user) return toast.error("You must be logged in");

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return toast.error("Only PDF, JPG/PNG, PPT, PPTX, TXT files are allowed");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("categoryId", categoryId);
      formData.append("uploadedBy", user.username || user.email);

      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Document uploaded and indexed by AI!");
      navigate("/");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!supabaseUrl.trim()) return toast.error("Please enter a document URL");
    if (!user) return toast.error("You must be logged in");

    setLoading(true);
    try {
      await api.post("/ai/process-url", {
        title,
        url: supabaseUrl,
        uploadedBy: user.username || user.email,
      });

      toast.success("Document URL indexed by AI!");
      navigate("/");
    } catch (error) {
      console.error("URL submit error:", error);
      toast.error(error.response?.data?.message || "Failed to process URL");
    } finally {
      setLoading(false);
    }
  };

  // Shared category picker rendered in both modes
  const CategorySelect = () => (
    <div className="form-control">
      <label className="label">
        <span className="label-text flex items-center gap-1.5">
          <TagIcon className="size-3.5 text-primary" />
          Category <span className="text-error">*</span>
        </span>
      </label>
      {categoriesLoading ? (
        <div className="skeleton h-12 w-full rounded-lg" />
      ) : categories.length === 0 ? (
        <div className="alert alert-warning text-sm py-2">
          No categories found. Please ask your admin to add categories first.
        </div>
      ) : (
        <select
          className="select select-bordered w-full bg-base-200 focus:border-primary"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a category...
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-primary">Add Document</h2>
            <button
              onClick={() => navigate("/")}
              className="btn btn-ghost btn-sm flex items-center gap-2 text-base-content/70"
            >
              <XIcon className="size-4" /> Close
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab flex items-center gap-2 ${mode === "upload" ? "tab-active" : ""}`}
              onClick={() => setMode("upload")}
            >
              <UploadIcon className="size-4" /> Upload File
            </button>
            <button
              className={`tab flex items-center gap-2 ${mode === "url" ? "tab-active" : ""}`}
              onClick={() => setMode("url")}
            >
              <LinkIcon className="size-4" /> Add by URL
            </button>
          </div>

          {/* Common Fields */}
          <div className="space-y-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Document Title <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                placeholder="Enter a concise title for this document"
                className="input input-bordered w-full bg-base-200 focus:border-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Description (optional)</span>
              </label>
              <textarea
                placeholder="Short description of this document..."
                className="textarea textarea-bordered h-24 w-full bg-base-200 focus:border-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category Picker — shared by both modes */}
            <CategorySelect />
          </div>

          {/* Upload Mode */}
          {mode === "upload" && (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">File (PDF, JPG, PNG, PPT, PPTX, TXT)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx,.txt"
                  className="file-input file-input-bordered w-full bg-base-200 file-input-primary"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <span className="loading loading-spinner" /> : "Upload & Index"}
                </button>
              </div>
            </form>
          )}

          {/* URL Mode */}
          {mode === "url" && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Supabase / Public Document URL <span className="text-error">*</span></span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-supabase-url.supabase.co/storage/v1/object/public/..."
                  className="input input-bordered w-full bg-base-200 focus:border-primary"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">
                    Paste the public URL of a file stored in Supabase Storage or any other publicly accessible URL.
                  </span>
                </label>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <span className="loading loading-spinner" /> : "Process URL"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePage;

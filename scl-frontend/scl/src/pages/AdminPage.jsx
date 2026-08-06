import { useState, useEffect, useContext } from "react";
import {
  Trash2Icon, UserIcon, FileTextIcon, ShieldIcon,
  ActivityIcon, UsersIcon, SearchIcon, RefreshCwIcon,
  SparklesIcon, ExternalLinkIcon, CheckCircle2Icon,
  AlertTriangleIcon, FilterIcon, DatabaseIcon, CpuIcon
} from "lucide-react";
import api from "../lib/axios.js";
import toast from "react-hot-toast";
import { AuthContext } from "../context/authContext.jsx";

const AdminPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [reprocessingAll, setReprocessingAll] = useState(false);
  const [reprocessingId, setReprocessingId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, docsRes, analyticsRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/documents"),
          api.get("/admin/analytics"),
        ]);
        setUsers(usersRes.data?.data?.content || usersRes.data?.data || []);
        setDocuments(docsRes.data?.data || []);
        setAnalytics(analyticsRes.data?.data || null);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteDocument = async (id) => {
    if (!window.confirm("Force delete this document?")) return;
    try {
      await api.delete(`/admin/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete document");
    }
  };

  const handleToggleUser = async (u) => {
    const action = u.active ? "deactivate" : "activate";
    try {
      await api.put(`/admin/users/${u.id}/${action}`);
      setUsers((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, active: !usr.active } : usr))
      );
      toast.success(`User ${action}d successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleUpdateRole = async (u, newRole) => {
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, role: newRole } : usr))
      );
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleReprocessAll = async () => {
    if (!window.confirm("Reprocess ALL documents through the AI pipeline? This may take a while.")) return;
    setReprocessingAll(true);
    try {
      const res = await api.post("/documents/reprocess-all");
      toast.success(res.data?.message || "All documents reprocessed!");
      const docsRes = await api.get("/documents");
      setDocuments(docsRes.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reprocess documents");
    } finally {
      setReprocessingAll(false);
    }
  };

  const handleReprocessOne = async (docId) => {
    setReprocessingId(docId);
    try {
      const res = await api.post(`/documents/${docId}/reprocess`);
      toast.success(res.data?.message || "Document reprocessed!");
      if (res.data?.data) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...res.data.data } : d))
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reprocess document");
    } finally {
      setReprocessingId(null);
    }
  };

  // Reset filters when switching tabs
  useEffect(() => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }, [activeTab]);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = (u.username || u.name || "").toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
    const roleMatch = roleFilter === "ALL" || u.role === roleFilter;
    const statusMatch = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? u.active : !u.active);
    return nameMatch && roleMatch && statusMatch;
  });

  // Filtered Documents
  const filteredDocuments = documents.filter((d) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = d.title.toLowerCase().includes(query) || (d.uploadedBy || "").toLowerCase().includes(query);
    const statusMatch = statusFilter === "ALL" || (statusFilter === "PROCESSED" ? !!d.aiSummary : !d.aiSummary);
    return titleMatch && statusMatch;
  });

  if (!user || (user.role !== "ROLE_ADMIN" && user.role !== "ADMIN" && user.role !== "admin"))
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-300 p-4">
        <div className="alert alert-error max-w-md shadow-lg border border-error/20 flex gap-3">
          <ShieldIcon className="size-8 text-error-content shrink-0" />
          <div>
            <h3 className="font-bold">Access Denied</h3>
            <p className="text-xs">This area is reserved for system administrators only.</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200/50 p-4 md:p-8">
      {/* Title Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary shadow-xs">
              <ShieldIcon className="size-7" />
            </div>
            Admin Control Center
          </h1>
          <p className="text-xs md:text-sm text-base-content/60 mt-1.5">
            Oversee user accounts, check platform resource loads, and manage AI models.
          </p>
        </div>

        {/* System Health Status Widget */}
        <div className="flex items-center gap-4 bg-base-100 p-3.5 rounded-2xl border border-base-300 shadow-xs max-w-sm">
          <div className="flex gap-2">
            <div className="p-2 rounded-xl bg-success/15 text-success">
              <DatabaseIcon className="size-4" />
            </div>
            <div className="p-2 rounded-xl bg-secondary/15 text-secondary">
              <CpuIcon className="size-4" />
            </div>
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-1.5 font-bold text-base-content">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              All Services Operational
            </div>
            <span className="text-base-content/50 text-[10px]">AI Backend Connected (Port 8000)</span>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Accounts", value: analytics.totalUsers, icon: <UsersIcon className="size-5" />, color: "from-blue-500/10 to-indigo-500/10 text-primary" },
            { label: "Indexed Library Files", value: analytics.totalDocuments, icon: <FileTextIcon className="size-5" />, color: "from-emerald-500/10 to-teal-500/10 text-success" },
            { label: "Active Sessions", value: analytics.activeUsers, icon: <ActivityIcon className="size-5" />, color: "from-purple-500/10 to-pink-500/10 text-secondary" },
            { label: "Security Admins", value: analytics.adminCount ?? "-", icon: <ShieldIcon className="size-5" />, color: "from-amber-500/10 to-orange-500/10 text-warning" },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className="card bg-base-100 border border-base-300 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 p-5 flex flex-row items-center gap-4 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-base-200/40 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-3xl font-extrabold text-base-content tracking-tight">{stat.value ?? "-"}</p>
                <p className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Pane */}
      <div className="max-w-7xl mx-auto bg-base-100 border border-base-300 rounded-3xl shadow-sm overflow-hidden">
        {/* Panel Tabs Header */}
        <div className="bg-base-200/50 px-6 pt-4 border-b border-base-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            {[
              { id: "users", label: "Registered Users", count: users.length, icon: <UserIcon className="size-4" /> },
              { id: "documents", label: "Library Documents", count: documents.length, icon: <FileTextIcon className="size-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-base-100 rounded-t-xl"
                    : "border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/30"
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`badge badge-xs font-semibold ${activeTab === tab.id ? 'badge-primary' : 'badge-ghost'}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Quick Reprocess Action on Document Header */}
          {activeTab === "documents" && documents.length > 0 && (
            <button
              className="btn btn-xs btn-outline btn-secondary gap-1.5 mb-2 sm:mb-0"
              onClick={handleReprocessAll}
              disabled={reprocessingAll}
            >
              {reprocessingAll ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <SparklesIcon className="size-3.5 text-secondary" />
              )}
              {reprocessingAll ? "Bulk processing..." : "Bulk Reprocess AI"}
            </button>
          )}
        </div>

        {/* Search & Dynamic Filter Control Bar */}
        <div className="p-4 bg-base-100 border-b border-base-300 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
            <input
              type="text"
              placeholder={activeTab === "users" ? "Search user name, email..." : "Search document title, uploader..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered pl-10 w-full bg-base-200/50 text-xs focus:input-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0">
            <FilterIcon className="size-3.5 text-base-content/40 shrink-0" />
            <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">Filters:</span>

            {/* Users Filters */}
            {activeTab === "users" && (
              <>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="select select-bordered select-xs text-[11px] bg-base-100 focus:select-primary"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered select-xs text-[11px] bg-base-100 focus:select-primary"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Users</option>
                  <option value="INACTIVE">Deactivated Users</option>
                </select>
              </>
            )}

            {/* Documents Filters */}
            {activeTab === "documents" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select select-bordered select-xs text-[11px] bg-base-100 focus:select-primary"
              >
                <option value="ALL">All AI States</option>
                <option value="PROCESSED">AI Processed</option>
                <option value="PENDING">Pending Processing</option>
              </select>
            )}
          </div>
        </div>

        {/* Inner Tab Tables Content */}
        <div className="p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="text-xs text-base-content/50 font-medium">Synching management database...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* USERS RENDER TABLE */}
              {activeTab === "users" && (
                <div className="overflow-x-auto rounded-2xl border border-base-300">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-16 text-base-content/50 space-y-2">
                      <UsersIcon className="size-8 mx-auto text-base-content/30" />
                      <p className="text-sm font-semibold">No matching users found</p>
                      <p className="text-xs text-base-content/40">Try adjusting your filters or search query.</p>
                    </div>
                  ) : (
                    <table className="table table-md table-zebra bg-base-100">
                      <thead>
                        <tr className="bg-base-200/50 text-[11px] uppercase tracking-wide text-base-content/50">
                          <th className="whitespace-nowrap">User</th>
                          <th className="whitespace-nowrap hidden sm:table-cell">Email</th>
                          <th className="whitespace-nowrap">Role</th>
                          <th className="whitespace-nowrap">Status</th>
                          <th className="text-right whitespace-nowrap">Controls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-base-200/30 transition-colors">
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="avatar placeholder">
                                  <div className="bg-neutral text-neutral-content rounded-xl w-8 h-8 font-bold text-xs uppercase">
                                    {(u.username || u.name || "U").charAt(0)}
                                  </div>
                                </div>
                                <span className="font-bold text-xs text-base-content">{u.username || u.name}</span>
                              </div>
                            </td>
                            <td className="text-xs text-base-content/75 font-mono hidden sm:table-cell">{u.email}</td>
                            <td>
                              {/* Role color badge + dropdown — equal height aligned */}
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center justify-center w-20 h-7 px-2.5 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0 ${
                                  u.role === "ADMIN"
                                    ? "bg-primary/15 text-primary border border-primary/30"
                                    : u.role === "TEACHER"
                                    ? "bg-warning/15 text-warning border border-warning/30"
                                    : "bg-base-content/10 text-base-content/60 border border-base-content/15"
                                }`}>
                                  {u.role === "ADMIN" ? "⚙ Admin" : u.role === "TEACHER" ? "🎓 Teacher" : "👤 Student"}
                                </span>
                                {u.id !== user.id && (
                                  <select
                                    className="select select-bordered select-xs font-semibold text-[11px] h-7 min-h-0 rounded-lg"
                                    value={u.role}
                                    onChange={(e) => handleUpdateRole(u, e.target.value)}
                                  >
                                    <option value="STUDENT">Student</option>
                                    <option value="TEACHER">Teacher</option>
                                    <option value="ADMIN">Admin</option>
                                  </select>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none whitespace-nowrap ${
                                u.active
                                  ? "bg-success/15 text-success border border-success/30"
                                  : "bg-error/15 text-error border border-error/30"
                              }`}>
                                <span className={`size-1.5 rounded-full shrink-0 ${u.active ? 'bg-success' : 'bg-error'}`} />
                                {u.active ? "Active" : "Suspended"}
                              </span>
                            </td>
                            <td className="text-right">
                              {u.id !== user.id ? (
                                <button
                                  onClick={() => handleToggleUser(u)}
                                  title={u.active ? "Suspend account" : "Activate account"}
                                  className={`inline-flex items-center gap-1.5 px-3 h-7 rounded-lg text-[11px] font-bold border transition-all duration-200 ${
                                    u.active
                                      ? "bg-error/10 text-error border-error/25 hover:bg-error/20"
                                      : "bg-success/10 text-success border-success/25 hover:bg-success/20"
                                  }`}
                                >
                                  <span className={`size-1.5 rounded-full shrink-0 ${u.active ? 'bg-error' : 'bg-success'}`} />
                                  {u.active ? "Suspend" : "Activate"}
                                </button>
                              ) : (
                                <span className="text-[10px] text-base-content/30 italic">You</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* DOCUMENTS RENDER TABLE */}
              {activeTab === "documents" && (
                <div className="overflow-x-auto rounded-2xl border border-base-300">
                  {filteredDocuments.length === 0 ? (
                    <div className="text-center py-16 text-base-content/50 space-y-2">
                      <FileTextIcon className="size-8 mx-auto text-base-content/30" />
                      <p className="text-sm font-semibold">No matching documents found</p>
                      <p className="text-xs text-base-content/40">Try adjusting your filters or search query.</p>
                    </div>
                  ) : (
                    <table className="table table-md table-zebra bg-base-100">
                      <thead>
                        <tr className="bg-base-200/50 text-xs">
                          <th>Document Title</th>
                          <th>Uploaded By</th>
                          <th>AI Status</th>
                          <th>File Storage</th>
                          <th className="text-right">Management</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-base-200/30 transition-colors">
                            <td>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 bg-base-200 rounded-lg text-base-content/70 shrink-0">
                                  <FileTextIcon className="size-4" />
                                </div>
                                <span className="font-bold text-xs text-base-content truncate" title={doc.title}>
                                  {doc.title}
                                </span>
                              </div>
                            </td>
                            <td className="text-xs text-base-content/75">{doc.uploadedBy || "System"}</td>
                            <td>
                              {doc.aiSummary ? (
                                <span className="badge badge-success badge-sm gap-1 font-bold text-[10px] py-1.5">
                                  <CheckCircle2Icon className="size-3" /> Grounded
                                </span>
                              ) : (
                                <span className="badge badge-warning badge-sm gap-1 font-bold text-[10px] py-1.5">
                                  <AlertTriangleIcon className="size-3" /> Unprocessed
                                </span>
                              )}
                            </td>
                            <td>
                              {doc.fileUrl ? (
                                <a 
                                  href={doc.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-xs btn-ghost gap-1 font-bold text-primary"
                                >
                                  <ExternalLinkIcon className="size-3" /> View File
                                </a>
                              ) : (
                                <span className="text-base-content/40 text-xs italic">No resource link</span>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  className="btn btn-ghost btn-circle btn-xs text-secondary hover:bg-secondary/10"
                                  onClick={() => handleReprocessOne(doc.id)}
                                  disabled={reprocessingId === doc.id}
                                  title="Force Index RAG Pipelines"
                                >
                                  {reprocessingId === doc.id ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    <RefreshCwIcon className="size-3.5" />
                                  )}
                                </button>
                                <button
                                  className="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/10"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  title="Force delete library entry"
                                >
                                  <Trash2Icon className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

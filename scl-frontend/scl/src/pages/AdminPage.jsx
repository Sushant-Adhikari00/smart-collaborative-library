import { useState, useEffect, useContext } from "react";
import {
  Trash2Icon, UserIcon, FileTextIcon, ShieldIcon,
  ActivityIcon, UsersIcon, ToggleLeftIcon, ToggleRightIcon
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Spring Boot: GET /api/v1/admin/users  → paginated { content: [...] }
        // Spring Boot: GET /api/v1/documents    → all docs
        // Spring Boot: GET /api/v1/admin/analytics
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
    if (!window.confirm(`${u.active ? "Deactivate" : "Activate"} this user?`)) return;
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

  if (!user || user.role !== "ROLE_ADMIN")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="alert alert-error max-w-md">
          <ShieldIcon className="size-6" />
          <span>Access Denied: Admins only</span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <ShieldIcon className="text-primary size-8" /> Admin Dashboard
      </h1>
      <p className="text-base-content/60 mb-6">Manage users, documents, and view platform analytics.</p>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: analytics.totalUsers, icon: <UsersIcon className="size-5" /> },
            { label: "Total Documents", value: analytics.totalDocuments, icon: <FileTextIcon className="size-5" /> },
            { label: "Active Users", value: analytics.activeUsers, icon: <ActivityIcon className="size-5" /> },
            { label: "Admins", value: analytics.adminCount ?? "-", icon: <ShieldIcon className="size-5" /> },
          ].map((stat) => (
            <div key={stat.label} className="card bg-base-100 shadow p-4 flex flex-row items-center gap-3">
              <div className="text-primary">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold">{stat.value ?? "-"}</p>
                <p className="text-xs text-base-content/60">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg" /></div>}

      {!loading && (
        <>
          {/* Tabs */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab flex items-center gap-2 ${activeTab === "users" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <UserIcon className="size-4" /> Users ({users.length})
            </button>
            <button
              className={`tab flex items-center gap-2 ${activeTab === "documents" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              <FileTextIcon className="size-4" /> Documents ({documents.length})
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <section>
              {users.length === 0 ? (
                <p className="text-center text-base-content/50 py-10">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra bg-base-100 rounded-xl shadow">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="font-medium">{u.username || u.name}</td>
                          <td className="text-base-content/70">{u.email}</td>
                          <td>
                            <select
                              className="select select-xs select-bordered"
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u, e.target.value)}
                              disabled={u.id === user.id}
                            >
                              <option value="ROLE_USER">User</option>
                              <option value="ROLE_ADMIN">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span className={`badge badge-sm ${u.active ? "badge-success" : "badge-error"}`}>
                              {u.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-right">
                            {u.id !== user.id && (
                              <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => handleToggleUser(u)}
                                title={u.active ? "Deactivate" : "Activate"}
                              >
                                {u.active
                                  ? <ToggleRightIcon className="size-4 text-success" />
                                  : <ToggleLeftIcon className="size-4 text-error" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <section>
              {documents.length === 0 ? (
                <p className="text-center text-base-content/50 py-10">No documents found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra bg-base-100 rounded-xl shadow">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Uploaded By</th>
                        <th>File URL</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id}>
                          <td className="font-medium">{doc.title}</td>
                          <td className="text-base-content/70">{doc.uploadedBy || "-"}</td>
                          <td>
                            {doc.fileUrl ? (
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="link link-primary text-xs">
                                View File
                              </a>
                            ) : (
                              <span className="text-base-content/40 text-xs">No file</span>
                            )}
                          </td>
                          <td className="text-right">
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2Icon className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPage;

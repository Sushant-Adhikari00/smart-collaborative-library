import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios.js";

export default function ResetPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Pre-fill from RequestReset if passed via state
  const { email: passedEmail, code: passedCode } = location.state || {};

  const [email, setEmail] = useState(passedEmail || "");
  const [code, setCode] = useState(passedCode || "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !code || !newPassword)
      return toast.error("All fields are required");

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        code,
        newPassword,
      });
      toast.success(res.data.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md p-6 bg-base-100 shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input input-bordered mb-4 w-full"
        />
        <input
          type="text"
          placeholder="Reset code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input input-bordered mb-4 w-full"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input input-bordered mb-4 w-full"
        />

        <button
          onClick={handleReset}
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios.js";

export default function RequestReset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async () => {
    if (!email) return toast.error("Please enter your email");
    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password-request", { email });
      const resetCode = res.data.resetCode;

      toast.success("Reset code generated! Redirecting...");

      // Redirect to ResetPage with email + resetCode
      navigate("/reset-password", { state: { email, code: resetCode } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error requesting reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md p-6 bg-base-100 shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input input-bordered mb-4 w-full"
        />
        <button
          onClick={handleRequest}
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Sending..." : "Request Reset Code"}
        </button>
      </div>
    </div>
  );
}

import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { AuthContext } from "../context/authContext.jsx";
import { ArrowLeftIcon } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
      setEmailError("Invalid email format");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      // Spring Boot returns: { success, message, data: { accessToken, refreshToken, user } }
      const { accessToken, refreshToken, user } = res.data.data;
      const userWithToken = { ...user, token: accessToken };
      setUser(userWithToken);
      localStorage.setItem("user", JSON.stringify(userWithToken));
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Welcome Back!</h1>
            <p className="text-base-content/70">Sign in to continue to SCL Library</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`input input-bordered w-full ${emailError ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
              />
              {emailError && <p className="text-error text-sm mt-1">{emailError}</p>}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered w-full ${passwordError ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              {passwordError && <p className="text-error text-sm mt-1">{passwordError}</p>}
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : "Login"}
            </button>
          </form>

          

          <p className="mt-4 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
        <div className="text-center mt-4">
          <Link to="/" className="btn btn-link text-base-content/70">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

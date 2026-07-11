import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { AuthContext } from "../context/authContext.jsx";
import { ArrowLeftIcon } from "lucide-react";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");

    if (!name.trim()) {
      setNameError("Full name is required");
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
      setEmailError("Invalid email format");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 8) {
      // Backend requires min 8 characters
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Spring Boot RegisterRequest: { fullName, email, password, role }
      const res = await api.post("/auth/register", {
        fullName: name,
        email,
        password,
        role,  // "STUDENT" | "TEACHER" | "ADMIN"
      });
      // Spring Boot returns: { success, message, data: { accessToken, refreshToken, user } }
      toast.success("Signup successful! Please login.");
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Create an Account</h1>
            <p className="text-base-content/70">Join SCL Library today!</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                placeholder="Your full name"
                className={`input input-bordered w-full ${nameError ? 'input-error' : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
              />
              {nameError && <p className="text-error text-sm mt-1">{nameError}</p>}
            </div>
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

            {/* Role selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">I am a... <span className="text-error">*</span></span>
              </label>
              <select
                className="select select-bordered w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="STUDENT">🎓 Student</option>
                <option value="TEACHER">📚 Teacher</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/50">Select your role to personalise your experience</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : "Sign Up"}
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Login
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

export default SignupPage;

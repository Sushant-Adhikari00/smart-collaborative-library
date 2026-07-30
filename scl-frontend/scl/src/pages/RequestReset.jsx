import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import toast from "react-hot-toast";
import api from "../lib/axios.js";
import {
  ArrowLeftIcon,
  MailIcon,
  ShieldCheckIcon,
  KeyRoundIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
} from "lucide-react";

// ─── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ step }) => {
  const steps = [
    { icon: MailIcon, label: "Email" },
    { icon: ShieldCheckIcon, label: "Verify OTP" },
    { icon: KeyRoundIcon, label: "New Password" },
  ];

  return (
    <div className="flex items-center justify-center mb-8 gap-0">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = i + 1 === step;
        const isDone = i + 1 < step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  isDone
                    ? "bg-success border-success text-success-content"
                    : isActive
                    ? "bg-primary border-primary text-primary-content shadow-lg scale-110"
                    : "bg-base-200 border-base-300 text-base-content/40"
                }`}
              >
                {isDone ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium transition-all duration-300 ${
                  isActive
                    ? "text-primary"
                    : isDone
                    ? "text-success"
                    : "text-base-content/40"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 mb-5 transition-all duration-500 ${
                  isDone ? "bg-success" : "bg-base-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── OTP input boxes ───────────────────────────────────────────────────────────
const OtpInput = ({ otp, setOtp, length = 6 }) => {
  const inputRefs = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/, "");
    if (!val) return;
    const next = [...otp];
    next[idx] = val[val.length - 1];
    setOtp(next);
    if (idx < length - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      const next = [...otp];
      if (next[idx]) {
        next[idx] = "";
        setOtp(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    const focusIdx = Math.min(text.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={`w-11 h-12 text-center text-xl font-bold rounded-lg border-2 bg-base-100 focus:outline-none transition-all duration-200 ${
            otp[i]
              ? "border-primary text-primary"
              : "border-base-300 focus:border-primary"
          }`}
        />
      ))}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  // Step 2 – OTP
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // Step 3 – new password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [resetting, setResetting] = useState(false);

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setTimeout(
        () => setResendCooldown((c) => c - 1),
        1000
      );
    }
    return () => clearTimeout(cooldownRef.current);
  }, [resendCooldown]);

  // ── Step 1: send OTP ─────────────────────────────────────────────────────
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
      setEmailError("Invalid email format");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!validateEmail()) return;

    setSendingCode(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP sent! Check your inbox.");
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingCode(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setSendingCode(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("New OTP sent!");
      setOtp(Array(6).fill(""));
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setSendingCode(false);
    }
  };

  // ── Step 2 → 3: verify OTP length then move on ───────────────────────────
  const handleVerifyOtp = (e) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the full 6-digit OTP");
      return;
    }
    setStep(3);
  };

  // ── Step 3: reset password ────────────────────────────────────────────────
  const validatePasswords = () => {
    const errs = {};
    if (!newPassword) {
      errs.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!validatePasswords()) return;

    const code = otp.join("");
    setResetting(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp: code,
        newPassword,
      });
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password";
      toast.error(msg);
      // If OTP is invalid/expired, jump back to OTP step
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setStep(2);
        setOtp(Array(6).fill(""));
      }
    } finally {
      setResetting(false);
    }
  };

  // ── Strength indicator ───────────────────────────────────────────────────
  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 6) s++;
    if (newPassword.length >= 10) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-error", "bg-warning", "bg-info", "bg-success"][strength];

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-3">
              <KeyRoundIcon className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-base-content">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Check Your Email"}
              {step === 3 && "Set New Password"}
            </h1>
            <p className="text-base-content/60 text-sm mt-1">
              {step === 1 && "Enter your email to receive a reset OTP"}
              {step === 2 && (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-primary">{email}</span>
                </>
              )}
              {step === 3 && "Create a strong new password"}
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator step={step} />

          {/* ── STEP 1: Email ──────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email address</span>
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={`input input-bordered w-full pl-10 ${
                      emailError ? "input-error" : ""
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    autoFocus
                  />
                </div>
                {emailError && (
                  <p className="text-error text-sm mt-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={sendingCode}
              >
                {sendingCode ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <MailIcon className="w-4 h-4 mr-1" />
                    Send Reset Code
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ─────────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="label justify-center mb-2">
                  <span className="label-text font-medium">Enter 6-digit OTP</span>
                </label>
                <OtpInput otp={otp} setOtp={setOtp} />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
              >
                <ShieldCheckIcon className="w-4 h-4 mr-1" />
                Verify OTP
              </button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-base-content/60 text-sm">
                  Didn&apos;t receive it?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-base-content/40">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={sendingCode}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <RefreshCwIcon className="w-3 h-3" />
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>

              {/* Back */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost btn-sm w-full text-base-content/60"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Change email
              </button>
            </form>
          )}

          {/* ── STEP 3: New Password ─────────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className={`input input-bordered w-full pr-10 ${
                      pwErrors.newPassword ? "input-error" : ""
                    }`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwErrors((p) => ({ ...p, newPassword: "" }));
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showNew ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {pwErrors.newPassword && (
                  <p className="text-error text-sm mt-1">{pwErrors.newPassword}</p>
                )}

                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength ? strengthColor : "bg-base-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      strength <= 1 ? "text-error" :
                      strength === 2 ? "text-warning" :
                      strength === 3 ? "text-info" :
                      "text-success"
                    }`}>
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    className={`input input-bordered w-full pr-10 ${
                      pwErrors.confirmPassword ? "input-error" : ""
                    }`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPwErrors((p) => ({ ...p, confirmPassword: "" }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showConfirm ? (
                      <EyeOffIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {pwErrors.confirmPassword && (
                  <p className="text-error text-sm mt-1">{pwErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={resetting}
              >
                {resetting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Reset Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-ghost btn-sm w-full text-base-content/60"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back to OTP
              </button>
            </form>
          )}

          {/* Bottom link */}
          <div className="divider mt-6 mb-2" />
          <p className="text-center text-sm text-base-content/60">
            Remember your password?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="btn btn-link text-base-content/70">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

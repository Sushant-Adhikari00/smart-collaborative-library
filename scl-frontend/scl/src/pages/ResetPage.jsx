import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Legacy route /reset-password — redirects to the unified /forgot-password flow.
 * All reset logic is now handled in RequestReset.jsx (ForgotPassword component).
 */
export default function ResetPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/forgot-password", { replace: true });
  }, [navigate]);

  return null;
}

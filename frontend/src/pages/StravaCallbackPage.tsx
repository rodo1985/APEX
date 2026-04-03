import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useSession } from "../lib/auth";

export function StravaCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { api, refreshProfile } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing the Strava connection...");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setMessage("Missing Strava authorization code.");
      return;
    }

    const authorizationCode = code;

    async function finish() {
      try {
        await api.finishStravaConnect(authorizationCode);
        await refreshProfile();
        setStatus("success");
        setMessage("Strava connected. Importing your recent training history now.");
        const returnTo = window.sessionStorage.getItem("apex.strava.returnTo") ?? "/onboarding";
        window.sessionStorage.removeItem("apex.strava.returnTo");
        window.setTimeout(() => navigate(returnTo, { replace: true }), 1200);
      } catch (requestError) {
        setStatus("error");
        setMessage(requestError instanceof Error ? requestError.message : "Unable to connect Strava.");
      }
    }

    void finish();
  }, [api, navigate, refreshProfile, searchParams]);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className={status === "error" ? "error-banner" : status === "success" ? "success-banner" : "notice-banner"}>
          {message}
        </div>
      </div>
    </div>
  );
}

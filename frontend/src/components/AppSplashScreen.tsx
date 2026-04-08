import { createPortal } from "react-dom";

import { ApexIcon, ApexWordmark } from "./Brand";

interface AppSplashScreenProps {
  fullscreen?: boolean;
  label: string;
  subtitle?: string;
}

/**
 * Renders the branded APEX splash/loading state used across the app shell.
 */
export function AppSplashScreen({
  fullscreen = false,
  label,
  subtitle = "Syncing nutrition, activity, and target context.",
}: AppSplashScreenProps) {
  const splash = (
    <div
      aria-live="polite"
      className={`dashboard-loader${fullscreen ? " fullscreen" : " overlay"} viewport`}
    >
      <div className="dashboard-loader-glow" />
      <div className="dashboard-loader-content">
        <div className="dashboard-loader-brand">
          <div className="dashboard-loader-heartbeat">
            <ApexIcon size={fullscreen ? 92 : 74} />
          </div>
          <ApexWordmark size={fullscreen ? 34 : 28} />
        </div>
        <div className="dashboard-loader-copy">
          <strong>{label}</strong>
          <span>{subtitle}</span>
        </div>
        <div className="dashboard-loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return splash;
  }

  return createPortal(splash, document.body);
}

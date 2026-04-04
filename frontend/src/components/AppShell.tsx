import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { ApexLockup, Icon } from "./Brand";
import { CoachDock } from "./CoachDock";
import { useSession } from "../lib/auth";

const desktopNavItems = [
  { to: "/app/today", label: "Today", icon: "home" as const },
  { to: "/app/log", label: "Food Log", icon: "fork" as const },
  { to: "/app/train", label: "Training", icon: "bike" as const },
];

const mobileNavItems = [
  { to: "/app/today", label: "Today", icon: "home" as const },
  { to: "/app/log", label: "Log", icon: "fork" as const },
  { to: "/app/train", label: "Train", icon: "bike" as const },
  { to: "/app/coach", label: "Coach", icon: "chat" as const },
];

export function AppShell() {
  const { user, logout } = useSession();
  const location = useLocation();
  const greeting = getGreeting();
  const showCoachRail = !location.pathname.startsWith("/app/coach");

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link to="/app/today" className="workspace-brand">
          <ApexLockup size={36} wordmarkSize={22} mode="naked" />
        </Link>

        <nav className="workspace-nav">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `workspace-nav-link${isActive ? " active" : ""}`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/app/settings" className="workspace-user-card">
          <div className="workspace-user-avatar">{user?.name?.slice(0, 1) ?? "A"}</div>
          <div className="workspace-user-copy">
            <strong>{user?.name ?? "Athlete"}</strong>
            <span>Settings</span>
          </div>
          <Icon name="chevron" size={14} />
        </NavLink>

        <button className="workspace-logout" onClick={() => void logout()}>
          <Icon name="logout" size={18} />
          <span>Log out</span>
        </button>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <div className="workspace-topbar-date">{formatShellDate()}</div>
            <div className="workspace-topbar-title">
              {greeting}, {user?.name?.split(" ")[0] ?? "athlete"}
            </div>
            <div className="workspace-topbar-subtitle">{pageSummary(location.pathname)}</div>
          </div>

          <div className="workspace-topbar-actions">
            <div className="workspace-live-pill">
              <span className="workspace-live-dot" />
              Live data
            </div>
            <Link to="/app/coach" className="workspace-icon-button workspace-mobile-only" aria-label="Open coach">
              <Icon name="chat" size={16} />
            </Link>
            <Link to="/app/settings" className="workspace-icon-button" aria-label="Open settings">
              <Icon name="menu" size={16} />
            </Link>
          </div>
        </header>

        <main className="workspace-page">
          <Outlet />
        </main>

        <nav className="workspace-mobile-nav">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `workspace-mobile-link${isActive ? " active" : ""}`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {showCoachRail ? (
        <div className="workspace-rail">
          <CoachDock mode="rail" />
        </div>
      ) : null}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatShellDate() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function pageSummary(pathname: string) {
  if (pathname.startsWith("/app/log")) {
    return "Review-first meal logging with manual, voice, and photo capture.";
  }

  if (pathname.startsWith("/app/train")) {
    return "Load, recent sessions, and Strava-backed training context.";
  }

  if (pathname.startsWith("/app/coach")) {
    return "Context-aware coaching with training, fuelling, and recovery in view.";
  }

  if (pathname.startsWith("/app/settings")) {
    return "Profile, integrations, and the operational details behind APEX.";
  }

  return "The daily command centre for fuelling, load, and coaching decisions.";
}

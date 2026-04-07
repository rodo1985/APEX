import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { ApexLockup, Icon } from "./Brand";
import { CoachDock } from "./CoachDock";
import { useSession } from "../lib/auth";

const desktopNavItems = [
  { to: "/app/today", label: "Dashboard", icon: "home" as const },
  { to: "/app/log", label: "Food Log", icon: "fork" as const },
  { to: "/app/train", label: "Training", icon: "bike" as const },
];

const mobileNavItems = [
  { to: "/app/today", label: "Dashboard", icon: "home" as const },
  { to: "/app/log", label: "Log", icon: "fork" as const },
  { to: "/app/train", label: "Train", icon: "bike" as const },
  { to: "/app/coach", label: "Coach", icon: "chat" as const },
];

export function AppShell() {
  const { user, logout } = useSession();
  const location = useLocation();
  const greeting = getGreeting();
  const showCoachRail = !location.pathname.startsWith("/app/coach");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [coachRailOpen, setCoachRailOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSidebarPreference = window.localStorage.getItem("apex.sidebarCollapsed");
    const storedPreference = window.localStorage.getItem("apex.coachRailOpen");
    if (storedSidebarPreference === "true") {
      setSidebarCollapsed(true);
    }
    if (storedPreference === "true") {
      setCoachRailOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("apex.sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("apex.coachRailOpen", String(coachRailOpen));
  }, [coachRailOpen]);

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
        <div className="workspace-sidebar-header">
          <button
            type="button"
            className="workspace-icon-button workspace-sidebar-toggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            <Icon name="sidebar" size={17} />
          </button>

          <Link to="/app/today" className="workspace-brand">
            <ApexLockup size={36} wordmarkSize={22} mode="naked" />
          </Link>
        </div>

        <nav className="workspace-nav">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `workspace-nav-link${isActive ? " active" : ""}`}
              title={item.label}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar-footer">
          <NavLink to="/app/settings" className="workspace-user-card" title="Settings">
            <div className="workspace-user-avatar">{user?.name?.slice(0, 1) ?? "A"}</div>
            <div className="workspace-user-copy">
              <strong>{user?.name ?? "Athlete"}</strong>
              <span>Settings</span>
            </div>
            <Icon name="chevron" size={14} />
          </NavLink>

          <button className="workspace-logout" onClick={() => void logout()} title="Log out">
            <Icon name="logout" size={18} />
            <span>Log out</span>
          </button>
        </div>
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
            {showCoachRail ? (
              <button
                type="button"
                className={`workspace-icon-button workspace-rail-toggle-button${coachRailOpen ? " active" : ""}`}
                onClick={() => setCoachRailOpen((current) => !current)}
                aria-label={coachRailOpen ? "Hide APEX coach" : "Show APEX coach"}
                aria-expanded={coachRailOpen}
              >
                <Icon name="panel-right" size={17} />
              </button>
            ) : null}
            <Link to="/app/coach" className="workspace-icon-button workspace-mobile-only" aria-label="Open coach">
              <Icon name="chat" size={16} />
            </Link>
            <Link to="/app/settings" className="workspace-icon-button" aria-label="Open settings">
              <Icon name="settings" size={16} />
            </Link>
            <button className="workspace-icon-button" type="button" aria-label="Log out" onClick={() => void logout()}>
              <Icon name="logout" size={16} />
            </button>
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

      {showCoachRail && !coachRailOpen ? (
        <button
          type="button"
          className="workspace-rail-peek"
          onClick={() => setCoachRailOpen(true)}
          aria-label="Open APEX coach"
          title="Open APEX coach"
        >
          <Icon name="panel-right" size={18} />
        </button>
      ) : null}

      {showCoachRail && coachRailOpen ? (
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

  return "The main dashboard for daily fuelling, training load, and coaching context.";
}

import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { ApexLockup, Icon } from "./Brand";
import { useSession } from "../lib/auth";

const navItems = [
  { to: "/app/today", label: "Today", icon: "home" as const },
  { to: "/app/log", label: "Food Log", icon: "fork" as const },
  { to: "/app/train", label: "Training", icon: "bike" as const },
  { to: "/app/coach", label: "Coach", icon: "chat" as const },
  { to: "/app/settings", label: "Settings", icon: "settings" as const },
];

export function AppShell() {
  const { user, logout } = useSession();
  const location = useLocation();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Link to="/app/today" className="sidebar-logo">
          <ApexLockup size={36} wordmarkSize={24} mode="naked" />
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-footer" onClick={() => void logout()}>
          <div className="sidebar-avatar">{user?.name?.slice(0, 1) ?? "A"}</div>
          <div className="sidebar-user-copy">
            <strong>{user?.name ?? "Athlete"}</strong>
            <span>Log out</span>
          </div>
          <Icon name="logout" />
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">APEX command centre</p>
            <h1>{pageTitle(location.pathname)}</h1>
          </div>
          <div className="dashboard-header-actions">
            <span className="status-pill">
              <span className="status-dot" />
              Live data
            </span>
            <Link to="/app/settings" className="icon-button" aria-label="Open settings">
              <Icon name="settings" />
            </Link>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>

        <nav className="mobile-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-nav-link${isActive ? " active" : ""}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

function pageTitle(pathname: string) {
  const match = navItems.find((item) => pathname.startsWith(item.to));
  return match?.label ?? "APEX";
}

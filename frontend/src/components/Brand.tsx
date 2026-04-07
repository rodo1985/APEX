import type { CSSProperties, ReactNode } from "react";

const COLORS = {
  teal: "#2DD4BF",
  dark: "#0d1411",
  white: "#F5F7FB",
};

export function ApexIcon({ size = 56, mode = "dark" }: { size?: number; mode?: "dark" | "light" | "naked" }) {
  const stroke = mode === "light" ? COLORS.dark : COLORS.teal;
  const fill = mode === "light" ? COLORS.dark : COLORS.teal;
  const showBackground = mode !== "naked";

  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      {showBackground ? <rect width="72" height="72" rx="18" fill={mode === "light" ? COLORS.white : COLORS.dark} /> : null}
      <path
        d="M36 55 C35 55 13 42 13 28 C13 20.5 19 15 26 15 C30.5 15 34 17.5 36 21 C38 17.5 41.5 15 46 15 C53 15 59 20.5 59 28 C59 42 37 55 36 55 Z"
        fill={fill}
        fillOpacity={showBackground ? 0.1 : 0.15}
        stroke={stroke}
        strokeWidth="2"
      />
      <polyline
        points="18,34 23,34 27,25 31,43 35,19 39,43 43,30 47,34 54,34"
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ApexWordmark({ size = 28, style }: { size?: number; style?: CSSProperties }) {
  return (
    <span className="apex-wordmark" style={{ fontSize: size, ...style }}>
      APE<span className="apex-wordmark-accent">X</span>
    </span>
  );
}

export function ApexLockup({
  size = 34,
  wordmarkSize = 22,
  mode = "dark",
}: {
  size?: number;
  wordmarkSize?: number;
  mode?: "dark" | "light" | "naked";
}) {
  return (
    <div className="apex-lockup">
      <ApexIcon size={size} mode={mode} />
      <ApexWordmark size={wordmarkSize} style={{ color: mode === "light" ? "#0a0b0d" : "#F5F7FB" }} />
    </div>
  );
}

export function Icon({
  name,
  size = 18,
}: {
  name:
    | "panel"
    | "home"
    | "fork"
    | "bike"
    | "chat"
    | "settings"
    | "mic"
    | "camera"
    | "plus"
    | "search"
    | "arrow"
    | "bell"
    | "target"
    | "bolt"
    | "drop"
    | "heart"
    | "calendar"
    | "logout"
    | "check"
    | "send"
    | "close"
    | "menu"
    | "user"
    | "key"
    | "link2"
    | "chevron"
    | "sidebar"
    | "panel-right"
    | "moon"
    | "run"
    | "info";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const icons: Record<string, ReactNode> = {
    panel: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M9 5v14" />
      </>
    ),
    home: <path d="M3 9.5L12 3l9 6.5V21H3z" />,
    fork: (
      <>
        <path d="M8 3v5a3 3 0 0 0 6 0V3" />
        <path d="M11 11v10" />
        <path d="M16 3v5c0 1.4-.6 2.5-1.5 3.5V21" />
      </>
    ),
    bike: (
      <>
        <circle cx="6" cy="17" r="4" />
        <circle cx="18" cy="17" r="4" />
        <path d="M6 17l4-8h4l4 8M10 9l3 8" />
      </>
    ),
    chat: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.7 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <path d="M12 19v3" />
        <path d="M8 22h8" />
      </>
    ),
    camera: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h6l2 2h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    close: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    sidebar: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </>
    ),
    "panel-right": (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M15 4v16" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </>
    ),
    menu: (
      <>
        <path d="M3 6h18" />
        <path d="M3 12h18" />
        <path d="M3 18h18" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
    bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
    drop: <path d="M12 2C7.5 8 5 12.2 5 16a7 7 0 0 0 14 0c0-3.8-2.5-8-7-14Z" />,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />,
    heart: <path d="m12 21-7-7a5 5 0 0 1 7-7l0 0a5 5 0 0 1 7 7Z" />,
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
    key: (
      <>
        <circle cx="7.5" cy="15.5" r="3.5" />
        <path d="M11 12l8-8" />
        <path d="M17 6l2 2" />
        <path d="M15 8l2 2" />
      </>
    ),
    link2: (
      <>
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.1-7.1L11.7 5" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.6" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
    check: <path d="m20 6-11 11-5-5" />,
    send: (
      <>
        <path d="m22 2-9.5 19-2.5-8.5L2 10 22 2Z" />
      </>
    ),
    run: (
      <>
        <circle cx="17" cy="4" r="1.5" fill="currentColor" stroke="none" />
        <path d="m11 7 2-3 4 2-2 4" />
        <path d="m4 13 3-2 3.5 3-3 4" />
        <path d="m13.5 12 4 2-2 5" />
        <path d="m7.5 21 2-5 3.5 2" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

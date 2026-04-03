import { useState } from "react";

const teal = "#2DD4BF";
const bg = "#0a0b0d";
const card = "#111318";
const border = "#1e2228";
const muted = "#4a5568";
const textPrimary = "#e8eaed";
const textSecondary = "#8a9bb0";

const layers = [
  {
    id: "client",
    label: "CLIENT",
    color: teal,
    nodes: [
      { id: "react", label: "React App", sub: "Vite · TypeScript", icon: "⬡" },
    ],
  },
  {
    id: "edge",
    label: "EDGE / CDN",
    color: "#60a5fa",
    nodes: [
      { id: "vercel", label: "Vercel", sub: "Frontend deploy · CDN", icon: "▲" },
    ],
  },
  {
    id: "backend",
    label: "BACKEND",
    color: "#a78bfa",
    nodes: [
      { id: "fastapi", label: "FastAPI", sub: "Python · REST + WebSocket", icon: "⚡" },
      { id: "whisper", label: "Whisper", sub: "STT · voice logging", icon: "🎙" },
    ],
  },
  {
    id: "ai",
    label: "AI LAYER",
    color: "#f472b6",
    nodes: [
      { id: "claude", label: "Claude API", sub: "claude-sonnet-4 · coaching", icon: "◈" },
      { id: "memory", label: "Memory Manager", sub: "context window + summaries", icon: "◎" },
    ],
  },
  {
    id: "data",
    label: "DATA LAYER",
    color: "#fb923c",
    nodes: [
      { id: "supabase", label: "Supabase", sub: "PostgreSQL · Auth · Storage", icon: "⬡" },
      { id: "pgvector", label: "pgvector", sub: "Embeddings · semantic recall", icon: "◈" },
    ],
  },
  {
    id: "integrations",
    label: "INTEGRATIONS",
    color: "#34d399",
    nodes: [
      { id: "strava", label: "Strava API", sub: "OAuth · Webhooks · TSS/CTL", icon: "S" },
      { id: "gcal", label: "Google Calendar", sub: "OAuth · scheduling", icon: "G" },
      { id: "health", label: "Apple Health", sub: "XML export / HealthKit", icon: "♥" },
    ],
  },
];

const flows = [
  { from: "react", to: "vercel", label: "deploy" },
  { from: "react", to: "fastapi", label: "API calls" },
  { from: "fastapi", to: "whisper", label: "audio" },
  { from: "fastapi", to: "claude", label: "prompts" },
  { from: "fastapi", to: "supabase", label: "CRUD" },
  { from: "claude", to: "memory", label: "context" },
  { from: "memory", to: "pgvector", label: "embeddings" },
  { from: "memory", to: "supabase", label: "summaries" },
  { from: "fastapi", to: "strava", label: "sync" },
  { from: "fastapi", to: "gcal", label: "events" },
  { from: "fastapi", to: "health", label: "import" },
];

const memoryModel = [
  {
    tier: "Tier 1",
    name: "In-context window",
    desc: "Last 20 messages sent with every Claude call. Instant recall, zero latency.",
    color: "#f472b6",
    cost: "Free",
  },
  {
    tier: "Tier 2",
    name: "Session summary",
    desc: "At conversation end, Claude writes a structured summary saved to PostgreSQL.",
    color: "#a78bfa",
    cost: "~1 API call",
  },
  {
    tier: "Tier 3",
    name: "Semantic memory",
    desc: "pgvector embeddings over past summaries. Retrieve relevant context by similarity.",
    color: teal,
    cost: "Embedding API",
  },
];

const dbSchema = [
  { table: "users", cols: ["id", "email", "profile_json", "created_at"] },
  { table: "food_logs", cols: ["id", "user_id", "meal_type", "ingredients_json", "logged_at"] },
  { table: "training_sessions", cols: ["id", "user_id", "strava_id", "tss", "ctl", "atl", "tsb", "sport"] },
  { table: "coach_sessions", cols: ["id", "user_id", "messages_json", "summary", "embedding"] },
  { table: "calendar_events", cols: ["id", "user_id", "gcal_id", "title", "scheduled_at"] },
];

const deployStack = [
  { service: "Vercel", role: "Frontend", cost: "Free", tier: "Hobby" },
  { service: "Render", role: "FastAPI backend", cost: "Free", tier: "Free tier · spins down" },
  { service: "Supabase", role: "DB + Auth + Storage", cost: "Free", tier: "500MB / 1GB storage" },
  { service: "Anthropic API", role: "Claude coaching", cost: "Pay-per-use", tier: "~$0.003/1k tokens" },
  { service: "OpenAI Whisper", role: "Voice STT", cost: "Pay-per-use", tier: "$0.006/min" },
];

function NodeCard({ label, sub, icon, color }) {
  return (
    <div style={{
      background: card,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 160,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: color + "22",
        border: `1px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, color,
        flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{label}</div>
        <div style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

function LayerRow({ layer }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
      <div style={{
        width: 110, fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        color: layer.color, textAlign: "right", flexShrink: 0,
      }}>{layer.label}</div>
      <div style={{
        width: 3, alignSelf: "stretch",
        background: `linear-gradient(to bottom, ${layer.color}88, ${layer.color}22)`,
        borderRadius: 2, flexShrink: 0,
      }} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {layer.nodes.map(n => (
          <NodeCard key={n.id} {...n} color={layer.color} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{
      background: card,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: 20,
      marginBottom: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 2,
        color: accent || teal, marginBottom: 16,
      }}>{title}</div>
      {children}
    </div>
  );
}

export default function APEXInfra() {
  const [tab, setTab] = useState("arch");

  const tabs = [
    { id: "arch", label: "Architecture" },
    { id: "memory", label: "AI Memory" },
    { id: "schema", label: "DB Schema" },
    { id: "deploy", label: "Deploy Stack" },
  ];

  return (
    <div style={{
      background: bg, minHeight: "100vh", padding: 24,
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      color: textPrimary,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: teal + "22", border: `1.5px solid ${teal}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: teal,
        }}>◈</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
            APE<span style={{ color: teal }}>X</span>
            <span style={{ color: textSecondary, fontWeight: 400, fontSize: 14, marginLeft: 8 }}>
              Infrastructure
            </span>
          </div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
            Simple · Deployable · Zero-cost to start
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: card, padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? teal + "22" : "transparent",
            border: tab === t.id ? `1px solid ${teal}44` : "1px solid transparent",
            borderRadius: 7, padding: "6px 14px",
            fontSize: 12, fontWeight: 600, color: tab === t.id ? teal : textSecondary,
            cursor: "pointer", transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Architecture Tab */}
      {tab === "arch" && (
        <Section title="SYSTEM LAYERS">
          <div>
            {layers.map((l, i) => (
              <div key={l.id}>
                <LayerRow layer={l} />
                {i < layers.length - 1 && (
                  <div style={{
                    marginLeft: 129, marginBottom: 4, marginTop: -4,
                    color: muted, fontSize: 16, lineHeight: 1,
                  }}>↕</div>
                )}
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 20, padding: "12px 16px",
            background: teal + "0a", border: `1px solid ${teal}22`,
            borderRadius: 10, fontSize: 12, color: textSecondary, lineHeight: 1.6,
          }}>
            <span style={{ color: teal, fontWeight: 600 }}>Data flow: </span>
            User voice/photo → React → FastAPI → Whisper (STT) + Supabase (storage) → Claude (coaching + analysis) → Memory Manager (context) → response back to React
          </div>
        </Section>
      )}

      {/* AI Memory Tab */}
      {tab === "memory" && (
        <Section title="AI MEMORY MODEL" accent="#f472b6">
          <div style={{ marginBottom: 16 }}>
            {memoryModel.map(m => (
              <div key={m.tier} style={{
                display: "flex", gap: 16, alignItems: "flex-start",
                padding: "14px 0", borderBottom: `1px solid ${border}`,
              }}>
                <div style={{
                  minWidth: 64, fontSize: 10, fontWeight: 700,
                  color: m.color, letterSpacing: 1, paddingTop: 2,
                }}>{m.tier}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: textSecondary, marginTop: 3 }}>{m.desc}</div>
                </div>
                <div style={{
                  fontSize: 11, color: m.color,
                  background: m.color + "15", border: `1px solid ${m.color}33`,
                  borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                }}>{m.cost}</div>
              </div>
            ))}
          </div>
          <div style={{
            padding: "12px 16px",
            background: "#f472b622",
            border: `1px solid #f472b644`,
            borderRadius: 10, fontSize: 12, color: textSecondary, lineHeight: 1.7,
          }}>
            <div style={{ color: "#f472b6", fontWeight: 600, marginBottom: 6 }}>How the coach remembers you</div>
            Every conversation: T1 window gives Claude instant context. At session end: T2 summary is generated and stored (user goals, fatigue, recent PRs, dietary patterns). Over time: T3 embeddings let Claude surface relevant past coaching when context matches.
          </div>
        </Section>
      )}

      {/* DB Schema Tab */}
      {tab === "schema" && (
        <Section title="DATABASE SCHEMA" accent="#fb923c">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dbSchema.map(t => (
              <div key={t.table} style={{
                background: bg, border: `1px solid ${border}`,
                borderRadius: 10, overflow: "hidden",
              }}>
                <div style={{
                  padding: "8px 14px",
                  background: "#fb923c11",
                  borderBottom: `1px solid ${border}`,
                  fontSize: 12, fontWeight: 700, color: "#fb923c",
                  letterSpacing: 0.5,
                }}>{t.table}</div>
                <div style={{ padding: "8px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {t.cols.map(c => (
                    <span key={c} style={{
                      fontSize: 11, color: textSecondary,
                      background: card, border: `1px solid ${border}`,
                      borderRadius: 5, padding: "2px 8px",
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 14, padding: "12px 16px",
            background: "#fb923c0a", border: `1px solid #fb923c22`,
            borderRadius: 10, fontSize: 12, color: textSecondary, lineHeight: 1.6,
          }}>
            <span style={{ color: "#fb923c", fontWeight: 600 }}>Note: </span>
            coach_sessions.embedding is a <code style={{ color: teal }}>vector(1536)</code> column powered by pgvector. Enable with{" "}
            <code style={{ color: teal }}>CREATE EXTENSION vector;</code> in Supabase.
          </div>
        </Section>
      )}

      {/* Deploy Stack Tab */}
      {tab === "deploy" && (
        <Section title="DEPLOYMENT STACK" accent="#60a5fa">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 80px 1fr",
              gap: 8, padding: "6px 10px",
              fontSize: 10, fontWeight: 700, color: muted, letterSpacing: 1,
            }}>
              <span>SERVICE</span><span>ROLE</span><span>COST</span><span>NOTES</span>
            </div>
            {deployStack.map((s, i) => (
              <div key={s.service} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px 1fr",
                gap: 8, padding: "10px 10px",
                background: i % 2 === 0 ? bg : card,
                borderRadius: 8, alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: teal }}>{s.service}</span>
                <span style={{ fontSize: 12, color: textPrimary }}>{s.role}</span>
                <span style={{
                  fontSize: 11,
                  color: s.cost === "Free" ? "#34d399" : "#fb923c",
                  fontWeight: 700,
                }}>{s.cost}</span>
                <span style={{ fontSize: 11, color: textSecondary }}>{s.tier}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 16, padding: "12px 16px",
            background: "#60a5fa0a", border: `1px solid #60a5fa22`,
            borderRadius: 10, fontSize: 12, color: textSecondary, lineHeight: 1.7,
          }}>
            <div style={{ color: "#60a5fa", fontWeight: 600, marginBottom: 6 }}>⚠ Render free tier caveat</div>
            The backend will sleep after 15 min of inactivity and take ~30s to wake. For personal use this is fine. When ready to go production, upgrade to Render Starter ($7/mo) or migrate to Fly.io which has a more generous free tier and no cold starts.
          </div>
        </Section>
      )}
    </div>
  );
}

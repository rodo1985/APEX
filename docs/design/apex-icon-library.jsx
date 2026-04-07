import { useState } from "react";

const T = {
  bg:       "#0a0b0d",
  card:     "#13141a",
  card2:    "#1c1e27",
  border:   "#1e2028",
  border2:  "#2a2d38",
  teal:     "#2DD4BF",
  tealDim:  "#1a8a7a",
  tealPale: "rgba(45,212,191,0.12)",
  tealGlow: "rgba(45,212,191,0.2)",
  red:      "#FF4D4D",
  text:     "#FFFFFF",
  text2:    "#C8CAD4",
  text3:    "#6B7080",
  text4:    "#3d4050",
};

// ─── MASTER ICON (centered, perfectly balanced) ───────────────────────
// Heart centered at (36,34), with the center heartbeat spike touching the top notch of the heart.
function ApexIcon({ size = 72, variant = "dark" }) {
  const variants = {
    dark:    { bg: "#0d1411",  stroke: T.teal,  fill: T.teal,  opacity: 1   },
    darker:  { bg: T.bg,       stroke: T.teal,  fill: T.teal,  opacity: 1   },
    teal:    { bg: T.teal,     stroke: "#071a18", fill: "#071a18", opacity: 1 },
    light:   { bg: "#FFFFFF",  stroke: "#0d1411", fill: "#0d1411", opacity: 1 },
    outline: { bg: "transparent", stroke: T.teal, fill: T.teal, opacity: 1  },
    mono:    { bg: "#0d1411",  stroke: "#FFFFFF", fill: "#FFFFFF", opacity: 1 },
    ghost:   { bg: T.card,     stroke: T.teal,  fill: T.teal,  opacity: 0.4 },
  };
  const v = variants[variant] || variants.dark;
  const s = size;
  const r = Math.round(s * 0.24); // corner radius scales with size

  // All coords are in a 72×72 viewBox, scaled by SVG
  return (
    <svg width={s} height={s} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {variant !== "outline" && (
        <rect width="72" height="72" rx={r} fill={v.bg} />
      )}
      {variant === "outline" && (
        <rect width="71" height="71" x="0.5" y="0.5" rx={r} fill="none" stroke={v.stroke} strokeWidth="1.5" opacity="0.3" />
      )}

      {/* ── HEART — optically centered at 36,35 ── */}
      {/* Path constructed so heart center aligns to icon center */}
      <path
        d="M36 55 C35 55 13 42 13 28 C13 20.5 19 15 26 15 C30.5 15 34 17.5 36 21 C38 17.5 41.5 15 46 15 C53 15 59 20.5 59 28 C59 42 37 55 36 55 Z"
        fill={v.fill} fillOpacity={variant === "ghost" ? 0.08 : 0.1}
        stroke={v.stroke} strokeWidth="2" strokeLinejoin="round"
        opacity={v.opacity}
      />

      {/* ── WAVEFORM — centered within heart body, with the center spike touching the top notch ── */}
      <polyline
        points="18,36 24,36 29,28 33,46 36,22 39,46 44,32 48,36 54,36"
        fill="none"
        stroke={v.stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={v.opacity}
      />
    </svg>
  );
}

// ─── WORDMARK TITLE ────────────────────────────────────────────────────
function ApexTitle({ size = 36, variant = "dark" }) {
  const color = (variant === "light" || variant === "teal") ? "#0a0b0d" : T.text;
  const accent = variant === "light" ? "#0a6b60"
               : variant === "teal"  ? "#000000"
               : T.teal;
  return (
    <span style={{
      fontFamily: "'Syne', sans-serif",
      fontSize: size,
      fontWeight: 800,
      letterSpacing: "-0.5px",
      color,
      lineHeight: 1,
      userSelect: "none",
    }}>
      APE<span style={{ color: accent }}>X</span>
    </span>
  );
}

// ─── FULL LOCKUP ───────────────────────────────────────────────────────
function ApexLockup({ iconSize = 48, titleSize = 28, variant = "dark", gap = 12 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <ApexIcon size={iconSize} variant={variant} />
      <ApexTitle size={titleSize} variant={variant} />
    </div>
  );
}

// ─── STACKED LOCKUP ────────────────────────────────────────────────────
function ApexLockupStacked({ iconSize = 56, titleSize = 22, variant = "dark" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <ApexIcon size={iconSize} variant={variant} />
      <ApexTitle size={titleSize} variant={variant} />
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }

  .spec-page {
    background: ${T.bg};
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: ${T.text};
    padding-bottom: 80px;
  }

  /* ── COVER ── */
  .cover {
    background: ${T.card};
    border-bottom: 1px solid ${T.border};
    padding: 48px 28px 40px;
    position: relative;
    overflow: hidden;
  }
  .cover::after {
    content: '';
    position: absolute;
    bottom: -60px; right: -60px;
    width: 280px; height: 280px;
    background: ${T.teal};
    opacity: 0.04;
    border-radius: 50%;
    filter: blur(60px);
  }
  .cover-meta {
    font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: ${T.teal};
    margin-bottom: 20px;
    display: flex; align-items: center; gap: 8px;
  }
  .cover-meta::before {
    content: '';
    display: inline-block; width: 20px; height: 1.5px;
    background: ${T.teal};
  }
  .cover-title {
    font-family: 'Syne', sans-serif;
    font-size: 22px; font-weight: 800;
    color: ${T.text}; letter-spacing: -0.5px;
    margin-bottom: 6px;
  }
  .cover-sub {
    font-size: 12px; color: ${T.text3}; line-height: 1.6;
    max-width: 300px;
  }
  .cover-version {
    margin-top: 20px;
    display: flex; gap: 6px;
  }
  .tag {
    font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 3px 8px;
    border-radius: 4px;
  }
  .tag-teal { background: ${T.tealPale}; color: ${T.teal}; border: 1px solid ${T.tealDim}; }
  .tag-gray { background: #1a1c24; color: ${T.text3}; border: 1px solid ${T.border}; }

  /* ── SECTION ── */
  .sec {
    padding: 32px 24px 0;
  }
  .sec-head {
    display: flex; align-items: baseline; gap: 10px;
    margin-bottom: 18px; padding-bottom: 10px;
    border-bottom: 1px solid ${T.border};
  }
  .sec-num {
    font-family: 'DM Mono', monospace;
    font-size: 10px; color: ${T.teal}; letter-spacing: 0.08em;
  }
  .sec-name {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${T.text2};
  }
  .sec-desc {
    font-size: 11px; color: ${T.text3}; margin-left: auto;
  }

  /* ── SPEC BOX ── */
  .spec-box {
    background: ${T.card};
    border: 1px solid ${T.border};
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .spec-box-header {
    padding: 12px 16px;
    border-bottom: 1px solid ${T.border};
    display: flex; align-items: center; justify-content: space-between;
  }
  .spec-box-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: ${T.text3};
  }
  .spec-box-body {
    padding: 20px 16px;
  }

  /* ── VARIANT GRID ── */
  .variant-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: ${T.border};
    border-radius: 12px;
    overflow: hidden;
  }
  .variant-cell {
    padding: 20px 12px 14px;
    display: flex; flex-direction: column;
    align-items: center; gap: 10px;
  }
  .variant-label {
    font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; text-align: center;
  }

  /* ── SIZE ROW ── */
  .size-row {
    display: flex; align-items: flex-end;
    gap: 14px; flex-wrap: wrap;
  }
  .size-cell {
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
  }
  .size-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px; color: ${T.text3};
  }

  /* ── LOCKUP ROW ── */
  .lockup-stack {
    display: flex; flex-direction: column; gap: 20px;
  }
  .lockup-row-wrap {
    display: flex; align-items: center;
    gap: 0; position: relative;
  }

  /* ── CLEARANCE ── */
  .clearance-wrap {
    display: inline-block; position: relative;
  }
  .clearance-box {
    position: absolute;
    border: 1px dashed ${T.teal};
    opacity: 0.4;
    pointer-events: none;
  }
  .clearance-label {
    font-family: 'DM Mono', monospace;
    font-size: 8px; color: ${T.teal};
    position: absolute;
  }

  /* ── COLOR SWATCHES ── */
  .swatch-row {
    display: flex; flex-direction: column; gap: 8px;
  }
  .swatch {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    background: ${T.card2}; border-radius: 10px;
    border: 1px solid ${T.border};
  }
  .swatch-dot { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; }
  .swatch-name { font-size: 12px; font-weight: 600; color: ${T.text2}; }
  .swatch-hex {
    font-family: 'DM Mono', monospace;
    font-size: 11px; color: ${T.text3}; margin-left: auto;
  }
  .swatch-role { font-size: 10px; color: ${T.text3}; }

  /* ── DO / DON'T ── */
  .donts-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  }
  .rule-card {
    border-radius: 12px; overflow: hidden;
    border: 1px solid ${T.border};
  }
  .rule-header {
    padding: 8px 12px;
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .rule-do { background: rgba(45,212,191,0.1); color: ${T.teal}; }
  .rule-dont { background: rgba(255,77,77,0.1); color: ${T.red}; }
  .rule-body {
    background: ${T.card};
    padding: 16px 12px;
    display: flex; align-items: center; justify-content: center;
    min-height: 80px; position: relative;
  }
  .rule-caption {
    padding: 8px 12px;
    background: ${T.card};
    font-size: 10px; color: ${T.text3};
    border-top: 1px solid ${T.border};
    line-height: 1.4;
  }

  /* ── EXPORT TABLE ── */
  .export-table {
    width: 100%;
    border-collapse: collapse;
  }
  .export-table th {
    font-size: 9px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${T.text3};
    padding: 8px 10px; text-align: left;
    border-bottom: 1px solid ${T.border};
  }
  .export-table td {
    font-size: 11px; color: ${T.text2};
    padding: 10px 10px;
    border-bottom: 1px solid ${T.border};
  }
  .export-table tr:last-child td { border-bottom: none; }
  .export-table td:first-child { color: ${T.teal}; font-family: 'DM Mono', monospace; font-size: 10px; }
  .badge-use { background: rgba(45,212,191,0.1); color: ${T.teal}; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .badge-avoid { background: rgba(255,77,77,0.08); color: ${T.red}; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 600; }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: ${T.border}; margin: 0 24px; }

  /* ── ANNOTATION ── */
  .anno {
    font-family: 'DM Mono', monospace;
    font-size: 9px; color: ${T.teal}; 
  }
  .anno-gray { color: ${T.text3}; }

  /* ── STICKY NAV ── */
  .sticky-nav {
    position: sticky; top: 0; z-index: 99;
    background: rgba(10,11,13,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${T.border};
    padding: 10px 24px;
    display: flex; gap: 4px; overflow-x: auto;
  }
  .nav-item {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 5px 10px;
    border-radius: 6px; white-space: nowrap;
    cursor: pointer; transition: all 0.15s;
    color: ${T.text3}; border: none; background: none;
  }
  .nav-item.active, .nav-item:hover {
    background: ${T.tealPale}; color: ${T.teal};
  }

  /* ── SPACING DIAGRAM ── */
  .spacing-diagram {
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px; gap: 0;
    position: relative;
  }
  .space-arrow {
    display: flex; align-items: center;
    font-family: 'DM Mono', monospace;
    font-size: 9px; color: ${T.teal};
    flex-direction: column; gap: 3px;
  }
  .arrow-line {
    width: 1px; background: ${T.teal}; opacity: 0.5;
  }
`;

const sections = ["01 Icon","02 Variants","03 Sizes","04 Lockups","05 Colors","06 Clearance","07 Do/Don't","08 Exports"];

export default function App() {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <>
      <style>{css}</style>
      <div className="spec-page">

        {/* ── COVER ── */}
        <div className="cover">
          <div className="cover-meta">Brand Asset · Icon Library</div>
          <div style={{ marginBottom: 20 }}>
            <ApexIcon size={64} variant="dark" />
          </div>
          <div className="cover-title">APEX Icon System</div>
          <div className="cover-sub">
            Official icon library for the APEX AI personal trainer app.
            Heart + waveform mark · Syne wordmark · All usage guidelines.
          </div>
          <div className="cover-version">
            <span className="tag tag-teal">v1.0</span>
            <span className="tag tag-gray">2026</span>
            <span className="tag tag-gray">7 variants</span>
            <span className="tag tag-gray">6 sizes</span>
          </div>
        </div>

        {/* ── STICKY NAV ── */}
        <div className="sticky-nav">
          {sections.map((s, i) => (
            <button key={i} className={`nav-item ${activeNav===i?"active":""}`} onClick={() => setActiveNav(i)}>{s}</button>
          ))}
        </div>

        {/* ══ 01 MASTER ICON ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">01</span>
            <span className="sec-name">Master Icon</span>
            <span className="sec-desc">Primary mark</span>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Icon — Dark (default)</span>
              <span className="tag tag-teal">Primary</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
              <ApexIcon size={120} variant="dark" />
              <div style={{ display:"flex", gap:24, flexWrap:"wrap", justifyContent:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <div className="anno">Heart</div>
                  <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>Centered at 36,35</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div className="anno">Waveform</div>
                  <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>9-point polyline</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div className="anno">Corner radius</div>
                  <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>24% of size</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div className="anno">Stroke</div>
                  <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>2px / 2.2px</div>
                </div>
              </div>
            </div>
          </div>

          {/* Anatomy */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Anatomy</span>
            </div>
            <div className="spec-box-body" style={{ position:"relative", display:"flex", justifyContent:"center" }}>
              <div style={{ position:"relative", display:"inline-block" }}>
                <ApexIcon size={120} variant="dark" />
                {/* Annotation lines */}
                <svg style={{ position:"absolute", inset:0, width:120, height:120, pointerEvents:"none" }} viewBox="0 0 120 120">
                  {/* Heart label line */}
                  <line x1="100" y1="30" x2="72" y2="42" stroke={T.teal} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6"/>
                  <circle cx="100" cy="30" r="1.5" fill={T.teal} opacity="0.6"/>
                  {/* Waveform label line */}
                  <line x1="20" y1="90" x2="48" y2="72" stroke={T.teal} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6"/>
                  <circle cx="20" cy="90" r="1.5" fill={T.teal} opacity="0.6"/>
                  {/* BG label line */}
                  <line x1="100" y1="95" x2="90" y2="88" stroke={T.text3} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5"/>
                </svg>
              </div>
              <div style={{ position:"absolute", top:18, right:16, display:"flex", flexDirection:"column", gap:4 }}>
                <div className="anno" style={{ fontSize:9 }}>❶ Heart shape</div>
                <div style={{ fontSize:9, color:T.text3 }}>Health + emotion</div>
              </div>
              <div style={{ position:"absolute", bottom:18, left:16, display:"flex", flexDirection:"column", gap:4 }}>
                <div className="anno" style={{ fontSize:9 }}>❷ Vital waveform</div>
                <div style={{ fontSize:9, color:T.text3 }}>Data + performance</div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 02 VARIANTS ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">02</span>
            <span className="sec-name">Variants</span>
            <span className="sec-desc">7 versions</span>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">All icon variants</span>
            </div>
            <div className="variant-grid" style={{ background:T.border }}>
              {[
                { id:"dark",    bg:T.card,    label:"Dark",    note:"Default · app bg" },
                { id:"darker",  bg:"#060708", label:"Darker",  note:"OLED / pure black" },
                { id:"teal",    bg:T.teal,    label:"Teal",    note:"CTA / accent bg" },
                { id:"light",   bg:"#F2F4F6", label:"Light",   note:"White bg / web" },
                { id:"mono",    bg:T.card,    label:"Mono",    note:"Single color" },
                { id:"ghost",   bg:T.card,    label:"Ghost",   note:"Watermark / overlay" },
              ].map(v => (
                <div className="variant-cell" key={v.id} style={{ background:v.bg }}>
                  <ApexIcon size={56} variant={v.id} />
                  <div className="variant-label" style={{ color: v.id==="light" ? "#555" : T.text2 }}>{v.label}</div>
                  <div style={{ fontSize:9, color: v.id==="light" ? "#888" : T.text3, textAlign:"center" }}>{v.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* App icon variants (rounded more) */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">App store formats</span>
              <span className="tag tag-gray">iOS · Android</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
              {[
                { label:"iOS — rounded rect", rx:28 },
                { label:"Android — circle", rx:72 },
                { label:"Squircle", rx:36 },
              ].map(f => (
                <div key={f.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <rect width="72" height="72" rx={f.rx} fill="#0d1411"/>
                    {/* Heart */}
                    <path d="M36 55 C35 55 13 42 13 28 C13 20.5 19 15 26 15 C30.5 15 34 17.5 36 21 C38 17.5 41.5 15 46 15 C53 15 59 20.5 59 28 C59 42 37 55 36 55 Z"
                      fill={T.teal} fillOpacity="0.1" stroke={T.teal} strokeWidth="2" strokeLinejoin="round"/>
                    <polyline points="18,36 24,36 29,28 33,46 36,22 39,46 44,32 48,36 54,36"
                      fill="none" stroke={T.teal} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{ fontSize:9, color:T.text3, textAlign:"center" }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 03 SIZES ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">03</span>
            <span className="sec-name">Sizes</span>
            <span className="sec-desc">Defined scale</span>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Icon size scale</span>
            </div>
            <div className="spec-box-body">
              <div className="size-row">
                {[
                  { s:16,  label:"16",  use:"Favicon" },
                  { s:24,  label:"24",  use:"Tab bar" },
                  { s:32,  label:"32",  use:"Header" },
                  { s:48,  label:"48",  use:"List item" },
                  { s:64,  label:"64",  use:"Card" },
                  { s:80,  label:"80",  use:"Hero" },
                ].map(sz => (
                  <div className="size-cell" key={sz.s}>
                    <div style={{ fontSize:8, color:T.teal, fontFamily:"'DM Mono',monospace", marginBottom:2 }}>{sz.use}</div>
                    <ApexIcon size={sz.s} variant="dark" />
                    <span className="size-label">{sz.label}px</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Size spec table */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Size specifications</span>
            </div>
            <div style={{ padding:"0 4px 4px" }}>
              <table className="export-table">
                <thead>
                  <tr>
                    <th>Size</th><th>Corner Radius</th><th>Stroke Weight</th><th>Min Clear Space</th><th>Use</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["16px","4px","1px","4px","Favicon, small UI"],
                    ["24px","6px","1.5px","6px","Tab bar, nav icons"],
                    ["32px","8px","1.5px","8px","App header, lists"],
                    ["48px","12px","2px","12px","Cards, onboarding"],
                    ["64px","16px","2px","16px","Hero, splash"],
                    ["80px","20px","2.2px","20px","Marketing, cover"],
                  ].map(r => (
                    <tr key={r[0]}>
                      {r.map((c,i) => <td key={i}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 04 LOCKUPS ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">04</span>
            <span className="sec-name">Lockups</span>
            <span className="sec-desc">Icon + wordmark</span>
          </div>

          {/* Horizontal */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Horizontal lockup — 3 sizes</span>
              <span className="tag tag-teal">Preferred</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", flexDirection:"column", gap:22 }}>
              {[
                { icon:56, title:32, gap:14, label:"Large — splash / onboarding" },
                { icon:40, title:22, gap:10, label:"Medium — app header" },
                { icon:28, title:16, gap:8,  label:"Small — tab bar / nav" },
              ].map(l => (
                <div key={l.label}>
                  <div style={{ fontSize:9, color:T.text3, marginBottom:8, fontFamily:"'DM Mono',monospace" }}>{l.label}</div>
                  <ApexLockup iconSize={l.icon} titleSize={l.title} gap={l.gap} variant="dark" />
                </div>
              ))}
            </div>
          </div>

          {/* Stacked */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Stacked lockup</span>
              <span className="tag tag-gray">Alternate</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", justifyContent:"space-around" }}>
              <ApexLockupStacked iconSize={64} titleSize={22} variant="dark" />
              <ApexLockupStacked iconSize={48} titleSize={16} variant="dark" />
            </div>
          </div>

          {/* On backgrounds */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Lockup on backgrounds</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:1, overflow:"hidden", borderRadius:12 }}>
              {[
                { bg:T.bg,    v:"dark",  label:"On app background" },
                { bg:T.card,  v:"dark",  label:"On card" },
                { bg:T.teal,  v:"teal",  label:"On teal / CTA" },
                { bg:"#fff",  v:"light", label:"On white / web" },
              ].map(b => (
                <div key={b.bg} style={{ background:b.bg, padding:"16px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <ApexLockup iconSize={36} titleSize={20} gap={10} variant={b.v} />
                  <span style={{ fontSize:9, color: b.bg==="#fff"||b.bg===T.teal ? "rgba(0,0,0,0.4)" : T.text3, fontFamily:"'DM Mono',monospace" }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 05 COLORS ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">05</span>
            <span className="sec-name">Color tokens</span>
            <span className="sec-desc">Icon palette</span>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Icon color system</span>
            </div>
            <div className="spec-box-body">
              <div className="swatch-row">
                {[
                  { hex:"#2DD4BF", name:"Apex Teal",    role:"Primary stroke · accent · waveform",  tag:"Primary" },
                  { hex:"#0d1411", name:"Icon Dark",    role:"Default icon background",             tag:"Background" },
                  { hex:"#0a0b0d", name:"App Dark",     role:"App background",                      tag:"Background" },
                  { hex:"#FFFFFF", name:"Pure White",   role:"Mono variant stroke",                 tag:"Mono" },
                  { hex:"#071a18", name:"Teal Ink",     role:"Stroke on teal background",           tag:"Inverted" },
                ].map(s => (
                  <div className="swatch" key={s.hex}>
                    <div className="swatch-dot" style={{ background:s.hex, border:`1px solid ${T.border}` }}/>
                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                      <div className="swatch-name">{s.name}</div>
                      <div className="swatch-role">{s.role}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, marginLeft:"auto" }}>
                      <div className="swatch-hex">{s.hex}</div>
                      <span className="tag tag-gray" style={{ fontSize:8 }}>{s.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 06 CLEARANCE ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">06</span>
            <span className="sec-name">Clear space</span>
            <span className="sec-desc">Minimum breathing room</span>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Clearance zone — 1× unit = icon size ÷ 4</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"32px 16px" }}>
              {/* 72px icon, clearance = 18px each side */}
              <div style={{ position:"relative" }}>
                {/* Clearance box */}
                <div style={{
                  position:"absolute",
                  inset: -18,
                  border:`1.5px dashed ${T.teal}`,
                  borderRadius: 6,
                  opacity: 0.5,
                }}/>
                {/* Dimension annotations */}
                {/* Top */}
                <div style={{ position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <span style={{ fontSize:8, color:T.teal, fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" }}>1×</span>
                </div>
                {/* Right */}
                <div style={{ position:"absolute", right:-30, top:"50%", transform:"translateY(-50%)" }}>
                  <span style={{ fontSize:8, color:T.teal, fontFamily:"'DM Mono',monospace" }}>1×</span>
                </div>
                <ApexIcon size={72} variant="dark" />
              </div>
            </div>
            <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, color:T.text3, lineHeight:1.6 }}>
                Keep a minimum clear space of <span style={{ color:T.teal }}>¼ the icon size</span> on all sides. At 48px → 12px clear space. Never place text, other icons or UI elements inside this zone.
              </div>
            </div>
          </div>

          {/* Min size */}
          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Minimum size</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <ApexIcon size={16} variant="dark" />
                <span style={{ fontSize:9, color:T.teal, fontFamily:"'DM Mono',monospace" }}>16px min</span>
              </div>
              <div style={{ fontSize:11, color:T.text3, lineHeight:1.6 }}>
                Never render the icon below <span style={{ color:T.text2 }}>16×16px</span>. Below this size the waveform detail becomes illegible. Use a simplified version if smaller sizes are required.
              </div>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 07 DO / DON'T ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">07</span>
            <span className="sec-name">Do / Don't</span>
            <span className="sec-desc">Usage rules</span>
          </div>

          <div className="donts-grid">
            {/* ✅ DO: use on dark */}
            <div className="rule-card">
              <div className="rule-header rule-do">✓ Do</div>
              <div className="rule-body"><ApexIcon size={56} variant="dark" /></div>
              <div className="rule-caption">Use dark variant on dark backgrounds</div>
            </div>
            {/* ✅ DO: use teal on teal bg */}
            <div className="rule-card">
              <div className="rule-header rule-do">✓ Do</div>
              <div className="rule-body" style={{ background:T.teal }}><ApexIcon size={56} variant="teal" /></div>
              <div className="rule-caption">Use teal variant on teal backgrounds</div>
            </div>
            {/* ❌ DON'T: stretch */}
            <div className="rule-card">
              <div className="rule-header rule-dont">✕ Don't</div>
              <div className="rule-body">
                <div style={{ transform:"scaleX(1.5)", display:"inline-block", opacity:0.7 }}>
                  <ApexIcon size={56} variant="dark" />
                </div>
              </div>
              <div className="rule-caption">Never stretch or distort the icon</div>
            </div>
            {/* ❌ DON'T: rotate */}
            <div className="rule-card">
              <div className="rule-header rule-dont">✕ Don't</div>
              <div className="rule-body">
                <div style={{ transform:"rotate(45deg)", display:"inline-block", opacity:0.7 }}>
                  <ApexIcon size={56} variant="dark" />
                </div>
              </div>
              <div className="rule-caption">Never rotate the icon mark</div>
            </div>
            {/* ❌ DON'T: recolor */}
            <div className="rule-card">
              <div className="rule-header rule-dont">✕ Don't</div>
              <div className="rule-body">
                <svg width="56" height="56" viewBox="0 0 72 72" fill="none">
                  <rect width="72" height="72" rx="18" fill="#0d1411"/>
                  <path d="M36 55 C35 55 13 42 13 28 C13 20.5 19 15 26 15 C30.5 15 34 17.5 36 21 C38 17.5 41.5 15 46 15 C53 15 59 20.5 59 28 C59 42 37 55 36 55 Z"
                    fill="#FF4D4D" fillOpacity="0.1" stroke="#FF4D4D" strokeWidth="2"/>
                  <polyline points="18,36 24,36 29,28 33,46 36,22 39,46 44,32 48,36 54,36"
                    fill="none" stroke="#FF4D4D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rule-caption">Never recolor to unapproved colors</div>
            </div>
            {/* ❌ DON'T: low contrast bg */}
            <div className="rule-card">
              <div className="rule-header rule-dont">✕ Don't</div>
              <div className="rule-body" style={{ background:"#1a2a28" }}>
                <ApexIcon size={56} variant="dark" />
              </div>
              <div className="rule-caption">Avoid low-contrast backgrounds</div>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin:"28px 24px" }} />

        {/* ══ 08 EXPORT SPECS ══ */}
        <div className="sec">
          <div className="sec-head">
            <span className="sec-num">08</span>
            <span className="sec-name">Export specs</span>
            <span className="sec-desc">Files & formats</span>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">File naming convention</span>
            </div>
            <div style={{ padding:"4px 4px 4px" }}>
              <table className="export-table">
                <thead>
                  <tr><th>File name</th><th>Format</th><th>Size</th><th>Use</th></tr>
                </thead>
                <tbody>
                  {[
                    ["apex-icon.svg",           "SVG",  "Scalable", "Web, Figma source"],
                    ["apex-icon-dark@1x.png",   "PNG",  "72×72",    "Android mdpi"],
                    ["apex-icon-dark@2x.png",   "PNG",  "144×144",  "Android xhdpi"],
                    ["apex-icon-dark@3x.png",   "PNG",  "216×216",  "iOS @3x"],
                    ["apex-icon-1024.png",       "PNG",  "1024×1024","App Store / Play Store"],
                    ["apex-icon-teal.svg",       "SVG",  "Scalable", "Light bg variant"],
                    ["apex-icon-mono.svg",       "SVG",  "Scalable", "Single color usage"],
                    ["apex-favicon.ico",         "ICO",  "16–32px",  "Browser favicon"],
                    ["apex-lockup-h.svg",        "SVG",  "Scalable", "Horizontal wordmark"],
                    ["apex-lockup-v.svg",        "SVG",  "Scalable", "Stacked wordmark"],
                  ].map(r => (
                    <tr key={r[0]}>
                      {r.map((c,i) => <td key={i}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="spec-box">
            <div className="spec-box-header">
              <span className="spec-box-label">Format guidelines</span>
            </div>
            <div className="spec-box-body">
              <div className="swatch-row">
                {[
                  { format:"SVG", note:"Always use for web and Figma. Fully scalable, smallest file size.", badge:"Preferred" },
                  { format:"PNG @3x", note:"Use for iOS / Android assets where SVG isn't supported.", badge:"Mobile" },
                  { format:"1024 PNG", note:"Required for App Store Connect and Google Play Store.", badge:"App Store" },
                  { format:"ICO", note:"Favicon only. Include 16px and 32px in the same .ico file.", badge:"Web" },
                ].map(f => (
                  <div key={f.format} style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:T.teal, minWidth:72 }}>{f.format}</div>
                    <div style={{ fontSize:11, color:T.text3, flex:1 }}>{f.note}</div>
                    <span className="tag tag-gray" style={{ fontSize:8 }}>{f.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final preview */}
          <div className="spec-box" style={{ marginTop:24 }}>
            <div className="spec-box-header">
              <span className="spec-box-label">Final mark — all variants at a glance</span>
            </div>
            <div className="spec-box-body" style={{ display:"flex", justifyContent:"space-around", flexWrap:"wrap", gap:16 }}>
              {["dark","teal","light","mono","ghost"].map(v => (
                <div key={v} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{
                    padding:8, borderRadius:14,
                    background: v==="light"?"#f2f4f6" : v==="teal"?T.teal : T.card,
                    border:`1px solid ${T.border}`,
                  }}>
                    <ApexIcon size={52} variant={v} />
                  </div>
                  <span style={{ fontSize:9, color:T.text3, fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

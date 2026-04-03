import { useState, useEffect, useRef } from "react";

/* ─── DESIGN TOKENS (matches APEX design system) ─── */
const C = {
  bg: "#0a0b0d",
  bg2: "#0e0f14",
  card: "#13141a",
  card2: "#1c1e27",
  border: "rgba(255,255,255,0.06)",
  border2: "#1e2028",
  teal: "#2DD4BF",
  tealDim: "rgba(45,212,191,0.10)",
  tealGlow: "rgba(45,212,191,0.2)",
  white: "#f2f2f4",
  text2: "#C8CAD4",
  muted: "#a0a4b4",
  dim: "#5e6278",
  text3: "#6B7080",
  strava: "#FC4C02",
};

/* ─── UNSPLASH IMAGES ─── */
const IMG = {
  hero: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1400&q=80",
  food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
  runner: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  cycling: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
  watch: "https://images.unsplash.com/photo-1510017803434-a899b57f3680?w=800&q=80",
  meal2: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
  community: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  nature: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&q=80",
};

/* ─── INTERSECTION OBSERVER ─── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function Reveal({ children, delay = 0, style = {}, className = "" }) {
  const [ref, vis] = useInView(0.08);
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APEX BRAND — Heart + Waveform icon & Syne wordmark
   ══════════════════════════════════════════════════════════════ */

function ApexIcon({ size = 72, variant = "dark" }) {
  const variants = {
    dark:    { bg: "#0d1411", stroke: C.teal, fill: C.teal },
    teal:    { bg: C.teal, stroke: "#071a18", fill: "#071a18" },
    light:   { bg: "#FFFFFF", stroke: "#0d1411", fill: "#0d1411" },
    outline: { bg: "transparent", stroke: C.teal, fill: C.teal },
    mono:    { bg: "#0d1411", stroke: "#FFFFFF", fill: "#FFFFFF" },
    ghost:   { bg: C.card, stroke: C.teal, fill: C.teal },
    naked:   { bg: "none", stroke: C.teal, fill: C.teal },
  };
  const v = variants[variant] || variants.dark;
  const r = Math.round(size * 0.24);
  const isNaked = variant === "naked";
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      {!isNaked && variant !== "outline" && <rect width="72" height="72" rx={r} fill={v.bg} />}
      {!isNaked && variant === "outline" && <rect width="71" height="71" x="0.5" y="0.5" rx={r} fill="none" stroke={v.stroke} strokeWidth="1.5" opacity="0.3" />}
      <path d="M36 55 C35 55 13 42 13 28 C13 20.5 19 15 26 15 C30.5 15 34 17.5 36 21 C38 17.5 41.5 15 46 15 C53 15 59 20.5 59 28 C59 42 37 55 36 55 Z"
        fill={v.fill} fillOpacity={isNaked ? 0.15 : variant === "ghost" ? 0.08 : 0.1}
        stroke={v.stroke} strokeWidth="2" strokeLinejoin="round" />
      <polyline points="18,34 23,34 27,25 31,43 35,19 39,43 43,30 47,34 54,34"
        fill="none" stroke={v.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ApexTitle({ size = 36, variant = "dark" }) {
  const color = (variant === "light" || variant === "teal") ? "#0a0b0d" : C.white;
  const accent = variant === "light" ? "#0a6b60" : variant === "teal" ? "#000000" : C.teal;
  return (
    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: size, fontWeight: 800, letterSpacing: "-0.5px", color, lineHeight: 1, userSelect: "none" }}>
      APE<span style={{ color: accent }}>X</span>
    </span>
  );
}

function ApexLockup({ iconSize = 48, titleSize = 28, variant = "dark", gap = 12 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <ApexIcon size={iconSize} variant={variant} />
      <ApexTitle size={titleSize} variant={variant} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ICON LIBRARY — 35 custom SVG line icons, 3 categories
   ══════════════════════════════════════════════════════════════ */

function SvgBase({ size = 20, color = "currentColor", sw = 1.5, children }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>{children}</svg>;
}

const ICON_DEFS = {
  home:(p)=><SvgBase {...p}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></SvgBase>,
  fork:(p)=><SvgBase {...p}><path d="M8 3v5c0 1.657 1.343 3 3 3s3-1.343 3-3V3"/><line x1="11" y1="11" x2="11" y2="21"/><line x1="16" y1="3" x2="16" y2="8"/><path d="M16 8c0 2-1.5 3-1.5 5v8"/></SvgBase>,
  bike:(p)=><SvgBase {...p}><circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h4l3 5"/><path d="M10 8h5l2 5"/><circle cx="15" cy="8" r="1" fill={p.color||"currentColor"} stroke="none"/></SvgBase>,
  chat:(p)=><SvgBase {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></SvgBase>,
  bell:(p)=><SvgBase {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></SvgBase>,
  search:(p)=><SvgBase {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></SvgBase>,
  user:(p)=><SvgBase {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></SvgBase>,
  settings:(p)=><SvgBase {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></SvgBase>,
  mic:(p)=><SvgBase {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></SvgBase>,
  camera:(p)=><SvgBase {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></SvgBase>,
  plus:(p)=><SvgBase {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></SvgBase>,
  send:(p)=><SvgBase {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></SvgBase>,
  check:(p)=><SvgBase {...p}><polyline points="20 6 9 17 4 12"/></SvgBase>,
  xMark:(p)=><SvgBase {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></SvgBase>,
  arrowR:(p)=><SvgBase {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></SvgBase>,
  heart:(p)=><SvgBase {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></SvgBase>,
  drop:(p)=><SvgBase {...p}><path d="M12 2C6 10 4 14 4 17a8 8 0 0016 0c0-3-2-7-8-15z"/></SvgBase>,
  bolt:(p)=><SvgBase {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></SvgBase>,
  moon:(p)=><SvgBase {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></SvgBase>,
  flame:(p)=><SvgBase {...p}><path d="M12 2c0 0-5 5-5 11a5 5 0 0010 0c0-3-1.5-5.5-2-7-1 2-1.5 3-1.5 3S12 7 12 2z"/><path d="M9 17c0 1.657 1.343 3 3 3s3-1.343 3-3"/></SvgBase>,
  run:(p)=><SvgBase {...p}><circle cx="17" cy="3" r="2"/><path d="M10.5 8.5l2.5-3 3 2.5-2 3"/><path d="M7 22l2.5-5 3 2.5"/><path d="M4.5 12.5L8 11l3 3-2.5 3.5"/><path d="M14 12l3.5 1.5-1.5 5"/></SvgBase>,
  target:(p)=><SvgBase {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></SvgBase>,
  chart:(p)=><SvgBase {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></SvgBase>,
  calendar:(p)=><SvgBase {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgBase>,
  github:(p)=><SvgBase {...p}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></SvgBase>,
  shield:(p)=><SvgBase {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></SvgBase>,
  users:(p)=><SvgBase {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></SvgBase>,
  star:(p)=><SvgBase {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></SvgBase>,
  code:(p)=><SvgBase {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></SvgBase>,
  globe:(p)=><SvgBase {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 010 20 15 15 0 010-20z"/></SvgBase>,
};

function Ico({ name, size = 22, color = C.teal, sw = 1.5 }) {
  const Fn = ICON_DEFS[name];
  return Fn ? Fn({ size, color, sw }) : null;
}

const ICON_CATEGORIES = {
  "Navigation": ["home", "fork", "bike", "chat", "bell", "search", "user", "settings"],
  "Actions": ["mic", "camera", "plus", "send", "check", "xMark", "arrowR"],
  "Health & Sport": ["heart", "drop", "bolt", "moon", "flame", "run", "target", "chart", "calendar"],
};

/* ─── MAIN ─── */
export default function APEXLanding() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const GH = "https://github.com/your-username/apex";

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{background:${C.bg};color:${C.white};font-family:'DM Sans',sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased}
        ::selection{background:${C.teal}30;color:${C.white}}
        a{text-decoration:none;color:inherit}
        img{display:block;width:100%;height:100%;object-fit:cover}
        button{font-family:inherit;cursor:pointer;border:none}
        .noise{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0.02;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 40px;transition:all 0.4s}
        .nav.scrolled{background:rgba(10,11,13,0.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid ${C.border}}
        .nav-links{display:flex;align-items:center;gap:32px}
        .nav-link{font-size:13px;font-weight:500;color:${C.muted};transition:color 0.2s}
        .nav-link:hover{color:${C.white}}
        .nav-gh{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:${C.white};background:${C.card};border:1px solid ${C.border};padding:10px 20px;border-radius:50px;transition:all 0.25s}
        .nav-gh:hover{border-color:${C.teal}40;background:#1a1b22}
        .btn-primary{display:inline-flex;align-items:center;gap:10px;background:${C.teal};color:#071a18;font-weight:700;font-size:15px;padding:16px 36px;border-radius:50px;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);font-family:'Outfit',sans-serif}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 30px ${C.teal}35}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;background:transparent;color:${C.muted};font-weight:600;font-size:15px;padding:16px 32px;border-radius:50px;border:1px solid ${C.border};transition:all 0.3s;font-family:'Outfit',sans-serif}
        .btn-ghost:hover{border-color:${C.teal}40;color:${C.white}}
        .section-pad{padding:120px 40px}
        .container{max-width:1120px;margin:0 auto}
        .label{font-size:11px;font-weight:700;color:${C.teal};text-transform:uppercase;letter-spacing:0.14em;font-family:'JetBrains Mono',monospace;margin-bottom:16px}
        .heading{font-family:'Outfit',sans-serif;font-weight:800;letter-spacing:-0.8px;line-height:1.15;color:${C.white}}
        .hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
        .feat-card{background:${C.card};border:1px solid ${C.border};border-radius:20px;padding:36px 30px;transition:all 0.35s cubic-bezier(0.16,1,0.3,1)}
        .feat-card:hover{transform:translateY(-4px);border-color:${C.teal}25;box-shadow:0 16px 48px rgba(0,0,0,0.3)}
        .feat-icon{width:52px;height:52px;border-radius:14px;background:${C.tealDim};display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .img-card{border-radius:20px;overflow:hidden;position:relative}
        .img-card::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(10,11,13,0.5) 0%,transparent 50%)}
        .os-banner{background:linear-gradient(135deg,${C.card} 0%,#1a1d2a 100%);border:1px solid ${C.border};border-radius:24px;padding:60px 48px;text-align:center;position:relative;overflow:hidden}
        .os-banner::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 50% 50%,${C.teal}06,transparent 50%);pointer-events:none}
        .benefit-row{display:flex;gap:48px;align-items:center}
        .benefit-row.reverse{flex-direction:row-reverse}
        .footer{border-top:1px solid ${C.border};padding:48px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px}
        .footer-copy{font-size:13px;color:${C.dim}}
        .footer-links{display:flex;gap:24px}
        .footer-links a{font-size:13px;color:${C.muted};transition:color 0.2s}
        .footer-links a:hover{color:${C.teal}}
        .icon-grid-cell{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px;border-radius:12px;transition:background 0.2s}
        .icon-grid-cell:hover{background:${C.tealDim}}
        .icon-grid-cell .name{font-size:9px;color:${C.dim};font-family:'JetBrains Mono',monospace;text-align:center}
        @media(max-width:768px){
          .nav{padding:14px 20px}
          .nav-links{display:none}
          .section-pad{padding:80px 20px}
          .heading.xl{font-size:36px!important}
          .heading.lg{font-size:28px!important}
          .feat-grid{grid-template-columns:1fr!important}
          .benefit-row,.benefit-row.reverse{flex-direction:column!important;gap:32px!important}
          .os-banner{padding:40px 24px}
          .footer{flex-direction:column;text-align:center}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .icon-showcase-grid{grid-template-columns:repeat(6,1fr)!important}
          .ds-grid{grid-template-columns:1fr!important}
          .variant-strip{flex-wrap:wrap!important}
        }
      `}</style>
      <div className="noise"/>

      {/* NAV */}
      <nav className={`nav${scrolled?" scrolled":""}`}>
        <ApexLockup iconSize={32} titleSize={18} gap={10} variant="naked" />
        <div className="nav-links">
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#how">How It Works</a>
          <a className="nav-gh" href={GH} target="_blank" rel="noopener"><Ico name="github" size={16} color={C.white}/>GitHub</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div style={{position:"absolute",inset:0,zIndex:0}}>
          <img src={IMG.hero} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(10,11,13,0.94) 0%,rgba(10,11,13,0.55) 60%,rgba(10,11,13,0.82) 100%)"}}/>
        </div>
        <div style={{position:"relative",zIndex:2,maxWidth:1120,margin:"0 auto",width:"100%",padding:"0 40px"}}>
          <Reveal><div style={{marginBottom:28}}><ApexIcon size={64} variant="naked" /></div></Reveal>
          <Reveal delay={80}><div className="label" style={{marginBottom:20}}>Open Source AI Health Companion</div></Reveal>
          <Reveal delay={150}>
            <h1 className="heading xl" style={{fontSize:60,marginBottom:24}}>
              Your nutrition.<br/>Your training.<br/><span style={{color:C.teal}}>One AI coach.</span>
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p style={{fontSize:18,lineHeight:1.75,color:C.muted,marginBottom:40,maxWidth:500}}>
              APEX replaces the app chaos. Log meals by voice or photo, sync training from Strava, and get AI coaching that actually knows your body — all in one free, open-source platform.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <a href={GH} target="_blank" rel="noopener"><button className="btn-primary"><Ico name="github" size={18} color="#071a18"/>Get Started — It's Free</button></a>
              <a href="#features"><button className="btn-ghost">See What It Does</button></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:"48px 40px",borderBottom:`1px solid ${C.border}`}}>
        <div className="container">
          <Reveal>
            <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32,textAlign:"center"}}>
              {[{val:"100%",label:"Free & Open Source"},{val:"10s",label:"Average Meal Log Time"},{val:"4+",label:"Apps Replaced"},{val:"24/7",label:"AI Coach Access"}].map((s,i)=>(
                <div key={i}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:32,fontWeight:800,color:C.white,letterSpacing:"-1px"}}>{s.val}</div>
                  <div style={{fontSize:12,color:C.dim,marginTop:6,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section-pad">
        <div className="container">
          <Reveal>
            <div style={{textAlign:"center",marginBottom:64}}>
              <div className="label">What APEX Does</div>
              <h2 className="heading lg" style={{fontSize:40,marginBottom:16}}>Everything you need.<br/>Nothing you don't.</h2>
              <p style={{fontSize:16,color:C.muted,maxWidth:500,margin:"0 auto",lineHeight:1.7}}>Built for cyclists and runners who want nutrition, training, and coaching in one place.</p>
            </div>
          </Reveal>
          <div className="feat-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
            {[
              {icon:"mic",title:"Voice Logging",desc:"Say what you ate. APEX transcribes, parses ingredients, estimates portions, and logs macros. No typing, no food databases."},
              {icon:"camera",title:"Photo Logging",desc:"Snap a photo of your meal. AI identifies the dish, estimates quantities, and logs everything — review and confirm with one tap."},
              {icon:"chart",title:"Training Analytics",desc:"Deep Strava sync with TSS, CTL, ATL, and TSB. See your real training load — not just distance and pace summaries."},
              {icon:"chat",title:"AI Coach",desc:"A conversational coach that knows your food, training, recovery, and schedule. Ask anything. Get answers grounded in your actual data."},
              {icon:"target",title:"Dynamic Targets",desc:"Calorie and macro goals adjust daily based on your training. A rest day and a 120km ride get different nutrition plans."},
              {icon:"calendar",title:"Calendar-Aware",desc:"Connects to Google Calendar so your coach knows about travel, work stress, and race day — and plans nutrition around it."},
            ].map((f,i)=>(
              <Reveal key={i} delay={i*80}>
                <div className="feat-card" style={{height:"100%",display:"flex",flexDirection:"column"}}>
                  <div className="feat-icon"><Ico name={f.icon} size={24}/></div>
                  <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:17,fontWeight:700,color:C.white,marginBottom:10}}>{f.title}</h3>
                  <p style={{fontSize:14,lineHeight:1.75,color:C.muted,flex:1}}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section-pad" style={{background:C.bg2}}>
        <div className="container">
          <Reveal>
            <div className="label">How It Works</div>
            <h2 className="heading lg" style={{fontSize:40,marginBottom:72}}>Designed for athletes<br/>who train hard and eat smart.</h2>
          </Reveal>
          <Reveal>
            <div className="benefit-row" style={{marginBottom:100}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:C.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.1em",marginBottom:16}}>01 — LOG</div>
                <h3 className="heading" style={{fontSize:28,marginBottom:16}}>Log meals in seconds,<br/>not minutes</h3>
                <p style={{fontSize:15,lineHeight:1.8,color:C.muted,marginBottom:24}}>Tell APEX what you ate — by voice, photo, or text. The AI handles the rest: identifying ingredients, estimating portions, calculating macros.</p>
                <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                  {[{i:"mic",t:"Voice input"},{i:"camera",t:"Photo analysis"},{i:"bolt",t:"Smart macros"}].map((t,j)=>(<div key={j} style={{display:"flex",alignItems:"center",gap:8}}><Ico name={t.i} size={16}/><span style={{fontSize:13,fontWeight:600,color:C.muted}}>{t.t}</span></div>))}
                </div>
              </div>
              <div style={{flex:1}}><div className="img-card" style={{aspectRatio:"4/3"}}><img src={IMG.food} alt="Healthy meal"/></div></div>
            </div>
          </Reveal>
          <Reveal>
            <div className="benefit-row reverse" style={{marginBottom:100}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:C.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.1em",marginBottom:16}}>02 — TRAIN</div>
                <h3 className="heading" style={{fontSize:28,marginBottom:16}}>See the metrics<br/>that actually matter</h3>
                <p style={{fontSize:15,lineHeight:1.8,color:C.muted,marginBottom:24}}>APEX pulls everything from Strava — power, heart rate zones, pace, elevation — and calculates training load science: TSS, CTL, ATL, and TSB.</p>
                <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                  {[{i:"bike",t:"Strava sync"},{i:"chart",t:"Power analytics"},{i:"flame",t:"Load tracking"}].map((t,j)=>(<div key={j} style={{display:"flex",alignItems:"center",gap:8}}><Ico name={t.i} size={16}/><span style={{fontSize:13,fontWeight:600,color:C.muted}}>{t.t}</span></div>))}
                </div>
              </div>
              <div style={{flex:1}}><div className="img-card" style={{aspectRatio:"4/3"}}><img src={IMG.cycling} alt="Cyclists"/></div></div>
            </div>
          </Reveal>
          <Reveal>
            <div className="benefit-row">
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:C.teal,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.1em",marginBottom:16}}>03 — COACH</div>
                <h3 className="heading" style={{fontSize:28,marginBottom:16}}>An AI coach that<br/>knows your whole picture</h3>
                <p style={{fontSize:15,lineHeight:1.8,color:C.muted,marginBottom:24}}>Ask anything — "What should I eat before tomorrow's century ride?" — and get answers grounded in your actual training, nutrition, and schedule.</p>
                <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                  {[{i:"mic",t:"Voice-first"},{i:"heart",t:"Full context"},{i:"calendar",t:"Proactive plans"}].map((t,j)=>(<div key={j} style={{display:"flex",alignItems:"center",gap:8}}><Ico name={t.i} size={16}/><span style={{fontSize:13,fontWeight:600,color:C.muted}}>{t.t}</span></div>))}
                </div>
              </div>
              <div style={{flex:1}}><div className="img-card" style={{aspectRatio:"4/3"}}><img src={IMG.runner} alt="Runner"/></div></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* GALLERY */}
      <section className="section-pad">
        <div className="container">
          <Reveal><div style={{textAlign:"center",marginBottom:48}}><div className="label">Built for the Active Life</div><h2 className="heading lg" style={{fontSize:36}}>From kitchen to trail to recovery</h2></div></Reveal>
          <Reveal delay={100}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gridTemplateRows:"280px 280px",gap:16}}>
              <div className="img-card" style={{gridRow:"1/3"}}><img src={IMG.nature} alt="Mountain"/></div>
              <div className="img-card"><img src={IMG.meal2} alt="Food"/></div>
              <div className="img-card"><img src={IMG.watch} alt="Watch"/></div>
              <div className="img-card" style={{gridColumn:"2/4"}}><img src={IMG.community} alt="Community"/></div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={{textAlign:"center",background:C.bg2}}>
        <div className="container" style={{maxWidth:640}}>
          <Reveal>
            <div style={{marginBottom:24}}><ApexIcon size={56} variant="naked" /></div>
            <div className="label" style={{marginBottom:20}}>Ready to Start?</div>
            <h2 className="heading" style={{fontSize:40,marginBottom:20}}>Take control of your<br/>nutrition and training.</h2>
            <p style={{fontSize:16,lineHeight:1.75,color:C.muted,marginBottom:40}}>APEX is free, open source, and built by athletes for athletes. Clone the repo, set it up, and start training smarter today.</p>
            <a href={GH} target="_blank" rel="noopener"><button className="btn-primary"><Ico name="github" size={18} color="#071a18"/>Get Started on GitHub</button></a>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{maxWidth:1120,margin:"0 auto"}}>
        <div className="footer-copy" style={{display:"flex",alignItems:"center",gap:12}}>
          <ApexLockup iconSize={24} titleSize={14} gap={8} variant="naked" />
          <span style={{color:C.dim}}>·</span>
          <span>Open source AI health companion · Built by Marc</span>
        </div>
        <div className="footer-links">
          <a href={GH} target="_blank" rel="noopener">GitHub</a>
          <a href="#">Documentation</a>
          <a href="#">Contributing</a>
        </div>
      </footer>
      <div style={{height:24}}/>
    </>
  );
}

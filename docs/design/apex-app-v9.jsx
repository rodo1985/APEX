import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const T = {
  bg:"#0f1012", card:"#18191f", card2:"#1e1f27",
  border:"rgba(255,255,255,0.06)",
  teal:"#2DD4BF", tealDim:"rgba(45,212,191,0.10)", tealBorder:"rgba(45,212,191,0.18)",
  orange:"#f97316", blue:"#60a5fa", red:"#f87171", redDim:"rgba(248,113,113,0.10)",
  text:"#ffffff", text2:"#8a8f9e", text3:"#3d4050",
};
const NAV_H = 72;

// ─────────────────────────────────────────────────────────────
// APEX ICON SYSTEM
// ─────────────────────────────────────────────────────────────
function ApexIcon({size=72, variant="dark"}){
  const variants={
    dark:   {bg:"#0d1411",  stroke:T.teal,    fill:T.teal,    opacity:1},
    teal:   {bg:T.teal,     stroke:"#071a18", fill:"#071a18", opacity:1},
    light:  {bg:"#FFFFFF",  stroke:"#0d1411", fill:"#0d1411", opacity:1},
    mono:   {bg:"#0d1411",  stroke:"#FFFFFF", fill:"#FFFFFF", opacity:1},
    ghost:  {bg:T.card,     stroke:T.teal,    fill:T.teal,    opacity:0.4},
    outline:{bg:"transparent",stroke:T.teal,  fill:T.teal,    opacity:1},
    nav:    {bg:"transparent",stroke:T.teal,  fill:T.teal,    opacity:1}, // no bg rect
  };
  const v=variants[variant]||variants.dark;
  const r=Math.round(size*0.24);
  const isNoBg=variant==="outline"||variant==="nav";
  return(
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
      {!isNoBg&&<rect width="72" height="72" rx={r} fill={v.bg}/>}
      {variant==="outline"&&<rect width="71" height="71" x="0.5" y="0.5" rx={r} fill="none" stroke={v.stroke} strokeWidth="1.5" opacity="0.3"/>}
      <path d="M36 55 C35 55 13 42 13 28 C13 20.5 19 15 26 15 C30.5 15 34 17.5 36 21 C38 17.5 41.5 15 46 15 C53 15 59 20.5 59 28 C59 42 37 55 36 55 Z"
        fill={v.fill} fillOpacity={variant==="ghost"?0.08:0.1}
        stroke={v.stroke} strokeWidth="2" strokeLinejoin="round" opacity={v.opacity}/>
      <polyline points="18,34 23,34 27,25 31,43 35,19 39,43 43,30 47,34 54,34"
        fill="none" stroke={v.stroke} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" opacity={v.opacity}/>
    </svg>
  );
}

function ApexTitle({size=36, variant="dark"}){
  const color=(variant==="light"||variant==="teal")?"#0a0b0d":T.text;
  const accent=variant==="light"?"#0a6b60":variant==="teal"?"#000000":T.teal;
  return(
    <span className="apex-wordmark" style={{fontSize:size,fontWeight:800,letterSpacing:"-0.5px",color,lineHeight:1,userSelect:"none",display:"inline-block"}}>
      APE<span style={{color:accent,fontFamily:"'Syne',sans-serif",fontWeight:800}}>X</span>
    </span>
  );
}

function ApexLockup({iconSize=40, titleSize=22, variant="dark", gap=10}){
  return(
    <div style={{display:"flex",alignItems:"center",gap}}>
      <ApexIcon size={iconSize} variant={variant}/>
      <ApexTitle size={titleSize} variant={variant}/>
    </div>
  );
}

function ApexLockupStacked({iconSize=56, titleSize=20, variant="dark"}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      <ApexIcon size={iconSize} variant={variant}/>
      <ApexTitle size={titleSize} variant={variant}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPLASH SCREEN
// ─────────────────────────────────────────────────────────────
function SplashScreen({onDone}){
  const[phase,setPhase]=useState("in"); // in | hold | out
  useEffect(()=>{
    // 0.9s fade in → hold → 4.6s total → fade out 0.5s
    const t1=setTimeout(()=>setPhase("out"),4600);
    const t2=setTimeout(onDone,5100);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);

  return(
    <div style={{
      position:"absolute",inset:0,background:T.bg,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      zIndex:999,
      opacity:phase==="out"?0:1,
      transition:phase==="out"?"opacity 0.5s ease":"none",
    }}>
      {/* Ambient glow — pulses with heartbeat */}
      <div style={{
        position:"absolute",top:"50%",left:"50%",
        transform:"translate(-50%,-60%)",
        width:320,height:320,
        background:`radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 68%)`,
        pointerEvents:"none",
        animation:"heartbeat 1.4s ease-in-out infinite",
      }}/>

      {/* Main lockup */}
      <div className="splash-in" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22}}>
        {/* Icon with heartbeat */}
        <div className="heartbeat">
          <ApexIcon size={100} variant="dark"/>
        </div>
        {/* Wordmark */}
        <ApexTitle size={42} variant="dark"/>
      </div>

      {/* Tagline — delayed reveal */}
      <div className="splash-sub" style={{
        marginTop:16,
        fontSize:12,color:T.text3,
        letterSpacing:"0.18em",textTransform:"uppercase",
        textAlign:"center",
      }}>
        Your AI performance coach
      </div>

      {/* Loading bar at bottom */}
      <div style={{
        position:"absolute",bottom:52,
        width:120,height:2,
        background:"rgba(255,255,255,0.05)",
        borderRadius:1,overflow:"hidden",
      }}>
        <div style={{
          height:"100%",background:T.teal,borderRadius:1,
          animation:"loadbar 4.2s cubic-bezier(0.1,0,0.3,1) 0.3s both",
        }}/>
      </div>

      {/* Dots */}
      <div style={{position:"absolute",bottom:32,display:"flex",gap:7}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{
            width:5,height:5,borderRadius:"50%",background:T.teal,
            animation:`pulse-dot 1.4s ease ${i*0.18}s infinite`,
            opacity:0.3+(i*0.25),
          }}/>
        ))}
      </div>

      <style>{`
        @keyframes loadbar{from{width:0}to{width:100%}}
        @keyframes pulse-dot{0%,100%{transform:scale(1);opacity:0.35}50%{transform:scale(1.5);opacity:1}}
      `}</style>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  *{font-family:'Plus Jakarta Sans',sans-serif;}
  button{cursor:pointer;border:none;background:none;padding:0;}
  textarea,input{font-family:'Plus Jakarta Sans',sans-serif;}
  .apex-wordmark{font-family:'Syne',sans-serif !important;}
  .apex-wordmark *{font-family:'Syne',sans-serif !important;}
  @keyframes splashFade{0%{opacity:0;transform:scale(0.88)}50%{opacity:1;transform:scale(1)}100%{opacity:1;transform:scale(1)}}
  @keyframes splashOut{0%{opacity:1}100%{opacity:0;pointer-events:none}}
  @keyframes subFade{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes heartbeat{
    0%   {transform:scale(1)}
    14%  {transform:scale(1.18)}
    28%  {transform:scale(1)}
    42%  {transform:scale(1.10)}
    70%  {transform:scale(1)}
    100% {transform:scale(1)}
  }
  @keyframes pulse-dot{0%,100%{transform:scale(1);opacity:0.4}50%{transform:scale(1.4);opacity:1}}
  .splash-in{animation:splashFade 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards;}
  .splash-sub{animation:subFade 0.6s ease 0.7s both;}
  .splash-out{animation:splashOut 0.5s ease forwards;}
  .heartbeat{animation:heartbeat 1.4s ease-in-out infinite;transform-origin:center;}
  body{background:#0f1012;margin:0;}

  /* ── RESPONSIVE LAYOUT ── */
  .app{background:#0f1012;height:100vh;color:#fff;display:flex;flex-direction:column;overflow:hidden;position:relative;}

  /* Mobile: single column, bottom nav */
  .app-shell{flex:1;display:flex;overflow:hidden;}
  .main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .screen{flex:1;overflow-y:auto;padding-bottom:${NAV_H}px;}
  .full-screen{flex:1;display:flex;flex-direction:column;overflow:hidden;}

  /* ── BOTTOM NAV (mobile/tablet) ── */
  .bottom-nav{height:${NAV_H}px;flex-shrink:0;background:rgba(15,16,18,0.98);backdrop-filter:blur(20px);border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-around;align-items:center;padding:0 8px 16px;}
  .nav-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 14px;border-radius:14px;transition:background 0.15s;cursor:pointer;}
  .nav-btn.active{background:rgba(45,212,191,0.10);}
  .nav-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#3d4050;transition:color 0.15s;}
  .nav-btn.active .nav-label{color:#2DD4BF;}

  /* ── SIDEBAR NAV (desktop) ── */
  .sidebar{display:none;}

  /* ── DESKTOP COACH PANEL ── */
  .coach-panel{display:none;}

  /* ── TABLET (640px+) ── */
  @media(min-width:640px){
    .app{max-width:100%;}
    .screen{padding-bottom:${NAV_H}px;}
  }

  /* ── DESKTOP (1024px+) ── */
  @media(min-width:1024px){
    .app{max-width:100%;}
    .app-shell{flex-direction:row;}

    /* Sidebar replaces bottom nav */
    .bottom-nav{display:none;}
    .screen{padding-bottom:0;}

    .sidebar{
      display:flex;flex-direction:column;
      width:240px;flex-shrink:0;
      background:#13141a;
      border-right:1px solid rgba(255,255,255,0.06);
      padding:0;overflow:hidden;
    }
    .sidebar-logo{padding:28px 20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
    .sidebar-nav{flex:1;padding:16px 10px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;}
    .sidebar-btn{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;transition:all 0.15s;cursor:pointer;width:100%;text-align:left;}
    .sidebar-btn:hover{background:rgba(255,255,255,0.04);}
    .sidebar-btn.active{background:rgba(45,212,191,0.10);}
    .sidebar-label{font-size:13px;font-weight:600;color:#3d4050;transition:color 0.15s;}
    .sidebar-btn.active .sidebar-label{color:#2DD4BF;}
    .sidebar-footer{padding:16px 10px 24px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
    .sidebar-footer-btn{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:14px;width:100%;cursor:pointer;transition:background 0.15s;}
    .sidebar-footer-btn:hover{background:rgba(255,255,255,0.04);}

    /* Main grows */
    .main-content{flex:1;min-width:0;}

    /* Persistent right coach panel */
    .coach-panel{
      display:flex;flex-direction:column;
      width:380px;flex-shrink:0;
      border-left:1px solid rgba(255,255,255,0.06);
      background:#0f1012;overflow:hidden;
    }

    /* Desktop top bar inside main */
    .desktop-topbar{display:flex;align-items:center;justify-content:space-between;padding:20px 32px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}

    /* Grid layout for dashboard */
    .dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 32px;}
    .dashboard-col{display:flex;flex-direction:column;gap:16px;}
    .dashboard-full{grid-column:1/-1;}

    /* Wider padding on desktop */
    .desktop-pad{padding-left:32px;padding-right:32px;}
    .desktop-screen{flex:1;overflow-y:auto;padding-bottom:0;}
  }

  /* Modal — full screen on mobile, centered on desktop */
  .modal{position:absolute;inset:0;z-index:200;display:flex;flex-direction:column;background:#0f1012;}
  @media(min-width:1024px){
    .modal{position:fixed;inset:0;z-index:500;flex-direction:row;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);}
    .modal-inner{width:520px;max-height:90vh;background:#0f1012;border-radius:28px;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.6);}
  }
  .modal-header{display:flex;align-items:center;gap:12px;padding:52px 22px 18px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
  @media(min-width:1024px){.modal-header{padding:28px 24px 18px;}}
  .modal-back{width:38px;height:38px;background:#18191f;border:1px solid rgba(255,255,255,0.06);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .modal-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.3px;}
  .modal-sub{font-size:12px;color:#8a8f9e;margin-top:2px;}

  /* camera */
  .camera-view{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:0 22px;}
  .camera-frame{width:100%;aspect-ratio:1;border-radius:22px;overflow:hidden;position:relative;background:#18191f;border:2px solid rgba(255,255,255,0.06);}
  .camera-frame img{width:100%;height:100%;object-fit:cover;display:block;}
  .camera-corner{position:absolute;width:22px;height:22px;border-color:#2DD4BF;border-style:solid;}
  .analyzing-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:0 32px;}
  .analyze-ring{width:64px;height:64px;border-radius:50%;border:3px solid rgba(45,212,191,0.2);border-top-color:#2DD4BF;animation:spin 0.8s linear infinite;}

  /* input */
  .input-pill{display:flex;align-items:center;background:#18191f;border:1px solid rgba(255,255,255,0.06);border-radius:26px;padding:10px 10px 10px 18px;gap:8px;transition:border-color 0.2s;}
  .input-pill:focus-within{border-color:rgba(45,212,191,0.28);}
  .chat-ta{flex:1;background:none;border:none;outline:none;color:#fff;font-size:15px;line-height:1.5;resize:none;padding:0;max-height:160px;min-height:22px;align-self:center;}
  .chat-ta::placeholder{color:#8a8f9e;}
  .in-btn{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;}
  .in-mic{background:none;color:#8a8f9e;} .in-mic:hover{color:#2DD4BF;}
  .in-send{background:#2DD4BF;} .in-send:disabled{background:#1e1f27;}

  .rec-pill{display:flex;align-items:center;gap:10px;background:#18191f;border:1px solid rgba(255,255,255,0.06);border-radius:26px;padding:6px;height:56px;}
  .rec-x{width:44px;height:44px;border-radius:50%;background:#1e1f27;display:flex;align-items:center;justify-content:center;color:#8a8f9e;flex-shrink:0;transition:all 0.15s;}
  .rec-x:hover{background:rgba(248,113,113,0.15);color:#f87171;}
  .rec-mid{flex:1;display:flex;align-items:center;gap:10px;overflow:hidden;padding:0 2px;}
  .waveform{flex:1;display:flex;align-items:center;gap:2.5px;height:32px;overflow:hidden;}
  .wave-bar{width:2.5px;border-radius:2px;background:#2DD4BF;flex-shrink:0;}
  .rec-timer{font-size:14px;font-weight:600;color:#8a8f9e;font-variant-numeric:tabular-nums;letter-spacing:0.04em;flex-shrink:0;min-width:32px;text-align:right;}
  .rec-ok{width:44px;height:44px;border-radius:50%;background:#2DD4BF;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

  .messages{flex:1;overflow-y:auto;padding:20px 22px 8px;display:flex;flex-direction:column;gap:18px;}
  .msg{display:flex;flex-direction:column;}
  .msg.user{align-items:flex-end;} .msg.apex,.msg.coach{align-items:flex-start;}
  .msg-who{font-size:10px;font-weight:600;color:#8a8f9e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
  .bubble{max-width:84%;padding:12px 16px;font-size:14px;line-height:1.65;}
  .msg.coach .bubble,.msg.apex .bubble{background:#18191f;border:1px solid rgba(255,255,255,0.06);color:#8a8f9e;border-radius:4px 18px 18px 18px;}
  .msg.user .bubble{background:#2DD4BF;color:#071a18;font-weight:500;border-radius:18px 18px 4px 18px;}

  .search-input{width:100%;background:#18191f;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:12px 16px 12px 44px;color:#fff;font-size:14px;outline:none;}
  .search-input::placeholder{color:#3d4050;}
  .search-wrap{position:relative;}
  .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);}

  .log-confirm-bar{padding:12px 22px 24px;flex-shrink:0;display:flex;gap:10px;}
  .btn-primary{flex:1;background:#2DD4BF;border-radius:16px;padding:14px;font-size:14px;font-weight:700;color:#071a18;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s;}
  .btn-primary:hover{opacity:0.88;}
  .btn-secondary{background:#18191f;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:14px 18px;font-size:14px;font-weight:600;color:#8a8f9e;}

  /* swipe ingredient */
  .ing-swipe-wrap{position:relative;overflow:hidden;border-radius:20px;margin-bottom:10px;}
  .ing-swipe-inner{transition:transform 0.2s ease;will-change:transform;}
  .ing-swipe-inner.swiped{transform:translateX(-76px);}
  .ing-delete-reveal{position:absolute;top:0;right:0;bottom:0;width:76px;display:flex;align-items:center;justify-content:center;background:rgba(248,113,113,0.12);border-radius:0 20px 20px 0;}

  /* confirm */
  .confirm-overlay{position:absolute;inset:0;background:rgba(0,0,0,0.7);z-index:400;display:flex;align-items:flex-end;}
  .confirm-sheet{width:100%;background:#18191f;border-radius:24px 24px 0 0;padding:28px 24px 36px;border-top:1px solid rgba(255,255,255,0.08);}

  .sheet{position:absolute;bottom:0;left:0;right:0;background:#18191f;border-radius:24px 24px 0 0;border-top:1px solid rgba(255,255,255,0.08);padding:10px 0 0;z-index:300;animation:slideUp 0.22s ease;}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .sheet-handle{width:36px;height:4px;background:rgba(255,255,255,0.12);border-radius:2px;margin:0 auto 20px;}

  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes dots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}100%{content:''}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scanline{0%,100%{top:20%}50%{top:80%}}
  .fade-up{animation:fadeUp 0.25s ease forwards;}
  .dots-anim::after{content:'';animation:dots 1.4s steps(4,end) infinite;}
`;

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────
function Svg({size=20,color="currentColor",sw=1.5,children}){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{display:"block",flexShrink:0}}>{children}</svg>;
}
const IC={
  home:p=><Svg {...p}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></Svg>,
  fork:p=><Svg {...p}><path d="M8 3v5c0 1.657 1.343 3 3 3s3-1.343 3-3V3"/><line x1="11" y1="11" x2="11" y2="21"/><line x1="16" y1="3" x2="16" y2="8"/><path d="M16 8c0 2-1.5 3-1.5 5v8"/></Svg>,
  bike:p=><Svg {...p}><circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h4l3 5"/><path d="M10 8h5l2 5"/><circle cx="15" cy="8" r="1" fill={p.color||"currentColor"} stroke="none"/></Svg>,
  chat:p=><Svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></Svg>,
  bell:p=><Svg {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></Svg>,
  mic:p=><Svg {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0014 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></Svg>,
  camera:p=><Svg {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></Svg>,
  plus:p=><Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  minus:p=><Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  send:p=><Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill={p.color||"currentColor"} stroke="none"/></Svg>,
  close:p=><Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  check:p=><Svg {...p}><polyline points="20 6 9 17 4 12"/></Svg>,
  back:p=><Svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>,
  search:p=><Svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
  "arrow-r":p=><Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>,
  heart:p=><Svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></Svg>,
  drop:p=><Svg {...p}><path d="M12 2C6 10 4 14 4 17a8 8 0 0016 0c0-3-2-7-8-15z"/></Svg>,
  moon:p=><Svg {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></Svg>,
  bolt:p=><Svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>,
  trash:p=><Svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></Svg>,
  edit:p=><Svg {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>,
  run:p=><Svg {...p}><circle cx="17" cy="3.5" r="1.5" fill={p.color||"currentColor"} stroke="none"/><path d="M11 7l2-3.5 4 2.5-2 4"/><path d="M7.5 21l2-5 3.5 2"/><path d="M4 13l3-2 3.5 3-3 4"/><path d="M13.5 12l4 2-2 5"/></Svg>,
  info:p=><Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Svg>,
  menu:p=><Svg {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Svg>,
  user:p=><Svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></Svg>,
  key:p=><Svg {...p}><circle cx="7.5" cy="15.5" r="3.5"/><path d="M11 12l8-8M17 6l2 2M15 8l2 2"/></Svg>,
  link2:p=><Svg {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></Svg>,
  eye:p=><Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>,
  "eye-off":p=><Svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>,
  copy:p=><Svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></Svg>,
  calendar:p=><Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>,
  chevron:p=><Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>,
};
const Icon=({name,...p})=>IC[name]?IC[name](p):null;

// ─────────────────────────────────────────────────────────────
// WAVEFORM + TIMER
// ─────────────────────────────────────────────────────────────
function Waveform({active}){
  const[bars,setBars]=useState(()=>Array.from({length:38},()=>4));
  const raf=useRef(null),t0=useRef(Date.now());
  useEffect(()=>{
    if(!active){setBars(Array.from({length:38},()=>4));return;}
    t0.current=Date.now();
    const loop=()=>{const t=(Date.now()-t0.current)/1000;setBars(Array.from({length:38},(_,i)=>Math.max(3,Math.min(28,10+Math.sin(t*3.5+i*0.45)*7+Math.sin(t*5.2+i*0.8)*4+(Math.random()-0.5)*6))));raf.current=requestAnimationFrame(loop);};
    raf.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf.current);
  },[active]);
  return <div className="waveform">{bars.map((h,i)=><div key={i} className="wave-bar" style={{height:h,opacity:active?0.5+(h/28)*0.5:0.15}}/>)}</div>;
}
function useTimer(r){const[s,setS]=useState(0),ref=useRef(null);useEffect(()=>{if(r)ref.current=setInterval(()=>setS(v=>v+1),1000);else{clearInterval(ref.current);setS(0);}return()=>clearInterval(ref.current);},[r]);return`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;}

// ─────────────────────────────────────────────────────────────
// VOICE INPUT BAR
// ─────────────────────────────────────────────────────────────
const TRANSCRIPTIONS=["I had overnight oats with banana and honey.","Grilled chicken with rice and salad.","Just had a recovery protein shake.","Scrambled eggs on sourdough toast.","Greek yogurt with berries and granola."];
function VoiceInputBar({placeholder="Ask your coach…",onSend}){
  const[mode,setMode]=useState("idle"),[text,setText]=useState("");
  const timer=useTimer(mode==="recording"),taRef=useRef(null);
  useEffect(()=>{if(!taRef.current)return;taRef.current.style.height="auto";taRef.current.style.height=taRef.current.scrollHeight+"px";},[text]);
  const send=()=>{const t=text.trim();if(!t)return;onSend(t);setText("");if(taRef.current)taRef.current.style.height="auto";};
  return(
    <div style={{padding:"12px 16px 28px",borderTop:`1px solid ${T.border}`,background:"rgba(15,16,18,0.98)",backdropFilter:"blur(20px)",flexShrink:0}}>
      {mode==="idle"&&<div className="input-pill"><textarea ref={taRef} className="chat-ta" placeholder={placeholder} value={text} rows={1} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/><div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}><button className="in-btn in-mic" onClick={()=>setMode("recording")}><Icon name="mic" size={19} color="currentColor" sw={1.7}/></button><button className="in-btn in-send" onClick={send} disabled={!text.trim()}><Icon name="send" size={17} color={text.trim()?"#071a18":T.text3} sw={2}/></button></div></div>}
      {mode==="recording"&&<div className="rec-pill"><button className="rec-x" onClick={()=>setMode("idle")}><Icon name="close" size={16} color="currentColor" sw={2.2}/></button><div className="rec-mid"><Waveform active={true}/><div className="rec-timer">{timer}</div></div><button className="rec-ok" onClick={()=>{setMode("transcribing");setTimeout(()=>{setText(TRANSCRIPTIONS[Math.floor(Math.random()*TRANSCRIPTIONS.length)]);setMode("idle");setTimeout(()=>taRef.current?.focus(),60);},1400);}}><Icon name="check" size={18} color="#071a18" sw={2.5}/></button></div>}
      {mode==="transcribing"&&<div style={{display:"flex",alignItems:"center",gap:12,background:T.card,border:`1px solid ${T.border}`,borderRadius:26,padding:"14px 20px",height:56}}><div style={{width:18,height:18,border:`2px solid ${T.border}`,borderTopColor:T.teal,borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0}}/><div style={{fontSize:14,color:T.text2}} className="dots-anim">Transcribing</div></div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INGREDIENT CARD (with optional swipe-to-delete)
// ─────────────────────────────────────────────────────────────
function IngredientCard({ing,onAdjust,showStepper=true,onDelete}){
  const[swiped,setSwiped]=useState(false);
  const[confirmDel,setConfirmDel]=useState(false);
  const f=ing.qty/ing.baseWeight;
  const kcal=Math.round(ing.baseKcal*f),prot=Math.round(ing.baseProt*f),carb=Math.round(ing.baseCarb*f),fat=Math.round(ing.baseFat*f);
  const startX=useRef(null);
  const onTouchStart=e=>{startX.current=e.touches[0].clientX;};
  const onTouchEnd=e=>{if(!startX.current)return;const dx=e.changedTouches[0].clientX-startX.current;if(dx<-40)setSwiped(true);else if(dx>20)setSwiped(false);startX.current=null;};
  const mxStart=useRef(null);
  const onMouseDown=e=>{mxStart.current=e.clientX;};
  const onMouseUp=e=>{if(!mxStart.current)return;const dx=e.clientX-mxStart.current;if(dx<-40)setSwiped(true);else if(dx>20)setSwiped(false);mxStart.current=null;};

  const card=(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:16}} className="fade-up">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:44,height:44,background:T.card2,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{ing.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:T.text,lineHeight:1.2}}>{ing.name}</div>
          <div style={{fontSize:11,color:T.text3,marginTop:2}}>{ing.qty}g</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:18,fontWeight:800,color:T.text}}>{kcal}</div>
          <div style={{fontSize:10,color:T.text3,letterSpacing:"0.04em"}}>cal</div>
        </div>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[{label:"Prot",val:prot,color:T.teal},{label:"Carb",val:carb,color:T.blue},{label:"Fat",val:fat,color:T.orange}].map(m=>(
          <div key={m.label} style={{flex:1,background:T.card2,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.val}g</div>
            <div style={{fontSize:9,color:T.text3,letterSpacing:"0.05em",marginTop:2}}>{m.label}</div>
          </div>
        ))}
        {showStepper&&(
          <div style={{flex:1.4,background:T.card2,borderRadius:10,padding:"6px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
            <button onClick={()=>onAdjust&&onAdjust(-5)} style={{width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="minus" size={12} color={T.text2}/></button>
            <div style={{textAlign:"center",flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1}}>{ing.qty}</div>
              <div style={{fontSize:8,color:T.text3,letterSpacing:"0.04em"}}>g</div>
            </div>
            <button onClick={()=>onAdjust&&onAdjust(5)} style={{width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="plus" size={12} color={T.text2}/></button>
          </div>
        )}
      </div>
    </div>
  );

  if(!onDelete) return <div style={{marginBottom:10}}>{card}</div>;

  return(
    <>
      <div className="ing-swipe-wrap">
        <div className="ing-delete-reveal">
          <button onClick={()=>{setSwiped(false);setConfirmDel(true);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <Icon name="trash" size={20} color={T.red}/>
            <div style={{fontSize:10,fontWeight:600,color:T.red}}>Delete</div>
          </button>
        </div>
        <div className={`ing-swipe-inner${swiped?" swiped":""}`}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
          {card}
        </div>
      </div>
      {confirmDel&&(
        <div className="confirm-overlay" onClick={()=>setConfirmDel(false)}>
          <div className="confirm-sheet" onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>Remove ingredient?</div>
            <div style={{fontSize:14,color:T.text2,marginBottom:24,lineHeight:1.5}}>Remove <strong style={{color:T.text}}>{ing.name}</strong> from this meal?</div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn-secondary" style={{flex:1}} onClick={()=>setConfirmDel(false)}>Cancel</button>
              <button onClick={()=>{setConfirmDel(false);onDelete();}} style={{flex:1,background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:16,padding:14,fontSize:14,fontWeight:700,color:T.red,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <Icon name="trash" size={16} color={T.red}/>Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOD LIST CARD
// ─────────────────────────────────────────────────────────────
function FoodListCard({food,onTap}){
  const kcal=food.baseKcal,prot=food.baseProt,carb=food.baseCarb,fat=food.baseFat;
  return(
    <button onClick={onTap} style={{width:"100%",textAlign:"left",marginBottom:10}} className="fade-up">
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:44,height:44,background:T.card2,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{food.emoji}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,lineHeight:1.2}}>{food.name}</div>
              {food.id&&food.id.startsWith("ai_")&&<div style={{fontSize:9,fontWeight:700,color:T.teal,background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:4,padding:"1px 5px",flexShrink:0}}>MINE</div>}
            </div>
            <div style={{fontSize:11,color:T.text3,marginTop:2}}>per {food.per}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:18,fontWeight:800,color:T.text}}>{kcal}</div>
            <div style={{fontSize:10,color:T.text3,letterSpacing:"0.04em"}}>cal</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{label:"Prot",val:prot,color:T.teal},{label:"Carb",val:carb,color:T.blue},{label:"Fat",val:fat,color:T.orange}].map(m=>(
            <div key={m.label} style={{flex:1,background:T.card2,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.val}g</div>
              <div style={{fontSize:9,color:T.text3,letterSpacing:"0.05em",marginTop:2}}>{m.label}</div>
            </div>
          ))}
          <div style={{flex:1.4,background:T.card2,borderRadius:10,padding:"8px 6px",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontSize:10,color:T.text3,textAlign:"center",lineHeight:1.3}}>Set<br/>qty</div>
            <Icon name="chevron" size={14} color={T.text3}/>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MACRO SUMMARY
// ─────────────────────────────────────────────────────────────
function MacroSummary({ingredients,mealImg}){
  const totalKcal=Math.round(ingredients.reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0));
  const totals={prot:Math.round(ingredients.reduce((a,i)=>a+(i.baseProt*(i.qty/i.baseWeight)),0)),carb:Math.round(ingredients.reduce((a,i)=>a+(i.baseCarb*(i.qty/i.baseWeight)),0)),fat:Math.round(ingredients.reduce((a,i)=>a+(i.baseFat*(i.qty/i.baseWeight)),0))};
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,overflow:"hidden",marginBottom:16}}>
      <div style={{display:"flex"}}>
        <div style={{flex:1,padding:"18px 16px"}}>
          <div style={{fontSize:11,color:T.text2,marginBottom:6}}>Total</div>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:"-2px",color:T.text,lineHeight:1,marginBottom:12}}>{totalKcal}<span style={{fontSize:14,fontWeight:400,color:T.text2,marginLeft:4}}>cal</span></div>
          <div style={{display:"flex",gap:8}}>
            {[{v:`${totals.prot}g`,l:"Prot",c:T.teal},{v:`${totals.carb}g`,l:"Carb",c:T.blue},{v:`${totals.fat}g`,l:"Fat",c:T.orange}].map(x=>(
              <div key={x.l} style={{flex:1,background:T.card2,borderRadius:9,padding:"7px 8px",textAlign:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:x.c}}>{x.v}</div>
                <div style={{fontSize:9,color:T.text3,marginTop:1,letterSpacing:"0.04em"}}>{x.l}</div>
              </div>
            ))}
          </div>
        </div>
        {mealImg&&<div style={{width:110,flexShrink:0}}><img src={mealImg} alt="meal" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"0 22px 22px 0"}}/></div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOD DETAIL SHEET
// ─────────────────────────────────────────────────────────────
function FoodDetailSheet({food,onClose,onAdd}){
  const[qty,setQty]=useState(food.baseWeight);
  const f=qty/food.baseWeight;
  const kcal=Math.round(food.baseKcal*f);
  return(
    <>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",zIndex:299}}/>
      <div className="sheet">
        <div className="sheet-handle"/>
        <div style={{padding:"0 22px 28px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{width:52,height:52,background:T.card2,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{food.emoji}</div>
            <div style={{flex:1}}><div style={{fontSize:17,fontWeight:800,color:T.text}}>{food.name}</div><div style={{fontSize:12,color:T.text2,marginTop:2}}>Base: {food.per}</div></div>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:T.card2,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="close" size={14} color={T.text2} sw={2}/></button>
          </div>
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:16,marginBottom:16}}>
            <div style={{fontSize:11,color:T.text2,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>Portion size</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
              {[-10,-5].map(d=><button key={d} onClick={()=>setQty(q=>Math.max(5,q+d))} style={{width:44,height:44,borderRadius:"50%",background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.text2}}>{d}</button>)}
              <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:36,fontWeight:800,color:T.text,letterSpacing:"-1px"}}>{qty}</div><div style={{fontSize:12,color:T.text3}}>grams</div></div>
              {[5,10].map(d=><button key={d} onClick={()=>setQty(q=>q+d)} style={{width:44,height:44,borderRadius:"50%",background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.text2}}>+{d}</button>)}
            </div>
          </div>
          <div style={{display:"flex",gap:7,marginBottom:20}}>
            {[{v:kcal,l:"cal",c:T.text},{v:`${Math.round(food.baseProt*f)}g`,l:"Prot",c:T.teal},{v:`${Math.round(food.baseCarb*f)}g`,l:"Carb",c:T.blue},{v:`${Math.round(food.baseFat*f)}g`,l:"Fat",c:T.orange}].map(x=>(
              <div key={x.l} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:700,color:x.c}}>{x.v}</div>
                <div style={{fontSize:9,color:T.text3,marginTop:2,letterSpacing:"0.04em"}}>{x.l}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={()=>onAdd({...food,qty,uid:Date.now()})}>
            <Icon name="plus" size={18} color="#071a18" sw={2.5}/>Add {food.name.split(",")[0]}
          </button>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MEAL CATEGORY HERO CARDS
// ─────────────────────────────────────────────────────────────
const MEAL_CATS = [
  {id:"breakfast", label:"Breakfast", time:"Morning",
   img:"https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80",
   accent:"#f97316"},
  {id:"lunch",     label:"Lunch",     time:"Midday",
   img:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
   accent:"#2DD4BF"},
  {id:"dinner",    label:"Dinner",    time:"Evening",
   img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
   accent:"#60a5fa"},
  {id:"snack",     label:"Snack",     time:"Anytime",
   img:"https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
   accent:"#a78bfa"},
];

// Hero card for food log overview
function MealCatCard({cat, meals, onOpen}){
  const allIngs = meals.flatMap(m=>m.ingredients);
  const totalKcal = allIngs.length
    ? Math.round(allIngs.reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0))
    : 0;
  const prot = allIngs.length ? Math.round(allIngs.reduce((a,i)=>a+(i.baseProt*(i.qty/i.baseWeight)),0)) : 0;
  const carb = allIngs.length ? Math.round(allIngs.reduce((a,i)=>a+(i.baseCarb*(i.qty/i.baseWeight)),0)) : 0;
  const fat  = allIngs.length ? Math.round(allIngs.reduce((a,i)=>a+(i.baseFat *(i.qty/i.baseWeight)),0)) : 0;
  const isEmpty = meals.length === 0;

  return(
    <button onClick={onOpen} style={{width:"100%",textAlign:"left",marginBottom:12}} className="fade-up">
      <div style={{borderRadius:22,overflow:"hidden",position:"relative",height:140,border:`1px solid ${T.border}`}}>
        {/* Background image */}
        <img src={cat.img} alt={cat.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:isEmpty?0.3:0.55}}/>
        {/* Dark overlay gradient */}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg, rgba(10,11,14,0.75) 0%, rgba(10,11,14,0.4) 100%)`}}/>
        {/* Accent glow top-right */}
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,background:`radial-gradient(circle,${cat.accent}33 0%,transparent 70%)`,pointerEvents:"none"}}/>

        {/* Content */}
        <div style={{position:"absolute",inset:0,padding:"16px 18px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          {/* Top row */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>{cat.label}</div>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>{cat.time}</div>
            </div>
            {!isEmpty&&(
              <div style={{background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:10,padding:"6px 10px",textAlign:"right"}}>
                <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>{totalKcal}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:"0.04em"}}>cal</div>
              </div>
            )}
          </div>

          {/* Bottom row */}
          {isEmpty?(
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:20,height:20,borderRadius:"50%",border:`1.5px dashed ${cat.accent}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name="plus" size={11} color={cat.accent}/>
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>Nothing logged yet · tap to add</div>
            </div>
          ):(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {[{v:`${prot}g`,l:"Prot",c:T.teal},{v:`${carb}g`,l:"Carb",c:T.blue},{v:`${fat}g`,l:"Fat",c:T.orange}].map(x=>(
                <div key={x.l} style={{background:"rgba(255,255,255,0.10)",backdropFilter:"blur(6px)",borderRadius:8,padding:"4px 9px",display:"flex",gap:5,alignItems:"baseline"}}>
                  <div style={{fontSize:12,fontWeight:700,color:x.c}}>{x.v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>{x.l}</div>
                </div>
              ))}
              <div style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,0.4)"}}>{meals.length} meal{meals.length!==1?"s":""} →</div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// Meal type selector for log flows (big cards)
function MealTypePicker({value,onChange}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {MEAL_CATS.map(cat=>(
        <button key={cat.id} onClick={()=>onChange(cat.id)} style={{textAlign:"left",borderRadius:18,overflow:"hidden",position:"relative",height:80,border:`2px solid ${value===cat.id?cat.accent:T.border}`,transition:"border-color 0.15s"}}>
          <img src={cat.img} alt={cat.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:0.45}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(10,11,14,0.85) 0%,rgba(10,11,14,0.3) 100%)"}}/>
          {value===cat.id&&<div style={{position:"absolute",top:0,right:0,bottom:0,width:4,background:cat.accent}}/>}
          <div style={{position:"absolute",inset:0,padding:"0 16px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:4,height:32,borderRadius:2,background:cat.accent,flexShrink:0}}/>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{cat.label}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{cat.time}</div>
            </div>
            {value===cat.id&&<div style={{marginLeft:"auto",width:22,height:22,borderRadius:"50%",background:cat.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={13} color="#0f1012" sw={2.5}/></div>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CATEGORY DETAIL VIEW
// ─────────────────────────────────────────────────────────────
function CategoryDetail({cat, meals, onBack, onSave, onAddNew}){
  const[editingMeal,setEditingMeal]=useState(null);
  const[localMeals,setLocalMeals]=useState(meals);
  const catDef=MEAL_CATS.find(c=>c.id===cat);

  const deleteIngredient=(mealUid,ingId)=>{
    setLocalMeals(p=>p.map(m=>m.uid===mealUid?{...m,ingredients:m.ingredients.filter(i=>i.id!==ingId)}:m).filter(m=>m.ingredients.length>0));
  };
  const adjustIngredient=(mealUid,ingId,delta)=>{
    setLocalMeals(p=>p.map(m=>m.uid===mealUid?{...m,ingredients:m.ingredients.map(i=>i.id===ingId?{...i,qty:Math.max(5,i.qty+delta)}:i)}:m));
  };

  const allIngs=localMeals.flatMap(m=>m.ingredients);
  const totalKcal=allIngs.length?Math.round(allIngs.reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0)):0;

  return(
    <div className="modal fade-up">
      {/* Header with photo */}
      <div style={{position:"relative",height:160,flexShrink:0}}>
        <img src={catDef.img} alt={catDef.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:0.6}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,11,14,0.5) 0%,rgba(10,11,14,0.9) 100%)"}}/>
        <div style={{position:"absolute",top:52,left:22,right:22,display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <button className="modal-back" onClick={onBack}><Icon name="back" size={18} color={T.text2}/></button>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end",marginBottom:2}}>
              <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{catDef.label}</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:catDef.accent}}>{totalKcal} cal total</div>
          </div>
        </div>
      </div>

      <div className="screen" style={{paddingBottom:90}}>
        <div style={{padding:"16px 22px 0"}}>
          {localMeals.length===0&&(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:56,height:56,borderRadius:18,background:T.card,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Icon name="fork" size={24} color={T.text3}/></div>
              <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>Nothing logged yet</div>
              <div style={{fontSize:13,color:T.text2,marginBottom:20}}>Add your {catDef.label.toLowerCase()} to get started.</div>
            </div>
          )}
          {localMeals.map(meal=>{
            const mealKcal=Math.round(meal.ingredients.reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0));
            return(
              <div key={meal.uid} style={{marginBottom:24}}>
                {/* Meal header — name + time + kcal, no emoji */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"0 2px"}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:T.text}}>{meal.name}</div>
                    <div style={{fontSize:11,color:T.text3}}>{meal.time}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:16,fontWeight:700,color:T.text}}>{mealKcal}</div>
                    <div style={{fontSize:10,color:T.text3}}>cal</div>
                  </div>
                </div>
                {/* Ingredients with swipe-to-delete */}
                {meal.ingredients.map(ing=>(
                  <IngredientCard
                    key={ing.id} ing={ing}
                    onAdjust={d=>adjustIngredient(meal.uid,ing.id,d)}
                    onDelete={()=>deleteIngredient(meal.uid,ing.id)}
                  />
                ))}
              </div>
            );
          })}
          {/* Add more */}
          <button onClick={onAddNew} style={{display:"flex",alignItems:"center",gap:8,color:T.teal,fontSize:14,fontWeight:600,marginTop:4,marginBottom:12}}>
            <Icon name="plus" size={18} color={T.teal}/>Add more to {catDef.label.toLowerCase()}
          </button>
        </div>
      </div>
      <div className="log-confirm-bar">
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={()=>onSave(localMeals)}>
          <Icon name="check" size={18} color="#071a18" sw={2.5}/>Save changes
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────
const PHOTO_ING=[
  {id:1,name:"Brown rice",emoji:"🌾",baseWeight:180,baseKcal:234,baseProt:4,baseCarb:46,baseFat:2,qty:180},
  {id:2,name:"Roasted vegetables",emoji:"🥦",baseWeight:120,baseKcal:85,baseProt:3,baseCarb:12,baseFat:3,qty:120},
  {id:3,name:"Avocado",emoji:"🥑",baseWeight:60,baseKcal:96,baseProt:1,baseCarb:4,baseFat:9,qty:60},
  {id:4,name:"Tahini dressing",emoji:"🫙",baseWeight:20,baseKcal:118,baseProt:4,baseCarb:4,baseFat:11,qty:20},
];
const VOICE_MAP={
  oat:[{id:1,name:"Rolled oats",emoji:"🥣",baseWeight:60,baseKcal:234,baseProt:8,baseCarb:40,baseFat:5,qty:60},{id:2,name:"Banana",emoji:"🍌",baseWeight:120,baseKcal:107,baseProt:1,baseCarb:27,baseFat:0,qty:120},{id:3,name:"Honey",emoji:"🍯",baseWeight:10,baseKcal:30,baseProt:0,baseCarb:8,baseFat:0,qty:10}],
  chicken:[{id:1,name:"Chicken breast",emoji:"🍗",baseWeight:150,baseKcal:248,baseProt:46,baseCarb:0,baseFat:5,qty:150},{id:2,name:"White rice",emoji:"🍚",baseWeight:180,baseKcal:234,baseProt:4,baseCarb:52,baseFat:0,qty:180},{id:3,name:"Green salad",emoji:"🥗",baseWeight:80,baseKcal:20,baseProt:1,baseCarb:3,baseFat:0,qty:80}],
  shake:[{id:1,name:"Whey protein",emoji:"🥤",baseWeight:35,baseKcal:130,baseProt:24,baseCarb:4,baseFat:2,qty:35},{id:2,name:"Oat milk",emoji:"🥛",baseWeight:250,baseKcal:110,baseProt:3,baseCarb:18,baseFat:2,qty:250}],
  egg:[{id:1,name:"Eggs (×2)",emoji:"🥚",baseWeight:120,baseKcal:143,baseProt:12,baseCarb:1,baseFat:10,qty:120},{id:2,name:"Sourdough",emoji:"🍞",baseWeight:70,baseKcal:170,baseProt:6,baseCarb:32,baseFat:1,qty:70}],
  yogurt:[{id:1,name:"Greek yogurt",emoji:"🫙",baseWeight:150,baseKcal:130,baseProt:15,baseCarb:8,baseFat:3,qty:150},{id:2,name:"Mixed berries",emoji:"🫐",baseWeight:80,baseKcal:40,baseProt:1,baseCarb:10,baseFat:0,qty:80},{id:3,name:"Granola",emoji:"🌾",baseWeight:30,baseKcal:130,baseProt:3,baseCarb:20,baseFat:5,qty:30}],
};
function detectVoice(msg){const m=msg.toLowerCase();if(m.includes("oat")||m.includes("banana"))return VOICE_MAP.oat;if(m.includes("chicken")||m.includes("rice"))return VOICE_MAP.chicken;if(m.includes("shake")||m.includes("protein"))return VOICE_MAP.shake;if(m.includes("egg")||m.includes("toast"))return VOICE_MAP.egg;if(m.includes("yogurt")||m.includes("berry"))return VOICE_MAP.yogurt;return null;}

const FOOD_DB_INIT=[
  {id:"db1",name:"Chicken breast, grilled",emoji:"🍗",per:"100g",baseWeight:100,baseKcal:165,baseProt:31,baseCarb:0,baseFat:4},
  {id:"db2",name:"Brown rice, cooked",emoji:"🍚",per:"100g",baseWeight:100,baseKcal:130,baseProt:3,baseCarb:28,baseFat:1},
  {id:"db3",name:"Whole egg",emoji:"🥚",per:"1 large",baseWeight:60,baseKcal:72,baseProt:6,baseCarb:0,baseFat:5},
  {id:"db4",name:"Greek yogurt, plain",emoji:"🫙",per:"100g",baseWeight:100,baseKcal:97,baseProt:9,baseCarb:4,baseFat:5},
  {id:"db5",name:"Banana",emoji:"🍌",per:"1 medium",baseWeight:120,baseKcal:107,baseProt:1,baseCarb:27,baseFat:0},
  {id:"db6",name:"Oats, rolled",emoji:"🌾",per:"100g",baseWeight:100,baseKcal:389,baseProt:17,baseCarb:66,baseFat:7},
  {id:"db7",name:"Sourdough bread",emoji:"🍞",per:"1 slice",baseWeight:35,baseKcal:90,baseProt:4,baseCarb:17,baseFat:1},
  {id:"db8",name:"Avocado",emoji:"🥑",per:"½ fruit",baseWeight:75,baseKcal:120,baseProt:1,baseCarb:6,baseFat:11},
  {id:"db9",name:"Whey protein",emoji:"🥤",per:"1 scoop",baseWeight:35,baseKcal:120,baseProt:24,baseCarb:3,baseFat:2},
  {id:"db10",name:"Olive oil",emoji:"🫒",per:"1 tbsp",baseWeight:14,baseKcal:119,baseProt:0,baseCarb:0,baseFat:14},
  {id:"db11",name:"Almonds",emoji:"🥜",per:"30g",baseWeight:30,baseKcal:173,baseProt:6,baseCarb:6,baseFat:15},
  {id:"db12",name:"Sweet potato",emoji:"🍠",per:"100g",baseWeight:100,baseKcal:86,baseProt:2,baseCarb:20,baseFat:0},
];

const INIT_MEALS=[
  {uid:"m1",mealType:"breakfast",name:"Overnight oats & banana",emoji:"🥣",time:"08:15",
   ingredients:[{id:1,name:"Rolled oats",emoji:"🥣",baseWeight:60,baseKcal:234,baseProt:8,baseCarb:40,baseFat:5,qty:60},{id:2,name:"Banana",emoji:"🍌",baseWeight:120,baseKcal:107,baseProt:1,baseCarb:27,baseFat:0,qty:120}]},
  {uid:"m2",mealType:"lunch",name:"Chicken rice bowl",emoji:"🍗",time:"12:40",
   ingredients:[{id:1,name:"Chicken breast",emoji:"🍗",baseWeight:150,baseKcal:248,baseProt:46,baseCarb:0,baseFat:5,qty:150},{id:2,name:"White rice",emoji:"🍚",baseWeight:180,baseKcal:234,baseProt:4,baseCarb:52,baseFat:0,qty:180}]},
  {uid:"m3",mealType:"snack",name:"Recovery shake",emoji:"🥤",time:"15:30",
   ingredients:[{id:1,name:"Whey protein",emoji:"🥤",baseWeight:35,baseKcal:130,baseProt:24,baseCarb:4,baseFat:2,qty:35},{id:2,name:"Oat milk",emoji:"🥛",baseWeight:250,baseKcal:110,baseProt:3,baseCarb:18,baseFat:2,qty:250}]},
  {uid:"m4",mealType:"dinner",name:"Eggs & sourdough",emoji:"🥚",time:"18:00",
   ingredients:[{id:1,name:"Eggs (×2)",emoji:"🥚",baseWeight:120,baseKcal:143,baseProt:12,baseCarb:1,baseFat:10,qty:120},{id:2,name:"Sourdough",emoji:"🍞",baseWeight:70,baseKcal:170,baseProt:6,baseCarb:32,baseFat:1,qty:70}]},
];

// ─────────────────────────────────────────────────────────────
// LOG MODALS
// ─────────────────────────────────────────────────────────────
function VoiceLogModal({onClose,onLogged}){
  const[phase,setPhase]=useState("chat");
  const[messages,setMessages]=useState([{role:"apex",text:"What did you eat? I'll identify the ingredients and show you a breakdown to review."}]);
  const[ingredients,setIngredients]=useState([]);
  const[mealType,setMealType]=useState("lunch");
  const[mealName,setMealName]=useState("");
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,phase]);
  const handleSend=(text)=>{
    setMessages(p=>[...p,{role:"user",text}]);
    setTimeout(()=>{
      const ings=detectVoice(text);
      if(ings){setMessages(p=>[...p,{role:"apex",text:"Got it — here are the ingredients I identified. Review and adjust before logging."}]);setIngredients(ings.map(i=>({...i})));setTimeout(()=>setPhase("mealtype"),400);}
      else setMessages(p=>[...p,{role:"apex",text:"Try: 'oats with banana', 'chicken rice bowl', 'protein shake', 'eggs on toast', 'greek yogurt'."}]);
    },750);
  };
  const adjust=(id,d)=>setIngredients(p=>p.map(i=>i.id===id?{...i,qty:Math.max(5,i.qty+d)}:i));
  const totalKcal=Math.round(ingredients.reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0));
  return(
    <div className="modal fade-up">
      <div className="modal-header">
        <button className="modal-back" onClick={phase!=="chat"?()=>setPhase(phase==="review"?"mealtype":"chat"):onClose}><Icon name="back" size={18} color={T.text2}/></button>
        <div><div className="modal-title">{phase==="chat"?"Voice Log":phase==="mealtype"?"When did you eat?":"Review & Edit"}</div><div className="modal-sub">{phase==="chat"?"Describe your meal":phase==="mealtype"?"Select a meal type":"Adjust portions if needed"}</div></div>
      </div>
      {phase==="chat"&&<><div className="messages">{messages.map((m,i)=><div key={i} className={`msg ${m.role} fade-up`}><div className="msg-who">{m.role==="apex"?"APEX":"You"}</div><div className="bubble">{m.text}</div></div>)}<div ref={bottomRef}/></div><VoiceInputBar placeholder="Describe what you ate…" onSend={handleSend}/></>}
      {phase==="mealtype"&&<div className="screen" style={{paddingBottom:90}}><div style={{padding:"20px 22px 0"}}><div style={{fontSize:13,color:T.text2,marginBottom:16}}>When did you eat this?</div><MealTypePicker value={mealType} onChange={setMealType}/><div style={{marginTop:20}}><button className="btn-primary" onClick={()=>setPhase("review")}><Icon name="check" size={18} color="#071a18"/>Continue to review</button></div></div></div>}
      {phase==="review"&&<><div className="screen" style={{paddingBottom:90}}><div style={{padding:"16px 22px 0"}}>
        {/* Meal name input */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:T.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Meal name</div>
          <input value={mealName} onChange={e=>setMealName(e.target.value)} placeholder="e.g. Overnight oats & banana" style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 16px",color:T.text,fontSize:14,outline:"none"}}/>
        </div>
        <MacroSummary ingredients={ingredients}/>
        <div style={{fontSize:11,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Ingredients</div>
        {ingredients.map(ing=><IngredientCard key={ing.id} ing={ing} onAdjust={d=>adjust(ing.id,d)}/>)}
      </div></div><div className="log-confirm-bar"><button className="btn-secondary" onClick={()=>setPhase("mealtype")}>Back</button><button className="btn-primary" onClick={()=>onLogged({ingredients,mealType,mealName:mealName||"Voice meal"})}><Icon name="check" size={18} color="#071a18" sw={2.5}/>Log {totalKcal} cal</button></div></>}
    </div>
  );
}

const MEAL_IMG="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80";
function PhotoLogModal({onClose,onLogged}){
  const[phase,setPhase]=useState("camera");
  const[ingredients,setIngredients]=useState(PHOTO_ING.map(i=>({...i})));
  const[mealType,setMealType]=useState("lunch");
  const[mealName,setMealName]=useState("Mixed grain bowl");
  const adjust=(id,d)=>setIngredients(p=>p.map(i=>i.id===id?{...i,qty:Math.max(5,i.qty+d)}:i));
  const totalKcal=Math.round(ingredients.reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0));
  return(
    <div className="modal fade-up">
      {phase==="camera"&&<><div className="modal-header"><button className="modal-back" onClick={onClose}><Icon name="back" size={18} color={T.text2}/></button><div><div className="modal-title">Photo Log</div><div className="modal-sub">Point at your meal</div></div></div><div className="camera-view"><div style={{fontSize:12,color:T.text2}}>Position your meal in the frame</div><div className="camera-frame"><img src={MEAL_IMG} alt="meal"/>{[{top:12,left:12,bw:"3px 0 0 3px"},{top:12,right:12,bw:"3px 3px 0 0"},{bottom:12,left:12,bw:"0 0 3px 3px"},{bottom:12,right:12,bw:"0 3px 3px 0"}].map((s,i)=><div key={i} className="camera-corner" style={{top:s.top,left:s.left,bottom:s.bottom,right:s.right,borderWidth:s.bw}}/>)}<div style={{position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.teal},transparent)`,top:"45%",opacity:0.6,animation:"scanline 2s ease-in-out infinite"}}/></div><div style={{fontSize:13,color:T.text2,textAlign:"center",lineHeight:1.5}}>Ensure the meal is well lit and centred.</div><button className="btn-primary" style={{paddingLeft:32,paddingRight:32,flex:"none"}} onClick={()=>{setPhase("analyzing");setTimeout(()=>setPhase("mealtype"),2800);}}><Icon name="camera" size={17} color="#071a18"/>Capture & Analyze</button></div></>}
      {phase==="analyzing"&&<><div className="modal-header"><button className="modal-back" onClick={()=>setPhase("camera")}><Icon name="back" size={18} color={T.text2}/></button><div><div className="modal-title">Analyzing</div></div></div><div className="analyzing-wrap"><div style={{width:72,height:72,borderRadius:20,overflow:"hidden",border:`1px solid ${T.border}`}}><img src={MEAL_IMG} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div><div className="analyze-ring"/><div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:T.text}} className="dots-anim">Identifying ingredients</div></div>{["Detecting food items…","Estimating portions…","Calculating macros…"].map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 14px",width:"100%"}}><div style={{width:7,height:7,borderRadius:"50%",background:T.teal,flexShrink:0}}/><div style={{fontSize:13,color:T.text2}}>{s}</div></div>)}</div></>}
      {phase==="mealtype"&&<><div className="modal-header"><button className="modal-back" onClick={()=>setPhase("camera")}><Icon name="back" size={18} color={T.text2}/></button><div><div className="modal-title">When did you eat this?</div></div></div><div className="screen" style={{paddingBottom:90}}><div style={{padding:"20px 22px 0"}}><MealTypePicker value={mealType} onChange={setMealType}/><div style={{marginTop:20}}><button className="btn-primary" onClick={()=>setPhase("review")}><Icon name="check" size={18} color="#071a18"/>Continue to review</button></div></div></div></>}
      {phase==="review"&&<><div className="modal-header"><button className="modal-back" onClick={()=>setPhase("mealtype")}><Icon name="back" size={18} color={T.text2}/></button><div><div className="modal-title">Review & Edit</div><div className="modal-sub">Adjust portions if needed</div></div></div>
        <div className="screen" style={{paddingBottom:90}}><div style={{padding:"16px 22px 0"}}>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Meal name</div>
            <input value={mealName} onChange={e=>setMealName(e.target.value)} placeholder="e.g. Mixed grain bowl" style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 16px",color:T.text,fontSize:14,outline:"none"}}/>
          </div>
          <MacroSummary ingredients={ingredients} mealImg={MEAL_IMG}/>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",padding:"10px 14px",background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.14)",borderRadius:12,marginBottom:18}}><Icon name="info" size={15} color={T.orange}/><div style={{fontSize:12,color:T.orange,lineHeight:1.5}}>AI estimates — review portions carefully.</div></div>
          <div style={{fontSize:11,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Ingredients</div>
          {ingredients.map(ing=><IngredientCard key={ing.id} ing={ing} onAdjust={d=>adjust(ing.id,d)}/>)}
        </div></div>
        <div className="log-confirm-bar"><button className="btn-secondary" onClick={()=>setPhase("mealtype")}>Back</button><button className="btn-primary" onClick={()=>onLogged({ingredients,mealType,mealName})}><Icon name="check" size={18} color="#071a18" sw={2.5}/>Log {totalKcal} cal</button></div>
      </>}
    </div>
  );
}

const AI_REPLY=(msg)=>{const m=msg.toLowerCase();if(m.includes("pasta"))return{food:{id:"ai_"+Date.now(),name:"Pasta, cooked",emoji:"🍝",per:"100g",baseWeight:100,baseKcal:158,baseProt:6,baseCarb:31,baseFat:1},text:"Cooked pasta/100g: 158 cal · 6g P · 31g C · 1g F\n\nAdd to database?"};if(m.includes("salmon"))return{food:{id:"ai_"+Date.now(),name:"Salmon fillet",emoji:"🐟",per:"100g",baseWeight:100,baseKcal:208,baseProt:20,baseCarb:0,baseFat:13},text:"Grilled salmon/100g: 208 cal · 20g P · 0g C · 13g F\n\nAdd?"};if(m.includes("lentil"))return{food:{id:"ai_"+Date.now(),name:"Lentils, cooked",emoji:"🫘",per:"100g",baseWeight:100,baseKcal:116,baseProt:9,baseCarb:20,baseFat:0},text:"Cooked lentils/100g: 116 cal · 9g P · 20g C · 0g F\n\nAdd?"};return{food:null,text:`Couldn't find "${msg}". Try "pasta", "salmon", "lentils".`};};
function AIFoodCreator({onAdd,onBack,db}){
  const[msgs,setMsgs]=useState([{role:"apex",text:"Describe a food to add to your database."}]);
  const[pending,setPending]=useState(null);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const handleSend=(text)=>{
    if(pending&&(text.toLowerCase().includes("yes")||text.toLowerCase().includes("add"))){setMsgs(p=>[...p,{role:"user",text},{role:"apex",text:`✓ "${pending.name}" added.`}]);onAdd(pending);setPending(null);return;}
    setMsgs(p=>[...p,{role:"user",text}]);
    setTimeout(()=>{const r=AI_REPLY(text);setPending(r.food);setMsgs(p=>[...p,{role:"apex",text:r.text}]);},700);
  };
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 22px 12px",borderBottom:`1px solid ${T.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontSize:14,fontWeight:700,color:T.text}}>AI Food Lookup</div><div style={{fontSize:11,color:T.text2,marginTop:1}}>{db.length} items</div></div>
        <button onClick={onBack} style={{fontSize:12,fontWeight:600,color:T.teal,display:"flex",alignItems:"center",gap:5}}><Icon name="back" size={13} color={T.teal}/>Back</button>
      </div>
      <div className="messages">{msgs.map((m,i)=><div key={i} className={`msg ${m.role} fade-up`}><div className="msg-who">{m.role==="apex"?"APEX":"You"}</div><div className="bubble" style={{whiteSpace:"pre-line"}}>{m.text}</div></div>)}{pending&&<div style={{background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:18,padding:"14px 16px"}} className="fade-up"><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{fontSize:26}}>{pending.emoji}</div><div><div style={{fontSize:15,fontWeight:700,color:T.text}}>{pending.name}</div><div style={{fontSize:12,color:T.text2}}>Per {pending.per}</div></div></div><div style={{display:"flex",gap:7}}>{[{v:pending.baseKcal,l:"cal",c:T.text},{v:`${pending.baseProt}g`,l:"Prot",c:T.teal},{v:`${pending.baseCarb}g`,l:"Carb",c:T.blue},{v:`${pending.baseFat}g`,l:"Fat",c:T.orange}].map(x=><div key={x.l} style={{flex:1,background:"rgba(45,212,191,0.08)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:x.c}}>{x.v}</div><div style={{fontSize:9,color:T.text3,marginTop:2}}>{x.l}</div></div>)}</div></div>}<div ref={ref}/></div>
      <VoiceInputBar placeholder="Describe a food…" onSend={handleSend}/>
    </div>
  );
}

function ManualLogModal({onClose,onLogged}){
  const[query,setQuery]=useState(""); const[added,setAdded]=useState([]); const[step,setStep]=useState("search"); const[db,setDb]=useState(FOOD_DB_INIT); const[detail,setDetail]=useState(null); const[mealType,setMealType]=useState("lunch"); const[mealName,setMealName]=useState("");
  const filtered=db.filter(f=>!query||f.name.toLowerCase().includes(query.toLowerCase()));
  const totalKcal=Math.round(added.reduce((a,f)=>a+(f.baseKcal*(f.qty/f.baseWeight)),0));
  const removeItem=uid=>setAdded(p=>p.filter(f=>f.uid!==uid));
  const adjustItem=(uid,d)=>setAdded(p=>p.map(f=>f.uid===uid?{...f,qty:Math.max(5,f.qty+d)}:f));
  const addToDb=food=>setDb(p=>[food,...p]);
  return(
    <div className="modal fade-up">
      <div className="modal-header">
        <button className="modal-back" onClick={step==="mealtype"||step==="review"||step==="ai"?()=>setStep(step==="review"?"mealtype":step==="mealtype"?"search":"search"):onClose}><Icon name="back" size={18} color={T.text2}/></button>
        <div style={{flex:1}}>
          <div className="modal-title">{step==="search"?"Add Ingredients":step==="ai"?"AI Lookup":step==="mealtype"?"When are you eating?":"Review Meal"}</div>
          <div className="modal-sub">{step==="search"?"Tap an item to set portion":step==="ai"?"Describe any food":step==="mealtype"?"Select meal type":`${added.length} items · ${totalKcal} cal`}</div>
        </div>
        {step==="search"&&added.length>0&&<button onClick={()=>setStep("mealtype")} style={{background:T.teal,borderRadius:12,padding:"8px 14px",fontSize:12,fontWeight:700,color:"#071a18",flexShrink:0}}>Next ({added.length})</button>}
      </div>
      {step==="search"&&<>
        <div style={{padding:"14px 22px 0",flexShrink:0}}>
          <div style={{display:"flex",gap:8,marginBottom:added.length>0?12:0}}>
            <div className="search-wrap" style={{flex:1}}><div className="search-icon"><Icon name="search" size={18} color={T.text3}/></div><input className="search-input" placeholder="Search food database…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
            <button onClick={()=>setStep("ai")} style={{width:46,height:46,background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={18} color={T.teal}/></button>
          </div>
          {added.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>{added.map(f=><div key={f.uid} style={{display:"flex",alignItems:"center",gap:5,background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:10,padding:"4px 8px 4px 10px"}}><div style={{fontSize:12,fontWeight:600,color:T.teal}}>{f.name.split(",")[0]}</div><button onClick={()=>removeItem(f.uid)} style={{width:16,height:16,borderRadius:"50%",background:"rgba(45,212,191,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="close" size={9} color={T.teal} sw={2.5}/></button></div>)}</div>}
        </div>
        <div className="screen" style={{padding:"8px 22px 24px"}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"28px 0"}}><div style={{fontSize:13,color:T.text3,marginBottom:12}}>No results for "{query}"</div><button onClick={()=>setStep("ai")} style={{display:"inline-flex",alignItems:"center",gap:7,background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:12,padding:"9px 16px",fontSize:13,fontWeight:600,color:T.teal}}><Icon name="bolt" size={15} color={T.teal}/>Ask AI</button></div>}
          {filtered.map(f=><FoodListCard key={f.id} food={f} onTap={()=>setDetail(f)}/>)}
        </div>
      </>}
      {step==="ai"&&<AIFoodCreator db={db} onBack={()=>setStep("search")} onAdd={food=>{addToDb(food);setStep("search");}}/>}
      {step==="mealtype"&&<div className="screen" style={{paddingBottom:90}}><div style={{padding:"20px 22px 0"}}><div style={{fontSize:13,color:T.text2,marginBottom:16}}>When are you eating this?</div><MealTypePicker value={mealType} onChange={setMealType}/><div style={{marginTop:20}}><button className="btn-primary" onClick={()=>setStep("review")}><Icon name="check" size={18} color="#071a18"/>Continue to review</button></div></div></div>}
      {step==="review"&&<><div className="screen" style={{paddingBottom:90}}><div style={{padding:"16px 22px 0"}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:T.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Meal name</div>
          <input value={mealName} onChange={e=>setMealName(e.target.value)} placeholder="e.g. Post-ride lunch" style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"12px 16px",color:T.text,fontSize:14,outline:"none"}}/>
        </div>
        <MacroSummary ingredients={added}/>
        <div style={{fontSize:11,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:10}}>Items added</div>
        {added.map(ing=><IngredientCard key={ing.uid} ing={ing} onAdjust={d=>adjustItem(ing.uid,d)}/>)}
        <button onClick={()=>setStep("search")} style={{display:"flex",alignItems:"center",gap:8,color:T.teal,fontSize:14,fontWeight:600,marginTop:6}}><Icon name="plus" size={18} color={T.teal}/>Add more</button>
      </div></div><div className="log-confirm-bar"><button className="btn-secondary" onClick={()=>setStep("mealtype")}>Back</button><button className="btn-primary" onClick={()=>onLogged({ingredients:added,mealType,mealName:mealName||"Manual meal"})}><Icon name="check" size={18} color="#071a18" sw={2.5}/>Log {totalKcal} cal</button></div></>}
      {detail&&<FoodDetailSheet food={detail} onClose={()=>setDetail(null)} onAdd={item=>{setAdded(p=>[...p,item]);setDetail(null);}}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREENS
// ─────────────────────────────────────────────────────────────
const weeklyData=[{d:"M",kcal:2100,burn:2400},{d:"T",kcal:1950,burn:2100},{d:"W",kcal:2400,burn:3200},{d:"T",kcal:2050,burn:2200},{d:"F",kcal:2300,burn:2900},{d:"S",kcal:1800,burn:2000},{d:"S",kcal:1640,burn:1800}];
const macroData=[{name:"Protein",val:128,target:160,color:T.teal},{name:"Carbs",val:210,target:280,color:T.blue},{name:"Fat",val:54,target:70,color:T.orange}];
const IMGS={ride1:"https://images.unsplash.com/photo-1517649763962-0c623066013b?w=700&q=80",ride2:"https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=700&q=80",run:"https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=700&q=80"};
const activities=[{name:"Friday Endurance Ride",icon:"bike",img:IMGS.ride1,pills:[{label:"78.3 km",accent:true},{label:"2:54 h"},{label:"187 TSS"},{label:"241 W"}]},{name:"Wednesday Run",icon:"run",img:IMGS.run,pills:[{label:"12.4 km",accent:true},{label:"1:02 h"},{label:"98 TSS"},{label:"4:58 /km"}]}];
const Pad=({children,style={}})=><div style={{padding:"0 22px",...style}}>{children}</div>;
const Gap=({h=16})=><div style={{height:h}}/>;
function TrainingCard({image,sourceIcon,name,pills,height=190}){return(<div style={{position:"relative",borderRadius:22,overflow:"hidden",height}}><img src={image} alt={name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/><div style={{position:"absolute",inset:0,background:"linear-gradient(170deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.78) 100%)"}}/><div style={{position:"absolute",bottom:0,left:0,right:0,padding:"16px 18px"}}><div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.10)",backdropFilter:"blur(10px)",borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:"0.08em",marginBottom:8}}><Icon name={sourceIcon} size={11} color="#fff"/> STRAVA</div><div style={{fontSize:17,fontWeight:700,color:"#fff",marginBottom:10}}>{name}</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{pills.map((p,i)=><div key={i} style={{background:p.accent?"rgba(45,212,191,0.25)":"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:600,color:p.accent?T.teal:"#fff"}}>{p.label}</div>)}</div></div></div>);}

// ─────────────────────────────────────────────────────────────
// SETTINGS PANEL
// ─────────────────────────────────────────────────────────────
function maskKey(key){
  if(!key||key.length<6) return key;
  return key.slice(0,2)+"•".repeat(Math.max(4,key.length-6))+key.slice(-4);
}

function ApiKeyRow({label, icon, value, onChange, placeholder}){
  const[editing,setEditing]=useState(false);
  const[draft,setDraft]=useState(value);
  const[show,setShow]=useState(false);
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,color:T.text2,fontWeight:600,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
        <Icon name={icon} size={13} color={T.text2}/>{label}
      </div>
      {editing?(
        <div style={{display:"flex",gap:8}}>
          <input
            autoFocus
            type={show?"text":"password"}
            value={draft}
            onChange={e=>setDraft(e.target.value)}
            placeholder={placeholder}
            style={{flex:1,background:T.card2,border:`1px solid ${T.tealBorder}`,borderRadius:12,padding:"10px 14px",color:T.text,fontSize:13,outline:"none"}}
          />
          <button onClick={()=>setShow(s=>!s)} style={{width:38,height:38,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={show?"eye-off":"eye"} size={16} color={T.text2}/></button>
          <button onClick={()=>{onChange(draft);setEditing(false);}} style={{width:38,height:38,background:T.teal,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="check" size={16} color="#071a18" sw={2.5}/></button>
        </div>
      ):(
        <div style={{display:"flex",alignItems:"center",gap:8,background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 14px"}}>
          <div style={{flex:1,fontSize:13,color:value?T.text:T.text3,fontFamily:"monospace",letterSpacing:value?"0.04em":"0"}}>
            {value?maskKey(value):placeholder}
          </div>
          <button onClick={()=>{setDraft(value);setEditing(true);}} style={{color:T.teal,fontSize:12,fontWeight:600}}>
            {value?"Edit":"Add"}
          </button>
        </div>
      )}
    </div>
  );
}

function IntegrationRow({label, connected, color, description}){
  const[on,setOn]=useState(connected);
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:`1px solid ${T.border}`}}>
      <div style={{width:40,height:40,borderRadius:12,background:on?`${color}22`:"rgba(255,255,255,0.04)",border:`1px solid ${on?color+"44":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name="link2" size={18} color={on?color:T.text3}/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:on?T.text:T.text2}}>{label}</div>
        <div style={{fontSize:11,color:T.text3,marginTop:1}}>{description}</div>
      </div>
      <button onClick={()=>setOn(v=>!v)} style={{padding:"6px 14px",borderRadius:10,background:on?T.tealDim:"rgba(255,255,255,0.04)",border:`1px solid ${on?T.tealBorder:T.border}`,fontSize:12,fontWeight:600,color:on?T.teal:T.text3,transition:"all 0.15s"}}>
        {on?"Connected":"Connect"}
      </button>
    </div>
  );
}

function SettingsPanel({onClose}){
  const[section,setSection]=useState("profile"); // profile | apikeys | integrations
  const[keys,setKeys]=useState({anthropic:"",strava:"",gcal:"",apple:""});
  const setKey=(k,v)=>setKeys(p=>({...p,[k]:v}));

  const tabs=[{id:"profile",label:"Profile",icon:"user"},{id:"apikeys",label:"API Keys",icon:"key"},{id:"integrations",label:"Integrations",icon:"link2"}];

  return(
    <div className="modal fade-up">
      <div className="modal-header">
        <button className="modal-back" onClick={onClose}><Icon name="close" size={18} color={T.text2}/></button>
        <div style={{flex:1}}><div className="modal-title">Settings</div><div className="modal-sub">Profile · API keys · Integrations</div></div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:4,padding:"14px 22px 0",flexShrink:0}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setSection(t.id)} style={{flex:1,padding:"9px 6px",borderRadius:12,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",background:section===t.id?T.teal:"transparent",color:section===t.id?"#071a18":T.text3,border:`1px solid ${section===t.id?T.teal:T.border}`,transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <Icon name={t.icon} size={13} color={section===t.id?"#071a18":T.text3}/>
            {t.label}
          </button>
        ))}
      </div>

      <div className="screen" style={{paddingBottom:40,marginTop:4}}>
        <div style={{padding:"20px 22px 0"}}>

          {/* PROFILE */}
          {section==="profile"&&<>
            {/* Avatar */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:28,paddingTop:8}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"12px 0 20px"}}>
                {/* Icon + name stacked */}
                <ApexIcon size={72} variant="dark"/>
                <div style={{textAlign:"center"}}>
                  <ApexTitle size={24} variant="dark"/>
                  <div style={{fontSize:12,color:T.text2,marginTop:4,letterSpacing:"0.04em"}}>Sergio · Endurance athlete</div>
                </div>
              </div>
            </div>
            {[{label:"Full name",val:"Sergio"},{label:"Email",val:"sergio@example.com"},{label:"Sport",val:"Cycling & Running"},{label:"Weight",val:"72 kg"},{label:"Height",val:"178 cm"},{label:"Date of birth",val:"1988-04-12"},{label:"FTP (cycling)",val:"285 W"},{label:"LTHR (running)",val:"162 bpm"}].map(f=>(
              <div key={f.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:13,color:T.text2}}>{f.label}</div>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{f.val}</div>
              </div>
            ))}
            <div style={{height:20}}/>
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
              <Icon name="bolt" size={16} color={T.teal}/>
              <div style={{fontSize:13,color:T.text2,flex:1}}>APEX personalises targets based on your profile and training data.</div>
            </div>
          </>}

          {/* API KEYS */}
          {section==="apikeys"&&<>
            <div style={{fontSize:13,color:T.text2,marginBottom:20,lineHeight:1.55}}>
              Paste your API keys below. They are stored locally and never shared. Keys are shown masked for security.
            </div>
            <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>AI Model</div>
            <ApiKeyRow label="Anthropic API Key" icon="bolt" value={keys.anthropic} onChange={v=>setKey("anthropic",v)} placeholder="sk-ant-api03-…"/>
            <div style={{height:20}}/>
            <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Integrations</div>
            <ApiKeyRow label="Strava API Token" icon="bike" value={keys.strava} onChange={v=>setKey("strava",v)} placeholder="Your Strava access token"/>
            <ApiKeyRow label="Google Calendar API Key" icon="calendar" value={keys.gcal} onChange={v=>setKey("gcal",v)} placeholder="AIza…"/>
            <ApiKeyRow label="Apple Health (HealthKit)" icon="heart" value={keys.apple} onChange={v=>setKey("apple",v)} placeholder="Requires iOS app setup"/>
            <div style={{marginTop:20,padding:"14px 16px",background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:14}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><Icon name="info" size={15} color={T.red}/><div style={{fontSize:12,color:T.red,lineHeight:1.5}}>Never share your API keys. APEX stores them locally on your device only.</div></div>
            </div>
          </>}

          {/* INTEGRATIONS */}
          {section==="integrations"&&<>
            <div style={{fontSize:13,color:T.text2,marginBottom:4,lineHeight:1.55}}>Connect your accounts to unlock APEX's full potential.</div>
            <IntegrationRow label="Strava" connected={true}  color="#FC4C02" description="Training data, TSS, power & heart rate"/>
            <IntegrationRow label="Google Calendar" connected={false} color="#4285F4" description="Training schedule & recovery planning"/>
            <IntegrationRow label="Apple Health (HealthKit)" connected={false} color="#FF3B30" description="Sleep, HRV, steps & body metrics"/>
            <div style={{height:24}}/>
            <div style={{fontSize:12,fontWeight:700,color:T.text2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Coming soon</div>
            {["Garmin Connect","Whoop","Oura Ring","MyFitnessPal import"].map(s=>(
              <div key={s} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,color:T.text3}}>{s}</div>
                <div style={{fontSize:11,color:T.text3,background:T.card2,borderRadius:8,padding:"3px 9px"}}>Planned</div>
              </div>
            ))}
          </>}
        </div>
      </div>
    </div>
  );
}

function TodayScreen({onOpenSettings,isDesktop}){
  const[cv,setCv]=useState("kcal");
  const pad=isDesktop?"0 32px":"0 22px";
  const topPad=isDesktop?"24px 32px":"52px 22px 0";
  return(
    <div className={isDesktop?"desktop-screen fade-up":"screen fade-up"}>
      {/* Top bar — mobile only (desktop has sidebar) */}
      {!isDesktop&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"52px 22px 0",marginBottom:0}}>
          <ApexLockup iconSize={32} titleSize={20} gap={9} variant="dark"/>
          <div style={{display:"flex",gap:9,alignItems:"center"}}>
            <button style={{width:38,height:38,background:T.card,border:`1px solid ${T.border}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="bell" size={17} color={T.text2}/></button>
            <button onClick={onOpenSettings} style={{width:38,height:38,background:T.card,border:`1px solid ${T.border}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="menu" size={17} color={T.text2}/></button>
          </div>
        </div>
        <div style={{padding:"14px 22px 0",marginBottom:22}}>
          <div style={{fontSize:12,color:T.text2,marginBottom:2}}>Saturday, 21 March</div>
          <div style={{fontSize:21,fontWeight:700,color:T.text,letterSpacing:"-0.3px"}}>Good morning, Sergio</div>
        </div>
      </>}

      {/* Desktop greeting */}
      {isDesktop&&<div style={{padding:"28px 32px 20px",borderBottom:`1px solid ${T.border}`,marginBottom:24,flexShrink:0}}>
        <div style={{fontSize:12,color:T.text2,marginBottom:4}}>Saturday, 21 March</div>
        <div style={{fontSize:26,fontWeight:800,color:T.text,letterSpacing:"-0.5px"}}>Good morning, Sergio</div>
      </div>}

      {/* ── Desktop: 2-col grid ── */}
      {isDesktop?(
        <div style={{padding:"0 32px 32px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Left col */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Chips */}
            <div style={{display:"flex",gap:9}}>{[{icon:"moon",val:"7.2",unit:"h",label:"Sleep"},{icon:"heart",val:"68",unit:"%",label:"Recovery",accent:true},{icon:"drop",val:"1.5",unit:"L",label:"Hydration"}].map((c,i)=><div key={i} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:"14px 12px",display:"flex",flexDirection:"column",gap:6}}><Icon name={c.icon} size={18} color={c.accent?T.teal:T.text2}/><div style={{fontSize:17,fontWeight:700,color:c.accent?T.teal:T.text,letterSpacing:"-0.3px",lineHeight:1}}>{c.val}<span style={{fontSize:11,fontWeight:400,color:T.text2,marginLeft:2}}>{c.unit}</span></div><div style={{fontSize:11,color:T.text2}}>{c.label}</div></div>)}</div>
            {/* Cal card */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:20,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-50,right:-50,width:160,height:160,background:"radial-gradient(circle,rgba(45,212,191,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
              <div style={{fontSize:11,color:T.text2,fontWeight:500,marginBottom:6}}>Calories today</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,marginBottom:14}}><span style={{fontSize:48,fontWeight:800,lineHeight:1,letterSpacing:"-3px",color:T.text}}>1,640</span><span style={{fontSize:14,color:T.text2,paddingBottom:7}}>cal</span></div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>{[{v:"2,280",l:"Target"},{v:"640",l:"Remaining",c:T.teal},{v:"2,850",l:"Burned",c:T.orange}].map(x=><div key={x.l} style={{flex:1,background:T.card2,borderRadius:12,padding:"9px 10px"}}><div style={{fontSize:14,fontWeight:700,color:x.c||T.text}}>{x.v}</div><div style={{fontSize:10,color:T.text3,marginTop:2}}>{x.l}</div></div>)}</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>{macroData.map(m=><div key={m.name} style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:12,color:T.text2,width:50,flexShrink:0}}>{m.name}</div><div style={{flex:1,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${Math.min((m.val/m.target)*100,100)}%`,height:"100%",background:m.color,borderRadius:2}}/></div><div style={{fontSize:12,color:T.text2,width:38,textAlign:"right",fontWeight:500}}>{m.val}g</div></div>)}</div>
            </div>
            {/* Insight */}
            <div style={{background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:20,padding:16,display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:36,height:36,background:"rgba(45,212,191,0.15)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={18} color={T.teal}/></div>
              <div><div style={{fontSize:10,fontWeight:700,color:T.teal,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>Coach insight</div><div style={{fontSize:13,color:T.text2,lineHeight:1.55}}>Protein below target <strong style={{color:T.text}}>3 days in a row</strong>. Prioritise 160g before Thursday's ride.</div></div>
            </div>
          </div>
          {/* Right col */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Chart */}
            <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>Weekly calories</div><div style={{display:"flex",gap:3,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:3}}>{["kcal","burn"].map(v=><button key={v} onClick={()=>setCv(v)} style={{padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:600,background:cv===v?T.teal:"transparent",color:cv===v?"#071a18":T.text3,transition:"all 0.15s",textTransform:"uppercase",letterSpacing:"0.04em"}}>{v}</button>)}</div></div>
              <ResponsiveContainer width="100%" height={110}><AreaChart data={weeklyData} margin={{top:4,right:0,bottom:0,left:-36}}><defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.2}/><stop offset="100%" stopColor="#2DD4BF" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="d" tick={{fill:"#3d4050",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#18191f",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,fontSize:12,color:"#fff"}} cursor={{stroke:"rgba(45,212,191,0.25)",strokeWidth:1}} formatter={v=>[`${v} cal`,""]}/>  <Area type="monotone" dataKey={cv==="kcal"?"kcal":"burn"} stroke="#2DD4BF" strokeWidth={2} fill="url(#tg)" dot={false} activeDot={{r:4,fill:"#2DD4BF",strokeWidth:0}}/></AreaChart></ResponsiveContainer>
            </div>
            {/* Last activity */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>Last activity</div><div style={{fontSize:13,color:T.teal,fontWeight:500,display:"flex",alignItems:"center",gap:4}}>See all <Icon name="arrow-r" size={13} color={T.teal}/></div></div>
              <TrainingCard image={IMGS.ride1} sourceIcon="bike" name="Friday Endurance Ride" pills={[{label:"78.3 km",accent:true},{label:"2:54 h"},{label:"187 TSS"},{label:"241 W"}]}/>
            </div>
            {/* Second activity */}
            <TrainingCard image={IMGS.run} sourceIcon="run" name="Wednesday Run" height={150} pills={[{label:"12.4 km",accent:true},{label:"1:02 h"},{label:"98 TSS"}]}/>
          </div>
        </div>
      ):(
        /* ── Mobile: single column ── */
        <>
          <Pad style={{marginBottom:20}}><div style={{display:"flex",gap:9}}>{[{icon:"moon",val:"7.2",unit:"h",label:"Sleep"},{icon:"heart",val:"68",unit:"%",label:"Recovery",accent:true},{icon:"drop",val:"1.5",unit:"L",label:"Hydration"}].map((c,i)=><div key={i} style={{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:18,padding:"14px 12px",display:"flex",flexDirection:"column",gap:6}}><Icon name={c.icon} size={18} color={c.accent?T.teal:T.text2}/><div style={{fontSize:17,fontWeight:700,color:c.accent?T.teal:T.text,letterSpacing:"-0.3px",lineHeight:1}}>{c.val}<span style={{fontSize:11,fontWeight:400,color:T.text2,marginLeft:2}}>{c.unit}</span></div><div style={{fontSize:11,color:T.text2}}>{c.label}</div></div>)}</div></Pad>
          <Pad style={{marginBottom:20}}><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:20,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-50,right:-50,width:160,height:160,background:"radial-gradient(circle,rgba(45,212,191,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/><div style={{fontSize:11,color:T.text2,fontWeight:500,marginBottom:6}}>Calories today</div><div style={{display:"flex",alignItems:"flex-end",gap:6,marginBottom:16}}><span style={{fontSize:52,fontWeight:800,lineHeight:1,letterSpacing:"-3px",color:T.text}}>1,640</span><span style={{fontSize:14,color:T.text2,paddingBottom:8}}>cal</span></div><div style={{display:"flex",gap:8,marginBottom:18}}>{[{v:"2,280",l:"Target"},{v:"640",l:"Remaining",c:T.teal},{v:"2,850",l:"Burned",c:T.orange}].map(x=><div key={x.l} style={{flex:1,background:T.card2,borderRadius:12,padding:"10px 12px"}}><div style={{fontSize:15,fontWeight:700,color:x.c||T.text}}>{x.v}</div><div style={{fontSize:10,color:T.text3,marginTop:2}}>{x.l}</div></div>)}</div><div style={{display:"flex",flexDirection:"column",gap:10}}>{macroData.map(m=><div key={m.name} style={{display:"flex",alignItems:"center",gap:10}}><div style={{fontSize:12,color:T.text2,width:50,flexShrink:0}}>{m.name}</div><div style={{flex:1,height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${Math.min((m.val/m.target)*100,100)}%`,height:"100%",background:m.color,borderRadius:2}}/></div><div style={{fontSize:12,color:T.text2,width:38,textAlign:"right",fontWeight:500}}>{m.val}g</div></div>)}</div></div></Pad>
          <Pad style={{marginBottom:20}}><div style={{background:T.tealDim,border:`1px solid ${T.tealBorder}`,borderRadius:20,padding:16,display:"flex",gap:12,alignItems:"flex-start"}}><div style={{width:36,height:36,background:"rgba(45,212,191,0.15)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={18} color={T.teal}/></div><div><div style={{fontSize:10,fontWeight:700,color:T.teal,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>Coach insight</div><div style={{fontSize:13,color:T.text2,lineHeight:1.55}}>Protein below target <strong style={{color:T.text}}>3 days in a row</strong>. Prioritise 160g before Thursday's ride.</div></div></div></Pad>
          <Pad style={{marginBottom:20}}><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>Weekly calories</div><div style={{display:"flex",gap:3,background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:3}}>{["kcal","burn"].map(v=><button key={v} onClick={()=>setCv(v)} style={{padding:"5px 10px",borderRadius:7,fontSize:11,fontWeight:600,background:cv===v?T.teal:"transparent",color:cv===v?"#071a18":T.text3,transition:"all 0.15s",textTransform:"uppercase",letterSpacing:"0.04em"}}>{v}</button>)}</div></div><ResponsiveContainer width="100%" height={90}><AreaChart data={weeklyData} margin={{top:4,right:0,bottom:0,left:-36}}><defs><linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.2}/><stop offset="100%" stopColor="#2DD4BF" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="d" tick={{fill:"#3d4050",fontSize:11}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{background:"#18191f",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,fontSize:12,color:"#fff"}} cursor={{stroke:"rgba(45,212,191,0.25)",strokeWidth:1}} formatter={v=>[`${v} cal`,""]}/>  <Area type="monotone" dataKey={cv==="kcal"?"kcal":"burn"} stroke="#2DD4BF" strokeWidth={2} fill="url(#tg2)" dot={false} activeDot={{r:4,fill:"#2DD4BF",strokeWidth:0}}/></AreaChart></ResponsiveContainer></div></Pad>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 22px",marginBottom:14}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>Last activity</div><div style={{fontSize:13,color:T.teal,fontWeight:500,display:"flex",alignItems:"center",gap:4}}>See all <Icon name="arrow-r" size={13} color={T.teal}/></div></div>
          <Pad style={{marginBottom:24}}><TrainingCard image={IMGS.ride1} sourceIcon="bike" name="Friday Endurance Ride" pills={[{label:"78.3 km",accent:true},{label:"2:54 h"},{label:"187 TSS"},{label:"241 W"}]}/></Pad>
        </>
      )}
    </div>
  );
}

function LogScreen({onVoice,onPhoto,onManual}){
  const[meals,setMeals]=useState(INIT_MEALS);
  const[openCat,setOpenCat]=useState(null); // category id being viewed
  const totalKcal=Math.round(meals.flatMap(m=>m.ingredients).reduce((a,i)=>a+(i.baseKcal*(i.qty/i.baseWeight)),0));

  const getMealsForCat=cat=>meals.filter(m=>m.mealType===cat);
  const saveCatMeals=(cat,updated)=>{
    setMeals(p=>[...p.filter(m=>m.mealType!==cat),...updated]);
    setOpenCat(null);
  };

  if(openCat){
    const cat=MEAL_CATS.find(c=>c.id===openCat);
    return(
      <CategoryDetail
        cat={openCat}
        meals={getMealsForCat(openCat)}
        onBack={()=>setOpenCat(null)}
        onSave={updated=>saveCatMeals(openCat,updated)}
        onAddNew={()=>{setOpenCat(null);/* could open manual with pre-selected meal type */}}
      />
    );
  }

  return(
    <div className="screen fade-up">
      <div style={{padding:"52px 22px 8px"}}>
        <div style={{fontSize:12,color:T.text2,marginBottom:4}}>Saturday, 21 March</div>
        <div style={{fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-0.5px",marginBottom:4}}>Food Log</div>
        <div style={{fontSize:13,color:T.text2}}>{totalKcal} cal logged today</div>
      </div>
      <Gap h={20}/>
      {/* Log buttons */}
      <Pad style={{marginBottom:24}}>
        <div style={{display:"flex",gap:9}}>
          {[{icon:"mic",label:"Voice",primary:true,fn:onVoice},{icon:"camera",label:"Photo",fn:onPhoto},{icon:"plus",label:"Manual",fn:onManual}].map(b=>(
            <button key={b.label} onClick={b.fn} style={{flex:1,background:b.primary?T.teal:T.card,border:`1px solid ${b.primary?T.teal:T.border}`,borderRadius:18,padding:"16px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <Icon name={b.icon} size={22} color={b.primary?"#0a1a18":T.text2}/>
              <span style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",color:b.primary?"#0a1a18":T.text2}}>{b.label}</span>
            </button>
          ))}
        </div>
      </Pad>
      {/* 4 category hero cards */}
      <Pad>
        {MEAL_CATS.map(cat=>(
          <MealCatCard
            key={cat.id}
            cat={cat}
            meals={getMealsForCat(cat.id)}
            onOpen={()=>setOpenCat(cat.id)}
          />
        ))}
      </Pad>
    </div>
  );
}

function TrainScreen(){return(<div className="screen fade-up"><div style={{padding:"52px 22px 24px"}}><div style={{fontSize:12,color:T.text2,marginBottom:4}}>This week</div><div style={{fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-0.5px"}}>Training</div></div><Pad style={{marginBottom:20}}><div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:22,padding:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div><div style={{fontSize:12,color:T.text2,marginBottom:4}}>Weekly load</div><div style={{fontSize:34,fontWeight:800,letterSpacing:"-1px",color:T.text}}>340 <span style={{fontSize:18,fontWeight:400,color:T.text2}}>TSS</span></div></div><div style={{textAlign:"right"}}><div style={{fontSize:12,color:T.text2,marginBottom:4}}>Target</div><div style={{fontSize:22,fontWeight:700,color:T.text2}}>500</div></div></div><div style={{height:5,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden",marginBottom:10}}><div style={{height:"100%",width:"68%",background:`linear-gradient(90deg,${T.teal},rgba(45,212,191,0.4))`,borderRadius:3}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.text3}}><span>3 sessions this week</span><span style={{color:T.teal}}>68% of target</span></div></div></Pad><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 22px",marginBottom:14}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>Activities</div><div style={{fontSize:13,color:T.teal,fontWeight:500}}>Strava sync</div></div><Pad style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>{activities.map((a,i)=><TrainingCard key={i} image={a.img} sourceIcon={a.icon} name={a.name} pills={a.pills}/>)}</Pad></div>);}

const COACH_INIT=[{role:"coach",text:"Morning! Yesterday's 78 km ride was solid — TSS 187. Weekly load at 340, so today should be easy or rest."},{role:"user",text:"Legs feel heavy. Thinking rest day."},{role:"coach",text:"Perfect call. Protein was low yesterday — 98g vs your 160g target. Want a recovery meal plan?"}];
const coachReply=msg=>{const m=msg.toLowerCase();if(m.includes("carb"))return"You have 70g carbs remaining. A banana and rice with dinner will cover it.";if(m.includes("meal")||m.includes("plan"))return"For tomorrow's long ride: oats pre-ride, 60g carbs/hr, high-protein bowl after.";if(m.includes("leg")||m.includes("heavy"))return"With TSS 340 and form at -12, skip intensity. Easy spin or full rest.";return"Got it. Based on today's load and nutrition you're in good shape. Anything else?";};
function CoachScreen(){const[msgs,setMsgs]=useState(COACH_INIT);const ref=useRef(null);useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs]);const send=text=>{setMsgs(p=>[...p,{role:"user",text}]);setTimeout(()=>setMsgs(p=>[...p,{role:"coach",text:coachReply(text)}]),850);};return(<div className="full-screen fade-up"><div style={{padding:"52px 22px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ApexLockup iconSize={32} titleSize={20} gap={9} variant="dark"/><div style={{display:"flex",alignItems:"center",gap:6,background:T.card,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:11,color:T.text2}}><div style={{width:6,height:6,borderRadius:"50%",background:T.teal,boxShadow:`0 0 6px ${T.teal}`}}/>Full context loaded</div></div><div style={{fontSize:13,color:T.text3}}>Nutrition · Training · Calendar · Recovery</div></div><div className="messages">{msgs.map((m,i)=><div key={i} className={`msg ${m.role} fade-up`}><div className="msg-who">{m.role==="coach"?"Apex":"You"}</div><div className="bubble">{m.text}</div></div>)}<div ref={ref}/></div><VoiceInputBar onSend={send}/></div>);}

const NAV=[{id:"today",icon:"home",label:"Today"},{id:"log",icon:"fork",label:"Log"},{id:"train",icon:"bike",label:"Train"},{id:"coach",icon:"chat",label:"Coach"}];

// ─────────────────────────────────────────────────────────────
// SIDEBAR (desktop only)
// ─────────────────────────────────────────────────────────────
function Sidebar({tab, setTab, onOpenSettings}){
  const navItems=[
    {id:"today", icon:"home",  label:"Today"},
    {id:"log",   icon:"fork",  label:"Food Log"},
    {id:"train", icon:"bike",  label:"Training"},
  ];
  return(
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ApexLockup iconSize={36} titleSize={22} gap={10} variant="dark"/>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(n=>(
          <button key={n.id} className={`sidebar-btn${tab===n.id?" active":""}`} onClick={()=>setTab(n.id)}>
            <Icon name={n.icon} size={20} color={tab===n.id?T.teal:T.text3} sw={tab===n.id?2:1.5}/>
            <span className="sidebar-label">{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        {/* User profile button */}
        <button className="sidebar-footer-btn" onClick={onOpenSettings}>
          <div style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${T.teal}`,background:T.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.teal,flexShrink:0}}>S</div>
          <div style={{flex:1,textAlign:"left"}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text2}}>Sergio</div>
            <div style={{fontSize:11,color:T.text3}}>Settings</div>
          </div>
          <Icon name="chevron" size={14} color={T.text3}/>
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// DESKTOP COACH PANEL (persistent right rail)
// ─────────────────────────────────────────────────────────────
function DesktopCoachPanel(){
  const[msgs,setMsgs]=useState(COACH_INIT);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const send=text=>{
    setMsgs(p=>[...p,{role:"user",text}]);
    setTimeout(()=>setMsgs(p=>[...p,{role:"coach",text:coachReply(text)}]),850);
  };
  return(
    <div className="coach-panel">
      {/* Panel header */}
      <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:800,color:T.text,letterSpacing:"-0.2px"}}>APEX Coach</div>
          <div style={{display:"flex",alignItems:"center",gap:5,background:T.card,border:`1px solid ${T.border}`,borderRadius:16,padding:"4px 10px",fontSize:10,color:T.text2}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:T.teal,boxShadow:`0 0 5px ${T.teal}`}}/>
            Live
          </div>
        </div>
        <div style={{fontSize:11,color:T.text3}}>Nutrition · Training · Recovery · Calendar</div>
      </div>
      {/* Messages */}
      <div className="messages" style={{padding:"16px 16px 8px"}}>
        {msgs.map((m,i)=>(
          <div key={i} className={`msg ${m.role} fade-up`}>
            <div className="msg-who">{m.role==="coach"?"Apex":"You"}</div>
            <div className="bubble" style={{maxWidth:"92%",fontSize:13}}>{m.text}</div>
          </div>
        ))}
        <div ref={ref}/>
      </div>
      {/* Input */}
      <VoiceInputBar placeholder="Ask APEX anything…" onSend={send}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BREAKPOINT HOOK
// ─────────────────────────────────────────────────────────────
function useBreakpoint(){
  const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:390);
  useEffect(()=>{
    const h=()=>setW(window.innerWidth);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);
  return{isMobile:w<640, isTablet:w>=640&&w<1024, isDesktop:w>=1024};
}

// ─────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────
export default function App(){
  const[tab,setTab]=useState("today");
  const[modal,setModal]=useState(null);
  const[toast,setToast]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const[splash,setSplash]=useState(true);
  const{isDesktop}=useBreakpoint();
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};
  const handleLogged=type=>{setModal(null);showToast(`✓ Logged to ${type}`);};

  // On desktop, coach is always in the right panel — hide the coach tab
  const mobileNav=NAV;
  const activeTab=tab;

  return(
    <>
      <style>{css}</style>
      <div className="app">
        {splash&&<SplashScreen onDone={()=>setSplash(false)}/>}

        <div className="app-shell">
          {/* ── SIDEBAR (desktop only) ── */}
          <Sidebar tab={tab} setTab={setTab} onOpenSettings={()=>setShowSettings(true)}/>

          {/* ── MAIN CONTENT ── */}
          <div className="main-content">
            {/* Desktop top bar */}
            {isDesktop&&(
              <div className="desktop-topbar">
                <div>
                  <div style={{fontSize:12,color:T.text2,marginBottom:2}}>Saturday, 21 March</div>
                  <div style={{fontSize:18,fontWeight:700,color:T.text}}>Good morning, Sergio</div>
                </div>
                <div style={{display:"flex",gap:9}}>
                  <button style={{width:36,height:36,background:T.card,border:`1px solid ${T.border}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="bell" size={16} color={T.text2}/></button>
                  <button onClick={()=>setShowSettings(true)} style={{width:36,height:36,background:T.card,border:`1px solid ${T.border}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="menu" size={16} color={T.text2}/></button>
                </div>
              </div>
            )}

            {/* Screens */}
            {tab==="today"&&<TodayScreen onOpenSettings={()=>setShowSettings(true)} isDesktop={isDesktop}/>}
            {tab==="log"  &&<LogScreen onVoice={()=>setModal("voice")} onPhoto={()=>setModal("photo")} onManual={()=>setModal("manual")}/>}
            {tab==="train"&&<TrainScreen/>}
            {/* Coach as tab — mobile only */}
            {tab==="coach"&&!isDesktop&&<CoachScreen/>}
          </div>

          {/* ── PERSISTENT COACH PANEL (desktop only) ── */}
          <DesktopCoachPanel/>
        </div>

        {/* ── BOTTOM NAV (mobile/tablet) ── */}
        {!isDesktop&&(
          <nav className="bottom-nav">
            {mobileNav.map(n=>(
              <button key={n.id} className={`nav-btn${tab===n.id?" active":""}`} onClick={()=>setTab(n.id)}>
                <Icon name={n.icon} size={21} color={tab===n.id?T.teal:T.text3} sw={tab===n.id?2:1.5}/>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Modals */}
        {modal==="voice" &&<VoiceLogModal  onClose={()=>setModal(null)} onLogged={()=>handleLogged("Voice")}/>}
        {modal==="photo" &&<PhotoLogModal  onClose={()=>setModal(null)} onLogged={()=>handleLogged("Photo")}/>}
        {modal==="manual"&&<ManualLogModal onClose={()=>setModal(null)} onLogged={()=>handleLogged("Manual")}/>}
        {showSettings&&<SettingsPanel onClose={()=>setShowSettings(false)}/>}

        {/* Toast */}
        {toast&&(
          <div style={{position:"fixed",bottom:isDesktop?24:NAV_H+12,left:"50%",transform:"translateX(-50%)",background:T.card,border:`1px solid ${T.tealBorder}`,borderRadius:14,padding:"10px 20px",fontSize:13,color:T.teal,fontWeight:600,whiteSpace:"nowrap",zIndex:400,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}

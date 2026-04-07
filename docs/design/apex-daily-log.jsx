import { useState, useEffect, useCallback } from "react";

// ── CONFIG ───────────────────────────────────────────────────
const SUPABASE_URL = "https://kaminspwatitpgyujzct.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWluc3B3YXRpdHBneXVqemN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MjI0OTcsImV4cCI6MjA1OTQ5ODQ5N30.AKQFJJFBnBHhTMqMCMgl2JiRBONiT0wYMVsFgVfN7t4";

const PROFILE = {
  weightKg: 68.5, targetWeightKg: 64.0, weeklyLossKg: 0.5,
  bmr: 1650, activityMultiplier: 1.2, dailyDeficit: 550,
};

const REST_TARGETS = {
  kcal: Math.round(PROFILE.bmr * PROFILE.activityMultiplier - PROFILE.dailyDeficit),
  protein: Math.round(PROFILE.weightKg * 2.0), carbs: 180, fat: 55,
};

const SPORT_ICONS = { cycling: "🚴", running: "🏃", hiking: "🥾", walking: "🚶", swimming: "🏊", strength: "🏋️", default: "💪" };

const T = {
  bg: "#0f1012", card: "#18191f", border: "#2a2b33",
  teal: "#2DD4BF", tealMuted: "rgba(45,212,191,0.12)", orange: "#f97316",
  blue: "#60a5fa", red: "#f87171", green: "#22c55e", yellow: "#facc15",
  text: "#FFFFFF", textSec: "#9ca3af", textMuted: "#6b7280",
  font: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const EMPTY_MEALS = [
  { name: "Breakfast", icon: "☀️", items: [] },
  { name: "Training Fuel", icon: "🔋", items: [] },
  { name: "Recovery", icon: "💪", items: [] },
  { name: "Lunch", icon: "🍽️", items: [] },
  { name: "Snacks", icon: "⚡", items: [] },
  { name: "Dinner", icon: "🌙", items: [] },
];

function parseDay(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function addDays(dateStr, days) {
  const next = parseDay(dateStr);
  next.setDate(next.getDate() + days);
  return fmtDate(next);
}

function createFoodItem(id, name, amount, unit, kcal, protein, carbs, fat, source = "personal_db") {
  return { id, name, amount, unit, kcal, protein, carbs, fat, source };
}

function createMockDailyLogs() {
  const today = fmtDate(new Date());
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);

  return {
    [twoDaysAgo]: {
      dayType: "rest",
      confirmed: true,
      targets: { kcal: 1900, protein: 145, carbs: 165, fat: 60 },
      meals: [
        {
          name: "Breakfast",
          icon: "☀️",
          items: [
            createFoodItem("rest-breakfast-1", "Greek yogurt bowl", 260, "g", 310, 29, 24, 10),
            createFoodItem("rest-breakfast-2", "Blueberries", 90, "g", 50, 0.5, 12, 0.2, "label"),
          ],
        },
        { name: "Training Fuel", icon: "🔋", items: [] },
        { name: "Recovery", icon: "💪", items: [] },
        {
          name: "Lunch",
          icon: "🍽️",
          items: [
            createFoodItem("rest-lunch-1", "Chicken quinoa salad", 320, "g", 520, 44, 36, 20),
          ],
        },
        {
          name: "Snacks",
          icon: "⚡",
          items: [
            createFoodItem("rest-snack-1", "Apple", 1, "pc", 95, 0.3, 25, 0.3, "standard"),
            createFoodItem("rest-snack-2", "Almonds", 28, "g", 164, 6, 6, 14),
          ],
        },
        {
          name: "Dinner",
          icon: "🌙",
          items: [
            createFoodItem("rest-dinner-1", "Salmon with roast vegetables", 360, "g", 640, 47, 38, 31),
          ],
        },
      ],
      activities: [],
    },
    [yesterday]: {
      dayType: "recovery",
      confirmed: true,
      targets: { kcal: 2300, protein: 150, carbs: 240, fat: 62 },
      meals: [
        {
          name: "Breakfast",
          icon: "☀️",
          items: [
            createFoodItem("recovery-breakfast-1", "Overnight oats", 280, "g", 420, 22, 58, 12),
            createFoodItem("recovery-breakfast-2", "Whey scoop", 30, "g", 120, 24, 3, 1, "label"),
          ],
        },
        {
          name: "Training Fuel",
          icon: "🔋",
          items: [
            createFoodItem("recovery-fuel-1", "Electrolyte mix", 500, "ml", 80, 0, 20, 0, "estimated"),
          ],
        },
        {
          name: "Recovery",
          icon: "💪",
          items: [
            createFoodItem("recovery-post-1", "Chocolate milk", 330, "ml", 220, 16, 28, 5),
          ],
        },
        {
          name: "Lunch",
          icon: "🍽️",
          items: [
            createFoodItem("recovery-lunch-1", "Rice bowl with chicken", 420, "g", 690, 48, 78, 18),
          ],
        },
        {
          name: "Snacks",
          icon: "⚡",
          items: [
            createFoodItem("recovery-snack-1", "Banana", 1, "pc", 105, 1, 27, 0.3, "standard"),
            createFoodItem("recovery-snack-2", "Rice cakes with honey", 2, "pcs", 150, 2, 34, 1),
          ],
        },
        {
          name: "Dinner",
          icon: "🌙",
          items: [
            createFoodItem("recovery-dinner-1", "Turkey pasta", 390, "g", 610, 41, 62, 18),
          ],
        },
      ],
      activities: [
        {
          title: "Zone 2 Run",
          sport: "running",
          calories: 540,
          distance: 11.2,
          distanceUnit: "km",
          elevation: 85,
          movingTime: "1:00:00",
          avgHR: 142,
          extraStats: [
            { label: "Pace", value: "5:21 /km" },
            { label: "Focus", value: "Aerobic" },
          ],
          zones: [
            { zone: "Z1", pct: 12 },
            { zone: "Z2", pct: 72 },
            { zone: "Z3", pct: 16 },
          ],
          achievements: ["Held cap HR all session"],
        },
      ],
    },
    [today]: {
      dayType: "push",
      confirmed: false,
      targets: { kcal: 3350, protein: 165, carbs: 435, fat: 72 },
      meals: [
        {
          name: "Breakfast",
          icon: "☀️",
          items: [
            createFoodItem("push-breakfast-1", "Bagel with jam", 1, "pc", 320, 9, 62, 4),
            createFoodItem("push-breakfast-2", "Scrambled eggs", 3, "eggs", 215, 18, 2, 15),
            createFoodItem("push-breakfast-3", "Orange juice", 250, "ml", 110, 2, 24, 0, "standard"),
          ],
        },
        {
          name: "Training Fuel",
          icon: "🔋",
          items: [
            createFoodItem("push-fuel-1", "Carb drink", 750, "ml", 280, 0, 70, 0, "label"),
            createFoodItem("push-fuel-2", "Energy gels", 3, "pcs", 300, 0, 75, 0, "label"),
            createFoodItem("push-fuel-3", "Banana", 1, "pc", 105, 1, 27, 0.3, "standard"),
          ],
        },
        {
          name: "Recovery",
          icon: "💪",
          items: [
            createFoodItem("push-post-1", "Recovery shake", 1, "serv", 290, 28, 34, 6, "label"),
          ],
        },
        {
          name: "Lunch",
          icon: "🍽️",
          items: [
            createFoodItem("push-lunch-1", "Chicken burrito bowl", 460, "g", 760, 46, 92, 19),
          ],
        },
        {
          name: "Snacks",
          icon: "⚡",
          items: [
            createFoodItem("push-snack-1", "Yogurt with granola", 220, "g", 330, 16, 42, 9),
          ],
        },
        {
          name: "Dinner",
          icon: "🌙",
          items: [
            createFoodItem("push-dinner-1", "Rice, salmon, greens", 430, "g", 780, 45, 78, 26),
          ],
        },
      ],
      activities: [
        {
          title: "Long Endurance Ride",
          sport: "cycling",
          calories: 2150,
          distance: 100,
          distanceUnit: "km",
          elevation: 1240,
          movingTime: "3:29:00",
          avgHR: 149,
          extraStats: [
            { label: "Power", value: "218 W" },
            { label: "TSS", value: "182" },
          ],
          zones: [
            { zone: "Z1", pct: 8 },
            { zone: "Z2", pct: 56 },
            { zone: "Z3", pct: 22 },
            { zone: "Z4", pct: 14 },
          ],
          achievements: ["100 km milestone", "Strong final climb"],
        },
      ],
    },
  };
}

const MOCK_DAY_DATA = createMockDailyLogs();

// ── SUPABASE FETCH ───────────────────────────────────────────
async function fetchDayData(dateStr) {
  if (MOCK_DAY_DATA[dateStr]) {
    return MOCK_DAY_DATA[dateStr];
  }

  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" };

  try {
    // Fetch daily_log
    const dlRes = await fetch(`${SUPABASE_URL}/rest/v1/daily_log?log_date=eq.${dateStr}&select=*`, { headers });
    const dlData = await dlRes.json();
    if (!dlData || dlData.length === 0) return null;
    const dl = dlData[0];

    // Fetch meals + food_items
    const mRes = await fetch(`${SUPABASE_URL}/rest/v1/meals?daily_log_id=eq.${dl.id}&select=*,food_items(*)&order=sort_order`, { headers });
    const mealsData = await mRes.json();

    // Fetch activities
    const aRes = await fetch(`${SUPABASE_URL}/rest/v1/activities?daily_log_id=eq.${dl.id}&select=*`, { headers });
    const activitiesData = await aRes.json();

    const meals = mealsData.map(m => ({
      name: m.meal_name, icon: m.meal_icon,
      items: (m.food_items || []).sort((a, b) => a.sort_order - b.sort_order).map(fi => ({
        id: fi.id, name: fi.name, amount: Number(fi.amount), unit: fi.unit,
        kcal: fi.kcal, protein: Number(fi.protein), carbs: Number(fi.carbs), fat: Number(fi.fat),
        source: fi.source,
      })),
    }));

    const activities = (activitiesData || []).map(a => ({
      title: a.title, sport: a.sport, calories: a.calories,
      distance: a.distance ? Number(a.distance) : null, distanceUnit: a.distance_unit || "km",
      elevation: a.elevation, movingTime: a.moving_time, avgHR: a.avg_hr,
      extraStats: a.extra_stats || [], zones: a.zones || [], achievements: a.achievements || [],
    }));

    const targets = {
      kcal: dl.target_kcal || REST_TARGETS.kcal,
      protein: dl.target_protein || REST_TARGETS.protein,
      carbs: dl.target_carbs || REST_TARGETS.carbs,
      fat: dl.target_fat || REST_TARGETS.fat,
    };

    return { dayType: dl.day_type, confirmed: dl.confirmed, targets, meals, activities };
  } catch (e) {
    console.error("Supabase fetch error:", e);
    return null;
  }
}

// ── HELPERS ──────────────────────────────────────────────────
function sumMeals(meals) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  meals.forEach(m => m.items.forEach(i => { kcal += i.kcal; protein += i.protein; carbs += i.carbs; fat += i.fat; }));
  return { kcal, protein, carbs, fat };
}
function sumActivityCal(acts) { return acts.reduce((s, a) => s + a.calories, 0); }
function fmtDate(d) { return d.toISOString().split("T")[0]; }
function labelDate(dateStr) {
  const today = fmtDate(new Date());
  const yesterday = fmtDate(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

// ── COMPONENTS ───────────────────────────────────────────────
const Ring = ({ value, max, color, label, unit, size = 68 }) => {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, ratio = Math.min(value / max, 1), offset = circ * (1 - ratio), over = value > max;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={5} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={over ? T.red : color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: over ? T.red : T.text, fontVariantNumeric: "tabular-nums" }}>{Number.isInteger(value) ? value : value.toFixed(1)}</span>
          <span style={{ fontSize: 7, color: T.textMuted }}>{unit}</span>
        </div>
      </div>
      <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.07em", color: T.textMuted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 7, color: T.textMuted }}>{`/ ${max}${unit === "kcal" ? "" : "g"}`}</span>
    </div>
  );
};

const srcIcon = s => { const m = { personal_db: [T.teal, "●"], label: [T.green, "◆"], web_search: [T.orange, "●"], estimated: [T.textMuted, "~"], standard: [T.textMuted, "○"] }; const [c, sym] = m[s] || [T.textMuted, "○"]; return <span style={{ marginLeft: 4, color: c, fontSize: 7 }}>{sym}</span>; };

const FoodRow = ({ item, idx }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "5px 12px", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
      <div style={{ fontSize: 9, color: T.textMuted }}>{item.amount}{item.unit}{srcIcon(item.source)}</div>
    </div>
    <div style={{ display: "flex", gap: 7, alignItems: "center", fontVariantNumeric: "tabular-nums", fontSize: 11 }}>
      <span style={{ color: T.text, fontWeight: 600, minWidth: 28, textAlign: "right" }}>{item.kcal}</span>
      <span style={{ color: T.blue, minWidth: 22, textAlign: "right" }}>{item.protein.toFixed(1)}</span>
      <span style={{ color: T.teal, minWidth: 22, textAlign: "right" }}>{item.carbs.toFixed(1)}</span>
      <span style={{ color: T.orange, minWidth: 22, textAlign: "right" }}>{item.fat.toFixed(1)}</span>
    </div>
  </div>
);

const MealCard = ({ meal }) => {
  const [open, setOpen] = useState(false);
  const sub = meal.items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }), { kcal: 0, p: 0, c: 0, f: 0 });
  const empty = meal.items.length === 0;
  return (
    <div style={{ background: T.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, opacity: empty ? 0.4 : 1 }}>
      <button onClick={() => !empty && setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "none", border: "none", cursor: empty ? "default" : "pointer", color: T.text, fontFamily: T.font }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {meal.icon} {meal.name}
          {empty && <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 400, marginLeft: 8, fontStyle: "italic" }}>not logged yet</span>}
          {!empty && <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 400, marginLeft: 6 }}>{meal.items.length}</span>}
        </span>
        {!empty && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.teal, fontVariantNumeric: "tabular-nums" }}>{sub.kcal}</span>
            <span style={{ fontSize: 9, color: T.textMuted }}>kcal</span>
            <span style={{ fontSize: 11, color: T.textMuted, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s", display: "inline-block" }}>▾</span>
          </span>
        )}
      </button>
      {open && !empty && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {meal.items.map((item, i) => <FoodRow key={item.id || i} item={item} idx={i} />)}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, padding: "5px 12px", borderTop: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)", fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: T.text, minWidth: 28, textAlign: "right" }}>{sub.kcal}</span>
            <span style={{ color: T.blue, minWidth: 22, textAlign: "right" }}>{sub.p.toFixed(1)}</span>
            <span style={{ color: T.teal, minWidth: 22, textAlign: "right" }}>{sub.c.toFixed(1)}</span>
            <span style={{ color: T.orange, minWidth: 22, textAlign: "right" }}>{sub.f.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityCard = ({ activity: a }) => {
  const [open, setOpen] = useState(false);
  const icon = SPORT_ICONS[a.sport] || SPORT_ICONS.default;
  const stats = [a.distance ? ["Dist", `${a.distance} ${a.distanceUnit || "km"}`] : null, a.elevation ? ["Elev", `${a.elevation} m`] : null, a.movingTime ? ["Time", a.movingTime] : null, a.avgHR ? ["HR", `${a.avgHR} bpm`] : null, ...(a.extraStats || []).map(s => [s.label, s.value])].filter(Boolean);
  return (
    <div style={{ background: T.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "none", border: "none", cursor: "pointer", color: T.text, fontFamily: T.font }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{icon} {a.title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.red, fontVariantNumeric: "tabular-nums" }}>-{a.calories}</span>
          <span style={{ fontSize: 9, color: T.textMuted }}>kcal</span>
          <span style={{ fontSize: 11, color: T.textMuted, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s", display: "inline-block" }}>▾</span>
        </span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "8px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
            {stats.map(([l, v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 10, color: T.textMuted }}>{l}</span><span style={{ fontSize: 11, fontWeight: 600, color: T.text, fontVariantNumeric: "tabular-nums" }}>{v}</span></div>))}
          </div>
          {a.zones && a.zones.some(z => z.pct > 0) && (
            <div style={{ display: "flex", gap: 2, height: 12, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              {a.zones.filter(z => z.pct > 0).map((z, i) => (<div key={i} style={{ width: `${z.pct}%`, background: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"][["Z5", "Z4", "Z3", "Z2", "Z1"].indexOf(z.zone)], display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 7, fontWeight: 700, color: "#0f1012" }}>{z.zone}</span></div>))}
            </div>
          )}
          {a.achievements && a.achievements.length > 0 && (
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {a.achievements.map((pr, i) => (<span key={i} style={{ fontSize: 8, color: T.yellow, background: "rgba(250,204,21,0.1)", padding: "2px 5px", borderRadius: 3 }}>🏆 {pr}</span>))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── DATE NAVIGATOR ───────────────────────────────────────────
const DateNav = ({ dateStr, onPrev, onNext, canNext }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 14 }}>
    <button onClick={onPrev} style={{ background: "none", border: "none", color: T.textSec, fontSize: 22, cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}>‹</button>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{labelDate(dateStr)}</span>
      <span style={{ fontSize: 10, color: T.textMuted }}>▾</span>
    </div>
    <button onClick={onNext} disabled={!canNext} style={{ background: "none", border: "none", color: canNext ? T.textSec : T.border, fontSize: 22, cursor: canNext ? "pointer" : "default", padding: "4px 8px", lineHeight: 1 }}>›</button>
  </div>
);

// ── MAIN ─────────────────────────────────────────────────────
export default function ApexDailyLog() {
  const [dateStr, setDateStr] = useState(fmtDate(new Date()));
  const [dayData, setDayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const todayStr = fmtDate(new Date());
  const canNext = parseDay(dateStr).getTime() < parseDay(todayStr).getTime();

  const loadDay = useCallback(async (ds) => {
    setLoading(true);
    setConfirmed(false);
    const data = await fetchDayData(ds);
    setDayData(data);
    if (data?.confirmed) setConfirmed(true);
    setLoading(false);
  }, []);

  useEffect(() => { loadDay(dateStr); }, [dateStr, loadDay]);

  const goPrev = () => setDateStr(addDays(dateStr, -1));
  const goNext = () => {
    if (canNext) {
      setDateStr((currentDate) => addDays(currentDate, 1));
    }
  };

  const meals = dayData?.meals || EMPTY_MEALS;
  const activities = dayData?.activities || [];
  const targets = dayData?.targets || REST_TARGETS;
  const dayType = dayData?.dayType || "rest";
  const hasData = dayData !== null;
  const totals = sumMeals(meals);
  const exCal = sumActivityCal(activities);
  const hasFood = totals.kcal > 0;
  const hasActivity = activities.length > 0;
  const tmc = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
  const pPct = tmc > 0 ? Math.round((totals.protein * 4 / tmc) * 100) : 0;
  const cPct = tmc > 0 ? Math.round((totals.carbs * 4 / tmc) * 100) : 0;
  const fPct = tmc > 0 ? Math.round((totals.fat * 9 / tmc) * 100) : 0;
  const rem = targets.kcal - totals.kcal;
  const netCal = totals.kcal - exCal;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, padding: "12px 12px 32px" }}>
      {/* Wordmark */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.14em", color: T.textMuted }}>APE<span style={{ color: T.teal }}>X</span></span>
      </div>

      {/* Date Navigator */}
      <DateNav dateStr={dateStr} onPrev={goPrev} onNext={goNext} canNext={canNext} />

      {/* Day type badge */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span style={{
          fontSize: 9, padding: "3px 10px", borderRadius: 20, fontWeight: 600, letterSpacing: "0.04em",
          background: dayType !== "rest" ? "rgba(45,212,191,0.15)" : "rgba(156,163,175,0.15)",
          color: dayType !== "rest" ? T.teal : T.textSec,
          border: `1px solid ${dayType !== "rest" ? "rgba(45,212,191,0.3)" : "rgba(156,163,175,0.2)"}`,
        }}>
          {dayType !== "rest" ? `🔋 ${dayType.toUpperCase()} DAY` : "😴 REST DAY"}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted, fontSize: 13 }}>
          Loading...
        </div>
      )}

      {!loading && (
        <>
          {/* Rings */}
          <div style={{ display: "flex", justifyContent: "space-around", padding: "4px 0 12px" }}>
            <Ring value={totals.kcal} max={targets.kcal} color={T.teal} label="Calories" unit="kcal" />
            <Ring value={Math.round(totals.protein * 10) / 10} max={targets.protein} color={T.blue} label="Protein" unit="g" />
            <Ring value={Math.round(totals.carbs * 10) / 10} max={targets.carbs} color={T.teal} label="Carbs" unit="g" />
            <Ring value={Math.round(totals.fat * 10) / 10} max={targets.fat} color={T.orange} label="Fat" unit="g" />
          </div>

          {/* Macro bar */}
          {hasFood && (
            <>
              <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 1, margin: "0 4px 3px" }}>
                <div style={{ width: `${pPct}%`, background: T.blue }} /><div style={{ width: `${cPct}%`, background: T.teal }} /><div style={{ width: `${fPct}%`, background: T.orange }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 8, fontSize: 9, color: T.textMuted }}>
                <span><span style={{ color: T.blue }}>P</span> {pPct}%</span>
                <span><span style={{ color: T.teal }}>C</span> {cPct}%</span>
                <span><span style={{ color: T.orange }}>F</span> {fPct}%</span>
              </div>
            </>
          )}

          {/* Remaining / Net */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", background: rem > 0 ? T.tealMuted : "rgba(34,197,94,0.12)", border: rem > 0 ? "1px solid rgba(45,212,191,0.2)" : "1px solid rgba(34,197,94,0.3)" }}>
              <span style={{ fontSize: 10, color: rem > 0 ? T.teal : T.green, fontWeight: 600 }}>{rem > 0 ? "Remaining" : "Surplus"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>{Math.abs(rem)} kcal</span>
            </div>
            {hasActivity && (
              <div style={{ flex: 1, borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", background: netCal < 0 ? "rgba(248,113,113,0.1)" : "rgba(34,197,94,0.1)", border: netCal < 0 ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(34,197,94,0.2)" }}>
                <span style={{ fontSize: 10, color: netCal < 0 ? T.red : T.green, fontWeight: 600 }}>Net</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: netCal < 0 ? T.red : T.green, fontVariantNumeric: "tabular-nums" }}>{netCal > 0 ? "+" : ""}{netCal}</span>
              </div>
            )}
          </div>

          {/* Activities */}
          {hasActivity && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {activities.map((a, i) => <ActivityCard key={i} activity={a} />)}
            </div>
          )}

          {/* Meals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {meals.map(meal => <MealCard key={meal.name} meal={meal} />)}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12, fontSize: 8, color: T.textMuted, flexWrap: "wrap" }}>
            <span><span style={{ color: T.teal, marginRight: 2 }}>●</span>DB</span>
            <span><span style={{ color: T.green, marginRight: 2 }}>◆</span>Label</span>
            <span><span style={{ color: T.textMuted, marginRight: 2 }}>○</span>Std</span>
            <span><span style={{ color: T.orange, marginRight: 2 }}>●</span>Web</span>
            <span><span style={{ color: T.textMuted, marginRight: 2 }}>~</span>Est</span>
          </div>

          {/* Confirm / Status */}
          {hasData && (
            <button onClick={() => setConfirmed(true)} disabled={confirmed || !hasFood} style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "none", fontSize: 13, fontWeight: 700,
              fontFamily: T.font, cursor: confirmed || !hasFood ? "default" : "pointer",
              background: confirmed ? T.green : !hasFood ? T.border : T.teal,
              color: confirmed ? "#fff" : !hasFood ? T.textMuted : "#0f1012",
              transition: "all 0.3s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {confirmed ? (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Confirmed</>) : !hasFood ? "No food logged" : "Confirm & Save Log"}
            </button>
          )}
          {!hasData && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>No log for this day</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Start logging by telling APEX what you ate</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

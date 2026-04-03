# APEX AI Coach — Feature Specification
**Version:** 1.0  
**Status:** Draft  
**Author:** Sergio + Claude  
**Date:** March 2026

---

## 1. Vision

The APEX AI Coach is a **personal endurance coach that never sleeps** — one that knows your full training history, your nutrition log, your body metrics, and your goals, and uses all of that to give you the right advice at the right moment.

Unlike a chatbot that responds to questions, the APEX Coach is **proactive**. It thinks ahead, notices when you're off track, adjusts your plan when life happens, and gives you a clear answer to the question every athlete asks every morning:

> *"What should I do today, and why?"*

---

## 2. Core Mental Model: Three Planning Horizons

The Coach operates across three nested planning horizons that stay synchronized at all times.

```
MACRO PLAN (Goal)
└── e.g. "160km cycling race on June 15" or "Marathon in October"
    │
    ├── MESO PLAN (Weekly)
    │   └── Structured training weeks building toward the goal
    │       Reviewed and adjusted every week
    │
    └── MICRO PLAN (Daily)
        └── Today's specific training + nutrition targets
            Adjusted dynamically based on what actually happened
```

Most fitness apps operate at only one level. APEX operates across all three — and the AI is the bridge that keeps them aligned in real time.

---

## 3. The Four Coach Responsibilities

### 3.1 Plan (Long-Term Goal Engine)
- Accepts athlete goals: race events, distance targets, body composition
- Generates a phased macro training plan aligned to the goal date
- Imports Strava history (up to 3 months) to calibrate starting fitness (CTL baseline)
- After 2 weeks of APEX logging, transitions from imported to live data
- Defines periodization phases: Base → Build → Peak → Taper (for race goals)

### 3.2 Adapt (Real-Time Adjustment Engine)
- If today's training is skipped → automatically scales down calorie/carb targets
- If training was harder than planned → flags higher recovery needs, adjusts tomorrow
- If weekly TSS is below target → redistributes load across remaining days
- If athlete is consistently under-recovering (TSB too negative) → suggests rest
- If goal timeline is at risk → surfaces an alert and offers to redefine the goal

### 3.3 Review (Feedback Loop Engine)
- **Daily summary:** What you did vs what was planned, macro adherence, a single coaching note
- **Weekly review:** Training load trend, nutrition adherence, weight trend, what went well, what to fix, adjusted plan for next week
- **Goal check-in:** Every 2 weeks, a progress-vs-plan assessment with a go/adjust/reconsider recommendation

### 3.4 Coach (Conversational Interface)
- Voice-first conversational interface (existing Coach screen)
- Every message sent with full context payload (see Section 6)
- Can answer real-time questions: *"I feel tired today, should I train?"*
- Can explain decisions: *"Why are my carbs lower today?"*
- Can suggest pre-training meals based on today's session
- Can flag nutrition gaps: *"You've been under on protein 4 days this week"*

---

## 4. Goal Definition Flow

When a user sets a new goal, the Coach runs a structured onboarding sequence.

### 4.1 Goal Types (v1)
| Type | Example |
|---|---|
| Race / Event | "160km cycling race on June 15" |
| Distance PR | "Run a sub-2h half marathon" |
| Body composition | "Reach 64kg by September" |
| Training consistency | "Train 5 days/week for 8 weeks" |
| Combined | "Reach 64kg AND do the June race" |

### 4.2 Goal Onboarding Questions
After goal is set, Coach collects:
1. Current fitness context (or imports from Strava)
2. Available training days per week
3. Equipment / terrain constraints
4. Secondary goals (e.g. "maintain performance while losing fat")
5. Any upcoming constraints (travel, family, injuries)

### 4.3 Output: The Macro Plan
A phased weekly structure stored in the database:
- Phase name (Base / Build / Peak / Taper)
- Target weekly TSS range
- Target weekly training hours
- Target macro splits per day type (hard / easy / rest)
- Milestone check-ins (every 2 weeks)

---

## 5. Daily Micro Plan Logic

Every day the Coach generates a **Daily Brief** surfaced on the Today screen.

### 5.1 Daily Brief Contents
```
TODAY — Tuesday, April 8

🏃 Training: Run 1h + Weights 30 min
   Expected TSS: ~70
   Zone target: Mostly Z2, last 15 min Z3-4

🍽️ Nutrition targets (adjusted for today's load):
   Calories: 2,350 cal
   Protein: 140g
   Carbs: 260g
   Fat: 65g

⏰ Pre-training (7:30 AM): 2 slices grain bread + banana
   Post-training (9:30 AM): 3 eggs + Greek yogurt + fruit

📊 Yesterday: TSS 62 ✓ | Protein 128g ✓ | Calories 2,180 ✓
💬 Coach note: "Good consistency this week. Push the intervals today."
```

### 5.2 Macro Adjustment Rules by Day Type

| Day Type | Calories | Carbs | Protein | Fat |
|---|---|---|---|---|
| Rest day | –15% | –30% | High | Moderate |
| Easy Zone 2 (<75 min) | Base | Low-Moderate | High | Moderate |
| Hard / Intervals | Base | High | High | Low |
| Long ride (>90 min) | +10–15% | Very High | High | Moderate |
| Run + Weights | Base | Moderate-High | Very High | Low |
| Missed training | –10% | –20% | High | Moderate |

### 5.3 If Training is Missed
When a planned session is not completed (detected via Strava sync or manual log):
1. Recalculate today's nutrition targets downward
2. Notify athlete: *"Looks like you didn't train today — I've adjusted your targets"*
3. Redistribute the missed TSS load to the next suitable day if possible
4. Log the miss in weekly tracking (for weekly review)

---

## 6. AI Context Payload

Every Coach conversation is sent with a structured context payload. This is what makes the AI respond like a real coach rather than a generic assistant.

```json
{
  "athlete": {
    "name": "Sergio",
    "weight_kg": 68.5,
    "goal_weight_kg": 64,
    "height_cm": 170,
    "weeks_to_goal": 11
  },
  "goal": {
    "type": "race",
    "description": "160km cycling race",
    "date": "2026-06-15",
    "phase": "Base",
    "on_track": true
  },
  "today": {
    "date": "2026-04-08",
    "planned_training": "run_weights",
    "completed_training": null,
    "tss_planned": 70,
    "tss_actual": null,
    "macro_targets": {
      "calories": 2350,
      "protein_g": 140,
      "carbs_g": 260,
      "fat_g": 65
    },
    "macro_logged": {
      "calories": 1200,
      "protein_g": 65,
      "carbs_g": 130,
      "fat_g": 30
    }
  },
  "this_week": {
    "tss_planned": 320,
    "tss_actual": 180,
    "avg_protein_g": 112,
    "avg_calories": 2180,
    "training_days_completed": 2,
    "training_days_planned": 5
  },
  "fitness": {
    "ctl": 52,
    "atl": 58,
    "tsb": -6,
    "trend": "building"
  },
  "last_7_days_summary": "3 sessions completed, avg protein 112g (target 135g), weight stable at 68.2kg"
}
```

This payload is rebuilt fresh every time the Coach screen is opened or a message is sent.

---

## 7. Weekly Review

Every Sunday evening (or Monday morning), APEX generates a **Weekly Review**.

### 7.1 Weekly Review Contents
```
WEEK 3 REVIEW — April 7–13

📊 Training
  Planned TSS: 320 | Actual TSS: 298 (93%) ✅
  Sessions: 5/5 completed ✅
  Long ride: 2h 10min, avg power 198W ✅
  Missed: none

🍽️ Nutrition
  Avg protein: 128g (target 135g) — slightly under ⚠️
  Avg calories: 2,220 (target 2,300) ✅
  Best day: Thursday (142g protein, clean macros)
  Worst day: Saturday (pizza + pastries — surplus ~400 cal)

⚖️ Body
  Start of week: 68.2 kg
  End of week: 67.9 kg
  Trend: –0.3 kg ✅ (on track for goal)

✅ What went well
  - Consistency was excellent — 5/5 sessions
  - Zone 2 pacing is improving
  - Post-training breakfast habit is solid

⚠️ What to improve
  - Protein still slightly low — add eggs or Greek yogurt to afternoon snack
  - Saturday nutrition needs more awareness — one free meal, not one free day

📅 Next week plan
  Week 4 target TSS: 340 (slight progression)
  Key session: Wednesday intervals — push to 7×3 min
  Nutrition focus: Hit 135g protein every weekday
```

---

## 8. Goal Check-In (Every 2 Weeks)

A structured progress-vs-plan assessment with a clear recommendation.

### 8.1 Possible Outcomes

| Status | Condition | Coach Action |
|---|---|---|
| ✅ On Track | TSS within 10% of plan, weight trending | Encourage, progress load |
| ⚠️ Slightly Behind | TSS 10–25% below plan | Adjust upcoming weeks, note the gap |
| 🔴 Off Track | TSS >25% below plan OR weight stalling | Offer to redefine goal or restructure plan |
| 🏆 Ahead of Plan | Fitness building faster than expected | Option to stretch goal or add secondary target |

### 8.2 Goal Redefinition Flow
If athlete is off track and chooses to redefine:
1. Coach explains what changed and why
2. Offers 2–3 adjusted goal options (same race, slower time / later race / different distance)
3. Athlete selects → plan rebuilds automatically

---

## 9. Data Sources & Integration Requirements

| Source | Data Used | Frequency |
|---|---|---|
| Strava | Activity history, TSS, HR, power, pace | Real-time sync post-activity |
| APEX Food Log | Daily macros, meal timing | Continuous |
| APEX Body Log | Weight, subjective feel | Daily (manual) |
| Google Calendar | Upcoming events, travel, constraints | Weekly scan |
| Apple HealthKit | Steps, resting HR, sleep (future) | Daily |
| Manual input | Missed sessions, how you felt, notes | On-demand |

### 9.1 Strava History Import (Onboarding)
- On first login, import last 90 days of Strava activities
- Calculate CTL baseline from this history
- Detect dominant sport (cycling vs running ratio)
- Identify typical weekly TSS and training days
- Use this to calibrate the initial macro plan without requiring 2 weeks of APEX logging

---

## 10. Coach Personality & Tone

The APEX Coach should feel like a **knowledgeable friend who is also a certified coach** — not a corporate wellness bot.

### Tone principles:
- **Direct.** Gives clear answers, not hedged non-advice.
- **Honest.** Tells you when you're off track, not just what you want to hear.
- **Contextual.** Always references your actual data, not generic advice.
- **Concise.** Respects that you're asking before or after training, not during a consultation.
- **Proactive.** Surfaces insights you didn't ask for but need to know.

### Examples:

❌ Generic: *"Great job training this week! Remember to stay hydrated."*
✅ APEX: *"You hit 93% of your target load this week. Protein was slightly low — 3 of 5 days under target. Fix that this week and you'll be ahead of schedule."*

❌ Generic: *"It's important to eat carbohydrates before long rides."*
✅ APEX: *"You have a 2.5h ride Saturday. Eat extra carbs Friday dinner — rice or pasta, bigger portion than usual. Saturday morning: oats + banana + honey before you leave."*

---

## 11. MVP Scope vs Future

### v1 MVP (Build First)
- [ ] Goal setting UI (race/event + date + type)
- [ ] Macro plan generation from goal
- [ ] Daily Brief on Today screen
- [ ] Day-type macro adjustment logic
- [ ] Missed session detection + nutrition rescaling
- [ ] Weekly review generation
- [ ] Context payload sent with every Coach message
- [ ] Strava history import for CTL baseline

### v2 (After Validation)
- [ ] Goal check-in every 2 weeks with on-track assessment
- [ ] Goal redefinition flow
- [ ] Pre-training meal suggestions (contextual, time-aware)
- [ ] Proactive alerts (low protein streak, negative TSB warning)
- [ ] Apple HealthKit sleep + resting HR integration

### v3 (Long Term)
- [ ] Multi-goal support (race + body composition simultaneously)
- [ ] Race calendar with auto-periodization
- [ ] Training plan import (e.g. upload a Garmin/TrainingPeaks plan)
- [ ] Peer comparison and community benchmarks

---

## 12. Open Questions

1. **How granular is meal logging?** Does the user log each ingredient or select meals? (Affects macro accuracy)
2. **How does the Coach handle completely unplanned days** — e.g. spontaneous hike with family?
3. **Should the Weekly Review be auto-generated or triggered?** Push notification Sunday evening?
4. **Voice logging of missed sessions** — "Hey APEX, I skipped today's run" → auto-adjusts?
5. **How do we handle multi-sport weeks** where the ratio of cycling/running varies significantly?

---

*This document is a living spec. It should be updated as implementation begins and validated against real usage patterns.*

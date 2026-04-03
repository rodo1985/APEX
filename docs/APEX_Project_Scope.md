# 🏃 APEX
### *AI Personal Trainer & Dietitian*

> **Version** 1.0 · **Date** March 2026 · **Status** 🟡 Draft

---

## 1. Executive Summary

APEX is a personal AI-powered health companion designed for endurance athletes — specifically cyclists and runners — that replaces a fragmented ecosystem of fitness and nutrition apps with a single, deeply personalized platform. It combines an intelligent food logging system, a real-time training analytics layer sourced from Strava, and a voice-first conversational AI coach — available 24/7 — that has full context over every meal eaten, every kilometer ridden or run, and every future commitment in the user's calendar.

APEX is built as a web application, making it accessible from any device with a browser — no install required — while delivering a rich, app-like experience with real-time data and voice interaction. Unlike existing tools such as MyFitnessPal, which excel at passive data collection but lack intelligence and integrations, APEX actively interprets data, identifies patterns, and provides actionable, context-aware guidance.

The result feels less like filling in a logbook and more like having a knowledgeable trainer and dietitian on call at all times.

---

## 2. Problem Statement

- **Fragmented tools** — MyFitnessPal, Strava, and Google Calendar each solve one piece of the puzzle but share no data with each other, forcing the user to manually connect the dots.
- **Passive tracking** — Food apps require tedious manual entry with no AI assistance; logging a meal means navigating a database, not speaking naturally.
- **Missing context** — Training apps summarise activities but never ask "did you fuel well for this?" — the relationship between nutrition and performance is invisible.
- **Static targets** — Calorie goals are fixed regardless of whether you rode 120 km or rested all day, making them meaningless for athletes.
- **No planning intelligence** — No existing tool uses training load, recovery status, and calendar context together to plan the days ahead.
- **No 24/7 coach** — When you're on the bike wondering if you need a gel, or cooling down after a run, there's no intelligent assistant available in that moment.

---

## 3. Vision & Goals

### 3.1 Vision Statement

To build the most personalized AI health companion available for endurance athletes — one that understands the user as a complete cyclist and runner: their body, their training load, their nutrition, and their schedule, and uses that understanding to help them perform and feel better every single day.

### 3.2 Strategic Goals

- **Centralize** — Bring nutrition, training, and planning into a single platform, eliminating the need for multiple apps.
- **Automate** — Remove all friction from daily health tracking through AI-powered voice and photo logging.
- **Contextualize** — No metric exists in isolation; calories are understood relative to training output, recovery relative to the calendar.
- **Converse** — Make health guidance accessible through natural voice conversation, at any time of day.
- **Personalize** — Continuously learn from the user's patterns and preferences to improve recommendations over time.
- **Plan** — Proactively build training and nutrition plans grounded in physiological state and life context — not generic templates.

---

## 4. Solution Scope

APEX is organised around four interconnected pillars. Each pillar delivers value independently but reaches its full potential when combined with the others.

---

### Pillar 1 — Intelligent Food Logging

The core premise: logging food should require almost no effort. APEX removes all friction from nutrition tracking through multimodal AI input.

#### Voice Logging

The user speaks naturally at any moment — *"I just had overnight oats with banana, honey, and a scoop of protein powder"* — and the assistant transcribes, parses, identifies each ingredient, estimates portions, and logs the full meal with calculated calories and macros. No app navigation, no manual database search.

#### Photo Logging

The user photographs a meal or food label. APEX uses computer vision to identify the dish or ingredients, estimates quantities from visual cues and contextual knowledge (portion standards, restaurant serving sizes, home cooking ratios), and logs the entry automatically. The user confirms or corrects before saving.

#### Nutrition Intelligence

- Macronutrients: protein, carbohydrates (including sugar and fibre), fats (including saturated)
- Micronutrients relevant to endurance athletes: iron, magnesium, vitamin D, sodium
- Hydration tracking, with higher targets on training days
- Meal timing relative to training sessions: pre-, intra-, and post-workout windows

#### Personalized Targets

Nutritional targets are not static. Daily calorie and macro goals recalculate automatically based on the training load for that day — a rest day and a 120 km ride have entirely different fuelling requirements.

---

### Pillar 2 — Training Analytics & Strava Integration

APEX connects to the Strava API to pull a rich picture of every cycling and running session — far beyond what typical summaries show. Each sport is tracked with discipline-specific metrics that actually matter.

#### Cycling Metrics

- Distance, duration, elevation, speed
- Power: average power, normalized power (NP), Intensity Factor (IF), Training Stress Score (TSS), Variability Index (VI)
- Heart rate: average, max, time-in-zone (Zones 1–5)
- Cadence, W/kg, segment performance

#### Running Metrics

- Distance, duration, elevation, pace (average and splits)
- Heart rate zones and Running Stress Score (RSS)
- Cadence, ground contact time (where available)
- Race time predictions (5K, 10K, half-marathon, marathon) based on current fitness

#### Training Load & Recovery

- **ATL** (Acute Training Load) — 7-day rolling stress, cycling + running combined
- **CTL** (Chronic Training Load) — 42-day rolling fitness baseline
- **TSB / Form** — balance between fitness and fatigue, essential for race peaking
- Sport-split load view — how much stress is coming from cycling vs. running
- Estimated recovery status based on load trends and rest signals

---

### Pillar 3 — Daily Dashboard

The dashboard is the user's morning briefing and daily command centre — a single view that answers: *"What does my day look like, and what do I need to know?"*

#### At a Glance

- Calories consumed vs. target, macro breakdown (progress rings)
- Hydration level vs. daily target
- Training summary: activity completed or planned, load contribution, key metrics
- Recovery score and readiness indicator
- AI insight of the day: a short, personalized observation

#### Weekly View

- Training load trend chart (ATL / CTL / TSB)
- Calorie balance vs. training output
- Macro compliance percentage
- Upcoming sessions with nutrition prep notes

#### Historical Analysis

- Filterable food and training log
- Body composition tracking (weight, optional measurements)
- Correlation charts: carbohydrate intake vs. next-day performance, load vs. fatigue

---

### Pillar 4 — AI Coach & Personal Assistant

The heart of APEX. A conversational coach with full, persistent context over nutrition history, training data, recovery status, and the user's calendar. Available 24/7, primarily by voice.

#### Context-Aware Conversations

Every conversation starts from a complete picture:
- What was eaten today and over the past week
- What training was done and how hard
- What is in the calendar for the next 7–14 days
- Current fitness, fatigue, and form (CTL / ATL / TSB)
- Personal goals, body metrics, and historical preferences

#### What You Can Ask

- *"How did today go? What should I focus on tomorrow?"*
- *"I have a 90 km ride Saturday — what should I eat Friday and Saturday morning?"*
- *"Plan my training for the next 10 days based on my calendar and current form."*
- *"I've been tired in the last hour of my rides — what could be causing it?"*
- *"Log 200g of chicken breast and a side salad for lunch."*
- *"How has my protein intake compared to my targets this month?"*

#### Google Calendar Integration

- Reads scheduled training sessions and races to plan nutrition and load
- Identifies high-stress periods (travel, long work days) and adjusts recommendations
- Writes training sessions and nutrition prep reminders back to the calendar
- Considers rest days and social events when building weekly plans

#### Voice-First Interface

Voice is the primary interaction mode. Using the browser's Web Speech API combined with Whisper for transcription and a natural TTS engine for responses, APEX supports fully hands-free conversation from any browser tab.

Voice is especially critical for endurance athletes — decisions about nutrition happen mid-ride, post-run, or while cooking, when typing is impractical:

- *Mid-ride:* "APEX, how many carbs do I have left today?"
- *Post-run:* "Log my run — 12K, felt hard. What should I eat for recovery?"
- *Evening:* "How did my nutrition match my training today?"
- *Morning:* "What's my form like and what's the plan this week?"

Text interaction remains fully supported for desktop use. The same coach, the same context, the same quality of response.

---

## 5. Key Differentiators

| Differentiator | Description |
|---|---|
| **Full Context** | The AI coach knows everything: food, training, calendar, goals. No other tool unifies all three into a single intelligent layer. |
| **Voice-First Design** | Built to be spoken to — from the kitchen, the bike, or the finish line. The primary interaction is your voice, not a keyboard. |
| **Zero-Friction Logging** | Voice and photo logging make daily nutrition tracking a 10-second task, not a 5-minute chore. |
| **Dynamic Targets** | Calorie and macro targets adjust automatically based on actual training output — a 120 km ride and a rest day have entirely different fuelling needs. |
| **Cycling + Running Science** | Sport-specific metrics: power (TSS, NP, IF, W/kg) for cycling, pace zones and RSS for running — unified into a single training load picture. |
| **AI That Plans** | The coach proactively builds training and nutrition plans aligned with your calendar, current form, and target races. |
| **Web-First, Everywhere** | Works on any device instantly — desktop at home, tablet in the kitchen, phone at the track — with no installation required. |

---

## 6. Integrations & Data Sources

| Integration | Direction | Purpose |
|---|---|---|
| Strava API | Pull | Full activity history, real-time workout sync, cycling power data, running pace/HR zones |
| Google Calendar | Read & Write | Training schedule awareness, race planning, life event context, reminder creation |
| Open Food Facts / USDA | Pull | Ingredient database for food recognition and macro/micronutrient calculation |
| GPT-4o Vision | Internal | Photo-to-food recognition and ingredient/portion estimation |
| Whisper (OpenAI STT) | Internal | High-accuracy voice transcription for food logging and coach conversations |
| Web Speech API (Browser) | Internal | Native browser speech recognition and TTS playback — no plugin required |
| Garmin Connect *(future)* | Pull | HRV, sleep quality, body battery, resting HR for recovery scoring |

---

## 7. Development Phases

| # | Phase | Scope |
|---|---|---|
| 1 | **Foundation** | Web app scaffold. Food logging via voice (Whisper) and photo (vision AI). Nutrition dashboard. Dynamic macro targets. Core AI parsing engine. |
| 2 | **Training Layer** | Strava API integration. Cycling (power, TSS, NP, IF) and running (RSS, pace zones) metrics. Unified nutrition + training dashboard. CTL/ATL/TSB. |
| 3 | **AI Coach** | Voice-first conversational coach (Web Speech API + TTS). Full context awareness. Daily debrief, meal planning, and training Q&A. |
| 4 | **Planning** | Google Calendar integration. Race calendar and periodisation planning. Recovery-adjusted weekly plans. Plan writing back to calendar. |
| 5 | **Intelligence** | Pattern learning and personalisation. Micronutrient tracking. Correlation insights. Garmin Connect / wearable integration. |

---

## 8. Out of Scope (v1)

- Social or community features (leaderboards, friend sharing, group challenges)
- Marketplace or coach-facing interface — this is a personal tool, not a platform
- Meal delivery or grocery ordering integrations
- Strength training prescription — initial focus is endurance sports (cycling and running)
- Native mobile app (iOS/Android) — Phase 1 targets web; PWA or native app is a future consideration
- Medical or clinical nutrition functions — this is not a medical device
- Swimming or multi-sport tracking beyond cycling and running

---

## 9. Success Metrics

- **Food logging compliance:** >90% of meals logged daily without manual database search
- **Nutrition goal accuracy:** macro targets hit within ±10% on >80% of training days
- **Training plan adherence:** AI-generated plans followed with fewer than 2 modifications per week
- **Engagement:** daily assistant interaction averaging >5 minutes
- **Platform replacement:** APEX replaces MyFitnessPal and the Strava dashboard as the primary daily health interface within 60 days of Phase 2 completion

---

## 10. Open Questions

1. **AI model strategy** — Single hosted model vs. specialised models per function (vision, conversation, planning)?
2. **Data privacy** — Where is personal health data stored, and what are the security requirements for a web-hosted app?
3. **Offline / PWA** — Should the web app support a service worker mode for basic logging without internet?
4. **Power meter** — Does the user have a cycling power meter? This significantly enriches TSS and IF calculations.
5. **Voice interaction** — Push-to-talk only, or passive wake-word listening (with browser permission)?
6. **Running load method** — Pace zones vs. heart rate zones as the primary running stress calculation?
7. **Race calendar** — Should APEX allow defining target races and automatically structure a periodised plan around them?
8. **Wearable priority** — Garmin Connect vs. Apple Watch vs. Whoop as the first wearable integration after Strava?

---

*"APEX — Because great performance is built on great data."*

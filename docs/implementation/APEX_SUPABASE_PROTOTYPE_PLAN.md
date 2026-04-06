# APEX Supabase Prototype Adaptation Plan

## Objective

Adapt the authenticated APEX frontend so the current `Today` page becomes a richer main dashboard and the `Food Log` gains historical day navigation, using the Supabase schema from the nutrition prototype as the read source for this slice.

This is intentionally a prototype path. The goal is to move quickly on UX and data modeling without blocking on a full backend rewrite.

## Reference Inputs

- Product shell and overall visual language:
  [docs/design/apex-app-v9.jsx](/Users/REDONSX1/.codex/worktrees/c054/APEX/docs/design/apex-app-v9.jsx)
- Supabase nutrition prototype:
  [docs/design/apex-daily-log.jsx](/Users/REDONSX1/.codex/worktrees/c054/APEX/docs/design/apex-daily-log.jsx)
- Current dashboard page:
  [frontend/src/pages/TodayPage.tsx](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/src/pages/TodayPage.tsx)
- Current food log page:
  [frontend/src/pages/FoodLogPage.tsx](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/src/pages/FoodLogPage.tsx)

## Prototype Architecture

- Keep FastAPI as the current app backbone for auth, onboarding, coach, voice/photo parsing, and existing training APIs.
- Add a Supabase-backed read layer in the frontend for dashboard nutrition summaries, meal-slot history, and per-day activity details.
- Treat Supabase as a prototype read model first, not the new source of truth for the entire app.
- Preserve the current app shell and route structure, but rename the `Today` experience in copy and behavior toward a more complete dashboard feel.

## Parallel Agent Plan

### Agent 1: Dashboard UX

Owns:
- [frontend/src/pages/TodayPage.tsx](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/src/pages/TodayPage.tsx)
- relevant shared styles in [frontend/src/styles.css](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/src/styles.css)

Deliverables:
- Reframe `Today` as the main dashboard in copy, information density, and layout.
- Replace the current calories card with the richer prototype summary:
  target, consumed, remaining, net calories, exercise calories, day type, and macro target progress.
- Bring in the more analytical nutrition treatment from the Supabase prototype:
  rings or equivalent progress indicators, clearer target-vs-actual framing, and confirmation state.
- Preserve the training context cards already built into the current app shell.

Notes:
- This agent should not own Supabase queries directly.
- It should consume a clean view model from a shared adapter layer.

### Agent 2: Historical Food Log UX

Owns:
- [frontend/src/pages/FoodLogPage.tsx](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/src/pages/FoodLogPage.tsx)
- relevant shared styles in [frontend/src/styles.css](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/src/styles.css)

Deliverables:
- Add a date navigator for today, yesterday, and earlier days.
- Load meal slots for the selected date, including empty states that match the Supabase prototype structure.
- Show historical activities for the selected date when they exist.
- Preserve the current manual / voice / photo composer, but make date-aware decisions explicit:
  for prototype v1, editing can stay focused on the currently selected day; if needed, non-today editing can be read-only first.

Notes:
- This agent should work against a shared `selectedDate` state and view model contract.
- It should not embed raw Supabase response mapping in the page component.

### Agent 3: Supabase Data Adapter

Owns:
- new frontend data layer under `frontend/src/lib/`
- shared types and mapping utilities

Deliverables:
- Add a Supabase client or REST wrapper for the nutrition prototype tables/views.
- Create typed read functions such as:
  `getDashboardDay(date, userId)`,
  `getFoodLogDay(date, userId)`,
  `getDailyTotals(date, userId)`,
  `getActivitiesForDay(date, userId)`.
- Map `profile`, `daily_log`, `meals`, `food_items`, `activities`, `daily_totals`, and `meal_totals` into frontend-friendly types.
- Expose a stable view model so page components do not care whether data came from FastAPI or Supabase.

Notes:
- For prototype speed, frontend anon-key reads are acceptable for approved read-only tables/views.
- Prefer `supabase-js` for clarity unless a lighter REST wrapper proves simpler for this repo.
- The adapter should centralize date formatting, fallback defaults, and `user_id` selection.

### Agent 4: Config, Docs, and Backend Bridge

Owns:
- [frontend/.env.example](/Users/REDONSX1/.codex/worktrees/c054/APEX/frontend/.env.example)
- [backend/.env.example](/Users/REDONSX1/.codex/worktrees/c054/APEX/backend/.env.example)
- [README.md](/Users/REDONSX1/.codex/worktrees/c054/APEX/README.md)
- optional backend config plumbing if a server-side bridge is introduced

Deliverables:
- Document the Supabase prototype env vars and setup flow.
- Add optional backend placeholders for a future secure bridge:
  service-role reads/writes, RPC calls, or row-level policy mediation.
- Make the security split explicit:
  anon key is allowed in frontend env,
  service-role key is backend-only.
- Write contributor notes for how the prototype coexists with the current FastAPI MVP.

Notes:
- This agent does not need to implement the full backend bridge in v1.
- It should prepare the repo so the bridge can be added cleanly later.

## Coordination Checkpoints

### Checkpoint 1: Shared data contract

Agent 3 publishes the Supabase read-model types and adapter signatures.

Blocked until:
- Dashboard UX and Food Log UX agree on the shared shape for:
  selected day,
  calories summary,
  macro progress,
  meal sections,
  activity list.

### Checkpoint 2: Dashboard slice

Agent 1 integrates the new dashboard card stack using Supabase-derived nutrition summaries while keeping the existing training panels intact.

Success criteria:
- richer calorie card
- target/remaining/net view
- day type visible
- macro progress more explicit than the current implementation

### Checkpoint 3: Historical food log slice

Agent 2 lands date navigation and per-day meal/activity reading.

Success criteria:
- previous-day browsing works
- empty meal slots render consistently
- selected-day totals match Supabase-derived values

### Checkpoint 4: Config and handoff

Agent 4 finalizes env examples and README notes so the prototype can be connected to a real Supabase project without tribal knowledge.

## Recommended Implementation Order

1. Save and document the Supabase prototype reference.
2. Add env placeholders and setup notes.
3. Build the shared Supabase adapter and types.
4. Integrate the dashboard calorie/target redesign.
5. Integrate food-log date navigation and daily history.
6. Decide whether non-today logging should be editable or read-only in prototype v1.

## Supabase Connection Inputs Needed

For the frontend prototype:

- Supabase project URL
- Supabase anon key
- prototype `user_id` value

For optional backend bridging later:

- Supabase service-role key

## Environment Variables To Fill

### Frontend

In `frontend/.env`:

```bash
VITE_API_URL="http://localhost:8000/v1"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_USER_ID="sergio"
```

### Backend

In `backend/.env`:

```bash
APEX_SUPABASE_URL="https://your-project-ref.supabase.co"
APEX_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
APEX_SUPABASE_SCHEMA="public"
```

## Security Guidance

- The anon key can be used in the frontend for approved prototype reads.
- The service-role key must stay in the backend only.
- Do not commit real Supabase keys into the repo.
- If the prototype expands beyond read-only access, shift writes and RPC calls behind FastAPI before broadening scope.

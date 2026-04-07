# APEX

APEX is a web MVP for endurance athletes who want nutrition, training, and coaching context in one place. The repo now contains a FastAPI backend plus a React frontend that cover the first shipped slice of the product: onboarding, daily fuelling, Strava-backed training, and a persisted AI coach inbox.

The current build is optimized for local product iteration. It runs fully offline with deterministic mock Strava data by default, but it can also use live provider credentials when they are present in backend configuration.

There is also an in-progress Supabase-backed nutrition prototype in [docs/design/apex-daily-log.jsx](docs/design/apex-daily-log.jsx). That prototype is intended to enrich the dashboard and historical food log without forcing an all-at-once backend migration.

## Key Features / Scope

- Landing page plus authenticated product workspace.
- JWT-based auth with registration, login, refresh, logout, and profile updates.
- Onboarding flow for athlete metrics, sports, goals, and Strava connection.
- `Dashboard` (`/app/today`), `Food Log`, `Training`, `Coach`, and `Settings` app surfaces.
- Collapsible desktop workspace chrome with an icon-only left rail and a toggleable right-side APEX coach panel.
- Nutrition logging by manual entry, voice review, and photo review.
- Dynamic day-type nutrition targets cached per day.
- Strava connection flow with 90-day onboarding import, manual sync, and training load metrics.
- Persisted coach conversations grounded in profile, nutrition, and training context.
- Optional Supabase prototype path for a richer dashboard and direct historical food-log reads.
- Interactive dashboard drilldowns including a metric-switched seven-day trend, expandable meal-slot details, and a viewport-sized APEX loading state with heartbeat motion while historical days are fetched.
- Generated backend OpenAPI document at [backend/openapi.json](backend/openapi.json).
- Generated frontend schema types at [frontend/src/lib/generated/openapi.ts](frontend/src/lib/generated/openapi.ts).

### Explicitly Deferred

- Google Calendar integration
- Apple Health integration
- Wake-word or always-listening voice mode
- Native mobile apps
- Semantic coach memory and pgvector-backed retrieval

## Setup

### Prerequisites

- Python 3.12+ with [`uv`](https://docs.astral.sh/uv/)
- Node.js current LTS with `npm`

### Backend Setup With `uv`

```bash
cd backend
uv venv
source .venv/bin/activate
uv sync
cp .env.example .env
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## How To Run

### Run the backend

```bash
cd backend
uv run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` and the versioned routes live under `http://localhost:8000/v1`.

### Run the frontend

```bash
cd frontend
npm run dev
```

The Vite app will be available at `http://localhost:5173`.

If you open the frontend on `http://127.0.0.1:5173`, the app now mirrors that hostname for the default API fallback so local auth and onboarding still work without extra config.

If the frontend Supabase env vars are present, the authenticated `Dashboard` and `Food Log` pages automatically switch into the nutrition prototype read path.

Desktop workspace note:

- Use the top-left sidebar control to collapse the left navigation into an icon rail.
- Use the top-right panel toggle to open or close the right-side APEX coach panel.
- Settings and logout remain available from the top bar even when the side panels are collapsed.

### Common development commands

Backend:

```bash
cd backend
uv run pytest
uv run ruff check
uv run python -c "from pathlib import Path; import json; from app.main import app; Path('openapi.json').write_text(json.dumps(app.openapi(), indent=2), encoding='utf-8')"
```

Frontend:

```bash
cd frontend
npm test
npm run build
npm run generate:api
```

Design previews:

```bash
cd docs/design
npm install
npm run dev
```

## Vercel Deployment

APEX is intended to run as two separate Vercel projects in the same monorepo:

- `frontend/` -> `apex-web`
- `backend/` -> `apex-api`

The frontend is a Vite SPA, so Vercel needs a rewrite that sends all non-file routes to `index.html`. The backend is a native FastAPI app with [backend/index.py](backend/index.py) exposing the existing FastAPI instance Vercel looks for.

Recommended deployment flow:

```bash
# Link each folder to its own Vercel project
cd frontend
vercel link --yes --scope <team-slug-or-id> --project apex-web

cd ../backend
vercel link --yes --scope <team-slug-or-id> --project apex-api

# Apply the production schema and seed reference foods before first traffic
APEX_DATABASE_URL="postgresql+psycopg://..." uv run alembic upgrade head
APEX_DATABASE_URL="postgresql+psycopg://..." uv run python -m app.bootstrap --seed-foods

# Then deploy each project separately from its own folder
cd ../frontend && vercel deploy --prod -y --scope <team-slug-or-id>
cd ../backend && vercel deploy --prod -y --scope <team-slug-or-id>
```

Production environment variables:

- Frontend: `VITE_API_URL=https://<apex-api-domain>/v1`
- Backend: `APEX_DATABASE_URL` points to Supabase Postgres, plus `APEX_ALLOWED_ORIGINS`, `APEX_FRONTEND_URL`, and provider credentials

Important Vercel notes:

- Production should use Postgres, not the local SQLite default.
- Do not leave `APEX_DATABASE_URL` at `sqlite:///./apex.db` for Vercel. Serverless deployments use a read-only filesystem, so SQLite bootstrap and seed writes will fail at runtime.
- Runtime schema creation is only enabled for local SQLite development; production schema should be applied with Alembic.
- The backend normalizes `postgres://` and `postgresql://` URLs to `postgresql+psycopg://...`, so Supabase-style URLs work cleanly with SQLAlchemy.
- Reference foods should be loaded explicitly with `uv run python -m app.bootstrap --seed-foods` after migrations.
- Preview deployments are deferred until production is stable.
## Configuration

### Backend environment

Copy [backend/.env.example](backend/.env.example) to `backend/.env`.

Important values:

- `APEX_DATABASE_URL`
  Local development defaults to SQLite (`sqlite:///./apex.db`).
  Production uses Supabase Postgres as the system of record.
- `APEX_ALLOWED_ORIGINS`
  Comma-separated CORS origins for the frontend.
  The local defaults include both `http://localhost:5173` and `http://127.0.0.1:5173`.
- `APEX_JWT_SECRET`
  Signing secret for access and refresh tokens.
- `APEX_STRAVA_CLIENT_ID`
- `APEX_STRAVA_CLIENT_SECRET`
- `APEX_STRAVA_REDIRECT_URI`
- `APEX_ANTHROPIC_API_KEY`
- `APEX_OPENAI_API_KEY`
- `APEX_SUPABASE_URL`
- `APEX_SUPABASE_SERVICE_ROLE_KEY`
- `APEX_SUPABASE_SCHEMA`

Notes:

- If Strava credentials are missing, APEX falls back to the deterministic mock provider.
- If Anthropic/OpenAI keys are missing, coach, voice, and photo flows still work through deterministic local fallbacks.
- Keep the Supabase service-role key server-side only.
- Postgres URLs from hosted providers can be supplied as `postgres://...` or `postgresql://...`; the backend normalizes them to the `psycopg` SQLAlchemy dialect automatically.
- Keep the Supabase service-role key server-side only.
- Postgres URLs from hosted providers can be supplied as `postgres://...` or `postgresql://...`; the backend normalizes them to the `psycopg` SQLAlchemy dialect automatically.

### Frontend environment

Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env`.

- `VITE_API_URL`
  Points the React app at the versioned API base.
  When omitted in local development, the frontend falls back to the current browser hostname on port `8000`.
- `VITE_SUPABASE_URL`
  Supabase project URL for the dashboard and historical daily-log prototype.
- `VITE_SUPABASE_ANON_KEY`
  Frontend read-only key for approved prototype queries.
- `VITE_SUPABASE_USER_ID`
  Temporary selector for the `user_id` field used in the provided Supabase schema.

Prototype note:

- The intended split is FastAPI for auth, coach, uploads, and existing MVP flows, with Supabase used as a read model for the richer nutrition dashboard and historical daily log until both paths are unified.
- The current prototype is read-only on the frontend: `/app/today` and `/app/log` read the selected day directly from Supabase when the frontend Supabase env vars are present.
- The dashboard now derives consumed, exercise, and net calories from raw meal and activity rows in the frontend adapter, instead of trusting the optional `daily_totals` aggregate view. This avoids double-counting when the prototype SQL view joins food items and activities in the same grouped query.
- The dashboard display layer now derives an `expected` calorie target as `base target + exercise`, and it rebalances the displayed protein, carb, and fat targets to stay aligned with that total without changing the underlying Supabase rows.
- The macro section on `/app/today` is calculated in the frontend display layer as protein/carbs/fat percentage composition based on the exercise-adjusted expected macro targets for the selected day.
- The manual, voice, and photo meal composer remains the FastAPI-backed MVP path when the Supabase prototype is not enabled.

### Testing the Supabase Prototype

1. Populate `frontend/.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SUPABASE_USER_ID`.
2. Start the frontend with `npm run dev`.
3. Sign in to APEX and finish onboarding if needed.
4. Open `/app/today` to verify the dashboard reads the selected day from Supabase, supports date navigation, and shows the branded APEX loading state while the next day is loading.
5. In `/app/today`, click the seven-day bars to inspect each day and use the metric switch to move between calories, exercise, and training load.
6. In `/app/today`, open the meal-slot rows to inspect the logged food detail inline.
7. Open `/app/log` to verify the historical food-log view, six meal slots, and any linked daily activities from Supabase.
8. Remove the Supabase frontend env vars when you want to return to the original API-backed food composer workflow.

## Project Structure

- [backend](backend)
  FastAPI app, SQLAlchemy models, Alembic migration, tests, and OpenAPI export.
- [backend/app/api.py](backend/app/api.py)
  Public API routes for auth, nutrition, training, coach, and settings.
- [backend/app/services](backend/app/services)
  Domain services for auth, nutrition, training, provider adapters, and coach logic.
- [frontend](frontend)
  Vite + React application, tests, styles, and generated API schema types.
- [frontend/src/app/routes.tsx](frontend/src/app/routes.tsx)
  Top-level route protection and app navigation flow.
- [frontend/src/pages](frontend/src/pages)
  Landing, onboarding, product pages, and Strava callback handling.
- [docs](docs)
  Original product/design documentation plus implementation notes.
- [docs/design](docs/design)
  Standalone JSX design explorations plus a dedicated local preview workspace for rendering them.
- [docs/implementation/APEX_MVP_IMPLEMENTATION.md](docs/implementation/APEX_MVP_IMPLEMENTATION.md)
  Build summary, deferred scope, and local workflow notes for this MVP scaffold.
- [docs/implementation/APEX_SUPABASE_PROTOTYPE_PLAN.md](docs/implementation/APEX_SUPABASE_PROTOTYPE_PLAN.md)
  Parallel implementation plan for the Supabase-backed dashboard and food-log prototype.
- [docs/deployment/VERCEL_DEPLOYMENT.md](docs/deployment/VERCEL_DEPLOYMENT.md)
  Step-by-step production deployment checklist for `apex-web` and `apex-api`.

## Development Notes

- When the backend contract changes, regenerate both [backend/openapi.json](backend/openapi.json) and [frontend/src/lib/generated/openapi.ts](frontend/src/lib/generated/openapi.ts).
- Keep the React UI aligned with the product design docs in `docs/design`.
- Use the `docs/design` preview app when iterating on standalone JSX mockups before promoting a design into `frontend`.
- Keep the README and `docs/implementation` notes updated whenever routes, setup, configuration, or workflow changes.
- The backend currently uses SQLite for zero-friction local development, but the schema and service layout are intended to transfer cleanly to Postgres.
- Vercel production deployment should use the FastAPI backend in `backend/index.py` and the Vite SPA rewrite in `frontend/vercel.json`.
- Before first production traffic, run Alembic against Supabase and then seed reference foods with `uv run python -m app.bootstrap --seed-foods`.

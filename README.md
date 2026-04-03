# APEX

APEX is a web MVP for endurance athletes who want nutrition, training, and coaching context in one place. The repo now contains a FastAPI backend plus a React frontend that cover the first shipped slice of the product: onboarding, daily fuelling, Strava-backed training, and a persisted AI coach inbox.

The current build is optimized for local product iteration. It runs fully offline with deterministic mock Strava data by default, but it can also use live provider credentials when they are present in backend configuration.

## Key Features / Scope

- Landing page plus authenticated product workspace.
- JWT-based auth with registration, login, refresh, logout, and profile updates.
- Onboarding flow for athlete metrics, sports, goals, and Strava connection.
- `Today`, `Food Log`, `Training`, `Coach`, and `Settings` app surfaces.
- Nutrition logging by manual entry, voice review, and photo review.
- Dynamic day-type nutrition targets cached per day.
- Strava connection flow with 90-day onboarding import, manual sync, and training load metrics.
- Persisted coach conversations grounded in profile, nutrition, and training context.
- Generated backend OpenAPI document at [backend/openapi.json](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend/openapi.json).
- Generated frontend schema types at [frontend/src/lib/generated/openapi.ts](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend/src/lib/generated/openapi.ts).

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

## Configuration

### Backend environment

Copy [backend/.env.example](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend/.env.example) to `backend/.env`.

Important values:

- `APEX_DATABASE_URL`
  Local development defaults to SQLite (`sqlite:///./apex.db`).
  Production intent remains Postgres as the system of record.
- `APEX_ALLOWED_ORIGINS`
  Comma-separated CORS origins for the frontend.
- `APEX_JWT_SECRET`
  Signing secret for access and refresh tokens.
- `APEX_STRAVA_CLIENT_ID`
- `APEX_STRAVA_CLIENT_SECRET`
- `APEX_STRAVA_REDIRECT_URI`
- `APEX_ANTHROPIC_API_KEY`
- `APEX_OPENAI_API_KEY`

Notes:

- If Strava credentials are missing, APEX falls back to the deterministic mock provider.
- If Anthropic/OpenAI keys are missing, coach, voice, and photo flows still work through deterministic local fallbacks.

### Frontend environment

Copy [frontend/.env.example](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend/.env.example) to `frontend/.env`.

- `VITE_API_URL`
  Points the React app at the versioned API base.

## Project Structure

- [backend](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend)
  FastAPI app, SQLAlchemy models, Alembic migration, tests, and OpenAPI export.
- [backend/app/api.py](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend/app/api.py)
  Public API routes for auth, nutrition, training, coach, and settings.
- [backend/app/services](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend/app/services)
  Domain services for auth, nutrition, training, provider adapters, and coach logic.
- [frontend](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend)
  Vite + React application, tests, styles, and generated API schema types.
- [frontend/src/app/routes.tsx](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend/src/app/routes.tsx)
  Top-level route protection and app navigation flow.
- [frontend/src/pages](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend/src/pages)
  Landing, onboarding, product pages, and Strava callback handling.
- [docs](/Users/REDONSX1/.codex/worktrees/9f84/APEX/docs)
  Original product/design documentation plus implementation notes.
- [docs/implementation/APEX_MVP_IMPLEMENTATION.md](/Users/REDONSX1/.codex/worktrees/9f84/APEX/docs/implementation/APEX_MVP_IMPLEMENTATION.md)
  Build summary, deferred scope, and local workflow notes for this MVP scaffold.

## Development Notes

- When the backend contract changes, regenerate both [backend/openapi.json](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend/openapi.json) and [frontend/src/lib/generated/openapi.ts](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend/src/lib/generated/openapi.ts).
- Keep the React UI aligned with the product design docs in `docs/design`.
- Keep the README and `docs/implementation` notes updated whenever routes, setup, configuration, or workflow changes.
- The backend currently uses SQLite for zero-friction local development, but the schema and service layout are intended to transfer cleanly to Postgres.

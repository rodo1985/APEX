# APEX MVP Implementation Notes

## What Was Built

This repo now contains the greenfield MVP scaffold that the docs were describing:

- FastAPI backend in [backend](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend)
- React + Vite frontend in [frontend](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend)
- OpenAPI export plus generated frontend schema types
- Automated backend and frontend tests for the main MVP flows

## Backend Coverage

Implemented API groups:

- `auth`
  Register, login, refresh, logout, Strava auth start, Strava callback finish
- `user`
  Profile read/update and avatar upload placeholder flow
- `nutrition`
  Today summary, ranged log read, log create/update/delete, voice parse, photo parse, food search, weekly rollup
- `training`
  Today summary, activities list/detail, Strava sync, load curve, weekly summary
- `coach`
  Text message, voice message, conversation list/detail/delete
- `settings`
  Integration status plus Strava and Google disconnect endpoints

Implementation notes:

- Local development defaults to SQLite for fast onboarding.
- Live Strava sync is supported when credentials exist; otherwise the app uses deterministic mock activities.
- Coach, voice, and photo flows degrade gracefully to deterministic fallback logic when provider keys are missing.

## Frontend Coverage

Implemented routes:

- `/`
- `/login`
- `/register`
- `/onboarding`
- `/auth/strava/callback`
- `/app/today`
- `/app/log`
- `/app/train`
- `/app/coach`
- `/app/settings`

UI notes:

- The landing page and app shell follow the existing design direction from `docs/design`.
- Voice is push-to-talk only in this MVP.
- The food logging UX is review-first: manual, voice, and photo flows all land in the same editable draft before persistence.

## Contract Artifacts

- OpenAPI source: [backend/openapi.json](/Users/REDONSX1/.codex/worktrees/9f84/APEX/backend/openapi.json)
- Generated frontend schema types: [frontend/src/lib/generated/openapi.ts](/Users/REDONSX1/.codex/worktrees/9f84/APEX/frontend/src/lib/generated/openapi.ts)

Recommended workflow after API changes:

```bash
cd backend
uv run python -c "from pathlib import Path; import json; from app.main import app; Path('openapi.json').write_text(json.dumps(app.openapi(), indent=2), encoding='utf-8')"

cd ../frontend
npm run generate:api
```

## Deferred Scope

These areas remain intentionally documented but not implemented in the current build:

- Google Calendar integration beyond deferred status display
- Apple Health integration beyond deferred status display
- Wake-word and background voice listening
- Native mobile applications
- Semantic memory and pgvector-backed coach retrieval

## Validation Commands

Backend:

```bash
cd backend
uv run pytest
uv run ruff check
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

# APEX Vercel Deployment

This document is the production-first deployment checklist for APEX on Vercel.

## Target Topology

- `frontend/` deploys to the Vercel project `apex-web`
- `backend/` deploys to the Vercel project `apex-api`
- Supabase Postgres is the production database

This repo does not use Docker for Vercel deployment. The frontend ships as a native Vite build and the backend ships as a native FastAPI deployment.

## Why This Shape

- Vercel supports Vite SPAs directly when the project includes a rewrite to `index.html`.
- Vercel supports FastAPI directly when the project exports an `app` instance from an expected Python entrypoint such as `index.py`.
- Splitting frontend and backend into two projects keeps the deployment model simple while preserving the existing repo structure.

## Project Preparation Already In Repo

- [frontend/vercel.json](../../frontend/vercel.json)
  Adds the SPA rewrite required for deep links like `/app/today`.
- [backend/index.py](../../backend/index.py)
  Re-exports the FastAPI `app` for Vercel detection.
- [backend/app/main.py](../../backend/app/main.py)
  Limits runtime schema creation and implicit seeding to local SQLite only.
- [backend/app/bootstrap.py](../../backend/app/bootstrap.py)
  Provides the explicit seed command for reference foods after migrations.

## Production Environment Variables

### Frontend

- `VITE_API_URL=https://<apex-api-domain>/v1`

### Backend

- `APEX_DATABASE_URL`
- `APEX_ALLOWED_ORIGINS`
- `APEX_FRONTEND_URL`
- `APEX_JWT_SECRET`
- `APEX_STRAVA_CLIENT_ID`
- `APEX_STRAVA_CLIENT_SECRET`
- `APEX_STRAVA_REDIRECT_URI`
- `APEX_ANTHROPIC_API_KEY`
- `APEX_OPENAI_API_KEY`

## First Production Rollout

### 1. Create the Vercel projects

```bash
cd frontend
vercel link --yes --scope <team-slug-or-id> --project apex-web

cd ../backend
vercel link --yes --scope <team-slug-or-id> --project apex-api
```

### 2. Configure production environment variables in Vercel

- Set `VITE_API_URL` in `apex-web`
- Set all backend env vars in `apex-api`
- Make sure `APEX_ALLOWED_ORIGINS` includes the final frontend URL
- Make sure `APEX_FRONTEND_URL` matches the final frontend URL

### 3. Apply the production database schema

Run migrations against the Supabase database before sending traffic to the backend:

```bash
cd backend
APEX_DATABASE_URL="postgresql+psycopg://..." uv run alembic upgrade head
```

The backend also accepts `postgres://...` and `postgresql://...` inputs and normalizes them to the SQLAlchemy `psycopg` dialect automatically.
Do not leave `APEX_DATABASE_URL` at the local default `sqlite:///./apex.db` on Vercel. Serverless functions run on a read-only filesystem, so SQLite writes and startup seed operations will fail.

### 4. Seed reference foods

```bash
cd backend
APEX_DATABASE_URL="postgresql+psycopg://..." uv run python -m app.bootstrap --seed-foods
```

This step is explicit so production does not depend on cold-start bootstrap logic.

### 5. Deploy the backend

```bash
cd backend
vercel deploy --prod -y --scope <team-slug-or-id>
```

### 6. Deploy the frontend

```bash
cd frontend
vercel deploy --prod -y --scope <team-slug-or-id>
```

## Validation Checklist

- `https://<apex-api-domain>/healthz` returns `200`
- frontend deep links like `/login`, `/register`, `/app/today`, and `/app/settings` resolve correctly
- frontend requests go to the backend URL set in `VITE_API_URL`
- auth and onboarding writes persist in Supabase Postgres
- Strava authorization starts from the frontend callback route

## Local Validation Before Deploying

```bash
cd backend
uv run pytest
uv run ruff check

cd ../frontend
npm test
npm run build
npm run generate:api
```

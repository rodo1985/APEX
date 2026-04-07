# APEX Backend

FastAPI service for the APEX endurance coaching MVP.

## Local Setup

```bash
uv venv
uv sync
cp .env.example .env
```

## Local Run

```bash
uv run uvicorn app.main:app --reload
```

## Validation

```bash
uv run pytest
uv run ruff check
```

## Vercel Notes

- The Vercel entrypoint is [index.py](index.py).
- Local SQLite bootstrap stays enabled for local development only.
- Production schema changes should be applied with Alembic.
- Production reference foods should be loaded with:

```bash
APEX_DATABASE_URL="postgresql+psycopg://..." uv run python -m app.bootstrap --seed-foods
```

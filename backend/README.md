# APEX Backend

FastAPI service for the APEX endurance coaching MVP.

Use `uv sync` in this folder to install dependencies and `uv run uvicorn app.main:app --reload` to run the API locally.

For Vercel production deployments, the backend is exposed through `backend/index.py` and the production schema is applied with Alembic rather than SQLite runtime bootstrap.

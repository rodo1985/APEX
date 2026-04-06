"""Vercel entrypoint for the APEX backend.

This file exposes the existing FastAPI application instance from `app.main`
so Vercel can auto-detect the backend without changing runtime behavior.
"""

from app.main import app


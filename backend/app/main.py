"""FastAPI application entrypoint for the APEX backend."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import router
from app.bootstrap import bootstrap_local_runtime, should_bootstrap_runtime
from app.core.config import get_settings
from app.core.database import engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Initialize database tables and seed development data on app startup.

    Parameters:
        _: The FastAPI application instance supplied by the framework.

    Returns:
        AsyncIterator[None]: A FastAPI lifespan context manager.

    Raises:
        SQLAlchemyError: Propagated if the database cannot be initialized.

    Example:
        >>> callable(lifespan)
        True
    """

    if should_bootstrap_runtime(settings.database_url):
        # Keep the zero-friction local developer experience, but avoid runtime
        # schema creation and implicit seeding in production deployments.
        bootstrap_local_runtime(engine)
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance.

    Parameters:
        None.

    Returns:
        FastAPI: The configured APEX backend application.

    Raises:
        None.

    Example:
        >>> app = create_app()
        >>> app.title
        'APEX API'
    """

    app = FastAPI(title=settings.project_name, version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix=settings.api_prefix)

    @app.get("/healthz")
    def healthcheck() -> dict[str, str]:
        """Return a lightweight health response for local orchestration."""

        return {"status": "ok"}

    @app.exception_handler(HTTPException)
    async def handle_http_exception(_: object, exc: HTTPException) -> JSONResponse:
        """Wrap FastAPI HTTP exceptions in the documented API error envelope."""

        detail = (
            exc.detail
            if isinstance(exc.detail, dict)
            else {"code": "REQUEST_ERROR", "message": str(exc.detail), "details": {}}
        )
        return JSONResponse(status_code=exc.status_code, content={"error": detail})

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: object, exc: RequestValidationError) -> JSONResponse:
        """Return request validation failures using the shared error schema."""

        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request body failed schema validation.",
                    "details": {"issues": exc.errors()},
                }
            },
        )

    return app


app = create_app()

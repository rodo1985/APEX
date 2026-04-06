"""Shared pytest fixtures for APEX backend tests."""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

import app.main as main_module
from app.core.database import Base, get_db
from app.main import create_app
from app.services.nutrition import seed_food_items


def build_test_engine(database_path: Path) -> Engine:
    """Create a SQLite engine configured for FastAPI test clients.

    Parameters:
        database_path: The filesystem path for the temporary SQLite database.

    Returns:
        Engine: A SQLAlchemy engine that supports cross-thread request access.

    Raises:
        SQLAlchemyError: Propagated if engine creation fails.

    Example:
        >>> engine = build_test_engine(Path("test.db"))
        >>> engine.url.drivername
        'sqlite'
    """

    return create_engine(
        f"sqlite:///{database_path}",
        future=True,
        connect_args={"check_same_thread": False},
    )


@pytest.fixture()
def session_factory(tmp_path: Path) -> Generator[sessionmaker[Session], None, None]:
    """Yield a session factory backed by an isolated SQLite test database.

    Parameters:
        tmp_path: Pytest-managed temporary directory for test-local files.

    Returns:
        Generator[sessionmaker[Session], None, None]: A configured session factory.

    Raises:
        SQLAlchemyError: Propagated if the database schema cannot be created.

    Example:
        >>> callable(session_factory)  # doctest: +SKIP
        True
    """

    engine = build_test_engine(tmp_path / "apex-test.db")
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )

    with factory() as session:
        seed_food_items(session)

    yield factory

    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(session_factory: sessionmaker[Session]) -> Generator[Session, None, None]:
    """Yield a database session for direct service-level tests.

    Parameters:
        session_factory: The session factory built for the current test.

    Returns:
        Generator[Session, None, None]: An open SQLAlchemy session.

    Raises:
        SQLAlchemyError: Propagated if the session fails during use.

    Example:
        >>> isinstance(db_session, Session)  # doctest: +SKIP
        True
    """

    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(session_factory: sessionmaker[Session]) -> Generator[TestClient, None, None]:
    """Yield a FastAPI test client wired to the isolated test database.

    Parameters:
        session_factory: The session factory built for the current test.

    Returns:
        Generator[TestClient, None, None]: A configured FastAPI test client.

    Raises:
        SQLAlchemyError: Propagated if request handling touches an invalid session.

    Example:
        >>> hasattr(client, "get")  # doctest: +SKIP
        True
    """

    test_engine = session_factory.kw["bind"]
    original_engine = main_module.engine
    main_module.engine = test_engine
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        """Yield request-scoped sessions from the isolated test database.

        Parameters:
            None.

        Returns:
            Generator[Session, None, None]: A SQLAlchemy session bound to the test engine.

        Raises:
            SQLAlchemyError: Propagated if the session fails during request handling.

        Example:
            >>> next(override_get_db())  # doctest: +SKIP
        """

        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    main_module.engine = original_engine

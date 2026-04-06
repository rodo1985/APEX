"""Deployment-oriented tests for configuration and bootstrap helpers."""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session

from app.bootstrap import seed_reference_foods, should_bootstrap_runtime
from app.core.config import Settings
from app.core.database import Base
from app.models import FoodItem
from app.seed import FOOD_SEED


def test_should_bootstrap_runtime_only_for_sqlite() -> None:
    """Verify automatic bootstrap stays limited to local SQLite databases.

    Parameters:
        None.

    Returns:
        None.

    Raises:
        AssertionError: Raised when production databases would bootstrap at runtime.

    Example:
        >>> test_should_bootstrap_runtime_only_for_sqlite()  # doctest: +SKIP
    """

    assert should_bootstrap_runtime("sqlite:///./apex.db") is True
    assert should_bootstrap_runtime("postgresql+psycopg://user:pass@db/apex") is False


def test_settings_normalize_postgres_urls_to_psycopg() -> None:
    """Verify deployment URLs are normalized to SQLAlchemy's psycopg dialect.

    Parameters:
        None.

    Returns:
        None.

    Raises:
        AssertionError: Raised when Postgres URLs keep an incompatible dialect prefix.

    Example:
        >>> test_settings_normalize_postgres_urls_to_psycopg()  # doctest: +SKIP
    """

    assert Settings(database_url="postgres://user:pass@db/apex").database_url == (
        "postgresql+psycopg://user:pass@db/apex"
    )
    assert Settings(database_url="postgresql://user:pass@db/apex").database_url == (
        "postgresql+psycopg://user:pass@db/apex"
    )


def test_seed_reference_foods_populates_empty_database(tmp_path: Path) -> None:
    """Verify the explicit seed command can prepare a migrated empty database.

    Parameters:
        tmp_path: Pytest-managed temporary directory for the SQLite test database.

    Returns:
        None.

    Raises:
        AssertionError: Raised when the seed command does not load reference foods.

    Example:
        >>> test_seed_reference_foods_populates_empty_database(Path("."))  # doctest: +SKIP
    """

    seed_engine = create_engine(
        f"sqlite:///{tmp_path / 'seed-test.db'}",
        future=True,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=seed_engine)

    with Session(bind=seed_engine) as session:
        assert session.scalar(select(func.count()).select_from(FoodItem)) == 0

    seed_reference_foods(seed_engine)

    with Session(bind=seed_engine) as session:
        assert session.scalar(select(func.count()).select_from(FoodItem)) == len(FOOD_SEED)

    Base.metadata.drop_all(bind=seed_engine)
    seed_engine.dispose()

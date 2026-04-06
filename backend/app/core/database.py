"""Database configuration helpers for SQLAlchemy sessions and metadata."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Base declarative model for all SQLAlchemy ORM tables.

    Parameters:
        DeclarativeBase: SQLAlchemy's declarative root type.

    Returns:
        Base: A metadata-bearing base class for ORM models.

    Raises:
        None.

    Example:
        >>> class Example(Base):
        ...     __tablename__ = "examples"
    """


def _engine_kwargs(database_url: str) -> dict[str, object]:
    """Build engine keyword arguments with SQLite-safe defaults.

    Parameters:
        database_url: The SQLAlchemy database URL being used by the backend.

    Returns:
        dict[str, object]: Keyword arguments passed to `create_engine`.

    Raises:
        None.

    Example:
        >>> _engine_kwargs("sqlite:///./apex.db")["connect_args"]
        {'check_same_thread': False}
    """

    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}
    return {}


settings = get_settings()
engine = create_engine(settings.database_url, future=True, **_engine_kwargs(settings.database_url))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a request-scoped SQLAlchemy session.

    Parameters:
        None.

    Returns:
        Generator[Session, None, None]: An open SQLAlchemy session for route handlers.

    Raises:
        SQLAlchemyError: Propagated by SQLAlchemy if session usage fails.

    Example:
        >>> db = next(get_db())
        >>> isinstance(db, Session)
        True
    """

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

"""Bootstrap helpers for local SQLite startup and production reference data.

The backend keeps local development friction low by auto-creating the SQLite
schema and default food database at startup. Production should be stricter:
schema changes come from Alembic and seed/reference data is loaded through an
explicit one-off command.
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.core.database import Base, engine
from app.services.nutrition import seed_food_items


def should_bootstrap_runtime(database_url: str) -> bool:
    """Return whether automatic runtime bootstrap is safe for the database URL.

    Parameters:
        database_url: The configured SQLAlchemy database URL.

    Returns:
        bool: ``True`` for local SQLite databases, otherwise ``False``.

    Raises:
        None.

    Example:
        >>> should_bootstrap_runtime("sqlite:///./apex.db")
        True
    """

    # Runtime bootstrap stays intentionally narrow so production databases only
    # change through reviewed migration and seed commands.
    return database_url.startswith("sqlite")


def bootstrap_local_runtime(bind_engine: Engine) -> None:
    """Create the local schema and reference foods for SQLite development.

    Parameters:
        bind_engine: The SQLAlchemy engine that should receive the schema.

    Returns:
        None.

    Raises:
        SQLAlchemyError: Propagated if schema creation or seeding fails.

    Example:
        >>> callable(bootstrap_local_runtime)
        True
    """

    Base.metadata.create_all(bind=bind_engine)
    seed_reference_foods(bind_engine)


def seed_reference_foods(bind_engine: Engine) -> None:
    """Seed searchable reference foods into an already-migrated database.

    Parameters:
        bind_engine: The SQLAlchemy engine whose database should be seeded.

    Returns:
        None.

    Raises:
        SQLAlchemyError: Propagated if the seed transaction fails.

    Example:
        >>> callable(seed_reference_foods)
        True
    """

    with Session(bind=bind_engine) as session:
        seed_food_items(session)


def build_parser() -> argparse.ArgumentParser:
    """Build the CLI parser used for one-off bootstrap tasks.

    Parameters:
        None.

    Returns:
        argparse.ArgumentParser: The configured argument parser.

    Raises:
        None.

    Example:
        >>> isinstance(build_parser().prog, str)
        True
    """

    parser = argparse.ArgumentParser(
        description="Bootstrap explicit reference data for an already-migrated APEX database."
    )
    parser.add_argument(
        "--seed-foods",
        action="store_true",
        help="Insert the default searchable food catalog when it is missing.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run the bootstrap CLI for explicit production-safe seed operations.

    Parameters:
        argv: Optional command-line arguments for tests or embedding.

    Returns:
        int: Process exit code ``0`` on success.

    Raises:
        SystemExit: Raised by ``argparse`` when invalid arguments are supplied.

    Example:
        >>> main(["--seed-foods"])
        0
    """

    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)

    if not args.seed_foods:
        parser.error("No bootstrap task selected. Use --seed-foods.")

    seed_reference_foods(engine)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Authentication and profile helpers for the APEX backend."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Goal, RefreshSession, User
from app.schemas import GoalRead, MacroTargets, RegisterRequest, RegisterResponse, UserProfileRead

settings = get_settings()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Return a user record matching the supplied email address.

    Parameters:
        db: The active SQLAlchemy session.
        email: The unique email address to search for.

    Returns:
        User | None: The matching user record or `None` when no user exists.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> isinstance(email, str)
        True
    """

    return db.scalar(select(User).where(User.email == email))


def serialize_goal(goal: Goal | None) -> GoalRead | None:
    """Convert an ORM goal into the embedded response shape used by the frontend.

    Parameters:
        goal: The active goal row or `None`.

    Returns:
        GoalRead | None: A serializable goal response or `None`.

    Raises:
        ValidationError: Raised by Pydantic if the ORM object is malformed.

    Example:
        >>> serialize_goal(None) is None
        True
    """

    if goal is None:
        return None
    return GoalRead.model_validate(goal)


def serialize_user(user: User) -> UserProfileRead:
    """Convert a user ORM object into the API's profile response shape.

    Parameters:
        user: The user ORM object that should be exposed to the API client.

    Returns:
        UserProfileRead: The serialized public profile payload.

    Raises:
        ValidationError: Raised by Pydantic if required fields are missing.

    Example:
        >>> hasattr(user, "email")
        True
    """

    return UserProfileRead(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        sports_json=user.sports_json,
        ftp=user.ftp,
        lthr=user.lthr,
        weight_kg=user.weight_kg,
        height_cm=user.height_cm,
        daily_calorie_target=user.daily_calorie_target,
        macro_targets=MacroTargets(
            protein_g=user.protein_target_g,
            carbs_g=user.carbs_target_g,
            fat_g=user.fat_target_g,
        ),
        timezone=user.timezone,
        created_at=user.created_at,
        active_goal=serialize_goal(user.goal),
    )


def _issue_auth_pair(db: Session, user: User) -> tuple[str, str, int]:
    """Create and persist a fresh access/refresh token pair for a user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who should receive a new session.

    Returns:
        tuple[str, str, int]: The access token, refresh token, and access expiry in seconds.

    Raises:
        SQLAlchemyError: Propagated if the refresh session cannot be persisted.

    Example:
        >>> hasattr(user, "id")
        True
    """

    access_token, _, _ = create_access_token(user.id)
    refresh_token, token_id, refresh_expires_at = create_refresh_token(user.id)
    db.add(
        RefreshSession(
            user_id=user.id,
            token_id=token_id,
            expires_at=refresh_expires_at,
        )
    )
    db.commit()
    return access_token, refresh_token, settings.access_token_minutes * 60


def register_user(db: Session, payload: RegisterRequest) -> RegisterResponse:
    """Create a user account and issue the initial authentication tokens.

    Parameters:
        db: The active SQLAlchemy session.
        payload: The validated registration request payload.

    Returns:
        RegisterResponse: The created user and token pair.

    Raises:
        ValueError: Raised when the email is already registered.

    Example:
        >>> payload.email.endswith("@example.com")
        True
    """

    if get_user_by_email(db, payload.email):
        raise ValueError("A user with this email already exists.")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token, refresh_token, expires_in = _issue_auth_pair(db, user)
    return RegisterResponse(
        user_id=user.id,
        email=user.email,
        name=user.name,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate a user by email and password.

    Parameters:
        db: The active SQLAlchemy session.
        email: The email address provided at login.
        password: The plaintext password provided at login.

    Returns:
        User: The authenticated user ORM object.

    Raises:
        ValueError: Raised when the credentials are invalid.

    Example:
        >>> isinstance(email, str) and isinstance(password, str)
        True
    """

    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise ValueError("Invalid email or password.")
    return user


def issue_login_tokens(db: Session, user: User) -> dict[str, object]:
    """Create a fresh token pair for a successfully authenticated user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user ORM object.

    Returns:
        dict[str, object]: A serialized token response payload.

    Raises:
        SQLAlchemyError: Propagated if the refresh session cannot be stored.

    Example:
        >>> hasattr(user, "id")
        True
    """

    access_token, refresh_token, expires_in = _issue_auth_pair(db, user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": expires_in,
    }


def rotate_refresh_token(db: Session, refresh_token: str) -> dict[str, object]:
    """Validate a refresh token and rotate it into a new access/refresh pair.

    Parameters:
        db: The active SQLAlchemy session.
        refresh_token: The encoded refresh token supplied by the client.

    Returns:
        dict[str, object]: A new token response payload.

    Raises:
        ValueError: Raised when the refresh token is invalid, expired, or revoked.

    Example:
        >>> isinstance(refresh_token, str)
        True
    """

    payload = decode_token(refresh_token, expected_type="refresh")
    token_id = payload["jti"]
    session_row = db.scalar(select(RefreshSession).where(RefreshSession.token_id == token_id))
    if session_row is None or session_row.revoked_at is not None:
        raise ValueError("Refresh token has been revoked.")
    if session_row.expires_at < datetime.now(tz=UTC):
        raise ValueError("Refresh token has expired.")

    user = db.get(User, payload["sub"])
    if user is None:
        raise ValueError("User no longer exists.")

    session_row.revoked_at = datetime.now(tz=UTC)
    db.add(session_row)
    db.commit()
    return issue_login_tokens(db, user)


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    """Invalidate the supplied refresh token if it is still active.

    Parameters:
        db: The active SQLAlchemy session.
        refresh_token: The encoded refresh token to revoke.

    Returns:
        None.

    Raises:
        ValueError: Raised when the supplied token is invalid.

    Example:
        >>> isinstance(refresh_token, str)
        True
    """

    payload = decode_token(refresh_token, expected_type="refresh")
    session_row = db.scalar(select(RefreshSession).where(RefreshSession.token_id == payload["jti"]))
    if session_row is None:
        raise ValueError("Refresh token could not be found.")
    session_row.revoked_at = datetime.now(tz=UTC)
    db.add(session_row)
    db.commit()


def get_user_from_access_token(db: Session, token: str) -> User:
    """Resolve the authenticated user from an access token.

    Parameters:
        db: The active SQLAlchemy session.
        token: The encoded access token from the Authorization header.

    Returns:
        User: The authenticated user ORM object.

    Raises:
        ValueError: Raised when the token is invalid or the user no longer exists.

    Example:
        >>> isinstance(token, str)
        True
    """

    payload = decode_token(token, expected_type="access")
    user = db.get(User, payload["sub"])
    if user is None:
        raise ValueError("Authenticated user does not exist.")
    return user

"""Security utilities for password hashing and token handling."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import jwt
from jwt import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import get_settings

password_hasher = PasswordHash.recommended()
settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a raw password using the configured password hasher.

    Parameters:
        password: The raw password submitted by the user.

    Returns:
        str: A salted and hashed password string safe to persist.

    Raises:
        ValueError: Raised by the hashing library for unsupported inputs.

    Example:
        >>> hashed = hash_password("secret-pass")
        >>> hashed != "secret-pass"
        True
    """

    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a user-supplied password against the stored hash.

    Parameters:
        password: The plaintext password to verify.
        hashed_password: The previously stored password hash.

    Returns:
        bool: `True` when the password matches the stored hash.

    Raises:
        ValueError: Raised by the hashing library if the stored hash is invalid.

    Example:
        >>> hashed = hash_password("secret-pass")
        >>> verify_password("secret-pass", hashed)
        True
    """

    return password_hasher.verify(password, hashed_password)


def _build_token(
    subject: str, token_type: str, expires_delta: timedelta
) -> tuple[str, str, datetime]:
    """Create a signed JWT and return it with metadata needed for persistence.

    Parameters:
        subject: The user identifier to place in the token subject claim.
        token_type: The token type, such as `access` or `refresh`.
        expires_delta: How long the token remains valid from creation time.

    Returns:
        tuple[str, str, datetime]: The encoded JWT, the generated token identifier, and
            the UTC expiration timestamp.

    Raises:
        jwt.PyJWTError: Raised if token encoding fails.

    Example:
        >>> token, token_id, expires_at = _build_token("user-1", "access", timedelta(minutes=5))
        >>> token_id != ""
        True
    """

    issued_at = datetime.now(tz=UTC)
    expires_at = issued_at + expires_delta
    token_id = str(uuid4())
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": token_id,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, token_id, expires_at


def create_access_token(subject: str) -> tuple[str, str, datetime]:
    """Create a signed access token for the supplied user identifier.

    Parameters:
        subject: The user identifier stored in the JWT subject claim.

    Returns:
        tuple[str, str, datetime]: The encoded token, token id, and expiration timestamp.

    Raises:
        jwt.PyJWTError: Raised if token encoding fails.

    Example:
        >>> token, _, _ = create_access_token("user-1")
        >>> isinstance(token, str)
        True
    """

    return _build_token(subject, "access", timedelta(minutes=settings.access_token_minutes))


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    """Create a signed refresh token for the supplied user identifier.

    Parameters:
        subject: The user identifier stored in the JWT subject claim.

    Returns:
        tuple[str, str, datetime]: The encoded token, token id, and expiration timestamp.

    Raises:
        jwt.PyJWTError: Raised if token encoding fails.

    Example:
        >>> token, _, _ = create_refresh_token("user-1")
        >>> isinstance(token, str)
        True
    """

    return _build_token(subject, "refresh", timedelta(days=settings.refresh_token_days))


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    """Decode and validate a signed JWT.

    Parameters:
        token: The encoded JWT string to validate.
        expected_type: Optional token type that must match the payload.

    Returns:
        dict[str, Any]: The decoded JWT payload.

    Raises:
        ValueError: Raised when the token is invalid or the expected type does not match.

    Example:
        >>> token, _, _ = create_access_token("user-1")
        >>> decode_token(token, expected_type="access")["sub"]
        'user-1'
    """

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError as exc:
        raise ValueError("Invalid authentication token.") from exc

    if expected_type and payload.get("type") != expected_type:
        raise ValueError("Unexpected token type.")
    return payload

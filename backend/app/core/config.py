"""Application configuration for the APEX backend."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Load environment-backed settings for local development and deployment.

    Parameters:
        BaseSettings: Pydantic's settings loader reads values from environment variables
            and `.env` files automatically.

    Returns:
        Settings: A validated settings object shared across the backend.

    Raises:
        ValidationError: Raised by Pydantic when environment values cannot be coerced.

    Example:
        >>> settings = Settings()
        >>> settings.api_prefix
        '/v1'
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APEX_",
        extra="ignore",
    )

    project_name: str = "APEX API"
    api_prefix: str = "/v1"
    database_url: str = "sqlite:///./apex.db"
    frontend_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    jwt_secret: str = Field(
        default="apex-dev-secret-change-me-32chars",
        description="Signing secret used for access and refresh JWTs.",
    )
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    refresh_token_days: int = 30
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    strava_client_id: str = ""
    strava_client_secret: str = ""
    strava_redirect_uri: str = "http://localhost:8000/v1/auth/strava/callback"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        """Normalize Postgres URLs to SQLAlchemy's psycopg driver format.

        Parameters:
            value: The raw database URL supplied through environment or init.

        Returns:
            object: The normalized database URL, or the original value when it
                is already valid or non-string.

        Raises:
            None.

        Example:
            >>> Settings.normalize_database_url("postgresql://user:pass@db/apex")
            'postgresql+psycopg://user:pass@db/apex'
        """

        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://") and not value.startswith("postgresql+"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origins(self) -> list[str]:
        """Return the configured CORS origins as a clean list.

        Parameters:
            self: The settings instance containing a comma-separated string.

        Returns:
            list[str]: Origins trimmed and filtered for empty values.

        Raises:
            None.

        Example:
            >>> Settings(allowed_origins="http://localhost:5173,https://apex.app").cors_origins
            ['http://localhost:5173', 'https://apex.app']
        """

        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance for the process lifetime.

    Parameters:
        None.

    Returns:
        Settings: The shared backend settings instance.

    Raises:
        ValidationError: Propagated if the settings object cannot be created.

    Example:
        >>> settings = get_settings()
        >>> bool(settings.project_name)
        True
    """

    return Settings()

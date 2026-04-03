"""Application configuration for the APEX backend."""

from functools import lru_cache

from pydantic import Field
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
    allowed_origins: str = "http://localhost:5173"
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

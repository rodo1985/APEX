"""External provider adapters and deterministic local-development fallbacks."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Protocol
from urllib.parse import urlencode

import httpx

from app.core.config import Settings, get_settings
from app.seed import build_mock_strava_activities


@dataclass(slots=True)
class StravaAuthResult:
    """Represent the normalized result of a Strava OAuth callback."""

    athlete_id: str
    athlete_name: str
    access_token: str | None = None
    refresh_token: str | None = None


class StravaProvider(Protocol):
    """Define the provider interface used by training services."""

    def build_authorize_url(self, redirect_uri: str) -> str:
        """Build the URL that starts the Strava authorization flow."""

    def exchange_code(self, code: str) -> StravaAuthResult:
        """Exchange an OAuth code for athlete information and access tokens."""

    def fetch_recent_activities(self, days_back: int) -> list[dict[str, object]]:
        """Fetch normalized activities for the requested history window."""

    def fetch_history(self, days_back: int = 90) -> list[dict[str, object]]:
        """Fetch normalized activities for onboarding history import."""


class MockStravaProvider:
    """Provide deterministic Strava-like behavior without external credentials."""

    def build_authorize_url(self, redirect_uri: str) -> str:
        """Return a fake redirect that loops through the local callback path.

        Parameters:
            redirect_uri: The frontend or backend callback URI used during local auth.

        Returns:
            str: A URL containing a synthetic authorization code.

        Raises:
            None.

        Example:
            >>> "code=mock-code" in MockStravaProvider().build_authorize_url("http://localhost")
            True
        """

        separator = "&" if "?" in redirect_uri else "?"
        return f"{redirect_uri}{separator}code=mock-code&state=mock-state&mock=1"

    def exchange_code(self, code: str) -> StravaAuthResult:
        """Return a stable mock athlete result for local development.

        Parameters:
            code: The OAuth code returned from the mock redirect.

        Returns:
            StravaAuthResult: Mock athlete metadata and placeholder tokens.

        Raises:
            ValueError: Raised when a blank code is supplied unexpectedly.

        Example:
            >>> MockStravaProvider().exchange_code("mock-code").athlete_name
            'APEX Demo Athlete'
        """

        if not code:
            raise ValueError("A Strava code is required to complete the mock flow.")
        return StravaAuthResult(
            athlete_id="mock-athlete-1",
            athlete_name="APEX Demo Athlete",
            access_token="mock-access-token",
            refresh_token="mock-refresh-token",
        )

    def fetch_recent_activities(self, days_back: int) -> list[dict[str, object]]:
        """Return synthetic activities for the requested recent history window.

        Parameters:
            days_back: Number of prior days to include.

        Returns:
            list[dict[str, object]]: Normalized activity payloads.

        Raises:
            None.

        Example:
            >>> len(MockStravaProvider().fetch_recent_activities(14)) > 0
            True
        """

        return build_mock_strava_activities(days=days_back)

    def fetch_history(self, days_back: int = 90) -> list[dict[str, object]]:
        """Return onboarding history using the same stable synthetic data source.

        Parameters:
            days_back: Number of historical days to synthesize.

        Returns:
            list[dict[str, object]]: Normalized activity payloads.

        Raises:
            None.

        Example:
            >>> len(MockStravaProvider().fetch_history()) > 0
            True
        """

        return build_mock_strava_activities(days=days_back)


class LiveStravaProvider:
    """Call the real Strava API when credentials are configured."""

    def __init__(self, settings: Settings) -> None:
        """Store the settings object required for live Strava API requests.

        Parameters:
            settings: The validated application settings with Strava credentials.

        Returns:
            None.

        Raises:
            ValueError: Raised when required credentials are missing.

        Example:
            >>> settings = get_settings()
            >>> isinstance(LiveStravaProvider(settings).settings.frontend_url, str)
            True
        """

        if not settings.strava_client_id or not settings.strava_client_secret:
            raise ValueError("Live Strava integration requires a client id and client secret.")
        self.settings = settings

    def build_authorize_url(self, redirect_uri: str) -> str:
        """Build the real Strava OAuth consent URL.

        Parameters:
            redirect_uri: The callback URI registered with Strava.

        Returns:
            str: The full Strava authorization URL.

        Raises:
            None.

        Example:
            >>> provider = LiveStravaProvider(get_settings())
            >>> "oauth/authorize" in provider.build_authorize_url("http://localhost")
            True
        """

        query = urlencode(
            {
                "client_id": self.settings.strava_client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "read,activity:read_all",
                "approval_prompt": "auto",
            }
        )
        return f"https://www.strava.com/oauth/authorize?{query}"

    def exchange_code(self, code: str) -> StravaAuthResult:
        """Exchange a real Strava OAuth code for athlete metadata and tokens.

        Parameters:
            code: The authorization code returned by Strava.

        Returns:
            StravaAuthResult: The normalized athlete metadata and tokens.

        Raises:
            HTTPStatusError: Raised when Strava rejects the code or credentials.

        Example:
            >>> provider = LiveStravaProvider(get_settings())
            >>> isinstance(provider.settings.strava_client_id, str)
            True
        """

        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                "https://www.strava.com/oauth/token",
                data={
                    "client_id": self.settings.strava_client_id,
                    "client_secret": self.settings.strava_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                },
            )
            response.raise_for_status()
            payload = response.json()
        athlete = payload["athlete"]
        return StravaAuthResult(
            athlete_id=str(athlete["id"]),
            athlete_name=athlete["firstname"] + " " + athlete["lastname"],
            access_token=payload.get("access_token"),
            refresh_token=payload.get("refresh_token"),
        )

    def _fetch_activities(self, days_back: int) -> list[dict[str, object]]:
        """Fetch activities from Strava and normalize them into local payloads.

        Parameters:
            days_back: Number of prior days to request from Strava.

        Returns:
            list[dict[str, object]]: Normalized local activity payloads.

        Raises:
            RuntimeError: Raised because live activity sync requires a stored user token.

        Example:
            >>> provider = LiveStravaProvider(get_settings())
            >>> isinstance(provider.settings.strava_redirect_uri, str)
            True
        """

        raise RuntimeError(
            "Live Strava activity sync requires a stored access token and is handled by the "
            "training service after OAuth connection."
        )

    def fetch_recent_activities(self, days_back: int) -> list[dict[str, object]]:
        """Delegate to the activity fetch helper for recent sync requests.

        Parameters:
            days_back: Number of days of history to request.

        Returns:
            list[dict[str, object]]: Normalized activity payloads.

        Raises:
            RuntimeError: Raised until the training service injects a user token.

        Example:
            >>> provider = LiveStravaProvider(get_settings())
            >>> isinstance(days_back := 7, int)
            True
        """

        return self._fetch_activities(days_back)

    def fetch_history(self, days_back: int = 90) -> list[dict[str, object]]:
        """Delegate to the activity fetch helper for onboarding history imports.

        Parameters:
            days_back: Number of historical days to request.

        Returns:
            list[dict[str, object]]: Normalized activity payloads.

        Raises:
            RuntimeError: Raised until the training service injects a user token.

        Example:
            >>> provider = LiveStravaProvider(get_settings())
            >>> provider.settings.strava_client_secret != ""
            True
        """

        return self._fetch_activities(days_back)


def get_strava_provider(settings: Settings | None = None) -> StravaProvider:
    """Return the best Strava provider available for the current environment.

    Parameters:
        settings: Optional settings object to avoid repeated lookups in call sites.

    Returns:
        StravaProvider: A live provider when credentials exist, otherwise a mock provider.

    Raises:
        None.

    Example:
        >>> provider = get_strava_provider()
        >>> provider is not None
        True
    """

    resolved_settings = settings or get_settings()
    if resolved_settings.strava_client_id and resolved_settings.strava_client_secret:
        return LiveStravaProvider(resolved_settings)
    return MockStravaProvider()


def parse_text_into_meal(
    transcript: str,
    meal_type_hint: str | None = None,
) -> tuple[dict[str, object], float]:
    """Convert a free-form transcript into a deterministic parsed meal suggestion.

    Parameters:
        transcript: The user transcript or description to interpret.
        meal_type_hint: Optional frontend hint used to keep the detected meal category stable.

    Returns:
        tuple[dict[str, object], float]: A parsed-meal payload and a confidence score.

    Raises:
        None.

    Example:
        >>> meal, confidence = parse_text_into_meal("oats with banana and honey")
        >>> meal["meal_name"]
        'Overnight oats with banana'
    """

    lowered = transcript.lower().strip()
    meal_type = meal_type_hint or "lunch"

    if "oat" in lowered or "banana" in lowered:
        return (
            {
                "meal_name": "Overnight oats with banana",
                "meal_type": meal_type_hint or "breakfast",
                "ingredients": [
                    {
                        "name": "Rolled oats",
                        "quantity_g": 60,
                        "calories": 233.4,
                        "protein_g": 10.1,
                        "carbs_g": 39.8,
                        "fat_g": 4.1,
                    },
                    {
                        "name": "Banana",
                        "quantity_g": 120,
                        "calories": 106.8,
                        "protein_g": 1.3,
                        "carbs_g": 27.4,
                        "fat_g": 0.4,
                    },
                    {
                        "name": "Honey",
                        "quantity_g": 15,
                        "calories": 45.6,
                        "protein_g": 0.0,
                        "carbs_g": 12.4,
                        "fat_g": 0.0,
                    },
                ],
            },
            0.93,
        )
    if "chicken" in lowered or "rice" in lowered:
        return (
            {
                "meal_name": "Chicken rice bowl",
                "meal_type": meal_type,
                "ingredients": [
                    {
                        "name": "Chicken breast, cooked",
                        "quantity_g": 150,
                        "calories": 247.5,
                        "protein_g": 46.5,
                        "carbs_g": 0.0,
                        "fat_g": 5.4,
                    },
                    {
                        "name": "White rice, cooked",
                        "quantity_g": 180,
                        "calories": 234.0,
                        "protein_g": 4.9,
                        "carbs_g": 50.4,
                        "fat_g": 0.5,
                    },
                    {
                        "name": "Mixed greens",
                        "quantity_g": 60,
                        "calories": 10.2,
                        "protein_g": 1.1,
                        "carbs_g": 1.8,
                        "fat_g": 0.2,
                    },
                ],
            },
            0.89,
        )
    if "shake" in lowered or "protein" in lowered:
        return (
            {
                "meal_name": "Recovery protein shake",
                "meal_type": meal_type_hint or "snack",
                "ingredients": [
                    {
                        "name": "Whey protein",
                        "quantity_g": 35,
                        "calories": 140.0,
                        "protein_g": 28.0,
                        "carbs_g": 3.5,
                        "fat_g": 1.8,
                    },
                    {
                        "name": "Banana",
                        "quantity_g": 120,
                        "calories": 106.8,
                        "protein_g": 1.3,
                        "carbs_g": 27.4,
                        "fat_g": 0.4,
                    },
                ],
            },
            0.87,
        )
    if "egg" in lowered or "toast" in lowered or "sourdough" in lowered:
        return (
            {
                "meal_name": "Eggs on sourdough toast",
                "meal_type": meal_type_hint or "breakfast",
                "ingredients": [
                    {
                        "name": "Eggs",
                        "quantity_g": 120,
                        "calories": 171.6,
                        "protein_g": 15.1,
                        "carbs_g": 0.8,
                        "fat_g": 11.4,
                    },
                    {
                        "name": "Sourdough bread",
                        "quantity_g": 70,
                        "calories": 202.3,
                        "protein_g": 6.4,
                        "carbs_g": 39.5,
                        "fat_g": 1.6,
                    },
                ],
            },
            0.86,
        )
    return (
        {
            "meal_name": "Mixed athlete meal",
            "meal_type": meal_type,
            "ingredients": [
                {
                    "name": "Greek yogurt",
                    "quantity_g": 180,
                    "calories": 174.6,
                    "protein_g": 18.0,
                    "carbs_g": 7.0,
                    "fat_g": 9.0,
                },
                {
                    "name": "Berries",
                    "quantity_g": 100,
                    "calories": 57.0,
                    "protein_g": 0.7,
                    "carbs_g": 14.0,
                    "fat_g": 0.3,
                },
                {
                    "name": "Granola",
                    "quantity_g": 40,
                    "calories": 188.4,
                    "protein_g": 4.0,
                    "carbs_g": 25.6,
                    "fat_g": 8.0,
                },
            ],
        },
        0.72,
    )


def build_photo_meal(meal_type_hint: str | None = None) -> tuple[dict[str, object], float]:
    """Return a deterministic photo-analysis result for local development mode.

    Parameters:
        meal_type_hint: Optional meal type chosen by the user before confirmation.

    Returns:
        tuple[dict[str, object], float]: A parsed-meal payload and confidence score.

    Raises:
        None.

    Example:
        >>> meal, _ = build_photo_meal()
        >>> meal["meal_name"]
        'Mixed grain chicken bowl'
    """

    return (
        {
            "meal_name": "Mixed grain chicken bowl",
            "meal_type": meal_type_hint or "lunch",
            "ingredients": [
                {
                    "name": "Chicken breast, cooked",
                    "quantity_g": 140,
                    "calories": 231.0,
                    "protein_g": 43.4,
                    "carbs_g": 0.0,
                    "fat_g": 5.0,
                },
                {
                    "name": "White rice, cooked",
                    "quantity_g": 160,
                    "calories": 208.0,
                    "protein_g": 4.3,
                    "carbs_g": 44.8,
                    "fat_g": 0.5,
                },
                {
                    "name": "Mixed greens",
                    "quantity_g": 80,
                    "calories": 13.6,
                    "protein_g": 1.4,
                    "carbs_g": 2.4,
                    "fat_g": 0.2,
                },
            ],
        },
        0.81,
    )


def generate_coach_reply(
    message: str, context: dict[str, object]
) -> tuple[str, Sequence[str], list[dict[str, str]]]:
    """Generate a grounded fallback coach reply when external LLMs are unavailable.

    Parameters:
        message: The user message sent to the coach.
        context: Structured coaching context assembled from nutrition and training data.

    Returns:
        tuple[str, Sequence[str], list[dict[str, str]]]: The reply text, context tags used,
            and optional UI actions.

    Raises:
        None.

    Example:
        >>> reply, tags, _ = generate_coach_reply("How are my carbs?", {"today": {"macro_logged": {"carbs_g": 120}, "macro_targets": {"carbs_g": 260}}})
        >>> "carb" in reply.lower()
        True
    """

    lower = message.lower()
    today = context.get("today", {})
    macro_logged = today.get("macro_logged", {}) if isinstance(today, dict) else {}
    macro_targets = today.get("macro_targets", {}) if isinstance(today, dict) else {}
    fitness = context.get("fitness", {}) if isinstance(context.get("fitness"), dict) else {}
    goal = context.get("goal", {}) if isinstance(context.get("goal"), dict) else {}

    if "carb" in lower:
        remaining = int(macro_targets.get("carbs_g", 0) - macro_logged.get("carbs_g", 0))
        reply = (
            f"You still have about {max(remaining, 0)} g of carbs available today. "
            "Use them around your next key session or at dinner if today is a higher-load day."
        )
        return reply, ["nutrition"], [{"label": "Open food log", "action": "open_food_log"}]
    if "protein" in lower:
        remaining = int(macro_targets.get("protein_g", 0) - macro_logged.get("protein_g", 0))
        reply = (
            f"Protein is the main gap right now: roughly {max(remaining, 0)} g remain. "
            "A yogurt bowl or lean protein dinner will close it without overshooting fats."
        )
        return reply, ["nutrition"], [{"label": "Log meal", "action": "open_food_log"}]
    if "tired" in lower or "heavy" in lower or "rest" in lower:
        tsb = float(fitness.get("tsb", 0.0))
        reply = (
            f"Your current form is {tsb:.1f}. That points to manageable fatigue, so keep it easy if you train at all. "
            "If legs still feel dull after the warm-up, take the rest day and prioritize carbs plus protein."
        )
        return (
            reply,
            ["training_load", "nutrition"],
            [{"label": "View today", "action": "open_today"}],
        )
    if "goal" in lower or "race" in lower:
        description = goal.get("description", "your current goal")
        phase = goal.get("phase", goal.get("phase_name", "Base"))
        reply = (
            f"You're currently building toward {description} in the {phase} phase. "
            "The next best move is consistent aerobic work and staying closer to daily macro targets than perfect hero sessions."
        )
        return reply, ["goal", "training_load"], []
    reply = (
        "Today looks solid overall. Stay close to your fuel targets, keep intensity aligned with form, "
        "and use me for specific meal or session decisions if you want tighter guidance."
    )
    return (
        reply,
        ["nutrition", "training_load", "goal"],
        [{"label": "View training", "action": "open_training"}],
    )


def next_sync_timestamp() -> datetime:
    """Return a UTC timestamp used to stamp successful mock sync operations.

    Parameters:
        None.

    Returns:
        datetime: A timezone-aware UTC timestamp.

    Raises:
        None.

    Example:
        >>> next_sync_timestamp().tzinfo is not None
        True
    """

    return datetime.now(tz=UTC) + timedelta(seconds=0)

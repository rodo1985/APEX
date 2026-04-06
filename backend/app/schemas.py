"""Pydantic schemas describing the public API contract for APEX."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    """Base schema configured to read directly from SQLAlchemy objects."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ErrorDetail(BaseModel):
    """Describe a standardized API error payload returned by the backend."""

    code: str
    message: str
    details: dict[str, object] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """Wrap the API error structure in the documented top-level envelope."""

    error: ErrorDetail


class GoalPayload(BaseModel):
    """Capture the active goal fields collected during onboarding and updates."""

    goal_type: Literal["race", "distance_pr", "body_composition", "consistency", "combined"] = (
        "race"
    )
    description: str
    target_date: date | None = None
    goal_weight_kg: float | None = None
    available_training_days: int = 5
    secondary_goal: str | None = None
    constraints_text: str | None = None
    phase_name: str = "Base"
    weekly_tss_target: int = 320
    weekly_hours_target: float = 6.0


class GoalRead(ORMModel):
    """Return the currently active goal embedded inside profile responses."""

    id: str
    goal_type: str
    description: str
    target_date: date | None
    goal_weight_kg: float | None
    available_training_days: int
    secondary_goal: str | None
    constraints_text: str | None
    phase_name: str
    weekly_tss_target: int
    weekly_hours_target: float


class RegisterRequest(BaseModel):
    """Validate account creation requests."""

    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=120)


class LoginRequest(BaseModel):
    """Validate email and password login requests."""

    email: EmailStr
    password: str = Field(min_length=8)


class RefreshRequest(BaseModel):
    """Validate refresh-token rotation requests."""

    refresh_token: str


class AuthTokens(BaseModel):
    """Expose the access and refresh tokens returned after authentication."""

    access_token: str
    refresh_token: str
    expires_in: int


class RegisterResponse(AuthTokens):
    """Return the created user and authentication tokens after registration."""

    user_id: str
    email: EmailStr
    name: str


class MacroTargets(BaseModel):
    """Represent daily macro targets exposed in profile and nutrition responses."""

    protein_g: int
    carbs_g: int
    fat_g: int


class UserProfileRead(ORMModel):
    """Return the athlete profile used by onboarding, settings, and the coach."""

    user_id: str = Field(validation_alias="id")
    name: str
    email: EmailStr
    avatar_url: str | None
    sports: list[str] = Field(validation_alias="sports_json")
    ftp: int | None
    lthr: int | None
    weight_kg: float | None
    height_cm: int | None
    daily_calorie_target: int
    macro_targets: MacroTargets
    timezone: str
    created_at: datetime
    active_goal: GoalRead | None = None


class UserProfileUpdate(BaseModel):
    """Validate partial athlete profile updates from onboarding and settings."""

    name: str | None = None
    ftp: int | None = None
    lthr: int | None = None
    weight_kg: float | None = None
    height_cm: int | None = None
    daily_calorie_target: int | None = None
    sports: list[str] | None = None
    timezone: str | None = None
    macro_targets: MacroTargets | None = None
    active_goal: GoalPayload | None = None


class AvatarUploadResponse(BaseModel):
    """Return the avatar URL after a successful file upload."""

    avatar_url: str


class IngredientPayload(BaseModel):
    """Describe a meal ingredient submitted manually or returned by AI parsing."""

    food_id: str | None = None
    name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class IngredientRead(ORMModel):
    """Expose persisted ingredient data inside meal log responses."""

    ingredient_id: str = Field(validation_alias="id")
    food_id: str | None
    name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class MealLogCreate(BaseModel):
    """Validate manual meal creation and update payloads."""

    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    meal_name: str
    logged_at: datetime
    ingredients: list[IngredientPayload]


class MealLogRead(ORMModel):
    """Expose meal logs with computed totals and ingredients."""

    log_id: str = Field(validation_alias="id")
    user_id: str
    meal_type: str
    meal_name: str
    logged_at: datetime
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    ingredients: list[IngredientRead]
    source: str
    created_at: datetime


class NutritionSummary(BaseModel):
    """Summarize consumed and target macros for a specific day."""

    calories_consumed: float
    calories_target: int
    protein_g: float
    carbs_g: float
    fat_g: float
    target_day_type: str
    note: str | None = None


class NutritionTodayResponse(BaseModel):
    """Return today's nutrition snapshot and all meals for the active athlete."""

    date: date
    summary: NutritionSummary
    meals: list[MealLogRead]


class NutritionLogResponse(BaseModel):
    """Return meal logs filtered across a date range."""

    logs: list[MealLogRead]


class ParsedMeal(BaseModel):
    """Represent a machine-generated meal suggestion awaiting user confirmation."""

    meal_name: str
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    ingredients: list[IngredientPayload]


class MealParseResponse(BaseModel):
    """Return the parsed meal suggestion from voice or photo analysis."""

    transcript: str | None = None
    parsed_meal: ParsedMeal
    confidence: float


class FoodSearchResult(ORMModel):
    """Return a searchable food record with serving-level macros."""

    food_id: str = Field(validation_alias="id")
    name: str
    brand: str | None
    serving_unit: str
    serving_size: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class FoodSearchResponse(BaseModel):
    """Return paginated food search matches."""

    results: list[FoodSearchResult]
    total: int


class NutritionDayAggregate(BaseModel):
    """Represent aggregated macro values for a single calendar day."""

    date: date
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class NutritionWeeklyResponse(BaseModel):
    """Return a seven-day nutrition rollup used by charts and weekly review UI."""

    days: list[NutritionDayAggregate]


class ActivityRead(ORMModel):
    """Expose normalized activity data returned from Strava sync and history views."""

    activity_id: str = Field(validation_alias="id")
    strava_id: str | None
    sport: str
    name: str
    start_time: datetime
    duration_seconds: int
    distance_m: float
    elevation_m: float
    avg_power_w: float | None
    normalized_power_w: float | None
    avg_hr: int | None
    max_hr: int | None
    tss: float
    intensity_factor: float | None
    calories: float
    map_polyline: str | None = None
    photo_urls: list[str] = Field(default_factory=list)
    created_at: datetime


class TrainingMetrics(BaseModel):
    """Return the current CTL, ATL, TSB, and daily stress values."""

    ctl: float
    atl: float
    tsb: float
    daily_tss: float


class TrainingTodayResponse(BaseModel):
    """Return the generated daily training brief plus completed sessions."""

    date: date
    metrics: TrainingMetrics
    status: Literal["optimal", "fresh", "fatigued", "overreaching"]
    planned_activities: list[dict[str, object]]
    completed_activities: list[ActivityRead]


class ActivityListResponse(BaseModel):
    """Return paginated activity history."""

    activities: list[ActivityRead]
    total: int


class StravaSyncResponse(BaseModel):
    """Summarize the activities imported during a Strava synchronization job."""

    synced_count: int
    activities: list[ActivityRead]


class TrainingLoadPoint(BaseModel):
    """Represent one day in the CTL/ATL/TSB time series."""

    date: date
    ctl: float
    atl: float
    tsb: float
    daily_tss: float


class TrainingLoadResponse(BaseModel):
    """Return the load curve used by the dashboard and training screens."""

    series: list[TrainingLoadPoint]


class WeeklyTrainingSummary(BaseModel):
    """Summarize one training week for overview charts."""

    week_start: date
    total_tss: float
    total_hours: float
    total_distance_km: float
    activities_count: int


class TrainingWeeklyResponse(BaseModel):
    """Return the requested number of weekly training summaries."""

    weeks: list[WeeklyTrainingSummary]


class CoachMessageRequest(BaseModel):
    """Validate a text message sent to the APEX coach."""

    message: str = Field(min_length=1)
    conversation_id: str | None = None


class CoachReplyResponse(BaseModel):
    """Return the assistant reply and action metadata for a coach request."""

    conversation_id: str
    reply: str
    context_used: list[str]
    suggested_actions: list[dict[str, str]] = Field(default_factory=list)
    transcript: str | None = None


class ConversationPreview(ORMModel):
    """Return a conversation summary for the coach inbox view."""

    conversation_id: str = Field(validation_alias="id")
    preview: str
    created_at: datetime
    updated_at: datetime


class ConversationListResponse(BaseModel):
    """Return the athlete's saved conversation previews."""

    conversations: list[ConversationPreview]


class ConversationMessageRead(ORMModel):
    """Expose the persisted chat history for a single coach conversation."""

    message_id: str = Field(validation_alias="id")
    role: str
    content: str
    context_used: list[str] = Field(validation_alias="context_used_json")
    timestamp: datetime


class ConversationDetailResponse(BaseModel):
    """Return the full message history for a single conversation."""

    conversation_id: str
    messages: list[ConversationMessageRead]


class IntegrationStatus(BaseModel):
    """Describe the connected state and metadata for a single integration."""

    connected: bool
    athlete_name: str | None = None
    email: str | None = None
    last_sync: datetime | None = None


class IntegrationsResponse(BaseModel):
    """Return settings-panel integration status for the supported providers."""

    strava: IntegrationStatus
    google_calendar: IntegrationStatus
    apple_health: IntegrationStatus

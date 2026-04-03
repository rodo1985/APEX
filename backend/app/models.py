"""SQLAlchemy ORM models for the APEX backend domain."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utc_now() -> datetime:
    """Return the current UTC timestamp for default ORM fields.

    Parameters:
        None.

    Returns:
        datetime: A timezone-aware UTC timestamp.

    Raises:
        None.

    Example:
        >>> utc_now().tzinfo is not None
        True
    """

    return datetime.now(tz=UTC)


def new_id() -> str:
    """Create a string UUID for primary keys across the application.

    Parameters:
        None.

    Returns:
        str: A random UUID string.

    Raises:
        None.

    Example:
        >>> len(new_id()) > 10
        True
    """

    return str(uuid4())


class User(Base):
    """Store the athlete account and profile fields used across APEX."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sports_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    ftp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lthr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Europe/Madrid")
    daily_calorie_target: Mapped[int] = mapped_column(Integer, default=2300)
    protein_target_g: Mapped[int] = mapped_column(Integer, default=140)
    carbs_target_g: Mapped[int] = mapped_column(Integer, default=260)
    fat_target_g: Mapped[int] = mapped_column(Integer, default=65)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    goal: Mapped[Goal | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    refresh_sessions: Mapped[list[RefreshSession]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    meals: Mapped[list[MealLog]] = relationship(back_populates="user", cascade="all, delete-orphan")
    activities: Mapped[list[Activity]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    daily_targets: Mapped[list[DailyNutritionTarget]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    integrations: Mapped[list[IntegrationConnection]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    conversations: Mapped[list[CoachConversation]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Goal(Base):
    """Persist the athlete's active macro goal and planning assumptions."""

    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    goal_type: Mapped[str] = mapped_column(String(50), default="race")
    description: Mapped[str] = mapped_column(String(255))
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    goal_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    available_training_days: Mapped[int] = mapped_column(Integer, default=5)
    secondary_goal: Mapped[str | None] = mapped_column(String(255), nullable=True)
    constraints_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    phase_name: Mapped[str] = mapped_column(String(50), default="Base")
    weekly_tss_target: Mapped[int] = mapped_column(Integer, default=320)
    weekly_hours_target: Mapped[float] = mapped_column(Float, default=6.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    user: Mapped[User] = relationship(back_populates="goal")


class RefreshSession(Base):
    """Track refresh tokens so logout and rotation can invalidate them safely."""

    __tablename__ = "refresh_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    token_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="refresh_sessions")


class FoodItem(Base):
    """Represent a searchable food item with macros per serving."""

    __tablename__ = "food_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255), index=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    serving_unit: Mapped[str] = mapped_column(String(32), default="g")
    serving_size: Mapped[float] = mapped_column(Float, default=100)
    calories: Mapped[float] = mapped_column(Float)
    protein_g: Mapped[float] = mapped_column(Float)
    carbs_g: Mapped[float] = mapped_column(Float)
    fat_g: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), default="seed")


class MealLog(Base):
    """Store a single meal log entry created manually or by AI-assisted flows."""

    __tablename__ = "meal_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    meal_type: Mapped[str] = mapped_column(String(32))
    meal_name: Mapped[str] = mapped_column(String(255))
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[str] = mapped_column(String(32), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="meals")
    ingredients: Mapped[list[MealIngredient]] = relationship(
        back_populates="meal",
        cascade="all, delete-orphan",
    )


class MealIngredient(Base):
    """Represent a resolved ingredient entry belonging to a meal log."""

    __tablename__ = "meal_ingredients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    meal_log_id: Mapped[str] = mapped_column(ForeignKey("meal_logs.id"), index=True)
    food_id: Mapped[str | None] = mapped_column(ForeignKey("food_items.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    quantity_g: Mapped[float] = mapped_column(Float)
    calories: Mapped[float] = mapped_column(Float)
    protein_g: Mapped[float] = mapped_column(Float)
    carbs_g: Mapped[float] = mapped_column(Float)
    fat_g: Mapped[float] = mapped_column(Float)

    meal: Mapped[MealLog] = relationship(back_populates="ingredients")


class Activity(Base):
    """Store normalized endurance activities imported from Strava or local fixtures."""

    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    strava_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    sport: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(255))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer)
    distance_m: Mapped[float] = mapped_column(Float)
    elevation_m: Mapped[float] = mapped_column(Float)
    avg_power_w: Mapped[float | None] = mapped_column(Float, nullable=True)
    normalized_power_w: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_hr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_hr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tss: Mapped[float] = mapped_column(Float, default=0.0)
    intensity_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    calories: Mapped[float] = mapped_column(Float, default=0.0)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="activities")


class DailyNutritionTarget(Base):
    """Cache computed daily macro targets so the dashboard stays deterministic."""

    __tablename__ = "daily_nutrition_targets"
    __table_args__ = (UniqueConstraint("user_id", "target_date", name="uq_daily_target"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    target_date: Mapped[date] = mapped_column(Date, index=True)
    day_type: Mapped[str] = mapped_column(String(32))
    calories: Mapped[int] = mapped_column(Integer)
    protein_g: Mapped[int] = mapped_column(Integer)
    carbs_g: Mapped[int] = mapped_column(Integer)
    fat_g: Mapped[int] = mapped_column(Integer)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="daily_targets")


class IntegrationConnection(Base):
    """Track external integration credentials and human-readable status."""

    __tablename__ = "integration_connections"
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_user_provider"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    provider: Mapped[str] = mapped_column(String(32))
    connected: Mapped[bool] = mapped_column(Boolean, default=False)
    external_account_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    external_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    user: Mapped[User] = relationship(back_populates="integrations")


class CoachConversation(Base):
    """Represent a persisted coaching thread belonging to a single athlete."""

    __tablename__ = "coach_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    preview: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )

    user: Mapped[User] = relationship(back_populates="conversations")
    messages: Mapped[list[CoachMessage]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="CoachMessage.timestamp",
    )


class CoachMessage(Base):
    """Persist a single user or assistant message in a coach conversation."""

    __tablename__ = "coach_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("coach_conversations.id"), index=True)
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    context_used_json: Mapped[list[str]] = mapped_column(JSON, default=list)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, index=True
    )

    conversation: Mapped[CoachConversation] = relationship(back_populates="messages")

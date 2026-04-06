"""Create the initial APEX schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-03 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply the first schema revision for the APEX backend."""

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("sports_json", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("ftp", sa.Integer(), nullable=True),
        sa.Column("lthr", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Europe/Madrid"),
        sa.Column("daily_calorie_target", sa.Integer(), nullable=False, server_default="2300"),
        sa.Column("protein_target_g", sa.Integer(), nullable=False, server_default="140"),
        sa.Column("carbs_target_g", sa.Integer(), nullable=False, server_default="260"),
        sa.Column("fat_target_g", sa.Integer(), nullable=False, server_default="65"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "goals",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("goal_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("goal_weight_kg", sa.Float(), nullable=True),
        sa.Column("available_training_days", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("secondary_goal", sa.String(length=255), nullable=True),
        sa.Column("constraints_text", sa.Text(), nullable=True),
        sa.Column("phase_name", sa.String(length=50), nullable=False, server_default="Base"),
        sa.Column("weekly_tss_target", sa.Integer(), nullable=False, server_default="320"),
        sa.Column("weekly_hours_target", sa.Float(), nullable=False, server_default="6"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "refresh_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_id", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_refresh_sessions_token_id", "refresh_sessions", ["token_id"], unique=True)
    op.create_index("ix_refresh_sessions_user_id", "refresh_sessions", ["user_id"])

    op.create_table(
        "food_items",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("brand", sa.String(length=255), nullable=True),
        sa.Column("serving_unit", sa.String(length=32), nullable=False),
        sa.Column("serving_size", sa.Float(), nullable=False),
        sa.Column("calories", sa.Float(), nullable=False),
        sa.Column("protein_g", sa.Float(), nullable=False),
        sa.Column("carbs_g", sa.Float(), nullable=False),
        sa.Column("fat_g", sa.Float(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
    )
    op.create_index("ix_food_items_name", "food_items", ["name"])

    op.create_table(
        "meal_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("meal_type", sa.String(length=32), nullable=False),
        sa.Column("meal_name", sa.String(length=255), nullable=False),
        sa.Column("logged_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_meal_logs_logged_at", "meal_logs", ["logged_at"])
    op.create_index("ix_meal_logs_user_id", "meal_logs", ["user_id"])

    op.create_table(
        "meal_ingredients",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "meal_log_id", sa.String(length=36), sa.ForeignKey("meal_logs.id"), nullable=False
        ),
        sa.Column("food_id", sa.String(length=36), sa.ForeignKey("food_items.id"), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("quantity_g", sa.Float(), nullable=False),
        sa.Column("calories", sa.Float(), nullable=False),
        sa.Column("protein_g", sa.Float(), nullable=False),
        sa.Column("carbs_g", sa.Float(), nullable=False),
        sa.Column("fat_g", sa.Float(), nullable=False),
    )
    op.create_index("ix_meal_ingredients_meal_log_id", "meal_ingredients", ["meal_log_id"])

    op.create_table(
        "activities",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("strava_id", sa.String(length=64), nullable=True),
        sa.Column("sport", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("distance_m", sa.Float(), nullable=False),
        sa.Column("elevation_m", sa.Float(), nullable=False),
        sa.Column("avg_power_w", sa.Float(), nullable=True),
        sa.Column("normalized_power_w", sa.Float(), nullable=True),
        sa.Column("avg_hr", sa.Integer(), nullable=True),
        sa.Column("max_hr", sa.Integer(), nullable=True),
        sa.Column("tss", sa.Float(), nullable=False),
        sa.Column("intensity_factor", sa.Float(), nullable=True),
        sa.Column("calories", sa.Float(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_activities_start_time", "activities", ["start_time"])
    op.create_index("ix_activities_strava_id", "activities", ["strava_id"])
    op.create_index("ix_activities_sport", "activities", ["sport"])
    op.create_index("ix_activities_user_id", "activities", ["user_id"])

    op.create_table(
        "daily_nutrition_targets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=False),
        sa.Column("day_type", sa.String(length=32), nullable=False),
        sa.Column("calories", sa.Integer(), nullable=False),
        sa.Column("protein_g", sa.Integer(), nullable=False),
        sa.Column("carbs_g", sa.Integer(), nullable=False),
        sa.Column("fat_g", sa.Integer(), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "target_date", name="uq_daily_target"),
    )
    op.create_index(
        "ix_daily_nutrition_targets_target_date", "daily_nutrition_targets", ["target_date"]
    )
    op.create_index("ix_daily_nutrition_targets_user_id", "daily_nutrition_targets", ["user_id"])

    op.create_table(
        "integration_connections",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("connected", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("external_account_id", sa.String(length=255), nullable=True),
        sa.Column("external_name", sa.String(length=255), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default="{}"),
        sa.UniqueConstraint("user_id", "provider", name="uq_user_provider"),
    )
    op.create_index("ix_integration_connections_user_id", "integration_connections", ["user_id"])

    op.create_table(
        "coach_conversations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("preview", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_coach_conversations_user_id", "coach_conversations", ["user_id"])

    op.create_table(
        "coach_messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.String(length=36),
            sa.ForeignKey("coach_conversations.id"),
            nullable=False,
        ),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("context_used_json", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_coach_messages_conversation_id", "coach_messages", ["conversation_id"])
    op.create_index("ix_coach_messages_timestamp", "coach_messages", ["timestamp"])


def downgrade() -> None:
    """Rollback the initial APEX schema revision."""

    op.drop_index("ix_coach_messages_timestamp", table_name="coach_messages")
    op.drop_index("ix_coach_messages_conversation_id", table_name="coach_messages")
    op.drop_table("coach_messages")
    op.drop_index("ix_coach_conversations_user_id", table_name="coach_conversations")
    op.drop_table("coach_conversations")
    op.drop_index("ix_integration_connections_user_id", table_name="integration_connections")
    op.drop_table("integration_connections")
    op.drop_index("ix_daily_nutrition_targets_user_id", table_name="daily_nutrition_targets")
    op.drop_index("ix_daily_nutrition_targets_target_date", table_name="daily_nutrition_targets")
    op.drop_table("daily_nutrition_targets")
    op.drop_index("ix_activities_user_id", table_name="activities")
    op.drop_index("ix_activities_sport", table_name="activities")
    op.drop_index("ix_activities_strava_id", table_name="activities")
    op.drop_index("ix_activities_start_time", table_name="activities")
    op.drop_table("activities")
    op.drop_index("ix_meal_ingredients_meal_log_id", table_name="meal_ingredients")
    op.drop_table("meal_ingredients")
    op.drop_index("ix_meal_logs_user_id", table_name="meal_logs")
    op.drop_index("ix_meal_logs_logged_at", table_name="meal_logs")
    op.drop_table("meal_logs")
    op.drop_index("ix_food_items_name", table_name="food_items")
    op.drop_table("food_items")
    op.drop_index("ix_refresh_sessions_user_id", table_name="refresh_sessions")
    op.drop_index("ix_refresh_sessions_token_id", table_name="refresh_sessions")
    op.drop_table("refresh_sessions")
    op.drop_table("goals")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

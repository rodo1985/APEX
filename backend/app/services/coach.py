"""Coach services for context assembly, conversation persistence, and replies."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import CoachConversation, CoachMessage, User
from app.schemas import (
    CoachReplyResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationMessageRead,
    ConversationPreview,
)
from app.services.nutrition import get_today_summary, get_weekly_nutrition, resolve_daily_target
from app.services.providers import generate_coach_reply
from app.services.training import (
    compute_load_series,
    get_today_training_summary,
    get_weekly_training,
)


def build_context_payload(db: Session, user: User) -> dict[str, object]:
    """Build the structured coach context payload described in the architecture docs.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose live context should be assembled.

    Returns:
        dict[str, object]: The structured context payload used for coach replies.

    Raises:
        SQLAlchemyError: Propagated if any dependent query fails.

    Example:
        >>> hasattr(user, "name")
        True
    """

    today_summary = get_today_summary(db, user)
    today_training = get_today_training_summary(db, user)
    weekly_nutrition = get_weekly_nutrition(db, user)
    weekly_training = get_weekly_training(db, user, weeks=1)
    load_series = compute_load_series(db, user, days=42)
    # Resolve today's target directly so the coach stays aligned with the same
    # deterministic day-type rules used by the dashboard, even when the user's
    # relationship collection has not been refreshed yet in this session.
    daily_target = resolve_daily_target(db, user, today_summary.date)

    avg_calories = (
        round(sum(day.calories for day in weekly_nutrition.days) / len(weekly_nutrition.days), 1)
        if weekly_nutrition.days
        else 0.0
    )
    avg_protein = (
        round(sum(day.protein_g for day in weekly_nutrition.days) / len(weekly_nutrition.days), 1)
        if weekly_nutrition.days
        else 0.0
    )
    latest_week = weekly_training.weeks[-1] if weekly_training.weeks else None
    latest_load = load_series[-1] if load_series else None
    goal = user.goal
    target = today_summary.summary
    planned = today_training.planned_activities[0] if today_training.planned_activities else None

    return {
        "athlete": {
            "name": user.name,
            "weight_kg": user.weight_kg,
            "goal_weight_kg": goal.goal_weight_kg if goal else None,
            "height_cm": user.height_cm,
            "weeks_to_goal": (
                max((goal.target_date - datetime.now(tz=UTC).date()).days // 7, 0)
                if goal and goal.target_date
                else None
            ),
        },
        "goal": {
            "type": goal.goal_type if goal else "general_fitness",
            "description": goal.description if goal else "Build consistent endurance habits",
            "date": goal.target_date.isoformat() if goal and goal.target_date else None,
            "phase": goal.phase_name if goal else "Base",
            "on_track": True,
        },
        "today": {
            "date": today_summary.date.isoformat(),
            "planned_training": planned["code"] if planned else "rest",
            "completed_training": today_training.completed_activities[0].name
            if today_training.completed_activities
            else None,
            "tss_planned": planned["expected_tss"] if planned else 0,
            "tss_actual": today_training.metrics.daily_tss or None,
            "macro_targets": {
                "calories": target.calories_target,
                "protein_g": daily_target.protein_g,
                "carbs_g": daily_target.carbs_g,
                "fat_g": daily_target.fat_g,
            },
            "macro_logged": {
                "calories": today_summary.summary.calories_consumed,
                "protein_g": today_summary.summary.protein_g,
                "carbs_g": today_summary.summary.carbs_g,
                "fat_g": today_summary.summary.fat_g,
            },
        },
        "this_week": {
            "tss_planned": goal.weekly_tss_target if goal else 320,
            "tss_actual": latest_week.total_tss if latest_week else 0,
            "avg_protein_g": avg_protein,
            "avg_calories": avg_calories,
            "training_days_completed": latest_week.activities_count if latest_week else 0,
            "training_days_planned": goal.available_training_days if goal else 5,
        },
        "fitness": {
            "ctl": latest_load.ctl if latest_load else 0,
            "atl": latest_load.atl if latest_load else 0,
            "tsb": latest_load.tsb if latest_load else 0,
            "trend": "building"
            if latest_load and latest_load.ctl >= latest_load.atl
            else "recovering",
        },
        "last_7_days_summary": (
            f"{latest_week.activities_count if latest_week else 0} sessions completed, "
            f"avg protein {avg_protein}g, avg calories {avg_calories}"
        ),
    }


def _conversation_preview(message: str) -> str:
    """Build a short preview string for the conversation list UI.

    Parameters:
        message: The latest user-facing message content.

    Returns:
        str: A trimmed preview string capped at 90 characters.

    Raises:
        None.

    Example:
        >>> _conversation_preview("hello world")
        'hello world'
    """

    return message[:87] + "..." if len(message) > 90 else message


def _get_or_create_conversation(
    db: Session, user: User, conversation_id: str | None
) -> CoachConversation:
    """Resolve an existing conversation or create a new one for the user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the conversation.
        conversation_id: Optional existing conversation identifier.

    Returns:
        CoachConversation: The resolved conversation ORM object.

    Raises:
        LookupError: Raised when the requested conversation does not belong to the user.

    Example:
        >>> conversation_id is None or isinstance(conversation_id, str)
        True
    """

    if conversation_id:
        conversation = db.scalar(
            select(CoachConversation).where(
                CoachConversation.id == conversation_id,
                CoachConversation.user_id == user.id,
            )
        )
        if conversation is None:
            raise LookupError("Conversation not found.")
        return conversation

    conversation = CoachConversation(user_id=user.id, preview="")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def send_coach_message(
    db: Session,
    user: User,
    message: str,
    conversation_id: str | None = None,
    transcript: str | None = None,
) -> CoachReplyResponse:
    """Persist a user message, generate a grounded coach reply, and save both.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user sending the message.
        message: The text message to send to the coach.
        conversation_id: Optional conversation identifier to continue.
        transcript: Optional transcript used when the request originated from audio.

    Returns:
        CoachReplyResponse: The saved reply and action metadata.

    Raises:
        LookupError: Raised when the requested conversation does not exist for the user.

    Example:
        >>> isinstance(message, str)
        True
    """

    conversation = _get_or_create_conversation(db, user, conversation_id)
    context = build_context_payload(db, user)
    reply_text, context_tags, actions = generate_coach_reply(message, context)

    user_message = CoachMessage(
        conversation_id=conversation.id,
        role="user",
        content=message,
        context_used_json=[],
    )
    assistant_message = CoachMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=reply_text,
        context_used_json=list(context_tags),
    )
    conversation.preview = _conversation_preview(message)
    conversation.updated_at = datetime.now(tz=UTC)
    db.add_all([conversation, user_message, assistant_message])
    db.commit()

    return CoachReplyResponse(
        conversation_id=conversation.id,
        reply=reply_text,
        context_used=list(context_tags),
        suggested_actions=actions,
        transcript=transcript,
    )


def list_conversations(db: Session, user: User) -> ConversationListResponse:
    """Return the user's saved coach conversations ordered by recency.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose conversations are requested.

    Returns:
        ConversationListResponse: Conversation previews ordered by most recent first.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> hasattr(user, "id")
        True
    """

    rows = db.scalars(
        select(CoachConversation)
        .where(CoachConversation.user_id == user.id)
        .order_by(CoachConversation.updated_at.desc())
    ).all()
    return ConversationListResponse(
        conversations=[ConversationPreview.model_validate(row) for row in rows]
    )


def get_conversation(db: Session, user: User, conversation_id: str) -> ConversationDetailResponse:
    """Return the full saved history for a single conversation.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the conversation.
        conversation_id: The conversation identifier to fetch.

    Returns:
        ConversationDetailResponse: The conversation history in chronological order.

    Raises:
        LookupError: Raised when the conversation does not exist for the user.

    Example:
        >>> isinstance(conversation_id, str)
        True
    """

    conversation = db.scalar(
        select(CoachConversation)
        .options(selectinload(CoachConversation.messages))
        .where(
            CoachConversation.id == conversation_id,
            CoachConversation.user_id == user.id,
        )
    )
    if conversation is None:
        raise LookupError("Conversation not found.")
    return ConversationDetailResponse(
        conversation_id=conversation.id,
        messages=[
            ConversationMessageRead.model_validate(message) for message in conversation.messages
        ],
    )


def delete_conversation(db: Session, user: User, conversation_id: str) -> None:
    """Delete a conversation and its messages when owned by the current user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the conversation.
        conversation_id: The conversation identifier to delete.

    Returns:
        None.

    Raises:
        LookupError: Raised when the conversation does not exist for the user.

    Example:
        >>> isinstance(conversation_id, str)
        True
    """

    conversation = db.scalar(
        select(CoachConversation).where(
            CoachConversation.id == conversation_id,
            CoachConversation.user_id == user.id,
        )
    )
    if conversation is None:
        raise LookupError("Conversation not found.")
    db.delete(conversation)
    db.commit()

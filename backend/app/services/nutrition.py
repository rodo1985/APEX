"""Nutrition services for food search, logging, and dynamic macro targets."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from math import ceil

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import DailyNutritionTarget, FoodItem, MealIngredient, MealLog, User
from app.schemas import (
    FoodSearchResponse,
    FoodSearchResult,
    IngredientPayload,
    IngredientRead,
    MealLogCreate,
    MealLogRead,
    MealParseResponse,
    NutritionDayAggregate,
    NutritionLogResponse,
    NutritionSummary,
    NutritionTodayResponse,
    NutritionWeeklyResponse,
    ParsedMeal,
)
from app.seed import FOOD_SEED
from app.services.providers import build_photo_meal, parse_text_into_meal

DAY_TYPE_RULES: dict[str, dict[str, float | str]] = {
    "rest": {
        "calories": 0.85,
        "carbs": 0.70,
        "protein": 1.05,
        "fat": 1.00,
        "note": "Rest day targets reduced to match lower fuelling demand.",
    },
    "easy_z2": {
        "calories": 1.00,
        "carbs": 0.90,
        "protein": 1.00,
        "fat": 1.00,
        "note": "Easy endurance day: keep fuel steady without overdoing carbs.",
    },
    "hard": {
        "calories": 1.05,
        "carbs": 1.15,
        "protein": 1.05,
        "fat": 0.90,
        "note": "Hard day: shift more energy into carbohydrates for quality work.",
    },
    "long_ride": {
        "calories": 1.12,
        "carbs": 1.25,
        "protein": 1.05,
        "fat": 1.00,
        "note": "Long session day: more calories and carbs to support duration.",
    },
    "run_weights": {
        "calories": 1.00,
        "carbs": 1.10,
        "protein": 1.10,
        "fat": 0.90,
        "note": "Run plus strength day: keep protein high to support recovery.",
    },
    "missed": {
        "calories": 0.90,
        "carbs": 0.80,
        "protein": 1.00,
        "fat": 1.00,
        "note": "Missed session adjustment applied to avoid overfuelling a low-load day.",
    },
}


def scaled_target(base_value: int, multiplier: float) -> int:
    """Scale an integer macro target while guarding against float precision noise.

    Parameters:
        base_value: The base calorie or macro target stored on the athlete profile.
        multiplier: The day-type multiplier defined by the nutrition rules.

    Returns:
        int: The upward-rounded scaled target.

    Raises:
        None.

    Example:
        >>> scaled_target(2400, 1.12)
        2688
    """

    # Floating point multiplication can produce values such as 2688.0000000000005,
    # which would incorrectly round up by one if we applied `ceil` directly.
    return ceil((base_value * multiplier) - 1e-9)


def seed_food_items(db: Session) -> None:
    """Insert the default searchable food database when the table is empty.

    Parameters:
        db: The active SQLAlchemy session.

    Returns:
        None.

    Raises:
        SQLAlchemyError: Propagated if inserts fail.

    Example:
        >>> isinstance(db, Session)
        True
    """

    existing_count = db.scalar(select(func.count()).select_from(FoodItem))
    if existing_count:
        return

    for item in FOOD_SEED:
        db.add(FoodItem(**item))
    db.commit()


def meal_totals(ingredients: list[IngredientPayload | MealIngredient]) -> dict[str, float]:
    """Calculate meal totals from either payload objects or ORM ingredient rows.

    Parameters:
        ingredients: The ingredient collection whose macros should be summed.

    Returns:
        dict[str, float]: Totals keyed by calories, protein, carbs, and fat.

    Raises:
        None.

    Example:
        >>> totals = meal_totals([IngredientPayload(name="Rice", quantity_g=100, calories=130, protein_g=2.7, carbs_g=28, fat_g=0.3)])
        >>> int(totals["calories"])
        130
    """

    return {
        "calories": round(sum(float(item.calories) for item in ingredients), 1),
        "protein_g": round(sum(float(item.protein_g) for item in ingredients), 1),
        "carbs_g": round(sum(float(item.carbs_g) for item in ingredients), 1),
        "fat_g": round(sum(float(item.fat_g) for item in ingredients), 1),
    }


def serialize_meal(meal: MealLog) -> MealLogRead:
    """Convert a meal ORM object into the public response contract.

    Parameters:
        meal: The meal log ORM object with its ingredients loaded.

    Returns:
        MealLogRead: A serialized meal response payload.

    Raises:
        ValidationError: Raised by Pydantic if the ORM object is malformed.

    Example:
        >>> hasattr(meal, "meal_name")
        True
    """

    totals = meal_totals(meal.ingredients)
    return MealLogRead(
        id=meal.id,
        user_id=meal.user_id,
        meal_type=meal.meal_type,
        meal_name=meal.meal_name,
        logged_at=meal.logged_at,
        total_calories=totals["calories"],
        total_protein_g=totals["protein_g"],
        total_carbs_g=totals["carbs_g"],
        total_fat_g=totals["fat_g"],
        ingredients=[
            IngredientRead(
                id=ingredient.id,
                food_id=ingredient.food_id,
                name=ingredient.name,
                quantity_g=ingredient.quantity_g,
                calories=ingredient.calories,
                protein_g=ingredient.protein_g,
                carbs_g=ingredient.carbs_g,
                fat_g=ingredient.fat_g,
            )
            for ingredient in meal.ingredients
        ],
        source=meal.source,
        created_at=meal.created_at,
    )


def _upsert_meal_ingredients(meal: MealLog, ingredients: list[IngredientPayload]) -> None:
    """Replace the meal's ingredients with a new validated ingredient collection.

    Parameters:
        meal: The meal ORM object being updated.
        ingredients: The validated ingredient payloads to persist.

    Returns:
        None.

    Raises:
        None.

    Example:
        >>> len(ingredients) >= 0
        True
    """

    meal.ingredients.clear()
    for ingredient in ingredients:
        meal.ingredients.append(
            MealIngredient(
                food_id=ingredient.food_id,
                name=ingredient.name,
                quantity_g=ingredient.quantity_g,
                calories=ingredient.calories,
                protein_g=ingredient.protein_g,
                carbs_g=ingredient.carbs_g,
                fat_g=ingredient.fat_g,
            )
        )


def create_meal_log(
    db: Session, user: User, payload: MealLogCreate, source: str = "manual"
) -> MealLogRead:
    """Persist a meal log and return the serialized response payload.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the meal log.
        payload: The validated meal creation payload.
        source: The origin of the meal log, such as manual, voice, or photo.

    Returns:
        MealLogRead: The persisted meal response payload.

    Raises:
        SQLAlchemyError: Propagated if the insert fails.

    Example:
        >>> payload.meal_type in {"breakfast", "lunch", "dinner", "snack"}
        True
    """

    meal = MealLog(
        user_id=user.id,
        meal_type=payload.meal_type,
        meal_name=payload.meal_name,
        logged_at=payload.logged_at,
        source=source,
    )
    _upsert_meal_ingredients(meal, payload.ingredients)
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return serialize_meal(meal)


def update_meal_log(db: Session, user: User, log_id: str, payload: MealLogCreate) -> MealLogRead:
    """Update an existing meal log owned by the current user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the meal log.
        log_id: The meal log identifier to update.
        payload: The validated replacement meal payload.

    Returns:
        MealLogRead: The updated meal response payload.

    Raises:
        LookupError: Raised when the meal log does not exist for the user.

    Example:
        >>> isinstance(log_id, str)
        True
    """

    meal = db.scalar(
        select(MealLog)
        .options(selectinload(MealLog.ingredients))
        .where(MealLog.id == log_id, MealLog.user_id == user.id)
    )
    if meal is None:
        raise LookupError("Meal log not found.")

    meal.meal_type = payload.meal_type
    meal.meal_name = payload.meal_name
    meal.logged_at = payload.logged_at
    _upsert_meal_ingredients(meal, payload.ingredients)
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return serialize_meal(meal)


def delete_meal_log(db: Session, user: User, log_id: str) -> None:
    """Delete a meal log owned by the current user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the meal log.
        log_id: The meal log identifier to delete.

    Returns:
        None.

    Raises:
        LookupError: Raised when the meal log does not exist for the user.

    Example:
        >>> isinstance(log_id, str)
        True
    """

    meal = db.scalar(select(MealLog).where(MealLog.id == log_id, MealLog.user_id == user.id))
    if meal is None:
        raise LookupError("Meal log not found.")
    db.delete(meal)
    db.commit()


def search_foods(db: Session, query: str, limit: int = 20, offset: int = 0) -> FoodSearchResponse:
    """Search the seeded food database using a case-insensitive contains filter.

    Parameters:
        db: The active SQLAlchemy session.
        query: The text query entered by the user.
        limit: Maximum number of results to return.
        offset: Result offset for pagination.

    Returns:
        FoodSearchResponse: Matching foods and the total number of matches.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> limit > 0
        True
    """

    seed_food_items(db)
    base_query = select(FoodItem).where(FoodItem.name.ilike(f"%{query}%"))
    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    rows = db.scalars(base_query.order_by(FoodItem.name).offset(offset).limit(limit)).all()
    return FoodSearchResponse(
        results=[FoodSearchResult.model_validate(item) for item in rows],
        total=total,
    )


def _day_type_from_activity_summary(
    planned_activity: dict[str, object] | None, completed_count: int
) -> str:
    """Infer the current day type from the generated daily brief.

    Parameters:
        planned_activity: The generated activity suggestion or `None`.
        completed_count: The number of completed activities on the target date.

    Returns:
        str: One of the configured day type rule keys.

    Raises:
        None.

    Example:
        >>> _day_type_from_activity_summary({"code": "long_ride"}, 0)
        'long_ride'
    """

    if planned_activity is None and completed_count == 0:
        return "rest"
    if planned_activity is None and completed_count > 0:
        return "easy_z2"
    return str(planned_activity.get("code", "easy_z2"))


def resolve_daily_target(db: Session, user: User, target_date: date) -> DailyNutritionTarget:
    """Compute and cache the athlete's daily macro targets for a specific date.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose targets are being resolved.
        target_date: The calendar date that needs a target snapshot.

    Returns:
        DailyNutritionTarget: The cached or newly computed target row.

    Raises:
        SQLAlchemyError: Propagated if the target cannot be stored.

    Example:
        >>> isinstance(target_date, date)
        True
    """

    existing = db.scalar(
        select(DailyNutritionTarget).where(
            DailyNutritionTarget.user_id == user.id,
            DailyNutritionTarget.target_date == target_date,
        )
    )
    if existing is not None:
        return existing

    # Import lazily to avoid a circular module dependency at import time.
    from app.services.training import generate_daily_brief, get_completed_activities_for_day

    completed = get_completed_activities_for_day(db, user, target_date)
    planned_activity = generate_daily_brief(db, user, target_date)["planned_activity"]
    day_type = _day_type_from_activity_summary(planned_activity, len(completed))
    rules = DAY_TYPE_RULES[day_type]

    target = DailyNutritionTarget(
        user_id=user.id,
        target_date=target_date,
        day_type=day_type,
        calories=scaled_target(user.daily_calorie_target, float(rules["calories"])),
        protein_g=scaled_target(user.protein_target_g, float(rules["protein"])),
        carbs_g=scaled_target(user.carbs_target_g, float(rules["carbs"])),
        fat_g=scaled_target(user.fat_target_g, float(rules["fat"])),
        note=str(rules["note"]),
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return target


def list_meal_logs(
    db: Session, user: User, start_date: date, end_date: date
) -> NutritionLogResponse:
    """Return meal logs for the requested date window.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose logs are requested.
        start_date: The inclusive start date of the requested window.
        end_date: The inclusive end date of the requested window.

    Returns:
        NutritionLogResponse: Serialized meal log data for the window.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> start_date <= end_date
        True
    """

    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=UTC)
    rows = db.scalars(
        select(MealLog)
        .options(selectinload(MealLog.ingredients))
        .where(
            MealLog.user_id == user.id,
            MealLog.logged_at >= start_dt,
            MealLog.logged_at < end_dt,
        )
        .order_by(MealLog.logged_at.desc())
    ).all()
    return NutritionLogResponse(logs=[serialize_meal(row) for row in rows])


def get_day_summary(
    db: Session, user: User, target_date: date | None = None
) -> NutritionTodayResponse:
    """Return a single day's meals and resolved dynamic macro targets.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose summary is being requested.
        target_date: Optional calendar day override used by tests and historical UI reads.

    Returns:
        NutritionTodayResponse: The requested day's meals and macro summary.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> get_today_summary is not None
        True
    """

    target_day = target_date or datetime.now(tz=UTC).date()
    logs = list_meal_logs(db, user, target_day, target_day).logs
    target = resolve_daily_target(db, user, target_day)
    totals = {
        "calories": round(sum(log.total_calories for log in logs), 1),
        "protein": round(sum(log.total_protein_g for log in logs), 1),
        "carbs": round(sum(log.total_carbs_g for log in logs), 1),
        "fat": round(sum(log.total_fat_g for log in logs), 1),
    }
    return NutritionTodayResponse(
        date=target_day,
        summary=NutritionSummary(
            calories_consumed=totals["calories"],
            calories_target=target.calories,
            protein_g=totals["protein"],
            carbs_g=totals["carbs"],
            fat_g=totals["fat"],
            target_day_type=target.day_type,
            note=target.note,
        ),
        meals=logs,
    )


def get_today_summary(db: Session, user: User, today: date | None = None) -> NutritionTodayResponse:
    """Return today's meals and the resolved dynamic macro targets.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose summary is being requested.
        today: Optional override used by tests.

    Returns:
        NutritionTodayResponse: Today's meals and macro summary.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> get_today_summary is not None
        True
    """

    return get_day_summary(db, user, target_date=today)


def get_weekly_nutrition(
    db: Session, user: User, end_date: date | None = None
) -> NutritionWeeklyResponse:
    """Return the trailing seven-day nutrition rollup for charts and reviews.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose nutrition window is being aggregated.
        end_date: Optional inclusive end date override.

    Returns:
        NutritionWeeklyResponse: Daily macro totals for the seven-day window.

    Raises:
        SQLAlchemyError: Propagated if the aggregation query fails.

    Example:
        >>> get_weekly_nutrition is not None
        True
    """

    final_day = end_date or datetime.now(tz=UTC).date()
    first_day = final_day - timedelta(days=6)
    logs = list_meal_logs(db, user, first_day, final_day).logs
    grouped: dict[date, dict[str, float]] = defaultdict(
        lambda: {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}
    )
    for log in logs:
        grouped[log.logged_at.date()]["calories"] += log.total_calories
        grouped[log.logged_at.date()]["protein_g"] += log.total_protein_g
        grouped[log.logged_at.date()]["carbs_g"] += log.total_carbs_g
        grouped[log.logged_at.date()]["fat_g"] += log.total_fat_g

    days = []
    for offset in range(7):
        current = first_day + timedelta(days=offset)
        totals = grouped[current]
        days.append(
            NutritionDayAggregate(
                date=current,
                calories=round(totals["calories"], 1),
                protein_g=round(totals["protein_g"], 1),
                carbs_g=round(totals["carbs_g"], 1),
                fat_g=round(totals["fat_g"], 1),
            )
        )
    return NutritionWeeklyResponse(days=days)


def parse_voice_meal(
    transcript_hint: str | None, meal_type_hint: str | None = None
) -> MealParseResponse:
    """Build a parsed meal response for a voice-logging workflow.

    Parameters:
        transcript_hint: Optional transcript text provided by the browser or tests.
        meal_type_hint: Optional meal type selected by the user.

    Returns:
        MealParseResponse: The parsed meal suggestion and confidence score.

    Raises:
        None.

    Example:
        >>> parse_voice_meal("oats and banana").parsed_meal.meal_name.startswith("Overnight")
        True
    """

    transcript = transcript_hint or "I had a mixed athlete meal."
    parsed_meal, confidence = parse_text_into_meal(transcript, meal_type_hint)
    return MealParseResponse(
        transcript=transcript,
        parsed_meal=ParsedMeal(
            meal_name=str(parsed_meal["meal_name"]),
            meal_type=str(parsed_meal["meal_type"]),
            ingredients=[
                IngredientPayload(**ingredient) for ingredient in parsed_meal["ingredients"]
            ],
        ),
        confidence=confidence,
    )


def parse_photo_meal(meal_type_hint: str | None = None) -> MealParseResponse:
    """Build a parsed meal response for a photo-logging workflow.

    Parameters:
        meal_type_hint: Optional meal type selected by the user.

    Returns:
        MealParseResponse: The parsed meal suggestion and confidence score.

    Raises:
        None.

    Example:
        >>> parse_photo_meal().parsed_meal.meal_type in {"breakfast", "lunch", "dinner", "snack"}
        True
    """

    parsed_meal, confidence = build_photo_meal(meal_type_hint)
    return MealParseResponse(
        parsed_meal=ParsedMeal(
            meal_name=str(parsed_meal["meal_name"]),
            meal_type=str(parsed_meal["meal_type"]),
            ingredients=[
                IngredientPayload(**ingredient) for ingredient in parsed_meal["ingredients"]
            ],
        ),
        confidence=confidence,
    )

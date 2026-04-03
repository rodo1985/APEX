"""Training services for Strava sync, load calculations, and daily planning."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from math import ceil

import httpx
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Activity, Goal, IntegrationConnection, User
from app.schemas import (
    ActivityListResponse,
    ActivityRead,
    StravaSyncResponse,
    TrainingLoadPoint,
    TrainingLoadResponse,
    TrainingMetrics,
    TrainingTodayResponse,
    TrainingWeeklyResponse,
    WeeklyTrainingSummary,
)
from app.services.providers import StravaAuthResult, get_strava_provider, next_sync_timestamp

settings = get_settings()


def dominant_sport(user: User, goal: Goal | None = None) -> str:
    """Return the most relevant sport for planning based on the profile and goal.

    Parameters:
        user: The athlete whose dominant sport should be inferred.
        goal: The active goal if one is available.

    Returns:
        str: Either `cycling` or `running`.

    Raises:
        None.

    Example:
        >>> dominant_sport(user=None, goal=None)  # doctest: +SKIP
        'cycling'
    """

    if goal and "run" in goal.description.lower():
        return "running"
    if goal and "ride" in goal.description.lower():
        return "cycling"
    if user and user.sports_json:
        return (
            "running"
            if "running" in user.sports_json and "cycling" not in user.sports_json
            else user.sports_json[0]
        )
    return "cycling"


def serialize_activity(activity: Activity) -> ActivityRead:
    """Convert an activity ORM object into the API response contract.

    Parameters:
        activity: The persisted activity ORM object.

    Returns:
        ActivityRead: The serialized activity payload.

    Raises:
        ValidationError: Raised by Pydantic if the activity data is malformed.

    Example:
        >>> hasattr(activity, "sport")
        True
    """

    metadata = activity.metadata_json or {}
    return ActivityRead(
        id=activity.id,
        strava_id=activity.strava_id,
        sport=activity.sport,
        name=activity.name,
        start_time=activity.start_time,
        duration_seconds=activity.duration_seconds,
        distance_m=activity.distance_m,
        elevation_m=activity.elevation_m,
        avg_power_w=activity.avg_power_w,
        normalized_power_w=activity.normalized_power_w,
        avg_hr=activity.avg_hr,
        max_hr=activity.max_hr,
        tss=activity.tss,
        intensity_factor=activity.intensity_factor,
        calories=activity.calories,
        map_polyline=metadata.get("map_polyline"),
        photo_urls=metadata.get("photo_urls", []),
        created_at=activity.created_at,
    )


def _estimate_tss(user: User, payload: dict[str, object]) -> tuple[float, float | None]:
    """Estimate TSS and intensity factor from normalized activity metrics.

    Parameters:
        user: The athlete used to supply FTP or LTHR benchmarks when available.
        payload: The normalized activity payload being persisted.

    Returns:
        tuple[float, float | None]: Estimated TSS and intensity factor.

    Raises:
        None.

    Example:
        >>> tss, intensity = _estimate_tss(user, payload)  # doctest: +SKIP
    """

    duration_hours = float(payload["duration_seconds"]) / 3600
    np_power = payload.get("normalized_power_w")
    avg_hr = payload.get("avg_hr")

    if np_power and user.ftp:
        intensity = round(float(np_power) / float(user.ftp), 2)
        tss = duration_hours * (intensity**2) * 100
        return round(tss, 1), intensity
    if avg_hr and user.lthr:
        intensity = round(float(avg_hr) / float(user.lthr), 2)
        tss = duration_hours * (intensity**2) * 85
        return round(tss, 1), intensity
    return round(duration_hours * 45, 1), None


def _normalize_mock_payload(user: User, payload: dict[str, object]) -> dict[str, object]:
    """Normalize a mock provider payload into the database write shape.

    Parameters:
        user: The athlete whose benchmarks may enrich calculated metrics.
        payload: The provider activity payload.

    Returns:
        dict[str, object]: A normalized payload ready for database persistence.

    Raises:
        None.

    Example:
        >>> "sport" in _normalize_mock_payload(user, payload)  # doctest: +SKIP
    """

    tss = float(payload.get("tss") or 0.0)
    intensity = payload.get("intensity_factor")
    if not tss:
        tss, intensity = _estimate_tss(user, payload)
    return {
        "strava_id": payload.get("strava_id"),
        "sport": payload["sport"],
        "name": payload["name"],
        "start_time": payload["start_time"],
        "duration_seconds": int(payload["duration_seconds"]),
        "distance_m": float(payload["distance_m"]),
        "elevation_m": float(payload["elevation_m"]),
        "avg_power_w": payload.get("avg_power_w"),
        "normalized_power_w": payload.get("normalized_power_w"),
        "avg_hr": payload.get("avg_hr"),
        "max_hr": payload.get("max_hr"),
        "tss": tss,
        "intensity_factor": intensity,
        "calories": float(payload.get("calories") or 0.0),
        "metadata_json": payload.get("metadata_json") or {},
    }


def _normalize_live_payload(user: User, payload: dict[str, object]) -> dict[str, object]:
    """Normalize a real Strava payload into the database write shape.

    Parameters:
        user: The athlete whose benchmarks may enrich calculated metrics.
        payload: The raw Strava activity payload.

    Returns:
        dict[str, object]: A normalized payload ready for database persistence.

    Raises:
        None.

    Example:
        >>> isinstance(payload, dict)
        True
    """

    sport = "running" if "run" in str(payload.get("sport_type", "")).lower() else "cycling"
    start_time = datetime.fromisoformat(str(payload["start_date"]).replace("Z", "+00:00"))
    normalized = {
        "strava_id": str(payload["id"]),
        "sport": sport,
        "name": payload["name"],
        "start_time": start_time,
        "duration_seconds": int(payload.get("moving_time") or payload.get("elapsed_time") or 0),
        "distance_m": float(payload.get("distance") or 0.0),
        "elevation_m": float(payload.get("total_elevation_gain") or 0.0),
        "avg_power_w": payload.get("average_watts"),
        "normalized_power_w": payload.get("weighted_average_watts") or payload.get("average_watts"),
        "avg_hr": int(payload["average_heartrate"]) if payload.get("average_heartrate") else None,
        "max_hr": int(payload["max_heartrate"]) if payload.get("max_heartrate") else None,
        "calories": float(payload.get("kilojoules") or payload.get("calories") or 0.0),
        "metadata_json": {
            "map_polyline": (payload.get("map") or {}).get("summary_polyline"),
            "source": "live",
        },
    }
    tss, intensity = _estimate_tss(user, normalized)
    normalized["tss"] = tss
    normalized["intensity_factor"] = intensity
    return normalized


def _fetch_live_strava_activities(access_token: str, days_back: int) -> list[dict[str, object]]:
    """Fetch recent activities directly from the Strava API using a user token.

    Parameters:
        access_token: The user's Strava access token.
        days_back: Number of days of history to request.

    Returns:
        list[dict[str, object]]: Raw Strava activity payloads.

    Raises:
        HTTPStatusError: Raised when the Strava API rejects the request.

    Example:
        >>> isinstance(access_token, str)
        True
    """

    after = int((datetime.now(tz=UTC) - timedelta(days=days_back)).timestamp())
    with httpx.Client(timeout=20.0) as client:
        response = client.get(
            "https://www.strava.com/api/v3/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"per_page": 200, "after": after},
        )
        response.raise_for_status()
        return response.json()


def upsert_strava_connection(
    db: Session, user: User, auth_result: StravaAuthResult
) -> IntegrationConnection:
    """Persist Strava connection metadata for the authenticated user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who completed the Strava flow.
        auth_result: The normalized Strava auth result returned by the provider.

    Returns:
        IntegrationConnection: The saved integration record.

    Raises:
        SQLAlchemyError: Propagated if the record cannot be stored.

    Example:
        >>> auth_result.athlete_id != ""
        True
    """

    connection = db.scalar(
        select(IntegrationConnection).where(
            IntegrationConnection.user_id == user.id,
            IntegrationConnection.provider == "strava",
        )
    )
    if connection is None:
        connection = IntegrationConnection(user_id=user.id, provider="strava")
        db.add(connection)

    connection.connected = True
    connection.external_account_id = auth_result.athlete_id
    connection.external_name = auth_result.athlete_name
    connection.access_token = auth_result.access_token
    connection.refresh_token = auth_result.refresh_token
    connection.last_sync_at = next_sync_timestamp()
    db.commit()
    db.refresh(connection)
    return connection


def disconnect_provider(db: Session, user: User, provider: str) -> None:
    """Disconnect the requested integration for the current user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the integration.
        provider: The provider name, such as `strava` or `google_calendar`.

    Returns:
        None.

    Raises:
        None.

    Example:
        >>> provider in {"strava", "google_calendar", "apple_health"}
        True
    """

    connection = db.scalar(
        select(IntegrationConnection).where(
            IntegrationConnection.user_id == user.id,
            IntegrationConnection.provider == provider,
        )
    )
    if connection is None:
        return
    connection.connected = False
    connection.access_token = None
    connection.refresh_token = None
    connection.last_sync_at = None
    connection.external_name = None
    connection.external_account_id = None
    db.add(connection)
    db.commit()


def get_completed_activities_for_day(db: Session, user: User, target_date: date) -> list[Activity]:
    """Return activities completed by the user on a specific date.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose activities are queried.
        target_date: The calendar date to inspect.

    Returns:
        list[Activity]: Activities completed on the requested date.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> isinstance(target_date, date)
        True
    """

    start_dt = datetime.combine(target_date, datetime.min.time(), tzinfo=UTC)
    end_dt = start_dt + timedelta(days=1)
    return db.scalars(
        select(Activity)
        .where(
            Activity.user_id == user.id,
            Activity.start_time >= start_dt,
            Activity.start_time < end_dt,
        )
        .order_by(Activity.start_time.asc())
    ).all()


def generate_daily_brief(db: Session, user: User, target_date: date) -> dict[str, object]:
    """Generate the deterministic daily plan used by Today, Coach, and Nutrition.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose daily brief is being generated.
        target_date: The date that should receive the generated plan.

    Returns:
        dict[str, object]: The planned activity, session description, and target stress.

    Raises:
        None.

    Example:
        >>> isinstance(target_date, date)
        True
    """

    goal = user.goal
    sport = dominant_sport(user, goal)
    weekly_target = goal.weekly_tss_target if goal else 320
    weekday = target_date.weekday()

    # The weekly structure intentionally mirrors the coaching docs: one long session,
    # one or two hard sessions, one strength-oriented day, and recovery between them.
    templates: dict[int, dict[str, object]] = {
        0: {
            "code": "easy_z2",
            "sport": sport,
            "title": "Aerobic reset",
            "expected_tss": ceil(weekly_target * 0.12),
            "zone_target": "Z2",
        },
        1: {
            "code": "run_weights" if sport == "running" else "hard",
            "sport": sport,
            "title": "Quality session",
            "expected_tss": ceil(weekly_target * 0.18),
            "zone_target": "Z3-Z4",
        },
        2: {
            "code": "easy_z2",
            "sport": sport,
            "title": "Steady endurance",
            "expected_tss": ceil(weekly_target * 0.14),
            "zone_target": "Z2",
        },
        3: {
            "code": "hard",
            "sport": sport,
            "title": "Intervals",
            "expected_tss": ceil(weekly_target * 0.20),
            "zone_target": "Z4",
        },
        4: {
            "code": "rest",
            "sport": sport,
            "title": "Recovery day",
            "expected_tss": 0,
            "zone_target": "Recovery",
        },
        5: {
            "code": "long_ride" if sport == "cycling" else "hard",
            "sport": sport,
            "title": "Long endurance day",
            "expected_tss": ceil(weekly_target * 0.30),
            "zone_target": "Z2",
        },
        6: {
            "code": "easy_z2",
            "sport": "running" if sport == "cycling" else sport,
            "title": "Support session",
            "expected_tss": ceil(weekly_target * 0.08),
            "zone_target": "Easy",
        },
    }
    planned = templates[weekday]
    return {
        "date": target_date.isoformat(),
        "planned_activity": {
            **planned,
            "description": f"{planned['title']} with a focus on {planned['zone_target']}.",
        },
    }


def _daily_tss_map(
    activities: list[Activity], start_date: date, end_date: date
) -> dict[date, float]:
    """Build a day-to-total-TSS map for the requested time window.

    Parameters:
        activities: Persisted activities that fall within or before the requested window.
        start_date: The first calendar date in the series.
        end_date: The final calendar date in the series.

    Returns:
        dict[date, float]: TSS totals keyed by date.

    Raises:
        None.

    Example:
        >>> start_date <= end_date
        True
    """

    tss_map: dict[date, float] = defaultdict(float)
    for activity in activities:
        day = activity.start_time.date()
        if start_date <= day <= end_date:
            tss_map[day] += float(activity.tss)
    return tss_map


def compute_load_series(
    db: Session,
    user: User,
    days: int = 90,
    end_date: date | None = None,
) -> list[TrainingLoadPoint]:
    """Compute CTL, ATL, and TSB across a rolling window of activities.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose training load is calculated.
        days: Number of days to include in the series.
        end_date: Optional inclusive end date override used in tests.

    Returns:
        list[TrainingLoadPoint]: Daily training load points ordered chronologically.

    Raises:
        SQLAlchemyError: Propagated if the activity query fails.

    Example:
        >>> days > 0
        True
    """

    last_day = end_date or datetime.now(tz=UTC).date()
    first_day = last_day - timedelta(days=days - 1)
    activities = db.scalars(
        select(Activity)
        .where(
            Activity.user_id == user.id,
            Activity.start_time
            < datetime.combine(last_day + timedelta(days=1), datetime.min.time(), tzinfo=UTC),
        )
        .order_by(Activity.start_time.asc())
    ).all()
    daily_tss = _daily_tss_map(activities, first_day, last_day)

    ctl = 0.0
    atl = 0.0
    series: list[TrainingLoadPoint] = []
    for offset in range(days):
        current = first_day + timedelta(days=offset)
        today_tss = daily_tss.get(current, 0.0)
        ctl = ctl + (today_tss - ctl) / 42
        atl = atl + (today_tss - atl) / 7
        tsb = ctl - atl
        series.append(
            TrainingLoadPoint(
                date=current,
                ctl=round(ctl, 1),
                atl=round(atl, 1),
                tsb=round(tsb, 1),
                daily_tss=round(today_tss, 1),
            )
        )
    return series


def _training_status(tsb: float) -> str:
    """Map TSB to the high-level readiness label used by the UI.

    Parameters:
        tsb: The current training stress balance.

    Returns:
        str: A human-readable readiness status.

    Raises:
        None.

    Example:
        >>> _training_status(-25)
        'overreaching'
    """

    if tsb <= -20:
        return "overreaching"
    if tsb <= -8:
        return "fatigued"
    if tsb >= 6:
        return "fresh"
    return "optimal"


def get_today_training_summary(
    db: Session, user: User, today: date | None = None
) -> TrainingTodayResponse:
    """Return today's generated plan, completed sessions, and current load metrics.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose summary is requested.
        today: Optional date override used by tests.

    Returns:
        TrainingTodayResponse: Today's training snapshot.

    Raises:
        SQLAlchemyError: Propagated if activity queries fail.

    Example:
        >>> get_today_training_summary is not None
        True
    """

    target_day = today or datetime.now(tz=UTC).date()
    series = compute_load_series(db, user, days=90, end_date=target_day)
    latest = (
        series[-1]
        if series
        else TrainingLoadPoint(date=target_day, ctl=0, atl=0, tsb=0, daily_tss=0)
    )
    completed = get_completed_activities_for_day(db, user, target_day)
    brief = generate_daily_brief(db, user, target_day)
    return TrainingTodayResponse(
        date=target_day,
        metrics=TrainingMetrics(
            ctl=latest.ctl,
            atl=latest.atl,
            tsb=latest.tsb,
            daily_tss=round(sum(activity.tss for activity in completed), 1),
        ),
        status=_training_status(latest.tsb),
        planned_activities=[brief["planned_activity"]],
        completed_activities=[serialize_activity(activity) for activity in completed],
    )


def list_activities(
    db: Session,
    user: User,
    start_date: date,
    end_date: date,
    sport: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> ActivityListResponse:
    """Return paginated activities filtered by date and optional sport.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose activities are requested.
        start_date: Inclusive start date for the filter window.
        end_date: Inclusive end date for the filter window.
        sport: Optional sport filter.
        limit: Maximum number of rows to return.
        offset: Offset used for pagination.

    Returns:
        ActivityListResponse: Filtered activities and total count.

    Raises:
        SQLAlchemyError: Propagated if the query fails.

    Example:
        >>> limit > 0
        True
    """

    start_dt = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=UTC)
    filters = [
        Activity.user_id == user.id,
        Activity.start_time >= start_dt,
        Activity.start_time < end_dt,
    ]
    if sport:
        filters.append(Activity.sport == sport)
    statement = select(Activity).where(*filters).order_by(Activity.start_time.desc())
    total = len(db.scalars(statement).all())
    rows = db.scalars(statement.offset(offset).limit(limit)).all()
    return ActivityListResponse(
        activities=[serialize_activity(activity) for activity in rows],
        total=total,
    )


def get_activity(db: Session, user: User, activity_id: str) -> ActivityRead:
    """Return a single activity owned by the current user.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the activity.
        activity_id: The activity identifier to fetch.

    Returns:
        ActivityRead: The serialized activity payload.

    Raises:
        LookupError: Raised when the activity does not exist for the user.

    Example:
        >>> isinstance(activity_id, str)
        True
    """

    activity = db.scalar(
        select(Activity).where(Activity.id == activity_id, Activity.user_id == user.id)
    )
    if activity is None:
        raise LookupError("Activity not found.")
    return serialize_activity(activity)


def upsert_activities(db: Session, user: User, payloads: list[dict[str, object]]) -> list[Activity]:
    """Insert or update activities using their Strava identifiers as dedupe keys.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who owns the activities.
        payloads: Normalized activity payloads ready for persistence.

    Returns:
        list[Activity]: Persisted ORM activity objects ordered by start time descending.

    Raises:
        SQLAlchemyError: Propagated if persistence fails.

    Example:
        >>> isinstance(payloads, list)
        True
    """

    persisted: list[Activity] = []
    for payload in payloads:
        activity = None
        if payload.get("strava_id"):
            activity = db.scalar(
                select(Activity).where(
                    Activity.user_id == user.id,
                    Activity.strava_id == payload["strava_id"],
                )
            )
        if activity is None:
            activity = Activity(user_id=user.id, **payload)
            db.add(activity)
        else:
            for key, value in payload.items():
                setattr(activity, key, value)
            db.add(activity)
        persisted.append(activity)
    db.commit()
    for activity in persisted:
        db.refresh(activity)
    return sorted(persisted, key=lambda row: row.start_time, reverse=True)


def sync_strava_activities(db: Session, user: User, days_back: int = 7) -> StravaSyncResponse:
    """Sync recent activities from Strava or the deterministic local mock.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose integration should be synced.
        days_back: Number of days of recent history to synchronize.

    Returns:
        StravaSyncResponse: The persisted activities returned by the sync.

    Raises:
        ValueError: Raised when Strava is not connected for the user.

    Example:
        >>> days_back > 0
        True
    """

    connection = db.scalar(
        select(IntegrationConnection).where(
            IntegrationConnection.user_id == user.id,
            IntegrationConnection.provider == "strava",
            IntegrationConnection.connected.is_(True),
        )
    )
    if connection is None:
        raise ValueError("Strava is not connected for this user.")

    provider = get_strava_provider(settings)
    if connection.access_token and settings.strava_client_id and settings.strava_client_secret:
        raw_activities = _fetch_live_strava_activities(connection.access_token, days_back)
        payloads = [_normalize_live_payload(user, item) for item in raw_activities]
    else:
        payloads = [
            _normalize_mock_payload(user, item)
            for item in provider.fetch_recent_activities(days_back)
        ]

    persisted = upsert_activities(db, user, payloads)
    connection.last_sync_at = next_sync_timestamp()
    db.add(connection)
    db.commit()
    return StravaSyncResponse(
        synced_count=len(persisted),
        activities=[serialize_activity(activity) for activity in persisted],
    )


def import_strava_history(db: Session, user: User, days_back: int = 90) -> None:
    """Import onboarding history immediately after a Strava connection succeeds.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose history should be imported.
        days_back: The number of days of history to import.

    Returns:
        None.

    Raises:
        ValueError: Raised when Strava is not connected for the user.

    Example:
        >>> days_back >= 7
        True
    """

    connection = db.scalar(
        select(IntegrationConnection).where(
            IntegrationConnection.user_id == user.id,
            IntegrationConnection.provider == "strava",
            IntegrationConnection.connected.is_(True),
        )
    )
    if connection is None:
        raise ValueError("Strava is not connected for this user.")

    provider = get_strava_provider(settings)
    if connection.access_token and settings.strava_client_id and settings.strava_client_secret:
        raw_activities = _fetch_live_strava_activities(connection.access_token, days_back)
        payloads = [_normalize_live_payload(user, item) for item in raw_activities]
    else:
        payloads = [
            _normalize_mock_payload(user, item) for item in provider.fetch_history(days_back)
        ]
    upsert_activities(db, user, payloads)


def get_training_load(db: Session, user: User, days: int = 90) -> TrainingLoadResponse:
    """Return the rolling load series for the requested time window.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose training load is requested.
        days: Number of days to include in the series.

    Returns:
        TrainingLoadResponse: CTL, ATL, and TSB points for the requested window.

    Raises:
        SQLAlchemyError: Propagated if the activity query fails.

    Example:
        >>> days > 0
        True
    """

    return TrainingLoadResponse(series=compute_load_series(db, user, days=days))


def get_weekly_training(db: Session, user: User, weeks: int = 8) -> TrainingWeeklyResponse:
    """Aggregate activities into weekly training summaries for charts and review.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose weekly history is requested.
        weeks: Number of trailing weeks to include.

    Returns:
        TrainingWeeklyResponse: Weekly training summaries ordered from oldest to newest.

    Raises:
        SQLAlchemyError: Propagated if the activity query fails.

    Example:
        >>> weeks > 0
        True
    """

    end_day = datetime.now(tz=UTC).date()
    start_day = end_day - timedelta(days=(weeks * 7) - 1)
    rows = db.scalars(
        select(Activity)
        .where(
            Activity.user_id == user.id,
            Activity.start_time >= datetime.combine(start_day, datetime.min.time(), tzinfo=UTC),
        )
        .order_by(Activity.start_time.asc())
    ).all()

    grouped: dict[date, dict[str, float]] = defaultdict(
        lambda: {
            "total_tss": 0.0,
            "total_hours": 0.0,
            "total_distance_km": 0.0,
            "activities_count": 0.0,
        }
    )
    for row in rows:
        week_start = row.start_time.date() - timedelta(days=row.start_time.date().weekday())
        grouped[week_start]["total_tss"] += row.tss
        grouped[week_start]["total_hours"] += row.duration_seconds / 3600
        grouped[week_start]["total_distance_km"] += row.distance_m / 1000
        grouped[week_start]["activities_count"] += 1

    summaries: list[WeeklyTrainingSummary] = []
    first_week = start_day - timedelta(days=start_day.weekday())
    for offset in range(weeks):
        week_start = first_week + timedelta(days=offset * 7)
        values = grouped[week_start]
        summaries.append(
            WeeklyTrainingSummary(
                week_start=week_start,
                total_tss=round(values["total_tss"], 1),
                total_hours=round(values["total_hours"], 1),
                total_distance_km=round(values["total_distance_km"], 1),
                activities_count=int(values["activities_count"]),
            )
        )
    return TrainingWeeklyResponse(weeks=summaries)


def connect_strava_with_code(db: Session, user: User, code: str) -> IntegrationConnection:
    """Complete the Strava callback flow and import onboarding history.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user who initiated the Strava flow.
        code: The returned Strava authorization code.

    Returns:
        IntegrationConnection: The saved Strava integration record.

    Raises:
        ValueError: Raised when the provider rejects the code.

    Example:
        >>> isinstance(code, str)
        True
    """

    provider = get_strava_provider(settings)
    auth_result = provider.exchange_code(code)
    connection = upsert_strava_connection(db, user, auth_result)
    import_strava_history(db, user)
    return connection


def reset_user_training_data(db: Session, user: User) -> None:
    """Delete a user's activities, primarily for tests and local fixture resets.

    Parameters:
        db: The active SQLAlchemy session.
        user: The authenticated user whose activities should be removed.

    Returns:
        None.

    Raises:
        SQLAlchemyError: Propagated if the delete statement fails.

    Example:
        >>> hasattr(user, "id")
        True
    """

    db.execute(delete(Activity).where(Activity.user_id == user.id))
    db.commit()

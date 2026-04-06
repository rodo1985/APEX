"""Service-level tests for APEX nutrition, training, and coach logic."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Activity, Goal, User
from app.services.coach import build_context_payload
from app.services.nutrition import resolve_daily_target
from app.services.training import _normalize_live_payload, compute_load_series


def create_service_user(db_session: Session) -> User:
    """Create and persist a representative athlete for service-layer tests.

    Parameters:
        db_session: The active SQLAlchemy session used by the test.

    Returns:
        User: The persisted athlete record with a linked performance goal.

    Raises:
        SQLAlchemyError: Propagated if the fixture data cannot be stored.

    Example:
        >>> create_service_user(db_session).email.endswith("@example.com")  # doctest: +SKIP
        True
    """

    user = User(
        email="services@example.com",
        password_hash="hashed-password",
        name="Service Athlete",
        sports_json=["cycling"],
        ftp=300,
        lthr=172,
        weight_kg=70,
        height_cm=179,
        daily_calorie_target=2400,
        protein_target_g=150,
        carbs_target_g=300,
        fat_target_g=70,
    )
    goal = Goal(
        user=user,
        goal_type="race",
        description="Peak for alpine gran fondo",
        target_date=date(2026, 9, 1),
        goal_weight_kg=68,
        available_training_days=5,
        phase_name="Build",
        weekly_tss_target=420,
        weekly_hours_target=8.0,
    )
    db_session.add_all([user, goal])
    db_session.commit()
    db_session.refresh(user)
    return user


def test_resolve_daily_target_applies_long_ride_rules(db_session: Session) -> None:
    """Verify the cached macro targets follow the documented day-type multipliers.

    Parameters:
        db_session: The active SQLAlchemy session used by the test.

    Returns:
        None.

    Raises:
        AssertionError: Raised when target scaling drifts from the coach spec.

    Example:
        >>> test_resolve_daily_target_applies_long_ride_rules(db_session)  # doctest: +SKIP
    """

    user = create_service_user(db_session)
    saturday = date(2026, 4, 4)

    target = resolve_daily_target(db_session, user, saturday)

    assert target.day_type == "long_ride"
    assert target.calories == 2688
    assert target.carbs_g == 375
    assert target.protein_g == 158
    assert target.fat_g == 70


def test_compute_load_series_tracks_ctl_atl_and_tsb(db_session: Session) -> None:
    """Verify the load-series math produces the expected fatigue pattern.

    Parameters:
        db_session: The active SQLAlchemy session used by the test.

    Returns:
        None.

    Raises:
        AssertionError: Raised when the CTL/ATL/TSB calculations regress.

    Example:
        >>> test_compute_load_series_tracks_ctl_atl_and_tsb(db_session)  # doctest: +SKIP
    """

    user = create_service_user(db_session)
    end_date = date(2026, 4, 8)

    for offset in range(7):
        activity_date = end_date - timedelta(days=6 - offset)
        db_session.add(
            Activity(
                user_id=user.id,
                sport="cycling",
                name=f"Session {offset + 1}",
                start_time=datetime.combine(activity_date, datetime.min.time(), tzinfo=UTC),
                duration_seconds=3600,
                distance_m=30000,
                elevation_m=400,
                normalized_power_w=240,
                avg_hr=150,
                max_hr=170,
                tss=100,
                intensity_factor=0.8,
                calories=900,
                metadata_json={"source": "test"},
            )
        )
    db_session.commit()

    series = compute_load_series(db_session, user, days=7, end_date=end_date)

    assert len(series) == 7
    assert series[-1].daily_tss == 100
    assert series[-1].atl > series[-1].ctl
    assert series[-1].tsb < 0


def test_normalize_live_payload_maps_strava_fields_to_apex_contract(db_session: Session) -> None:
    """Verify live Strava payload mapping preserves training metrics cleanly.

    Parameters:
        db_session: The active SQLAlchemy session used by the test.

    Returns:
        None.

    Raises:
        AssertionError: Raised when field normalization changes unexpectedly.

    Example:
        >>> test_normalize_live_payload_maps_strava_fields_to_apex_contract(db_session)  # doctest: +SKIP
    """

    user = create_service_user(db_session)

    normalized = _normalize_live_payload(
        user,
        {
            "id": 1234,
            "sport_type": "Ride",
            "name": "Threshold climb",
            "start_date": "2026-04-01T07:00:00Z",
            "moving_time": 5400,
            "distance": 52000,
            "total_elevation_gain": 900,
            "average_watts": 215,
            "weighted_average_watts": 250,
            "average_heartrate": 155,
            "max_heartrate": 176,
            "kilojoules": 1400,
            "map": {"summary_polyline": "encoded-polyline"},
        },
    )

    assert normalized["sport"] == "cycling"
    assert normalized["strava_id"] == "1234"
    assert normalized["metadata_json"]["map_polyline"] == "encoded-polyline"
    assert normalized["tss"] > 0
    assert normalized["intensity_factor"] == round(250 / 300, 2)


def test_build_context_payload_uses_resolved_targets_and_load_state(db_session: Session) -> None:
    """Verify the coach context payload includes live target and load information.

    Parameters:
        db_session: The active SQLAlchemy session used by the test.

    Returns:
        None.

    Raises:
        AssertionError: Raised when the coach context loses required fields.

    Example:
        >>> test_build_context_payload_uses_resolved_targets_and_load_state(db_session)  # doctest: +SKIP
    """

    user = create_service_user(db_session)
    today = datetime.now(tz=UTC)
    db_session.add(
        Activity(
            user_id=user.id,
            sport="cycling",
            name="Morning endurance",
            start_time=today - timedelta(hours=2),
            duration_seconds=5400,
            distance_m=45000,
            elevation_m=500,
            normalized_power_w=225,
            avg_hr=148,
            max_hr=167,
            tss=82,
            intensity_factor=0.75,
            calories=1100,
            metadata_json={"source": "test"},
        )
    )
    db_session.commit()

    context = build_context_payload(db_session, user)

    assert context["athlete"]["name"] == "Service Athlete"
    assert context["today"]["macro_targets"]["calories"] > 0
    assert context["fitness"]["ctl"] >= 0
    assert context["goal"]["phase"] == "Build"

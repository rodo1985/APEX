"""Seed data and deterministic fixtures used across development and tests."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

FOOD_SEED: list[dict[str, object]] = [
    {
        "name": "Rolled oats",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 389,
        "protein_g": 16.9,
        "carbs_g": 66.3,
        "fat_g": 6.9,
        "source": "seed",
    },
    {
        "name": "Banana",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 89,
        "protein_g": 1.1,
        "carbs_g": 22.8,
        "fat_g": 0.3,
        "source": "seed",
    },
    {
        "name": "Honey",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 304,
        "protein_g": 0.3,
        "carbs_g": 82.4,
        "fat_g": 0.0,
        "source": "seed",
    },
    {
        "name": "Chicken breast, cooked",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 165,
        "protein_g": 31.0,
        "carbs_g": 0.0,
        "fat_g": 3.6,
        "source": "seed",
    },
    {
        "name": "White rice, cooked",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 130,
        "protein_g": 2.7,
        "carbs_g": 28.0,
        "fat_g": 0.3,
        "source": "seed",
    },
    {
        "name": "Greek yogurt",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 97,
        "protein_g": 10.0,
        "carbs_g": 3.9,
        "fat_g": 5.0,
        "source": "seed",
    },
    {
        "name": "Whey protein",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 30,
        "calories": 120,
        "protein_g": 24.0,
        "carbs_g": 3.0,
        "fat_g": 1.5,
        "source": "seed",
    },
    {
        "name": "Eggs",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 143,
        "protein_g": 12.6,
        "carbs_g": 0.7,
        "fat_g": 9.5,
        "source": "seed",
    },
    {
        "name": "Sourdough bread",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 289,
        "protein_g": 9.1,
        "carbs_g": 56.4,
        "fat_g": 2.3,
        "source": "seed",
    },
    {
        "name": "Mixed greens",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 17,
        "protein_g": 1.8,
        "carbs_g": 3.0,
        "fat_g": 0.3,
        "source": "seed",
    },
    {
        "name": "Berries",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 57,
        "protein_g": 0.7,
        "carbs_g": 14.0,
        "fat_g": 0.3,
        "source": "seed",
    },
    {
        "name": "Granola",
        "brand": "Generic",
        "serving_unit": "g",
        "serving_size": 100,
        "calories": 471,
        "protein_g": 10.0,
        "carbs_g": 64.0,
        "fat_g": 20.0,
        "source": "seed",
    },
]


def build_mock_strava_activities(
    now: datetime | None = None, days: int = 90
) -> list[dict[str, object]]:
    """Return a deterministic set of cycling and running activities for local syncs.

    Parameters:
        now: Optional anchor timestamp used to keep tests stable.
        days: Number of days of history to generate.

    Returns:
        list[dict[str, object]]: Normalized activity payloads mirroring Strava fields.

    Raises:
        None.

    Example:
        >>> len(build_mock_strava_activities(days=14)) > 0
        True
    """

    anchor = now or datetime.now(tz=UTC)
    activities: list[dict[str, object]] = []

    # The pattern alternates ride, recovery, run, and long session days so the
    # dashboard has realistic load variation without requiring external APIs.
    for offset in range(days):
        day = anchor - timedelta(days=offset)
        weekday = day.weekday()
        if weekday == 0:
            activities.append(
                {
                    "strava_id": f"mock-run-{day.date()}",
                    "sport": "running",
                    "name": "Steady aerobic run",
                    "start_time": day.replace(hour=6, minute=30, second=0, microsecond=0),
                    "duration_seconds": 55 * 60,
                    "distance_m": 11200,
                    "elevation_m": 110,
                    "avg_power_w": None,
                    "normalized_power_w": None,
                    "avg_hr": 148,
                    "max_hr": 166,
                    "tss": 64.0,
                    "intensity_factor": 0.78,
                    "calories": 860.0,
                    "metadata_json": {"source": "mock", "pace_min_km": 4.9},
                }
            )
        elif weekday == 2:
            activities.append(
                {
                    "strava_id": f"mock-ride-{day.date()}",
                    "sport": "cycling",
                    "name": "Threshold intervals",
                    "start_time": day.replace(hour=7, minute=0, second=0, microsecond=0),
                    "duration_seconds": 80 * 60,
                    "distance_m": 38200,
                    "elevation_m": 420,
                    "avg_power_w": 228,
                    "normalized_power_w": 252,
                    "avg_hr": 152,
                    "max_hr": 176,
                    "tss": 92.0,
                    "intensity_factor": 0.88,
                    "calories": 980.0,
                    "metadata_json": {"source": "mock", "zone_target": "Z3-Z4"},
                }
            )
        elif weekday == 5:
            activities.append(
                {
                    "strava_id": f"mock-long-{day.date()}",
                    "sport": "cycling",
                    "name": "Weekend long ride",
                    "start_time": day.replace(hour=8, minute=0, second=0, microsecond=0),
                    "duration_seconds": 195 * 60,
                    "distance_m": 86500,
                    "elevation_m": 1180,
                    "avg_power_w": 205,
                    "normalized_power_w": 224,
                    "avg_hr": 146,
                    "max_hr": 168,
                    "tss": 158.0,
                    "intensity_factor": 0.81,
                    "calories": 1820.0,
                    "metadata_json": {"source": "mock", "zone_target": "Z2"},
                }
            )
        elif weekday == 6:
            activities.append(
                {
                    "strava_id": f"mock-recovery-{day.date()}",
                    "sport": "running",
                    "name": "Short recovery run",
                    "start_time": day.replace(hour=9, minute=30, second=0, microsecond=0),
                    "duration_seconds": 35 * 60,
                    "distance_m": 6200,
                    "elevation_m": 45,
                    "avg_power_w": None,
                    "normalized_power_w": None,
                    "avg_hr": 132,
                    "max_hr": 148,
                    "tss": 28.0,
                    "intensity_factor": 0.62,
                    "calories": 430.0,
                    "metadata_json": {"source": "mock", "zone_target": "Recovery"},
                }
            )
    return sorted(activities, key=lambda item: item["start_time"])

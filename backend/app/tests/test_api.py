"""Contract-level API tests for the APEX MVP backend."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient


def register_demo_user(client: TestClient) -> dict[str, str]:
    """Register a fresh demo user and return auth headers plus identifiers.

    Parameters:
        client: The FastAPI test client used for API requests.

    Returns:
        dict[str, str]: The created user id plus bearer authorization header value.

    Raises:
        AssertionError: Raised when registration unexpectedly fails in a test.

    Example:
        >>> "Authorization" in register_demo_user(client)  # doctest: +SKIP
        True
    """

    response = client.post(
        "/v1/auth/register",
        json={
            "email": "athlete@example.com",
            "password": "secret-pass-123",
            "name": "Demo Athlete",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    return {
        "user_id": payload["user_id"],
        "Authorization": f"Bearer {payload['access_token']}",
    }


def test_auth_and_profile_update_flow(client: TestClient) -> None:
    """Verify registration, profile reads, and onboarding updates through the API.

    Parameters:
        client: The FastAPI test client wired to the isolated test database.

    Returns:
        None.

    Raises:
        AssertionError: Raised when the API contract regresses.

    Example:
        >>> test_auth_and_profile_update_flow(client)  # doctest: +SKIP
    """

    headers = register_demo_user(client)

    profile_response = client.get("/v1/user/me", headers=headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == "athlete@example.com"

    update_response = client.patch(
        "/v1/user/me",
        headers=headers,
        json={
            "sports": ["cycling", "running"],
            "weight_kg": 69,
            "height_cm": 178,
            "ftp": 290,
            "lthr": 171,
            "daily_calorie_target": 2550,
            "macro_targets": {"protein_g": 155, "carbs_g": 320, "fat_g": 70},
            "active_goal": {
                "goal_type": "race",
                "description": "Sub-5 hour Gran Fondo",
                "target_date": "2026-09-20",
                "goal_weight_kg": 67,
                "available_training_days": 5,
                "secondary_goal": "Keep running volume",
                "constraints_text": "Weekday sessions must stay under 75 minutes",
                "phase_name": "Build",
                "weekly_tss_target": 420,
                "weekly_hours_target": 8.5,
            },
        },
    )
    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["sports"] == ["cycling", "running"]
    assert payload["macro_targets"]["carbs_g"] == 320
    assert payload["active_goal"]["weekly_tss_target"] == 420


def test_manual_meal_logging_and_nutrition_rollups(client: TestClient) -> None:
    """Verify manual food logging, food search, and daily/weekly nutrition reads.

    Parameters:
        client: The FastAPI test client wired to the isolated test database.

    Returns:
        None.

    Raises:
        AssertionError: Raised when nutrition endpoints drift from the MVP contract.

    Example:
        >>> test_manual_meal_logging_and_nutrition_rollups(client)  # doctest: +SKIP
    """

    headers = register_demo_user(client)
    logged_at = datetime.now(tz=UTC).replace(microsecond=0).isoformat()

    search_response = client.get("/v1/nutrition/foods/search?q=banana", headers=headers)
    assert search_response.status_code == 200
    banana = search_response.json()["results"][0]
    assert banana["name"] == "Banana"

    create_response = client.post(
        "/v1/nutrition/log",
        headers=headers,
        json={
            "meal_type": "breakfast",
            "meal_name": "Banana oats bowl",
            "logged_at": logged_at,
            "ingredients": [
                {
                    "food_id": banana["food_id"],
                    "name": banana["name"],
                    "quantity_g": 100,
                    "calories": banana["calories"],
                    "protein_g": banana["protein_g"],
                    "carbs_g": banana["carbs_g"],
                    "fat_g": banana["fat_g"],
                }
            ],
        },
    )
    assert create_response.status_code == 201
    meal = create_response.json()
    assert meal["meal_name"] == "Banana oats bowl"

    today = datetime.now(tz=UTC).date().isoformat()
    today_response = client.get("/v1/nutrition/today", headers=headers)
    weekly_response = client.get("/v1/nutrition/weekly", headers=headers)
    log_response = client.get(f"/v1/nutrition/log?from={today}&to={today}", headers=headers)

    assert today_response.status_code == 200
    assert weekly_response.status_code == 200
    assert log_response.status_code == 200
    assert today_response.json()["summary"]["calories_consumed"] > 0
    assert today_response.json()["summary"]["target_day_type"] != ""
    assert len(weekly_response.json()["days"]) == 7
    assert log_response.json()["logs"][0]["log_id"] == meal["log_id"]


def test_strava_sync_and_training_endpoints(client: TestClient) -> None:
    """Verify mock Strava connection, onboarding import, and training summaries.

    Parameters:
        client: The FastAPI test client wired to the isolated test database.

    Returns:
        None.

    Raises:
        AssertionError: Raised when training endpoints fail to return expected data.

    Example:
        >>> test_strava_sync_and_training_endpoints(client)  # doctest: +SKIP
    """

    headers = register_demo_user(client)

    connect_response = client.get("/v1/auth/strava/callback?code=mock-code", headers=headers)
    assert connect_response.status_code == 200
    assert connect_response.json()["connected"] is True

    sync_response = client.post("/v1/training/strava/sync", headers=headers, json={"days_back": 14})
    today_response = client.get("/v1/training/today", headers=headers)
    load_response = client.get("/v1/training/load?days=30", headers=headers)
    weekly_response = client.get("/v1/training/weekly?weeks=4", headers=headers)
    activities_response = client.get(
        f"/v1/training/activities?from={datetime.now(tz=UTC).date().isoformat()}&to={datetime.now(tz=UTC).date().isoformat()}",
        headers=headers,
    )

    assert sync_response.status_code == 200
    assert sync_response.json()["synced_count"] > 0
    assert today_response.status_code == 200
    assert load_response.status_code == 200
    assert weekly_response.status_code == 200
    assert activities_response.status_code == 200
    assert len(load_response.json()["series"]) == 30
    assert len(weekly_response.json()["weeks"]) == 4
    assert today_response.json()["planned_activities"][0]["code"] in {
        "easy_z2",
        "hard",
        "long_ride",
        "rest",
        "run_weights",
    }


def test_coach_message_flow_persists_conversation_history(client: TestClient) -> None:
    """Verify coach replies are grounded, saved, and retrievable through the API.

    Parameters:
        client: The FastAPI test client wired to the isolated test database.

    Returns:
        None.

    Raises:
        AssertionError: Raised when coach persistence or retrieval regresses.

    Example:
        >>> test_coach_message_flow_persists_conversation_history(client)  # doctest: +SKIP
    """

    headers = register_demo_user(client)
    client.patch(
        "/v1/user/me",
        headers=headers,
        json={
            "sports": ["cycling"],
            "weight_kg": 70,
            "height_cm": 180,
            "daily_calorie_target": 2500,
            "macro_targets": {"protein_g": 150, "carbs_g": 300, "fat_g": 65},
            "active_goal": {
                "goal_type": "race",
                "description": "Mountain fondo build",
                "target_date": "2026-08-01",
                "goal_weight_kg": 68,
                "available_training_days": 5,
                "secondary_goal": None,
                "constraints_text": None,
                "phase_name": "Build",
                "weekly_tss_target": 400,
                "weekly_hours_target": 8,
            },
        },
    )
    client.get("/v1/auth/strava/callback?code=mock-code", headers=headers)

    reply_response = client.post(
        "/v1/coach/message",
        headers=headers,
        json={"message": "How should I fuel today's ride?"},
    )
    assert reply_response.status_code == 200
    reply_payload = reply_response.json()
    assert reply_payload["conversation_id"] != ""
    assert len(reply_payload["context_used"]) > 0

    conversations_response = client.get("/v1/coach/conversations", headers=headers)
    assert conversations_response.status_code == 200
    conversation_id = conversations_response.json()["conversations"][0]["conversation_id"]

    detail_response = client.get(f"/v1/coach/conversations/{conversation_id}", headers=headers)
    assert detail_response.status_code == 200
    assert [message["role"] for message in detail_response.json()["messages"]] == [
        "user",
        "assistant",
    ]

# APEX — API Contract v1.0

> **Stack:** FastAPI (Python) · PostgreSQL · Claude API · Whisper STT · Strava OAuth · Google Calendar OAuth  
> **Base URL:** `https://api.apex.app/v1`  
> **Auth:** Bearer JWT on all protected endpoints — `Authorization: Bearer <token>`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User & Profile](#2-user--profile)
3. [Food Log & Nutrition](#3-food-log--nutrition)
4. [Training & Activities](#4-training--activities)
5. [AI Coach](#5-ai-coach)
6. [Calendar](#6-calendar)
7. [Health Data](#7-health-data)
8. [Settings & Integrations](#8-settings--integrations)
9. [Data Models](#9-data-models)
10. [Error Format](#10-error-format)

---

## 1. Authentication

### `POST /auth/register`
Create a new user account.

**Request**
```json
{
  "email": "sergio@example.com",
  "password": "string",
  "name": "Sergio"
}
```
**Response `201`**
```json
{
  "user_id": "uuid",
  "email": "sergio@example.com",
  "name": "Sergio",
  "access_token": "jwt_string",
  "refresh_token": "jwt_string"
}
```

---

### `POST /auth/login`
**Request**
```json
{ "email": "string", "password": "string" }
```
**Response `200`**
```json
{
  "access_token": "jwt_string",
  "refresh_token": "jwt_string",
  "expires_in": 3600
}
```

---

### `POST /auth/refresh`
**Request**
```json
{ "refresh_token": "string" }
```
**Response `200`**
```json
{ "access_token": "jwt_string", "expires_in": 3600 }
```

---

### `POST /auth/logout`
🔒 Protected  
Invalidates the current refresh token.  
**Response `204`** No content.

---

### `GET /auth/strava`
Redirects user to Strava OAuth consent page.  
**Query params:** `redirect_uri=string`

---

### `GET /auth/strava/callback`
Strava OAuth callback — exchanges code for tokens and stores them.  
**Query params:** `code=string&state=string`  
**Response `200`**
```json
{ "connected": true, "athlete_id": "string", "athlete_name": "string" }
```

---

### `GET /auth/google`
Redirects user to Google OAuth consent page (Calendar scope).  
**Query params:** `redirect_uri=string`

---

### `GET /auth/google/callback`
Google OAuth callback.  
**Response `200`**
```json
{ "connected": true, "google_email": "string" }
```

---

## 2. User & Profile

### `GET /user/me`
🔒 Returns the authenticated user's profile.

**Response `200`**
```json
{
  "user_id": "uuid",
  "name": "Sergio",
  "email": "sergio@example.com",
  "avatar_url": "string|null",
  "sports": ["cycling", "running"],
  "ftp": 280,
  "lthr": 165,
  "weight_kg": 72.5,
  "height_cm": 178,
  "daily_calorie_target": 2800,
  "macro_targets": {
    "protein_g": 180,
    "carbs_g": 320,
    "fat_g": 90
  },
  "timezone": "America/Chicago",
  "created_at": "iso8601"
}
```

---

### `PATCH /user/me`
🔒 Update profile fields (partial update).

**Request** *(all fields optional)*
```json
{
  "name": "string",
  "ftp": 285,
  "lthr": 166,
  "weight_kg": 72.0,
  "daily_calorie_target": 2900,
  "macro_targets": { "protein_g": 185, "carbs_g": 330, "fat_g": 90 },
  "sports": ["cycling", "running"],
  "timezone": "America/Chicago"
}
```
**Response `200`** — updated user object.

---

### `POST /user/avatar`
🔒 Upload profile photo.  
**Request:** `multipart/form-data` — field `file` (image/jpeg, image/png, max 5 MB)  
**Response `200`**
```json
{ "avatar_url": "https://cdn.apex.app/avatars/uuid.jpg" }
```

---

## 3. Food Log & Nutrition

### `GET /nutrition/today`
🔒 Returns today's full nutrition summary + all logged meals.

**Response `200`**
```json
{
  "date": "2026-03-23",
  "summary": {
    "calories_consumed": 1840,
    "calories_target": 2800,
    "protein_g": 122,
    "carbs_g": 198,
    "fat_g": 62
  },
  "meals": [ "...MealLog objects" ]
}
```

---

### `GET /nutrition/log`
🔒 Returns meal logs filtered by date range.

**Query params:** `from=YYYY-MM-DD&to=YYYY-MM-DD`  
**Response `200`**
```json
{
  "logs": [ "...MealLog objects" ]
}
```

---

### `POST /nutrition/log`
🔒 Manually log a meal with ingredients.

**Request**
```json
{
  "meal_type": "breakfast | lunch | dinner | snack",
  "meal_name": "Post-ride recovery bowl",
  "logged_at": "iso8601",
  "ingredients": [
    {
      "food_id": "uuid | null",
      "name": "Greek Yogurt",
      "quantity_g": 200,
      "calories": 130,
      "protein_g": 17,
      "carbs_g": 9,
      "fat_g": 3.5
    }
  ]
}
```
**Response `201`** — full MealLog object.

---

### `PATCH /nutrition/log/{log_id}`
🔒 Update an existing meal log (edit ingredients, quantities, name).  
**Response `200`** — updated MealLog object.

---

### `DELETE /nutrition/log/{log_id}`
🔒 Delete a meal log.  
**Response `204`**

---

### `POST /nutrition/log/voice`
🔒 Submit an audio file for voice-based meal logging via Whisper + AI parsing.

**Request:** `multipart/form-data`
- `audio` — audio file (audio/wav, audio/m4a, audio/webm, max 25 MB)
- `meal_type` — `string` (optional hint)
- `logged_at` — ISO8601 (optional, defaults to now)

**Response `200`**
```json
{
  "transcript": "I had a bowl of oatmeal with banana and two eggs",
  "parsed_meal": {
    "meal_name": "Oatmeal with banana and eggs",
    "meal_type": "breakfast",
    "ingredients": [ "...parsed ingredient objects" ]
  },
  "confidence": 0.92
}
```
> The frontend shows this as a review screen before calling `POST /nutrition/log` to confirm.

---

### `POST /nutrition/log/photo`
🔒 Submit a photo for AI-based meal recognition.

**Request:** `multipart/form-data`
- `image` — image file (image/jpeg, image/png, max 10 MB)
- `meal_type` — string (optional)

**Response `200`**
```json
{
  "parsed_meal": {
    "meal_name": "Chicken rice bowl",
    "meal_type": "lunch",
    "ingredients": [ "...parsed ingredient objects" ]
  },
  "confidence": 0.85
}
```

---

### `GET /nutrition/foods/search`
🔒 Search the food database.

**Query params:** `q=chicken breast&limit=20&offset=0`  
**Response `200`**
```json
{
  "results": [
    {
      "food_id": "uuid",
      "name": "Chicken Breast, cooked",
      "brand": "Generic",
      "serving_unit": "g",
      "serving_size": 100,
      "calories": 165,
      "protein_g": 31,
      "carbs_g": 0,
      "fat_g": 3.6
    }
  ],
  "total": 42
}
```

---

### `GET /nutrition/weekly`
🔒 Returns aggregated nutrition data for a 7-day window.

**Query params:** `end_date=YYYY-MM-DD` (defaults to today)  
**Response `200`**
```json
{
  "days": [
    {
      "date": "2026-03-17",
      "calories": 2650,
      "protein_g": 175,
      "carbs_g": 310,
      "fat_g": 88
    }
  ]
}
```

---

## 4. Training & Activities

### `GET /training/today`
🔒 Returns today's training summary — TSS, load metrics, and any planned/completed activities.

**Response `200`**
```json
{
  "date": "2026-03-23",
  "metrics": {
    "ctl": 68.4,
    "atl": 72.1,
    "tsb": -3.7,
    "daily_tss": 85
  },
  "status": "optimal | fresh | fatigued | overreaching",
  "planned_activities": [ "...ActivitySummary objects" ],
  "completed_activities": [ "...ActivitySummary objects" ]
}
```

---

### `GET /training/activities`
🔒 Returns paginated activity list.

**Query params:** `from=YYYY-MM-DD&to=YYYY-MM-DD&sport=cycling|running&limit=20&offset=0`  
**Response `200`**
```json
{
  "activities": [ "...Activity objects" ],
  "total": 145
}
```

---

### `GET /training/activities/{activity_id}`
🔒 Returns full detail for a single activity.

**Response `200`** — full Activity object (see Data Models).

---

### `POST /training/strava/sync`
🔒 Manually trigger a Strava sync for recent activities.

**Request** *(optional)*
```json
{ "days_back": 7 }
```
**Response `200`**
```json
{
  "synced_count": 4,
  "activities": [ "...ActivitySummary objects" ]
}
```

---

### `GET /training/load`
🔒 Returns CTL/ATL/TSB curve for charting.

**Query params:** `days=90` (default 90)  
**Response `200`**
```json
{
  "series": [
    {
      "date": "2025-12-23",
      "ctl": 55.2,
      "atl": 48.1,
      "tsb": 7.1,
      "daily_tss": 0
    }
  ]
}
```

---

### `GET /training/weekly`
🔒 Returns weekly training volume summary.

**Query params:** `weeks=8`  
**Response `200`**
```json
{
  "weeks": [
    {
      "week_start": "2026-03-16",
      "total_tss": 420,
      "total_hours": 9.5,
      "total_distance_km": 185,
      "activities_count": 5
    }
  ]
}
```

---

## 5. AI Coach

### `POST /coach/message`
🔒 Send a text message to the AI coach. Maintains conversation context server-side.

**Request**
```json
{
  "message": "How should I adjust my nutrition before Saturday's long ride?",
  "conversation_id": "uuid | null"
}
```
**Response `200`**
```json
{
  "conversation_id": "uuid",
  "reply": "Based on your CTL of 68 and the 4h ride you have planned...",
  "context_used": ["nutrition", "training_load", "calendar"],
  "suggested_actions": [
    { "label": "Log pre-ride meal", "action": "open_food_log" }
  ]
}
```

---

### `POST /coach/voice`
🔒 Send a voice message to the AI coach (transcribed then processed).

**Request:** `multipart/form-data`
- `audio` — audio file (audio/wav, audio/m4a, audio/webm)
- `conversation_id` — string (optional)

**Response `200`**
```json
{
  "conversation_id": "uuid",
  "transcript": "How should I adjust my nutrition...",
  "reply": "Based on your recent training load...",
  "context_used": ["nutrition", "training_load"]
}
```

---

### `GET /coach/conversations`
🔒 Returns list of past coach conversations.

**Response `200`**
```json
{
  "conversations": [
    {
      "conversation_id": "uuid",
      "preview": "How should I adjust my nutrition...",
      "created_at": "iso8601",
      "updated_at": "iso8601"
    }
  ]
}
```

---

### `GET /coach/conversations/{conversation_id}`
🔒 Returns full message history for a conversation.

**Response `200`**
```json
{
  "conversation_id": "uuid",
  "messages": [
    {
      "role": "user | assistant",
      "content": "string",
      "timestamp": "iso8601"
    }
  ]
}
```

---

### `DELETE /coach/conversations/{conversation_id}`
🔒 Deletes a conversation.  
**Response `204`**

---

## 6. Calendar

### `GET /calendar/events`
🔒 Returns Google Calendar events in a date range.

**Query params:** `from=YYYY-MM-DD&to=YYYY-MM-DD`  
**Response `200`**
```json
{
  "events": [
    {
      "event_id": "google_event_id",
      "title": "Saturday Long Ride",
      "start": "iso8601",
      "end": "iso8601",
      "type": "workout | race | rest | other",
      "description": "string|null"
    }
  ]
}
```

---

### `POST /calendar/events`
🔒 Create a new calendar event (syncs to Google Calendar).

**Request**
```json
{
  "title": "Easy Recovery Run",
  "start": "2026-03-24T07:00:00",
  "end": "2026-03-24T08:00:00",
  "type": "workout",
  "description": "Zone 2 easy run — 45 min"
}
```
**Response `201`** — created event object.

---

### `DELETE /calendar/events/{event_id}`
🔒 Deletes an event from Google Calendar.  
**Response `204`**

---

## 7. Health Data

### `POST /health/apple/import`
🔒 Import Apple Health XML export. Parses sleep, HRV, resting HR, and step data.

**Request:** `multipart/form-data`
- `file` — `export.xml` from Apple Health (max 200 MB)

**Response `202` Accepted** (async processing)
```json
{
  "import_id": "uuid",
  "status": "processing",
  "message": "Import started. Check /health/apple/import/{import_id} for status."
}
```

---

### `GET /health/apple/import/{import_id}`
🔒 Poll import job status.

**Response `200`**
```json
{
  "import_id": "uuid",
  "status": "processing | complete | failed",
  "records_imported": 1842,
  "error": null
}
```

---

### `GET /health/sleep`
🔒 Returns sleep data.

**Query params:** `from=YYYY-MM-DD&to=YYYY-MM-DD`  
**Response `200`**
```json
{
  "records": [
    {
      "date": "2026-03-22",
      "duration_hours": 7.5,
      "deep_sleep_hours": 1.8,
      "hrv_ms": 52,
      "resting_hr": 48
    }
  ]
}
```

---

### `GET /health/metrics`
🔒 Returns daily health metrics summary.

**Query params:** `from=YYYY-MM-DD&to=YYYY-MM-DD`  
**Response `200`**
```json
{
  "metrics": [
    {
      "date": "2026-03-22",
      "steps": 8420,
      "resting_hr": 48,
      "hrv_ms": 52,
      "weight_kg": 72.3
    }
  ]
}
```

---

## 8. Settings & Integrations

### `GET /settings/integrations`
🔒 Returns connection status for all integrations.

**Response `200`**
```json
{
  "strava": {
    "connected": true,
    "athlete_name": "Sergio R.",
    "last_sync": "iso8601"
  },
  "google_calendar": {
    "connected": true,
    "email": "sergio@gmail.com"
  },
  "apple_health": {
    "connected": false,
    "last_import": null
  }
}
```

---

### `DELETE /settings/integrations/strava`
🔒 Disconnect Strava — revokes tokens.  
**Response `204`**

---

### `DELETE /settings/integrations/google`
🔒 Disconnect Google Calendar.  
**Response `204`**

---

### `GET /settings/api-keys`
🔒 Returns masked API keys stored for the user (e.g., personal Claude API key override).

**Response `200`**
```json
{
  "keys": [
    {
      "key_id": "uuid",
      "label": "Claude API Key",
      "masked_value": "sk••••••••••••••••••Xk9f",
      "created_at": "iso8601"
    }
  ]
}
```

---

### `POST /settings/api-keys`
🔒 Add a personal API key.

**Request**
```json
{ "label": "Claude API Key", "value": "sk-ant-..." }
```
**Response `201`** — masked key object.

---

### `DELETE /settings/api-keys/{key_id}`
🔒 Delete a stored API key.  
**Response `204`**

---

## 9. Data Models

### `MealLog`
```json
{
  "log_id": "uuid",
  "user_id": "uuid",
  "meal_type": "breakfast | lunch | dinner | snack",
  "meal_name": "Post-ride recovery bowl",
  "logged_at": "iso8601",
  "total_calories": 620,
  "total_protein_g": 48,
  "total_carbs_g": 72,
  "total_fat_g": 14,
  "ingredients": [ "...Ingredient objects" ],
  "source": "manual | voice | photo",
  "created_at": "iso8601"
}
```

### `Ingredient`
```json
{
  "ingredient_id": "uuid",
  "food_id": "uuid | null",
  "name": "Greek Yogurt",
  "quantity_g": 200,
  "calories": 130,
  "protein_g": 17,
  "carbs_g": 9,
  "fat_g": 3.5
}
```

### `Activity`
```json
{
  "activity_id": "uuid",
  "strava_id": "string | null",
  "sport": "cycling | running",
  "name": "Morning Ride",
  "start_time": "iso8601",
  "duration_seconds": 7200,
  "distance_m": 85000,
  "elevation_m": 1200,
  "avg_power_w": 210,
  "normalized_power_w": 225,
  "avg_hr": 148,
  "max_hr": 172,
  "tss": 148,
  "intensity_factor": 0.81,
  "calories": 1840,
  "map_polyline": "encoded_polyline | null",
  "photo_urls": ["string"],
  "created_at": "iso8601"
}
```

### `CoachMessage`
```json
{
  "message_id": "uuid",
  "conversation_id": "uuid",
  "role": "user | assistant",
  "content": "string",
  "context_used": ["nutrition", "training_load", "calendar", "sleep"],
  "timestamp": "iso8601"
}
```

---

## 10. Error Format

All errors return a consistent JSON body:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Activity with id abc123 was not found.",
    "details": {}
  }
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `202` | Accepted (async job started) |
| `204` | No Content (delete success) |
| `400` | Bad Request — validation error |
| `401` | Unauthorized — missing/invalid token |
| `403` | Forbidden — valid token, wrong permissions |
| `404` | Not Found |
| `409` | Conflict — duplicate resource |
| `422` | Unprocessable Entity — business logic error |
| `500` | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request body failed schema validation |
| `AUTH_INVALID_TOKEN` | JWT is missing or expired |
| `AUTH_INVALID_CREDENTIALS` | Wrong email/password |
| `RESOURCE_NOT_FOUND` | Entity does not exist |
| `INTEGRATION_NOT_CONNECTED` | Strava/Google not linked |
| `INTEGRATION_SYNC_FAILED` | External API error during sync |
| `AUDIO_PARSE_FAILED` | Whisper could not transcribe audio |
| `IMAGE_PARSE_FAILED` | Vision model could not identify food |
| `RATE_LIMITED` | Too many requests |

---

*APEX API Contract v1.0 — generated March 2026*

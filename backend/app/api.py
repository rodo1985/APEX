"""FastAPI router definitions for the APEX backend."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Goal, IntegrationConnection, User
from app.schemas import (
    ActivityListResponse,
    ActivityRead,
    AvatarUploadResponse,
    CoachMessageRequest,
    CoachReplyResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    FoodSearchResponse,
    IntegrationsResponse,
    IntegrationStatus,
    LoginRequest,
    MealLogCreate,
    MealLogRead,
    MealParseResponse,
    NutritionLogResponse,
    NutritionTodayResponse,
    NutritionWeeklyResponse,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    StravaSyncResponse,
    TrainingLoadResponse,
    TrainingTodayResponse,
    TrainingWeeklyResponse,
    UserProfileRead,
    UserProfileUpdate,
)
from app.services import auth as auth_service
from app.services import coach as coach_service
from app.services import nutrition as nutrition_service
from app.services import training as training_service
from app.services.providers import get_strava_provider

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Resolve the authenticated user from a bearer token.

    Parameters:
        credentials: The parsed HTTP bearer credentials supplied by FastAPI.
        db: The active SQLAlchemy session for user lookup.

    Returns:
        User: The authenticated user ORM object.

    Raises:
        HTTPException: Raised when the authorization header is missing or invalid.

    Example:
        >>> bearer_scheme.scheme_name
        'HTTPBearer'
    """

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_INVALID_TOKEN",
                "message": "Missing bearer token.",
                "details": {},
            },
        )
    try:
        return auth_service.get_user_from_access_token(db, credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_INVALID_TOKEN", "message": str(exc), "details": {}},
        ) from exc


@router.post("/auth/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]
) -> RegisterResponse:
    """Create a new user account and issue its initial token pair."""

    try:
        return auth_service.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "AUTH_DUPLICATE_EMAIL", "message": str(exc), "details": {}},
        ) from exc


@router.post("/auth/login")
def login_user(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, object]:
    """Authenticate a user and issue a fresh access and refresh token pair."""

    try:
        user = auth_service.authenticate_user(db, payload.email, payload.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_INVALID_CREDENTIALS", "message": str(exc), "details": {}},
        ) from exc
    return auth_service.issue_login_tokens(db, user)


@router.post("/auth/refresh")
def refresh_auth(
    payload: RefreshRequest, db: Annotated[Session, Depends(get_db)]
) -> dict[str, object]:
    """Rotate a valid refresh token into a new session pair."""

    try:
        return auth_service.rotate_refresh_token(db, payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_INVALID_TOKEN", "message": str(exc), "details": {}},
        ) from exc


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_user(payload: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> Response:
    """Invalidate an active refresh token and end the current authenticated session."""

    try:
        auth_service.revoke_refresh_token(db, payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "AUTH_INVALID_TOKEN", "message": str(exc), "details": {}},
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/auth/strava")
def start_strava_auth(
    redirect_uri: str = Query(..., description="Frontend callback route."),
) -> dict[str, str]:
    """Return the URL that should be opened to start the Strava connection flow."""

    provider = get_strava_provider()
    return {"authorize_url": provider.build_authorize_url(redirect_uri)}


@router.get("/auth/strava/callback")
def finish_strava_auth(
    code: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, object]:
    """Complete the Strava callback flow for the authenticated user."""

    try:
        connection = training_service.connect_strava_with_code(db, user, code)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INTEGRATION_SYNC_FAILED", "message": str(exc), "details": {}},
        ) from exc
    return {
        "connected": connection.connected,
        "athlete_id": connection.external_account_id,
        "athlete_name": connection.external_name,
    }


@router.get("/user/me", response_model=UserProfileRead)
def get_profile(user: Annotated[User, Depends(get_current_user)]) -> UserProfileRead:
    """Return the authenticated user's profile."""

    return auth_service.serialize_user(user)


@router.patch("/user/me", response_model=UserProfileRead)
def update_profile(
    payload: UserProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> UserProfileRead:
    """Apply partial profile and goal updates for the authenticated user."""

    if payload.name is not None:
        user.name = payload.name
    if payload.ftp is not None:
        user.ftp = payload.ftp
    if payload.lthr is not None:
        user.lthr = payload.lthr
    if payload.weight_kg is not None:
        user.weight_kg = payload.weight_kg
    if payload.height_cm is not None:
        user.height_cm = payload.height_cm
    if payload.daily_calorie_target is not None:
        user.daily_calorie_target = payload.daily_calorie_target
    if payload.sports is not None:
        user.sports_json = payload.sports
    if payload.timezone is not None:
        user.timezone = payload.timezone
    if payload.macro_targets is not None:
        user.protein_target_g = payload.macro_targets.protein_g
        user.carbs_target_g = payload.macro_targets.carbs_g
        user.fat_target_g = payload.macro_targets.fat_g

    if payload.active_goal is not None:
        goal = user.goal or Goal(user_id=user.id)
        goal.goal_type = payload.active_goal.goal_type
        goal.description = payload.active_goal.description
        goal.target_date = payload.active_goal.target_date
        goal.goal_weight_kg = payload.active_goal.goal_weight_kg
        goal.available_training_days = payload.active_goal.available_training_days
        goal.secondary_goal = payload.active_goal.secondary_goal
        goal.constraints_text = payload.active_goal.constraints_text
        goal.phase_name = payload.active_goal.phase_name
        goal.weekly_tss_target = payload.active_goal.weekly_tss_target
        goal.weekly_hours_target = payload.active_goal.weekly_hours_target
        user.goal = goal
        db.add(goal)

    db.add(user)
    db.commit()
    db.refresh(user)
    return auth_service.serialize_user(user)


@router.post("/user/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> AvatarUploadResponse:
    """Accept an avatar upload and store a deterministic local placeholder URL."""

    _ = await file.read()
    user.avatar_url = f"/static/avatars/{user.id}-{file.filename}"
    db.add(user)
    db.commit()
    return AvatarUploadResponse(avatar_url=user.avatar_url)


@router.get("/nutrition/today", response_model=NutritionTodayResponse)
def get_nutrition_today(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    target_date: date | None = Query(default=None, alias="date"),
) -> NutritionTodayResponse:
    """Return a nutrition summary and meals for the requested calendar day."""

    return nutrition_service.get_day_summary(db, user, target_date=target_date)


@router.get("/nutrition/log", response_model=NutritionLogResponse)
def get_nutrition_log(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: Annotated[Session, Depends(get_db)] = None,
    user: Annotated[User, Depends(get_current_user)] = None,
) -> NutritionLogResponse:
    """Return meal logs inside the requested date range."""

    return nutrition_service.list_meal_logs(db, user, from_date, to_date)


@router.post("/nutrition/log", response_model=MealLogRead, status_code=status.HTTP_201_CREATED)
def create_nutrition_log(
    payload: MealLogCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> MealLogRead:
    """Persist a confirmed nutrition log entry."""

    return nutrition_service.create_meal_log(db, user, payload)


@router.patch("/nutrition/log/{log_id}", response_model=MealLogRead)
def patch_nutrition_log(
    log_id: str,
    payload: MealLogCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> MealLogRead:
    """Update an existing nutrition log entry."""

    try:
        return nutrition_service.update_meal_log(db, user, log_id, payload)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc


@router.delete("/nutrition/log/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_nutrition_log(
    log_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    """Delete a nutrition log entry owned by the current user."""

    try:
        nutrition_service.delete_meal_log(db, user, log_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/nutrition/log/voice", response_model=MealParseResponse)
async def parse_voice_log(
    audio: UploadFile = File(...),
    meal_type: str | None = Form(default=None),
    logged_at: str | None = Form(default=None),
    transcript_hint: str | None = Form(default=None),
) -> MealParseResponse:
    """Parse an uploaded voice note into a reviewable nutrition suggestion."""

    _ = await audio.read()
    _ = logged_at
    return nutrition_service.parse_voice_meal(transcript_hint, meal_type)


@router.post("/nutrition/log/photo", response_model=MealParseResponse)
async def parse_photo_log(
    image: UploadFile = File(...),
    meal_type: str | None = Form(default=None),
) -> MealParseResponse:
    """Parse an uploaded meal photo into a reviewable nutrition suggestion."""

    _ = await image.read()
    return nutrition_service.parse_photo_meal(meal_type)


@router.get("/nutrition/foods/search", response_model=FoodSearchResponse)
def search_food_database(
    q: str,
    limit: int = 20,
    offset: int = 0,
    db: Annotated[Session, Depends(get_db)] = None,
) -> FoodSearchResponse:
    """Search the food database used by manual logging flows."""

    return nutrition_service.search_foods(db, q, limit=limit, offset=offset)


@router.get("/nutrition/weekly", response_model=NutritionWeeklyResponse)
def get_nutrition_weekly(
    end_date: date | None = None,
    db: Annotated[Session, Depends(get_db)] = None,
    user: Annotated[User, Depends(get_current_user)] = None,
) -> NutritionWeeklyResponse:
    """Return a seven-day nutrition rollup ending on the requested date."""

    return nutrition_service.get_weekly_nutrition(db, user, end_date=end_date)


@router.get("/training/today", response_model=TrainingTodayResponse)
def get_training_today(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    target_date: date | None = Query(default=None, alias="date"),
) -> TrainingTodayResponse:
    """Return a training summary and generated plan for the requested day."""

    return training_service.get_day_training_summary(db, user, target_date=target_date)


@router.get("/training/activities", response_model=ActivityListResponse)
def get_training_activities(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    sport: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: Annotated[Session, Depends(get_db)] = None,
    user: Annotated[User, Depends(get_current_user)] = None,
) -> ActivityListResponse:
    """Return filtered training activity history."""

    return training_service.list_activities(
        db, user, from_date, to_date, sport=sport, limit=limit, offset=offset
    )


@router.get("/training/activities/{activity_id}", response_model=ActivityRead)
def get_training_activity(
    activity_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ActivityRead:
    """Return the details for a single training activity."""

    try:
        return training_service.get_activity(db, user, activity_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc


@router.post("/training/strava/sync", response_model=StravaSyncResponse)
def sync_strava(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    payload: dict[str, int] | None = None,
) -> StravaSyncResponse:
    """Synchronize recent Strava activities for the authenticated user."""

    days_back = payload.get("days_back", 7) if payload else 7
    try:
        return training_service.sync_strava_activities(db, user, days_back=days_back)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "INTEGRATION_NOT_CONNECTED", "message": str(exc), "details": {}},
        ) from exc


@router.get("/training/load", response_model=TrainingLoadResponse)
def get_training_load(
    days: int = 90,
    end_date: date | None = None,
    db: Annotated[Session, Depends(get_db)] = None,
    user: Annotated[User, Depends(get_current_user)] = None,
) -> TrainingLoadResponse:
    """Return the CTL, ATL, and TSB load curve for the requested window."""

    return training_service.get_training_load(db, user, days=days, end_date=end_date)


@router.get("/training/weekly", response_model=TrainingWeeklyResponse)
def get_training_weekly(
    weeks: int = 8,
    db: Annotated[Session, Depends(get_db)] = None,
    user: Annotated[User, Depends(get_current_user)] = None,
) -> TrainingWeeklyResponse:
    """Return weekly training summaries for charts and review views."""

    return training_service.get_weekly_training(db, user, weeks=weeks)


@router.post("/coach/message", response_model=CoachReplyResponse)
def send_coach_message(
    payload: CoachMessageRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CoachReplyResponse:
    """Send a text message to the coach and persist the generated reply."""

    try:
        return coach_service.send_coach_message(
            db,
            user,
            message=payload.message,
            conversation_id=payload.conversation_id,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc


@router.post("/coach/voice", response_model=CoachReplyResponse)
async def send_coach_voice(
    audio: UploadFile = File(...),
    conversation_id: str | None = Form(default=None),
    transcript_hint: str | None = Form(default=None),
    db: Annotated[Session, Depends(get_db)] = None,
    user: Annotated[User, Depends(get_current_user)] = None,
) -> CoachReplyResponse:
    """Handle a push-to-talk coach message and persist the generated reply."""

    _ = await audio.read()
    transcript = transcript_hint or "Voice note received. Please review the summary."
    try:
        return coach_service.send_coach_message(
            db,
            user,
            message=transcript,
            conversation_id=conversation_id,
            transcript=transcript,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc


@router.get("/coach/conversations", response_model=ConversationListResponse)
def get_coach_conversations(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ConversationListResponse:
    """Return saved coach conversation previews for the authenticated user."""

    return coach_service.list_conversations(db, user)


@router.get("/coach/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_coach_conversation(
    conversation_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ConversationDetailResponse:
    """Return the full history for a saved coach conversation."""

    try:
        return coach_service.get_conversation(db, user, conversation_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc


@router.delete("/coach/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coach_conversation(
    conversation_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    """Delete a saved coach conversation."""

    try:
        coach_service.delete_conversation(db, user, conversation_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESOURCE_NOT_FOUND", "message": str(exc), "details": {}},
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/settings/integrations", response_model=IntegrationsResponse)
def get_integrations(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> IntegrationsResponse:
    """Return the current integration status for the authenticated user."""

    rows = db.query(IntegrationConnection).filter(IntegrationConnection.user_id == user.id).all()
    mapping = {row.provider: row for row in rows}
    strava = mapping.get("strava")
    google = mapping.get("google_calendar")
    apple = mapping.get("apple_health")
    return IntegrationsResponse(
        strava=IntegrationStatus(
            connected=bool(strava and strava.connected),
            athlete_name=strava.external_name if strava else None,
            last_sync=strava.last_sync_at if strava else None,
        ),
        google_calendar=IntegrationStatus(
            connected=bool(google and google.connected),
            email=google.external_name if google else None,
            last_sync=google.last_sync_at if google else None,
        ),
        apple_health=IntegrationStatus(
            connected=bool(apple and apple.connected),
            last_sync=apple.last_sync_at if apple else None,
        ),
    )


@router.delete("/settings/integrations/strava", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_strava(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    """Disconnect the current user's Strava integration."""

    training_service.disconnect_provider(db, user, "strava")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/settings/integrations/google", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_google(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Response:
    """Disconnect the current user's Google Calendar integration."""

    training_service.disconnect_provider(db, user, "google_calendar")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

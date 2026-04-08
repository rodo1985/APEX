import type {
  Activity,
  CoachReplyResponse,
  ConversationMessage,
  ConversationPreview,
  FoodSearchResult,
  GoalPayload,
  IntegrationsResponse,
  MealLog,
  MealParseResponse,
  NutritionTodayResponse,
  NutritionWeeklyResponse,
  RegisterResponse,
  TrainingLoadPoint,
  TrainingTodayResponse,
  TrainingWeeklySummary,
  UserProfile,
} from "./types";

interface Tokens {
  accessToken: string | null;
  refreshToken: string | null;
}

interface ApiClientOptions {
  getTokens: () => Tokens;
  onTokens: (tokens: Tokens) => void;
  onLogout: () => void;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export function resolveApiBaseUrl(
  configuredApiUrl?: string,
  location = typeof window !== "undefined" ? window.location : null,
) {
  if (configuredApiUrl) {
    return configuredApiUrl;
  }

  if (location) {
    return `${location.protocol}//${location.hostname}:8000/v1`;
  }

  return "http://localhost:8000/v1";
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      errorMessage = payload.error?.message ?? errorMessage;
    } catch {
      // Fall back to the HTTP status when the response is not JSON.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function createApiClient(options: ApiClientOptions) {
  async function request<T>(path: string, init: RequestOptions = {}, retry = true): Promise<T> {
    const tokens = options.getTokens();
    const headers = new Headers(init.headers);

    if (!init.skipAuth && tokens.accessToken) {
      headers.set("Authorization", `Bearer ${tokens.accessToken}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 401 && retry && tokens.refreshToken) {
      const refreshed = await refresh(tokens.refreshToken).catch(() => null);
      if (refreshed) {
        options.onTokens({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
        });
        return request<T>(path, init, false);
      }

      options.onLogout();
    }

    return parseResponse<T>(response);
  }

  async function refresh(refreshToken: string) {
    return request<{ access_token: string; refresh_token?: string; expires_in: number }>(
      "/auth/refresh",
      {
        method: "POST",
        skipAuth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );
  }

  return {
    register(payload: { email: string; password: string; name: string }) {
      return request<RegisterResponse>("/auth/register", {
        method: "POST",
        skipAuth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    login(payload: { email: string; password: string }) {
      return request<{ access_token: string; refresh_token: string; expires_in: number }>(
        "/auth/login",
        {
          method: "POST",
          skipAuth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    },
    logout(refreshToken: string) {
      return request<void>("/auth/logout", {
        method: "POST",
        skipAuth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    },
    getProfile() {
      return request<UserProfile>("/user/me");
    },
    updateProfile(payload: Partial<UserProfile> & { active_goal?: GoalPayload | null }) {
      return request<UserProfile>("/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    getStravaAuthorizeUrl(redirectUri: string) {
      return request<{ authorize_url: string }>(
        `/auth/strava?redirect_uri=${encodeURIComponent(redirectUri)}`,
        { skipAuth: true },
      );
    },
    finishStravaConnect(code: string) {
      return request<{ connected: boolean; athlete_id: string; athlete_name: string }>(
        `/auth/strava/callback?code=${encodeURIComponent(code)}`,
      );
    },
    getNutritionToday(targetDate?: string) {
      const params = new URLSearchParams();
      if (targetDate) {
        params.set("date", targetDate);
      }

      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      return request<NutritionTodayResponse>(`/nutrition/today${suffix}`);
    },
    getNutritionLog(fromDate: string, toDate: string) {
      return request<{ logs: MealLog[] }>(
        `/nutrition/log?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`,
      );
    },
    createMealLog(payload: {
      meal_type: string;
      meal_name: string;
      logged_at: string;
      ingredients: Array<Record<string, unknown>>;
    }) {
      return request<MealLog>("/nutrition/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    updateMealLog(
      logId: string,
      payload: {
        meal_type: string;
        meal_name: string;
        logged_at: string;
        ingredients: Array<Record<string, unknown>>;
      },
    ) {
      return request<MealLog>(`/nutrition/log/${logId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    deleteMealLog(logId: string) {
      return request<void>(`/nutrition/log/${logId}`, { method: "DELETE" });
    },
    parseVoiceMeal(formData: FormData) {
      return request<MealParseResponse>("/nutrition/log/voice", {
        method: "POST",
        body: formData,
      });
    },
    parsePhotoMeal(formData: FormData) {
      return request<MealParseResponse>("/nutrition/log/photo", {
        method: "POST",
        body: formData,
      });
    },
    searchFoods(query: string) {
      return request<{ results: FoodSearchResult[]; total: number }>(
        `/nutrition/foods/search?q=${encodeURIComponent(query)}`,
      );
    },
    getNutritionWeekly(endDate?: string) {
      const params = new URLSearchParams();
      if (endDate) {
        params.set("end_date", endDate);
      }

      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      return request<NutritionWeeklyResponse>(`/nutrition/weekly${suffix}`);
    },
    getTrainingToday(targetDate?: string) {
      const params = new URLSearchParams();
      if (targetDate) {
        params.set("date", targetDate);
      }

      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      return request<TrainingTodayResponse>(`/training/today${suffix}`);
    },
    getTrainingActivities(fromDate: string, toDate: string, sport?: string) {
      const params = new URLSearchParams({ from: fromDate, to: toDate });
      if (sport) {
        params.set("sport", sport);
      }

      return request<{ activities: Activity[]; total: number }>(
        `/training/activities?${params.toString()}`,
      );
    },
    syncStrava(daysBack = 7) {
      return request<{ synced_count: number; activities: Activity[] }>("/training/strava/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days_back: daysBack }),
      });
    },
    getTrainingLoad(days = 90, endDate?: string) {
      const params = new URLSearchParams({ days: String(days) });
      if (endDate) {
        params.set("end_date", endDate);
      }

      return request<{ series: TrainingLoadPoint[] }>(`/training/load?${params.toString()}`);
    },
    getTrainingWeekly(weeks = 8) {
      return request<{ weeks: TrainingWeeklySummary[] }>(`/training/weekly?weeks=${weeks}`);
    },
    sendCoachMessage(payload: { message: string; conversation_id?: string | null }) {
      return request<CoachReplyResponse>("/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    sendCoachVoice(formData: FormData) {
      return request<CoachReplyResponse>("/coach/voice", {
        method: "POST",
        body: formData,
      });
    },
    getCoachConversations() {
      return request<{ conversations: ConversationPreview[] }>("/coach/conversations");
    },
    getConversation(conversationId: string) {
      return request<{ conversation_id: string; messages: ConversationMessage[] }>(
        `/coach/conversations/${conversationId}`,
      );
    },
    deleteConversation(conversationId: string) {
      return request<void>(`/coach/conversations/${conversationId}`, { method: "DELETE" });
    },
    getIntegrations() {
      return request<IntegrationsResponse>("/settings/integrations");
    },
    disconnectStrava() {
      return request<void>("/settings/integrations/strava", { method: "DELETE" });
    },
    disconnectGoogle() {
      return request<void>("/settings/integrations/google", { method: "DELETE" });
    },
  };
}

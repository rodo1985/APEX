export type Sport = "cycling" | "running";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface GoalPayload {
  goal_type: "race" | "distance_pr" | "body_composition" | "consistency" | "combined";
  description: string;
  target_date: string | null;
  goal_weight_kg: number | null;
  available_training_days: number;
  secondary_goal: string | null;
  constraints_text: string | null;
  phase_name: string;
  weekly_tss_target: number;
  weekly_hours_target: number;
}

export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  sports: Sport[];
  ftp: number | null;
  lthr: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  daily_calorie_target: number;
  macro_targets: MacroTargets;
  timezone: string;
  created_at: string;
  active_goal: GoalPayload | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterResponse extends AuthTokens {
  user_id: string;
  email: string;
  name: string;
}

export interface Ingredient {
  ingredient_id?: string;
  food_id?: string | null;
  name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealLog {
  log_id: string;
  user_id: string;
  meal_type: MealType;
  meal_name: string;
  logged_at: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  ingredients: Ingredient[];
  source: "manual" | "voice" | "photo";
  created_at: string;
}

export interface NutritionSummary {
  calories_consumed: number;
  calories_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  target_day_type: string;
  note?: string | null;
}

export interface NutritionTodayResponse {
  date: string;
  summary: NutritionSummary;
  meals: MealLog[];
}

export interface NutritionWeeklyDay {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  target_calories?: number;
  exercise_calories?: number;
  day_type?: string;
}

export interface NutritionWeeklyResponse {
  days: NutritionWeeklyDay[];
}

export interface FoodSearchResult {
  food_id: string;
  name: string;
  brand: string | null;
  serving_unit: string;
  serving_size: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ParsedMeal {
  meal_name: string;
  meal_type: MealType;
  ingredients: Ingredient[];
}

export interface MealParseResponse {
  transcript?: string | null;
  parsed_meal: ParsedMeal;
  confidence: number;
}

export interface Activity {
  activity_id: string;
  strava_id: string | null;
  sport: Sport;
  name: string;
  start_time: string;
  duration_seconds: number;
  distance_m: number;
  elevation_m: number;
  avg_power_w: number | null;
  normalized_power_w: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  tss: number;
  intensity_factor: number | null;
  calories: number;
  map_polyline?: string | null;
  photo_urls?: string[];
  created_at: string;
}

export interface TrainingMetrics {
  ctl: number;
  atl: number;
  tsb: number;
  daily_tss: number;
}

export interface TrainingTodayResponse {
  date: string;
  metrics: TrainingMetrics;
  status: "optimal" | "fresh" | "fatigued" | "overreaching";
  planned_activities: Array<Record<string, unknown>>;
  completed_activities: Activity[];
}

export interface TrainingLoadPoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  daily_tss: number;
}

export interface TrainingWeeklySummary {
  week_start: string;
  total_tss: number;
  total_hours: number;
  total_distance_km: number;
  activities_count: number;
}

export interface ConversationPreview {
  conversation_id: string;
  preview: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  message_id: string;
  role: "user" | "assistant";
  content: string;
  context_used: string[];
  timestamp: string;
}

export interface CoachReplyResponse {
  conversation_id: string;
  reply: string;
  context_used: string[];
  suggested_actions: Array<{ label: string; action: string }>;
  transcript?: string | null;
}

export interface IntegrationsResponse {
  strava: { connected: boolean; athlete_name?: string | null; last_sync?: string | null };
  google_calendar: { connected: boolean; email?: string | null; last_sync?: string | null };
  apple_health: { connected: boolean; last_sync?: string | null };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

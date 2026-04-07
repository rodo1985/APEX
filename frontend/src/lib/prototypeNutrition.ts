import type { MealType } from "./types";

import {
  resolvePrototypeUserId,
  selectFirstFromSupabase,
  selectFromSupabase,
} from "./prototypeSupabaseRest";

type JsonRecord = Record<string, unknown>;

type PrototypeDateInput = Date | string;

type PrototypeMealSlotKey =
  | "breakfast"
  | "training_fuel"
  | "recovery"
  | "lunch"
  | "snacks"
  | "dinner"
  | "other";

type PrototypeFoodSource = "estimated" | "label" | "personal_db" | "standard" | "web_search" | string;

type ActivityExtraStat = {
  label: string;
  value: string;
};

type ActivityZone = {
  pct: number;
  zone: string;
};

interface PrototypeProfileRow extends JsonRecord {
  activity_multiplier?: number | string | null;
  bmr?: number | string | null;
  daily_calorie_target?: number | string | null;
  daily_deficit?: number | string | null;
  target_calories?: number | string | null;
  target_carbs?: number | string | null;
  target_fat?: number | string | null;
  target_protein?: number | string | null;
  target_weight_kg?: number | string | null;
  user_id?: string | null;
  weekly_loss_kg?: number | string | null;
  weight_kg?: number | string | null;
}

interface PrototypeDailyLogRow extends JsonRecord {
  confirmed?: boolean | null;
  day_type?: string | null;
  id?: number | string | null;
  log_date?: string | null;
  target_carbs?: number | string | null;
  target_fat?: number | string | null;
  target_kcal?: number | string | null;
  target_protein?: number | string | null;
  user_id?: string | null;
}

interface PrototypeMealRow extends JsonRecord {
  daily_log_id?: number | string | null;
  id?: number | string | null;
  meal_icon?: string | null;
  meal_name?: string | null;
  meal_type?: string | null;
  sort_order?: number | string | null;
}

interface PrototypeFoodItemRow extends JsonRecord {
  amount?: number | string | null;
  calories?: number | string | null;
  carbs?: number | string | null;
  fat?: number | string | null;
  id?: number | string | null;
  kcal?: number | string | null;
  meal_id?: number | string | null;
  name?: string | null;
  protein?: number | string | null;
  sort_order?: number | string | null;
  source?: string | null;
  unit?: string | null;
}

interface PrototypeActivityRow extends JsonRecord {
  achievements?: unknown;
  avg_hr?: number | string | null;
  calories?: number | string | null;
  distance?: number | string | null;
  distance_unit?: string | null;
  elevation?: number | string | null;
  extra_stats?: unknown;
  id?: number | string | null;
  moving_time?: string | null;
  sport?: string | null;
  title?: string | null;
  zones?: unknown;
}

interface PrototypeDailyTotalsRow extends JsonRecord {
  activity_kcal?: number | string | null;
  calories_burned?: number | string | null;
  calories_consumed?: number | string | null;
  carbs?: number | string | null;
  consumed_kcal?: number | string | null;
  daily_log_id?: number | string | null;
  exercise_kcal?: number | string | null;
  fat?: number | string | null;
  kcal?: number | string | null;
  log_date?: string | null;
  net_kcal?: number | string | null;
  protein?: number | string | null;
  target_carbs?: number | string | null;
  target_fat?: number | string | null;
  target_kcal?: number | string | null;
  target_protein?: number | string | null;
  user_id?: string | null;
}

interface PrototypeMealTotalsRow extends JsonRecord {
  calories?: number | string | null;
  carbs?: number | string | null;
  fat?: number | string | null;
  kcal?: number | string | null;
  meal_id?: number | string | null;
  protein?: number | string | null;
  total_calories?: number | string | null;
  total_carbs?: number | string | null;
  total_fat?: number | string | null;
  total_kcal?: number | string | null;
  total_protein?: number | string | null;
}

export interface PrototypeMacroTotals {
  carbs: number;
  fat: number;
  kcal: number;
  protein: number;
}

export interface PrototypeMacroProgress {
  carbsPct: number;
  fatPct: number;
  proteinPct: number;
}

export interface PrototypeMacroTargets extends PrototypeMacroTotals {}

export interface PrototypeProfile {
  activityMultiplier: number | null;
  bmr: number | null;
  dailyDeficit: number | null;
  targets: PrototypeMacroTargets;
  targetWeightKg: number | null;
  userId: string;
  weeklyLossKg: number | null;
  weightKg: number | null;
}

export interface PrototypeFoodItem {
  amount: number;
  id: string;
  kcal: number;
  mealId: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  sortOrder: number;
  source: PrototypeFoodSource | null;
  unit: string;
}

export interface PrototypeMealSlot {
  dailyLogId: string | null;
  icon: string;
  id: string;
  isEmpty: boolean;
  items: PrototypeFoodItem[];
  label: string;
  name: string;
  slotKey: PrototypeMealSlotKey;
  sortOrder: number;
  totals: PrototypeMacroTotals;
}

export interface PrototypeActivity {
  achievements: string[];
  avgHr: number | null;
  calories: number;
  distance: number | null;
  distanceUnit: string | null;
  elevation: number | null;
  extraStats: ActivityExtraStat[];
  id: string;
  movingTime: string | null;
  sport: string;
  title: string;
  zones: ActivityZone[];
}

export interface PrototypeDailySummary {
  actual: PrototypeMacroTotals;
  confirmed: boolean;
  dayType: string;
  exerciseCalories: number;
  hasActivity: boolean;
  hasFood: boolean;
  macroProgress: PrototypeMacroProgress;
  netCalories: number;
  remainingCalories: number;
  targets: PrototypeMacroTargets;
}

export interface PrototypeDashboardDay {
  activities: PrototypeActivity[];
  dailyLogId: string | null;
  date: string;
  hasLog: boolean;
  meals: PrototypeMealSlot[];
  profile: PrototypeProfile | null;
  summary: PrototypeDailySummary;
  userId: string;
}

export interface PrototypeFoodLogDay {
  activities: PrototypeActivity[];
  dailyLogId: string | null;
  date: string;
  hasLog: boolean;
  meals: PrototypeMealSlot[];
  summary: PrototypeDailySummary;
  userId: string;
}

export interface PrototypeWeekDayRollup {
  actual: PrototypeMacroTotals;
  confirmed: boolean;
  date: string;
  dayType: string;
  exerciseCalories: number;
  hasActivity: boolean;
  hasFood: boolean;
  hasLog: boolean;
  netCalories: number;
  remainingCalories: number;
  targets: PrototypeMacroTargets;
}

export interface PrototypeWeekRollup {
  averageCalories: number;
  days: PrototypeWeekDayRollup[];
  endDate: string;
  startDate: string;
  totals: {
    actual: PrototypeMacroTotals;
    exerciseCalories: number;
    netCalories: number;
  };
  userId: string;
}

interface PrototypeMealSlotSeed {
  aliases: string[];
  icon: string;
  label: string;
  slotKey: PrototypeMealSlotKey;
  sortOrder: number;
}

interface PrototypeDaySnapshot {
  activities: PrototypeActivity[];
  dailyLogId: string | null;
  date: string;
  hasLog: boolean;
  meals: PrototypeMealSlot[];
  profile: PrototypeProfile | null;
  summary: PrototypeDailySummary;
  userId: string;
}

const DEFAULT_TARGETS: PrototypeMacroTargets = {
  kcal: 1430,
  protein: 137,
  carbs: 180,
  fat: 55,
};

const EMPTY_TOTALS: PrototypeMacroTotals = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const MEAL_SLOT_SEEDS: PrototypeMealSlotSeed[] = [
  { slotKey: "breakfast", label: "Breakfast", icon: "☀️", sortOrder: 1, aliases: ["breakfast"] },
  {
    slotKey: "training_fuel",
    label: "Training Fuel",
    icon: "🔋",
    sortOrder: 2,
    aliases: ["fuel", "training fuel", "training_fuel"],
  },
  { slotKey: "recovery", label: "Recovery", icon: "💪", sortOrder: 3, aliases: ["recovery"] },
  { slotKey: "lunch", label: "Lunch", icon: "🍽️", sortOrder: 4, aliases: ["lunch"] },
  { slotKey: "snacks", label: "Snacks", icon: "⚡", sortOrder: 5, aliases: ["snack", "snacks"] },
  { slotKey: "dinner", label: "Dinner", icon: "🌙", sortOrder: 6, aliases: ["dinner"] },
];

/**
 * Returns the prototype dashboard model for a specific day.
 *
 * Parameters:
 * - date: A `YYYY-MM-DD` string or `Date` to load.
 * - userIdOverride: Optional user ID override for the prototype tables.
 *
 * Returns:
 * - A typed dashboard model with stable fallback defaults.
 *
 * Raised errors:
 * - Throws when required Supabase tables cannot be queried.
 *
 * Example:
 * ```ts
 * const dashboard = await getPrototypeDashboardDay("2026-04-06");
 * ```
 */
export async function getPrototypeDashboardDay(
  date: PrototypeDateInput,
  userIdOverride?: string,
): Promise<PrototypeDashboardDay> {
  const snapshot = await getPrototypeDaySnapshot(date, userIdOverride);

  return {
    activities: snapshot.activities,
    dailyLogId: snapshot.dailyLogId,
    date: snapshot.date,
    hasLog: snapshot.hasLog,
    meals: snapshot.meals,
    profile: snapshot.profile,
    summary: snapshot.summary,
    userId: snapshot.userId,
  };
}

/**
 * Returns the prototype food-log model for a specific day.
 *
 * Parameters:
 * - date: A `YYYY-MM-DD` string or `Date` to load.
 * - userIdOverride: Optional user ID override for the prototype tables.
 *
 * Returns:
 * - A typed food-log model with empty meal slots pre-expanded.
 *
 * Raised errors:
 * - Throws when required Supabase tables cannot be queried.
 *
 * Example:
 * ```ts
 * const foodLog = await getPrototypeFoodLogDay("2026-04-06");
 * ```
 */
export async function getPrototypeFoodLogDay(
  date: PrototypeDateInput,
  userIdOverride?: string,
): Promise<PrototypeFoodLogDay> {
  const snapshot = await getPrototypeDaySnapshot(date, userIdOverride);

  return {
    activities: snapshot.activities,
    dailyLogId: snapshot.dailyLogId,
    date: snapshot.date,
    hasLog: snapshot.hasLog,
    meals: snapshot.meals,
    summary: snapshot.summary,
    userId: snapshot.userId,
  };
}

/**
 * Returns a seven-day prototype rollup ending on the supplied anchor date.
 *
 * Parameters:
 * - anchorDate: The final day in the rollup window.
 * - userIdOverride: Optional user ID override for the prototype tables.
 * - days: The number of days to include. Defaults to 7.
 *
 * Returns:
 * - A normalized week rollup for charts and summary cards.
 *
 * Raised errors:
 * - Throws when any required day read fails.
 *
 * Example:
 * ```ts
 * const week = await getPrototypeWeekRollup("2026-04-06");
 * ```
 */
export async function getPrototypeWeekRollup(
  anchorDate: PrototypeDateInput,
  userIdOverride?: string,
  days = 7,
): Promise<PrototypeWeekRollup> {
  const userId = resolvePrototypeUserId(userIdOverride);
  const normalizedAnchorDate = normalizePrototypeDate(anchorDate);
  const safeLength = Math.max(1, Math.floor(days));
  const dates = buildDateRange(normalizedAnchorDate, safeLength);
  const profileRow = await fetchProfileRow(userId);

  // Reusing the single-day loader keeps the weekly rollup and per-day screens
  // in sync instead of maintaining a separate, range-specific mapping path.
  const snapshots = await Promise.all(
    dates.map((date) => getPrototypeDaySnapshot(date, userId, profileRow)),
  );

  const dayRollups = snapshots.map((snapshot) => ({
    actual: snapshot.summary.actual,
    confirmed: snapshot.summary.confirmed,
    date: snapshot.date,
    dayType: snapshot.summary.dayType,
    exerciseCalories: snapshot.summary.exerciseCalories,
    hasActivity: snapshot.summary.hasActivity,
    hasFood: snapshot.summary.hasFood,
    hasLog: snapshot.hasLog,
    netCalories: snapshot.summary.netCalories,
    remainingCalories: snapshot.summary.remainingCalories,
    targets: snapshot.summary.targets,
  }));

  const totals = dayRollups.reduce(
    (accumulator, day) => ({
      actual: addMacroTotals(accumulator.actual, day.actual),
      exerciseCalories: accumulator.exerciseCalories + day.exerciseCalories,
      netCalories: accumulator.netCalories + day.netCalories,
    }),
    {
      actual: createEmptyTotals(),
      exerciseCalories: 0,
      netCalories: 0,
    },
  );

  return {
    averageCalories: roundTo(totals.actual.kcal / dayRollups.length, 1),
    days: dayRollups,
    endDate: normalizedAnchorDate,
    startDate: dates[0],
    totals,
    userId,
  };
}

/**
 * Loads and normalizes a full prototype day snapshot from Supabase.
 *
 * Parameters:
 * - date: A `YYYY-MM-DD` string or `Date` to load.
 * - userIdOverride: Optional user ID override for the prototype tables.
 * - cachedProfileRow: An optional preloaded profile row for range-based reads.
 *
 * Returns:
 * - The complete day snapshot shared by dashboard and food-log helpers.
 *
 * Raised errors:
 * - Throws when required Supabase tables cannot be queried.
 *
 * Example:
 * ```ts
 * const snapshot = await getPrototypeDaySnapshot("2026-04-06");
 * ```
 */
async function getPrototypeDaySnapshot(
  date: PrototypeDateInput,
  userIdOverride?: string,
  cachedProfileRow?: PrototypeProfileRow | null,
): Promise<PrototypeDaySnapshot> {
  const normalizedDate = normalizePrototypeDate(date);
  const userId = resolvePrototypeUserId(userIdOverride);
  const [profileRow, dailyLogRow] = await Promise.all([
    cachedProfileRow === undefined ? fetchProfileRow(userId) : Promise.resolve(cachedProfileRow),
    fetchDailyLogRow(userId, normalizedDate),
  ]);

  const profile = mapProfile(profileRow, userId);

  if (!dailyLogRow) {
    const meals = createEmptyMealSlots();
    const summary = buildDailySummary({
      activities: [],
      dailyLogRow: null,
      dailyTotalsRow: null,
      meals,
      profile,
    });

    return {
      activities: [],
      dailyLogId: null,
      date: normalizedDate,
      hasLog: false,
      meals,
      profile,
      summary,
      userId,
    };
  }

  const dailyLogId = readIdentifier(dailyLogRow, ["id", "daily_log_id"]);
  const [mealRows, activityRows, dailyTotalsRow] = await Promise.all([
    dailyLogId ? fetchMealRows(dailyLogId) : Promise.resolve([]),
    dailyLogId ? fetchActivityRows(dailyLogId) : Promise.resolve([]),
    fetchDailyTotalsRow(userId, normalizedDate, dailyLogId),
  ]);

  const mealIds = mealRows
    .map((mealRow) => readIdentifier(mealRow, ["id", "meal_id"]))
    .filter((mealId): mealId is string => mealId !== null);

  const [foodItemRows, mealTotalsRows] = await Promise.all([
    mealIds.length > 0 ? fetchFoodItemRows(mealIds) : Promise.resolve([]),
    mealIds.length > 0 ? fetchMealTotalsRows(mealIds) : Promise.resolve([]),
  ]);

  const meals = mapMealSlots(dailyLogId, mealRows, foodItemRows, mealTotalsRows);
  const activities = activityRows.map(mapActivityRow);
  const summary = buildDailySummary({
    activities,
    dailyLogRow,
    dailyTotalsRow,
    meals,
    profile,
  });

  return {
    activities,
    dailyLogId,
    date: normalizedDate,
    hasLog: true,
    meals,
    profile,
    summary,
    userId,
  };
}

/**
 * Fetches the prototype profile row for a user.
 *
 * Parameters:
 * - userId: The prototype user ID.
 *
 * Returns:
 * - The profile row or `null` when none exists.
 *
 * Raised errors:
 * - Throws when the profile table cannot be queried.
 *
 * Example:
 * ```ts
 * const profile = await fetchProfileRow("sergio");
 * ```
 */
async function fetchProfileRow(userId: string) {
  return selectFirstFromSupabase<PrototypeProfileRow>("profile", {
    filters: [{ column: "user_id", operator: "eq", value: userId }],
  });
}

/**
 * Fetches the daily log row for a user and date.
 *
 * Parameters:
 * - userId: The prototype user ID.
 * - date: A normalized `YYYY-MM-DD` string.
 *
 * Returns:
 * - The daily log row or `null` when the day has not been logged.
 *
 * Raised errors:
 * - Throws when the daily_log table cannot be queried.
 *
 * Example:
 * ```ts
 * const dailyLog = await fetchDailyLogRow("sergio", "2026-04-06");
 * ```
 */
async function fetchDailyLogRow(userId: string, date: string) {
  return selectFirstFromSupabase<PrototypeDailyLogRow>("daily_log", {
    filters: [
      { column: "user_id", operator: "eq", value: userId },
      { column: "log_date", operator: "eq", value: date },
    ],
  });
}

/**
 * Fetches meal rows for a given daily log.
 *
 * Parameters:
 * - dailyLogId: The parent daily log ID.
 *
 * Returns:
 * - Meal rows ordered by their prototype sort order.
 *
 * Raised errors:
 * - Throws when the meals table cannot be queried.
 *
 * Example:
 * ```ts
 * const meals = await fetchMealRows("log-1");
 * ```
 */
async function fetchMealRows(dailyLogId: string) {
  return selectFromSupabase<PrototypeMealRow>("meals", {
    filters: [{ column: "daily_log_id", operator: "eq", value: dailyLogId }],
    orderBy: { column: "sort_order" },
  });
}

/**
 * Fetches food items for a set of meal IDs.
 *
 * Parameters:
 * - mealIds: The meal IDs to expand.
 *
 * Returns:
 * - Food item rows ordered by their prototype sort order.
 *
 * Raised errors:
 * - Throws when the food_items table cannot be queried.
 *
 * Example:
 * ```ts
 * const items = await fetchFoodItemRows(["meal-1", "meal-2"]);
 * ```
 */
async function fetchFoodItemRows(mealIds: string[]) {
  return selectFromSupabase<PrototypeFoodItemRow>("food_items", {
    filters: [{ column: "meal_id", operator: "in", value: mealIds }],
    orderBy: { column: "sort_order" },
  });
}

/**
 * Fetches activity rows for a given daily log.
 *
 * Parameters:
 * - dailyLogId: The parent daily log ID.
 *
 * Returns:
 * - Activity rows for the selected day.
 *
 * Raised errors:
 * - Throws when the activities table cannot be queried.
 *
 * Example:
 * ```ts
 * const activities = await fetchActivityRows("log-1");
 * ```
 */
async function fetchActivityRows(dailyLogId: string) {
  return selectFromSupabase<PrototypeActivityRow>("activities", {
    filters: [{ column: "daily_log_id", operator: "eq", value: dailyLogId }],
  });
}

/**
 * Fetches optional daily totals, first by `daily_log_id` and then by date.
 *
 * Parameters:
 * - userId: The prototype user ID.
 * - date: A normalized `YYYY-MM-DD` string.
 * - dailyLogId: The parent daily log ID when available.
 *
 * Returns:
 * - The aggregate row or `null` when the optional view/table does not exist.
 *
 * Raised errors:
 * - None for missing optional resources. Required fetch failures still surface.
 *
 * Example:
 * ```ts
 * const totals = await fetchDailyTotalsRow("sergio", "2026-04-06", "log-1");
 * ```
 */
async function fetchDailyTotalsRow(userId: string, date: string, dailyLogId: string | null) {
  if (dailyLogId) {
    const byLogId = await selectFirstFromSupabase<PrototypeDailyTotalsRow>("daily_totals", {
      filters: [{ column: "daily_log_id", operator: "eq", value: dailyLogId }],
      optional: true,
    });

    if (byLogId) {
      return byLogId;
    }
  }

  return selectFirstFromSupabase<PrototypeDailyTotalsRow>("daily_totals", {
    filters: [
      { column: "user_id", operator: "eq", value: userId },
      { column: "log_date", operator: "eq", value: date },
    ],
    optional: true,
  });
}

/**
 * Fetches optional meal totals for a set of meal IDs.
 *
 * Parameters:
 * - mealIds: The meal IDs to expand.
 *
 * Returns:
 * - Aggregate rows keyed by meal ID when the optional view/table exists.
 *
 * Raised errors:
 * - None for missing optional resources.
 *
 * Example:
 * ```ts
 * const totals = await fetchMealTotalsRows(["meal-1", "meal-2"]);
 * ```
 */
async function fetchMealTotalsRows(mealIds: string[]) {
  return selectFromSupabase<PrototypeMealTotalsRow>("meal_totals", {
    filters: [{ column: "meal_id", operator: "in", value: mealIds }],
    optional: true,
  });
}

/**
 * Maps the profile table into a typed, frontend-friendly profile model.
 *
 * Parameters:
 * - row: The optional raw profile row.
 * - userId: The fallback user ID when the row is absent.
 *
 * Returns:
 * - A normalized profile model or `null` when no row exists.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const profile = mapProfile(row, "sergio");
 * ```
 */
function mapProfile(row: PrototypeProfileRow | null, userId: string): PrototypeProfile | null {
  if (!row) {
    return null;
  }

  const weightKg = readNumber(row, ["weight_kg"]);
  const bmr = readNumber(row, ["bmr"]);
  const activityMultiplier = readNumber(row, ["activity_multiplier"]);
  const dailyDeficit = readNumber(row, ["daily_deficit"]);
  const calorieTarget =
    readNumber(row, ["daily_calorie_target", "target_calories", "target_kcal"]) ??
    deriveCalorieTarget(bmr, activityMultiplier, dailyDeficit);

  return {
    activityMultiplier,
    bmr,
    dailyDeficit,
    targets: {
      kcal: calorieTarget ?? DEFAULT_TARGETS.kcal,
      protein:
        readNumber(row, ["target_protein", "protein_target"]) ??
        (weightKg !== null ? roundTo(weightKg * 2, 1) : DEFAULT_TARGETS.protein),
      carbs: readNumber(row, ["target_carbs", "carbs_target"]) ?? DEFAULT_TARGETS.carbs,
      fat: readNumber(row, ["target_fat", "fat_target"]) ?? DEFAULT_TARGETS.fat,
    },
    targetWeightKg: readNumber(row, ["target_weight_kg"]),
    userId: readString(row, ["user_id"]) ?? userId,
    weeklyLossKg: readNumber(row, ["weekly_loss_kg"]),
    weightKg,
  };
}

/**
 * Maps meals, food items, and optional meal totals into the fixed slot order
 * expected by the nutrition prototype.
 *
 * Parameters:
 * - dailyLogId: The parent daily log ID.
 * - mealRows: Raw meal rows for the selected date.
 * - foodItemRows: Raw food item rows for the selected date.
 * - mealTotalsRows: Optional aggregate rows keyed by meal ID.
 *
 * Returns:
 * - Meal slots in stable display order, including empty slots.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const meals = mapMealSlots("log-1", mealRows, foodItems, mealTotals);
 * ```
 */
function mapMealSlots(
  dailyLogId: string | null,
  mealRows: PrototypeMealRow[],
  foodItemRows: PrototypeFoodItemRow[],
  mealTotalsRows: PrototypeMealTotalsRow[],
) {
  const itemsByMealId = new Map<string, PrototypeFoodItem[]>();

  for (const foodItemRow of foodItemRows) {
    const foodItem = mapFoodItemRow(foodItemRow);

    if (!foodItem) {
      continue;
    }

    const existingItems = itemsByMealId.get(foodItem.mealId) ?? [];
    existingItems.push(foodItem);
    itemsByMealId.set(foodItem.mealId, existingItems);
  }

  const totalsByMealId = new Map<string, PrototypeMacroTotals>();

  for (const mealTotalsRow of mealTotalsRows) {
    const mealId = readIdentifier(mealTotalsRow, ["meal_id"]);

    if (!mealId) {
      continue;
    }

    totalsByMealId.set(mealId, {
      kcal: readNumber(mealTotalsRow, ["kcal", "calories", "total_kcal", "total_calories"]) ?? 0,
      protein: readNumber(mealTotalsRow, ["protein", "total_protein"]) ?? 0,
      carbs: readNumber(mealTotalsRow, ["carbs", "total_carbs"]) ?? 0,
      fat: readNumber(mealTotalsRow, ["fat", "total_fat"]) ?? 0,
    });
  }

  const slots = createEmptyMealSlots(dailyLogId);

  for (const mealRow of mealRows) {
    const mealId = readIdentifier(mealRow, ["id", "meal_id"]);

    if (!mealId) {
      continue;
    }

    const seed = resolveMealSlotSeed(mealRow);
    const items = (itemsByMealId.get(mealId) ?? []).sort((left, right) => left.sortOrder - right.sortOrder);
    const totals = totalsByMealId.get(mealId) ?? aggregateFoodItems(items);

    const slot: PrototypeMealSlot = {
      dailyLogId,
      icon: readString(mealRow, ["meal_icon"]) ?? seed.icon,
      id: mealId,
      isEmpty: items.length === 0,
      items,
      label: seed.label,
      name: readString(mealRow, ["meal_name"]) ?? seed.label,
      slotKey: seed.slotKey,
      sortOrder: readNumber(mealRow, ["sort_order"]) ?? seed.sortOrder,
      totals,
    };

    const seedIndex = slots.findIndex((candidate) => candidate.slotKey === seed.slotKey);

    if (seedIndex >= 0) {
      slots[seedIndex] = slot;
      continue;
    }

    slots.push(slot);
  }

  return slots.sort((left, right) => left.sortOrder - right.sortOrder);
}

/**
 * Maps a raw food item row into a normalized frontend model.
 *
 * Parameters:
 * - row: The raw food item row.
 *
 * Returns:
 * - A normalized food item or `null` when the row is missing required IDs.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const item = mapFoodItemRow(row);
 * ```
 */
function mapFoodItemRow(row: PrototypeFoodItemRow): PrototypeFoodItem | null {
  const id = readIdentifier(row, ["id", "food_item_id"]);
  const mealId = readIdentifier(row, ["meal_id"]);

  if (!id || !mealId) {
    return null;
  }

  return {
    amount: readNumber(row, ["amount", "quantity_g"]) ?? 0,
    id,
    kcal: readNumber(row, ["kcal", "calories"]) ?? 0,
    mealId,
    name: readString(row, ["name"]) ?? "Untitled item",
    protein: readNumber(row, ["protein", "protein_g"]) ?? 0,
    carbs: readNumber(row, ["carbs", "carbs_g"]) ?? 0,
    fat: readNumber(row, ["fat", "fat_g"]) ?? 0,
    sortOrder: readNumber(row, ["sort_order"]) ?? 999,
    source: readString(row, ["source"]) as PrototypeFoodSource | null,
    unit: readString(row, ["unit"]) ?? "g",
  };
}

/**
 * Maps a raw activity row into a normalized frontend model.
 *
 * Parameters:
 * - row: The raw activity row.
 *
 * Returns:
 * - A normalized activity model.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const activity = mapActivityRow(row);
 * ```
 */
function mapActivityRow(row: PrototypeActivityRow): PrototypeActivity {
  return {
    achievements: parseStringArray(row.achievements),
    avgHr: readNumber(row, ["avg_hr"]),
    calories: readNumber(row, ["calories"]) ?? 0,
    distance: readNumber(row, ["distance"]),
    distanceUnit: readString(row, ["distance_unit"]),
    elevation: readNumber(row, ["elevation"]),
    extraStats: parseExtraStats(row.extra_stats),
    id: readIdentifier(row, ["id", "activity_id"]) ?? createSyntheticId("activity"),
    movingTime: readString(row, ["moving_time"]),
    sport: readString(row, ["sport"]) ?? "unknown",
    title: readString(row, ["title", "name"]) ?? "Activity",
    zones: parseZones(row.zones),
  };
}

/**
 * Builds the daily summary object for dashboard and food-log screens.
 *
 * Parameters:
 * - context: The meals, activities, raw daily rows, and optional profile data.
 *
 * Returns:
 * - A normalized summary with deterministic fallback totals and targets.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const summary = buildDailySummary({ activities, dailyLogRow, dailyTotalsRow, meals, profile });
 * ```
 */
function buildDailySummary(context: {
  activities: PrototypeActivity[];
  dailyLogRow: PrototypeDailyLogRow | null;
  dailyTotalsRow: PrototypeDailyTotalsRow | null;
  meals: PrototypeMealSlot[];
  profile: PrototypeProfile | null;
}): PrototypeDailySummary {
  // The optional `daily_totals` view is convenient for targets and status, but
  // the prototype SQL can over-count calories whenever food items and
  // activities are joined into the same aggregate row. To keep the dashboard
  // stable, derive calorie math from the raw meal and activity rows that we
  // already fetched for the selected day.
  const mealTotals = aggregateMeals(context.meals);
  const activityCalories = context.activities.reduce((sum, activity) => sum + activity.calories, 0);
  const fallbackTotals = readMacroTotals(
    context.dailyTotalsRow,
    ["kcal", "consumed_kcal", "calories_consumed"],
    ["protein"],
    ["carbs"],
    ["fat"],
  );
  const actualTotals = mealTotals.kcal > 0 || mealTotals.protein > 0 || mealTotals.carbs > 0 || mealTotals.fat > 0
    ? mealTotals
    : (fallbackTotals ?? aggregateMeals(context.meals));
  const exerciseCalories =
    activityCalories > 0
      ? activityCalories
      : (readNumber(context.dailyTotalsRow, ["exercise_kcal", "activity_kcal", "calories_burned"]) ?? 0);
  const targets = resolveTargets(context.profile, context.dailyLogRow, context.dailyTotalsRow);
  const remainingCalories = roundTo(targets.kcal - actualTotals.kcal, 1);
  const netCalories = roundTo(actualTotals.kcal - exerciseCalories, 1);

  return {
    actual: actualTotals,
    confirmed:
      readBoolean(context.dailyLogRow, ["confirmed"]) ?? readBoolean(context.dailyTotalsRow, ["confirmed"]) ?? false,
    dayType:
      readString(context.dailyLogRow, ["day_type"]) ??
      (exerciseCalories > 0 ? "training" : "rest"),
    exerciseCalories: roundTo(exerciseCalories, 1),
    hasActivity: context.activities.length > 0,
    hasFood: actualTotals.kcal > 0,
    macroProgress: calculateMacroProgress(actualTotals),
    netCalories: roundTo(netCalories, 1),
    remainingCalories,
    targets,
  };
}

/**
 * Resolves calorie and macro targets from the most specific prototype source.
 *
 * Parameters:
 * - profile: The optional mapped profile.
 * - dailyLogRow: The raw daily log row.
 * - dailyTotalsRow: The optional aggregate row.
 *
 * Returns:
 * - The targets used by the prototype UI.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const targets = resolveTargets(profile, dailyLogRow, dailyTotalsRow);
 * ```
 */
function resolveTargets(
  profile: PrototypeProfile | null,
  dailyLogRow: PrototypeDailyLogRow | null,
  dailyTotalsRow: PrototypeDailyTotalsRow | null,
): PrototypeMacroTargets {
  return {
    kcal:
      readNumber(dailyLogRow, ["target_kcal"]) ??
      readNumber(dailyTotalsRow, ["target_kcal"]) ??
      profile?.targets.kcal ??
      DEFAULT_TARGETS.kcal,
    protein:
      readNumber(dailyLogRow, ["target_protein"]) ??
      readNumber(dailyTotalsRow, ["target_protein"]) ??
      profile?.targets.protein ??
      DEFAULT_TARGETS.protein,
    carbs:
      readNumber(dailyLogRow, ["target_carbs"]) ??
      readNumber(dailyTotalsRow, ["target_carbs"]) ??
      profile?.targets.carbs ??
      DEFAULT_TARGETS.carbs,
    fat:
      readNumber(dailyLogRow, ["target_fat"]) ??
      readNumber(dailyTotalsRow, ["target_fat"]) ??
      profile?.targets.fat ??
      DEFAULT_TARGETS.fat,
  };
}

/**
 * Returns the fixed empty meal-slot structure used by the prototype UI.
 *
 * Parameters:
 * - dailyLogId: Optional daily log ID to stamp onto placeholder slots.
 *
 * Returns:
 * - Empty meal slots in display order.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const slots = createEmptyMealSlots();
 * ```
 */
function createEmptyMealSlots(dailyLogId: string | null = null): PrototypeMealSlot[] {
  return MEAL_SLOT_SEEDS.map((seed) => ({
    dailyLogId,
    icon: seed.icon,
    id: `${seed.slotKey}-${dailyLogId ?? "empty"}`,
    isEmpty: true,
    items: [],
    label: seed.label,
    name: seed.label,
    slotKey: seed.slotKey,
    sortOrder: seed.sortOrder,
    totals: createEmptyTotals(),
  }));
}

/**
 * Resolves a meal row into one of the known prototype slots.
 *
 * Parameters:
 * - row: The raw meal row.
 *
 * Returns:
 * - The seed describing the display slot for that meal.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const slot = resolveMealSlotSeed(row);
 * ```
 */
function resolveMealSlotSeed(row: PrototypeMealRow) {
  const candidate = normalizeMealKey(readString(row, ["meal_type", "meal_name"]));

  return (
    MEAL_SLOT_SEEDS.find((seed) => seed.aliases.some((alias) => candidate.includes(alias))) ?? {
      slotKey: "other",
      label: readString(row, ["meal_name"]) ?? "Meal",
      icon: readString(row, ["meal_icon"]) ?? "🍽️",
      sortOrder: readNumber(row, ["sort_order"]) ?? 999,
      aliases: [],
    }
  );
}

/**
 * Normalizes a meal identifier into a lowercase comparison key.
 *
 * Parameters:
 * - value: The meal type or name to normalize.
 *
 * Returns:
 * - A comparison-safe lowercase string.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const key = normalizeMealKey("Training Fuel");
 * ```
 */
function normalizeMealKey(value: string | null) {
  return (value ?? "").trim().toLowerCase().replaceAll(/[\s-]+/g, " ");
}

/**
 * Aggregates totals from a list of food items.
 *
 * Parameters:
 * - items: The normalized food items for a single meal.
 *
 * Returns:
 * - Summed calories and macros.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const totals = aggregateFoodItems(items);
 * ```
 */
function aggregateFoodItems(items: PrototypeFoodItem[]) {
  return items.reduce(
    (totals, item) => ({
      kcal: totals.kcal + item.kcal,
      protein: totals.protein + item.protein,
      carbs: totals.carbs + item.carbs,
      fat: totals.fat + item.fat,
    }),
    createEmptyTotals(),
  );
}

/**
 * Aggregates totals from a list of meal slots.
 *
 * Parameters:
 * - meals: The meal slots for a selected day.
 *
 * Returns:
 * - Summed calories and macros across the day.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const totals = aggregateMeals(meals);
 * ```
 */
function aggregateMeals(meals: PrototypeMealSlot[]) {
  return meals.reduce(
    (totals, meal) => addMacroTotals(totals, meal.totals),
    createEmptyTotals(),
  );
}

/**
 * Reads macro totals from an optional aggregate row using flexible aliases.
 *
 * Parameters:
 * - row: The aggregate row to read from.
 * - kcalKeys: The possible calorie column names.
 * - proteinKeys: The possible protein column names.
 * - carbsKeys: The possible carbs column names.
 * - fatKeys: The possible fat column names.
 *
 * Returns:
 * - A totals object when at least one metric is present, otherwise `null`.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const totals = readMacroTotals(row, ["kcal"], ["protein"], ["carbs"], ["fat"]);
 * ```
 */
function readMacroTotals(
  row: JsonRecord | null,
  kcalKeys: string[],
  proteinKeys: string[],
  carbsKeys: string[],
  fatKeys: string[],
) {
  if (!row) {
    return null;
  }

  const kcal = readNumber(row, kcalKeys);
  const protein = readNumber(row, proteinKeys);
  const carbs = readNumber(row, carbsKeys);
  const fat = readNumber(row, fatKeys);

  if (kcal === null && protein === null && carbs === null && fat === null) {
    return null;
  }

  return {
    kcal: kcal ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
  };
}

/**
 * Calculates the protein/carbs/fat calorie share for a set of totals.
 *
 * Parameters:
 * - totals: The daily totals to inspect.
 *
 * Returns:
 * - Percentages that sum to roughly 100 when food is present.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const progress = calculateMacroProgress(totals);
 * ```
 */
function calculateMacroProgress(totals: PrototypeMacroTotals): PrototypeMacroProgress {
  const macroCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;

  if (macroCalories <= 0) {
    return {
      carbsPct: 0,
      fatPct: 0,
      proteinPct: 0,
    };
  }

  return {
    carbsPct: Math.round((totals.carbs * 4 * 100) / macroCalories),
    fatPct: Math.round((totals.fat * 9 * 100) / macroCalories),
    proteinPct: Math.round((totals.protein * 4 * 100) / macroCalories),
  };
}

/**
 * Builds a descending-safe date range that ends on the supplied date.
 *
 * Parameters:
 * - endDate: The final date in the range.
 * - length: The number of days to include.
 *
 * Returns:
 * - Ascending `YYYY-MM-DD` dates covering the requested range.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const dates = buildDateRange("2026-04-06", 7);
 * ```
 */
function buildDateRange(endDate: string, length: number) {
  return Array.from({ length }, (_, index) => shiftDate(endDate, index - (length - 1)));
}

/**
 * Normalizes a `Date` or date string into `YYYY-MM-DD`.
 *
 * Parameters:
 * - input: The date-like value to normalize.
 *
 * Returns:
 * - A `YYYY-MM-DD` date string.
 *
 * Raised errors:
 * - Throws when the input cannot be converted into a valid date.
 *
 * Example:
 * ```ts
 * const date = normalizePrototypeDate(new Date());
 * ```
 */
function normalizePrototypeDate(input: PrototypeDateInput) {
  if (typeof input === "string") {
    const trimmed = input.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  if (input instanceof Date && !Number.isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10);
  }

  throw new Error(`Invalid prototype date input: ${String(input)}`);
}

/**
 * Shifts a normalized date string by a number of whole days.
 *
 * Parameters:
 * - date: The source `YYYY-MM-DD` date string.
 * - offsetDays: The day offset to apply.
 *
 * Returns:
 * - The shifted `YYYY-MM-DD` date string.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const previous = shiftDate("2026-04-06", -1);
 * ```
 */
function shiftDate(date: string, offsetDays: number) {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + offsetDays);
  return utcDate.toISOString().slice(0, 10);
}

/**
 * Reads the first string value available from a record.
 *
 * Parameters:
 * - record: The raw record being inspected.
 * - keys: Candidate keys in descending priority order.
 *
 * Returns:
 * - The trimmed string value, or `null`.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const title = readString(row, ["title", "name"]);
 * ```
 */
function readString(record: JsonRecord | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

/**
 * Reads the first numeric value available from a record.
 *
 * Parameters:
 * - record: The raw record being inspected.
 * - keys: Candidate keys in descending priority order.
 *
 * Returns:
 * - The parsed number, or `null`.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const calories = readNumber(row, ["kcal", "calories"]);
 * ```
 */
function readNumber(record: JsonRecord | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Reads the first boolean value available from a record.
 *
 * Parameters:
 * - record: The raw record being inspected.
 * - keys: Candidate keys in descending priority order.
 *
 * Returns:
 * - The parsed boolean, or `null`.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const confirmed = readBoolean(row, ["confirmed"]);
 * ```
 */
function readBoolean(record: JsonRecord | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }
    }
  }

  return null;
}

/**
 * Reads the first identifier-like value from a record.
 *
 * Parameters:
 * - record: The raw record being inspected.
 * - keys: Candidate keys in descending priority order.
 *
 * Returns:
 * - The identifier coerced to a string, or `null`.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const id = readIdentifier(row, ["id"]);
 * ```
 */
function readIdentifier(record: JsonRecord | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

/**
 * Parses an arbitrary JSON field into a string array.
 *
 * Parameters:
 * - value: The raw JSON-like field.
 *
 * Returns:
 * - A normalized string array.
 *
 * Raised errors:
 * - None. Invalid JSON falls back to an empty array.
 *
 * Example:
 * ```ts
 * const achievements = parseStringArray(row.achievements);
 * ```
 */
function parseStringArray(value: unknown) {
  const parsed = parseJsonValue(value);

  return Array.isArray(parsed)
    ? parsed
        .map((entry) => (typeof entry === "string" ? entry.trim() : null))
        .filter((entry): entry is string => Boolean(entry))
    : [];
}

/**
 * Parses an arbitrary JSON field into prototype activity stats.
 *
 * Parameters:
 * - value: The raw JSON-like field.
 *
 * Returns:
 * - A normalized list of `{ label, value }` pairs.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const stats = parseExtraStats(row.extra_stats);
 * ```
 */
function parseExtraStats(value: unknown) {
  const parsed = parseJsonValue(value);

  return Array.isArray(parsed)
    ? parsed
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const record = entry as JsonRecord;
          const label = readString(record, ["label"]);
          const statValue = readString(record, ["value"]);

          return label && statValue ? { label, value: statValue } : null;
        })
        .filter((entry): entry is ActivityExtraStat => entry !== null)
    : [];
}

/**
 * Parses an arbitrary JSON field into prototype activity zones.
 *
 * Parameters:
 * - value: The raw JSON-like field.
 *
 * Returns:
 * - A normalized list of `{ zone, pct }` pairs.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const zones = parseZones(row.zones);
 * ```
 */
function parseZones(value: unknown) {
  const parsed = parseJsonValue(value);

  return Array.isArray(parsed)
    ? parsed
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const record = entry as JsonRecord;
          const zone = readString(record, ["zone"]);
          const pct = readNumber(record, ["pct"]);

          return zone && pct !== null ? { pct, zone } : null;
        })
        .filter((entry): entry is ActivityZone => entry !== null)
    : [];
}

/**
 * Parses a raw JSON-like field that may already be an object or may still be
 * a serialized string.
 *
 * Parameters:
 * - value: The raw field from Supabase.
 *
 * Returns:
 * - The parsed JSON value, or `null`.
 *
 * Raised errors:
 * - None. Invalid JSON falls back to `null`.
 *
 * Example:
 * ```ts
 * const parsed = parseJsonValue(row.extra_stats);
 * ```
 */
function parseJsonValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

/**
 * Derives a calorie target from profile physiology fields.
 *
 * Parameters:
 * - bmr: The basal metabolic rate.
 * - activityMultiplier: The profile activity multiplier.
 * - dailyDeficit: The desired calorie deficit.
 *
 * Returns:
 * - The derived calorie target, or `null` when the inputs are incomplete.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const target = deriveCalorieTarget(1650, 1.2, 550);
 * ```
 */
function deriveCalorieTarget(
  bmr: number | null,
  activityMultiplier: number | null,
  dailyDeficit: number | null,
) {
  if (bmr === null || activityMultiplier === null || dailyDeficit === null) {
    return null;
  }

  return Math.round(bmr * activityMultiplier - dailyDeficit);
}

/**
 * Adds two totals objects together.
 *
 * Parameters:
 * - left: The running total.
 * - right: The amount to add.
 *
 * Returns:
 * - A new totals object.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const sum = addMacroTotals(dayOne, dayTwo);
 * ```
 */
function addMacroTotals(left: PrototypeMacroTotals, right: PrototypeMacroTotals): PrototypeMacroTotals {
  return {
    kcal: roundTo(left.kcal + right.kcal, 1),
    protein: roundTo(left.protein + right.protein, 1),
    carbs: roundTo(left.carbs + right.carbs, 1),
    fat: roundTo(left.fat + right.fat, 1),
  };
}

/**
 * Creates a fresh zeroed totals object.
 *
 * Parameters:
 * - None.
 *
 * Returns:
 * - A zeroed totals object.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const totals = createEmptyTotals();
 * ```
 */
function createEmptyTotals(): PrototypeMacroTotals {
  return { ...EMPTY_TOTALS };
}

/**
 * Rounds a number to a fixed number of decimal places.
 *
 * Parameters:
 * - value: The number to round.
 * - digits: The number of decimal places to keep.
 *
 * Returns:
 * - The rounded number.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const rounded = roundTo(12.345, 1);
 * ```
 */
function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Creates a stable synthetic ID for placeholder rows.
 *
 * Parameters:
 * - prefix: The entity prefix to use.
 *
 * Returns:
 * - A simple synthetic ID.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const id = createSyntheticId("activity");
 * ```
 */
function createSyntheticId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

// Keep the current food-log `MealType` visible to consumers that want to bridge
// between the existing manual composer and the prototype slot layout.
export type PrototypeComposerMealType = MealType;

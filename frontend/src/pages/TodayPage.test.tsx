import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TodayPage } from "./TodayPage";

const mockedUseSession = vi.fn();
const mockedGetPrototypeDashboardDay = vi.fn();
const mockedGetPrototypeWeekRollup = vi.fn();
const mockedIsPrototypeSupabaseConfigured = vi.fn();
const mockedIsPrototypeSchemaMismatchError = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
}));

vi.mock("../lib/prototypeNutrition", () => ({
  getPrototypeDashboardDay: (...args: unknown[]) => mockedGetPrototypeDashboardDay(...args),
  getPrototypeWeekRollup: (...args: unknown[]) => mockedGetPrototypeWeekRollup(...args),
}));

vi.mock("../lib/prototypeSupabaseRest", () => ({
  isPrototypeSupabaseConfigured: () => mockedIsPrototypeSupabaseConfigured(),
  isPrototypeSchemaMismatchError: (...args: unknown[]) => mockedIsPrototypeSchemaMismatchError(...args),
}));

describe("TodayPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedIsPrototypeSupabaseConfigured.mockReturnValue(true);
    mockedIsPrototypeSchemaMismatchError.mockReturnValue(false);
  });

  it("switches the weekly trend between calories and training load", async () => {
    const user = userEvent.setup();
    mockedUseSession.mockReturnValue({
      api: {
        getNutritionToday: vi.fn().mockResolvedValue({}),
        getNutritionWeekly: vi.fn().mockResolvedValue({ days: [] }),
        getTrainingToday: vi.fn().mockResolvedValue({
          date: "2026-04-07",
          metrics: { ctl: 58, atl: 61, tsb: -3, daily_tss: 48 },
          status: "optimal",
          planned_activities: [],
          completed_activities: [],
        }),
        getTrainingLoad: vi.fn().mockResolvedValue({
          series: [
            { date: "2026-04-01", ctl: 50, atl: 52, tsb: -2, daily_tss: 28 },
            { date: "2026-04-02", ctl: 51, atl: 54, tsb: -3, daily_tss: 32 },
            { date: "2026-04-03", ctl: 52, atl: 55, tsb: -3, daily_tss: 34 },
            { date: "2026-04-04", ctl: 53, atl: 56, tsb: -3, daily_tss: 36 },
            { date: "2026-04-05", ctl: 54, atl: 57, tsb: -3, daily_tss: 40 },
            { date: "2026-04-06", ctl: 55, atl: 59, tsb: -4, daily_tss: 44 },
            { date: "2026-04-07", ctl: 56, atl: 60, tsb: -4, daily_tss: 48 },
          ],
        }),
      },
    });
    mockedGetPrototypeDashboardDay.mockResolvedValue({
      activities: [],
      dailyLogId: "daily-1",
      date: "2026-04-07",
      hasLog: true,
      meals: [
        {
          dailyLogId: "daily-1",
          icon: "☀️",
          id: "meal-1",
          isEmpty: false,
          items: [],
          label: "Breakfast",
          name: "Breakfast",
          slotKey: "breakfast",
          sortOrder: 1,
          totals: { carbs: 60, fat: 14, kcal: 520, protein: 32 },
        },
      ],
      profile: {
        activityMultiplier: 1.2,
        bmr: 1650,
        dailyDeficit: 550,
        targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
        targetWeightKg: 64,
        userId: "sergio",
        weeklyLossKg: 0.5,
        weightKg: 68.5,
      },
      summary: {
        actual: { carbs: 182, fat: 48, kcal: 1680, protein: 138 },
        confirmed: false,
        dayType: "moderate",
        exerciseCalories: 680,
        hasActivity: true,
        hasFood: true,
        macroProgress: { carbsPct: 44, fatPct: 24, proteinPct: 32 },
        netCalories: 1000,
        remainingCalories: 420,
        targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
      },
      userId: "sergio",
    });
    mockedGetPrototypeWeekRollup.mockResolvedValue({
      averageCalories: 1720,
      days: [
        {
          actual: { carbs: 150, fat: 35, kcal: 1500, protein: 120 },
          confirmed: true,
          date: "2026-04-01",
          dayType: "rest",
          exerciseCalories: 120,
          hasActivity: true,
          hasFood: true,
          hasLog: true,
          netCalories: 1380,
          remainingCalories: 320,
          targets: { carbs: 200, fat: 55, kcal: 1820, protein: 140 },
        },
        {
          actual: { carbs: 182, fat: 48, kcal: 1680, protein: 138 },
          confirmed: false,
          date: "2026-04-07",
          dayType: "moderate",
          exerciseCalories: 680,
          hasActivity: true,
          hasFood: true,
          hasLog: true,
          netCalories: 1000,
          remainingCalories: 420,
          targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
        },
      ],
      endDate: "2026-04-07",
      startDate: "2026-04-01",
      totals: {
        actual: { carbs: 332, fat: 83, kcal: 3180, protein: 258 },
        exerciseCalories: 800,
        netCalories: 2380,
      },
      userId: "sergio",
    });

    render(<TodayPage />);

    expect(await screen.findByRole("heading", { name: "Seven-day trend" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() => {
      expect(screen.getByText("Training load")).toBeInTheDocument();
    });
    expect(screen.getByText("TSS")).toBeInTheDocument();
    expect(screen.getByText("2780")).toBeInTheDocument();
    expect(screen.getByText("Expected")).toBeInTheDocument();
  });

  it("shows macro composition percentages from the expected macro targets", async () => {
    mockedUseSession.mockReturnValue({
      api: {
        getNutritionToday: vi.fn().mockResolvedValue({}),
        getNutritionWeekly: vi.fn().mockResolvedValue({ days: [] }),
        getTrainingToday: vi.fn().mockResolvedValue({
          date: "2026-04-07",
          metrics: { ctl: 58, atl: 61, tsb: -3, daily_tss: 48 },
          status: "optimal",
          planned_activities: [],
          completed_activities: [],
        }),
        getTrainingLoad: vi.fn().mockResolvedValue({ series: [] }),
      },
    });
    mockedGetPrototypeDashboardDay.mockResolvedValue({
      activities: [],
      dailyLogId: "daily-1",
      date: "2026-04-07",
      hasLog: true,
      meals: [],
      profile: {
        activityMultiplier: 1.2,
        bmr: 1650,
        dailyDeficit: 550,
        targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
        targetWeightKg: 64,
        userId: "sergio",
        weeklyLossKg: 0.5,
        weightKg: 68.5,
      },
      summary: {
        actual: { carbs: 182, fat: 48, kcal: 1680, protein: 138 },
        confirmed: false,
        dayType: "moderate",
        exerciseCalories: 680,
        hasActivity: true,
        hasFood: true,
        macroProgress: { carbsPct: 44, fatPct: 24, proteinPct: 32 },
        netCalories: 1000,
        remainingCalories: 420,
        targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
      },
      userId: "sergio",
    });
    mockedGetPrototypeWeekRollup.mockResolvedValue({
      averageCalories: 1680,
      days: [
        {
          actual: { carbs: 182, fat: 48, kcal: 1680, protein: 138 },
          confirmed: false,
          date: "2026-04-07",
          dayType: "moderate",
          exerciseCalories: 680,
          hasActivity: true,
          hasFood: true,
          hasLog: true,
          netCalories: 1000,
          remainingCalories: 420,
          targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
        },
      ],
      endDate: "2026-04-07",
      startDate: "2026-04-07",
      totals: {
        actual: { carbs: 182, fat: 48, kcal: 1680, protein: 138 },
        exerciseCalories: 680,
        netCalories: 1000,
      },
      userId: "sergio",
    });

    render(<TodayPage />);

    expect(await screen.findByRole("heading", { name: "Expected split" })).toBeInTheDocument();
    expect(screen.getByLabelText("Macro composition donut")).toBeInTheDocument();
    expect(screen.getByText("P 27%")).toBeInTheDocument();
    expect(screen.getByText("C 47%")).toBeInTheDocument();
    expect(screen.getByText("F 26%")).toBeInTheDocument();
  });

  it("loads the selected historical day from the API when the prototype is unavailable", async () => {
    const user = userEvent.setup();
    const today = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const getNutritionToday = vi.fn().mockImplementation(async (requestedDate?: string) => ({
      date: requestedDate ?? today,
      summary: {
        calories_consumed: requestedDate === yesterdayDate ? 1480 : 1760,
        calories_target: requestedDate === yesterdayDate ? 2150 : 2250,
        protein_g: requestedDate === yesterdayDate ? 124 : 136,
        carbs_g: requestedDate === yesterdayDate ? 188 : 232,
        fat_g: requestedDate === yesterdayDate ? 46 : 52,
        target_day_type: requestedDate === yesterdayDate ? "easy_z2" : "hard",
        note: "Loaded from the API",
      },
      meals: [
        {
          log_id: `meal-${requestedDate ?? today}`,
          user_id: "sergio",
          meal_type: "lunch",
          meal_name: requestedDate === yesterdayDate ? "Historical lunch" : "Today lunch",
          logged_at: `${requestedDate ?? today}T12:00:00Z`,
          total_calories: requestedDate === yesterdayDate ? 640 : 720,
          total_protein_g: requestedDate === yesterdayDate ? 40 : 44,
          total_carbs_g: requestedDate === yesterdayDate ? 72 : 84,
          total_fat_g: requestedDate === yesterdayDate ? 18 : 20,
          ingredients: [],
          source: "manual",
          created_at: `${requestedDate ?? today}T12:00:00Z`,
        },
      ],
    }));
    const getNutritionWeekly = vi.fn().mockImplementation(async (endDate?: string) => ({
      days: Array.from({ length: 7 }, (_, index) => {
        const day = new Date(`${endDate ?? today}T12:00:00Z`);
        day.setUTCDate(day.getUTCDate() - (6 - index));
        return {
          date: day.toISOString().slice(0, 10),
          calories: 1500 + index * 50,
          protein_g: 110 + index,
          carbs_g: 180 + index * 4,
          fat_g: 45 + index,
        };
      }),
    }));
    const getTrainingToday = vi.fn().mockImplementation(async (requestedDate?: string) => ({
      date: requestedDate ?? today,
      metrics: { ctl: 58, atl: 61, tsb: -3, daily_tss: requestedDate === yesterdayDate ? 32 : 48 },
      status: "optimal",
      planned_activities: [],
      completed_activities: [],
    }));
    const getTrainingLoad = vi.fn().mockImplementation(async (_days = 120, endDate?: string) => ({
      series: Array.from({ length: 7 }, (_, index) => {
        const day = new Date(`${endDate ?? today}T12:00:00Z`);
        day.setUTCDate(day.getUTCDate() - (6 - index));
        return {
          date: day.toISOString().slice(0, 10),
          ctl: 50 + index,
          atl: 52 + index,
          tsb: -2,
          daily_tss: 20 + index * 4,
        };
      }),
    }));

    mockedIsPrototypeSupabaseConfigured.mockReturnValue(false);
    mockedUseSession.mockReturnValue({
      api: {
        getNutritionToday,
        getNutritionWeekly,
        getTrainingToday,
        getTrainingLoad,
      },
    });

    render(<TodayPage />);

    expect(await screen.findByRole("heading", { name: "Seven-day trend" })).toBeInTheDocument();
    expect(getNutritionToday).toHaveBeenLastCalledWith(today);

    await user.click(screen.getByRole("button", { name: "Previous day" }));

    await waitFor(() => {
      expect(getNutritionToday).toHaveBeenLastCalledWith(yesterdayDate);
      expect(getNutritionWeekly).toHaveBeenLastCalledWith(yesterdayDate);
      expect(getTrainingToday).toHaveBeenLastCalledWith(yesterdayDate);
      expect(getTrainingLoad).toHaveBeenLastCalledWith(120, yesterdayDate);
    });
  });

  it("expands a meal slot to reveal the logged food detail", async () => {
    const user = userEvent.setup();
    mockedUseSession.mockReturnValue({
      api: {
        getNutritionToday: vi.fn().mockResolvedValue({}),
        getNutritionWeekly: vi.fn().mockResolvedValue({ days: [] }),
        getTrainingToday: vi.fn().mockResolvedValue({
          date: "2026-04-07",
          metrics: { ctl: 58, atl: 61, tsb: -3, daily_tss: 48 },
          status: "optimal",
          planned_activities: [],
          completed_activities: [],
        }),
        getTrainingLoad: vi.fn().mockResolvedValue({ series: [] }),
      },
    });
    mockedGetPrototypeDashboardDay.mockResolvedValue({
      activities: [],
      dailyLogId: "daily-1",
      date: "2026-04-07",
      hasLog: true,
      meals: [
        {
          dailyLogId: "daily-1",
          icon: "☀️",
          id: "meal-1",
          isEmpty: false,
          items: [
            {
              amount: 120,
              carbs: 27,
              fat: 3,
              id: "item-1",
              kcal: 210,
              mealId: "meal-1",
              name: "Overnight oats",
              protein: 11,
              sortOrder: 1,
              source: "personal_db",
              unit: "g",
            },
          ],
          label: "Breakfast",
          name: "Breakfast",
          slotKey: "breakfast",
          sortOrder: 1,
          totals: { carbs: 27, fat: 3, kcal: 210, protein: 11 },
        },
      ],
      profile: {
        activityMultiplier: 1.2,
        bmr: 1650,
        dailyDeficit: 550,
        targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
        targetWeightKg: 64,
        userId: "sergio",
        weeklyLossKg: 0.5,
        weightKg: 68.5,
      },
      summary: {
        actual: { carbs: 27, fat: 3, kcal: 210, protein: 11 },
        confirmed: false,
        dayType: "rest",
        exerciseCalories: 0,
        hasActivity: false,
        hasFood: true,
        macroProgress: { carbsPct: 50, fatPct: 15, proteinPct: 35 },
        netCalories: 210,
        remainingCalories: 1890,
        targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
      },
      userId: "sergio",
    });
    mockedGetPrototypeWeekRollup.mockResolvedValue({
      averageCalories: 210,
      days: [
        {
          actual: { carbs: 27, fat: 3, kcal: 210, protein: 11 },
          confirmed: false,
          date: "2026-04-07",
          dayType: "rest",
          exerciseCalories: 0,
          hasActivity: false,
          hasFood: true,
          hasLog: true,
          netCalories: 210,
          remainingCalories: 1890,
          targets: { carbs: 240, fat: 60, kcal: 2100, protein: 140 },
        },
      ],
      endDate: "2026-04-07",
      startDate: "2026-04-07",
      totals: {
        actual: { carbs: 27, fat: 3, kcal: 210, protein: 11 },
        exerciseCalories: 0,
        netCalories: 210,
      },
      userId: "sergio",
    });

    render(<TodayPage />);

    const breakfastRow = await screen.findByRole("button", { name: /breakfast/i });
    await user.click(breakfastRow);

    expect(await screen.findByText("Overnight oats")).toBeInTheDocument();
    expect(screen.getByText(/120g · personal_db/i)).toBeInTheDocument();
  });

  it("shows the branded APEX loading state while the selected day is still loading", async () => {
    mockedUseSession.mockReturnValue({
      api: {
        getNutritionToday: vi.fn().mockResolvedValue({}),
        getNutritionWeekly: vi.fn().mockResolvedValue({ days: [] }),
        getTrainingToday: vi.fn().mockResolvedValue({
          date: "2026-04-07",
          metrics: { ctl: 58, atl: 61, tsb: -3, daily_tss: 48 },
          status: "optimal",
          planned_activities: [],
          completed_activities: [],
        }),
        getTrainingLoad: vi.fn().mockResolvedValue({ series: [] }),
      },
    });
    mockedGetPrototypeDashboardDay.mockImplementation(
      () =>
        new Promise(() => {
          // Keep the request pending so the dashboard stays in its loading state.
        }),
    );
    mockedGetPrototypeWeekRollup.mockImplementation(
      () =>
        new Promise(() => {
          // Keep the request pending so the dashboard stays in its loading state.
        }),
    );

    render(<TodayPage />);

    expect(document.querySelector(".dashboard-loader .apex-wordmark")?.textContent).toBe("APEX");
    expect(screen.getByText("Loading dashboard data")).toBeInTheDocument();
    expect(screen.getByText("Syncing nutrition, activity, and target context.")).toBeInTheDocument();
  });

  it("falls back to the FastAPI dashboard when the legacy Supabase prototype schema is missing", async () => {
    mockedUseSession.mockReturnValue({
      api: {
        getNutritionToday: vi.fn().mockResolvedValue({
          date: "2026-04-07",
          summary: {
            calories_consumed: 1650,
            calories_target: 2100,
            protein_g: 132,
            carbs_g: 180,
            fat_g: 52,
            target_day_type: "moderate",
          },
          meals: [
            {
              log_id: "meal-1",
              meal_name: "API lunch",
              meal_type: "lunch",
              logged_at: "2026-04-07T12:00:00.000Z",
              total_calories: 640,
              total_protein_g: 41,
              total_carbs_g: 73,
              total_fat_g: 18,
              ingredients: [
                {
                  ingredient_id: "ingredient-1",
                  food_id: null,
                  name: "Rice bowl",
                  quantity_g: 250,
                  calories: 640,
                  protein_g: 41,
                  carbs_g: 73,
                  fat_g: 18,
                },
              ],
            },
          ],
        }),
        getNutritionWeekly: vi.fn().mockResolvedValue({
          days: [{ date: "2026-04-07", calories: 1650 }],
        }),
        getTrainingToday: vi.fn().mockResolvedValue({
          date: "2026-04-07",
          metrics: { ctl: 58, atl: 61, tsb: -3, daily_tss: 48 },
          status: "optimal",
          planned_activities: [],
          completed_activities: [],
        }),
        getTrainingLoad: vi.fn().mockResolvedValue({
          series: [{ date: "2026-04-07", ctl: 56, atl: 60, tsb: -4, daily_tss: 48 }],
        }),
      },
    });
    mockedGetPrototypeDashboardDay.mockRejectedValue(
      new Error("Could not find the table 'public.daily_log' in the schema cache."),
    );
    mockedGetPrototypeWeekRollup.mockRejectedValue(
      new Error("Could not find the table 'public.daily_log' in the schema cache."),
    );
    mockedIsPrototypeSchemaMismatchError.mockImplementation((error: unknown) => {
      return error instanceof Error && error.message.includes("public.daily_log");
    });

    render(<TodayPage />);

    expect(await screen.findByRole("heading", { name: "Seven-day trend" })).toBeInTheDocument();
    expect(screen.queryByText(/could not find the table/i)).not.toBeInTheDocument();
  });
});

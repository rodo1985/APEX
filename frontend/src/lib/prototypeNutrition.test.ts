import { describe, expect, it, vi } from "vitest";

import { getPrototypeDashboardDay } from "./prototypeNutrition";

const mockedResolvePrototypeUserId = vi.fn();
const mockedSelectFirstFromSupabase = vi.fn();
const mockedSelectFromSupabase = vi.fn();

vi.mock("./prototypeSupabaseRest", () => ({
  resolvePrototypeUserId: (...args: unknown[]) => mockedResolvePrototypeUserId(...args),
  selectFirstFromSupabase: (...args: unknown[]) => mockedSelectFirstFromSupabase(...args),
  selectFromSupabase: (...args: unknown[]) => mockedSelectFromSupabase(...args),
}));

describe("prototype nutrition adapter", () => {
  it("derives calorie totals from raw meals and activities instead of inflated daily_totals aggregates", async () => {
    mockedResolvePrototypeUserId.mockReturnValue("sergio");
    mockedSelectFirstFromSupabase.mockImplementation(async (table: string) => {
      if (table === "profile") {
        return {
          user_id: "sergio",
          bmr: 1650,
          activity_multiplier: 1.2,
          daily_deficit: 550,
        };
      }

      if (table === "daily_log") {
        return {
          id: "daily-1",
          log_date: "2026-04-07",
          day_type: "moderate",
          target_kcal: 2100,
          target_protein: 140,
          target_carbs: 240,
          target_fat: 60,
        };
      }

      if (table === "daily_totals") {
        return {
          daily_log_id: "daily-1",
          log_date: "2026-04-07",
          target_kcal: 2100,
          target_protein: 140,
          target_carbs: 240,
          target_fat: 60,
          calories_consumed: 2400,
          exercise_kcal: 1000,
          net_kcal: 1400,
        };
      }

      return null;
    });

    mockedSelectFromSupabase.mockImplementation(async (table: string) => {
      if (table === "meals") {
        return [
          { id: "meal-1", daily_log_id: "daily-1", meal_name: "Breakfast", meal_icon: "☀️", sort_order: 1 },
        ];
      }

      if (table === "activities") {
        return [
          { id: "activity-1", daily_log_id: "daily-1", title: "Tempo ride", sport: "cycling", calories: 600 },
        ];
      }

      if (table === "food_items") {
        return [
          {
            id: "item-1",
            meal_id: "meal-1",
            name: "Oats",
            amount: 120,
            unit: "g",
            kcal: 500,
            protein: 20,
            carbs: 70,
            fat: 10,
            sort_order: 1,
            source: "personal_db",
          },
        ];
      }

      if (table === "meal_totals") {
        return [];
      }

      return [];
    });

    const snapshot = await getPrototypeDashboardDay("2026-04-07");

    expect(snapshot.summary.actual.kcal).toBe(500);
    expect(snapshot.summary.exerciseCalories).toBe(600);
    expect(snapshot.summary.netCalories).toBe(-100);
    expect(snapshot.summary.remainingCalories).toBe(1600);
  });
});

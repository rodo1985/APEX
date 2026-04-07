import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FoodLogPage } from "./FoodLogPage";

const mockedUseSession = vi.fn();
const mockedRecordAudioOnce = vi.fn();
const mockedGetPrototypeFoodLogDay = vi.fn();
const mockedIsPrototypeSupabaseConfigured = vi.fn();
const mockedIsPrototypeSchemaMismatchError = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
}));

vi.mock("../lib/prototypeNutrition", () => ({
  getPrototypeFoodLogDay: (...args: unknown[]) => mockedGetPrototypeFoodLogDay(...args),
}));

vi.mock("../lib/prototypeSupabaseRest", () => ({
  isPrototypeSupabaseConfigured: () => mockedIsPrototypeSupabaseConfigured(),
  isPrototypeSchemaMismatchError: (...args: unknown[]) => mockedIsPrototypeSchemaMismatchError(...args),
}));

vi.mock("../lib/voice", () => ({
  recordAudioOnce: () => mockedRecordAudioOnce(),
}));

describe("FoodLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsPrototypeSupabaseConfigured.mockReturnValue(false);
    mockedIsPrototypeSchemaMismatchError.mockReturnValue(false);
  });

  it("supports manual meal drafting with food search results", async () => {
    const user = userEvent.setup();
    const api = {
      getNutritionLog: vi.fn().mockResolvedValue({ logs: [] }),
      searchFoods: vi.fn().mockResolvedValue({
        results: [
          {
            food_id: "food-1",
            name: "Banana",
            brand: null,
            serving_unit: "g",
            serving_size: 100,
            calories: 105,
            protein_g: 1.3,
            carbs_g: 27,
            fat_g: 0.4,
          },
        ],
        total: 1,
      }),
      createMealLog: vi.fn().mockResolvedValue({}),
      updateMealLog: vi.fn(),
      deleteMealLog: vi.fn(),
      parseVoiceMeal: vi.fn(),
      parsePhotoMeal: vi.fn(),
    };
    mockedUseSession.mockReturnValue({ api });

    const view = render(<FoodLogPage />);

    expect(await screen.findByText("No meals have been logged yet today.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /manual meal/i }));
    await user.type(screen.getByLabelText(/meal name/i), "Banana bowl");
    await user.type(screen.getByLabelText(/add ingredients/i), "banana");

    await waitFor(() => {
      expect(api.searchFoods).toHaveBeenCalledWith("banana");
    });
    expect(await screen.findByText("Banana")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^add$/i }));
    await user.click(screen.getByRole("button", { name: /save meal/i }));

    await waitFor(() => {
      expect(api.createMealLog).toHaveBeenCalledWith(
        expect.objectContaining({
          meal_name: "Banana bowl",
          ingredients: [expect.objectContaining({ name: "Banana" })],
        }),
      );
    });
  });

  it("moves a voice parse into the editable manual review state", async () => {
    const user = userEvent.setup();
    const api = {
      getNutritionLog: vi.fn().mockResolvedValue({ logs: [] }),
      searchFoods: vi.fn(),
      createMealLog: vi.fn(),
      updateMealLog: vi.fn(),
      deleteMealLog: vi.fn(),
      parseVoiceMeal: vi.fn().mockResolvedValue({
        transcript: "I had oats with banana.",
        confidence: 0.92,
        parsed_meal: {
          meal_name: "Overnight oats",
          meal_type: "breakfast",
          ingredients: [
            {
              name: "Rolled oats",
              quantity_g: 80,
              calories: 300,
              protein_g: 10,
              carbs_g: 54,
              fat_g: 6,
            },
          ],
        },
      }),
      parsePhotoMeal: vi.fn(),
    };
    mockedUseSession.mockReturnValue({ api });
    mockedRecordAudioOnce.mockResolvedValue(new Blob(["audio"], { type: "audio/webm" }));

    const view = render(<FoodLogPage />);

    await user.click(screen.getAllByRole("button", { name: /voice meal/i })[0]);
    await user.type(screen.getByLabelText(/transcript hint/i), "Oats with banana");
    await user.click(screen.getByRole("button", { name: /record and parse/i }));

    await waitFor(() => {
      expect(api.parseVoiceMeal).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByDisplayValue("Overnight oats")).toBeInTheDocument();
    expect(screen.getByText("Rolled oats")).toBeInTheDocument();
  });

  it("moves a photo parse into the editable manual review state", async () => {
    const user = userEvent.setup();
    const api = {
      getNutritionLog: vi.fn().mockResolvedValue({ logs: [] }),
      searchFoods: vi.fn(),
      createMealLog: vi.fn(),
      updateMealLog: vi.fn(),
      deleteMealLog: vi.fn(),
      parseVoiceMeal: vi.fn(),
      parsePhotoMeal: vi.fn().mockResolvedValue({
        confidence: 0.88,
        parsed_meal: {
          meal_name: "Rice bowl",
          meal_type: "lunch",
          ingredients: [
            {
              name: "Chicken breast",
              quantity_g: 120,
              calories: 198,
              protein_g: 37,
              carbs_g: 0,
              fat_g: 4,
            },
          ],
        },
      }),
    };
    mockedUseSession.mockReturnValue({ api });

    const view = render(<FoodLogPage />);

    await user.click(screen.getAllByRole("button", { name: /photo meal/i })[0]);
    fireEvent.change(screen.getByLabelText(/meal photo/i), {
      target: {
        files: [new File(["binary"], "meal.jpg", { type: "image/jpeg" })],
      },
    });
    await user.click(screen.getByRole("button", { name: /analyze meal/i }));

    await waitFor(() => {
      expect(api.parsePhotoMeal).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByDisplayValue("Rice bowl")).toBeInTheDocument();
    expect(screen.getByText("Chicken breast")).toBeInTheDocument();
  });

  it("switches past-day browsing into the read-only Supabase history mode", async () => {
    const user = userEvent.setup();
    const api = {
      getNutritionLog: vi.fn().mockResolvedValue({ logs: [] }),
      searchFoods: vi.fn(),
      createMealLog: vi.fn(),
      updateMealLog: vi.fn(),
      deleteMealLog: vi.fn(),
      parseVoiceMeal: vi.fn(),
      parsePhotoMeal: vi.fn(),
    };

    mockedUseSession.mockReturnValue({ api });
    mockedIsPrototypeSupabaseConfigured.mockReturnValue(true);
    mockedGetPrototypeFoodLogDay.mockResolvedValue({
      activities: [
        {
          id: "activity-1",
          title: "Lunch ride",
          sport: "cycling",
          calories: 640,
          distance: 42.5,
          distanceUnit: "km",
          elevation: 510,
          movingTime: "1:26:14",
          avgHr: 142,
          extraStats: [],
          achievements: [],
          zones: [],
        },
      ],
      dailyLogId: "daily-1",
      date: "2026-04-05",
      hasLog: true,
      meals: [
        {
          dailyLogId: "daily-1",
          icon: "🍽️",
          id: "meal-1",
          isEmpty: false,
          items: [
            {
              amount: 180,
              carbs: 62,
              fat: 14,
              id: "item-1",
              kcal: 520,
              mealId: "meal-1",
              name: "Chicken rice bowl",
              protein: 33,
              sortOrder: 1,
              source: "personal_db",
              unit: "g",
            },
          ],
          label: "Lunch",
          name: "Lunch",
          slotKey: "lunch",
          sortOrder: 4,
          totals: {
            carbs: 62,
            fat: 14,
            kcal: 520,
            protein: 33,
          },
        },
      ],
      summary: {
        actual: { carbs: 62, fat: 14, kcal: 520, protein: 33 },
        confirmed: true,
        dayType: "moderate",
        exerciseCalories: 640,
        hasActivity: true,
        hasFood: true,
        macroProgress: { carbsPct: 35, fatPct: 18, proteinPct: 47 },
        netCalories: -120,
        remainingCalories: 1080,
        targets: { carbs: 240, fat: 60, kcal: 1600, protein: 140 },
      },
      userId: "sergio",
    });

    const view = render(<FoodLogPage />);

    const navigation = within(view.container).getByLabelText(/food log date navigation/i);
    expect(navigation).toBeTruthy();

    await user.click(within(navigation as HTMLElement).getByRole("button", { name: /previous day/i }));

    await waitFor(() => {
      expect(mockedGetPrototypeFoodLogDay).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText("Read-only nutrition timeline")).toBeInTheDocument();
    expect(screen.getByText("Chicken rice bowl")).toBeInTheDocument();
    expect(screen.getByText("Activities linked to this day")).toBeInTheDocument();
    expect(within(view.container).queryByRole("button", { name: /manual meal/i })).not.toBeInTheDocument();
  });

  it("falls back to the FastAPI meal log when the legacy Supabase prototype schema is missing", async () => {
    const user = userEvent.setup();
    const previousDay = new Date();
    previousDay.setDate(previousDay.getDate() - 1);
    const expectedPreviousDate = previousDay.toISOString().slice(0, 10);
    const api = {
      getNutritionLog: vi
        .fn()
        .mockResolvedValueOnce({ logs: [] })
        .mockResolvedValueOnce({
          logs: [
            {
              log_id: "meal-1",
              meal_type: "lunch",
              meal_name: "API fallback lunch",
              logged_at: "2026-04-06T12:15:00.000Z",
              source: "manual",
              total_calories: 610,
              total_protein_g: 39,
              total_carbs_g: 68,
              total_fat_g: 17,
              ingredients: [
                {
                  ingredient_id: "ingredient-1",
                  food_id: null,
                  name: "Chicken rice bowl",
                  quantity_g: 240,
                  calories: 610,
                  protein_g: 39,
                  carbs_g: 68,
                  fat_g: 17,
                },
              ],
            },
          ],
        }),
      searchFoods: vi.fn(),
      createMealLog: vi.fn(),
      updateMealLog: vi.fn(),
      deleteMealLog: vi.fn(),
      parseVoiceMeal: vi.fn(),
      parsePhotoMeal: vi.fn(),
    };

    mockedUseSession.mockReturnValue({ api });
    mockedIsPrototypeSupabaseConfigured.mockReturnValue(true);
    mockedGetPrototypeFoodLogDay.mockRejectedValue(
      new Error("Could not find the table 'public.daily_log' in the schema cache."),
    );
    mockedIsPrototypeSchemaMismatchError.mockImplementation((error: unknown) => {
      return error instanceof Error && error.message.includes("public.daily_log");
    });

    render(<FoodLogPage />);

    await user.click(screen.getByRole("button", { name: /previous day/i }));

    expect(await screen.findByText("API fallback lunch")).toBeInTheDocument();
    expect(screen.queryByText(/could not find the table/i)).not.toBeInTheDocument();
    expect(api.getNutritionLog).toHaveBeenLastCalledWith(expectedPreviousDate, expectedPreviousDate);
  });
});

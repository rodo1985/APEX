import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FoodLogPage } from "./FoodLogPage";

const mockedUseSession = vi.fn();
const mockedRecordAudioOnce = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
}));

vi.mock("../lib/voice", () => ({
  recordAudioOnce: () => mockedRecordAudioOnce(),
}));

describe("FoodLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    render(<FoodLogPage />);

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

    render(<FoodLogPage />);

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

    render(<FoodLogPage />);

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
});

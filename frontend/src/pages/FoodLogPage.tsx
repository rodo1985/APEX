import { useEffect, useMemo, useState } from "react";

import { Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import { formatDateLabel } from "../lib/format";
import { recordAudioOnce } from "../lib/voice";
import type { FoodSearchResult, Ingredient, MealLog, MealType } from "../lib/types";

const DEFAULT_DRAFT = {
  meal_type: "lunch" as MealType,
  meal_name: "",
  logged_at: new Date().toISOString().slice(0, 16),
  ingredients: [] as Ingredient[],
};

const mealCategoryMeta: Record<
  MealType,
  { label: string; time: string; image: string; accent: string }
> = {
  breakfast: {
    label: "Breakfast",
    time: "Morning",
    image:
      'linear-gradient(180deg, rgba(15,16,18,0.2), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=1200&q=80")',
    accent: "var(--workspace-orange)",
  },
  lunch: {
    label: "Lunch",
    time: "Midday",
    image:
      'linear-gradient(180deg, rgba(15,16,18,0.18), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80")',
    accent: "var(--workspace-teal)",
  },
  dinner: {
    label: "Dinner",
    time: "Evening",
    image:
      'linear-gradient(180deg, rgba(15,16,18,0.18), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80")',
    accent: "var(--workspace-blue)",
  },
  snack: {
    label: "Snack",
    time: "Anytime",
    image:
      'linear-gradient(180deg, rgba(15,16,18,0.18), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80")',
    accent: "#a78bfa",
  },
};

type ComposerMode = "manual" | "voice" | "photo" | null;

export function FoodLogPage() {
  const { api } = useSession();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodSearchResult[]>([]);
  const [transcriptHint, setTranscriptHint] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [parsing, setParsing] = useState(false);

  async function loadMeals() {
    setLoading(true);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await api.getNutritionLog(today, today);
      setMeals(response.logs);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the meal log.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMeals();
  }, []);

  useEffect(() => {
    if (!foodQuery.trim()) {
      setFoodResults([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void api
        .searchFoods(foodQuery)
        .then((response) => setFoodResults(response.results))
        .catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [api, foodQuery]);

  const draftTotals = useMemo(() => {
    return draft.ingredients.reduce(
      (totals, ingredient) => ({
        calories: totals.calories + ingredient.calories,
        protein: totals.protein + ingredient.protein_g,
        carbs: totals.carbs + ingredient.carbs_g,
        fat: totals.fat + ingredient.fat_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [draft.ingredients]);

  const totalLoggedCalories = meals.reduce((sum, meal) => sum + meal.total_calories, 0);

  function resetComposer(nextMode: ComposerMode = null, mealType?: MealType) {
    setComposerMode(nextMode);
    setEditingMealId(null);
    setDraft({
      ...DEFAULT_DRAFT,
      meal_type: mealType ?? DEFAULT_DRAFT.meal_type,
      logged_at: new Date().toISOString().slice(0, 16),
    });
    setFoodQuery("");
    setFoodResults([]);
    setTranscriptHint("");
    setPhotoFile(null);
  }

  function addIngredientFromFood(food: FoodSearchResult) {
    setDraft((previous) => ({
      ...previous,
      ingredients: [
        ...previous.ingredients,
        {
          food_id: food.food_id,
          name: food.name,
          quantity_g: food.serving_size,
          calories: food.calories,
          protein_g: food.protein_g,
          carbs_g: food.carbs_g,
          fat_g: food.fat_g,
        },
      ],
    }));
  }

  function updateIngredient(index: number, quantity: number) {
    setDraft((previous) => {
      const nextIngredients = [...previous.ingredients];
      const ingredient = nextIngredients[index];
      const multiplier = quantity / ingredient.quantity_g;
      nextIngredients[index] = {
        ...ingredient,
        quantity_g: quantity,
        calories: Number((ingredient.calories * multiplier).toFixed(1)),
        protein_g: Number((ingredient.protein_g * multiplier).toFixed(1)),
        carbs_g: Number((ingredient.carbs_g * multiplier).toFixed(1)),
        fat_g: Number((ingredient.fat_g * multiplier).toFixed(1)),
      };
      return { ...previous, ingredients: nextIngredients };
    });
  }

  function removeIngredient(index: number) {
    setDraft((previous) => ({
      ...previous,
      ingredients: previous.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        meal_type: draft.meal_type,
        meal_name: draft.meal_name || "Untitled meal",
        logged_at: new Date(draft.logged_at).toISOString(),
        ingredients: draft.ingredients.map((ingredient) => ({
          food_id: ingredient.food_id ?? null,
          name: ingredient.name,
          quantity_g: ingredient.quantity_g,
          calories: ingredient.calories,
          protein_g: ingredient.protein_g,
          carbs_g: ingredient.carbs_g,
          fat_g: ingredient.fat_g,
        })),
      };

      if (editingMealId) {
        await api.updateMealLog(editingMealId, payload);
      } else {
        await api.createMealLog(payload);
      }

      resetComposer(null);
      await loadMeals();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save the meal log.");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(meal: MealLog) {
    setComposerMode("manual");
    setEditingMealId(meal.log_id);
    setDraft({
      meal_type: meal.meal_type,
      meal_name: meal.meal_name,
      logged_at: new Date(meal.logged_at).toISOString().slice(0, 16),
      ingredients: meal.ingredients.map((ingredient) => ({
        food_id: ingredient.food_id,
        name: ingredient.name,
        quantity_g: ingredient.quantity_g,
        calories: ingredient.calories,
        protein_g: ingredient.protein_g,
        carbs_g: ingredient.carbs_g,
        fat_g: ingredient.fat_g,
      })),
    });
  }

  async function deleteMeal(mealId: string) {
    setError(null);

    try {
      await api.deleteMealLog(mealId);
      await loadMeals();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete the meal log.");
    }
  }

  async function parseVoiceMeal() {
    setParsing(true);
    setError(null);

    try {
      let audioBlob: Blob;
      try {
        setRecording(true);
        audioBlob = await recordAudioOnce();
      } catch {
        audioBlob = new Blob([transcriptHint || "voice note"], { type: "audio/webm" });
      } finally {
        setRecording(false);
      }

      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-log.webm");
      formData.append("meal_type", draft.meal_type);
      if (transcriptHint.trim()) {
        formData.append("transcript_hint", transcriptHint.trim());
      }

      const response = await api.parseVoiceMeal(formData);
      setDraft({
        meal_type: response.parsed_meal.meal_type,
        meal_name: response.parsed_meal.meal_name,
        logged_at: DEFAULT_DRAFT.logged_at,
        ingredients: response.parsed_meal.ingredients,
      });
      setComposerMode("manual");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to parse the voice meal.");
    } finally {
      setParsing(false);
    }
  }

  async function parsePhotoMeal() {
    if (!photoFile) {
      setError("Choose a photo before starting meal analysis.");
      return;
    }

    setParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", photoFile);
      formData.append("meal_type", draft.meal_type);

      const response = await api.parsePhotoMeal(formData);
      setDraft({
        meal_type: response.parsed_meal.meal_type,
        meal_name: response.parsed_meal.meal_name,
        logged_at: DEFAULT_DRAFT.logged_at,
        ingredients: response.parsed_meal.ingredients,
      });
      setComposerMode("manual");
      setPhotoFile(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to parse the photo meal.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="workspace-section">
      <div className="workspace-page-header compact">
        <div>
          <span>Saturday, 21 March</span>
          <h2>Food Log</h2>
          <p>{Math.round(totalLoggedCalories)} cal logged today</p>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="log-action-grid">
        <button className="log-action-card primary" type="button" onClick={() => setComposerMode("manual")}>
          <Icon name="plus" size={22} />
          <strong>Manual meal</strong>
          <span>Build and review the meal card by card.</span>
        </button>
        <button className="log-action-card" type="button" onClick={() => setComposerMode("voice")}>
          <Icon name="mic" size={22} />
          <strong>Voice meal</strong>
          <span>Push-to-talk, then confirm the parsed ingredients.</span>
        </button>
        <button className="log-action-card" type="button" onClick={() => setComposerMode("photo")}>
          <Icon name="camera" size={22} />
          <strong>Photo meal</strong>
          <span>Upload a meal shot and approve the draft before save.</span>
        </button>
      </section>

      <section className="meal-category-grid">
        {(Object.keys(mealCategoryMeta) as MealType[]).map((mealType) => {
          const meta = mealCategoryMeta[mealType];
          const categoryMeals = meals.filter((meal) => meal.meal_type === mealType);
          const categoryCalories = categoryMeals.reduce((sum, meal) => sum + meal.total_calories, 0);

          return (
            <button
              key={mealType}
              type="button"
              className="meal-category-card"
              onClick={() => resetComposer("manual", mealType)}
              style={{ backgroundImage: meta.image }}
            >
              <div className="training-hero-overlay" />
              <div className="meal-category-content">
                <div className="meal-category-time">{meta.time}</div>
                <h3>{meta.label}</h3>
                <div className="training-pill-row">
                  <span className="training-pill accent" style={{ color: meta.accent }}>
                    {categoryMeals.length} meals
                  </span>
                  <span className="training-pill">{Math.round(categoryCalories)} cal</span>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {composerMode ? (
        <section className="workspace-card meal-composer-card">
          <div className="settings-page-heading">
            <div>
              <span>
                {editingMealId
                  ? "Edit meal"
                  : composerMode === "manual"
                    ? "Manual draft"
                    : composerMode === "voice"
                      ? "Voice review"
                      : "Photo review"}
              </span>
              <h3>
                {composerMode === "manual"
                  ? editingMealId
                    ? "Update the saved meal"
                    : "Review before you log"
                  : composerMode === "voice"
                    ? "Record or describe the meal"
                    : "Upload a meal photo"}
              </h3>
            </div>
            <button className="workspace-text-button" type="button" onClick={() => resetComposer(null)}>
              Close
            </button>
          </div>

          {composerMode === "voice" ? (
            <div className="settings-form-grid">
              <label className="settings-field settings-field-wide">
                <span>Transcript hint (optional)</span>
                <textarea
                  id="transcript"
                  value={transcriptHint}
                  onChange={(event) => setTranscriptHint(event.target.value)}
                  placeholder="Example: I had overnight oats with banana and honey."
                />
              </label>
              <button
                className="workspace-primary-button"
                type="button"
                onClick={() => void parseVoiceMeal()}
                disabled={parsing || recording}
              >
                {recording ? "Recording..." : parsing ? "Parsing..." : "Record and parse"}
              </button>
            </div>
          ) : null}

          {composerMode === "photo" ? (
            <div className="settings-form-grid">
              <label className="settings-field settings-field-wide">
                <span>Meal photo</span>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button className="workspace-primary-button" type="button" onClick={() => void parsePhotoMeal()} disabled={parsing}>
                {parsing ? "Analyzing..." : "Analyze meal"}
              </button>
            </div>
          ) : null}

          {composerMode === "manual" ? (
            <div className="composer-grid">
              <div className="composer-column">
                <label className="settings-field">
                  <span>Meal name</span>
                  <input
                    id="meal-name"
                    value={draft.meal_name}
                    onChange={(event) => setDraft((previous) => ({ ...previous, meal_name: event.target.value }))}
                  />
                </label>

                <div className="settings-form-grid">
                  <label className="settings-field">
                    <span>Meal type</span>
                    <select
                      id="meal-type"
                      value={draft.meal_type}
                      onChange={(event) =>
                        setDraft((previous) => ({ ...previous, meal_type: event.target.value as MealType }))
                      }
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </label>

                  <label className="settings-field">
                    <span>Logged at</span>
                    <input
                      id="logged-at"
                      type="datetime-local"
                      value={draft.logged_at}
                      onChange={(event) => setDraft((previous) => ({ ...previous, logged_at: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="settings-field">
                  <span>Add ingredients</span>
                  <input
                    id="food-search"
                    value={foodQuery}
                    onChange={(event) => setFoodQuery(event.target.value)}
                    placeholder="Search oats, chicken, yogurt..."
                  />
                </label>

                <div className="settings-tab-stack">
                  {foodResults.map((food) => (
                    <div key={food.food_id} className="food-search-row">
                      <div>
                        <strong>{food.name}</strong>
                        <p>
                          {food.calories} cal · {food.protein_g}P · {food.carbs_g}C · {food.fat_g}F
                        </p>
                      </div>
                      <button className="workspace-secondary-button" type="button" onClick={() => addIngredientFromFood(food)}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="composer-column">
                <section className="workspace-stat-card">
                  <span>Draft totals</span>
                  <strong>{Math.round(draftTotals.calories)} cal</strong>
                  <div className="training-pill-row">
                    <span className="training-pill">{Math.round(draftTotals.protein)}P</span>
                    <span className="training-pill">{Math.round(draftTotals.carbs)}C</span>
                    <span className="training-pill">{Math.round(draftTotals.fat)}F</span>
                  </div>
                </section>

                <div className="settings-tab-stack">
                  {draft.ingredients.map((ingredient, index) => (
                    <div key={`${ingredient.name}-${index}`} className="ingredient-editor-card">
                      <div className="food-search-row">
                        <div>
                          <strong>{ingredient.name}</strong>
                          <p>
                            {Math.round(ingredient.calories)} cal · {Math.round(ingredient.protein_g)}P ·{" "}
                            {Math.round(ingredient.carbs_g)}C · {Math.round(ingredient.fat_g)}F
                          </p>
                        </div>
                        <button className="workspace-text-button" type="button" onClick={() => removeIngredient(index)}>
                          Remove
                        </button>
                      </div>
                      <label className="settings-field compact">
                        <span>Quantity (g)</span>
                        <input
                          id={`quantity-${index}`}
                          type="number"
                          value={ingredient.quantity_g}
                          onChange={(event) => updateIngredient(index, Number(event.target.value))}
                        />
                      </label>
                    </div>
                  ))}
                  {draft.ingredients.length === 0 ? (
                    <div className="workspace-empty">
                      Add ingredients or parse a voice/photo meal to build the draft.
                    </div>
                  ) : null}
                </div>

                <div className="settings-inline-actions">
                  <button
                    className="workspace-primary-button"
                    type="button"
                    onClick={() => void saveDraft()}
                    disabled={saving || draft.ingredients.length === 0}
                  >
                    {saving ? "Saving..." : editingMealId ? "Update meal" : "Save meal"}
                  </button>
                  <button className="workspace-secondary-button" type="button" onClick={() => resetComposer(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="workspace-card">
        <div className="workspace-section-heading">
          <div>
            <span>Today&apos;s meals</span>
            <h3>Saved nutrition logs</h3>
          </div>
        </div>

        {loading ? (
          <div className="workspace-empty">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="workspace-empty">No meals have been logged yet today.</div>
        ) : (
          <div className="saved-meal-grid">
            {meals.map((meal) => (
              <article key={meal.log_id} className="saved-meal-card">
                <div className="food-search-row">
                  <div>
                    <strong>{meal.meal_name}</strong>
                    <p>
                      {meal.meal_type} · {formatDateLabel(meal.logged_at)}
                    </p>
                  </div>
                  <span className="workspace-pill">{Math.round(meal.total_calories)} cal</span>
                </div>

                <div className="training-pill-row">
                  <span className="training-pill">{Math.round(meal.total_protein_g)}P</span>
                  <span className="training-pill">{Math.round(meal.total_carbs_g)}C</span>
                  <span className="training-pill">{Math.round(meal.total_fat_g)}F</span>
                </div>

                <div className="settings-inline-actions">
                  <button className="workspace-secondary-button" type="button" onClick={() => openEdit(meal)}>
                    Edit
                  </button>
                  <button className="workspace-text-button" type="button" onClick={() => void deleteMeal(meal.log_id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

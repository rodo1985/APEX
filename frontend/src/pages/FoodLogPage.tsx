import { useEffect, useMemo, useState } from "react";

import { Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import { formatDateLabel, toDateInputValue } from "../lib/format";
import { recordAudioOnce } from "../lib/voice";
import type { FoodSearchResult, Ingredient, MealLog, MealType } from "../lib/types";

const DEFAULT_DRAFT = {
  meal_type: "lunch" as MealType,
  meal_name: "",
  logged_at: new Date().toISOString().slice(0, 16),
  ingredients: [] as Ingredient[],
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

  function resetComposer(nextMode: ComposerMode = null) {
    setComposerMode(nextMode);
    setEditingMealId(null);
    setDraft(DEFAULT_DRAFT);
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
    <div className="page-grid">
      <div className="section-copy">
        <p className="eyebrow">Food log</p>
        <h2>Review-first logging for real-world meals.</h2>
        <p>
          Manual search, voice, and photo flows all land in the same editable draft so nothing is persisted
          until you confirm the ingredients and portions.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="inline-actions">
        <button className="button-primary" type="button" onClick={() => setComposerMode("manual")}>
          <Icon name="plus" />
          Manual meal
        </button>
        <button className="button-secondary" type="button" onClick={() => setComposerMode("voice")}>
          <Icon name="mic" />
          Voice meal
        </button>
        <button className="button-secondary" type="button" onClick={() => setComposerMode("photo")}>
          <Icon name="camera" />
          Photo meal
        </button>
      </div>

      {composerMode ? (
        <section className="meal-card">
          <div className="meal-card-header">
            <div>
              <p className="eyebrow">{editingMealId ? "Edit meal" : composerMode === "manual" ? "Manual draft" : composerMode === "voice" ? "Voice review" : "Photo review"}</p>
              <h3 style={{ margin: 0 }}>
                {composerMode === "manual"
                  ? editingMealId
                    ? "Update the saved meal"
                    : "Build and review the meal"
                  : composerMode === "voice"
                    ? "Record or describe the meal"
                    : "Upload a meal photo"}
              </h3>
            </div>
            <button className="button-ghost" type="button" onClick={() => resetComposer(null)}>
              Close
            </button>
          </div>

          {composerMode === "voice" ? (
            <div className="page-grid" style={{ marginTop: "1rem" }}>
              <div className="form-field">
                <label htmlFor="transcript">Transcript hint (optional)</label>
                <textarea
                  id="transcript"
                  value={transcriptHint}
                  onChange={(event) => setTranscriptHint(event.target.value)}
                  placeholder="Example: I had overnight oats with banana and honey."
                />
              </div>
              <button className="button-primary" type="button" onClick={() => void parseVoiceMeal()} disabled={parsing || recording}>
                <Icon name="mic" />
                {recording ? "Recording..." : parsing ? "Parsing..." : "Record and parse"}
              </button>
            </div>
          ) : null}

          {composerMode === "photo" ? (
            <div className="page-grid" style={{ marginTop: "1rem" }}>
              <div className="form-field">
                <label htmlFor="photo-upload">Meal photo</label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                />
              </div>
              <button className="button-primary" type="button" onClick={() => void parsePhotoMeal()} disabled={parsing}>
                <Icon name="camera" />
                {parsing ? "Analyzing..." : "Analyze meal"}
              </button>
            </div>
          ) : null}

          {composerMode === "manual" ? (
            <div className="page-grid grid-two" style={{ marginTop: "1rem" }}>
              <div className="page-grid">
                <div className="form-field">
                  <label htmlFor="meal-name">Meal name</label>
                  <input
                    id="meal-name"
                    value={draft.meal_name}
                    onChange={(event) => setDraft((previous) => ({ ...previous, meal_name: event.target.value }))}
                  />
                </div>
                <div className="split-inline">
                  <div className="form-field">
                    <label htmlFor="meal-type">Meal type</label>
                    <select
                      id="meal-type"
                      value={draft.meal_type}
                      onChange={(event) => setDraft((previous) => ({ ...previous, meal_type: event.target.value as MealType }))}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="logged-at">Logged at</label>
                    <input
                      id="logged-at"
                      type="datetime-local"
                      value={draft.logged_at}
                      onChange={(event) => setDraft((previous) => ({ ...previous, logged_at: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="food-search">Add ingredients</label>
                  <input
                    id="food-search"
                    value={foodQuery}
                    onChange={(event) => setFoodQuery(event.target.value)}
                    placeholder="Search oats, chicken, yogurt..."
                  />
                </div>

                <div className="settings-list">
                  {foodResults.map((food) => (
                    <div key={food.food_id} className="settings-item">
                      <div className="list-header">
                        <div>
                          <strong>{food.name}</strong>
                          <p className="muted-copy" style={{ marginBottom: 0 }}>
                            {food.calories} cal · {food.protein_g}P · {food.carbs_g}C · {food.fat_g}F
                          </p>
                        </div>
                        <button className="button-secondary" type="button" onClick={() => addIngredientFromFood(food)}>
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="page-grid">
                <div className="settings-item">
                  <div className="meal-card-header">
                    <div>
                      <p className="eyebrow">Draft totals</p>
                      <h3 style={{ margin: 0 }}>{Math.round(draftTotals.calories)} cal</h3>
                    </div>
                    <div className="inline-actions">
                      <span className="button-ghost">{Math.round(draftTotals.protein)}P</span>
                      <span className="button-ghost">{Math.round(draftTotals.carbs)}C</span>
                      <span className="button-ghost">{Math.round(draftTotals.fat)}F</span>
                    </div>
                  </div>
                </div>

                <div className="settings-list">
                  {draft.ingredients.map((ingredient, index) => (
                    <div key={`${ingredient.name}-${index}`} className="settings-item">
                      <div className="list-header">
                        <div>
                          <strong>{ingredient.name}</strong>
                          <p className="muted-copy" style={{ marginBottom: 0 }}>
                            {Math.round(ingredient.calories)} cal · {Math.round(ingredient.protein_g)}P · {Math.round(ingredient.carbs_g)}C · {Math.round(ingredient.fat_g)}F
                          </p>
                        </div>
                        <button className="button-ghost" type="button" onClick={() => removeIngredient(index)}>
                          Remove
                        </button>
                      </div>
                      <div className="form-field" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                        <label htmlFor={`quantity-${index}`}>Quantity (g)</label>
                        <input
                          id={`quantity-${index}`}
                          type="number"
                          value={ingredient.quantity_g}
                          onChange={(event) => updateIngredient(index, Number(event.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                  {draft.ingredients.length === 0 ? <div className="notice-banner">Add ingredients or parse a voice/photo meal to build the draft.</div> : null}
                </div>

                <div className="inline-actions">
                  <button className="button-primary" type="button" onClick={() => void saveDraft()} disabled={saving || draft.ingredients.length === 0}>
                    {saving ? "Saving..." : editingMealId ? "Update meal" : "Save meal"}
                  </button>
                  <button className="button-secondary" type="button" onClick={() => resetComposer(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="section-copy">
          <p className="eyebrow">Today&apos;s meals</p>
          <h3 style={{ margin: 0 }}>Saved nutrition logs</h3>
        </div>
        {loading ? (
          <div className="notice-banner">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="notice-banner">No meals have been logged yet today.</div>
        ) : (
          <div className="meal-summary-list">
            {meals.map((meal) => (
              <article key={meal.log_id} className="meal-summary-item">
                <div className="meal-card-header">
                  <div>
                    <strong>{meal.meal_name}</strong>
                    <p className="muted-copy" style={{ marginBottom: 0 }}>
                      {meal.meal_type} · {formatDateLabel(meal.logged_at)}
                    </p>
                  </div>
                  <span className="status-pill">{Math.round(meal.total_calories)} cal</span>
                </div>
                <div className="inline-actions" style={{ marginTop: "0.75rem" }}>
                  <span className="button-ghost">{Math.round(meal.total_protein_g)}P</span>
                  <span className="button-ghost">{Math.round(meal.total_carbs_g)}C</span>
                  <span className="button-ghost">{Math.round(meal.total_fat_g)}F</span>
                  <button className="button-secondary" type="button" onClick={() => openEdit(meal)}>
                    Edit
                  </button>
                  <button className="button-ghost" type="button" onClick={() => void deleteMeal(meal.log_id)}>
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

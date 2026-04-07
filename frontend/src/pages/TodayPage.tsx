import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { ApexIcon, ApexWordmark, Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import {
  formatDateLabel,
  formatDistanceKm,
  formatDuration,
  formatLongDate,
  formatRelativeDayLabel,
  shiftIsoDate,
  toIsoDate,
} from "../lib/format";
import {
  getPrototypeDashboardDay,
  getPrototypeWeekRollup,
  type PrototypeActivity,
  type PrototypeDashboardDay,
  type PrototypeWeekDayRollup,
} from "../lib/prototypeNutrition";
import { isPrototypeSupabaseConfigured } from "../lib/prototypeSupabaseRest";
import type {
  NutritionTodayResponse,
  NutritionWeeklyResponse,
  TrainingLoadPoint,
  TrainingTodayResponse,
} from "../lib/types";

type TrendMetric = "calories" | "exercise" | "load";

type DashboardViewModel = {
  activities: PrototypeActivity[];
  confirmed: boolean;
  date: string;
  dayType: string;
  hasLog: boolean;
  label: string;
  meals: Array<{
    icon: string;
    id: string;
    items: Array<{
      amount: number;
      carbs: number;
      fat: number;
      id: string;
      kcal: number;
      name: string;
      protein: number;
      source: string | null;
      unit: string;
    }>;
    name: string;
    sortOrder: number;
    totals: {
      carbs: number;
      fat: number;
      kcal: number;
      protein: number;
    };
  }>;
  profile: {
    currentKg: number | null;
    targetKg: number | null;
    weeklyLossKg: number | null;
  };
  totals: {
    carbs: number;
    exercise: number;
    fat: number;
    kcal: number;
    net: number;
    protein: number;
    remaining: number;
  };
  targets: {
    carbs: number;
    fat: number;
    kcal: number;
    protein: number;
  };
};

type TrendPoint = {
  date: string;
  dayType: string;
  exercise: number;
  kcal: number;
  label: string;
  load: number;
  targetKcal: number;
};

export function TodayPage() {
  const { api } = useSession();
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [nutrition, setNutrition] = useState<NutritionTodayResponse | null>(null);
  const [weeklyNutrition, setWeeklyNutrition] = useState<NutritionWeeklyResponse | null>(null);
  const [training, setTraining] = useState<TrainingTodayResponse | null>(null);
  const [trainingLoadSeries, setTrainingLoadSeries] = useState<TrainingLoadPoint[]>([]);
  const [prototypeDay, setPrototypeDay] = useState<PrototypeDashboardDay | null>(null);
  const [prototypeWeek, setPrototypeWeek] = useState<PrototypeWeekDayRollup[]>([]);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("calories");
  const [selectedTrendDate, setSelectedTrendDate] = useState<string | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prototypeLoading, setPrototypeLoading] = useState(false);

  const todayDate = toIsoDate(new Date());
  const prototypeEnabled = isPrototypeSupabaseConfigured();
  const canGoNext = prototypeEnabled && selectedDate < todayDate;

  useEffect(() => {
    async function loadApi() {
      try {
        const [todayNutrition, weeklyNutritionResponse, trainingToday, trainingLoadResponse] = await Promise.all([
          api.getNutritionToday(),
          api.getNutritionWeekly(),
          api.getTrainingToday(),
          api.getTrainingLoad(120),
        ]);
        setNutrition(todayNutrition);
        setWeeklyNutrition(weeklyNutritionResponse);
        setTraining(trainingToday);
        setTrainingLoadSeries(trainingLoadResponse.series);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the dashboard.");
      }
    }

    void loadApi();
  }, [api]);

  useEffect(() => {
    if (!prototypeEnabled) {
      setPrototypeDay(null);
      setPrototypeWeek([]);
      return;
    }

    setPrototypeLoading(true);
    setError(null);

    void Promise.all([getPrototypeDashboardDay(selectedDate), getPrototypeWeekRollup(selectedDate)])
      .then(([day, week]) => {
        setPrototypeDay(day);
        setPrototypeWeek(week.days);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the Supabase prototype.");
      })
      .finally(() => {
        setPrototypeLoading(false);
      });
  }, [prototypeEnabled, selectedDate]);

  const fallbackDashboard = useMemo(() => {
    if (!nutrition?.summary || !weeklyNutrition || !training) {
      return null;
    }

    const dailyCalories = Math.round(nutrition.summary.calories_consumed);
    const exercise = training.completed_activities.reduce((sum, activity) => sum + activity.calories, 0);
    return {
      date: todayDate,
      label: "Today",
      dayType: nutrition.summary.target_day_type,
      confirmed: false,
      targets: {
        kcal: nutrition.summary.calories_target,
        protein: 140,
        carbs: 260,
        fat: 65,
      },
      totals: {
        kcal: dailyCalories,
        protein: nutrition.summary.protein_g,
        carbs: nutrition.summary.carbs_g,
        fat: nutrition.summary.fat_g,
        exercise,
        net: dailyCalories - exercise,
        remaining: nutrition.summary.calories_target - dailyCalories,
      },
      meals: nutrition.meals.map((meal) => ({
        id: meal.log_id,
        name: meal.meal_name,
        icon: meal.meal_type === "breakfast" ? "☀️" : meal.meal_type === "lunch" ? "🍽️" : meal.meal_type === "dinner" ? "🌙" : "⚡",
        sortOrder: 0,
        items: meal.ingredients.map((ingredient, index) => ({
          id: ingredient.ingredient_id ?? `${meal.log_id}-${index}`,
          name: ingredient.name,
          amount: ingredient.quantity_g,
          unit: "g",
          kcal: ingredient.calories,
          protein: ingredient.protein_g,
          carbs: ingredient.carbs_g,
          fat: ingredient.fat_g,
          source: "estimated" as const,
        })),
        totals: {
          kcal: meal.total_calories,
          protein: meal.total_protein_g,
          carbs: meal.total_carbs_g,
          fat: meal.total_fat_g,
        },
      })),
      activities: [],
      profile: {
        currentKg: 68.5,
        targetKg: 64,
        weeklyLossKg: 0.5,
      },
    };
  }, [nutrition, todayDate, training, weeklyNutrition]);

  const prototypeDashboard = useMemo<DashboardViewModel | null>(() => {
    if (!prototypeDay) {
      return null;
    }

    return {
      activities: prototypeDay.activities,
      confirmed: prototypeDay.summary.confirmed,
      date: prototypeDay.date,
      dayType: prototypeDay.summary.dayType,
      hasLog: prototypeDay.hasLog,
      label: formatRelativeDayLabel(prototypeDay.date),
      meals: prototypeDay.meals.map((meal) => ({
        icon: meal.icon,
        id: meal.id,
        items: meal.items.map((item) => ({
          amount: item.amount,
          carbs: item.carbs,
          fat: item.fat,
          id: item.id,
          kcal: item.kcal,
          name: item.name,
          protein: item.protein,
          source: item.source,
          unit: item.unit,
        })),
        name: meal.name,
        sortOrder: meal.sortOrder,
        totals: meal.totals,
      })),
      profile: {
        currentKg: prototypeDay.profile?.weightKg ?? null,
        targetKg: prototypeDay.profile?.targetWeightKg ?? null,
        weeklyLossKg: prototypeDay.profile?.weeklyLossKg ?? null,
      },
      totals: {
        carbs: prototypeDay.summary.actual.carbs,
        exercise: prototypeDay.summary.exerciseCalories,
        fat: prototypeDay.summary.actual.fat,
        kcal: prototypeDay.summary.actual.kcal,
        net: prototypeDay.summary.netCalories,
        protein: prototypeDay.summary.actual.protein,
        remaining: prototypeDay.summary.remainingCalories,
      },
      targets: prototypeDay.summary.targets,
    };
  }, [prototypeDay]);

  const activeDashboard = prototypeDashboard ?? (selectedDate === todayDate ? fallbackDashboard : null);

  const activeWeek = useMemo<TrendPoint[]>(() => {
    const loadByDate = new Map(trainingLoadSeries.map((point) => [point.date, point.daily_tss]));

    if (prototypeWeek.length > 0) {
      return prototypeWeek.map((day) => ({
        date: day.date,
        dayType: day.dayType,
        exercise: day.exerciseCalories,
        kcal: day.actual.kcal,
        label: formatDateLabel(day.date),
        load: loadByDate.get(day.date) ?? 0,
        targetKcal: day.targets.kcal,
      }));
    }

    if (!weeklyNutrition) {
      return [];
    }

    return weeklyNutrition.days.map((day) => ({
      date: day.date,
      label: formatDateLabel(day.date),
      dayType: "rest",
      kcal: day.calories,
      load: loadByDate.get(day.date) ?? 0,
      targetKcal: nutrition?.summary.calories_target ?? 0,
      exercise: 0,
    }));
  }, [nutrition?.summary?.calories_target, prototypeWeek, trainingLoadSeries, weeklyNutrition]);

  useEffect(() => {
    if (activeWeek.length === 0) {
      setSelectedTrendDate(null);
      return;
    }

    const stillVisible = selectedTrendDate && activeWeek.some((point) => point.date === selectedTrendDate);
    if (!stillVisible) {
      setSelectedTrendDate(activeWeek[activeWeek.length - 1]?.date ?? null);
    }
  }, [activeWeek, selectedTrendDate]);

  useEffect(() => {
    setExpandedMealId(null);
  }, [selectedDate]);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if ((selectedDate === todayDate && !activeDashboard) || (prototypeLoading && !activeDashboard)) {
    return (
      <div className="dashboard-loader-shell">
        <DashboardLoadingState label="Loading dashboard data" fullscreen />
      </div>
    );
  }

  if (!activeDashboard) {
    return (
      <div className="workspace-section">
        <div className="workspace-page-header compact">
          <div>
            <span>{formatRelativeDayLabel(selectedDate)}</span>
            <h2>Dashboard</h2>
            <p>Historical dashboard data is available when the Supabase prototype is connected.</p>
          </div>
          <DateNavigator
            date={selectedDate}
            canGoNext={canGoNext}
            onPrevious={() => setSelectedDate((current) => shiftIsoDate(current, -1))}
            onNext={() => setSelectedDate((current) => shiftIsoDate(current, 1))}
          />
        </div>
        <div className="workspace-empty">No dashboard data is available for this day yet.</div>
      </div>
    );
  }

  const selectedActivity = activeDashboard.activities[0] ?? null;
  const completed = training?.completed_activities[0];
  const planned = training?.planned_activities[0] as
    | { title?: string; description?: string; expected_tss?: number }
    | undefined;
  const weeklyPeak = Math.max(...activeWeek.map((entry) => getTrendMetricValue(entry, trendMetric) || 1), 1);
  const recoveryScore = clamp(78 + (training?.metrics.tsb ?? 0), 28, 96);
  const hydrationLitres = Math.max(activeDashboard.totals.kcal / 1000, 1.5).toFixed(1);
  const dayTypeLabel = activeDashboard.dayType === "rest" ? "😴 Rest day" : `🔋 ${activeDashboard.dayType} day`;
  const effectiveTargets = deriveExpectedTargets(activeDashboard.targets, activeDashboard.totals.exercise);
  const expectedCalories = effectiveTargets.kcal;
  const expectedRemaining = Math.round(expectedCalories - activeDashboard.totals.kcal);
  const remainingLabel = expectedRemaining < 0 ? "Surplus" : "Remaining";
  const macroComposition = calculateMacroCompositionPercentages(effectiveTargets);
  const primaryHero = resolveHeroContent(selectedActivity, completed, planned, activeDashboard.dayType);
  const selectedTrendPoint =
    activeWeek.find((point) => point.date === selectedTrendDate) ?? activeWeek[activeWeek.length - 1] ?? null;

  return (
    <div className="workspace-section">
      {prototypeLoading ? <DashboardLoadingState label={`Loading ${formatRelativeDayLabel(selectedDate)}`} /> : null}

      <div className="workspace-page-header compact">
        <div>
          <span>{formatRelativeDayLabel(selectedDate)}</span>
          <h2>Dashboard</h2>
          <p>The main dashboard for fuelling, activity, and coaching context.</p>
        </div>
        <DateNavigator
          date={selectedDate}
          canGoNext={canGoNext}
          onPrevious={() => setSelectedDate((current) => shiftIsoDate(current, -1))}
          onNext={() => setSelectedDate((current) => shiftIsoDate(current, 1))}
        />
      </div>

      <section className="today-chip-grid">
        <article className="metric-chip metric-chip-accent">
          <Icon name="target" size={18} />
          <strong>{dayTypeLabel}</strong>
          <span>Day type</span>
        </article>
        <article className="metric-chip">
          <Icon name="heart" size={18} />
          <strong>{recoveryScore}%</strong>
          <span>Recovery</span>
        </article>
        <article className="metric-chip">
          <Icon name="drop" size={18} />
          <strong>{hydrationLitres} L</strong>
          <span>Hydration guide</span>
        </article>
      </section>

      <div className="today-grid">
        <div className="today-column">
          <section className="today-calories-card">
            <div className="today-card-copy">
              <span>{activeDashboard.label}</span>
              <h2>
                {Math.round(activeDashboard.totals.kcal)}
                <small>cal</small>
              </h2>
            </div>

            <div className="dashboard-ring-grid">
              <MetricRing
                label="Calories"
                unit="kcal"
                value={activeDashboard.totals.kcal}
                target={effectiveTargets.kcal}
                color="var(--workspace-teal)"
                tone="kcal"
              />
              <MetricRing
                label="Protein"
                unit="g"
                value={activeDashboard.totals.protein}
                target={effectiveTargets.protein}
                color="var(--workspace-blue)"
                tone="protein"
              />
              <MetricRing
                label="Carbs"
                unit="g"
                value={activeDashboard.totals.carbs}
                target={effectiveTargets.carbs}
                color="var(--workspace-lime)"
                tone="carbs"
              />
              <MetricRing
                label="Fat"
                unit="g"
                value={activeDashboard.totals.fat}
                target={effectiveTargets.fat}
                color="var(--workspace-orange)"
                tone="fat"
              />
            </div>

            <div className="today-calorie-mini-grid dashboard-summary-grid">
              <div>
                <strong>{activeDashboard.targets.kcal}</strong>
                <span>Target</span>
              </div>
              <div>
                <strong>{Math.round(activeDashboard.totals.exercise)}</strong>
                <span>Exercise</span>
              </div>
              <div className="accent">
                <strong>{expectedCalories}</strong>
                <span>Expected</span>
              </div>
              <div className={expectedRemaining >= 0 ? "accent" : ""}>
                <strong>{Math.abs(expectedRemaining)}</strong>
                <span>{remainingLabel}</span>
              </div>
            </div>

            <div className="dashboard-composition-card">
              <div className="workspace-section-heading">
                <div>
                  <span>Macro composition</span>
                  <h3>Expected split</h3>
                </div>
                <div className="workspace-pill">{activeDashboard.confirmed ? "Confirmed" : "Draft"}</div>
              </div>

              <MacroCompositionDonut composition={macroComposition} />

              <div className="dashboard-composition-legend">
                <span>P {macroComposition.proteinPct}%</span>
                <span>C {macroComposition.carbsPct}%</span>
                <span>F {macroComposition.fatPct}%</span>
              </div>
            </div>
          </section>

          <section className="workspace-insight-card">
            <div className="workspace-insight-icon">
              <Icon name="bolt" size={18} />
            </div>
            <div>
              <div className="workspace-insight-label">Coach insight</div>
              <p>
                {activeDashboard.totals.remaining < 0
                  ? "You are already over the calorie target for this day. Keep the remaining intake protein-forward and light."
                  : activeDashboard.confirmed
                    ? "This day is already confirmed, so use the log to review meal timing and how it matched the training load."
                    : "Use the remaining calories and macro targets to finish the day with cleaner fuelling decisions."}
              </p>
            </div>
          </section>
        </div>

        <div className="today-column">
          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Weekly trend</span>
                <h3>Seven-day trend</h3>
              </div>
              <div className="dashboard-trend-switcher" role="tablist" aria-label="Trend metric">
                {[
                  { id: "calories", label: "Calories" },
                  { id: "exercise", label: "Exercise" },
                  { id: "load", label: "Load" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`dashboard-trend-switch${trendMetric === option.id ? " active" : ""}`}
                    onClick={() => setTrendMetric(option.id as TrendMetric)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="today-chart">
              {activeWeek.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className={`today-chart-column${selectedTrendPoint?.date === day.date ? " active" : ""}`}
                  onClick={() => setSelectedTrendDate(day.date)}
                >
                  <div
                    className="today-chart-bar"
                    style={{ height: `${Math.max((getTrendMetricValue(day, trendMetric) / weeklyPeak) * 100, 12)}%` }}
                  />
                  <span>{day.date === todayDate ? "Today" : formatDateLabel(day.date)}</span>
                </button>
              ))}
            </div>

            {selectedTrendPoint ? (
              <div className="dashboard-trend-detail">
                <div>
                  <span>{formatRelativeDayLabel(selectedTrendPoint.date)}</span>
                  <strong>{getTrendMetricLabel(trendMetric)}</strong>
                </div>
                <div className="dashboard-trend-detail-grid">
                  <div>
                    <strong>{Math.round(getTrendMetricValue(selectedTrendPoint, trendMetric))}</strong>
                    <span>{getTrendMetricUnit(trendMetric)}</span>
                  </div>
                  <div>
                    <strong>{Math.round(selectedTrendPoint.targetKcal)}</strong>
                    <span>Target kcal</span>
                  </div>
                  <div>
                    <strong>{Math.round(selectedTrendPoint.exercise)}</strong>
                    <span>Exercise kcal</span>
                  </div>
                  <div>
                    <strong>{Math.round(selectedTrendPoint.load)}</strong>
                    <span>Load</span>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Daily log</span>
                <h3>Meal slot status</h3>
              </div>
              <div className="workspace-pill">{activeDashboard.confirmed ? "Confirmed" : "Open log"}</div>
            </div>

            <div className="dashboard-meal-stack">
              {activeDashboard.meals.map((meal) => (
                <div key={meal.id} className={`dashboard-meal-card${meal.items.length === 0 ? " empty" : ""}`}>
                  <button
                    type="button"
                    className={`dashboard-meal-row${expandedMealId === meal.id ? " open" : ""}${meal.items.length === 0 ? " empty" : ""}`}
                    onClick={() => {
                      if (meal.items.length === 0) {
                        return;
                      }

                      setExpandedMealId((current) => (current === meal.id ? null : meal.id));
                    }}
                    disabled={meal.items.length === 0}
                  >
                    <div>
                      <strong>
                        {meal.icon} {meal.name}
                      </strong>
                      <span>{meal.items.length === 0 ? "not logged yet" : `${meal.items.length} items`}</span>
                    </div>
                    <div className="dashboard-meal-totals">
                      <strong>{Math.round(meal.totals.kcal)}</strong>
                      <span>kcal</span>
                    </div>
                  </button>

                  {expandedMealId === meal.id && meal.items.length > 0 ? (
                    <div className="dashboard-meal-detail">
                      {meal.items.map((item, index) => (
                        <div key={item.id} className={`dashboard-food-row${index % 2 === 1 ? " alt" : ""}`}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {Math.round(item.amount)}
                              {item.unit} · {item.source ?? "logged"}
                            </span>
                          </div>
                          <div className="dashboard-food-metrics">
                            <span className="metric-kcal">{Math.round(item.kcal)} kcal</span>
                            <span className="metric-protein">{Math.round(item.protein)}P</span>
                            <span className="metric-carbs">{Math.round(item.carbs)}C</span>
                            <span className="metric-fat">{Math.round(item.fat)}F</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>{selectedActivity ? "Activity" : "Last activity"}</span>
                <h3>{primaryHero.title}</h3>
              </div>
              <div className="workspace-linkish">Latest context</div>
            </div>

            <div
              className="training-hero"
              style={{
                backgroundImage: activityHeroBackground(primaryHero.sport),
              }}
            >
              <div className="training-hero-overlay" />
              <div className="training-hero-content">
                <div className="training-hero-source">
                  <Icon name={primaryHero.sport === "running" ? "run" : "bike"} size={11} />
                  {selectedActivity ? "LOG" : "STRAVA"}
                </div>
                <h4>{primaryHero.title}</h4>
                <div className="training-pill-row">
                  {primaryHero.pills.map((pill) => (
                    <span
                      key={pill.label}
                      className={`training-pill${pill.accent ? " accent" : ""}`}
                    >
                      {pill.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="workspace-support-copy">{primaryHero.detail}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the branded loading state used while the dashboard switches days.
 *
 * Parameters:
 * - label: The status text shown below the APEX logo.
 * - fullscreen: Whether the loader should take over the full dashboard area.
 *
 * Returns:
 * - A branded loading panel inspired by the v9 splash treatment.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```tsx
 * <DashboardLoadingState label="Loading dashboard data" fullscreen />
 * ```
 */
function DashboardLoadingState({
  label,
  fullscreen = false,
}: {
  label: string;
  fullscreen?: boolean;
}) {
  const loader = (
    <div
      aria-live="polite"
      className={`dashboard-loader${fullscreen ? " fullscreen" : " overlay"} viewport`}
    >
      <div className="dashboard-loader-glow" />
      <div className="dashboard-loader-content">
        <div className="dashboard-loader-brand">
          <div className="dashboard-loader-heartbeat">
            <ApexIcon size={fullscreen ? 92 : 74} />
          </div>
          <ApexWordmark size={fullscreen ? 34 : 28} />
        </div>
        <div className="dashboard-loader-copy">
          <strong>{label}</strong>
          <span>Syncing nutrition, activity, and target context.</span>
        </div>
        <div className="dashboard-loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return loader;
  }

  return createPortal(loader, document.body);
}

function MetricRing({
  label,
  unit,
  value,
  target,
  color,
  tone,
}: {
  label: string;
  unit: string;
  value: number;
  target: number;
  color: string;
  tone: "kcal" | "protein" | "carbs" | "fat";
}) {
  const size = 86;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;
  const overTarget = target > 0 && value > target;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="dashboard-ring-card">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dashboard-ring-svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={overTarget ? "var(--workspace-orange)" : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className={`dashboard-ring-copy ${tone}`}>
        <strong>{Math.round(value)}</strong>
        <span>{unit}</span>
      </div>
      <div className="dashboard-ring-label">{label}</div>
      <div className="dashboard-ring-target">/ {Math.round(target)}{unit === "kcal" ? "" : "g"}</div>
    </div>
  );
}

function DateNavigator({
  date,
  canGoNext,
  onPrevious,
  onNext,
}: {
  date: string;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="workspace-date-nav" aria-label="Dashboard date navigation">
      <button className="workspace-icon-button" type="button" onClick={onPrevious} aria-label="Previous day">
        <span className="workspace-arrow-previous">
          <Icon name="arrow" size={16} />
        </span>
      </button>
      <div className="workspace-date-pill">{formatRelativeDayLabel(date)}</div>
      <button className="workspace-icon-button" type="button" onClick={onNext} aria-label="Next day" disabled={!canGoNext}>
        <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}

function getTrendMetricValue(point: TrendPoint, metric: TrendMetric) {
  if (metric === "exercise") {
    return point.exercise;
  }

  if (metric === "load") {
    return point.load;
  }

  return point.kcal;
}

function getTrendMetricLabel(metric: TrendMetric) {
  if (metric === "exercise") {
    return "Exercise calories";
  }

  if (metric === "load") {
    return "Training load";
  }

  return "Calories consumed";
}

function getTrendMetricUnit(metric: TrendMetric) {
  if (metric === "load") {
    return "TSS";
  }

  return "kcal";
}

/**
 * Renders a donut chart for the protein/carbs/fat composition split.
 *
 * Parameters:
 * - composition: The percentage split to visualize.
 *
 * Returns:
 * - A circular SVG chart with a centered label and colored segments.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```tsx
 * <MacroCompositionDonut composition={{ proteinPct: 27, carbsPct: 47, fatPct: 26 }} />
 * ```
 */
function MacroCompositionDonut({
  composition,
}: {
  composition: {
    carbsPct: number;
    fatPct: number;
    proteinPct: number;
  };
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { color: "var(--workspace-blue)", label: "Protein", value: composition.proteinPct },
    { color: "var(--workspace-lime)", label: "Carbs", value: composition.carbsPct },
    { color: "var(--workspace-orange)", label: "Fat", value: composition.fatPct },
  ];
  let offset = 0;

  return (
    <div className="dashboard-composition-donut" aria-label="Macro composition chart">
      <svg viewBox="0 0 120 120" role="img" aria-label="Macro composition donut">
        <circle className="dashboard-composition-track" cx="60" cy="60" r={radius} />
        {segments.map((segment) => {
          const dash = (segment.value / 100) * circumference;
          const strokeDasharray = `${dash} ${Math.max(circumference - dash, 0)}`;
          const strokeDashoffset = -offset;
          offset += dash;

          return (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="10"
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="dashboard-composition-center">
        <strong>{composition.carbsPct}%</strong>
        <span>carbs</span>
      </div>
    </div>
  );
}

/**
 * Converts macro gram targets into protein/carbs/fat calorie-share percentages.
 *
 * Parameters:
 * - targets: The expected macro targets for the selected day.
 *
 * Returns:
 * - Percentage values that sum to `100` whenever target calories are available.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const composition = calculateMacroCompositionPercentages({ kcal: 2780, protein: 189, carbs: 324, fat: 81 });
 * ```
 */
function calculateMacroCompositionPercentages(targets: {
  carbs: number;
  fat: number;
  kcal: number;
  protein: number;
}) {
  const calorieShares = [
    { key: "proteinPct" as const, value: Math.max(targets.protein, 0) * 4 },
    { key: "carbsPct" as const, value: Math.max(targets.carbs, 0) * 4 },
    { key: "fatPct" as const, value: Math.max(targets.fat, 0) * 9 },
  ];
  const totalMacroCalories = calorieShares.reduce((sum, entry) => sum + entry.value, 0);

  if (totalMacroCalories <= 0) {
    return {
      carbsPct: 0,
      fatPct: 0,
      proteinPct: 0,
    };
  }

  const percentages = calorieShares.map((entry) => ({
    key: entry.key,
    raw: (entry.value * 100) / totalMacroCalories,
    rounded: Math.floor((entry.value * 100) / totalMacroCalories),
  }));
  const roundedTotal = percentages.reduce((sum, entry) => sum + entry.rounded, 0);
  const remainder = 100 - roundedTotal;

  // Distribute the leftover points to the largest fractional parts so the UI
  // always lands on a stable 100% total after rounding.
  percentages
    .sort((left, right) => (right.raw - right.rounded) - (left.raw - left.rounded))
    .forEach((entry, index) => {
      if (index < remainder) {
        entry.rounded += 1;
      }
    });

  return {
    proteinPct: percentages.find((entry) => entry.key === "proteinPct")?.rounded ?? 0,
    carbsPct: percentages.find((entry) => entry.key === "carbsPct")?.rounded ?? 0,
    fatPct: percentages.find((entry) => entry.key === "fatPct")?.rounded ?? 0,
  };
}

/**
 * Derives the displayed calorie and macro targets for the selected day.
 *
 * Parameters:
 * - baseTargets: The stored baseline targets for calories and macros.
 * - exerciseCalories: The exercise calories completed on the selected day.
 *
 * Returns:
 * - A new target object whose calories are `base + exercise`, with macros
 *   rebalanced to preserve the original macro calorie ratios.
 *
 * Raised errors:
 * - None.
 *
 * Example:
 * ```ts
 * const expected = deriveExpectedTargets({ kcal: 2100, protein: 140, carbs: 240, fat: 60 }, 500);
 * ```
 */
function deriveExpectedTargets(
  baseTargets: {
    carbs: number;
    fat: number;
    kcal: number;
    protein: number;
  },
  exerciseCalories: number,
) {
  const expectedCalories = Math.max(Math.round(baseTargets.kcal + exerciseCalories), Math.round(baseTargets.kcal));
  const macroCalories =
    Math.max(baseTargets.protein, 0) * 4 +
    Math.max(baseTargets.carbs, 0) * 4 +
    Math.max(baseTargets.fat, 0) * 9;

  if (macroCalories <= 0) {
    return {
      ...baseTargets,
      kcal: expectedCalories,
    };
  }

  const proteinRatio = (Math.max(baseTargets.protein, 0) * 4) / macroCalories;
  const carbsRatio = (Math.max(baseTargets.carbs, 0) * 4) / macroCalories;
  const fatRatio = (Math.max(baseTargets.fat, 0) * 9) / macroCalories;

  return {
    kcal: expectedCalories,
    protein: Math.round((expectedCalories * proteinRatio) / 4),
    carbs: Math.round((expectedCalories * carbsRatio) / 4),
    fat: Math.round((expectedCalories * fatRatio) / 9),
  };
}

function resolveHeroContent(
  activity: PrototypeActivity | null,
  completed: TrainingTodayResponse["completed_activities"][number] | undefined,
  planned: { title?: string; description?: string; expected_tss?: number } | undefined,
  dayType: string,
) {
  if (activity) {
    const pills = [];

    if (activity.distance) {
      pills.push({ label: `${activity.distance.toFixed(1)} ${activity.distanceUnit}`, accent: true });
    }

    if (activity.movingTime) {
      pills.push({ label: activity.movingTime, accent: false });
    }

    pills.push({ label: `-${activity.calories} kcal`, accent: false });

    return {
      title: activity.title,
      sport: activity.sport === "running" ? "running" : "cycling",
      pills,
      detail: activity.avgHr ? `Average HR ${activity.avgHr} bpm.` : "Supabase activity context for the selected day.",
    };
  }

  if (completed) {
    return {
      title: completed.name,
      sport: completed.sport,
      pills: [
        { label: formatDistanceKm(completed.distance_m), accent: true },
        { label: formatDuration(completed.duration_seconds), accent: false },
        { label: `${completed.tss} TSS`, accent: false },
      ],
      detail: `${formatLongDate(completed.start_time)} · ${completed.sport}`,
    };
  }

  return {
    title: planned?.title ?? "Recovery day",
    sport: "cycling" as const,
    pills: [
      { label: `${planned?.expected_tss ?? 0} TSS`, accent: true },
      { label: dayType, accent: false },
    ],
    detail: planned?.description ?? "No activity was logged for this day.",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function activityHeroBackground(sport: string) {
  if (sport === "running") {
    return 'linear-gradient(180deg, rgba(15,16,18,0.15), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80")';
  }

  return 'linear-gradient(180deg, rgba(15,16,18,0.12), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80")';
}

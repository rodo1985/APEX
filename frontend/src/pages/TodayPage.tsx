import { useEffect, useMemo, useState } from "react";

import { Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import { formatDateLabel, formatDistanceKm, formatDuration, formatLongDate } from "../lib/format";
import type { NutritionTodayResponse, NutritionWeeklyResponse, TrainingTodayResponse } from "../lib/types";

export function TodayPage() {
  const { api } = useSession();
  const [nutrition, setNutrition] = useState<NutritionTodayResponse | null>(null);
  const [weeklyNutrition, setWeeklyNutrition] = useState<NutritionWeeklyResponse | null>(null);
  const [training, setTraining] = useState<TrainingTodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [todayNutrition, weeklyNutritionResponse, trainingToday] = await Promise.all([
          api.getNutritionToday(),
          api.getNutritionWeekly(),
          api.getTrainingToday(),
        ]);
        setNutrition(todayNutrition);
        setWeeklyNutrition(weeklyNutritionResponse);
        setTraining(trainingToday);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the dashboard.");
      }
    }

    void load();
  }, [api]);

  const macroProgress = useMemo(() => {
    if (!nutrition) {
      return [];
    }

    return [
      { label: "Protein", value: nutrition.summary.protein_g, target: 140, color: "var(--workspace-teal)" },
      { label: "Carbs", value: nutrition.summary.carbs_g, target: 260, color: "var(--workspace-blue)" },
      { label: "Fat", value: nutrition.summary.fat_g, target: 65, color: "var(--workspace-orange)" },
    ];
  }, [nutrition]);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!nutrition || !weeklyNutrition || !training) {
    return <div className="workspace-empty">Loading today&apos;s APEX view...</div>;
  }

  const planned = training.planned_activities[0] as
    | { title?: string; description?: string; expected_tss?: number }
    | undefined;
  const completed = training.completed_activities[0];
  const weeklyPeak = Math.max(...weeklyNutrition.days.map((entry) => entry.calories || 1), 1);
  const recoveryScore = clamp(78 + training.metrics.tsb, 28, 96);
  const hydrationLitres = Math.max(nutrition.summary.calories_consumed / 1000, 1.5).toFixed(1);
  const remainingCalories = Math.max(
    nutrition.summary.calories_target - Math.round(nutrition.summary.calories_consumed),
    0,
  );
  const weeklyBurn = Math.round(weeklyNutrition.days.reduce((sum, day) => sum + day.calories, 0) * 1.15);

  return (
    <div className="workspace-section">
      <section className="today-chip-grid">
        <article className="metric-chip">
          <Icon name="moon" size={18} />
          <strong>7.2 h</strong>
          <span>Sleep</span>
        </article>
        <article className="metric-chip metric-chip-accent">
          <Icon name="heart" size={18} />
          <strong>{recoveryScore}%</strong>
          <span>Recovery</span>
        </article>
        <article className="metric-chip">
          <Icon name="drop" size={18} />
          <strong>{hydrationLitres} L</strong>
          <span>Hydration</span>
        </article>
      </section>

      <div className="today-grid">
        <div className="today-column">
          <section className="today-calories-card">
            <div className="today-card-copy">
              <span>Calories today</span>
              <h2>
                {Math.round(nutrition.summary.calories_consumed)}
                <small>cal</small>
              </h2>
            </div>

            <div className="today-calorie-mini-grid">
              <div>
                <strong>{nutrition.summary.calories_target}</strong>
                <span>Target</span>
              </div>
              <div className="accent">
                <strong>{remainingCalories}</strong>
                <span>Remaining</span>
              </div>
              <div>
                <strong>{weeklyBurn}</strong>
                <span>Weekly burn</span>
              </div>
            </div>

            <div className="today-macro-stack">
              {macroProgress.map((item) => (
                <div key={item.label} className="today-macro-row">
                  <span>{item.label}</span>
                  <div className="today-macro-bar">
                    <div
                      style={{
                        width: `${Math.min((item.value / item.target) * 100, 100)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                  <strong>{Math.round(item.value)}g</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="workspace-insight-card">
            <div className="workspace-insight-icon">
              <Icon name="bolt" size={18} />
            </div>
            <div>
              <div className="workspace-insight-label">Coach insight</div>
              <p>
                {training.status === "fatigued" || training.status === "overreaching"
                  ? "Load is trending hot. Protect recovery with easy intensity and make the next meal protein-first."
                  : "Fuel is still under target, but the load profile is stable. Keep protein on plan and protect the quality session."}
              </p>
            </div>
          </section>
        </div>

        <div className="today-column">
          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Weekly calories</span>
                <h3>Seven-day trend</h3>
              </div>
              <div className="workspace-pill">{nutrition.summary.target_day_type}</div>
            </div>

            <div className="today-chart">
              {weeklyNutrition.days.map((day) => (
                <div key={day.date} className="today-chart-column">
                  <div
                    className="today-chart-bar"
                    style={{ height: `${Math.max((day.calories / weeklyPeak) * 100, 12)}%` }}
                  />
                  <span>{formatDateLabel(day.date)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Last activity</span>
                <h3>{completed?.name ?? planned?.title ?? "Recovery day"}</h3>
              </div>
              <div className="workspace-linkish">Latest context</div>
            </div>

            <div
              className="training-hero"
              style={{
                backgroundImage: activityHeroBackground(completed?.sport ?? "cycling"),
              }}
            >
              <div className="training-hero-overlay" />
              <div className="training-hero-content">
                <div className="training-hero-source">
                  <Icon name={completed?.sport === "running" ? "run" : "bike"} size={11} />
                  STRAVA
                </div>
                <h4>{completed?.name ?? planned?.title ?? "Recovery day"}</h4>
                <div className="training-pill-row">
                  {completed ? (
                    <>
                      <span className="training-pill accent">{formatDistanceKm(completed.distance_m)}</span>
                      <span className="training-pill">{formatDuration(completed.duration_seconds)}</span>
                      <span className="training-pill">{completed.tss} TSS</span>
                    </>
                  ) : (
                    <>
                      <span className="training-pill accent">{planned?.expected_tss ?? 0} TSS</span>
                      <span className="training-pill">{nutrition.summary.target_day_type}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <p className="workspace-support-copy">
              {completed
                ? `${formatLongDate(completed.start_time)} · ${completed.sport}`
                : planned?.description ?? "No activity has been synced for today yet."}
            </p>
          </section>

          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Today</span>
                <h3>{planned?.title ?? "Recovery day"}</h3>
              </div>
              <div className={`workspace-pill ${training.status}`}>{training.status}</div>
            </div>

            <div className="today-planned-metrics">
              <div>
                <strong>{training.metrics.ctl}</strong>
                <span>CTL</span>
              </div>
              <div>
                <strong>{training.metrics.atl}</strong>
                <span>ATL</span>
              </div>
              <div>
                <strong>{training.metrics.tsb}</strong>
                <span>TSB</span>
              </div>
            </div>
            <p className="workspace-support-copy">
              {planned?.description ??
                "No structured work is planned today. Use the extra space to recover and stay on fuelling targets."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function activityHeroBackground(sport: "cycling" | "running") {
  if (sport === "running") {
    return 'linear-gradient(180deg, rgba(15,16,18,0.15), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80")';
  }

  return 'linear-gradient(180deg, rgba(15,16,18,0.12), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80")';
}

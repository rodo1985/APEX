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

    const targets = {
      Protein: 140,
      Carbs: 260,
      Fat: 65,
    };

    return [
      { label: "Protein", value: nutrition.summary.protein_g, target: targets.Protein, color: "var(--teal)" },
      { label: "Carbs", value: nutrition.summary.carbs_g, target: targets.Carbs, color: "var(--blue)" },
      { label: "Fat", value: nutrition.summary.fat_g, target: targets.Fat, color: "var(--orange)" },
    ];
  }, [nutrition]);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!nutrition || !weeklyNutrition || !training) {
    return <div className="notice-banner">Loading today&apos;s APEX view...</div>;
  }

  const planned = training.planned_activities[0] as { title?: string; description?: string; expected_tss?: number } | undefined;
  const completed = training.completed_activities[0];

  return (
    <div className="page-grid">
      <div className="section-copy">
        <p className="eyebrow">Today</p>
        <h2>{formatLongDate(nutrition.date)}</h2>
        <p>
          Daily fuel, live training load, and the next best move for the athlete plan all in one place.
        </p>
      </div>

      <div className="page-grid grid-three">
        <article className="panel stat-card">
          <span className="eyebrow">Calories</span>
          <strong>{Math.round(nutrition.summary.calories_consumed)} cal</strong>
          <span className="muted-copy">
            Target {nutrition.summary.calories_target} · Day type {nutrition.summary.target_day_type}
          </span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Training form</span>
          <strong>{training.metrics.tsb}</strong>
          <span className="muted-copy">
            CTL {training.metrics.ctl} · ATL {training.metrics.atl} · {training.status}
          </span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Today&apos;s TSS</span>
          <strong>{training.metrics.daily_tss}</strong>
          <span className="muted-copy">Planned {planned?.expected_tss ?? 0} TSS</span>
        </article>
      </div>

      <div className="page-grid grid-two">
        <section className="panel">
          <div className="list-header">
            <div>
              <p className="eyebrow">Macro progress</p>
              <h3 style={{ margin: 0 }}>Fuel tracking</h3>
            </div>
            <span className="status-pill">{nutrition.summary.target_day_type}</span>
          </div>
          <div className="macro-list" style={{ marginTop: "1rem" }}>
            {macroProgress.map((item) => (
              <div key={item.label}>
                <div className="list-header" style={{ marginBottom: "0.45rem" }}>
                  <strong>{item.label}</strong>
                  <span className="muted-copy">
                    {Math.round(item.value)} / {item.target} g
                  </span>
                </div>
                <div className="metric-bar">
                  <span
                    style={{
                      width: `${Math.min((item.value / item.target) * 100, 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {nutrition.summary.note ? <div className="notice-banner" style={{ marginTop: "1rem" }}>{nutrition.summary.note}</div> : null}
        </section>

        <section className="panel">
          <div className="section-copy">
            <p className="eyebrow">Planned focus</p>
            <h3 style={{ margin: 0 }}>{planned?.title ?? "Recovery day"}</h3>
          </div>
          <p className="muted-copy">{planned?.description ?? "No structured session planned today."}</p>
          {completed ? (
            <div className="activity-item" style={{ marginTop: "1rem" }}>
              <div className="list-header">
                <div>
                  <strong>{completed.name}</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    {formatDateLabel(completed.start_time)}
                  </p>
                </div>
                <span className="status-pill">{completed.sport}</span>
              </div>
              <div className="inline-actions" style={{ marginTop: "0.75rem" }}>
                <span className="button-ghost">{formatDistanceKm(completed.distance_m)}</span>
                <span className="button-ghost">{formatDuration(completed.duration_seconds)}</span>
                <span className="button-ghost">{completed.tss} TSS</span>
              </div>
            </div>
          ) : (
            <div className="notice-banner" style={{ marginTop: "1rem" }}>
              No completed activity has been synced for today yet.
            </div>
          )}
        </section>
      </div>

      <div className="page-grid grid-two">
        <section className="panel">
          <div className="section-copy">
            <p className="eyebrow">Weekly calories</p>
            <h3 style={{ margin: 0 }}>Seven-day trend</h3>
          </div>
          <div className="chart">
            {weeklyNutrition.days.map((day) => (
              <div
                key={day.date}
                className="chart-bar"
                style={{ height: `${Math.max((day.calories / Math.max(...weeklyNutrition.days.map((entry) => entry.calories || 1))) * 100, 12)}%` }}
              >
                <span>{formatDateLabel(day.date)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-copy">
            <p className="eyebrow">Coach insight</p>
            <h3 style={{ margin: 0 }}>What matters today</h3>
          </div>
          <div className="notice-banner">
            {training.status === "fatigued" || training.status === "overreaching"
              ? "Training load is elevated. Keep intensity under control and protect the recovery window with carbs plus protein."
              : "Current load is manageable. Stay close to today’s macro targets and keep the key session quality high."}
          </div>
        </section>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";

import { useSession } from "../lib/auth";
import { formatDateLabel, formatDistanceKm, formatDuration } from "../lib/format";
import type {
  Activity,
  TrainingLoadPoint,
  TrainingTodayResponse,
  TrainingWeeklySummary,
} from "../lib/types";

export function TrainingPage() {
  const { api } = useSession();
  const [today, setToday] = useState<TrainingTodayResponse | null>(null);
  const [loadSeries, setLoadSeries] = useState<TrainingLoadPoint[]>([]);
  const [weekly, setWeekly] = useState<TrainingWeeklySummary[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    try {
      const todayDate = new Date();
      const start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 28);

      const [todayResponse, loadResponse, weeklyResponse, activitiesResponse] = await Promise.all([
        api.getTrainingToday(),
        api.getTrainingLoad(),
        api.getTrainingWeekly(),
        api.getTrainingActivities(start.toISOString().slice(0, 10), todayDate.toISOString().slice(0, 10)),
      ]);
      setToday(todayResponse);
      setLoadSeries(loadResponse.series);
      setWeekly(weeklyResponse.weeks);
      setActivities(activitiesResponse.activities);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load training data.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const peakLoad = useMemo(
    () => Math.max(...loadSeries.map((point) => point.ctl || point.atl || 1), 1),
    [loadSeries],
  );

  async function handleSync() {
    setSyncing(true);
    setError(null);

    try {
      await api.syncStrava(14);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sync Strava.");
    } finally {
      setSyncing(false);
    }
  }

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  if (!today) {
    return <div className="notice-banner">Loading training data...</div>;
  }

  const latestWeek = weekly.at(-1);

  return (
    <div className="page-grid">
      <div className="list-header">
        <div className="section-copy">
          <p className="eyebrow">Training</p>
          <h2>Load, trend, and recent sessions.</h2>
          <p>APEX combines recent Strava activity with a generated daily brief so training and fuelling stay aligned.</p>
        </div>
        <button className="button-primary" type="button" onClick={() => void handleSync()} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Strava"}
        </button>
      </div>

      <div className="page-grid grid-three">
        <article className="panel stat-card">
          <span className="eyebrow">Current CTL</span>
          <strong>{today.metrics.ctl}</strong>
          <span className="muted-copy">Fitness baseline over the last 42 days.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Current ATL</span>
          <strong>{today.metrics.atl}</strong>
          <span className="muted-copy">Short-term fatigue from the last seven days.</span>
        </article>
        <article className="panel stat-card">
          <span className="eyebrow">Status</span>
          <strong>{today.status}</strong>
          <span className="muted-copy">TSB {today.metrics.tsb} based on the current load curve.</span>
        </article>
      </div>

      <div className="page-grid grid-two">
        <section className="panel">
          <div className="section-copy">
            <p className="eyebrow">Load curve</p>
            <h3 style={{ margin: 0 }}>CTL trend over time</h3>
          </div>
          <div className="chart">
            {loadSeries.slice(-14).map((point) => (
              <div
                key={point.date}
                className="chart-bar"
                style={{ height: `${Math.max((point.ctl / peakLoad) * 100, 10)}%` }}
              >
                <span>{formatDateLabel(point.date)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-copy">
            <p className="eyebrow">Weekly summary</p>
            <h3 style={{ margin: 0 }}>Latest block</h3>
          </div>
          {latestWeek ? (
            <div className="settings-item">
              <div className="list-header">
                <div>
                  <strong>{latestWeek.total_tss} TSS</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    {latestWeek.total_hours} hours · {latestWeek.total_distance_km} km · {latestWeek.activities_count} activities
                  </p>
                </div>
                <span className="status-pill">{formatDateLabel(latestWeek.week_start)}</span>
              </div>
            </div>
          ) : (
            <div className="notice-banner">No weekly data is available yet.</div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="section-copy">
          <p className="eyebrow">Recent sessions</p>
          <h3 style={{ margin: 0 }}>Activity history</h3>
        </div>
        <div className="activity-list">
          {activities.map((activity) => (
            <article key={activity.activity_id} className="activity-item">
              <div className="list-header">
                <div>
                  <strong>{activity.name}</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    {formatDateLabel(activity.start_time)} · {activity.sport}
                  </p>
                </div>
                <span className="status-pill">{activity.tss} TSS</span>
              </div>
              <div className="inline-actions" style={{ marginTop: "0.75rem" }}>
                <span className="button-ghost">{formatDistanceKm(activity.distance_m)}</span>
                <span className="button-ghost">{formatDuration(activity.duration_seconds)}</span>
                {activity.avg_power_w ? <span className="button-ghost">{Math.round(activity.avg_power_w)} W</span> : null}
                {activity.avg_hr ? <span className="button-ghost">{activity.avg_hr} bpm</span> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

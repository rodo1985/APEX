import { useEffect, useMemo, useState } from "react";

import { Icon } from "../components/Brand";
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
    () => Math.max(...loadSeries.map((point) => Math.max(point.ctl, point.atl, 1)), 1),
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
    return <div className="workspace-empty">Loading training data...</div>;
  }

  const latestWeek = weekly.at(-1);
  const planned = today.planned_activities[0] as { expected_tss?: number } | undefined;
  const weeklyProgress = latestWeek
    ? Math.min((latestWeek.total_tss / Math.max(planned?.expected_tss ?? latestWeek.total_tss, 1)) * 100, 100)
    : 0;

  return (
    <div className="workspace-section">
      <div className="workspace-page-header">
        <div>
          <span>This week</span>
          <h2>Training</h2>
          <p>Strava-backed load, recent sessions, and a clearer view of the current block.</p>
        </div>
        <button className="workspace-primary-button" type="button" onClick={() => void handleSync()} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Strava"}
        </button>
      </div>

      <section className="workspace-card training-summary-card">
        <div className="workspace-section-heading">
          <div>
            <span>Weekly load</span>
            <h3>{latestWeek?.total_tss ?? today.metrics.daily_tss} TSS</h3>
          </div>
          <div className="workspace-support-copy">
            {latestWeek
              ? `${latestWeek.total_hours} h · ${latestWeek.total_distance_km} km`
              : `${today.metrics.daily_tss} TSS today`}
          </div>
        </div>

        <div className="training-progress-bar">
          <div style={{ width: `${Math.max(weeklyProgress, 8)}%` }} />
        </div>

        <div className="training-summary-grid">
          <div>
            <strong>{today.metrics.ctl}</strong>
            <span>CTL</span>
          </div>
          <div>
            <strong>{today.metrics.atl}</strong>
            <span>ATL</span>
          </div>
          <div>
            <strong>{today.metrics.tsb}</strong>
            <span>TSB</span>
          </div>
          <div>
            <strong>{latestWeek?.activities_count ?? activities.length}</strong>
            <span>Sessions</span>
          </div>
        </div>
      </section>

      <div className="today-grid">
        <div className="today-column">
          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Load curve</span>
                <h3>CTL trend</h3>
              </div>
              <div className="workspace-pill">{today.status}</div>
            </div>

            <div className="today-chart">
              {loadSeries.slice(-14).map((point) => (
                <div key={point.date} className="today-chart-column">
                  <div
                    className="today-chart-bar training-load-bar"
                    style={{ height: `${Math.max((point.ctl / peakLoad) * 100, 10)}%` }}
                  />
                  <span>{formatDateLabel(point.date)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="today-column">
          <section className="workspace-card">
            <div className="workspace-section-heading">
              <div>
                <span>Latest block</span>
                <h3>{latestWeek ? formatDateLabel(latestWeek.week_start) : "Awaiting data"}</h3>
              </div>
              <div className="workspace-linkish">Current trend</div>
            </div>
            {latestWeek ? (
              <div className="training-summary-grid">
                <div>
                  <strong>{latestWeek.total_tss}</strong>
                  <span>TSS</span>
                </div>
                <div>
                  <strong>{latestWeek.total_hours}</strong>
                  <span>Hours</span>
                </div>
                <div>
                  <strong>{latestWeek.total_distance_km}</strong>
                  <span>KM</span>
                </div>
                <div>
                  <strong>{latestWeek.activities_count}</strong>
                  <span>Activities</span>
                </div>
              </div>
            ) : (
              <div className="workspace-empty">No weekly data is available yet.</div>
            )}
          </section>
        </div>
      </div>

      <div className="workspace-page-header compact">
        <div>
          <span>Activities</span>
          <h2>Recent sessions</h2>
        </div>
      </div>

      <div className="training-card-stack">
        {activities.map((activity) => (
          <article
            key={activity.activity_id}
            className="training-hero"
            style={{ backgroundImage: activityHeroBackground(activity.sport) }}
          >
            <div className="training-hero-overlay" />
            <div className="training-hero-content">
              <div className="training-hero-source">
                <Icon name={activity.sport === "running" ? "run" : "bike"} size={11} />
                STRAVA
              </div>
              <h4>{activity.name}</h4>
              <div className="workspace-support-copy training-support-copy">
                {formatDateLabel(activity.start_time)} · {activity.sport}
              </div>
              <div className="training-pill-row">
                <span className="training-pill accent">{formatDistanceKm(activity.distance_m)}</span>
                <span className="training-pill">{formatDuration(activity.duration_seconds)}</span>
                <span className="training-pill">{activity.tss} TSS</span>
                {activity.avg_power_w ? <span className="training-pill">{Math.round(activity.avg_power_w)} W</span> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function activityHeroBackground(sport: "cycling" | "running") {
  if (sport === "running") {
    return 'linear-gradient(180deg, rgba(15,16,18,0.2), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1486218119243-13883505764c?w=1200&q=80")';
  }

  return 'linear-gradient(180deg, rgba(15,16,18,0.18), rgba(15,16,18,0.82)), url("https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1200&q=80")';
}

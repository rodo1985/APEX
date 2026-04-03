import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import { toDateInputValue } from "../lib/format";
import type { GoalPayload, IntegrationsResponse, Sport } from "../lib/types";

const DEFAULT_GOAL: GoalPayload = {
  goal_type: "race",
  description: "160 km endurance ride",
  target_date: null,
  goal_weight_kg: null,
  available_training_days: 5,
  secondary_goal: "",
  constraints_text: "",
  phase_name: "Base",
  weekly_tss_target: 320,
  weekly_hours_target: 6,
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { api, saveOnboarding, refreshProfile, user } = useSession();
  const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    timezone: user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    sports: user?.sports ?? (["cycling", "running"] as Sport[]),
    ftp: user?.ftp?.toString() ?? "",
    lthr: user?.lthr?.toString() ?? "",
    weight_kg: user?.weight_kg?.toString() ?? "",
    height_cm: user?.height_cm?.toString() ?? "",
    daily_calorie_target: user?.daily_calorie_target?.toString() ?? "2300",
    protein_g: user?.macro_targets.protein_g?.toString() ?? "140",
    carbs_g: user?.macro_targets.carbs_g?.toString() ?? "260",
    fat_g: user?.macro_targets.fat_g?.toString() ?? "65",
  });
  const [goal, setGoal] = useState<GoalPayload>({
    ...DEFAULT_GOAL,
    ...(user?.active_goal ?? {}),
    target_date: user?.active_goal?.target_date ?? null,
    secondary_goal: user?.active_goal?.secondary_goal ?? "",
    constraints_text: user?.active_goal?.constraints_text ?? "",
  });

  useEffect(() => {
    void api.getIntegrations().then(setIntegrations).catch(() => undefined);
  }, [api]);

  const sportSelections = useMemo(
    () => [
      { label: "Cycling", value: "cycling" as Sport },
      { label: "Running", value: "running" as Sport },
    ],
    [],
  );

  function toggleSport(value: Sport) {
    setProfile((previous) => ({
      ...previous,
      sports: previous.sports.includes(value)
        ? previous.sports.filter((sport) => sport !== value)
        : [...previous.sports, value],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await saveOnboarding({
        name: profile.name,
        timezone: profile.timezone,
        sports: profile.sports,
        ftp: profile.ftp ? Number(profile.ftp) : null,
        lthr: profile.lthr ? Number(profile.lthr) : null,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        daily_calorie_target: Number(profile.daily_calorie_target),
        macro_targets: {
          protein_g: Number(profile.protein_g),
          carbs_g: Number(profile.carbs_g),
          fat_g: Number(profile.fat_g),
        },
        active_goal: {
          ...goal,
          target_date: goal.target_date || null,
          secondary_goal: goal.secondary_goal || null,
          constraints_text: goal.constraints_text || null,
        },
      });
      setSuccess("Onboarding saved. Your dashboard is ready.");
      await refreshProfile();
      window.setTimeout(() => navigate("/app/today", { replace: true }), 400);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save onboarding.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startStravaConnect() {
    setError(null);
    window.sessionStorage.setItem("apex.strava.returnTo", "/onboarding");

    try {
      const redirectUri = `${window.location.origin}/auth/strava/callback`;
      const response = await api.getStravaAuthorizeUrl(redirectUri);
      window.location.href = response.authorize_url;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start Strava connect.");
    }
  }

  return (
    <div className="dashboard-content" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div className="section-copy">
        <p className="eyebrow">Onboarding</p>
        <h2>Build the athlete baseline APEX needs.</h2>
        <p>
          These fields drive the first dynamic fuelling targets, training brief, and coach context.
          You can update them later in settings.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <form className="page-grid grid-two" onSubmit={handleSubmit}>
        <section className="form-card">
          <div className="section-copy">
            <p className="eyebrow">Profile</p>
            <h3 style={{ margin: 0 }}>Athlete identity</h3>
          </div>
          <div className="form-field">
            <label htmlFor="onboarding-name">Name</label>
            <input
              id="onboarding-name"
              value={profile.name}
              onChange={(event) => setProfile((previous) => ({ ...previous, name: event.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="onboarding-timezone">Timezone</label>
            <input
              id="onboarding-timezone"
              value={profile.timezone}
              onChange={(event) => setProfile((previous) => ({ ...previous, timezone: event.target.value }))}
              required
            />
          </div>

          <div className="form-field">
            <label>Sports</label>
            <div className="inline-actions">
              {sportSelections.map((sport) => (
                <button
                  key={sport.value}
                  type="button"
                  className={profile.sports.includes(sport.value) ? "button-primary" : "button-secondary"}
                  onClick={() => toggleSport(sport.value)}
                >
                  {sport.label}
                </button>
              ))}
            </div>
          </div>

          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="ftp">FTP</label>
              <input id="ftp" type="number" value={profile.ftp} onChange={(event) => setProfile((previous) => ({ ...previous, ftp: event.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="lthr">LTHR</label>
              <input id="lthr" type="number" value={profile.lthr} onChange={(event) => setProfile((previous) => ({ ...previous, lthr: event.target.value }))} />
            </div>
          </div>

          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="weight">Weight (kg)</label>
              <input id="weight" type="number" value={profile.weight_kg} onChange={(event) => setProfile((previous) => ({ ...previous, weight_kg: event.target.value }))} required />
            </div>
            <div className="form-field">
              <label htmlFor="height">Height (cm)</label>
              <input id="height" type="number" value={profile.height_cm} onChange={(event) => setProfile((previous) => ({ ...previous, height_cm: event.target.value }))} required />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="section-copy">
            <p className="eyebrow">Nutrition</p>
            <h3 style={{ margin: 0 }}>Base fuelling targets</h3>
          </div>
          <div className="form-field">
            <label htmlFor="calories">Base daily calories</label>
            <input
              id="calories"
              type="number"
              value={profile.daily_calorie_target}
              onChange={(event) => setProfile((previous) => ({ ...previous, daily_calorie_target: event.target.value }))}
              required
            />
          </div>
          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="protein">Protein (g)</label>
              <input id="protein" type="number" value={profile.protein_g} onChange={(event) => setProfile((previous) => ({ ...previous, protein_g: event.target.value }))} required />
            </div>
            <div className="form-field">
              <label htmlFor="carbs">Carbs (g)</label>
              <input id="carbs" type="number" value={profile.carbs_g} onChange={(event) => setProfile((previous) => ({ ...previous, carbs_g: event.target.value }))} required />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="fat">Fat (g)</label>
            <input id="fat" type="number" value={profile.fat_g} onChange={(event) => setProfile((previous) => ({ ...previous, fat_g: event.target.value }))} required />
          </div>

          <div className="notice-banner">
            APEX will still move these targets by day type. These are the base values used before
            rest-day, interval-day, and long-session adjustments are applied.
          </div>
        </section>

        <section className="form-card">
          <div className="section-copy">
            <p className="eyebrow">Goal</p>
            <h3 style={{ margin: 0 }}>Primary objective</h3>
          </div>

          <div className="form-field">
            <label htmlFor="goal-type">Goal type</label>
            <select
              id="goal-type"
              value={goal.goal_type}
              onChange={(event) =>
                setGoal((previous) => ({ ...previous, goal_type: event.target.value as GoalPayload["goal_type"] }))
              }
            >
              <option value="race">Race / event</option>
              <option value="distance_pr">Distance PR</option>
              <option value="body_composition">Body composition</option>
              <option value="consistency">Training consistency</option>
              <option value="combined">Combined</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="goal-description">Goal description</label>
            <input
              id="goal-description"
              value={goal.description}
              onChange={(event) => setGoal((previous) => ({ ...previous, description: event.target.value }))}
              required
            />
          </div>

          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="goal-date">Target date</label>
              <input
                id="goal-date"
                type="date"
                value={toDateInputValue(goal.target_date)}
                onChange={(event) => setGoal((previous) => ({ ...previous, target_date: event.target.value || null }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="goal-days">Training days / week</label>
              <input
                id="goal-days"
                type="number"
                min={1}
                max={7}
                value={goal.available_training_days}
                onChange={(event) => setGoal((previous) => ({ ...previous, available_training_days: Number(event.target.value) }))}
              />
            </div>
          </div>

          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="weekly-tss">Weekly TSS target</label>
              <input
                id="weekly-tss"
                type="number"
                value={goal.weekly_tss_target}
                onChange={(event) => setGoal((previous) => ({ ...previous, weekly_tss_target: Number(event.target.value) }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="weekly-hours">Weekly hours</label>
              <input
                id="weekly-hours"
                type="number"
                step="0.5"
                value={goal.weekly_hours_target}
                onChange={(event) => setGoal((previous) => ({ ...previous, weekly_hours_target: Number(event.target.value) }))}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="secondary-goal">Secondary goal</label>
            <input
              id="secondary-goal"
              value={goal.secondary_goal ?? ""}
              onChange={(event) => setGoal((previous) => ({ ...previous, secondary_goal: event.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor="constraints">Constraints</label>
            <textarea
              id="constraints"
              value={goal.constraints_text ?? ""}
              onChange={(event) => setGoal((previous) => ({ ...previous, constraints_text: event.target.value }))}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="section-copy">
            <p className="eyebrow">Integrations</p>
            <h3 style={{ margin: 0 }}>Connect Strava</h3>
            <p className="muted-copy" style={{ margin: 0 }}>
              The MVP uses Strava-backed training data immediately and leaves calendar plus Apple Health deferred.
            </p>
          </div>

          <div className="settings-list">
            <div className="settings-item">
              <div className="list-header">
                <div>
                  <strong>Strava</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    {integrations?.strava.connected
                      ? `Connected as ${integrations.strava.athlete_name ?? "athlete"}`
                      : "Not connected yet"}
                  </p>
                </div>
                <button className="button-primary" type="button" onClick={() => void startStravaConnect()}>
                  <Icon name="bike" />
                  Connect
                </button>
              </div>
            </div>
            <div className="notice-banner">
              The current build defers Google Calendar and Apple Health implementation, but keeps them
              documented so the repo stays aligned with the product architecture.
            </div>
          </div>
        </section>

        <div className="inline-actions" style={{ gridColumn: "1 / -1" }}>
          <button className="button-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving onboarding..." : "Save onboarding and open APEX"}
          </button>
          <button className="button-secondary" type="button" onClick={() => navigate("/app/today")}>
            Skip to dashboard
          </button>
        </div>
      </form>
    </div>
  );
}

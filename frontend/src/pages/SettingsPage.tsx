import { useEffect, useState } from "react";

import { useSession } from "../lib/auth";
import type { IntegrationsResponse } from "../lib/types";

export function SettingsPage() {
  const { api, refreshProfile, saveOnboarding, user } = useSession();
  const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: user?.name ?? "",
    timezone: user?.timezone ?? "",
    weight_kg: user?.weight_kg?.toString() ?? "",
    height_cm: user?.height_cm?.toString() ?? "",
    ftp: user?.ftp?.toString() ?? "",
    lthr: user?.lthr?.toString() ?? "",
    daily_calorie_target: user?.daily_calorie_target?.toString() ?? "2300",
  });

  useEffect(() => {
    void api.getIntegrations().then(setIntegrations).catch(() => undefined);
  }, [api]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveOnboarding({
        name: formState.name,
        timezone: formState.timezone,
        weight_kg: formState.weight_kg ? Number(formState.weight_kg) : null,
        height_cm: formState.height_cm ? Number(formState.height_cm) : null,
        ftp: formState.ftp ? Number(formState.ftp) : null,
        lthr: formState.lthr ? Number(formState.lthr) : null,
        daily_calorie_target: Number(formState.daily_calorie_target),
      });
      await refreshProfile();
      setSuccess("Settings saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function startStravaConnect() {
    setError(null);
    window.sessionStorage.setItem("apex.strava.returnTo", "/app/settings");

    try {
      const redirectUri = `${window.location.origin}/auth/strava/callback`;
      const response = await api.getStravaAuthorizeUrl(redirectUri);
      window.location.href = response.authorize_url;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start Strava connect.");
    }
  }

  async function disconnectStrava() {
    setError(null);

    try {
      await api.disconnectStrava();
      const updated = await api.getIntegrations();
      setIntegrations(updated);
      setSuccess("Strava disconnected.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to disconnect Strava.");
    }
  }

  return (
    <div className="page-grid">
      <div className="section-copy">
        <p className="eyebrow">Settings</p>
        <h2>Keep the athlete profile current.</h2>
        <p>
          These fields drive the dynamic targets, generated daily brief, and coach context. The current build
          intentionally keeps provider API keys out of the UI and uses server configuration instead.
        </p>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="settings-grid grid-two">
        <form className="settings-card" onSubmit={handleSave}>
          <div className="section-copy">
            <p className="eyebrow">Profile</p>
            <h3 style={{ margin: 0 }}>Core athlete metrics</h3>
          </div>
          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="settings-name">Name</label>
              <input id="settings-name" value={formState.name} onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="settings-timezone">Timezone</label>
              <input id="settings-timezone" value={formState.timezone} onChange={(event) => setFormState((previous) => ({ ...previous, timezone: event.target.value }))} />
            </div>
          </div>
          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="settings-weight">Weight (kg)</label>
              <input id="settings-weight" type="number" value={formState.weight_kg} onChange={(event) => setFormState((previous) => ({ ...previous, weight_kg: event.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="settings-height">Height (cm)</label>
              <input id="settings-height" type="number" value={formState.height_cm} onChange={(event) => setFormState((previous) => ({ ...previous, height_cm: event.target.value }))} />
            </div>
          </div>
          <div className="split-inline">
            <div className="form-field">
              <label htmlFor="settings-ftp">FTP</label>
              <input id="settings-ftp" type="number" value={formState.ftp} onChange={(event) => setFormState((previous) => ({ ...previous, ftp: event.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="settings-lthr">LTHR</label>
              <input id="settings-lthr" type="number" value={formState.lthr} onChange={(event) => setFormState((previous) => ({ ...previous, lthr: event.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="settings-calories">Base calories</label>
            <input
              id="settings-calories"
              type="number"
              value={formState.daily_calorie_target}
              onChange={(event) => setFormState((previous) => ({ ...previous, daily_calorie_target: event.target.value }))}
            />
          </div>

          <div className="inline-actions">
            <button className="button-primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>

        <div className="settings-card">
          <div className="section-copy">
            <p className="eyebrow">Integrations</p>
            <h3 style={{ margin: 0 }}>Current connection state</h3>
          </div>

          <div className="settings-list">
            <div className="settings-item">
              <div className="list-header">
                <div>
                  <strong>Strava</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    {integrations?.strava.connected
                      ? `Connected as ${integrations.strava.athlete_name ?? "athlete"}`
                      : "Not connected"}
                  </p>
                </div>
                <div className="inline-actions">
                  <button className="button-secondary" type="button" onClick={() => void startStravaConnect()}>
                    Connect
                  </button>
                  {integrations?.strava.connected ? (
                    <button className="button-ghost" type="button" onClick={() => void disconnectStrava()}>
                      Disconnect
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="settings-item">
              <div className="list-header">
                <div>
                  <strong>Google Calendar</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    Deferred in the MVP build.
                  </p>
                </div>
                <span className="status-pill">Deferred</span>
              </div>
            </div>
            <div className="settings-item">
              <div className="list-header">
                <div>
                  <strong>Apple Health</strong>
                  <p className="muted-copy" style={{ marginBottom: 0 }}>
                    Deferred in the MVP build.
                  </p>
                </div>
                <span className="status-pill">Deferred</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

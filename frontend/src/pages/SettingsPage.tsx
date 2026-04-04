import { useEffect, useState } from "react";

import { Icon } from "../components/Brand";
import { useSession } from "../lib/auth";
import type { IntegrationsResponse } from "../lib/types";

type SettingsSection = "profile" | "apikeys" | "integrations";

export function SettingsPage() {
  const { api, refreshProfile, saveOnboarding, user } = useSession();
  const [integrations, setIntegrations] = useState<IntegrationsResponse | null>(null);
  const [section, setSection] = useState<SettingsSection>("profile");
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
    <div className="workspace-section">
      <div className="workspace-page-header compact">
        <div>
          <span>Control room</span>
          <h2>Settings</h2>
          <p>Profile, operational details, and the integrations that feed APEX.</p>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {success ? <div className="success-banner">{success}</div> : null}

      <div className="settings-shell">
        <aside className="settings-rail">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-rail-link${section === tab.id ? " active" : ""}`}
              onClick={() => setSection(tab.id)}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        <section className="workspace-card settings-panel">
          {section === "profile" ? (
            <form onSubmit={handleSave}>
              <div className="settings-page-heading">
                <div>
                  <span>Profile</span>
                  <h3>Core athlete metrics</h3>
                </div>
                <button className="workspace-primary-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>

              <div className="settings-form-grid">
                <label className="settings-field">
                  <span>Full name</span>
                  <input
                    id="settings-name"
                    value={formState.name}
                    onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
                  />
                </label>
                <label className="settings-field">
                  <span>Timezone</span>
                  <input
                    id="settings-timezone"
                    value={formState.timezone}
                    onChange={(event) => setFormState((previous) => ({ ...previous, timezone: event.target.value }))}
                  />
                </label>
                <label className="settings-field">
                  <span>Weight (kg)</span>
                  <input
                    id="settings-weight"
                    type="number"
                    value={formState.weight_kg}
                    onChange={(event) => setFormState((previous) => ({ ...previous, weight_kg: event.target.value }))}
                  />
                </label>
                <label className="settings-field">
                  <span>Height (cm)</span>
                  <input
                    id="settings-height"
                    type="number"
                    value={formState.height_cm}
                    onChange={(event) => setFormState((previous) => ({ ...previous, height_cm: event.target.value }))}
                  />
                </label>
                <label className="settings-field">
                  <span>FTP</span>
                  <input
                    id="settings-ftp"
                    type="number"
                    value={formState.ftp}
                    onChange={(event) => setFormState((previous) => ({ ...previous, ftp: event.target.value }))}
                  />
                </label>
                <label className="settings-field">
                  <span>LTHR</span>
                  <input
                    id="settings-lthr"
                    type="number"
                    value={formState.lthr}
                    onChange={(event) => setFormState((previous) => ({ ...previous, lthr: event.target.value }))}
                  />
                </label>
                <label className="settings-field settings-field-wide">
                  <span>Base calories</span>
                  <input
                    id="settings-calories"
                    type="number"
                    value={formState.daily_calorie_target}
                    onChange={(event) =>
                      setFormState((previous) => ({ ...previous, daily_calorie_target: event.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="settings-profile-note">
                <Icon name="bolt" size={16} />
                <p>APEX uses these values to compute macro targets, coach context, and daily training guidance.</p>
              </div>
            </form>
          ) : null}

          {section === "apikeys" ? (
            <div className="settings-tab-stack">
              <div className="settings-page-heading">
                <div>
                  <span>API Keys</span>
                  <h3>Server-managed in the MVP</h3>
                </div>
              </div>
              <p className="workspace-support-copy">
                The design spec includes local API key entry, but this build intentionally keeps provider credentials
                in server configuration so the product surface stays simpler and safer for early users.
              </p>
              <div className="settings-integration-row">
                <div>
                  <strong>Anthropic</strong>
                  <p>Used for coach responses when configured in the backend environment.</p>
                </div>
                <span className="workspace-pill">Server</span>
              </div>
              <div className="settings-integration-row">
                <div>
                  <strong>OpenAI</strong>
                  <p>Used for voice and photo parsing when backend credentials are available.</p>
                </div>
                <span className="workspace-pill">Server</span>
              </div>
            </div>
          ) : null}

          {section === "integrations" ? (
            <div className="settings-tab-stack">
              <div className="settings-page-heading">
                <div>
                  <span>Integrations</span>
                  <h3>Connected accounts</h3>
                </div>
              </div>

              <div className="settings-integration-row">
                <div>
                  <strong>Strava</strong>
                  <p>
                    {integrations?.strava.connected
                      ? `Connected as ${integrations.strava.athlete_name ?? "athlete"}`
                      : "Not connected"}
                  </p>
                </div>
                <div className="settings-inline-actions">
                  <button className="workspace-secondary-button" type="button" onClick={() => void startStravaConnect()}>
                    Connect
                  </button>
                  {integrations?.strava.connected ? (
                    <button className="workspace-text-button" type="button" onClick={() => void disconnectStrava()}>
                      Disconnect
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="settings-integration-row">
                <div>
                  <strong>Google Calendar</strong>
                  <p>Deferred in the MVP build.</p>
                </div>
                <span className="workspace-pill">Deferred</span>
              </div>

              <div className="settings-integration-row">
                <div>
                  <strong>Apple Health</strong>
                  <p>Deferred in the MVP build.</p>
                </div>
                <span className="workspace-pill">Deferred</span>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

const settingsTabs: Array<{ id: SettingsSection; label: string; icon: "user" | "key" | "link2" }> = [
  { id: "profile", label: "Profile", icon: "user" },
  { id: "apikeys", label: "API Keys", icon: "key" },
  { id: "integrations", label: "Integrations", icon: "link2" },
];

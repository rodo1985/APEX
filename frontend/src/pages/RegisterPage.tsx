import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApexLockup } from "../components/Brand";
import { useSession } from "../lib/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useSession();
  const [formState, setFormState] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(formState);
      navigate("/onboarding", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <ApexLockup size={36} wordmarkSize={24} mode="naked" />
        <div className="section-copy" style={{ marginTop: "1.5rem" }}>
          <p className="eyebrow">Start the MVP</p>
          <h2 style={{ margin: 0 }}>Create your athlete profile</h2>
          <p className="muted-copy" style={{ margin: 0 }}>
            APEX uses your baseline profile to personalize fuelling, training, and coaching from the first day.
          </p>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={formState.name}
              onChange={(event) => setFormState((previous) => ({ ...previous, name: event.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((previous) => ({ ...previous, email: event.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              minLength={8}
              value={formState.password}
              onChange={(event) => setFormState((previous) => ({ ...previous, password: event.target.value }))}
              required
            />
          </div>

          <div className="auth-actions">
            <button className="button-primary" type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
            <Link to="/login" className="button-secondary">
              Already have an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApexLockup } from "../components/Brand";
import { useSession } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate("/app/today", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <ApexLockup size={36} wordmarkSize={24} mode="naked" />
        <div className="section-copy" style={{ marginTop: "1.5rem" }}>
          <p className="eyebrow">Welcome back</p>
          <h2 style={{ margin: 0 }}>Sign in to APEX</h2>
          <p className="muted-copy" style={{ margin: 0 }}>
            Pick up your nutrition, training, and coaching context where you left off.
          </p>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          <div className="auth-actions">
            <button className="button-primary" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
            <Link to="/register" className="button-secondary">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

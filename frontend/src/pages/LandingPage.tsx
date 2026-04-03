import { Link } from "react-router-dom";

import { ApexLockup, Icon } from "../components/Brand";

const features = [
  {
    icon: "mic" as const,
    title: "Voice logging",
    description:
      "Log meals and talk to your coach with push-to-talk flows built for mid-ride and post-run moments.",
  },
  {
    icon: "camera" as const,
    title: "Photo review",
    description:
      "Turn meal photos into reviewable ingredient suggestions, then confirm macros before saving the log.",
  },
  {
    icon: "bike" as const,
    title: "Strava-backed training",
    description:
      "Sync recent activities, compute CTL/ATL/TSB, and surface the load trends that actually matter.",
  },
  {
    icon: "chat" as const,
    title: "Context-aware coach",
    description:
      "Every coaching reply is grounded in your APEX profile, training load, nutrition, and active goal.",
  },
  {
    icon: "target" as const,
    title: "Dynamic targets",
    description:
      "Nutrition targets shift by day type so rest days, hard days, and long sessions are fuelled differently.",
  },
  {
    icon: "calendar" as const,
    title: "Future-ready planning",
    description:
      "The MVP leaves calendar and Apple Health deferred, but the architecture is ready for those integrations.",
  },
];

export function LandingPage() {
  return (
    <div className="hero-page">
      <header className="marketing-nav">
        <ApexLockup size={32} wordmarkSize={18} mode="naked" />
        <div className="marketing-nav-links">
          <a href="#features" className="button-ghost">
            Features
          </a>
          <a href="#workflow" className="button-ghost">
            Workflow
          </a>
          <Link to="/login" className="button-secondary">
            Sign in
          </Link>
        </div>
      </header>

      <section className="marketing-section hero-block">
        <div className="hero-copy">
          <p className="eyebrow">Open-source endurance intelligence</p>
          <h1>
            Your nutrition.
            <br />
            Your training.
            <br />
            <span className="apex-wordmark-accent">One AI coach.</span>
          </h1>
          <p>
            APEX replaces the split between food trackers, training dashboards, and generic chatbots.
            Log meals, sync Strava, and make daily decisions from one place that understands the full picture.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="button-primary">
              Start the MVP
            </Link>
            <a href="#features" className="button-secondary">
              Explore the product
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-visual-card">
            <p className="eyebrow">Today in APEX</p>
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Morning briefing</h3>
            <p className="muted-copy">
              Load is trending up, recovery is manageable, and you still have room to hit your carb target
              before tomorrow&apos;s long session.
            </p>
            <div className="hero-stats" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", paddingBottom: 0 }}>
              <div className="stat-card">
                <span className="eyebrow">Weekly load</span>
                <strong>340 TSS</strong>
                <span className="muted-copy">CTL 67.8 · ATL 73.1</span>
              </div>
              <div className="stat-card">
                <span className="eyebrow">Nutrition</span>
                <strong>1640 cal</strong>
                <span className="muted-copy">128 g protein · 210 g carbs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="hero-stats">
          {[
            { value: "10s", label: "Average log review" },
            { value: "24/7", label: "Coach availability" },
            { value: "90d", label: "Strava onboarding import" },
            { value: "1", label: "Unified athlete context" },
          ].map((item) => (
            <div key={item.label} className="panel">
              <p className="eyebrow">{item.label}</p>
              <h3 style={{ margin: 0, fontFamily: "Outfit, sans-serif", fontSize: "2rem" }}>{item.value}</h3>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="marketing-section" style={{ paddingBottom: "3rem" }}>
        <div className="section-copy">
          <p className="eyebrow">What the MVP ships</p>
          <h2>Everything needed to replace fragmented daily workflows.</h2>
          <p>
            The first build covers the full web shell, onboarding, nutrition logging, training summaries,
            and persisted coaching. Calendar, Apple Health, wearables, and native apps stay clearly deferred.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="panel feature-card">
              <div className="feature-icon">
                <Icon name={feature.icon} />
              </div>
              <h3 style={{ margin: 0, fontFamily: "Outfit, sans-serif" }}>{feature.title}</h3>
              <p className="muted-copy" style={{ margin: 0 }}>
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="marketing-section" style={{ paddingBottom: "4rem" }}>
        <div className="section-copy">
          <p className="eyebrow">How the product works</p>
          <h2>Designed around the daily questions athletes actually ask.</h2>
        </div>

        <div className="feature-grid">
          {[
            {
              title: "1. Capture meals fast",
              description:
                "Use manual search, push-to-talk, or photo upload. Every AI-assisted path ends in a review step before anything is saved.",
            },
            {
              title: "2. Sync the work",
              description:
                "Bring Strava activities into the training layer, normalize cycling and running metrics, and keep CTL/ATL/TSB current.",
            },
            {
              title: "3. Coach with context",
              description:
                "The coach assembles goal, nutrition, and training context on every message so guidance stays grounded in live APEX data.",
            },
          ].map((item) => (
            <article key={item.title} className="panel feature-card">
              <h3 style={{ margin: 0, fontFamily: "Outfit, sans-serif" }}>{item.title}</h3>
              <p className="muted-copy" style={{ margin: 0 }}>
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

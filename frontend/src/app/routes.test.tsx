import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "./routes";
import type { UserProfile } from "../lib/types";

const mockedUseSession = vi.fn();
const mockedNeedsOnboarding = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
  needsOnboarding: (...args: unknown[]) => mockedNeedsOnboarding(...args),
}));

vi.mock("../pages/LandingPage", () => ({ LandingPage: () => <div>Landing page</div> }));
vi.mock("../pages/LoginPage", () => ({ LoginPage: () => <div>Login page</div> }));
vi.mock("../pages/RegisterPage", () => ({ RegisterPage: () => <div>Register page</div> }));
vi.mock("../pages/OnboardingPage", () => ({ OnboardingPage: () => <div>Onboarding page</div> }));
vi.mock("../pages/TodayPage", () => ({ TodayPage: () => <div>Today page</div> }));
vi.mock("../pages/FoodLogPage", () => ({ FoodLogPage: () => <div>Food log page</div> }));
vi.mock("../pages/TrainingPage", () => ({ TrainingPage: () => <div>Training page</div> }));
vi.mock("../pages/CoachPage", () => ({ CoachPage: () => <div>Coach page</div> }));
vi.mock("../pages/SettingsPage", () => ({ SettingsPage: () => <div>Settings page</div> }));
vi.mock("../pages/StravaCallbackPage", () => ({ StravaCallbackPage: () => <div>Strava callback page</div> }));
vi.mock("../components/AppSplashScreen", () => ({
  AppSplashScreen: ({ label }: { label: string }) => <div>{label}</div>,
}));

const onboardedUser: UserProfile = {
  user_id: "user-1",
  name: "Demo Athlete",
  email: "demo@example.com",
  avatar_url: null,
  sports: ["cycling"],
  ftp: 290,
  lthr: 171,
  weight_kg: 69,
  height_cm: 178,
  daily_calorie_target: 2500,
  macro_targets: { protein_g: 150, carbs_g: 300, fat_g: 65 },
  timezone: "Europe/Madrid",
  created_at: "2026-04-03T07:00:00Z",
  active_goal: {
    goal_type: "race",
    description: "Gran fondo build",
    target_date: "2026-09-20",
    goal_weight_kg: 67,
    available_training_days: 5,
    secondary_goal: null,
    constraints_text: null,
    phase_name: "Build",
    weekly_tss_target: 400,
    weekly_hours_target: 8,
  },
};

function renderRoutes(pathname: string) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue({
      loading: false,
      user: null,
      logout: vi.fn(),
    });
    mockedNeedsOnboarding.mockReturnValue(false);
  });

  it("renders the login page for unauthenticated users", async () => {
    renderRoutes("/login");

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("renders the app workspace for onboarded users", async () => {
    mockedUseSession.mockReturnValue({
      loading: false,
      user: onboardedUser,
      logout: vi.fn(),
    });

    renderRoutes("/app/today");

    expect(await screen.findByText("Today page")).toBeInTheDocument();
    expect(screen.getByText("Live data")).toBeInTheDocument();
  });

  it("redirects protected app routes into onboarding when profile setup is incomplete", async () => {
    mockedUseSession.mockReturnValue({
      loading: false,
      user: onboardedUser,
      logout: vi.fn(),
    });
    mockedNeedsOnboarding.mockReturnValue(true);

    renderRoutes("/app/today");

    expect(await screen.findByText("Onboarding page")).toBeInTheDocument();
  });

  it("shows the branded splash while the session is still bootstrapping", () => {
    mockedUseSession.mockReturnValue({
      loading: true,
      user: null,
      logout: vi.fn(),
    });

    renderRoutes("/app/today");

    expect(screen.getByText("Loading APEX...")).toBeInTheDocument();
  });
});

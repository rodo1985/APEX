import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsPage } from "./SettingsPage";
import type { UserProfile } from "../lib/types";

const mockedUseSession = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
}));

const sessionUser: UserProfile = {
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

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders integration status with deferred providers called out clearly", async () => {
    const user = userEvent.setup();
    const api = {
      getIntegrations: vi.fn().mockResolvedValue({
        strava: {
          connected: true,
          athlete_name: "Demo Athlete",
          last_sync: "2026-04-03T07:00:00Z",
        },
        google_calendar: { connected: false, email: null, last_sync: null },
        apple_health: { connected: false, last_sync: null },
      }),
      disconnectStrava: vi.fn(),
    };
    mockedUseSession.mockReturnValue({
      api,
      refreshProfile: vi.fn(),
      saveOnboarding: vi.fn(),
      user: sessionUser,
    });

    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: /integrations/i }));
    expect(await screen.findByText("Connected as Demo Athlete")).toBeInTheDocument();
    expect(screen.getAllByText("Deferred")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
  });
});

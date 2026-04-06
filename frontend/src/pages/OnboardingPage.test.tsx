import { describe, expect, it } from "vitest";

import { createInitialOnboardingProfile, DEFAULT_ONBOARDING_SPORTS } from "./OnboardingPage";
import type { UserProfile } from "../lib/types";

const baseUser: UserProfile = {
  user_id: "user-1",
  name: "Demo Athlete",
  email: "demo@example.com",
  avatar_url: null,
  sports: [],
  ftp: null,
  lthr: null,
  weight_kg: null,
  height_cm: null,
  daily_calorie_target: 2300,
  macro_targets: { protein_g: 140, carbs_g: 260, fat_g: 65 },
  timezone: "Europe/Madrid",
  created_at: "2026-04-03T07:00:00Z",
  active_goal: null,
};

describe("createInitialOnboardingProfile", () => {
  it("preselects the starter sports for brand-new athletes", () => {
    expect(createInitialOnboardingProfile(baseUser).sports).toEqual(DEFAULT_ONBOARDING_SPORTS);
  });

  it("preserves an existing athlete's saved sports", () => {
    expect(
      createInitialOnboardingProfile({
        ...baseUser,
        sports: ["running"],
      }).sports,
    ).toEqual(["running"]);
  });
});

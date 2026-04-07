import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./AppShell";
import type { UserProfile } from "../lib/types";

const mockedUseSession = vi.fn();

vi.mock("../lib/auth", () => ({
  useSession: () => mockedUseSession(),
}));

vi.mock("./CoachDock", () => ({
  CoachDock: () => <div>Coach dock</div>,
}));

const user: UserProfile = {
  user_id: "user-1",
  name: "Demo Athlete",
  email: "demo@example.com",
  avatar_url: null,
  sports: ["cycling"],
  ftp: 280,
  lthr: 172,
  weight_kg: 68,
  height_cm: 178,
  daily_calorie_target: 2400,
  macro_targets: { protein_g: 150, carbs_g: 300, fat_g: 70 },
  timezone: "Europe/Madrid",
  created_at: "2026-04-05T08:00:00Z",
  active_goal: null,
};

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/app/today"]}>
      <Routes>
        <Route path="/app" element={<AppShell />}>
          <Route path="today" element={<div>Dashboard page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSession.mockReturnValue({
      user,
      logout: vi.fn(),
    });
    window.localStorage.clear();
  });

  it("lets the user collapse the sidebar and keeps topbar controls reachable", async () => {
    const userEventInstance = userEvent.setup();

    renderShell();

    expect(screen.getByLabelText("Collapse sidebar")).toBeInTheDocument();
    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Log out").length).toBeGreaterThan(0);

    await userEventInstance.click(screen.getByLabelText("Collapse sidebar"));

    expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
    expect(screen.getByLabelText("Hide APEX coach")).toBeInTheDocument();
  });
});

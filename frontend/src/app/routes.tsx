import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { needsOnboarding, useSession } from "../lib/auth";
import { CoachPage } from "../pages/CoachPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";
import { StravaCallbackPage } from "../pages/StravaCallbackPage";
import { TodayPage } from "../pages/TodayPage";
import { FoodLogPage } from "../pages/FoodLogPage";
import { TrainingPage } from "../pages/TrainingPage";

export function AppRoutes() {
  const { loading, user } = useSession();
  const location = useLocation();

  if (loading) {
    return <div className="screen-state">Loading APEX...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={needsOnboarding(user) ? "/onboarding" : "/app/today"} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={needsOnboarding(user) ? "/onboarding" : "/app/today"} replace /> : <RegisterPage />} />
      <Route path="/auth/strava/callback" element={user ? <StravaCallbackPage /> : <Navigate to="/login" replace />} />
      <Route
        path="/onboarding"
        element={
          user ? (
            needsOnboarding(user) || location.state?.forceOnboarding ? <OnboardingPage /> : <Navigate to="/app/today" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/app"
        element={user ? <AppShell /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/app/today" replace />} />
        <Route path="today" element={needsOnboarding(user) ? <Navigate to="/onboarding" replace /> : <TodayPage />} />
        <Route path="log" element={needsOnboarding(user) ? <Navigate to="/onboarding" replace /> : <FoodLogPage />} />
        <Route path="train" element={needsOnboarding(user) ? <Navigate to="/onboarding" replace /> : <TrainingPage />} />
        <Route path="coach" element={needsOnboarding(user) ? <Navigate to="/onboarding" replace /> : <CoachPage />} />
        <Route path="settings" element={needsOnboarding(user) ? <Navigate to="/onboarding" replace /> : <SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

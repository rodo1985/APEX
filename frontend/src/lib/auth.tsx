import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { createApiClient } from "./api";
import type { GoalPayload, UserProfile } from "./types";

const ACCESS_TOKEN_KEY = "apex.accessToken";
const REFRESH_TOKEN_KEY = "apex.refreshToken";
const SESSION_BOOTSTRAP_TIMEOUT_MS = 5000;

interface SessionContextValue {
  api: ReturnType<typeof createApiClient>;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  saveOnboarding: (
    payload: Partial<UserProfile> & { active_goal?: GoalPayload | null },
  ) => Promise<UserProfile>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function loadStoredValue(key: string): string | null {
  return window.localStorage.getItem(key);
}

function storeTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function needsOnboarding(user: UserProfile | null): boolean {
  if (!user) {
    return true;
  }

  return !user.weight_kg || !user.height_cm || !user.active_goal || user.sports.length === 0;
}

/**
 * Resolves a promise or rejects when the bootstrap window takes too long.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(() => loadStoredValue(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => loadStoredValue(REFRESH_TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleTokens = useCallback(
    (tokens: { accessToken: string | null; refreshToken: string | null }) => {
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      storeTokens(tokens.accessToken, tokens.refreshToken);
    },
    [],
  );

  const handleLogoutState = useCallback(() => {
    setUser(null);
    handleTokens({ accessToken: null, refreshToken: null });
  }, [handleTokens]);

  const api = useMemo(
    () =>
      createApiClient({
        getTokens: () => ({ accessToken, refreshToken }),
        onTokens: handleTokens,
        onLogout: handleLogoutState,
      }),
    [accessToken, refreshToken, handleLogoutState, handleTokens],
  );

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      setUser(null);
      return null;
    }

    const profile = await api.getProfile();
    setUser(profile);
    return profile;
  }, [accessToken, api]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!accessToken) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await withTimeout(
          api.getProfile(),
          SESSION_BOOTSTRAP_TIMEOUT_MS,
          "Timed out while restoring the local APEX session.",
        );
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        if (!cancelled) {
          // A stale or hanging bootstrap request should never trap the app on
          // the splash screen. Clear the session and return the user to the
          // normal unauthenticated flow instead.
          handleLogoutState();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [accessToken, api, handleLogoutState]);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const response = await api.login(payload);
      handleTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      const profile = await api.getProfile();
      setUser(profile);
    },
    [api, handleTokens],
  );

  const register = useCallback(
    async (payload: { email: string; password: string; name: string }) => {
      const response = await api.register(payload);
      handleTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      const profile = await api.getProfile();
      setUser(profile);
    },
    [api, handleTokens],
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      await api.logout(refreshToken).catch(() => undefined);
    }
    handleLogoutState();
  }, [api, handleLogoutState, refreshToken]);

  const saveOnboarding = useCallback(
    async (payload: Partial<UserProfile> & { active_goal?: GoalPayload | null }) => {
      const profile = await api.updateProfile(payload);
      setUser(profile);
      return profile;
    },
    [api],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      api,
      accessToken,
      refreshToken,
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      saveOnboarding,
    }),
    [
      accessToken,
      api,
      loading,
      login,
      logout,
      refreshProfile,
      refreshToken,
      register,
      saveOnboarding,
      user,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  return context;
}

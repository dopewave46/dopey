import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgencySettings, User } from "./types";
import { api, ApiError, setUnauthorizedHandler } from "./api";
import { setAgency, setCurrentAdmin } from "./session";

/**
 * Authentication + agency identity (Prompt 11 §3).
 *
 * On mount we call `GET /api/auth/me`; a success means the httpOnly session
 * cookie is valid and we render the app, a 401 means we show the login screen.
 * The API client's central 401 handler (any expired call, anywhere) flips this
 * context back to "unauthed" so the guard redirects — never a blank page.
 */

export type AuthStatus = "loading" | "authed" | "unauthed";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  agency: AgencySettings | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface MeResponse {
  user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [agency, setAgencyState] = useState<AgencySettings | null>(null);

  const applySession = useCallback(async () => {
    const [{ user: me }, settings] = await Promise.all([
      api.get<MeResponse>("/auth/me"),
      api.get<AgencySettings>("/settings").catch(() => null),
    ]);
    setUser(me);
    setCurrentAdmin(me);
    const resolvedAgency = settings ?? {
      agencyName: "DopeOrca Technologies",
      location: "Mumbai, India",
      timezone: "Asia/Kolkata",
      currency: "INR" as const,
      admin: me,
    };
    setAgencyState(resolvedAgency);
    setAgency(resolvedAgency);
    setStatus("authed");
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAgencyState(null);
    setStatus("unauthed");
  }, []);

  // Central 401 handler — fires on any unauthorized API response.
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Initial session probe.
  useEffect(() => {
    let cancelled = false;
    applySession().catch((err) => {
      if (cancelled) return;
      if (err instanceof ApiError && err.code !== "unauthorized" && err.code !== "network_error") {
        // Unexpected — still fall back to login rather than trapping the user.
        console.error("auth probe failed", err);
      }
      clearSession();
    });
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      await api.post<{ user: User }>("/auth/login", { email, password });
      setStatus("loading");
      await applySession();
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* already gone — clear locally regardless */
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, agency, login, logout, refresh: applySession }),
    [status, user, agency, login, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

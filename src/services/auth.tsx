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
 * Authentication + agency identity.
 *
 * On mount we call `GET /api/auth/me`:
 *  - success  → render the app ("authed")
 *  - 401      → show the login screen ("unauthed")
 *  - network  → show a "can't reach the server" screen with Retry ("offline") —
 *               the session may be perfectly valid, so we don't log the user out.
 * The API client's central 401 handler flips this back to "unauthed" from
 * anywhere — never a blank page.
 */

export type AuthStatus = "loading" | "authed" | "unauthed" | "offline";

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
    applySession().catch((err: unknown) => {
      if (cancelled) return;
      if (err instanceof ApiError && err.code === "network_error") {
        setStatus("offline");
      } else {
        clearSession();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      await api.post<{ user: User }>("/auth/login", { email, password });
      try {
        await applySession();
      } catch {
        // Login succeeded (cookie set) but the follow-up probe failed — treat as
        // authed and let the shell's own retry handle transient errors.
        setStatus("authed");
      }
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

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      await applySession();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "network_error") setStatus("offline");
      else clearSession();
    }
  }, [applySession, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, agency, login, logout, refresh }),
    [status, user, agency, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PortalClient } from "./types";
import { portalApi, setPortalUnauthorizedHandler } from "./portalApi";
import { ApiError } from "./api";

/**
 * Client-portal authentication — a separate context/session from the admin
 * `AuthProvider` (spec §6). Probes `GET /api/portal/me` on mount; a 401 shows
 * the portal login screen, a network error shows a lightweight retry state.
 */

export type PortalAuthStatus = "loading" | "authed" | "unauthed" | "offline";

interface PortalAuthContextValue {
  status: PortalAuthStatus;
  client: PortalClient | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PortalAuthStatus>("loading");
  const [client, setClient] = useState<PortalClient | null>(null);

  const applySession = useCallback(async () => {
    const { client: me } = await portalApi.get<{ client: PortalClient }>("/me");
    setClient(me);
    setStatus("authed");
  }, []);

  const clearSession = useCallback(() => {
    setClient(null);
    setStatus("unauthed");
  }, []);

  useEffect(() => {
    setPortalUnauthorizedHandler(() => clearSession());
    return () => setPortalUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    applySession().catch((err: unknown) => {
      if (cancelled) return;
      if (err instanceof ApiError && err.code === "network_error") setStatus("offline");
      else clearSession();
    });
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      await portalApi.post<{ client: PortalClient }>("/login", { username, password });
      await applySession();
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await portalApi.post("/logout");
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

  const value = useMemo<PortalAuthContextValue>(
    () => ({ status, client, login, logout, refresh }),
    [status, client, login, logout, refresh],
  );

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error("usePortalAuth must be used within <PortalAuthProvider>");
  return ctx;
}

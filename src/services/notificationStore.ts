import { useEffect, useSyncExternalStore } from "react";
import type { AppNotification } from "./types";
import { api } from "./api";
import type { StoreStatus } from "./storeStatus";

/**
 * Notifications (Prompt 11 §10).
 *
 * Backed by `GET /api/notifications`. The backend's own scheduled job
 * (Prompt 09) evaluates follow-ups / overdue items / renewals; the frontend
 * just polls this list every 60s and refetches after relevant mutations
 * (e.g. adding a lead). Mark-as-read hits `POST /api/notifications/:id/read`
 * and `/read-all`. No WebSockets.
 */

const POLL_MS = 60_000;

interface NotificationState {
  items: AppNotification[];
  status: StoreStatus;
}

let state: NotificationState = { items: [], status: "idle" };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function set(next: Partial<NotificationState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function fetchNow(): Promise<void> {
  try {
    const items = await api.get<AppNotification[]>("/notifications");
    set({ items, status: "ready" });
  } catch {
    if (state.status === "idle") set({ status: "error" });
  }
}

export const notificationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  /** Fetch once now, and start the 60s poll if it isn't already running. */
  start(): void {
    void fetchNow();
    if (!timer) timer = setInterval(() => void fetchNow(), POLL_MS);
  },

  stop(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },

  /** Refetch immediately — call after actions that can create notifications. */
  refresh(): Promise<void> {
    return fetchNow();
  },

  async markRead(id: string): Promise<void> {
    set({ items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) });
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      void fetchNow();
    }
  },

  async markAllRead(): Promise<void> {
    set({ items: state.items.map((n) => ({ ...n, isRead: true })) });
    try {
      await api.post("/notifications/read-all");
    } catch {
      void fetchNow();
    }
  },
};

export function useNotifications() {
  const snap = useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.getSnapshot,
    notificationStore.getSnapshot,
  );

  useEffect(() => {
    notificationStore.start();
  }, []);

  const items = snap.items;
  const unread = items.reduce((n, x) => n + (x.isRead ? 0 : 1), 0);

  return {
    items,
    unread,
    markRead: notificationStore.markRead,
    markAllRead: notificationStore.markAllRead,
    refresh: notificationStore.refresh,
  };
}

/** Where clicking a notification should take you. */
export function notificationHref(n: AppNotification): string {
  switch (n.entityType) {
    case "amc":
      return `/amc/${n.entityId}`;
    case "invoice":
      return `/finance/invoices/${n.entityId}`;
    case "client":
      return `/clients/${n.entityId}`;
    case "project":
      return `/projects/${n.entityId}`;
    case "lead":
      return `/leads/${n.entityId}`;
    default:
      return n.type === "task_overdue" ? "/tasks" : "/notifications";
  }
}

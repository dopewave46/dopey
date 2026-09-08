import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { evaluate } from "../services/notification.service.js";
import { pruneSessions } from "../services/auth.service.js";

/**
 * Scheduled notification evaluation (Prompt 09 §7). A simple interval is
 * sufficient at this stage — a real deployment can move this to a cron worker.
 * No delivery: it only writes Notification rows.
 */
let timer: NodeJS.Timeout | undefined;

export function startNotificationsJob(): void {
  const runOnce = async () => {
    try {
      await evaluate();
      const pruned = await pruneSessions();
      if (pruned) logger.info({ pruned }, "expired sessions pruned");
    } catch (err) {
      logger.error({ err }, "notifications job failed");
    }
  };

  void runOnce(); // run at startup
  timer = setInterval(runOnce, env.NOTIFICATIONS_INTERVAL_MINUTES * 60_000);
  timer.unref?.();
  logger.info({ everyMinutes: env.NOTIFICATIONS_INTERVAL_MINUTES }, "notifications job started");
}

export function stopNotificationsJob(): void {
  if (timer) clearInterval(timer);
}

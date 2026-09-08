import pino from "pino";
import { env, isProd } from "../config/env.js";

/**
 * Structured, leveled logging (Prompt 09 §12). Pretty in development, plain
 * JSON in production for a standard hosting provider's log system. Never logs
 * credentials — auth helpers pass only { email, ok } style metadata.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "passwordHash", "*.password"],
    remove: true,
  },
  transport: isProd
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" } },
});

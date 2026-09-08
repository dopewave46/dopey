import rateLimit from "express-rate-limit";
import type { ErrorEnvelope } from "../types/api.js";

const limitedBody: ErrorEnvelope = {
  error: { message: "Too many requests. Please slow down and try again shortly.", code: "rate_limited" },
};

/** Tight limit on auth — brute-force protection (spec Section O). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedBody,
});

/** Search can be called on every keystroke — keep it generous but bounded. */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedBody,
});

/** Baseline limit for everything else. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedBody,
});

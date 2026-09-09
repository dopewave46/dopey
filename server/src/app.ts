import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { isAllowedOrigin, isProd } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { csrf } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { api } from "./routes/index.js";

/**
 * Express app assembly. Security headers, CORS, cookies, request logging, CSRF,
 * then the API, then the 404 + centralized error handler (must be last).
 */
export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1); // behind a hosting provider's proxy in production

  app.use(
    helmet({
      // API-only server: a strict CSP that blocks everything, plus the headers
      // the spec calls out (HSTS via `hsts`, X-Content-Type-Options via
      // `noSniff`, frame-ancestors via `frameguard`).
      contentSecurityPolicy: { directives: { "default-src": ["'none'"], "frame-ancestors": ["'none'"] } },
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );

  app.use(
    cors({
      // Allow configured origins, plus any localhost port in development.
      // Requests with no Origin header (curl, Postman, same-origin) pass through.
      origin: (origin, cb) => {
        if (!origin || isAllowedOrigin(origin)) return cb(null, true);
        cb(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true, // session + csrf cookies
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    }),
  );

  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));
  app.use(csrf);

  app.use("/api", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (isProd) {
    logger.info("running in production mode — HTTPS termination is expected at the proxy/load balancer");
  }

  return app;
}

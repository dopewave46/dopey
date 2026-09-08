import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { HTTP_STATUS_FOR_CODE, type ErrorEnvelope } from "../types/api.js";
import { logger } from "../utils/logger.js";

/** 404 for unmatched routes — reaches the error handler below. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError("not_found", `No route for ${req.method} ${req.path}.`));
}

/**
 * Centralized error handling (spec Section J/§9). Every error leaves the API in
 * the same shape: `{ error: { message, code, details? } }`. AppErrors carry a
 * safe, human-readable message. Anything else is an unexpected server error —
 * logged in full internally, but the client only ever sees a clean message
 * (never "500 Internal Server Error", per Prompt 02/03).
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const status = HTTP_STATUS_FOR_CODE[err.code];
    if (status >= 500) logger.error({ err, path: req.path }, "app error");
    const body: ErrorEnvelope = { error: { message: err.message, code: err.code, details: err.details } };
    res.status(status).json(body);
    return;
  }

  logger.error({ err, method: req.method, path: req.path }, "unhandled error");
  const body: ErrorEnvelope = {
    error: {
      message: "Something went wrong on our end. Please try again.",
      code: "server_error",
    },
  };
  res.status(500).json(body);
}

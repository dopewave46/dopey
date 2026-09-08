import type { ErrorCode } from "../types/api.js";

/**
 * Typed application errors. Services and middleware throw these; the central
 * error handler (middleware/error-handler.ts) turns them into the standard
 * error envelope with the right HTTP status. Anything that is NOT an AppError
 * is treated as an unexpected server error (logged in full, generic message
 * returned).
 */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Some of the information provided isn't valid.", details?: unknown) {
    super("validation_error", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "You need to sign in to do that.") {
    super("unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have access to that.") {
    super("forbidden", message);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = "That item") {
    super("not_found", `${entity} could not be found.`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", message);
  }
}

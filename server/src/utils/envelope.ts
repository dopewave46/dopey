import type { Response } from "express";
import type { SuccessEnvelope } from "../types/api.js";

/** Send the standard success envelope. */
export function ok<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>): void {
  const body: SuccessEnvelope<T> = meta ? { data, meta } : { data };
  res.status(status).json(body);
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}

export function noContent(res: Response): void {
  res.status(204).end();
}

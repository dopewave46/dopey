import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny, z } from "zod";
import { ValidationError } from "../utils/errors.js";

/**
 * Schema-based request validation (spec Section J/§8). Every endpoint that
 * accepts input runs its Zod schema BEFORE the controller — required fields,
 * types, enums and formats are all enforced here, and a clean field-level
 * error envelope is returned on failure. Never a raw stack trace or a 500.
 */
interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request["query"];
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError("Some of the information provided isn't valid.", err.flatten().fieldErrors));
      } else {
        next(err);
      }
    }
  };
}

/** Reusable primitives shared by resource schemas. */
export const idParam = z.object({ id: z.string().min(1) });
export const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "must be a valid date" });
export const money = z.coerce.number().finite().min(0);
export const optionalString = z.string().trim().min(1).optional();

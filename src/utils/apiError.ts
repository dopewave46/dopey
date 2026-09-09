import { ApiError } from "@/services/api";

/** Human-readable message for a caught API/network error, for toasts. */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.firstFieldError ?? err.message;
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}

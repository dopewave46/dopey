import { apiErrorMessage } from "./apiError";

interface ToastLike {
  error: (title: string, description?: string) => void;
}

/**
 * Fire a store mutation from an event handler and surface any failure as a
 * toast (Prompt 11). Resolves `true` on success, `false` on failure — so a
 * follow-up success toast can be chained with `.then((ok) => ok && …)`.
 */
export function run(
  promise: Promise<unknown>,
  toast: ToastLike,
  failTitle: string,
): Promise<boolean> {
  return promise.then(
    () => true,
    (err: unknown) => {
      toast.error(failTitle, apiErrorMessage(err));
      return false;
    },
  );
}

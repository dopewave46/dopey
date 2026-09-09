import { useAppData } from "@/services/hydration";

/**
 * Prompt 11: reports whether the module stores are still doing their initial
 * load from the API. Kept under the original name so the ~14 pages that call
 * `const loading = useSimulatedLoad()` don't have to change — the skeleton they
 * already render now tracks the real request.
 */
export function useSimulatedLoad(): boolean {
  return useAppData().loading;
}

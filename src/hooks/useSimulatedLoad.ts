import { useEffect, useState } from "react";

/**
 * Briefly reports `loading: true` on mount so pages exercise their skeleton
 * states while the CRM store is still in-memory. A real data fetch replaces
 * this with `useAsyncData` in a later prompt.
 */
export function useSimulatedLoad(ms = 400): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return loading;
}

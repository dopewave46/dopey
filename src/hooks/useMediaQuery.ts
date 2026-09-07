import { useEffect, useState } from "react";

/** Subscribe to a CSS media query. SSR-safe (defaults to false). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Breakpoints — align with the design system responsive rules. */
export const BREAKPOINTS = {
  /** < 640px */
  mobile: "(max-width: 639px)",
  /** 640–1023px */
  tablet: "(min-width: 640px) and (max-width: 1023px)",
  /** <= 1023px — mobile + tablet */
  belowDesktop: "(max-width: 1023px)",
  /** >= 1024px */
  desktop: "(min-width: 1024px)",
} as const;

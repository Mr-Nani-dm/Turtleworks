"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Reactive matchMedia hook with an explicit SSR/hydration snapshot. */
export function useMediaQuery(query: string, serverSnapshot = false): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  const getServerSnapshot = useCallback(
    () => serverSnapshot,
    [serverSnapshot],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

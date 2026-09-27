"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __twReady?: boolean;
  }
}

/** Tells the inline <head> failsafe that the app hydrated, so reveals may stay hidden until scrolled to. */
export function HydrationMark() {
  useEffect(() => {
    window.__twReady = true;
  }, []);
  return null;
}

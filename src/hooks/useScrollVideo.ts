"use client";

import { RefObject, useEffect } from "react";

type Options = {
  /** Active only when true (desktop, motion allowed, video ready). */
  enabled: boolean;
  /** Interpolation factor per frame (0.08–0.12 feels calm). */
  smoothing?: number;
};

/**
 * Maps document scroll progress to a video's currentTime.
 * - requestAnimationFrame driven, no per-frame React state.
 * - Interpolates toward the target to avoid jerky seeking.
 * - Skips seeks when the delta is negligible.
 */
export function useScrollVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled, smoothing = 0.1 }: Options,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;

    let raf = 0;
    let smoothed = 0;
    let target = 0;
    let duration = video.duration || 0;
    const MIN_DELTA = 1 / 60; // seconds; below this, don't seek

    const readTarget = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const onScroll = () => readTarget();
    const onResize = () => readTarget();
    const onMeta = () => {
      duration = video.duration || 0;
    };

    const tick = () => {
      if (!duration) duration = video.duration || 0;
      smoothed += (target - smoothed) * smoothing;
      if (duration) {
        const nextTime = smoothed * duration;
        if (Math.abs(nextTime - video.currentTime) > MIN_DELTA) {
          try {
            video.currentTime = nextTime;
          } catch {
            /* seeking can throw mid-load; ignore */
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    video.addEventListener("loadedmetadata", onMeta);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    readTarget();
    smoothed = target;
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onMeta);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [videoRef, enabled, smoothing]);
}

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
 * - Never queues a seek while the previous one is still decoding.
 * - Sleeps once settled; wakes on scroll or resize.
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
    const MIN_DELTA = 1 / 48; // seconds (half a frame at 24fps); below this, don't seek
    const SETTLED = 0.0005; // progress difference treated as "arrived"

    const readTarget = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };

    const tick = () => {
      raf = 0;
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;

      smoothed += (target - smoothed) * smoothing;
      const nextTime = smoothed * duration;
      if (!video.seeking && Math.abs(nextTime - video.currentTime) > MIN_DELTA) {
        try {
          video.currentTime = nextTime;
        } catch {
          /* seeking can throw mid-load; the next frame retries */
        }
      }
      if (Math.abs(target - smoothed) > SETTLED || video.seeking) wake();
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onChange = () => {
      readTarget();
      wake();
    };

    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange, { passive: true });
    video.addEventListener("loadedmetadata", onChange);

    readTarget();
    smoothed = target;
    wake();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      video.removeEventListener("loadedmetadata", onChange);
    };
  }, [videoRef, enabled, smoothing]);
}

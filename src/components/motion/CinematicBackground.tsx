"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsClient, useMediaQuery } from "@/hooks/useMediaQuery";
import { heroVideo } from "@/data/site";
import { Pause, Play } from "@/components/ui/Icons";

/**
 * Fixed, full-bleed cinematic film, visible across the whole site.
 * - Plays continuously and slowly (ambient loop), muted + playsInline.
 * - Visitors can pause it (WCAG 2.2.2); the choice is remembered.
 * - Pauses while the tab is hidden to save battery and CPU.
 * - Reduced motion or Data Saver: static poster only, nothing downloaded.
 * - The control steps aside while the contact form is on screen.
 */
const SLOW_RATE = 0.33;
const PREF_KEY = "tw-film-paused";
const PREF_EVENT = "tw-film-pref";

// Tiny subscribable store over localStorage for the pause preference.
const pausePref = {
  subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(PREF_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(PREF_EVENT, onChange);
    };
  },
  get() {
    try {
      return window.localStorage.getItem(PREF_KEY) === "1";
    } catch {
      return memoryPaused;
    }
  },
  set(paused: boolean) {
    memoryPaused = paused;
    try {
      window.localStorage.setItem(PREF_KEY, paused ? "1" : "0");
    } catch {
      /* storage unavailable — preference lasts for this visit only */
    }
    window.dispatchEvent(new Event(PREF_EVENT));
  },
};
let memoryPaused = false;

export function CinematicBackground() {
  const isClient = useIsClient();
  const reduced = useReducedMotion();
  // Landscape phones are wide but short: they get the lighter mobile file.
  const isDesktop = useMediaQuery("(min-width: 768px) and (min-height: 560px)");
  const userPaused = useSyncExternalStore(pausePref.subscribe, pausePref.get, () => false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [nearForm, setNearForm] = useState(false);

  const saveData =
    isClient &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const enabled = isClient && !reduced && !saveData;
  const sources = isDesktop ? heroVideo.desktop : heroVideo.mobile;
  const ready = readySrc === sources.mp4;

  const sync = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = SLOW_RATE;
    if (userPaused || document.hidden) {
      v.pause();
    } else {
      v.play().catch(() => {
        /* autoplay blocked until interaction; the poster stays visible */
      });
    }
  }, [userPaused]);

  useEffect(() => {
    if (!enabled) return;
    const v = videoRef.current;
    sync();
    document.addEventListener("visibilitychange", sync);
    v?.addEventListener("loadedmetadata", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      v?.removeEventListener("loadedmetadata", sync);
    };
  }, [enabled, sync, sources]);

  useEffect(() => {
    const contact = document.getElementById("contact");
    if (!enabled || !contact) return;
    const observer = new IntersectionObserver(([entry]) => setNearForm(entry.isIntersecting), {
      rootMargin: "0px 0px -20% 0px",
    });
    observer.observe(contact);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-abyss" aria-hidden>
        {enabled ? (
          <video
            key={sources.mp4}
            ref={videoRef}
            className={`h-full w-full object-cover transition-opacity duration-1000 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            preload={userPaused ? "none" : "auto"}
            autoPlay={!userPaused}
            muted
            loop
            playsInline
            disablePictureInPicture
            tabIndex={-1}
            onLoadedData={() => setReadySrc(sources.mp4)}
          >
            <source src={sources.webm} type="video/webm" />
            <source src={sources.mp4} type="video/mp4" />
          </video>
        ) : null}

        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            !enabled || !ready ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${heroVideo.poster})` }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,9,8,0.55) 0%, rgba(5,9,8,0.28) 45%, rgba(5,9,8,0.18) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: "linear-gradient(to top, rgba(5,9,8,0.8), rgba(5,9,8,0))" }}
        />
      </div>

      {enabled ? (
        <button
          type="button"
          onClick={() => pausePref.set(!userPaused)}
          aria-pressed={userPaused}
          aria-label={userPaused ? "Play background video" : "Pause background video"}
          title={userPaused ? "Play background video" : "Pause background video"}
          tabIndex={nearForm ? -1 : 0}
          aria-hidden={nearForm || undefined}
          className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(220,235,228,0.2)] bg-[rgba(5,9,8,0.82)] text-ivory transition-[opacity,border-color] duration-300 hover:border-amber active:opacity-80 ${
            nearForm ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          {userPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      ) : null}
    </>
  );
}

"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsClient, useMediaQuery } from "@/hooks/useMediaQuery";
import { useScrollVideo } from "@/hooks/useScrollVideo";
import { heroVideo } from "@/data/site";
import { Pause, Play } from "@/components/ui/Icons";

/**
 * Fixed, full-bleed cinematic film, visible across the whole site.
 * - Desktop ("scrub"): the 20s TurtleWorks story advances with page scroll.
 *   Motion is driven by the visitor, so there is nothing to pause.
 * - Small screens ("loop"): a lighter file plays slowly on a loop, with a
 *   pause control (WCAG 2.2.2); the choice is remembered and it pauses while
 *   the tab is hidden.
 * - Reduced motion or Data Saver: static poster only, nothing downloaded.
 */
const LOOP_RATE = 0.33;
const PREF_KEY = "tw-film-paused";
const PREF_EVENT = "tw-film-pref";
const LABEL = "Pause background video";

type FilmMode = "off" | "scrub" | "loop";

// Tiny subscribable store over localStorage for the pause preference.
let memoryPaused = false;
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

const usePaused = () => useSyncExternalStore(pausePref.subscribe, pausePref.get, () => false);

function useFilmMode(): FilmMode {
  const isClient = useIsClient();
  const reduced = useReducedMotion();
  // Landscape phones are wide but short: they get the lighter looping file.
  const isDesktop = useMediaQuery("(min-width: 768px) and (min-height: 560px)");
  const saveData =
    isClient &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  if (!isClient || reduced || saveData) return "off";
  return isDesktop ? "scrub" : "loop";
}

/** Text alternative to the floating control (e.g. in the footer). */
export function FilmToggle({ className = "" }: { className?: string }) {
  const mode = useFilmMode();
  const paused = usePaused();
  if (mode !== "loop") return null;
  return (
    <button
      type="button"
      onClick={() => pausePref.set(!paused)}
      aria-pressed={paused}
      className={`inline-flex min-h-11 items-center gap-2 underline-offset-4 transition-colors hover:text-ivory hover:underline ${className}`}
    >
      {paused ? <Play size={14} /> : <Pause size={14} />}
      {LABEL}
    </button>
  );
}

export function CinematicBackground() {
  const mode = useFilmMode();
  const userPaused = usePaused();
  const portrait = useMediaQuery("(orientation: portrait)");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [nearForm, setNearForm] = useState(false);
  const [controlFocused, setControlFocused] = useState(false);

  const looping = mode === "loop";
  const sources =
    mode === "scrub" ? heroVideo.desktop : portrait ? heroVideo.mobilePortrait : heroVideo.mobile;
  const ready = readySrc === sources.mp4;
  // The control steps aside over the contact form so it can't cover the
  // submit button — but never while it has keyboard focus.
  const tucked = nearForm && !controlFocused;

  useScrollVideo(videoRef, { enabled: mode === "scrub" && ready, smoothing: 0.1 });

  const syncLoop = useCallback(() => {
    const v = videoRef.current;
    if (!v || !looping) return;
    v.playbackRate = LOOP_RATE;
    if (userPaused || document.hidden) {
      v.pause();
    } else {
      v.play().catch(() => {
        /* autoplay blocked until interaction; the poster stays visible */
      });
    }
  }, [looping, userPaused]);

  useEffect(() => {
    if (!looping) return;
    const v = videoRef.current;
    syncLoop();
    document.addEventListener("visibilitychange", syncLoop);
    v?.addEventListener("loadedmetadata", syncLoop);
    return () => {
      document.removeEventListener("visibilitychange", syncLoop);
      v?.removeEventListener("loadedmetadata", syncLoop);
    };
  }, [looping, syncLoop, sources]);

  useEffect(() => {
    const contact = document.getElementById("contact");
    if (!looping || !contact) return;
    const observer = new IntersectionObserver(([entry]) => setNearForm(entry.isIntersecting), {
      rootMargin: "0px 0px -20% 0px",
    });
    observer.observe(contact);
    return () => observer.disconnect();
  }, [looping]);

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-abyss" aria-hidden>
        {mode !== "off" ? (
          <video
            key={sources.mp4}
            ref={videoRef}
            className={`h-full w-full object-cover transition-opacity duration-1000 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            preload={looping && userPaused ? "none" : "auto"}
            autoPlay={looping && !userPaused}
            loop={looping}
            muted
            playsInline
            disablePictureInPicture
            tabIndex={-1}
            onLoadedData={() => setReadySrc(sources.mp4)}
          >
            <source src={sources.webm} type="video/webm" />
            <source src={sources.mp4} type="video/mp4" />
          </video>
        ) : null}

        {/* Poster: CSS picks the portrait still on phones, so the right image
            shows even before hydration and whenever autoplay is blocked. */}
        <div
          className={`film-poster absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            mode === "off" || !ready ? "opacity-100" : "opacity-0"
          }`}
          style={
            {
              "--poster": `url(${heroVideo.poster})`,
              "--poster-mobile": `url(${heroVideo.posterMobile})`,
            } as CSSProperties
          }
        />

        {/* Legibility scrims. Desktop: copy sits left, so darken left → right.
            Phones: copy sits low, so keep the top clear for the turtle and
            darken towards the bottom. */}
        <div className="film-scrim absolute inset-0" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: "linear-gradient(to top, rgba(5,9,8,0.8), rgba(5,9,8,0))" }}
        />
      </div>

      {looping ? (
        <button
          type="button"
          onClick={() => pausePref.set(!userPaused)}
          onFocus={() => setControlFocused(true)}
          onBlur={() => setControlFocused(false)}
          data-film-toggle
          aria-pressed={userPaused}
          aria-label={LABEL}
          title={userPaused ? "Play background video" : LABEL}
          tabIndex={tucked ? -1 : 0}
          aria-hidden={tucked || undefined}
          className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(220,235,228,0.2)] bg-[rgba(5,9,8,0.82)] text-ivory transition-[opacity,border-color] duration-300 hover:border-amber active:opacity-80 ${
            tucked ? "pointer-events-none opacity-0" : "opacity-100"
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

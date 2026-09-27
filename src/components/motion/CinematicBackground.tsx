"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { heroVideo } from "@/data/site";

/**
 * Fixed, full-bleed cinematic background, visible across the whole site.
 * - Plays continuously and slowly (ambient loop), muted + playsInline.
 * - Uses the mobile asset on small screens, desktop asset otherwise.
 * - Reduced motion: static poster frame only (no playback).
 */
const SLOW_RATE = 0.33;

export function CinematicBackground() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPlay(!reduced);
    setIsMobile(!window.matchMedia("(min-width: 768px)").matches);
  }, [reduced]);

  const src = isMobile ? heroVideo.mobile : heroVideo.desktop;

  // Keep the slow, continuous playback going.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!play) {
      v.pause();
      return;
    }
    v.playbackRate = SLOW_RATE;
    const start = () => {
      v.playbackRate = SLOW_RATE;
      v.play().catch(() => {
        /* autoplay may be blocked until interaction; poster remains */
      });
    };
    start();
    v.addEventListener("loadedmetadata", start);
    return () => v.removeEventListener("loadedmetadata", start);
  }, [play, src, ready]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-abyss">
      {play ? (
        <video
          key={src}
          ref={videoRef}
          className={`h-full w-full object-cover transition-opacity duration-1000 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
          poster={heroVideo.poster}
          preload="auto"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      {/* Static poster fallback (reduced motion, or until the video is ready) */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          !play || !ready ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${heroVideo.poster})` }}
      />

      {/* Gentle, even contrast layer so text stays readable anywhere over the film. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,9,8,0.55) 0%, rgba(5,9,8,0.28) 45%, rgba(5,9,8,0.18) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(to top, rgba(5,9,8,0.8), rgba(5,9,8,0))",
        }}
      />
    </div>
  );
}

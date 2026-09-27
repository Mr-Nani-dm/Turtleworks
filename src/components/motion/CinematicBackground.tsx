"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScrollVideo } from "@/hooks/useScrollVideo";
import { heroVideo } from "@/data/site";

const MOBILE_RATE = 0.33;

/**
 * Fixed, full-bleed cinematic background.
 * - Desktop: the 20s TurtleWorks narrative is scrubbed by page scroll.
 * - Mobile: a lighter asset plays slowly/ambiently for stability.
 * - Reduced motion: static poster only; the video element is never mounted.
 */
export function CinematicBackground() {
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)", true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);

  const src = isMobile ? heroVideo.mobile : heroVideo.desktop;
  const ready = readySrc === src;
  const scrollDriven = !reduced && !isMobile;

  useScrollVideo(videoRef, {
    enabled: scrollDriven && ready,
    smoothing: 0.1,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced || !isMobile) {
      video?.pause();
      return;
    }

    const start = () => {
      video.playbackRate = MOBILE_RATE;
      video.play().catch(() => {
        // Autoplay can be blocked until interaction; the poster remains visible.
      });
    };

    start();
    video.addEventListener("loadedmetadata", start);
    return () => video.removeEventListener("loadedmetadata", start);
  }, [isMobile, reduced, src]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-abyss">
      {!reduced ? (
        <video
          key={src}
          ref={videoRef}
          className={
            "h-full w-full object-cover transition-opacity duration-1000 " +
            (ready ? "opacity-100" : "opacity-0")
          }
          poster={heroVideo.poster}
          preload="auto"
          autoPlay={isMobile}
          muted
          loop={isMobile}
          playsInline
          disablePictureInPicture
          onLoadedData={() => setReadySrc(src)}
          onCanPlay={() => setReadySrc(src)}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      <div
        aria-hidden
        className={
          "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 " +
          (reduced || !ready ? "opacity-100" : "opacity-0")
        }
        style={{ backgroundImage: "url(" + heroVideo.poster + ")" }}
      />

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

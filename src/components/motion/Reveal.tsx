"use client";

import { ElementType, ReactNode } from "react";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger delay in ms. */
  delay?: number;
};

/**
 * Subtle reveal: opacity 0 -> 1, translateY(22px) -> 0.
 * Respects prefers-reduced-motion via CSS (transition removed).
 */
export function Reveal({ children, as: Tag = "div", className = "", delay = 0 }: RevealProps) {
  const { ref, visible } = useIntersectionReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

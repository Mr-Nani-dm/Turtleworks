import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "./Icons";

type Variant = "primary" | "ghost";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Opens in a new tab (booking pages, external tools). */
  external?: boolean;
};

const base =
  "group inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium " +
  "transition-[transform,background-color,border-color,color] duration-300 ease-out " +
  "hover:-translate-y-0.5 active:translate-y-0 active:opacity-85 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3";

const variants: Record<Variant, string> = {
  primary:
    "bg-ivory text-abyss [text-shadow:none] hover:bg-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]",
  ghost:
    "text-ivory border border-[rgba(220,235,228,0.28)] bg-[rgba(8,19,15,0.6)] " +
    "hover:border-amber hover:bg-[rgba(8,19,15,0.78)]",
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`;
  const Icon = external ? ArrowUpRight : ArrowRight;
  const inner = (
    <>
      <span>{children}</span>
      <Icon className="transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
    </>
  );

  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {inner}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  if (href.startsWith("#") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

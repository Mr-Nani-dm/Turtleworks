import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "ghost";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const base =
  "group inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium " +
  "transition-[transform,background-color,border-color,color] duration-300 ease-out " +
  "will-change-transform hover:-translate-y-0.5 active:translate-y-0 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3";

const variants: Record<Variant, string> = {
  primary:
    "bg-ivory text-abyss hover:bg-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset]",
  ghost:
    "text-ivory border border-[rgba(220,235,228,0.22)] hover:border-amber " +
    "hover:text-white bg-[rgba(8,19,15,0.35)] backdrop-blur-sm",
};

export function Button({ href, children, variant = "primary", className = "" }: ButtonProps) {
  const isAnchor = href.startsWith("#");
  const cls = `${base} ${variants[variant]} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      <span
        aria-hidden
        className="transition-transform duration-300 ease-out group-hover:translate-x-1"
      >
        &rarr;
      </span>
    </>
  );

  if (isAnchor) {
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

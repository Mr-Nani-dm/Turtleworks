import { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

/** Section kicker with a short gold rule — threads the brand gold consistently. */
export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <p className={`flex items-center gap-3 ${className}`}>
      <span
        aria-hidden
        className="h-px w-8 bg-gradient-to-r from-amber to-transparent"
      />
      <span className="eyebrow">{children}</span>
    </p>
  );
}

type GoldMarkProps = {
  className?: string;
  /** Pixel size of the square glyph. */
  size?: number;
};

/**
 * The TurtleWorks gold shell-scute — an abstract, geometric echo of the single
 * gold panel in the official logo. Used as a small recurring brand object.
 * Decorative only.
 */
export function GoldMark({ className = "", size = 28 }: GoldMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Rounded shell scute */}
      <path
        d="M8 7.5C13 5 19 5 24 7.5C26 13 25 20 21.5 24.5C16 26.5 10 26 6.5 22.5C5 17 5.5 11 8 7.5Z"
        fill="var(--color-amber)"
      />
      {/* Inner seam, like the shell segmentation */}
      <path
        d="M10.5 10C14.5 8.5 18.5 8.8 22 11"
        stroke="rgba(5,9,8,0.35)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

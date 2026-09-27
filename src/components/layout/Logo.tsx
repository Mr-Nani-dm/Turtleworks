import Image from "next/image";
import mark from "../../../public/brand/turtleworks-mark.png";

type LogoProps = {
  /** Show the wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
};

/**
 * Official TurtleWorks mark (unmodified) framed on its native ivory tile,
 * paired with the wordmark. The artwork itself is never redrawn.
 */
export function Logo({ withWordmark = true, className = "" }: LogoProps) {
  return (
    <span className={"inline-flex items-center gap-3 " + className}>
      <Image
        src={mark}
        alt={withWordmark ? "" : "TurtleWorks"}
        width={40}
        height={40}
        className="h-9 w-9 rounded-lg bg-ivory object-cover ring-1 ring-[rgba(220,235,228,0.15)]"
      />
      {withWordmark ? (
        <span className="font-display text-[1.05rem] font-semibold tracking-tight text-ivory">
          TurtleWorks
        </span>
      ) : null}
    </span>
  );
}

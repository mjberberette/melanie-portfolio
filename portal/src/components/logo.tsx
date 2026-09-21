import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * The Berberette monogram, drawn on the way the portfolio's nav logo is.
 *
 * melanieberberette.design plays a Lottie rig (`/logo/mb-monogram-alpha.json`)
 * once on load: the M's wedge and three arms, then the B, are each wiped in
 * top-to-bottom while the whole mark settles from 104.5% to 100%. The five
 * pieces below are that rig's shape layers verbatim (comp coordinates, viewBox
 * cropped to the ink), and the delays/durations are its keyframes at 60 fps
 * divided by the site's 1.6× playback speed. The wipes and settle are plain
 * CSS (`.logo-mark*` in globals.css), so the portal ships no Lottie runtime.
 */
const PARTS: { name: string; d: string; delay: number; duration: number }[] = [
  {
    name: "wedge",
    d: "M632.51 311.53L538.54 259.2L538.52 319.44L568.2 336.58L624.41 368.47L656.07 386.38L766.71 386.85Z",
    delay: 0.125,
    duration: 0.271,
  },
  {
    name: "m-arm-1",
    d: "M538.54 259.2L484.47 289.23L313.33 385.24L313.29 688.45L367.68 719.39L367.68 416.1L538.52 319.44Z",
    delay: 0.354,
    duration: 0.479,
  },
  {
    name: "m-arm-2",
    d: "M568.2 336.58L401.73 432.68L401.75 738.82L455.89 769.78L455.99 465.03L509.38 434.51L624.41 368.47Z",
    delay: 0.771,
    duration: 0.396,
  },
  {
    name: "m-arm-3",
    d: "M656.07 386.38L490.31 482.05L490.35 789.86L544.72 820.8L544.72 514.57L766.71 386.85Z",
    delay: 1.104,
    duration: 0.375,
  },
  {
    name: "b",
    d:
      "M745.26 581.05L763.95 550.2L763.82 456.28C763.82 449.78 758.32 444.51 754.2 442.38C747.77 439.07 741.55 440.1 735.66 443.01L703.86 461.44L578.98 533.05L579.08 813.08L750.11 714.88C757.49 710.64 763.82 704.65 763.82 695.22L763.99 598.39L745.24 581.03Z" +
      "M709.43 676.7L633.41 720.3L633.31 664.09L709.11 620.24Z" +
      "M633.37 563.61L709.34 519.97L709.38 546.32L698.52 564.62L633.56 602.02Z",
    delay: 1.875,
    duration: 0.646,
  },
];

/** Ink bounds of the mark inside the 1080 × 1080 Lottie comp. */
export const LOGO_VIEWBOX = "313 259 454 562";

export function LogoMark({
  className,
  animate = true,
}: {
  className?: string;
  /** Play the draw-on entrance once on mount. Off = render the finished mark. */
  animate?: boolean;
}) {
  return (
    <span className={cn("logo-mark", animate && "logo-mark--animate", className)} aria-hidden>
      <svg viewBox={LOGO_VIEWBOX} fill="currentColor" fillRule="evenodd" focusable="false">
        {PARTS.map((part) => (
          <path
            key={part.name}
            d={part.d}
            style={{ "--logo-delay": `${part.delay}s`, "--logo-duration": `${part.duration}s` } as CSSProperties}
          />
        ))}
      </svg>
    </span>
  );
}

const SIZES = {
  sm: { mark: "h-6", gap: "gap-2.5" },
  md: { mark: "h-7", gap: "gap-3" },
  lg: { mark: "h-8", gap: "gap-3" },
} as const;

export function Logo({
  href,
  size = "md",
  wordmark = true,
  animate = true,
  className,
}: {
  /** Where the logo leads: `/` inside the portal, `/login` on the auth pages. Omit for a plain, non-interactive mark. */
  href?: string;
  size?: keyof typeof SIZES;
  /** Show the "Client portal" eyebrow beside the mark. */
  wordmark?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const classes = cn("logo inline-flex items-center text-bone", SIZES[size].gap, className);
  const content = (
    <>
      <LogoMark className={SIZES[size].mark} animate={animate} />
      {wordmark && <span className="eyebrow text-bone">Client portal</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={wordmark ? undefined : "Client portal — home"}>
        {content}
      </Link>
    );
  }
  return <span className={classes}>{content}</span>;
}

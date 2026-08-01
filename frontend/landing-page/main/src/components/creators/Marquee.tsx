"use client";

import type { ReactNode } from "react";

type MarqueeProps = {
  children: ReactNode;
  /** seconds for one full loop; lower = faster */
  speed?: number;
  /** scroll direction */
  reverse?: boolean;
  /** pause the animation when the pointer is over the strip */
  pauseOnHover?: boolean;
  /** gap between items, tailwind gap class */
  gapClassName?: string;
  className?: string;
};

/**
 * Seamless, infinitely auto-scrolling horizontal strip.
 *
 * The children are rendered twice back-to-back and the track is translated by
 * exactly -50%, so the loop is perfectly continuous with no visible jump. Edges
 * fade out via a mask so items appear to flow in and out.
 */
export default function Marquee({
  children,
  speed = 32,
  reverse = false,
  pauseOnHover = true,
  gapClassName = "gap-4",
  className = "",
}: MarqueeProps) {
  return (
    <div
      className={`group relative w-full overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div
        className={`flex w-max ${gapClassName} ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        }`}
        style={{
          animationName: reverse ? "dt-marquee-reverse" : "dt-marquee",
          animationDuration: `${speed}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
        }}
      >
        <div className={`flex ${gapClassName} shrink-0`}>{children}</div>
        <div className={`flex ${gapClassName} shrink-0`} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

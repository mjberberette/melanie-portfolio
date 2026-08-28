"use client";

import { useRef } from "react";
import { useReducedMotion } from "motion/react";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { marquee } from "@/lib/content";

/**
 * Infinite ticker whose speed and skew react to scroll velocity.
 */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      const track = root.current?.querySelector<HTMLElement>("[data-track]");
      if (!track || reduceMotion) return;

      const half = track.scrollWidth / 2;
      const tween = gsap.to(track, {
        x: -half,
        duration: 26,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (value) => `${parseFloat(value) % half}px`,
        },
      });

      // Velocity decays every frame so the skew always settles back to zero
      // once the visitor stops scrolling.
      let velocity = 0;
      const setSkew = gsap.quickSetter(track, "skewX", "deg");

      const trigger = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          velocity = self.getVelocity();
        },
      });

      const decay = () => {
        velocity *= 0.88;
        if (Math.abs(velocity) < 1) velocity = 0;
        setSkew(gsap.utils.clamp(-7, 7, -velocity / 320));
        tween.timeScale(
          gsap.utils.clamp(0.35, 4.5, 1 + Math.abs(velocity) / 1100),
        );
      };

      gsap.ticker.add(decay);

      return () => {
        gsap.ticker.remove(decay);
        tween.kill();
        trigger.kill();
      };
    },
    { dependencies: [reduceMotion], scope: root },
  );

  const items = [...marquee, ...marquee];

  return (
    <div
      ref={root}
      className="relative border-y border-hairline bg-ink-raised/40 py-6 md:py-8"
      aria-hidden
    >
      <div className="mask-fade-x overflow-hidden">
        <div data-track className="flex w-max items-center gap-10 will-change-transform">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-10">
              <span className="display text-[clamp(1.5rem,3.2vw,2.6rem)] whitespace-nowrap text-bone/85">
                {item}
              </span>
              <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-vermilion" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

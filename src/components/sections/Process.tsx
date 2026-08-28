"use client";

import { useRef } from "react";
import { useReducedMotion } from "motion/react";

import { RevealBlock, RevealLines } from "@/components/motion/Reveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { process } from "@/lib/content";

export function Process() {
  const root = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.fromTo(
        "[data-progress-line]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: {
            trigger: "[data-steps]",
            start: "top 70%",
            end: "bottom 80%",
            scrub: 0.6,
          },
        },
      );
    },
    { dependencies: [reduceMotion], scope: root },
  );

  return (
    <section
      ref={root}
      className="relative border-t border-hairline py-24 md:py-36"
    >
      <div className="shell">
        <div className="mb-16 flex flex-col gap-6 md:mb-24 md:flex-row md:items-end md:justify-between">
          <div>
            <RevealBlock>
              <p className="eyebrow mb-6">
                <span className="text-vermilion">04</span> — Process
              </p>
            </RevealBlock>
            <RevealLines
              as="h2"
              className="display max-w-[14ch] text-[clamp(2rem,5vw,3.8rem)]"
            >
              Four moves, repeated until it ships
            </RevealLines>
          </div>
          <RevealBlock delay={0.08}>
            <p className="max-w-xs text-sm leading-relaxed text-bone-dim">
              No black boxes and no three-week silences. You will always
              know what I am working on and what I need from you next.
            </p>
          </RevealBlock>
        </div>

        <div data-steps className="relative grid gap-px md:grid-cols-4">
          <div
            aria-hidden
            className="absolute top-0 left-0 h-full w-px bg-hairline md:hidden"
          >
            <span
              data-progress-line
              className="absolute inset-0 block w-px origin-top bg-vermilion"
            />
          </div>

          {process.map((item, index) => (
            <RevealBlock
              key={item.step}
              delay={index * 0.08}
              className="relative pl-8 md:pl-0"
            >
              <div className="h-full border-t border-hairline pt-6 md:pr-8">
                <div className="mb-8 flex items-center gap-3">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-vermilion">
                    {item.step}
                  </span>
                  <span className="h-px flex-1 bg-hairline" />
                </div>
                <h3 className="display mb-4 text-2xl md:text-[1.7rem]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-bone-dim">
                  {item.body}
                </p>
              </div>
            </RevealBlock>
          ))}
        </div>
      </div>
    </section>
  );
}

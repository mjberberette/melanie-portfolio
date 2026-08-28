"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";

import { LocalTime } from "@/components/site/LocalTime";
import { useIntro } from "@/components/providers/intro-context";
import { gsap, useGSAP } from "@/lib/gsap";
import { hero, site } from "@/lib/content";

const MonogramScene = dynamic(() => import("@/components/three/MonogramScene"), {
  ssr: false,
});

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const { revealed } = useIntro();
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();

  useGSAP(
    () => {
      if (!headline.current) return;
      const lines = headline.current.querySelectorAll<HTMLElement>(
        "[data-hero-line] > span",
      );
      const fades = root.current?.querySelectorAll<HTMLElement>("[data-hero-fade]");

      if (reduceMotion) {
        gsap.set([...lines, ...(fades ? Array.from(fades) : [])], {
          yPercent: 0,
          autoAlpha: 1,
        });
        return;
      }

      gsap.set(lines, { yPercent: 120 });
      gsap.set(fades ?? [], { autoAlpha: 0, y: 24 });

      if (!revealed) return;

      const tl = gsap.timeline({ delay: 0.15 });
      tl.to(lines, {
        yPercent: 0,
        duration: 1.25,
        stagger: 0.09,
        ease: "mb-out",
      }).to(
        fades ?? [],
        { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "mb-out" },
        "-=0.85",
      );
    },
    { dependencies: [revealed, reduceMotion], scope: root },
  );

  // Parallax: type drifts up faster than the section, mark trails behind.
  useGSAP(
    () => {
      if (reduceMotion || !root.current) return;
      gsap.to("[data-hero-parallax]", {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
      gsap.to("[data-hero-chrome]", {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "40% top",
          scrub: true,
        },
      });
    },
    { dependencies: [reduceMotion], scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-28 pb-8 md:pt-32 md:pb-10 grain"
    >
      {/* Ambient wash behind the mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px] md:left-[68%]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,74,28,0.22) 0%, rgba(255,74,28,0.05) 45%, transparent 70%)",
        }}
      />

      <div className="shell relative z-10 flex w-full items-start justify-between gap-6">
        <p data-hero-fade className="eyebrow max-w-[16ch] md:max-w-none">
          {hero.eyebrow}
        </p>
        <div
          data-hero-fade
          className="flex flex-col items-end gap-1 text-right font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase"
        >
          <span>{site.location}</span>
          <LocalTime />
        </div>
      </div>

      <MonogramScene className="pointer-events-none relative z-0 h-[34svh] w-full shrink-0 lg:absolute lg:inset-y-0 lg:right-[-6%] lg:h-full lg:w-[58%]" />

      <div
        data-hero-parallax
        className="shell relative z-10 flex flex-1 flex-col justify-center py-6 lg:py-10"
      >
        <h1
          ref={headline}
          className="display max-w-[15ch] text-[clamp(2.6rem,11vw,4.5rem)] lg:max-w-none lg:text-[7.4vw]"
        >
          {hero.lines.map((line, index) => (
            <span
              key={line}
              data-hero-line
              className="block overflow-hidden py-[0.04em]"
            >
              <span className="block">
                {index === 1 ? (
                  <>
                    designer{" "}
                    <span className="font-serif font-normal italic tracking-[-0.02em] text-vermilion">
                      for
                    </span>
                  </>
                ) : (
                  line
                )}
              </span>
            </span>
          ))}
        </h1>
      </div>

      <div className="shell relative z-10 flex w-full flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <p
          data-hero-fade
          className="max-w-md text-pretty text-[15px] leading-relaxed text-bone-dim md:text-base"
        >
          {hero.standfirst}
        </p>

        <button
          type="button"
          data-hero-fade
          data-hero-chrome
          onClick={() =>
            lenis?.scrollTo("#studio", { duration: 1.6, offset: -40 })
          }
          className="group flex items-center gap-3 self-start font-mono text-[10px] tracking-[0.22em] text-bone-dim uppercase transition-colors hover:text-bone md:self-auto"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong">
            <motion.span
              animate={reduceMotion ? {} : { y: [-3, 3, -3] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="block"
            >
              <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
                <path
                  d="M4.5 0v10.5M0.5 7l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </motion.span>
          </span>
          {hero.scrollCue}
        </button>
      </div>
    </section>
  );
}

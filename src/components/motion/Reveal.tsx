"use client";

import { useRef, type ElementType } from "react";
import { useReducedMotion } from "motion/react";

import { useIntro } from "@/components/providers/intro-context";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  /** Delay in seconds after the trigger fires. */
  delay?: number;
  stagger?: number;
  /** Wait for the preloader curtain instead of a scroll trigger. */
  onIntro?: boolean;
  start?: string;
};

/**
 * Line-by-line masked reveal. Lines are re-split on resize via autoSplit.
 */
export function RevealLines({
  children,
  className,
  as: Tag = "div",
  delay = 0,
  stagger = 0.08,
  onIntro = false,
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { revealed } = useIntro();

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      if (reduceMotion) {
        gsap.set(element, { autoAlpha: 1 });
        return;
      }
      if (onIntro && !revealed) {
        gsap.set(element, { autoAlpha: 0 });
        return;
      }

      const split = SplitText.create(element, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        linesClass: "split-line",
        onSplit(self) {
          gsap.set(element, { autoAlpha: 1 });
          return gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.1,
            delay,
            stagger,
            ease: "mb-out",
            scrollTrigger: onIntro
              ? undefined
              : { trigger: element, start, once: true },
          });
        },
      });

      return () => split.revert();
    },
    { dependencies: [reduceMotion, revealed, onIntro], scope: ref },
  );

  return (
    // @ts-expect-error -- polymorphic ref
    <Tag ref={ref} className={cn("invisible", className)}>
      {children}
    </Tag>
  );
}

/**
 * Words brighten one after another as the block scrolls through the viewport.
 */
export function RevealWords({
  children,
  className,
  as: Tag = "p",
}: {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      const element = ref.current;
      if (!element || reduceMotion) return;

      const split = SplitText.create(element, {
        type: "words",
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.6,
              scrollTrigger: {
                trigger: element,
                start: "top 78%",
                end: "bottom 55%",
                scrub: 0.6,
              },
            },
          );
        },
      });

      return () => split.revert();
    },
    { dependencies: [reduceMotion], scope: ref },
  );

  return (
    // @ts-expect-error -- polymorphic ref
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Generic block reveal for images, cards and rules.
 */
export function RevealBlock({
  children,
  className,
  delay = 0,
  y = 48,
  start = "top 88%",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      if (reduceMotion) {
        gsap.set(element, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        element,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.2,
          delay,
          ease: "mb-out",
          scrollTrigger: { trigger: element, start, once: true },
        },
      );
    },
    { dependencies: [reduceMotion], scope: ref },
  );

  return (
    <div ref={ref} className={cn("invisible", className)}>
      {children}
    </div>
  );
}

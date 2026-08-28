"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useIntro } from "@/components/providers/intro-context";
import { site } from "@/lib/content";

const HOLD_MS = 2350;

export function Preloader() {
  const { revealed, setRevealed } = useIntro();
  const reduceMotion = useReducedMotion();
  const lottieHost = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    document.documentElement.style.overflow = "hidden";
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / HOLD_MS, 1);
      // Ease-out so the counter decelerates into 100 instead of ending abruptly.
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * 100));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = "";
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !lottieHost.current) return;
    let animation: { destroy: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      const lottie = (await import("lottie-web")).default;
      if (cancelled || !lottieHost.current) return;

      const instance = lottie.loadAnimation({
        container: lottieHost.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/logo/mb-monogram-alpha.json",
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      instance.setSpeed(2.6);
      animation = instance;
    })();

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.documentElement.style.overflow = "";
        setRevealed(true);
      }}
    >
      {!done && !revealed ? (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[1000] flex flex-col justify-between bg-ink px-gutter py-8 grain"
          exit={{ y: "-100%" }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            className="flex items-baseline justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="eyebrow">{site.name}</span>
            <span className="eyebrow hidden sm:block">{site.role}</span>
          </motion.div>

          <div className="flex flex-1 items-center justify-center">
            <motion.div
              ref={lottieHost}
              className="h-[38vmin] w-[38vmin] max-h-64 max-w-64"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.7 }}
            />
          </div>

          <div className="space-y-4">
            <div className="relative h-px w-full overflow-hidden bg-hairline">
              <motion.span
                className="absolute inset-y-0 left-0 block bg-vermilion"
                initial={{ width: "0%" }}
                animate={{ width: `${count}%` }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </div>
            <div className="flex items-end justify-between">
              <span className="eyebrow">Loading portfolio</span>
              <span className="display text-[clamp(3rem,10vw,7rem)] leading-none tabular-nums">
                {String(count).padStart(3, "0")}
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

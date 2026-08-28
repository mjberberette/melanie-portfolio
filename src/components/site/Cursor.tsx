"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

type CursorMode = "default" | "link" | "media" | "hidden";

const RING_SIZE: Record<CursorMode, number> = {
  default: 34,
  link: 62,
  media: 96,
  hidden: 0,
};

export function Cursor() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>("default");
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const ringX = useSpring(x, { stiffness: 380, damping: 34, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 380, damping: 34, mass: 0.5 });
  const dotX = useSpring(x, { stiffness: 1400, damping: 60, mass: 0.2 });
  const dotY = useSpring(y, { stiffness: 1400, damping: 60, mass: 0.2 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(query.matches && !reduceMotion);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [reduceMotion]);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");
    return () => document.documentElement.classList.remove("has-custom-cursor");
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor], a, button, [role='button']",
      );

      if (!target) {
        setMode("default");
        setLabel(null);
        return;
      }

      const attr = target.dataset.cursor as CursorMode | undefined;
      setMode(attr ?? "link");
      setLabel(target.dataset.cursorLabel ?? null);
    };

    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = RING_SIZE[mode];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[999] hidden md:block"
    >
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="absolute top-0 left-0"
      >
        <motion.div
          className="flex items-center justify-center rounded-full border border-bone/70 text-[10px] font-mono tracking-[0.16em] uppercase"
          animate={{
            width: size,
            height: size,
            opacity: visible && mode !== "hidden" ? 1 : 0,
            scale: pressed ? 0.86 : 1,
            backgroundColor:
              mode === "media" ? "rgb(255 74 28)" : "rgba(241,237,229,0)",
            borderColor:
              mode === "media" ? "rgb(255 74 28)" : "rgba(241,237,229,0.7)",
            color: mode === "media" ? "#08080a" : "rgba(241,237,229,0.9)",
          }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          style={{ translateX: "-50%", translateY: "-50%" }}
        >
          <AnimatePresence mode="wait">
            {label ? (
              <motion.span
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="px-2 text-center leading-none"
              >
                {label}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ x: dotX, y: dotY }}
        className="absolute top-0 left-0"
      >
        <motion.span
          className="block rounded-full bg-vermilion"
          animate={{
            width: mode === "default" ? 6 : 0,
            height: mode === "default" ? 6 : 0,
            opacity: visible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{ translateX: "-50%", translateY: "-50%" }}
        />
      </motion.div>
    </div>
  );
}

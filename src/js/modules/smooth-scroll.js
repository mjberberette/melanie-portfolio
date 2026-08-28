import Lenis from "lenis";

import { gsap, ScrollTrigger } from "../gsap.js";
import { prefersReducedMotion } from "../utils.js";

let lenis = null;

/**
 * Lenis owns the scroll position and is stepped by the GSAP ticker, so smooth
 * scrolling and ScrollTrigger always resolve on the same frame.
 */
export function initSmoothScroll() {
  if (prefersReducedMotion()) return null;

  lenis = new Lenis({
    autoRaf: false,
    duration: 1.05,
    lerp: 0.1,
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.4,
  });

  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.addEventListener("refresh", () => lenis.resize());
  ScrollTrigger.refresh();

  return lenis;
}

export function getLenis() {
  return lenis;
}

export function stopScroll() {
  if (lenis) lenis.stop();
  else document.documentElement.style.overflow = "hidden";
}

export function startScroll() {
  if (lenis) lenis.start();
  else document.documentElement.style.overflow = "";
}

export function scrollTo(target, options = {}) {
  const element =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!element && target !== 0) return;

  if (lenis) {
    lenis.scrollTo(target === 0 ? 0 : element, {
      duration: 1.4,
      offset: -8,
      ...options,
    });
    return;
  }

  if (target === 0) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

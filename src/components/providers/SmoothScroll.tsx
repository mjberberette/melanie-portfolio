"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";

import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Lenis drives the scroll position; GSAP's ticker drives Lenis so that
 * ScrollTrigger and the smooth scroll never fight over the same frame.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    const raf = (time: number) => lenis.raf(time * 1000);
    const refresh = () => lenis.resize();

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.addEventListener("refresh", refresh);
    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(raf);
      ScrollTrigger.removeEventListener("refresh", refresh);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        duration: 1.05,
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.4,
        wheelMultiplier: 1,
      }}
    >
      {children}
    </ReactLenis>
  );
}

"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

import { IntroProvider, useIntro } from "@/components/providers/intro-context";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Cursor } from "@/components/site/Cursor";
import { Preloader } from "@/components/site/Preloader";
import { ScrollProgress } from "@/components/site/ScrollProgress";

function ScrollLock() {
  const { revealed } = useIntro();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    if (revealed) {
      lenis.start();
    } else {
      lenis.scrollTo(0, { immediate: true });
      lenis.stop();
    }
  }, [lenis, revealed]);

  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <IntroProvider>
        <ScrollLock />
        <Preloader />
        <Cursor />
        <ScrollProgress />
        {children}
      </IntroProvider>
    </SmoothScroll>
  );
}

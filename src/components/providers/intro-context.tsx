"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";

type IntroState = {
  /** True once the preloader curtain has cleared and the hero may animate in. */
  revealed: boolean;
  setRevealed: (value: boolean) => void;
};

const IntroContext = createContext<IntroState>({
  revealed: true,
  setRevealed: () => {},
});

export function IntroProvider({
  children,
  initial = false,
}: {
  children: React.ReactNode;
  initial?: boolean;
}) {
  const [revealed, setRevealed] = useState(initial);
  const reduceMotion = useReducedMotion();

  // Visitors who prefer reduced motion never see the preloader, so the page
  // is considered revealed from the first paint.
  const value = useMemo(
    () => ({ revealed: revealed || Boolean(reduceMotion), setRevealed }),
    [revealed, reduceMotion],
  );

  return <IntroContext value={value}>{children}</IntroContext>;
}

export function useIntro() {
  return useContext(IntroContext);
}

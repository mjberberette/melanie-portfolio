"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useLenis } from "lenis/react";

import { Monogram } from "@/components/brand/Monogram";
import { Magnetic } from "@/components/motion/Magnetic";
import { nav, site } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lenis = useLenis();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 24);
    if (menuOpen) return;
    setHidden(latest > previous && latest > 320);
  });

  useEffect(() => {
    if (!lenis) return;
    if (menuOpen) lenis.stop();
    else lenis.start();
  }, [lenis, menuOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goTo = (href: string) => {
    setMenuOpen(false);
    const target = document.querySelector(href);
    if (!target) return;
    lenis?.scrollTo(target as HTMLElement, { offset: -8, duration: 1.4 });
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-[800] transition-colors duration-500",
          scrolled && !menuOpen
            ? "bg-ink/70 backdrop-blur-xl border-b border-hairline"
            : "border-b border-transparent",
        )}
      >
        <div className="shell flex items-center justify-between py-4 md:py-5">
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              lenis?.scrollTo(0, { duration: 1.4 });
            }}
            className="group flex items-center gap-3"
            aria-label={`${site.name} — home`}
          >
            <Monogram className="h-8 w-auto text-bone transition-transform duration-500 group-hover:rotate-[8deg] group-hover:text-vermilion" />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-[13px] font-semibold tracking-[0.14em] uppercase">
                {site.name}
              </span>
              <span className="mt-1 font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase">
                {site.role}
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Magnetic key={item.href} strength={0.25}>
                <a
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(item.href);
                  }}
                  className="group relative px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase"
                >
                  <span className="relative block overflow-hidden">
                    <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
                      {item.label}
                    </span>
                    <span className="absolute inset-0 block translate-y-full text-vermilion transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
                      {item.label}
                    </span>
                  </span>
                </a>
              </Magnetic>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Magnetic strength={0.2} className="hidden sm:inline-flex">
              <a
                href={`mailto:${site.email}`}
                data-cursor="link"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-hairline-strong px-5 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase"
              >
                <span className="absolute inset-0 -z-10 translate-y-full bg-vermilion transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermilion opacity-75 group-hover:bg-ink" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-vermilion group-hover:bg-ink" />
                </span>
                <span className="transition-colors duration-300 group-hover:text-ink">
                  Available
                </span>
              </a>
            </Magnetic>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong md:hidden"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5">
                <motion.span
                  animate={
                    menuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }
                  }
                  className="block h-px w-4 bg-bone"
                />
                <motion.span
                  animate={
                    menuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }
                  }
                  className="block h-px w-4 bg-bone"
                />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[790] flex flex-col justify-between bg-ink-raised px-gutter pt-28 pb-10 md:hidden grain"
          >
            <nav className="flex flex-col">
              {nav.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    goTo(item.href);
                  }}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.18 + index * 0.07,
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="display border-b border-hairline py-5 text-[13vw] leading-none"
                >
                  <span className="mr-3 align-super font-mono text-[10px] tracking-widest text-vermilion">
                    0{index + 1}
                  </span>
                  {item.label}
                </motion.a>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="space-y-6"
            >
              <a
                href={`mailto:${site.email}`}
                className="block font-display text-xl tracking-tight text-vermilion"
              >
                {site.email}
              </a>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {site.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="eyebrow"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

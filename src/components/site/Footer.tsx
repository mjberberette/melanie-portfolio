"use client";

import { useLenis } from "lenis/react";

import { Monogram } from "@/components/brand/Monogram";
import { LocalTime } from "@/components/site/LocalTime";
import { site } from "@/lib/content";

export function Footer() {
  const lenis = useLenis();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-hairline pt-16 pb-8">
      <div className="shell">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <Monogram className="h-14 w-auto text-bone/80" />
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.14em] uppercase">
                {site.name}
              </p>
              <p className="eyebrow mt-1.5">{site.discipline}</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">
                Working with teams worldwide from {site.location}.
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-3" aria-label="Elsewhere">
            <p className="eyebrow mb-1">Elsewhere</p>
            {site.socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 font-display text-base transition-colors hover:text-vermilion"
              >
                {social.label}
                <span className="inline-block translate-y-px opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                  <svg width="10" height="10" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M3 15L15 3M15 3H6M15 3v9"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </span>
              </a>
            ))}
          </nav>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="eyebrow mb-1">Local time</p>
            <LocalTime className="font-mono text-sm text-bone" />
            <button
              type="button"
              onClick={() => lenis?.scrollTo(0, { duration: 1.8 })}
              className="group mt-4 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-bone-dim uppercase transition-colors hover:text-bone"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-hairline-strong transition-transform duration-500 group-hover:-translate-y-1">
                <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
                  <path
                    d="M4.5 12V1.5M0.5 5l4-4 4 4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
              </span>
              Back to top
            </button>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-hairline pt-6 text-[10px] tracking-[0.16em] text-bone-faint uppercase md:flex-row md:items-center md:justify-between">
          <p className="font-mono">
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="font-mono">
            Designed & built in-house — Next.js, GSAP, Lenis, Three.js
          </p>
        </div>
      </div>

      {/* Oversized wordmark — SVG so it always fits the viewport exactly */}
      <svg
        aria-hidden
        viewBox="0 0 1000 112"
        preserveAspectRatio="xMidYMax meet"
        className="mt-12 block w-full select-none"
      >
        <text
          x="500"
          y="106"
          textAnchor="middle"
          textLength="968"
          lengthAdjust="spacing"
          className="font-display"
          fontSize="142"
          fontWeight="700"
          fill="rgba(241,237,229,0.055)"
        >
          BERBERETTE
        </text>
      </svg>
    </footer>
  );
}

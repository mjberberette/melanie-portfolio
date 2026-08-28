"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { Magnetic } from "@/components/motion/Magnetic";
import { RevealBlock } from "@/components/motion/Reveal";
import { contact, site } from "@/lib/content";

export function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <section
      id="contact"
      className="relative scroll-mt-20 overflow-hidden border-t border-hairline py-24 md:py-36 grain"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[70vmin] w-[110vmin] -translate-x-1/2 rounded-full opacity-70 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,74,28,0.2) 0%, transparent 68%)",
        }}
      />

      <div className="shell relative">
        <RevealBlock>
          <p className="eyebrow mb-10">
            <span className="text-vermilion">06</span> — {contact.eyebrow}
          </p>
        </RevealBlock>

        <h2 className="display text-[clamp(2.6rem,10vw,9rem)]">
          {contact.headline.map((line, index) => (
            <RevealBlock key={line} delay={index * 0.08} y={70}>
              <span className="block">
                {index === 2 ? (
                  <>
                    worth{" "}
                    <span className="font-serif font-normal italic text-vermilion">
                      keeping
                    </span>
                  </>
                ) : (
                  line
                )}
              </span>
            </RevealBlock>
          ))}
        </h2>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
          <div className="md:col-span-5">
            <RevealBlock>
              <p className="max-w-sm text-[15px] leading-relaxed text-bone-dim">
                {contact.body}
              </p>
            </RevealBlock>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <RevealBlock delay={0.08}>
              <div className="flex flex-col gap-8">
                <Magnetic strength={0.18} className="self-start">
                  <a
                    href={`mailto:${site.email}?subject=${encodeURIComponent(
                      "New project enquiry",
                    )}`}
                    data-cursor="link"
                    className="group relative inline-flex items-center gap-4 overflow-hidden rounded-full border border-hairline-strong px-8 py-5"
                  >
                    <span className="absolute inset-0 -z-10 translate-y-full bg-vermilion transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
                    <span className="font-display text-lg font-semibold tracking-[-0.01em] transition-colors duration-300 group-hover:text-ink">
                      {contact.cta}
                    </span>
                    <motion.span
                      aria-hidden
                      className="transition-colors duration-300 group-hover:text-ink"
                      initial={false}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path
                          d="M3 15L15 3M15 3H6M15 3v9"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                      </svg>
                    </motion.span>
                  </a>
                </Magnetic>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="group flex w-full items-center justify-between gap-4 border-b border-hairline py-4 text-left transition-colors hover:border-hairline-strong"
                  >
                    <span className="font-display text-[clamp(1.1rem,2.4vw,1.7rem)] tracking-[-0.01em]">
                      {site.email}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase transition-colors group-hover:text-vermilion">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </button>

                  <div className="flex items-center gap-3 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermilion opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-vermilion" />
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-bone-dim uppercase">
                      {site.availability.status}
                    </span>
                  </div>
                </div>
              </div>
            </RevealBlock>
          </div>
        </div>
      </div>
    </section>
  );
}

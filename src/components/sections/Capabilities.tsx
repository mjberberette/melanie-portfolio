"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { RevealBlock, RevealLines } from "@/components/motion/Reveal";
import { capabilities } from "@/lib/content";

export function Capabilities() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="capabilities"
      className="relative scroll-mt-20 border-t border-hairline py-24 md:py-36"
    >
      <div className="shell grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-32">
            <RevealBlock>
              <p className="eyebrow mb-6">
                <span className="text-vermilion">03</span> — Capabilities
              </p>
            </RevealBlock>
            <RevealLines
              as="h2"
              className="display text-[clamp(2rem,4.4vw,3.4rem)]"
            >
              What I am hired to do
            </RevealLines>
            <RevealBlock delay={0.1}>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-bone-dim">
                Most engagements combine two or three of these. Pick the
                shape that fits — retainer, project, or a focused sprint.
              </p>
            </RevealBlock>
          </div>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          {capabilities.map((item, index) => {
            const isOpen = open === index;
            return (
              <RevealBlock key={item.number} delay={index * 0.05}>
                <div className="border-t border-hairline last:border-b">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-6 py-7 text-left"
                  >
                    <span className="font-mono text-[11px] tracking-[0.2em] text-bone-faint">
                      {item.number}
                    </span>
                    <span className="display flex-1 text-[clamp(1.4rem,2.8vw,2.2rem)] transition-colors duration-500 group-hover:text-vermilion">
                      {item.title}
                    </span>
                    <span className="relative h-4 w-4 shrink-0">
                      <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-bone-dim transition-colors group-hover:bg-vermilion" />
                      <motion.span
                        animate={{ rotate: isOpen ? 0 : 90, opacity: isOpen ? 0 : 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-bone-dim transition-colors group-hover:bg-vermilion"
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-8 pl-0 md:pl-12">
                          <p className="max-w-xl text-[15px] leading-relaxed text-bone-dim">
                            {item.blurb}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-hairline px-3 py-1 font-mono text-[9px] tracking-[0.16em] text-bone-dim uppercase"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </RevealBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useRef } from "react";
import { useReducedMotion } from "motion/react";

import { RevealBlock, RevealLines, RevealWords } from "@/components/motion/Reveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { manifesto, site, stats } from "@/lib/content";

export function Studio() {
  const root = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reduceMotion) return;

      gsap.to("[data-portrait-inner]", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-portrait]",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-counter]").forEach((element) => {
        const target = Number(element.dataset.counter);
        const proxy = { value: 0 };
        gsap.to(proxy, {
          value: target,
          duration: 2,
          ease: "power2.out",
          snap: { value: 1 },
          onUpdate: () => {
            element.textContent = String(Math.round(proxy.value));
          },
          scrollTrigger: { trigger: element, start: "top 90%", once: true },
        });
      });
    },
    { dependencies: [reduceMotion], scope: root },
  );

  return (
    <section
      ref={root}
      id="studio"
      className="relative scroll-mt-20 py-24 md:py-36"
    >
      <div className="shell">
        <RevealBlock>
          <p className="eyebrow mb-14">
            <span className="text-vermilion">01</span> — Approach
          </p>
        </RevealBlock>

        <RevealWords
          as="p"
          className="display max-w-[22ch] text-[clamp(1.9rem,5.2vw,4.2rem)] leading-[1.02] md:max-w-[24ch]"
        >
          {manifesto.statement}
        </RevealWords>

        <div className="mt-20 grid gap-14 md:mt-28 md:grid-cols-12 md:gap-12">
          <div data-portrait className="md:col-span-5 lg:col-span-4">
            <RevealBlock>
              <figure className="relative">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-ink-raised">
                  <div
                    data-portrait-inner
                    className="absolute inset-x-0 -top-[6%] h-[112%]"
                  >
                    <Image
                      src="/images/melanie.jpg"
                      alt={`${site.name}, ${site.role.toLowerCase()}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 34vw"
                      className="object-cover object-top grayscale-[0.35] contrast-[1.05]"
                      priority={false}
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                </div>
                <figcaption className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
                  <span>{site.name}</span>
                  <span>{site.location}</span>
                </figcaption>
              </figure>
            </RevealBlock>
          </div>

          <div className="md:col-span-7 md:col-start-6 lg:col-span-6 lg:col-start-7">
            <RevealLines
              as="h2"
              className="display mb-8 text-[clamp(1.6rem,3.4vw,2.6rem)]"
            >
              A partner in the room, not a supplier at the gate.
            </RevealLines>

            <div className="space-y-6">
              {manifesto.paragraphs.map((paragraph, index) => (
                <RevealBlock key={index} delay={index * 0.06}>
                  <p className="max-w-prose text-[15px] leading-relaxed text-bone-dim md:text-base">
                    {paragraph}
                  </p>
                </RevealBlock>
              ))}
            </div>

            <RevealBlock delay={0.14}>
              <p className="mt-8 font-serif text-2xl text-bone italic">
                {manifesto.signature}
              </p>
            </RevealBlock>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-y-10 border-t border-hairline pt-10 md:mt-28 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="display text-[clamp(2.4rem,5vw,4rem)] tabular-nums">
                <span data-counter={stat.value}>0</span>
                <span className="text-vermilion">{stat.suffix}</span>
              </p>
              <p className="eyebrow mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

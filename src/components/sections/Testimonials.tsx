"use client";

import { RevealBlock, RevealLines } from "@/components/motion/Reveal";
import { recognition, testimonials } from "@/lib/content";

export function Testimonials() {
  return (
    <section className="relative border-t border-hairline py-24 md:py-36">
      <div className="shell">
        <RevealBlock>
          <p className="eyebrow mb-14">
            <span className="text-vermilion">05</span> — In their words
          </p>
        </RevealBlock>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {testimonials.map((item, index) => (
            <RevealBlock key={item.name} delay={index * 0.08}>
              <figure className="flex h-full flex-col justify-between border-t border-hairline pt-8">
                <blockquote>
                  <span
                    aria-hidden
                    className="mb-4 block font-serif text-4xl leading-none text-vermilion"
                  >
                    &ldquo;
                  </span>
                  <p className="text-pretty text-[17px] leading-relaxed text-bone md:text-lg">
                    {item.quote}
                  </p>
                </blockquote>
                <figcaption className="mt-8">
                  <p className="font-display text-sm font-semibold tracking-[0.02em]">
                    {item.name}
                  </p>
                  <p className="eyebrow mt-1 normal-case">{item.title}</p>
                </figcaption>
              </figure>
            </RevealBlock>
          ))}
        </div>

        <div className="mt-24 md:mt-32">
          <RevealLines
            as="h2"
            className="display mb-10 text-[clamp(1.6rem,3.2vw,2.4rem)]"
          >
            Recognition
          </RevealLines>
          <ul>
            {recognition.map((item, index) => (
              <RevealBlock key={item.award} delay={index * 0.05}>
                <li className="group flex items-baseline justify-between gap-6 border-t border-hairline py-5 last:border-b">
                  <span className="font-display text-base transition-colors duration-500 group-hover:text-vermilion md:text-lg">
                    {item.award}
                  </span>
                  <span className="hidden flex-1 border-b border-dotted border-hairline sm:block" />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-bone-dim uppercase">
                    {item.org}
                  </span>
                  <span className="w-12 text-right font-mono text-[10px] text-bone-faint">
                    {item.year}
                  </span>
                </li>
              </RevealBlock>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

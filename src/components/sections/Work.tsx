"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { RevealBlock, RevealLines } from "@/components/motion/Reveal";
import { ProjectMedia } from "@/components/work/ProjectMedia";
import { projects, site } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Work() {
  const [active, setActive] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 240, damping: 26, mass: 0.6 });
  const y = useSpring(pointerY, { stiffness: 240, damping: 26, mass: 0.6 });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
  };

  return (
    <section id="work" className="relative scroll-mt-20 py-24 md:py-36">
      <div className="shell">
        <header className="flex flex-col gap-6 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <RevealBlock>
              <p className="eyebrow mb-5">
                <span className="text-vermilion">02</span> — Selected work
              </p>
            </RevealBlock>
            <RevealLines
              as="h2"
              className="display max-w-[16ch] text-[clamp(2.2rem,6vw,4.6rem)]"
            >
              Five projects that show how I think
            </RevealLines>
          </div>
          <RevealBlock delay={0.1}>
            <p className="max-w-xs text-sm leading-relaxed text-bone-dim">
              Case studies available on request — including the research,
              the rejected directions and the numbers after launch.
            </p>
          </RevealBlock>
        </header>

        {/* Desktop: hover-driven index list with a cursor-tracked preview */}
        <div
          ref={listRef}
          onPointerMove={handleMove}
          onPointerLeave={() => setActive(null)}
          className="hidden md:block"
        >
          {projects.map((project, index) => (
            <a
              key={project.id}
              href={`mailto:${site.email}?subject=${encodeURIComponent(
                `Case study — ${project.title}`,
              )}`}
              data-cursor="media"
              data-cursor-label="Request"
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className={cn(
                "group relative flex items-center gap-8 border-b border-hairline py-8 transition-opacity duration-500 lg:py-10",
                active !== null && active !== index
                  ? "opacity-35"
                  : "opacity-100",
              )}
            >
              <span className="w-12 shrink-0 font-mono text-[11px] tracking-[0.2em] text-bone-faint">
                {project.index}
              </span>

              <div className="flex flex-1 items-baseline gap-6 overflow-hidden">
                <motion.h3
                  animate={{ x: active === index && !reduceMotion ? 22 : 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="display text-[clamp(1.8rem,4.2vw,3.6rem)] whitespace-nowrap"
                >
                  <span
                    className="transition-colors duration-500"
                    style={{ color: active === index ? project.accent : undefined }}
                  >
                    {project.title}
                  </span>
                </motion.h3>
                <span className="hidden truncate font-serif text-lg text-bone-dim italic lg:block">
                  {project.subtitle}
                </span>
              </div>

              <div className="hidden shrink-0 items-center gap-6 lg:flex">
                <span className="flex gap-2">
                  {project.role.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-hairline px-3 py-1 font-mono text-[9px] tracking-[0.16em] text-bone-dim uppercase"
                    >
                      {role}
                    </span>
                  ))}
                </span>
                <span className="w-12 text-right font-mono text-[11px] text-bone-faint">
                  {project.year}
                </span>
              </div>
            </a>
          ))}

          <AnimatePresence>
            {active !== null && !reduceMotion ? (
              <motion.div
                key="preview"
                style={{ x, y }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none fixed top-0 left-0 z-[500]"
              >
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <div className="relative h-[16rem] w-[24rem] overflow-hidden rounded-lg border border-hairline-strong shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
                    <ProjectMedia
                      project={projects[active]}
                      variant={active}
                      active
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-bone-dim uppercase">
                    <span style={{ color: projects[active].accent }}>
                      {projects[active].metric.value}
                    </span>
                    <span>{projects[active].metric.label}</span>
                  </div>
                  <p className="mt-2 w-[24rem] text-[12px] leading-relaxed text-bone-dim/80">
                    {projects[active].summary}
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Mobile: stacked cards with the preview always visible */}
        <div className="md:hidden">
          {projects.map((project, index) => (
            <RevealBlock key={project.id} className="border-b border-hairline py-8">
              <div className="mb-5 aspect-[4/3] w-full overflow-hidden rounded-lg border border-hairline">
                <ProjectMedia project={project} variant={index} active={false} />
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display text-3xl">{project.title}</h3>
                <span className="font-mono text-[10px] text-bone-faint">
                  {project.year}
                </span>
              </div>
              <p className="mt-2 font-serif text-lg text-bone-dim italic">
                {project.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-bone-dim">
                {project.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.role.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-hairline px-3 py-1 font-mono text-[9px] tracking-[0.16em] text-bone-dim uppercase"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </RevealBlock>
          ))}
        </div>
      </div>
    </section>
  );
}

import { animate, hover } from "motion";
import { gsap, ScrollTrigger } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Tech stack — the toolbox grid.
 *   GSAP   — tiles cascade in across the grid on first view.
 *   Motion — spring pop on hover, tile lifting above its neighbours.
 *   Idle   — a "signal sweep" lights a random tile every few seconds,
 *            echoing the sonar language used across the site.
 */
export function initStack() {
  const section = qs(".stack");
  if (!section) return;

  const grid = qs("[data-stack]", section);
  const tools = qsa("[data-tool]", section);
  const reduced = prefersReducedMotion();
  if (!grid || !tools.length || reduced) return;

  /* Entrance: a wave across the grid ------------------------------------- */
  gsap.set(tools, { y: 44, autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: grid,
    start: "top 84%",
    once: true,
    onEnter: () =>
      gsap.to(tools, {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        ease: "mb-out",
        stagger: { each: 0.055, grid: "auto", from: 0 },
      }),
  });

  /* Hover: the tile pops above its neighbours with spring physics -------- */
  hover(tools, (tool) => {
    tool.style.zIndex = 3;
    animate(
      tool,
      { scale: 1.06 },
      { type: "spring", stiffness: 340, damping: 20 },
    );
    return () => {
      animate(
        tool,
        { scale: 1 },
        { type: "spring", stiffness: 280, damping: 24 },
      ).then(() => {
        tool.style.zIndex = "";
      });
    };
  });

  /* Idle signal sweep: a random tile pings while nobody is hovering ------ */
  let visible = false;
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: "-10% 0px" },
  ).observe(grid);

  let last = -1;
  setInterval(() => {
    if (!visible || grid.matches(":hover")) return;
    let index;
    do {
      index = Math.floor(Math.random() * tools.length);
    } while (index === last);
    last = index;

    const tool = tools[index];
    tool.classList.add("is-lit");
    setTimeout(() => tool.classList.remove("is-lit"), 900);
  }, 2400);
}

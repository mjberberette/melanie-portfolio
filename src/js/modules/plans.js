import { animate, hover, inView, stagger } from "motion";
import { gsap, ScrollTrigger } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Pricing — three ways to hire. Two animation engines split the work the way
 * they each do best:
 *   GSAP   — scroll entrance (cards rise in a stagger) and the price
 *            odometer count-up, both driven by ScrollTrigger.
 *   Motion — springy hover lift on each card and the feature-row cascade,
 *            via inView / hover with real spring physics.
 */
export function initPlans() {
  const section = qs(".plans");
  if (!section) return;

  const grid = qs("[data-plans]", section);
  const cards = qsa("[data-plan]", section);
  const reduced = prefersReducedMotion();
  if (!grid || !cards.length || reduced) return;

  /* GSAP: cards rise into place, featured card lands last ---------------- */
  gsap.set(cards, { y: 72, autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: grid,
    start: "top 82%",
    once: true,
    onEnter: () =>
      gsap.to(cards, {
        y: 0,
        autoAlpha: 1,
        duration: 1.1,
        ease: "mb-out",
        stagger: 0.14,
      }),
  });

  /* GSAP: prices count up the first time they are seen -------------------- */
  qsa("[data-count]", section).forEach((price) => {
    const target = Number(price.dataset.count);
    const prefix = price.dataset.prefix ?? "";
    const state = { value: 0 };
    ScrollTrigger.create({
      trigger: price,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(state, {
          value: target,
          duration: 1.4,
          ease: "mb-out",
          delay: 0.35,
          onUpdate: () => {
            price.textContent =
              prefix + Math.round(state.value).toLocaleString("en-US");
          },
        }),
    });
  });

  /* Motion: feature rows cascade in per card ------------------------------ */
  cards.forEach((card, index) => {
    const rows = qsa(".plan__list li", card);
    rows.forEach((row) => {
      row.style.opacity = "0";
    });
    inView(
      card,
      () => {
        animate(
          rows,
          { opacity: [0, 1], x: [-16, 0] },
          {
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
            delay: stagger(0.07, { startDelay: 0.5 + index * 0.14 }),
          },
        );
      },
      { amount: 0.3 },
    );
  });

  /* Motion: springy lift on hover ----------------------------------------- */
  hover(cards, (card) => {
    animate(
      card,
      { y: -10 },
      { type: "spring", stiffness: 320, damping: 22 },
    );
    return () => {
      animate(card, { y: 0 }, { type: "spring", stiffness: 260, damping: 26 });
    };
  });
}

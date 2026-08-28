import { gsap } from "../gsap.js";
import { onRevealed, prefersReducedMotion, qs, qsa } from "../utils.js";

export function initHero() {
  const hero = qs(".hero");
  if (!hero) return;

  const lines = qsa(".hero__line > span", hero);
  const fades = qsa("[data-hero-fade]", hero);

  if (prefersReducedMotion()) {
    gsap.set([...lines, ...fades], { yPercent: 0, autoAlpha: 1, y: 0 });
    return;
  }

  gsap.set(lines, { yPercent: 120 });
  gsap.set(fades, { autoAlpha: 0, y: 24 });

  onRevealed(() => {
    gsap
      .timeline({ delay: 0.15 })
      .to(lines, {
        yPercent: 0,
        duration: 1.25,
        stagger: 0.09,
        ease: "mb-out",
      })
      .to(
        fades,
        { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "mb-out" },
        "-=0.85",
      );
  });

  // The headline drifts up faster than the section as you leave the hero.
  gsap.to("[data-hero-parallax]", {
    yPercent: -18,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 0.8,
    },
  });
}

import { gsap } from "../gsap.js";
import { onRevealed, prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Hero choreography, in three parts:
 *   1. Intro — the two name lines rise out of masks once the preloader lifts.
 *   2. Pinned scrub — on larger screens the hero holds for ~85% of a viewport
 *      while the names split apart, the pattern drifts and the 3D mark
 *      (driven separately in monogram.js) rotates away.
 *   3. Pointer parallax — every [data-depth] layer eases toward the pointer,
 *      front layers travelling further than back ones.
 */
export function initHero() {
  const hero = qs(".hero");
  if (!hero) return;

  const lineInners = qsa(".hero__line > span", hero);
  const fades = qsa("[data-hero-fade]", hero);
  const identity = qs(".hero__id", hero);
  const pattern = qs(".hero__pattern", hero);
  const echo = qs(".hero__echo", hero);
  const shade = qs(".hero__shade", hero);
  const cue = qs(".scroll-cue", hero);

  if (prefersReducedMotion()) {
    gsap.set([...lineInners, ...fades], {
      clearProps: "all",
      autoAlpha: 1,
      yPercent: 0,
    });
    return;
  }

  gsap.set(lineInners, { yPercent: 118 });
  gsap.set(fades, { autoAlpha: 0, y: 24 });

  onRevealed(() => {
    gsap
      .timeline({ delay: 0.1 })
      .to(lineInners, {
        yPercent: 0,
        duration: 1.45,
        stagger: 0.12,
        ease: "mb-out",
      })
      .to(
        fades,
        { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "mb-out" },
        "-=1.0",
      );
  });

  const mm = gsap.matchMedia();

  // Pinned scroll scene. xPercent is reserved for the scrub while the pointer
  // parallax below animates x/y, so the two never fight.
  mm.add("(min-width: 62rem)", () => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=85%",
        scrub: 0.75,
        pin: true,
        anticipatePin: 1,
      },
    });

    tl.to(identity, { x: -70, autoAlpha: 0 }, 0)
      .to(cue, { autoAlpha: 0, y: 20 }, 0)
      .to(pattern, { yPercent: -7, autoAlpha: 0.5 }, 0)
      .to(echo, { autoAlpha: 0.25, scale: 1.12 }, 0)
      .to(shade, { autoAlpha: 0.4 }, 0.2);
  });

  // Small screens skip the pin and get a light drift instead.
  mm.add("(max-width: 61.99rem)", () => {
    gsap.to(".hero__stage", {
      yPercent: -12,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      },
    });
  });

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const layers = qsa("[data-depth]", hero).map((element) => ({
      depth: Number(element.dataset.depth) || 0,
      xTo: gsap.quickTo(element, "x", { duration: 0.9, ease: "power3" }),
      yTo: gsap.quickTo(element, "y", { duration: 0.9, ease: "power3" }),
    }));

    window.addEventListener(
      "pointermove",
      (event) => {
        const nx = (event.clientX / window.innerWidth) * 2 - 1;
        const ny = (event.clientY / window.innerHeight) * 2 - 1;
        layers.forEach((layer) => {
          layer.xTo(nx * layer.depth);
          layer.yTo(ny * layer.depth * 0.55);
        });
      },
      { passive: true },
    );
  }
}

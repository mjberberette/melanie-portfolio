import { gsap, SplitText } from "../gsap.js";
import { prefersReducedMotion, qsa } from "../utils.js";

/**
 * Three reveal flavours, all driven by ScrollTrigger:
 *   [data-reveal]        block fades up once
 *   [data-reveal-lines]  headline lines rise out of a mask
 *   [data-reveal-words]  words brighten as the block scrolls past
 */
export function initReveals() {
  if (prefersReducedMotion()) {
    qsa("[data-reveal], [data-reveal-lines], .reveal-block > span").forEach(
      (element) => gsap.set(element, { clearProps: "all", autoAlpha: 1 }),
    );
    return;
  }

  qsa("[data-reveal]").forEach((element) => {
    const inner = element.matches(".reveal-block")
      ? element.firstElementChild
      : element;

    gsap.fromTo(
      inner,
      element.matches(".reveal-block")
        ? { yPercent: 110 }
        : { autoAlpha: 0, y: 40 },
      {
        yPercent: 0,
        autoAlpha: 1,
        y: 0,
        duration: 1.2,
        ease: "mb-out",
        scrollTrigger: { trigger: element, start: "top 88%", once: true },
      },
    );
  });

  qsa("[data-reveal-lines]").forEach((element) => {
    SplitText.create(element, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      linesClass: "split-line",
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.1,
          stagger: 0.08,
          ease: "mb-out",
          scrollTrigger: { trigger: element, start: "top 85%", once: true },
        });
      },
    });
  });

  qsa("[data-reveal-words]").forEach((element) => {
    SplitText.create(element, {
      type: "words",
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(
          self.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.6,
            scrollTrigger: {
              trigger: element,
              start: "top 78%",
              end: "bottom 55%",
              scrub: 0.6,
            },
          },
        );
      },
    });
  });

  // Slow parallax drift on the portrait
  qsa("[data-parallax-media] img").forEach((image) => {
    gsap.to(image, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: image.closest("[data-parallax-media]"),
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

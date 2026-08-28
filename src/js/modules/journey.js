import { gsap } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * The journey timeline:
 *   - the rail fills and its dot travels as the feed scrolls through view
 *   - each post's "Read more" expands the long-form note in place
 */
export function initJourney() {
  const feed = qs("#journey-feed");
  if (!feed) return;

  const reduced = prefersReducedMotion();
  const line = qs("[data-journey-line]", feed);
  const dot = qs("[data-journey-dot]", feed);

  if (reduced) {
    if (line) line.style.transform = "scaleY(1)";
    if (dot) dot.style.top = "100%";
  } else {
    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: feed,
          start: "top 72%",
          end: "bottom 78%",
          scrub: 0.6,
        },
      },
    );

    gsap.fromTo(
      dot,
      { top: "0%" },
      {
        top: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: feed,
          start: "top 72%",
          end: "bottom 78%",
          scrub: 0.6,
        },
      },
    );
  }

  qsa(".jpost__card", feed).forEach((card) => {
    const toggle = qs(".jpost__toggle", card);
    const label = qs("[data-toggle-label]", card);
    const panel = qs(".jpost__more", card);
    const inner = qs(".jpost__more-inner", card);
    if (!toggle || !panel || !inner) return;

    toggle.addEventListener("click", () => {
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Read less" : "Read more";

      if (reduced) {
        panel.style.height = open ? "auto" : "0px";
        return;
      }

      gsap.killTweensOf(panel);
      gsap.to(panel, {
        height: open ? inner.offsetHeight : 0,
        duration: 0.55,
        ease: "mb-in-out",
        onComplete: () => {
          if (open) panel.style.height = "auto";
        },
      });
    });
  });

  // Expanding a card changes layout under pinned sections downstream.
  window.addEventListener(
    "click",
    (event) => {
      if (event.target.closest?.(".jpost__toggle")) {
        window.setTimeout(() => {
          import("../gsap.js").then(({ ScrollTrigger }) =>
            ScrollTrigger.refresh(),
          );
        }, 650);
      }
    },
    { passive: true },
  );
}

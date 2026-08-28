import { onRevealed, prefersReducedMotion, qsa } from "../utils.js";

/**
 * Nav + footer logos, played from the monogram's Lottie rig exactly once.
 *
 * The comp is 1080x1080 with the mark drawn between frames 0 and ~340, then
 * wiped off again for looping contexts. Here each instance draws on and parks
 * on FRAME_FULL — no repeat. The viewBox is cropped to the measured ink
 * bounds so the mark sizes like the static SVG it replaces.
 *
 * A static <svg> fallback ships in the markup and is removed only once the
 * player is ready, so the logo never flashes empty.
 */

const CROP = "296 244 488 592";
const FRAME_FULL = 300;

export function initBrandMarks() {
  const hosts = qsa("[data-mark-lottie]");
  if (!hosts.length) return;

  const reduced = prefersReducedMotion();

  import("lottie-web")
    .then(({ default: lottie }) => {
      hosts.forEach((host) => {
        const fallback = host.querySelector("svg");

        const animation = lottie.loadAnimation({
          container: host,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: "/logo/mb-monogram-alpha.json",
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });

        animation.addEventListener("DOMLoaded", () => {
          const svg = host.querySelector("svg:last-of-type");
          svg?.setAttribute("viewBox", CROP);
          fallback?.remove();

          if (reduced) {
            animation.goToAndStop(FRAME_FULL, true);
            return;
          }

          animation.setSpeed(1.6);

          const play = () => animation.playSegments([0, FRAME_FULL], true);

          if (host.closest(".nav")) {
            // Draw on as the preloader curtain lifts.
            onRevealed(play);
          } else {
            // Draw on the first time it scrolls into view.
            animation.goToAndStop(0, true);
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (!entry.isIntersecting) return;
                play();
                observer.disconnect();
              },
              { threshold: 0.4 },
            );
            observer.observe(host);
          }
        });
      });
    })
    .catch(() => {
      /* static fallback stays in place */
    });
}

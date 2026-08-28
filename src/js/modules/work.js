import { gsap } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Work gallery:
 *   - On larger screens the section pins and vertical scroll drives the card
 *     track sideways. Small screens get a vertical stack.
 *   - Inside each card, the site capture scrolls up and down within the iPad
 *     screen while the card is on screen.
 */
export function initWork() {
  const section = qs(".work");
  const gallery = qs("#work-gallery");
  const track = qs("#work-track");
  if (!section || !gallery || !track) return;

  const reduced = prefersReducedMotion();

  /* Horizontal scrub */
  if (!reduced) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 62rem)", () => {
      const distance = () =>
        Math.max(0, track.scrollWidth - gallery.clientWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    });
  }

  /* Auto-scrolling captures inside the device screens */
  qsa("[data-screen]", track).forEach((img, index) => {
    const screen = img.closest(".wcard__screen");
    if (!screen) return;

    if (reduced) return; // captures stay at the top of the page

    let tween = null;

    const build = () => {
      tween?.kill();
      const overflow = img.offsetHeight - screen.clientHeight + 24;
      if (overflow <= 0) return;

      tween = gsap.fromTo(
        img,
        { y: 0 },
        {
          y: -overflow,
          // Constant reading speed regardless of capture length.
          duration: Math.max(8, overflow / 55),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          repeatDelay: 1.1,
          delay: 0.4 + index * 0.35,
          paused: true,
        },
      );
      if (inView) tween.play();
    };

    let inView = false;
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (!tween) return;
        if (inView) tween.play();
        else tween.pause();
      },
      { threshold: 0.25 },
    ).observe(screen);

    if (img.complete && img.offsetHeight > 0) build();
    else img.addEventListener("load", build, { once: true });

    // Card widths track the viewport, so rebuild on real size changes.
    let lastHeight = 0;
    new ResizeObserver(() => {
      const next = screen.clientHeight;
      if (Math.abs(next - lastHeight) > 2) {
        lastHeight = next;
        if (img.complete && img.offsetHeight > 0) build();
      }
    }).observe(screen);
  });
}

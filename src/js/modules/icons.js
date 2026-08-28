import { prefersReducedMotion, qsa } from "../utils.js";

/**
 * Animated icons come from Lordicon (https://lordicon.com) and live in
 * /public/icons, so the site has no runtime CDN dependency. The <lord-icon>
 * custom element is defined here and driven by the same lottie-web player the
 * monogram uses.
 *
 * Several Lordicon icons draw themselves on from nothing, which leaves an
 * empty box at rest. Each icon is parked on its last frame once ready, then
 * replays on hover — or the first time it scrolls into view.
 *
 * To swap an icon: download its JSON from Lordicon, drop it in /public/icons,
 * and point the `src` attribute at it in index.html.
 */
export async function initIcons() {
  if (!customElements.get("lord-icon")) {
    try {
      const [{ default: lottie }, { defineElement }] = await Promise.all([
        import("lottie-web"),
        import("lord-icon-element"),
      ]);
      defineElement(lottie.loadAnimation);
    } catch {
      // Icons are decorative; the layout holds without them.
      return;
    }
  }

  const reduced = prefersReducedMotion();

  const observer =
    "IntersectionObserver" in window && !reduced
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.player?.playFromBeginning?.();
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.6 },
        )
      : null;

  qsa("lord-icon").forEach((icon) => {
    const settle = () => {
      icon.player?.goToLastFrame?.();
      if (icon.getAttribute("trigger") !== "loop") observer?.observe(icon);
    };

    if (icon.isReady) settle();
    else icon.addEventListener("ready", settle, { once: true });
  });
}

import { markRevealed, prefersReducedMotion, qs } from "../utils.js";
import { startScroll, stopScroll } from "./smooth-scroll.js";

const HOLD_MS = 2350;

export async function initPreloader() {
  const root = qs("#preloader");
  if (!root) return;

  if (prefersReducedMotion()) {
    root.remove();
    markRevealed();
    return;
  }

  const bar = qs("#preloader-bar");
  const count = qs("#preloader-count");
  const stage = qs("#preloader-mark");

  stopScroll();
  window.scrollTo(0, 0);

  // The hand-authored monogram rig draws itself while the counter runs.
  import("lottie-web")
    .then(({ default: lottie }) => {
      if (!document.body.contains(stage)) return;
      const animation = lottie.loadAnimation({
        container: stage,
        renderer: "svg",
        loop: false,
        autoplay: true,
        path: "/logo/mb-monogram-alpha.json",
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      animation.setSpeed(2.6);
    })
    .catch(() => {});

  const start = performance.now();

  await new Promise((resolve) => {
    const tick = (now) => {
      const progress = Math.min((now - start) / HOLD_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * 100);

      count.textContent = String(value).padStart(3, "0");
      bar.style.width = `${value}%`;

      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

  await root
    .animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
      { duration: 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "both" },
    )
    .finished.catch(() => {});

  root.remove();
  startScroll();
  markRevealed();
}

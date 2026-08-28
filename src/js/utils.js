export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export const prefersReducedMotion = () => reducedMotionQuery.matches;

export const onReducedMotionChange = (handler) => {
  reducedMotionQuery.addEventListener("change", () =>
    handler(reducedMotionQuery.matches),
  );
};

/** Fires once the preloader has cleared (or immediately if it never ran). */
export function onRevealed(handler) {
  if (document.documentElement.dataset.revealed === "true") {
    handler();
    return;
  }
  document.addEventListener("mb:revealed", handler, { once: true });
}

export function markRevealed() {
  if (document.documentElement.dataset.revealed === "true") return;
  document.documentElement.dataset.revealed = "true";
  document.dispatchEvent(new CustomEvent("mb:revealed"));
}

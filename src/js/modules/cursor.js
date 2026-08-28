import { lerp, prefersReducedMotion, qs } from "../utils.js";

/**
 * Two-part cursor: a dot that tracks the pointer almost exactly and a ring
 * that trails behind and swells over links and case-study rows.
 */
export function initCursor() {
  const root = qs("#cursor");
  if (!root) return;

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (!supportsHover.matches || prefersReducedMotion()) return;

  const ring = qs("#cursor-ring");
  const dot = qs("#cursor-dot");
  const label = qs("#cursor-label");

  root.classList.add("is-enabled");
  document.documentElement.classList.add("has-custom-cursor");

  const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pointer };
  const dotPos = { ...pointer };
  let mode = "default";
  let raf = 0;

  const render = () => {
    ringPos.x = lerp(ringPos.x, pointer.x, 0.18);
    ringPos.y = lerp(ringPos.y, pointer.y, 0.18);
    dotPos.x = lerp(dotPos.x, pointer.x, 0.55);
    dotPos.y = lerp(dotPos.y, pointer.y, 0.55);

    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
    dot.style.transform = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%, -50%)`;

    raf = requestAnimationFrame(render);
  };

  raf = requestAnimationFrame(render);

  document.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      root.classList.add("is-visible");

      const target = event.target.closest?.(
        "[data-cursor], a, button, [role='button']",
      );

      const nextMode = target ? (target.dataset.cursor ?? "link") : "default";
      const nextLabel = target?.dataset.cursorLabel ?? "";

      if (nextMode !== mode) {
        mode = nextMode;
        root.dataset.mode = mode;
      }
      if (label.textContent !== nextLabel) label.textContent = nextLabel;
    },
    { passive: true },
  );

  document.addEventListener("pointerleave", () =>
    root.classList.remove("is-visible"),
  );
  window.addEventListener("pointerdown", () => root.classList.add("is-pressed"));
  window.addEventListener("pointerup", () =>
    root.classList.remove("is-pressed"),
  );
  window.addEventListener("blur", () => root.classList.remove("is-pressed"));

  supportsHover.addEventListener("change", (event) => {
    if (event.matches) return;
    cancelAnimationFrame(raf);
    root.classList.remove("is-enabled");
    document.documentElement.classList.remove("has-custom-cursor");
  });
}

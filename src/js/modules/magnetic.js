import { prefersReducedMotion, qsa } from "../utils.js";

/** Pulls `[data-magnetic]` elements toward the pointer while hovered. */
export function initMagnetic() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  qsa("[data-magnetic]").forEach((element) => {
    const strength = Number(element.dataset.magnetic || 0.28);
    let raf = 0;
    const current = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const render = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      element.style.transform = `translate(${current.x}px, ${current.y}px)`;

      if (Math.abs(target.x - current.x) > 0.1 || Math.abs(target.y - current.y) > 0.1) {
        raf = requestAnimationFrame(render);
      } else {
        raf = 0;
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      target.x = (event.clientX - (rect.left + rect.width / 2)) * strength;
      target.y = (event.clientY - (rect.top + rect.height / 2)) * strength;
      kick();
    });

    element.addEventListener("pointerleave", () => {
      target.x = 0;
      target.y = 0;
      kick();
    });
  });
}

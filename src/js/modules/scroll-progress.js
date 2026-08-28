import { clamp, qs } from "../utils.js";

export function initScrollProgress() {
  const bar = qs("#scroll-progress");
  if (!bar) return;

  let target = 0;
  let current = 0;
  let raf = 0;

  const measure = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    target = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    if (!raf) raf = requestAnimationFrame(render);
  };

  const render = () => {
    current += (target - current) * 0.14;
    bar.style.transform = `scaleX(${current})`;

    if (Math.abs(target - current) > 0.0005) {
      raf = requestAnimationFrame(render);
    } else {
      bar.style.transform = `scaleX(${target})`;
      raf = 0;
    }
  };

  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
  measure();
}

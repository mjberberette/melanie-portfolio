import { gsap } from "../gsap.js";
import { prefersReducedMotion, qsa } from "../utils.js";

export function initCounters() {
  qsa("[data-count-to]").forEach((element) => {
    const target = Number(element.dataset.countTo);

    if (prefersReducedMotion()) {
      element.textContent = String(target);
      return;
    }

    const proxy = { value: 0 };
    gsap.to(proxy, {
      value: target,
      duration: 2,
      ease: "power2.out",
      snap: { value: 1 },
      onUpdate: () => {
        element.textContent = String(Math.round(proxy.value));
      },
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
    });
  });
}

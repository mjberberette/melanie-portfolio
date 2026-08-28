import { gsap } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

export function initAccordion() {
  const root = qs("#accordion");
  if (!root) return;

  const items = qsa(".accordion__item", root);

  const setOpen = (item, open, animate = true) => {
    const panel = qs(".accordion__panel", item);
    const trigger = qs(".accordion__trigger", item);
    const inner = qs(".accordion__inner", item);

    item.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));

    if (!animate || prefersReducedMotion()) {
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
  };

  items.forEach((item) => {
    setOpen(item, item.classList.contains("is-open"), false);

    qs(".accordion__trigger", item).addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          setOpen(other, false);
        }
      });
      setOpen(item, willOpen);
    });
  });

  window.addEventListener("resize", () => {
    items.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      qs(".accordion__panel", item).style.height = "auto";
    });
  });
}

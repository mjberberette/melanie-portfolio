import { qs, qsa } from "../utils.js";
import { scrollTo, startScroll, stopScroll } from "./smooth-scroll.js";

export function initNav() {
  const nav = qs("#nav");
  const burger = qs("#nav-burger");
  const menu = qs("#menu");

  let lastY = window.scrollY;
  let menuOpen = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    if (!menuOpen) {
      nav.classList.toggle("is-hidden", y > lastY && y > 320);
    }
    lastY = y;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    startScroll();
    setTimeout(() => {
      if (!menuOpen) menu.hidden = true;
    }, 700);
  };

  const openMenu = () => {
    menuOpen = true;
    menu.hidden = false;
    // Force a frame so the clip-path transition has a starting value.
    requestAnimationFrame(() => menu.classList.add("is-open"));
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    nav.classList.remove("is-hidden");
    stopScroll();
  };

  burger?.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  // Every in-page link routes through Lenis for a consistent easing curve.
  qsa("[data-scroll-to]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      const target = element.dataset.scrollTo;
      closeMenu();
      if (target === "#top") scrollTo(0, { duration: 1.6 });
      else scrollTo(target, { duration: 1.5, offset: -20 });
    });
  });
}

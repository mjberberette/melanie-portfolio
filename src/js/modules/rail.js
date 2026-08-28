import { qs, qsa } from "../utils.js";
import { scrollTo } from "./smooth-scroll.js";

/**
 * Rail navigation, ported from the design-B prototype:
 *   - scrollspy: the dot for the section nearest the top third lights up
 *   - the progress line fills with scroll (vertical rail / horizontal bar)
 *   - every [data-scroll-to] routes through Lenis for one easing curve
 */
export function initRail() {
  const links = qsa("[data-nav]");
  const sections = links.map((link) => ({
    link,
    section: document.getElementById(link.dataset.nav),
  }));
  const bar = qs("#rail-progress");
  const vertical = () => window.innerWidth > 760;

  const onScroll = () => {
    let active = 0;
    sections.forEach(({ section }, index) => {
      if (
        section &&
        section.getBoundingClientRect().top <= window.innerHeight * 0.35
      ) {
        active = index;
      }
    });
    links.forEach((link, index) =>
      link.classList.toggle("is-active", index === active),
    );

    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (vertical()) {
        bar.style.height = `${progress * 100}%`;
        bar.style.width = "1px";
      } else {
        bar.style.width = `${progress * 100}%`;
        bar.style.height = "1px";
      }
    }
  };

  let ticking = false;
  const queue = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      onScroll();
    });
  };

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  onScroll();

  qsa("[data-scroll-to]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      const target = element.dataset.scrollTo;
      if (target === "#top") scrollTo(0, { duration: 1.6 });
      else scrollTo(target, { duration: 1.5, offset: -20 });
    });
  });
}

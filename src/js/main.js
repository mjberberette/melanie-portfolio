import { ScrollTrigger } from "./gsap.js";
import { initAccordion } from "./modules/accordion.js";
import { initClock } from "./modules/clock.js";
import { initContact } from "./modules/contact.js";
import { initCounters } from "./modules/counters.js";
import { initCursor } from "./modules/cursor.js";
import { initHero } from "./modules/hero.js";
import { initIcons } from "./modules/icons.js";
import { initMagnetic } from "./modules/magnetic.js";
import { initMarquee } from "./modules/marquee.js";
import { initNav } from "./modules/nav.js";
import { initPreloader } from "./modules/preloader.js";
import { initReveals } from "./modules/reveal.js";
import { initScrollProgress } from "./modules/scroll-progress.js";
import { initSmoothScroll } from "./modules/smooth-scroll.js";
import { initWork } from "./modules/work.js";

function boot() {
  initSmoothScroll();
  initScrollProgress();
  initCursor();
  initNav();
  initMagnetic();
  initClock();
  initIcons();

  initHero();
  initReveals();
  initMarquee();
  initCounters();
  initWork();
  initAccordion();
  initContact();

  // Three.js is the heaviest dependency, so it loads as its own chunk while
  // the preloader is still on screen.
  import("./modules/monogram.js")
    .then(({ initMonogram }) => initMonogram())
    .catch(() => {});

  initPreloader();

  // Late-loading fonts change line breaks, so measure once they are ready.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

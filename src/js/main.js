import { ScrollTrigger } from "./gsap.js";
import { initAccordion } from "./modules/accordion.js";
import { initBrandMarks } from "./modules/brand-mark.js";
import { initClock } from "./modules/clock.js";
import { initContact } from "./modules/contact.js";
import { initCounters } from "./modules/counters.js";
import { initCursor } from "./modules/cursor.js";
import { initHero } from "./modules/hero.js";
import { initHeroEcho } from "./modules/hero-echo.js";
import { initIcons } from "./modules/icons.js";
import { initJourney } from "./modules/journey.js";
import { initMagnetic } from "./modules/magnetic.js";
import { initMarquee } from "./modules/marquee.js";
import { initPreloader } from "./modules/preloader.js";
import { initRail } from "./modules/rail.js";
import { initReveals } from "./modules/reveal.js";
import { initSmoothScroll } from "./modules/smooth-scroll.js";
import { initWhatYouGet } from "./modules/wyg.js";
import { initWork } from "./modules/work.js";

function boot() {
  initSmoothScroll();
  initCursor();
  initRail();
  initMagnetic();
  initClock();
  initIcons();
  initBrandMarks();

  initHero();
  initHeroEcho();
  initReveals();
  initJourney();
  initMarquee();
  initCounters();
  initWork();
  initWhatYouGet();
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

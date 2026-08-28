import { gsap, ScrollTrigger } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * The journey feed: cards zigzag down the page and a thin line snakes
 * between them, drawing itself as you scroll, with a node dot where it
 * meets each card. "Read more" expands the long-form note in place.
 *
 * The path is computed from the real card positions, so it survives
 * resizes and cards expanding.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

export function initJourney() {
  const feed = qs("#journey-feed");
  if (!feed) return;

  const svg = qs(".journey__path", feed);
  const cards = qsa(".jpost", feed);
  if (!svg || cards.length < 2) return;

  const reduced = prefersReducedMotion();
  const wide = window.matchMedia("(min-width: 48rem)");

  let path = null;
  let trigger = null;

  const anchors = () =>
    cards.map((card) => {
      const centerX = card.offsetLeft + card.offsetWidth / 2;
      const isLeft = centerX < feed.clientWidth / 2;
      return {
        x: isLeft ? card.offsetLeft + card.offsetWidth + 14 : card.offsetLeft - 14,
        y: card.offsetTop + Math.min(card.offsetHeight * 0.42, 150),
      };
    });

  const build = () => {
    trigger?.kill();
    trigger = null;
    svg.replaceChildren();
    if (!wide.matches) return;

    const points = anchors();
    const width = feed.clientWidth;
    const height = feed.scrollHeight;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");

    // Vertical-tangent S-curves between consecutive anchors.
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const bend = (b.y - a.y) * 0.55;
      d += ` C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
    }

    path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);

    for (const point of points) {
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", point.x);
      dot.setAttribute("cy", point.y);
      dot.setAttribute("r", 4.5);
      svg.appendChild(dot);
    }

    const length = path.getTotalLength();

    if (reduced) {
      path.style.strokeDasharray = "none";
      return;
    }

    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    trigger = ScrollTrigger.create({
      trigger: feed,
      start: "top 72%",
      end: "bottom 72%",
      scrub: 0.6,
      onUpdate: (self) => {
        path.style.strokeDashoffset = String(length * (1 - self.progress));
      },
    });
  };

  // Rebuild when the layout genuinely changes size.
  let lastKey = "";
  const observer = new ResizeObserver(() => {
    const key = `${feed.clientWidth}x${feed.scrollHeight}`;
    if (key === lastKey) return;
    lastKey = key;
    build();
  });
  observer.observe(feed);

  // Fonts shift card heights; rebuild once they settle.
  document.fonts?.ready.then(build);
  build();

  /* Read more / read less */
  cards.forEach((card) => {
    const toggle = qs(".jpost__toggle", card);
    const label = qs("[data-toggle-label]", card);
    const panel = qs(".jpost__more", card);
    const inner = qs(".jpost__more-inner", card);
    if (!toggle || !panel || !inner) return;

    toggle.addEventListener("click", () => {
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Read less" : "Read more";

      if (reduced) {
        panel.style.height = open ? "auto" : "0px";
        build();
        return;
      }

      gsap.killTweensOf(panel);
      gsap.to(panel, {
        height: open ? inner.offsetHeight : 0,
        duration: 0.55,
        ease: "mb-in-out",
        onComplete: () => {
          if (open) panel.style.height = "auto";
          build();
          ScrollTrigger.refresh();
        },
      });
    });
  });
}

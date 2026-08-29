import { gsap, ScrollTrigger, SplitText } from "../gsap.js";
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

/**
 * Rebuilds each ".jpost__year" ("’14") into per-digit reels and rolls them
 * into place, odometer-style, when the card scrolls into view. Non-digit
 * characters (the apostrophe) stay static.
 */
function buildYearReels(cards, reduced) {
  cards.forEach((card, cardIndex) => {
    const year = card.querySelector(".jpost__year");
    if (!year || reduced) return;

    const text = year.textContent.trim();
    year.textContent = "";
    year.setAttribute("aria-label", text);

    const reels = [];
    for (const char of text) {
      if (!/\d/.test(char)) {
        const still = document.createElement("span");
        still.textContent = char;
        year.appendChild(still);
        continue;
      }

      const target = Number(char);
      const viewport = document.createElement("span");
      viewport.className = "year-digit";
      const reel = document.createElement("span");
      reel.className = "year-reel";

      // Seven rows ending on the target digit, so every reel travels the
      // same distance and lands together.
      const rows = 7;
      for (let i = rows - 1; i >= 0; i -= 1) {
        const row = document.createElement("span");
        row.textContent = String((target - i + 20) % 10);
        reel.appendChild(row);
      }

      viewport.appendChild(reel);
      year.appendChild(viewport);
      reels.push(reel);
    }

    if (!reels.length) return;

    gsap.fromTo(
      reels,
      { yPercent: 0 },
      {
        // Land on the last row: travel (rows-1)/rows of the reel height.
        yPercent: -100 * (6 / 7),
        duration: 1.5,
        stagger: 0.12,
        ease: "mb-out",
        delay: 0.15 + (cardIndex % 2) * 0.05,
        scrollTrigger: {
          trigger: card,
          start: "top 86%",
          once: true,
        },
      },
    );
  });
}

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

  /* Entrances: borrowed from the "what you get" statement — the card rises
     in softly while its title and teaser words sharpen out of a blur, one
     word after another. The year still rolls up like an odometer. */
  if (!reduced) {
    cards.forEach((card) => {
      const copy = qsa("h3, .jpost__teaser", qs(".jpost__card", card) ?? card);
      const split = new SplitText(copy, {
        type: "words",
        wordsClass: "jword",
      });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      });

      tl.from(card, {
        autoAlpha: 0,
        y: 32,
        duration: 0.9,
        ease: "mb-out",
      }).fromTo(
        split.words,
        { opacity: 0.1, filter: "blur(7px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.035,
        },
        0.12,
      );
    });
  }

  buildYearReels(cards, reduced);

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

    const dots = points.map((point) => {
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", point.x);
      dot.setAttribute("cy", point.y);
      dot.setAttribute("r", 4.5);
      svg.appendChild(dot);
      return dot;
    });

    const length = path.getTotalLength();

    if (reduced) {
      path.style.strokeDasharray = "none";
      dots.forEach((dot) => dot.classList.add("is-lit"));
      return;
    }

    // Where along the thread each node sits, so it can ignite on arrival.
    const fractions = points.map((point) => {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i <= 220; i += 1) {
        const t = i / 220;
        const sample = path.getPointAtLength(length * t);
        const dist = Math.hypot(sample.x - point.x, sample.y - point.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = t;
        }
      }
      return best;
    });

    // The luminous head that rides the tip of the thread.
    const halo = document.createElementNS(SVG_NS, "circle");
    halo.setAttribute("r", 14);
    halo.setAttribute("class", "journey__head-halo");
    const head = document.createElementNS(SVG_NS, "circle");
    head.setAttribute("r", 3.4);
    head.setAttribute("class", "journey__head");
    svg.append(halo, head);

    const setHead = (progress) => {
      const point = path.getPointAtLength(length * progress);
      const visible = progress > 0.001 && progress < 0.999;
      for (const node of [halo, head]) {
        node.setAttribute("cx", point.x);
        node.setAttribute("cy", point.y);
        node.style.opacity = visible ? "1" : "0";
      }
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-lit", progress >= fractions[i] - 0.005);
      });
    };

    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    setHead(0);

    trigger = ScrollTrigger.create({
      trigger: feed,
      start: "top 72%",
      end: "bottom 72%",
      scrub: 0.6,
      onUpdate: (self) => {
        path.style.strokeDashoffset = String(length * (1 - self.progress));
        setHead(self.progress);
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

  /* "Read more": an inverted detail panel pops in beside the card. */
  let openPost = null;

  const closeDetail = (post, instant = false) => {
    if (!post) return;
    const detail = qs(".jpost__detail", post);
    const toggle = qs(".jpost__toggle", post);
    toggle?.setAttribute("aria-expanded", "false");
    if (openPost === post) openPost = null;

    if (reduced || instant) {
      detail.hidden = true;
      return;
    }

    gsap.killTweensOf(detail);
    gsap.to(detail, {
      autoAlpha: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        detail.hidden = true;
      },
    });
  };

  const openDetail = (post) => {
    if (openPost && openPost !== post) closeDetail(openPost, true);
    openPost = post;

    const detail = qs(".jpost__detail", post);
    const toggle = qs(".jpost__toggle", post);
    toggle?.setAttribute("aria-expanded", "true");
    detail.hidden = false;

    // The panel grows out of the edge that touches its card.
    const index = cards.indexOf(post);
    const origin = !wide.matches
      ? "center 80%"
      : index % 2 === 0
        ? "left center"
        : "right center";

    if (reduced) {
      gsap.set(detail, { autoAlpha: 1, scale: 1, x: 0, y: 0 });
    } else {
      gsap.killTweensOf(detail);
      gsap.fromTo(
        detail,
        {
          autoAlpha: 0,
          scale: 0.82,
          x: !wide.matches ? 0 : index % 2 === 0 ? -26 : 26,
          y: 14,
          transformOrigin: origin,
        },
        {
          autoAlpha: 1,
          scale: 1,
          x: 0,
          y: 0,
          duration: 0.65,
          ease: "back.out(1.5)",
        },
      );
    }

    qs(".jpost__close", post)?.focus({ preventScroll: true });
  };

  cards.forEach((post) => {
    qs(".jpost__toggle", post)?.addEventListener("click", () => {
      if (openPost === post) closeDetail(post);
      else openDetail(post);
    });
    qs(".jpost__close", post)?.addEventListener("click", () => {
      closeDetail(post);
      qs(".jpost__toggle", post)?.focus({ preventScroll: true });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail(openPost);
  });

  document.addEventListener("click", (event) => {
    if (!openPost) return;
    if (event.target.closest(".jpost__detail, .jpost__toggle")) return;
    closeDetail(openPost);
  });
}

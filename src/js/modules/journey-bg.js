import { gsap } from "../gsap.js";
import { clamp, prefersReducedMotion, qs } from "../utils.js";

/**
 * Wayfinding chart behind the journey timeline: a quiet grid of plus-marks
 * that drifts diagonally and parallaxes against the scroll, with vermilion
 * sonar pings expanding from random grid nodes — a map being surveyed.
 *
 * The canvas is viewport-sized and sticky inside the section, so it stays
 * cheap no matter how tall the timeline grows. Pauses off-screen, and
 * reduced motion gets a static chart.
 */

const BONE = "241, 237, 229";
const VERMILION = "255, 74, 28";
const SPACING = 78; // grid cell size in px
const PARALLAX = 0.16; // how much of the scroll the pattern follows
const PING_EVERY = 2.6; // seconds between pings
const PING_LIFE = 3.2; // seconds a ping stays on screen
const PING_MAX_R = 110;

export function initJourneyBg() {
  const canvas = qs("#journey-bg");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const reduced = prefersReducedMotion();

  let width = 0;
  let height = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced) drawGrid(0, 0, 0);
  };

  const plus = (x, y, size, alpha, accent = false) => {
    context.strokeStyle = accent
      ? `rgba(${VERMILION}, ${alpha})`
      : `rgba(${BONE}, ${alpha})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x - size, y);
    context.lineTo(x + size, y);
    context.moveTo(x, y - size);
    context.lineTo(x, y + size);
    context.stroke();
  };

  /** The plus-grid, offset by drift + parallax, shimmering cell by cell. */
  const drawGrid = (offsetX, offsetY, time) => {
    context.clearRect(0, 0, width, height);

    const startX = -((offsetX % SPACING) + SPACING) % SPACING;
    const startY = -((offsetY % SPACING) + SPACING) % SPACING;

    for (let x = startX; x < width + SPACING; x += SPACING) {
      for (let y = startY; y < height + SPACING; y += SPACING) {
        // Stable cell identity regardless of drift, for shimmer + accents.
        const ix = Math.round((x + offsetX) / SPACING);
        const iy = Math.round((y + offsetY) / SPACING);

        const shimmer = time
          ? 0.5 + 0.5 * Math.sin(time * 0.9 + ix * 0.83 + iy * 1.47)
          : 0.5;
        const isAccent = ((ix * 7 + iy * 13) % 31 + 31) % 31 === 0;

        if (isAccent) {
          plus(x, y, 3.4, 0.16 + shimmer * 0.2, true);
        } else {
          plus(x, y, 2.6, 0.05 + shimmer * 0.07);
        }
      }
    }
  };

  resize();
  new ResizeObserver(resize).observe(canvas);

  if (reduced) return;

  let visible = true;
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: "80px" },
  ).observe(canvas);

  let time = 0;
  let pingTimer = 0;
  const pings = [];

  const frame = () => {
    if (!visible || !width || !height) return;
    const dt = gsap.ticker.deltaRatio(60) / 60;
    time += dt;
    pingTimer += dt;

    // Slow diagonal drift + a fraction of the page scroll for depth.
    const offsetX = time * 3.5;
    const offsetY = time * 2 + window.scrollY * PARALLAX;

    drawGrid(offsetX, offsetY, time);

    // Spawn a ping on a random on-screen grid node.
    if (pingTimer >= PING_EVERY) {
      pingTimer = 0;
      pings.push({
        gx: Math.floor(Math.random() * (width / SPACING)),
        gy: Math.floor(Math.random() * (height / SPACING)),
        age: 0,
      });
    }

    for (let i = pings.length - 1; i >= 0; i -= 1) {
      const ping = pings[i];
      ping.age += dt;
      const t = ping.age / PING_LIFE;
      if (t >= 1) {
        pings.splice(i, 1);
        continue;
      }

      // Keep the ping glued to its grid node while the grid drifts.
      const x = ping.gx * SPACING - (((offsetX % SPACING) + SPACING) % SPACING);
      const y = ping.gy * SPACING - (((offsetY % SPACING) + SPACING) % SPACING);

      const eased = 1 - Math.pow(1 - t, 2.4);
      const alpha = clamp(Math.min(t * 8, 1) * Math.pow(1 - t, 1.7), 0, 1);

      context.strokeStyle = `rgba(${VERMILION}, ${alpha * 0.4})`;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(x, y, 4 + eased * PING_MAX_R, 0, Math.PI * 2);
      context.stroke();

      // Second, tighter ring trailing the first.
      const trail = clamp(eased - 0.22, 0, 1);
      if (trail > 0) {
        context.strokeStyle = `rgba(${VERMILION}, ${alpha * 0.22})`;
        context.beginPath();
        context.arc(x, y, 4 + trail * PING_MAX_R, 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = `rgba(${VERMILION}, ${alpha * 0.8})`;
      context.beginPath();
      context.arc(x, y, 2.2, 0, Math.PI * 2);
      context.fill();
    }
  };

  gsap.ticker.add(frame);
}

import { gsap } from "../gsap.js";
import { clamp, lerp, prefersReducedMotion, qs } from "../utils.js";

/**
 * "Hexagonal sonar" behind the 3D mark: cube outlines — the monogram's own
 * silhouette — emitted from behind the logo. Each ring expands, rotates a few
 * degrees and fades; every third one is vermilion with lit vertices.
 */

const BONE = "241, 237, 229";
const VERMILION = "255, 74, 28";
const PERIOD = 2.3; // seconds between emissions
const ALIVE = 6; // rings on screen at once
const LIFE = PERIOD * ALIVE;

export function initHeroEcho() {
  const canvas = qs("#hero-echo");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const reduced = prefersReducedMotion();

  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduced) drawStatic();
  };

  const hexPoint = (cx, cy, radius, index, rotation) => {
    // Pointy-top hexagon, squashed slightly taller to hug the mark.
    const angle = rotation + (Math.PI / 3) * index - Math.PI / 2;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 1.12];
  };

  const drawHex = (cx, cy, radius, rotation, stroke, lineWidth, dots = 0) => {
    context.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const [x, y] = hexPoint(cx, cy, radius, i, rotation);
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();

    if (dots > 0.01) {
      context.fillStyle = `rgba(${VERMILION}, ${dots})`;
      for (let i = 0; i < 6; i += 1) {
        const [x, y] = hexPoint(cx, cy, radius, i, rotation);
        context.beginPath();
        context.arc(x, y, 2, 0, Math.PI * 2);
        context.fill();
      }
    }
  };

  const geometry = () => {
    const cx = width / 2;
    const cy = height / 2;
    const r0 = Math.min(width, height) * 0.21;
    const r1 = Math.hypot(width, height) * 0.62;
    return { cx, cy, r0, r1 };
  };

  const drawStatic = () => {
    context.clearRect(0, 0, width, height);
    const { cx, cy, r0 } = geometry();
    for (let i = 0; i < 3; i += 1) {
      drawHex(cx, cy, r0 * (1 + i * 0.45), 0, `rgba(${BONE}, ${0.14 - i * 0.04})`, 1);
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
    { rootMargin: "60px" },
  ).observe(canvas);

  let time = 0;

  const frame = () => {
    if (!visible || !width || !height) return;
    time += gsap.ticker.deltaRatio(60) / 60;

    context.clearRect(0, 0, width, height);
    const { cx, cy, r0, r1 } = geometry();

    // Resting outline the emissions grow out of.
    const breath = 1 + Math.sin(time * 1.4) * 0.012;
    drawHex(cx, cy, r0 * breath, 0, `rgba(${BONE}, 0.16)`, 1.4);

    for (let i = 0; i < ALIVE; i += 1) {
      // Stagger emissions evenly through the loop.
      const t = ((time / LIFE + i / ALIVE) % 1 + 1) % 1;
      const eased = 1 - Math.pow(1 - t, 2.1);
      const radius = lerp(r0, r1, eased);
      const rotation = t * 0.09; // drifts ~5° as it expands

      // Fade in fast, out slow.
      const alpha = clamp(Math.min(t * 6, 1) * Math.pow(1 - t, 1.6), 0, 1);
      const isAccent = i % 3 === 2;

      const stroke = isAccent
        ? `rgba(${VERMILION}, ${alpha * 0.5})`
        : `rgba(${BONE}, ${alpha * 0.34})`;

      drawHex(
        cx,
        cy,
        radius,
        rotation,
        stroke,
        lerp(1.6, 0.6, t),
        isAccent ? alpha * 0.55 : 0,
      );
    }
  };

  gsap.ticker.add(frame);
}

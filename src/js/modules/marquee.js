import { gsap, ScrollTrigger } from "../gsap.js";
import { prefersReducedMotion, qs } from "../utils.js";

/** Infinite ticker whose speed and skew answer to scroll velocity. */
export function initMarquee() {
  const track = qs("#marquee-track");
  if (!track || prefersReducedMotion()) return;

  const group = track.firstElementChild;
  track.appendChild(group.cloneNode(true));
  track.appendChild(group.cloneNode(true));

  const distance = group.offsetWidth;

  const tween = gsap.to(track, {
    x: -distance,
    duration: 22,
    ease: "none",
    repeat: -1,
    modifiers: { x: (value) => `${parseFloat(value) % distance}px` },
  });

  let velocity = 0;
  const setSkew = gsap.quickSetter(track, "skewX", "deg");

  ScrollTrigger.create({
    trigger: track.closest(".marquee"),
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      velocity = self.getVelocity();
    },
  });

  // Velocity decays every frame so the skew always settles back to zero.
  gsap.ticker.add(() => {
    velocity *= 0.88;
    if (Math.abs(velocity) < 1) velocity = 0;
    setSkew(gsap.utils.clamp(-7, 7, -velocity / 320));
    tween.timeScale(gsap.utils.clamp(0.35, 4.5, 1 + Math.abs(velocity) / 1100));
  });
}

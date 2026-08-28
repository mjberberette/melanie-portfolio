import { gsap, ScrollTrigger, SplitText } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * "What you get" — a clone of heynesh.com's capabilities overview:
 *   - the pill label wipes open as the statement enters the viewport
 *   - the statement is split into characters that sharpen from a blurred
 *     ghost state, scrubbed by scroll
 *   - capability chips are parked inside empty slots in the sentence, pop
 *     in one by one, and expand into full cards on hover / focus / tap
 */

// Viewport lines (in % of height) the statement's top crosses to pop each chip.
const POP_STARTS = [85, 68, 54, 42, 28];

const OPEN_MAX_W = 340;

export function initWhatYouGet() {
  const section = qs(".wyg");
  if (!section) return;

  const stage = qs("[data-wyg-stage]", section);
  const statement = qs("[data-wyg-statement]", section);
  const label = qs("[data-wyg-label]", section);
  const cards = qsa(".wyg-card", section);
  if (!stage || !statement) return;

  const reduced = prefersReducedMotion();

  /* Statement: ghost characters sharpen with scroll --------------------- */
  if (!reduced) {
    const frags = qsa(".wyg__frag", statement);
    // Words wrap as units (chars alone would break mid-word), chars animate.
    const split = new SplitText(frags, {
      type: "words,chars",
      charsClass: "wyg-char",
    });
    gsap.fromTo(
      split.chars,
      { opacity: 0.13, filter: "blur(5px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.04,
        ease: "none",
        scrollTrigger: {
          trigger: statement,
          start: "top 92%",
          end: "top 30%",
          scrub: 0.5,
        },
      },
    );
  }

  /* Pill label wipes open ------------------------------------------------ */
  if (label && !reduced) {
    const width = label.offsetWidth;
    gsap.fromTo(
      label,
      { width: 0, autoAlpha: 0 },
      {
        width,
        autoAlpha: 1,
        duration: 0.7,
        ease: "mb-in-out",
        scrollTrigger: { trigger: section, start: "top 72%", once: true },
        onComplete: () => gsap.set(label, { clearProps: "width" }),
      },
    );
  }

  /* Chips: park each card over its slot in the sentence ------------------ */
  const measure = () => {
    const stageRect = stage.getBoundingClientRect();
    cards.forEach((card) => {
      const slot = qs(`[data-slot="${card.dataset.for}"]`, statement);
      if (!slot || card.classList.contains("is-open")) return;
      const rect = slot.getBoundingClientRect();
      const chip = {
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        x: Math.round(rect.left - stageRect.left),
        y: Math.round(rect.top - stageRect.top),
      };
      card.dataset.chip = JSON.stringify(chip);
      gsap.set(card, {
        left: chip.x,
        top: chip.y,
        width: chip.w,
        height: chip.h,
      });
      card.style.setProperty("--chip-h", `${chip.h}px`);
    });
  };

  /* Pop-in: chips scale up one by one as the sentence travels up --------- */
  if (reduced) {
    gsap.set(cards, { autoAlpha: 1 });
  } else {
    gsap.set(cards, { autoAlpha: 0, scale: 0.5 });
    cards.forEach((card, index) => {
      ScrollTrigger.create({
        trigger: statement,
        start: `top ${POP_STARTS[index % POP_STARTS.length]}%`,
        once: true,
        onEnter: () =>
          gsap.to(card, {
            autoAlpha: 1,
            scale: 1,
            duration: 0.7,
            ease: "back.out(1.7)",
          }),
      });
    });
  }

  /* Hover / focus / tap: the chip grows into a card ---------------------- */
  const speed = reduced ? 0 : 1;

  const openCard = (card) => {
    const chip = JSON.parse(card.dataset.chip ?? "null");
    if (!chip || card.classList.contains("is-open")) return;

    const body = qs(".wyg-card__body", card);
    const stageW = stage.clientWidth;
    const openW = Math.min(OPEN_MAX_W, stageW);
    body.style.width = `${openW - 2}px`;
    const openH = Math.max(chip.h, 44) + body.offsetHeight;
    const openX = Math.max(0, Math.min(chip.x, stageW - openW));

    card.classList.add("is-open");
    card.setAttribute("aria-expanded", "true");
    card.style.zIndex = 8;
    card.dataset.openedAt = String(performance.now());

    gsap.killTweensOf([card, body]);
    gsap.to(card, {
      left: openX,
      width: openW,
      height: openH,
      duration: 0.55 * speed,
      ease: "mb-out",
    });
    gsap.fromTo(
      body,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.5 * speed, delay: 0.08 * speed },
    );
  };

  const closeCard = (card) => {
    const chip = JSON.parse(card.dataset.chip ?? "null");
    if (!chip || !card.classList.contains("is-open")) return;

    const body = qs(".wyg-card__body", card);
    card.classList.remove("is-open");
    card.setAttribute("aria-expanded", "false");

    gsap.killTweensOf([card, body]);
    gsap.to(body, { autoAlpha: 0, duration: 0.2 * speed });
    gsap.to(card, {
      left: chip.x,
      width: chip.w,
      height: chip.h,
      duration: 0.45 * speed,
      ease: "mb-out",
      onComplete: () => {
        card.style.zIndex = "";
      },
    });
  };

  const closeAll = () => cards.forEach(closeCard);

  const hoverable = window.matchMedia("(hover: hover)").matches;
  const toggle = (card) => {
    if (card.classList.contains("is-open")) {
      closeCard(card);
    } else {
      closeAll();
      openCard(card);
    }
  };

  cards.forEach((card) => {
    card.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") openCard(card);
    });
    card.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") closeCard(card);
    });
    card.addEventListener("click", (event) => {
      // Mouse users already opened the card via hover.
      if (hoverable && event.pointerType === "mouse") return;
      // Tapping also focuses, and focus just opened the card — don't undo it.
      const justOpened =
        performance.now() - Number(card.dataset.openedAt || 0) < 400;
      if (card.classList.contains("is-open") && justOpened) return;
      toggle(card);
    });
    card.addEventListener("focus", () => openCard(card));
    card.addEventListener("blur", () => closeCard(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle(card);
      }
      if (event.key === "Escape") {
        closeCard(card);
        card.blur();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".wyg-card")) closeAll();
  });

  /* Keep chips glued to their slots through reflows ---------------------- */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      closeAll();
      measure();
    }, 150);
  });
  ScrollTrigger.addEventListener("refresh", measure);
  document.fonts?.ready.then(measure);
  measure();
}

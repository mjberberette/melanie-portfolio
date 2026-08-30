import { animate, stagger } from "motion";
import { gsap, ScrollTrigger, SplitText } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Capabilities — "What I am hired to do".
 *
 * The accordion carries the section's cinema:
 *   - rows enter with their hairlines drawing across while the number,
 *     icon and toggle cascade in and the label sharpens out of a blur
 *   - a pool of light follows the cursor inside each row
 *   - opening a row draws an accent rail, replays its icon, blurs the
 *     copy in and spring-pops the tags (Motion)
 *   - a giant ghost index in the sticky aside rolls to whichever row
 *     is hovered or open
 */
export function initAccordion() {
  const root = qs("#accordion");
  if (!root) return;

  const items = qsa(".accordion__item", root);
  const reduced = prefersReducedMotion();

  /* Ghost index stage ------------------------------------------------------ */
  const stageNo = qs("[data-craft-no]");
  const stageCaption = qs("[data-craft-caption]");
  let stageCurrent = 0;

  const setStage = (index) => {
    if (!stageNo || index === stageCurrent) return;
    stageCurrent = index;
    const number = String(index + 1).padStart(2, "0");
    const caption = qs(".accordion__label", items[index])?.textContent ?? "";

    if (reduced) {
      stageNo.textContent = number;
      if (stageCaption) stageCaption.textContent = caption;
      return;
    }

    gsap.killTweensOf(stageNo);
    gsap.to(stageNo, {
      yPercent: -36,
      autoAlpha: 0,
      filter: "blur(6px)",
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        stageNo.textContent = number;
        if (stageCaption) stageCaption.textContent = caption;
        gsap.fromTo(
          stageNo,
          { yPercent: 36, autoAlpha: 0, filter: "blur(6px)" },
          {
            yPercent: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "mb-out",
          },
        );
      },
    });
  };

  /* Open / close ----------------------------------------------------------- */
  const setOpen = (item, open, animateIt = true) => {
    const panel = qs(".accordion__panel", item);
    const trigger = qs(".accordion__trigger", item);
    const inner = qs(".accordion__inner", item);

    item.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));

    if (!animateIt || reduced) {
      panel.style.height = open ? "auto" : "0px";
      return;
    }

    gsap.killTweensOf(panel);
    gsap.to(panel, {
      height: open ? inner.offsetHeight : 0,
      duration: 0.55,
      ease: "mb-in-out",
      onComplete: () => {
        if (open) panel.style.height = "auto";
      },
    });

    if (!open) return;

    // Content choreography: copy sharpens in, tags pop with spring physics.
    qs("lord-icon", item)?.player?.playFromBeginning?.();

    const copy = qsa(".accordion__inner > p:not(.tags)", item);
    if (copy.length) {
      gsap.fromTo(
        copy,
        { autoAlpha: 0, y: 16, filter: "blur(6px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "mb-out",
          delay: 0.12,
        },
      );
    }

    const tags = qsa(".tags i", item);
    if (tags.length) {
      tags.forEach((tag) => {
        tag.style.opacity = "0";
      });
      animate(
        tags,
        { opacity: [0, 1], scale: [0.6, 1], y: [10, 0] },
        {
          type: "spring",
          stiffness: 380,
          damping: 24,
          delay: stagger(0.055, { startDelay: 0.2 }),
        },
      );
    }
  };

  items.forEach((item, index) => {
    setOpen(item, item.classList.contains("is-open"), false);

    const trigger = qs(".accordion__trigger", item);

    trigger.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          setOpen(other, false);
        }
      });
      setOpen(item, willOpen);
      if (willOpen) setStage(index);
    });

    // The spotlight tracks the pointer; the stage previews the hovered row.
    trigger.addEventListener("pointermove", (event) => {
      const rect = trigger.getBoundingClientRect();
      trigger.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      trigger.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") setStage(index);
    });
  });

  // Leaving the list returns the stage to the open row.
  root.addEventListener("pointerleave", () => {
    const openIndex = items.findIndex((item) =>
      item.classList.contains("is-open"),
    );
    if (openIndex >= 0) setStage(openIndex);
  });

  /* Row entrances ----------------------------------------------------------- */
  if (!reduced) {
    root.classList.add("is-cine");

    items.forEach((item, index) => {
      const line = document.createElement("span");
      line.className = "accordion__line";
      line.setAttribute("aria-hidden", "true");
      item.prepend(line);

      let endLine = null;
      if (index === items.length - 1) {
        endLine = document.createElement("span");
        endLine.className = "accordion__line accordion__line--end";
        endLine.setAttribute("aria-hidden", "true");
        item.append(endLine);
      }

      const number = qs(".accordion__number", item);
      const icon = qs(".accordion__icon", item);
      const label = qs(".accordion__label", item);
      const toggle = qs(".accordion__toggle", item);
      const words = new SplitText(label, {
        type: "words",
        wordsClass: "aword",
      }).words;

      const tl = gsap.timeline({
        delay: index * 0.08,
        scrollTrigger: { trigger: item, start: "top 88%", once: true },
      });

      tl.fromTo(
        [line, endLine].filter(Boolean),
        { scaleX: 0 },
        { scaleX: 1, duration: 1, ease: "mb-in-out" },
        0,
      )
        .from(number, { autoAlpha: 0, y: 14, duration: 0.5 }, 0.15)
        // Scale only: the icon's opacity belongs to a CSS hover transition,
        // and GSAP tweening the same property records a poisoned end value.
        .from(
          icon,
          { scale: 0, duration: 0.55, ease: "back.out(1.8)" },
          0.22,
        )
        .fromTo(
          words,
          { opacity: 0.08, filter: "blur(7px)" },
          {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.05,
          },
          0.2,
        )
        .from(
          toggle,
          { autoAlpha: 0, rotate: -90, duration: 0.6, ease: "mb-out" },
          0.3,
        );
    });

    // The ghost index breathes in with the section.
    if (stageNo) {
      gsap.from(stageNo, {
        autoAlpha: 0,
        yPercent: 24,
        filter: "blur(8px)",
        duration: 0.9,
        ease: "mb-out",
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
      });
    }
  }

  window.addEventListener("resize", () => {
    items.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      qs(".accordion__panel", item).style.height = "auto";
    });
  });
}

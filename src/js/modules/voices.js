import { animate, hover } from "motion";
import { gsap, SplitText } from "../gsap.js";
import { prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Testimonials — same cinematic language as the capabilities section:
 *   - each quote's hairline draws across while the serif mark springs in,
 *     the copy sharpens out of a blur word by word and the caption rises
 *   - a pool of light follows the cursor inside each quote
 *   - Motion lifts the hovered quote on spring physics
 *   - a giant ghost quotation mark drifts behind the section with scroll
 */
export function initVoices() {
  const section = qs(".voices");
  if (!section) return;

  const wrap = qs("[data-quotes]", section);
  const quotes = qsa(".quote", section);
  const ghost = qs("[data-voices-ghost]", section);
  const reduced = prefersReducedMotion();
  if (!wrap || !quotes.length || reduced) return;

  wrap.classList.add("is-cine");

  quotes.forEach((quote, index) => {
    const line = document.createElement("span");
    line.className = "quote__line";
    line.setAttribute("aria-hidden", "true");
    quote.prepend(line);

    const mark = qs(".quote__mark", quote);
    const caption = qs("figcaption", quote);
    const words = new SplitText(qs("blockquote p", quote), {
      type: "words",
      wordsClass: "qword",
    }).words;

    const tl = gsap.timeline({
      delay: index * 0.12,
      scrollTrigger: { trigger: wrap, start: "top 82%", once: true },
    });

    tl.fromTo(
      line,
      { scaleX: 0 },
      { scaleX: 1, duration: 1, ease: "mb-in-out" },
      0,
    )
      .from(
        mark,
        {
          autoAlpha: 0,
          scale: 0.3,
          y: 18,
          duration: 0.6,
          ease: "back.out(1.8)",
        },
        0.12,
      )
      .fromTo(
        words,
        { opacity: 0.08, filter: "blur(6px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.016,
        },
        0.2,
      )
      .from(caption, { autoAlpha: 0, y: 16, duration: 0.6 }, 0.55);

    // Spotlight follows the pointer inside the quote.
    quote.addEventListener("pointermove", (event) => {
      const rect = quote.getBoundingClientRect();
      quote.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      quote.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  // Springy lift while hovering a quote.
  hover(quotes, (quote) => {
    animate(quote, { y: -8 }, { type: "spring", stiffness: 300, damping: 22 });
    return () => {
      animate(quote, { y: 0 }, { type: "spring", stiffness: 260, damping: 26 });
    };
  });

  // The ghost mark drifts against the scroll.
  if (ghost) {
    gsap.fromTo(
      ghost,
      { yPercent: 18 },
      {
        yPercent: -14,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      },
    );
  }
}

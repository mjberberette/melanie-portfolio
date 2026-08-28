import { lerp, prefersReducedMotion, qs, qsa } from "../utils.js";

/**
 * Desktop case-study list: hovering a row dims the others and floats a preview
 * panel next to the pointer. A row shows, in order of preference, its video,
 * the animated monogram, or a generative poster.
 */
export function initWork() {
  const list = qs("#work-list");
  const previews = qs("#work-previews");
  if (!list || !previews) return;

  const rows = qsa(".work__row", list);
  const panels = qsa(".preview", previews);

  mountVideos();
  mountMarks();

  if (prefersReducedMotion()) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const pointer = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let active = -1;
  let raf = 0;

  // Keep the panel inside the viewport instead of letting it hang off an edge.
  const clampX = (value) => {
    const half = (panels[0]?.offsetWidth || 384) / 2 + 24;
    return Math.min(Math.max(value, half), window.innerWidth - half);
  };

  const render = () => {
    current.x = lerp(current.x, clampX(pointer.x), 0.16);
    current.y = lerp(current.y, pointer.y, 0.16);
    previews.style.transform = `translate(${current.x}px, ${current.y}px)`;
    raf = requestAnimationFrame(render);
  };

  const setActive = (index) => {
    if (active === index) return;
    active = index;

    list.classList.toggle("is-hovering", index >= 0);
    previews.classList.toggle("is-active", index >= 0);

    panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle("is-active", on);

      const video = panel.querySelector("video");
      if (video) {
        if (on) video.play().catch(() => {});
        else video.pause();
      }
    });

    if (index >= 0 && !raf) raf = requestAnimationFrame(render);
    if (index < 0 && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  list.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    },
    { passive: true },
  );

  rows.forEach((row, index) => {
    const activate = () => {
      // Jump the panel to the pointer the first time so it does not fly in.
      if (active < 0) {
        current.x = clampX(pointer.x);
        current.y = pointer.y;
      }
      setActive(index);
    };
    row.addEventListener("pointerenter", activate);
    row.addEventListener("focus", () => {
      const rect = row.getBoundingClientRect();
      pointer.x = rect.left + rect.width * 0.7;
      pointer.y = rect.top + rect.height / 2;
      activate();
    });
    row.addEventListener("blur", () => setActive(-1));
  });

  list.addEventListener("pointerleave", () => setActive(-1));
}

/** Turns `data-video` into a real <video> element inside its poster slot. */
function mountVideos() {
  qsa("[data-video]").forEach((holder) => {
    const source = holder.dataset.video;
    if (!source) return;

    const video = document.createElement("video");
    video.src = source;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (holder.dataset.poster) video.poster = holder.dataset.poster;

    video.addEventListener("error", () => video.remove(), { once: true });
    holder.prepend(video);
  });
}

/** The identity project previews with the real animated monogram. */
function mountMarks() {
  const hosts = qsa("[data-lottie-mark]");
  if (!hosts.length) return;

  import("lottie-web")
    .then(({ default: lottie }) => {
      hosts.forEach((host) => {
        lottie.loadAnimation({
          container: host,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "/logo/mb-monogram-alpha.json",
        });
      });
    })
    .catch(() => {});
}

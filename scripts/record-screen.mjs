/**
 * Records a real scroll-through of a live project site — its own animations,
 * scroll-driven sections and all — for playback inside an iPad mockup in the
 * work gallery. This is how "true scroll" previews are produced for real
 * client sites (the fictional case studies still use the still captures from
 * make-screens.mjs).
 *
 * Usage:  node scripts/record-screen.mjs [name] [url]
 *         node scripts/record-screen.mjs everypeer https://everypeer.com/
 *         RECORD_LIMIT_S=6 node scripts/record-screen.mjs …   (short test take)
 *
 * Output: public/media/screens/<name>.mp4         (H.264 — plays everywhere;
 *                                                   VP9 came out larger on
 *                                                   starfield-heavy footage)
 *         public/media/screens/<name>-poster.jpg
 *
 * How it stays smooth: a real-time screen recording of headless Chrome is only
 * as smooth as the software renderer, which for a WebGL-heavy page can be a few
 * frames a second. So instead the page's clock is frozen once it has loaded,
 * and the tape is built one frame at a time: set the exact scroll position for
 * that instant, advance the page's time by exactly one frame (running its
 * requestAnimationFrame callbacks and due timers), capture, repeat. Every frame
 * lands precisely on the timeline no matter how long it took to render.
 *
 * Requires ffmpeg on PATH.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const [name = "everypeer", url = "https://everypeer.com/"] = process.argv.slice(2);
const OUT = "public/media/screens";
fs.mkdirSync(OUT, { recursive: true });

// 3:4 to match the iPad screen. Even dimensions keep H.264 happy.
const WIDTH = 810;
const HEIGHT = 1080;
const FPS = 60;

// Reading pace, in CSS px per second, and how long to rest at the ends so the
// loop has a beat before it rewinds.
const SPEED = 260;
const REST_MS = 1400;
const REWIND_MS = 2600;
const LIMIT_S = Number(process.env.RECORD_LIMIT_S) || 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Installed before any page script runs. Passes straight through to the real
   clock until freeze() is called, so the site loads and plays its intro at
   normal speed; after that, time only moves when tick(dt) says so. The patched
   functions check the mode themselves, so references a bundle captured at
   load time keep working. */
const virtualClock = () => {
  const realNow = performance.now.bind(performance);
  const RealDate = Date;
  const realRAF = window.requestAnimationFrame.bind(window);
  const realCAF = window.cancelAnimationFrame.bind(window);
  const realSetTimeout = window.setTimeout.bind(window);
  const realClearTimeout = window.clearTimeout.bind(window);
  const realSetInterval = window.setInterval.bind(window);
  const realClearInterval = window.clearInterval.bind(window);

  let frozen = false;
  let now = 0; // virtual performance.now() once frozen
  let epoch = 0; // Date.now() - performance.now() at freeze
  let rafQueue = new Map();
  let rafId = 1e6;
  const timers = new Map();
  let timerId = 1e6;

  performance.now = () => (frozen ? now : realNow());
  class VDate extends RealDate {
    constructor(...a) {
      if (a.length === 0 && frozen) super(epoch + now);
      else super(...a);
    }
    static now() {
      return frozen ? epoch + now : RealDate.now();
    }
  }
  window.Date = VDate;

  window.requestAnimationFrame = (cb) => {
    if (!frozen) return realRAF(cb);
    rafQueue.set(++rafId, cb);
    return rafId;
  };
  window.cancelAnimationFrame = (id) => {
    if (id < 1e6) return realCAF(id);
    rafQueue.delete(id);
  };
  window.setTimeout = (fn, ms = 0, ...args) => {
    if (!frozen || typeof fn !== "function") return realSetTimeout(fn, ms, ...args);
    timers.set(++timerId, { fn, args, due: now + Math.max(0, ms), every: 0 });
    return timerId;
  };
  window.setInterval = (fn, ms = 0, ...args) => {
    if (!frozen || typeof fn !== "function") return realSetInterval(fn, ms, ...args);
    const every = Math.max(1, ms);
    timers.set(++timerId, { fn, args, due: now + every, every });
    return timerId;
  };
  window.clearTimeout = window.clearInterval = (id) => {
    if (id < 1e6) {
      realClearTimeout(id);
      realClearInterval(id);
      return;
    }
    timers.delete(id);
  };

  window.__vt = {
    freeze() {
      now = realNow();
      epoch = RealDate.now() - now;
      frozen = true;
    },
    tick(dt) {
      now += dt;
      // Native animations (element.animate(), CSS transitions/animations —
      // e.g. Framer Motion hands opacity to WAAPI) run on the document
      // timeline, which we can't freeze, so step them by hand: pause, advance
      // one frame, and finish() at the end so onfinish handlers still fire.
      for (const a of document.getAnimations()) {
        if (a.playState === "finished" || a.playState === "idle") continue;
        if (a.playState === "running") a.pause();
        // Libraries set startTime from their own (our virtual) clock, which is
        // ahead of the document timeline, leaving currentTime negative; in a
        // real browser the two agree, so treat that as "starts now".
        const t = Math.max(0, a.currentTime ?? 0) + dt * a.playbackRate;
        const end = a.effect?.getComputedTiming().endTime ?? Infinity;
        if (Number.isFinite(end) && t >= end) {
          try {
            a.finish();
          } catch {
            a.currentTime = end;
          }
        } else {
          a.currentTime = t;
        }
      }
      for (const [id, t] of [...timers]) {
        if (t.due > now) continue;
        if (t.every) t.due += t.every;
        else timers.delete(id);
        try {
          t.fn(...t.args);
        } catch (e) {
          console.error(e);
        }
      }
      const q = rafQueue;
      rafQueue = new Map();
      for (const cb of q.values()) {
        try {
          cb(now);
        } catch (e) {
          console.error(e);
        }
      }
    },
  };
};

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    `--window-size=${WIDTH},${HEIGHT}`,
  ],
});

const page = await browser.newPage();
await page.evaluateOnNewDocument(virtualClock);
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
console.log("recording", page.url());

// Hide cookie/consent UI so it never lands in the recording.
await page.addStyleTag({
  content: `[class*="cookie"],[id*="cookie"],[class*="consent"],[id*="consent"]{display:none!important}`,
});

// Let the intro/hero animation finish in real time before the clock freezes.
await sleep(3500);

const total = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
);
const travelMs = Math.round((total / SPEED) * 1000);

/* Scroll position for a moment on the loop's timeline:
   rest at top → travel down → rest → ease back up → short rest. */
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const segments = [
  [REST_MS, () => 0],
  [travelMs, (p) => total * p],
  [REST_MS, () => total],
  [REWIND_MS, (p) => total * (1 - easeInOut(p))],
  [REST_MS / 2, () => 0],
];
const loopMs = segments.reduce((s, [ms]) => s + ms, 0);
const yAt = (t) => {
  for (const [ms, fn] of segments) {
    if (t < ms) return Math.round(fn(t / ms));
    t -= ms;
  }
  return 0;
};

const durationMs = LIMIT_S ? Math.min(loopMs, LIMIT_S * 1000) : loopMs;
const frames = Math.round((durationMs / 1000) * FPS);
const dt = 1000 / FPS;
console.log(
  `scroll distance ${total}px · ${(durationMs / 1000).toFixed(1)}s · ${frames} frames @ ${FPS}fps`,
);

const framesDir = `/tmp/${name}-frames`;
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir);

const cdp = await page.createCDPSession();
await page.evaluate(() => window.__vt.freeze());

const started = Date.now();
for (let i = 0; i < frames; i++) {
  const y = yAt(i * dt);
  await page.evaluate(
    (y, dt) => {
      window.scrollTo(0, y);
      window.__vt.tick(dt);
    },
    y,
    dt,
  );
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "jpeg",
    quality: 92,
  });
  fs.writeFileSync(
    `${framesDir}/f${String(i).padStart(5, "0")}.jpg`,
    Buffer.from(data, "base64"),
  );

  if (i % 60 === 59) {
    const realPerFrame = (Date.now() - started) / (i + 1);
    process.stdout.write(
      `\r  frame ${i + 1}/${frames} · ${(realPerFrame).toFixed(0)}ms/frame`,
    );
  }
}
process.stdout.write("\n");
await browser.close();
console.log("frames captured, encoding…");

const ff = (args) =>
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    stdio: "inherit",
  });

ff([
  "-framerate", String(FPS),
  "-i", `${framesDir}/f%05d.jpg`,
  "-an",
  "-vf", `scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high", "-level", "4.1",
  "-movflags", "+faststart",
  `${OUT}/${name}.mp4`,
]);
fs.copyFileSync(`${framesDir}/f00000.jpg`, `${OUT}/${name}-poster.jpg`);
fs.rmSync(framesDir, { recursive: true, force: true });

for (const f of [`${OUT}/${name}.mp4`, `${OUT}/${name}-poster.jpg`]) {
  console.log(f, `${(fs.statSync(f).size / 1024).toFixed(0)} KB`);
}

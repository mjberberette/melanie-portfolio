/**
 * Records a real scroll-through of a live project site — its own animations,
 * scroll-driven sections and all — for playback inside an iPad mockup in the
 * work gallery. This is how "true scroll" previews are produced for real
 * client sites (the fictional case studies still use the still captures from
 * make-screens.mjs).
 *
 * Usage:  node scripts/record-screen.mjs [name] [url]
 *         node scripts/record-screen.mjs everypeer https://everypeer.com/
 *
 * Output: public/media/screens/<name>.mp4         (H.264 — plays everywhere;
 *                                                   VP9 came out larger on
 *                                                   starfield-heavy footage)
 *         public/media/screens/<name>-poster.jpg
 *
 * Requires ffmpeg on PATH (used by Puppeteer's screencast and for transcoding).
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

// Reading pace, in CSS px per second, and how long to rest at the ends so the
// loop has a beat before it rewinds.
const SPEED = 260;
const REST_MS = 1400;
const REWIND_MS = 2600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
console.log("recording", page.url());

// Hide cookie/consent UI so it never lands in the recording.
await page.addStyleTag({
  content: `[class*="cookie"],[id*="cookie"],[class*="consent"],[id*="consent"]{display:none!important}`,
});

// Let the intro/hero animation finish before the tape starts rolling.
await sleep(3500);

const total = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
);
const travelMs = Math.round((total / SPEED) * 1000);
console.log(`scroll distance ${total}px → ${(travelMs / 1000).toFixed(1)}s`);

const rawPath = `/tmp/${name}-raw.webm`;
const recorder = await page.screencast({ path: rawPath });

await sleep(REST_MS);

// Drive the scroll from inside the page on requestAnimationFrame so any
// scroll-linked animation on the site gets a smooth, continuous input — the
// same thing a person's trackpad would give it.
await page.evaluate(
  ({ total, travelMs, restMs, rewindMs }) =>
    new Promise((done) => {
      const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      const run = (from, to, ms, ease) =>
        new Promise((resolve) => {
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - t0) / ms);
            window.scrollTo(0, from + (to - from) * ease(p));
            if (p < 1) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      (async () => {
        await run(0, total, travelMs, (t) => t);
        await wait(restMs);
        await run(total, 0, rewindMs, easeInOut);
        await wait(restMs / 2);
        done();
      })();
    }),
  { total, travelMs, restMs: REST_MS, rewindMs: REWIND_MS },
);

await recorder.stop();
await browser.close();
console.log("raw recording done, encoding…");

const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });

ff([
  "-i", rawPath,
  "-an",
  "-vf", `scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=30,format=yuv420p`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-profile:v", "high", "-level", "4.0",
  "-movflags", "+faststart",
  `${OUT}/${name}.mp4`,
]);
ff([
  "-ss", "0.5", "-i", `${OUT}/${name}.mp4`,
  "-frames:v", "1", "-q:v", "4",
  `${OUT}/${name}-poster.jpg`,
]);

for (const f of [`${OUT}/${name}.mp4`, `${OUT}/${name}-poster.jpg`]) {
  console.log(f, `${(fs.statSync(f).size / 1024).toFixed(0)} KB`);
}

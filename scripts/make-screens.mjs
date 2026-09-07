/**
 * Generates the tall "website" captures that scroll inside the iPad mockups
 * in the work gallery.
 *
 *   - mb-identity.jpg  — a real scroll capture of this site
 *   - the other three  — small original landing pages designed here, one per
 *                        case study, rendered and captured headless
 *
 * Real client sites are recorded as video instead — see record-screen.mjs.
 *
 * Usage: node scripts/make-screens.mjs   (dev server must be running)
 * Output: public/media/screens/*.jpg
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const OUT = "public/media/screens";
const SITE_URL = process.env.SHOT_URL ?? "http://127.0.0.1:43417/";
fs.mkdirSync(OUT, { recursive: true });

const FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Geist:wght@300..700&family=Instrument+Serif:ital@0;1&display=swap";

const page_ = (body, css) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${FONTS}">
<style>
*{margin:0;box-sizing:border-box}
body{font-family:'Geist',sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'Archivo',sans-serif;font-weight:750;letter-spacing:-.03em;line-height:.95}
.serif{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400}
.mono{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase}
nav{display:flex;justify-content:space-between;align-items:center;padding:28px 48px}
section{padding:72px 48px}
${css}
</style></head><body>${body}</body></html>`;

const SITES = {
  verso: page_(
    `
    <nav><strong style="font-size:18px">Verso*</strong><span class="mono" style="opacity:.6">Product · Newsrooms · Pricing</span></nav>
    <section style="padding-top:96px">
      <h1 style="font-size:92px">Publish with a<br><span class="serif" style="color:#d7ff5c">point of view.</span></h1>
      <p style="max-width:440px;opacity:.65;margin-top:28px;line-height:1.6">A block editor that never fights the writer, and a publishing flow built around deadline pressure.</p>
    </section>
    <section>
      ${["The forecast was wrong. The model wasn't.", "What the harbour knew before the city did", "A quiet argument for slower news"]
        .map(
          (t, i) => `<article style="border-top:1px solid rgba(255,255,255,.14);padding:36px 0;display:grid;grid-template-columns:56px 1fr auto;gap:24px;align-items:baseline">
          <span class="mono" style="color:#d7ff5c">0${i + 1}</span>
          <h2 style="font-size:40px">${t}</h2>
          <span class="mono" style="opacity:.4">6 min</span></article>`,
        )
        .join("")}
    </section>
    <section style="background:#d7ff5c;color:#141410;border-radius:32px;margin:0 24px;padding:80px 48px">
      <p class="mono">Editor satisfaction</p>
      <h2 style="font-size:120px">4.8/5</h2>
      <p style="max-width:420px;line-height:1.6;margin-top:16px">Measured across three newsrooms, two elections and one very long budget night.</p>
    </section>
    <section style="text-align:center;padding:96px 48px">
      <h2 style="font-size:56px">Write the hard thing.</h2>
      <p class="mono" style="opacity:.5;margin-top:18px">verso.press</p>
    </section>`,
    `body{background:#141410;color:#f4f3ea}`,
  ),

  "field-foundry": page_(
    `
    <nav><strong style="font-size:18px">Field &amp; Foundry</strong><span class="mono" style="opacity:.55">Shop · Makers · Journal</span></nav>
    <section style="padding-top:88px;text-align:center">
      <p class="mono" style="color:#c96f2f">Slow-made goods</p>
      <h1 style="font-size:84px;margin:20px 0">Made once,<br>kept <span class="serif" style="color:#c96f2f">forever.</span></h1>
    </section>
    <section>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        ${[
          ["Ash stool no. 4", "$240", "#d9cbb6"],
          ["Riveted carry", "$180", "#c4b49b"],
          ["Foundry mug", "$36", "#b39b7d"],
          ["Waxed apron", "$110", "#cbb89e"],
        ]
          .map(
            ([t, p, c]) => `<div>
            <div style="aspect-ratio:1;border-radius:20px;background:radial-gradient(80% 80% at 35% 30%, ${c}, #a08663)"></div>
            <div style="display:flex;justify-content:space-between;padding:14px 4px"><strong>${t}</strong><span style="opacity:.6">${p}</span></div></div>`,
          )
          .join("")}
      </div>
    </section>
    <section style="background:#1c1815;color:#f4efe7;border-radius:32px;margin:0 24px;padding:88px 48px">
      <h2 style="font-size:58px">The checkout is<br>three decisions long.</h2>
      <p class="mono" style="margin-top:20px;color:#c96f2f">+41% conversion after relaunch</p>
    </section>
    <section style="text-align:center">
      <p class="serif" style="font-size:34px">"You can feel the making in it."</p>
      <p class="mono" style="opacity:.5;margin-top:14px">field-foundry.com</p>
    </section>`,
    `body{background:#f4efe7;color:#1c1815}`,
  ),

  kinnect: page_(
    `
    <nav><strong style="font-size:18px;color:#0fa47f">kinnect</strong><span class="mono" style="opacity:.55">Care teams · Outcomes · Security</span></nav>
    <section style="padding-top:88px">
      <h1 style="font-size:80px">One queue.<br>One truth.<br><span class="serif" style="color:#0fa47f">Zero double entry.</span></h1>
      <p style="max-width:440px;opacity:.65;margin-top:26px;line-height:1.6">Care coordination designed around nurses — not the other way round.</p>
    </section>
    <section>
      ${[
        ["Morning handover", "7 patients · 2 flags", "#0fa47f"],
        ["Meds reconciliation", "complete · 09:41", "#8fd6c2"],
        ["Discharge plan", "waiting on transport", "#e5b45a"],
      ]
        .map(
          ([t, s, c]) => `<div style="display:flex;align-items:center;gap:18px;border:1px solid #dcebe5;border-radius:18px;padding:22px 24px;margin-bottom:14px;background:#fff">
          <span style="width:12px;height:12px;border-radius:99px;background:${c}"></span>
          <strong style="flex:1">${t}</strong><span class="mono" style="opacity:.5">${s}</span></div>`,
        )
        .join("")}
    </section>
    <section style="background:#0fa47f;color:#f2fbf8;border-radius:32px;margin:0 24px;padding:88px 48px">
      <p class="mono">Accessibility</p>
      <h2 style="font-size:110px">WCAG AA+</h2>
      <p style="max-width:430px;line-height:1.6;margin-top:16px">Eighteen shadowing sessions in clinics, one insight: design around the nurses.</p>
    </section>
    <section style="text-align:center;padding-bottom:96px">
      <h2 style="font-size:52px">Care, coordinated.</h2>
      <p class="mono" style="opacity:.5;margin-top:16px">kinnect.health</p>
    </section>`,
    `body{background:#f7fbf9;color:#12312a}`,
  ),
};

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});

/* The three fictional case-study sites */
for (const [name, html] of Object.entries(SITES)) {
  const file = path.resolve(`/tmp/site-${name}.html`);
  fs.writeFileSync(file, html);
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`file://${file}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({
    path: `${OUT}/${name}.jpg`,
    type: "jpeg",
    quality: 82,
    fullPage: true,
  });
  console.log("made", name);
  await page.close();
}

/* This site itself, captured with reduced motion so everything is visible */
const self = await browser.newPage();
await self.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await self.setViewport({ width: 1024, height: 1366, deviceScaleFactor: 1 });
await self.goto(SITE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, 7000));
await self.screenshot({
  path: `${OUT}/mb-identity.jpg`,
  type: "jpeg",
  quality: 82,
  clip: { x: 0, y: 0, width: 1024, height: 3600 },
  captureBeyondViewport: true,
});
console.log("made mb-identity");

await browser.close();

import puppeteer from "puppeteer-core";

const url = process.env.SHOT_URL ?? "http://127.0.0.1:43417/";
const out = "/tmp/shots";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { name: "tablet-land", width: 1024, height: 768 },
  { name: "tablet-port", width: 820, height: 1180 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "wide", width: 1920, height: 1080 },
];

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2",
    "--hide-scrollbars",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
  ],
});

const errors = [];

for (const view of VIEWPORTS) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(`${view.name} ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${view.name} ${m.text()}`);
  });
  await page.setViewport({ width: view.width, height: view.height });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await wait(5400);

  for (const [key, selector] of [
    ["hero", "#top"],
    ["work", "#work"],
    ["contact", "#contact"],
  ]) {
    await page.evaluate((sel) => {
      document.querySelector(sel).scrollIntoView({ behavior: "instant" });
    }, selector);
    await wait(1400);
    await page.screenshot({ path: `${out}/qa-${view.name}-${key}.png` });
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  if (overflow > 1) errors.push(`${view.name} horizontal overflow ${overflow}px`);

  await page.close();
}

// Reduced motion: preloader skipped, everything legible without animation.
const rm = await browser.newPage();
rm.on("pageerror", (e) => errors.push(`reduced ${e.message}`));
rm.on("console", (m) => {
  if (m.type() === "error") errors.push(`reduced ${m.text()}`);
});
await rm.emulateMediaFeatures([
  { name: "prefers-reduced-motion", value: "reduce" },
]);
await rm.setViewport({ width: 1440, height: 900 });
await rm.goto(url, { waitUntil: "domcontentloaded" });
await wait(3000);
await rm.screenshot({ path: `${out}/qa-reduced-hero.png` });
await rm.evaluate(() =>
  document.querySelector("#work").scrollIntoView({ behavior: "instant" }),
);
await wait(1200);
await rm.screenshot({ path: `${out}/qa-reduced-work.png` });
const preloaderGone = await rm.evaluate(() => !document.querySelector("#preloader"));
if (!preloaderGone) errors.push("reduced motion: preloader still present");
await rm.close();

console.log(errors.length ? [...new Set(errors)].join("\n") : "no issues");
await browser.close();

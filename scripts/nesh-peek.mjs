import puppeteer from "puppeteer-core";

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
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("https://heynesh.com", {
  waitUntil: "networkidle2",
  timeout: 90000,
});
await new Promise((r) => setTimeout(r, 6000));

// find the projects heading and scroll around it
const y = await page.evaluate(() => {
  const els = [...document.querySelectorAll("h3, h2")];
  const target = els.find((e) => /1910\.ai/i.test(e.textContent));
  if (!target) return null;
  return target.getBoundingClientRect().top + window.scrollY;
});
console.log("anchor y", y);

const anchors = y
  ? [y - 700, y - 200, y + 400, y + 1100, y + 1900]
  : [3000, 4000, 5000, 6000, 7000];

let i = 0;
for (const top of anchors) {
  await page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), top);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `/tmp/shots/nesh-${i}.png` });
  console.log("saved", i);
  i += 1;
}
await browser.close();

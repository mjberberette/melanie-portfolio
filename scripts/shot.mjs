import puppeteer from "puppeteer-core";

const url = process.env.SHOT_URL ?? "http://127.0.0.1:43417/";
const out = process.env.SHOT_OUT ?? "/tmp/shots";
const width = Number(process.env.SHOT_W ?? 1440);
const height = Number(process.env.SHOT_H ?? 900);
const positions = (process.env.SHOT_AT ?? "0")
  .split(",")
  .map((value) => Number(value.trim()));
const wait = Number(process.env.SHOT_WAIT ?? 5200);

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-features=CalculateNativeWinOcclusion",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(`PAGEERROR ${err.message}`));

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, wait));

let index = 0;
for (const position of positions) {
  await page.evaluate((y) => {
    window.scrollTo({ top: y * window.innerHeight, behavior: "auto" });
  }, position);
  await new Promise((r) => setTimeout(r, 1600));
  const name = `${out}/${String(index).padStart(2, "0")}-${position}.png`;
  await page.screenshot({ path: name });
  console.log("saved", name);
  index += 1;
}

if (errors.length) {
  console.log("\n--- console errors ---");
  console.log([...new Set(errors)].slice(0, 25).join("\n"));
} else {
  console.log("\nno console errors");
}

await browser.close();

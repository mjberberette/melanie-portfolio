import puppeteer from "puppeteer-core";

const url = process.env.SHOT_URL ?? "http://127.0.0.1:43417/";
const out = "/tmp/shots";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

function watch(page, tag) {
  page.on("pageerror", (e) => errors.push(`${tag} PAGEERROR ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${tag} ${m.text()}`);
  });
}

async function desktop() {
  const page = await browser.newPage();
  watch(page, "desktop");
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await wait(5200);

  // Work gallery: capture the pinned horizontal scrub at two depths.
  const workTop = await page.evaluate(() => {
    const el = document.querySelector(".work");
    return el.getBoundingClientRect().top + window.scrollY;
  });
  for (const [name, offset] of [
    ["start", 0],
    ["mid", 900],
  ]) {
    await page.evaluate(
      (top) => window.scrollTo({ top, behavior: "instant" }),
      workTop + offset,
    );
    await wait(1800);
    await page.screenshot({ path: `${out}/i-work-${name}.png` });
  }

  await page.evaluate(() =>
    document
      .querySelector("#capabilities")
      .scrollIntoView({ behavior: "instant" }),
  );
  await wait(1200);
  const triggers = await page.$$("#accordion .accordion__trigger");
  await triggers[2].click();
  await wait(1000);
  await page.screenshot({ path: `${out}/i-accordion.png` });

  // What-you-get: scroll through the statement so the chips pop in, then
  // hover one so it expands into its card.
  await page.evaluate(() => {
    const stmt = document.querySelector("[data-wyg-statement]");
    const top = stmt.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - window.innerHeight * 0.9);
  });
  await wait(600);
  await page.evaluate(() => {
    const stmt = document.querySelector("[data-wyg-statement]");
    const top = stmt.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - window.innerHeight * 0.32);
  });
  await wait(2200);
  await page.screenshot({ path: `${out}/i-wyg.png` });

  const chip = await page.$('.wyg-card[data-for="systems"]');
  const chipBox = await chip.boundingBox();
  await page.mouse.move(
    chipBox.x + chipBox.width / 2,
    chipBox.y + chipBox.height / 2,
    { steps: 10 },
  );
  await wait(1200);
  await page.screenshot({ path: `${out}/i-wyg-hover.png` });

  await page.evaluate(() =>
    document.querySelector("#contact").scrollIntoView({ behavior: "instant" }),
  );
  await wait(1600);
  await page.screenshot({ path: `${out}/i-contact.png` });

  await page.close();
}

async function mobile() {
  const page = await browser.newPage();
  watch(page, "mobile");
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await wait(5400);
  await page.screenshot({ path: `${out}/m-hero.png` });

  await page.evaluate(() =>
    document.querySelector("#work").scrollIntoView({ behavior: "instant" }),
  );
  await wait(1600);
  await page.screenshot({ path: `${out}/m-work.png` });

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(900);
  await page.screenshot({ path: `${out}/m-rail.png` });
  await page.close();
}

await desktop();
await mobile();

console.log(errors.length ? [...new Set(errors)].join("\n") : "no errors");
await browser.close();

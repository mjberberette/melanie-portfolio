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

  await page.evaluate(() =>
    document.querySelector("#work").scrollIntoView({ behavior: "instant" }),
  );
  await wait(1600);

  const rows = await page.$$("#work-list .work__row");
  for (const [index, name] of [
    [0, "lottie"],
    [2, "poster"],
  ]) {
    const box = await rows[index].boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
    await wait(250);
    await page.mouse.move(box.x + box.width * 0.34, box.y + box.height / 2);
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

  await page.evaluate(() =>
    document.querySelector(".process").scrollIntoView({ behavior: "instant" }),
  );
  await wait(2200);
  await page.screenshot({ path: `${out}/i-process.png` });

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
  await page.click("#nav-burger");
  await wait(1300);
  await page.screenshot({ path: `${out}/m-menu.png` });
  await page.close();
}

await desktop();
await mobile();

console.log(errors.length ? [...new Set(errors)].join("\n") : "no errors");
await browser.close();

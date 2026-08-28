import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ids = process.argv.slice(2);
const dir = "/tmp/icons";
fs.mkdirSync(dir, { recursive: true });

const available = [];
for (const id of ids) {
  const res = await fetch(`https://cdn.lordicon.com/${id}.json`);
  if (!res.ok) {
    console.log("miss", id, res.status);
    continue;
  }
  const text = await res.text();
  fs.writeFileSync(path.join(dir, `${id}.json`), text);
  available.push(id);
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#08080a;color:#f1ede5;font:11px monospace;display:grid;
grid-template-columns:repeat(6,1fr);gap:4px;padding:8px}
figure{margin:0;text-align:center}
.box{width:150px;height:150px}
</style></head><body>
${available.map((id) => `<figure><div class="box" id="b-${id}"></div><figcaption>${id}</figcaption></figure>`).join("")}
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.13.0/build/player/lottie.min.js"></script>
<script>
const ids=${JSON.stringify(available)};
window.__ready=false;
Promise.all(ids.map(id=>fetch('/icons/'+id+'.json').then(r=>r.json()).then(data=>{
  lottie.loadAnimation({container:document.getElementById('b-'+id),renderer:'svg',loop:false,autoplay:true,animationData:data});
}))).then(()=>{setTimeout(()=>{window.__ready=true},2500)});
</script></body></html>`;

fs.writeFileSync(path.join(dir, "sheet.html"), html);

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 980, height: 900 });
await page.setRequestInterception(true);
page.on("request", (req) => {
  const url = new URL(req.url());
  if (url.pathname.startsWith("/icons/")) {
    const file = path.join(dir, path.basename(url.pathname));
    req.respond({
      status: 200,
      contentType: "application/json",
      body: fs.readFileSync(file),
    });
    return;
  }
  if (url.protocol === "file:" || url.host === "cdn.jsdelivr.net") {
    req.continue();
    return;
  }
  req.continue();
});
await page.goto(`file://${path.join(dir, "sheet.html")}`, {
  waitUntil: "networkidle2",
});
await page.waitForFunction("window.__ready === true", { timeout: 30000 });
await page.screenshot({ path: "/tmp/icon-sheet.png", fullPage: true });
console.log("ok", available.length);
await browser.close();

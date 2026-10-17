// Smoke test: every screen at iPhone density (402x874 @3x) in WebKit and Chromium. Fails on any page error, a missing
// screen, a canvas that isn't at 3x, or a broken image/art slot. Writes a 1x thumbnail of each screen to --shots <dir>.
//   node scripts/smoke.mjs [--shots dir]
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { webkit, chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const f = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);
const shots = process.argv.includes("--shots") ? process.argv[process.argv.indexOf("--shots") + 1] : null;
if (shots) mkdirSync(shots, { recursive: true });
// --se: iPhone SE (375x667 @2x), the smallest supported screen
const SE = process.argv.includes("--se"), VW = SE ? 375 : 402, VH = SE ? 667 : 874, DPR = SE ? 2 : 3;
const SCREENS = ["title", "home", "mineSheet", "dailySheet", "wardrobe", "optsSheet", "market", "purseSheet", "memSheet", "talk", "dig", "rescueOffer", "end"];

let failed = 0;
for (const [name, bt] of [["webkit", webkit], ["chromium", chromium]]) {
  const b = await bt.launch();
  const page = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => errors.push("request failed: " + r.url()));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(() => { let a = 7; Math.random = () => ((a = (a * 16807) % 2147483647) / 2147483647); });
  await page.goto(`http://localhost:${server.address().port}/proto/index.html?debug`);
  await page.waitForFunction(() => window.gw, null, { timeout: 15000 });
  for (const id of SCREENS) {
    const before = errors.length;
    const r = await page.evaluate(async (id) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      // the end of a dig, as a player meets it: the roots close in, the rescue offer, then no thanks -> the haul
      if (id === "dig") gw.dig("hollow"); else if (id === "rescueOffer") gw.end("time"); else if (id === "end") document.getElementById("rescueNo").click(); else gw.screen(id);
      await sleep(id === "dig" || id === "rescueOffer" ? 2000 : 800);
      const cv = document.getElementById("cv"), el = id === "dig" ? cv : document.getElementById(id);
      const box = el?.getBoundingClientRect();
      return { shown: !!box && box.width > 0 && box.height > 0 && getComputedStyle(el).display !== "none",
        // nothing tappable may sit off screen or under another screen's edge
        offscreen: [...(el?.querySelectorAll?.("button") ?? [])].filter((x) => { const q = x.getBoundingClientRect(); return q.width && (q.left < -1 || q.right > innerWidth + 1); }).map((x) => x.id || x.textContent.trim().slice(0, 16)),
        canvas3x: cv.width === Math.round(innerWidth * devicePixelRatio), brokenImgs: [...document.images].filter((i) => i.complete && !i.naturalWidth && i.offsetWidth).length };
    }, id);
    const bad = [!r.shown && "not shown", !r.canvas3x && "canvas not 3x", r.brokenImgs && `${r.brokenImgs} broken images`, r.offscreen.length && `off screen: ${r.offscreen.join(", ")}`, ...errors.slice(before)].filter(Boolean);
    console.log(`${name.padEnd(9)} ${id.padEnd(11)} ${bad.length ? "FAIL " + bad.join(" | ") : "ok"}`);
    if (bad.length) failed++;
    if (shots) await page.screenshot({ path: join(shots, `${name}-${id}.png`), scale: "css" });
  }
  await b.close();
}
server.close();
if (failed) { console.log(`${failed} screen(s) failed`); process.exit(1); }

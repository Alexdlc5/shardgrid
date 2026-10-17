// App Store screenshots, rendered from the real game at Apple's 6.9" size (1320×2868 = 440×956 CSS @3x).
//   npm run build && node scripts/store-shots.mjs [--lang xx] [--out docs/store/shots]
// Each shot: the game at a staged moment (seeded), then a painted caption band composited on top (same wood/parchment
// language as the UI). Captions are English keys run through the game's own translator, so --lang de gives the German set.
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const LANG = arg("--lang", null), OUT = arg("--out", "docs/store/shots" + (LANG ? "-" + LANG : ""));
const ROOT = join(new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), "www");
if (!existsSync(join(ROOT, "index.html"))) throw new Error("www/ missing: npm run build first");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const f = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);
mkdirSync(OUT, { recursive: true });

// the set (order = store order). cap: headline + line; stage: what to do in the page before the shot
const SHOTS = [
  { file: "1-dig", cap: ["Mine glowing crystals", "before the roots close in"], stage: "dig" },
  { file: "2-camp", cap: ["Build a cozy camp", "and dress up Dibble"], stage: "home" },
  { file: "3-clear", cap: ["Clear lines, chain embers,", "freeze the Rootline"], stage: "clear" },
  { file: "4-market", cap: ["Sell your haul", "to Old Puddock"], stage: "market" },
  { file: "5-story", cap: ["Uncover 33 Amber Memories", "and what happened to the Glimmeroak"], stage: "story" },
  { file: "6-mines", cap: ["Eleven mines to open", "each with its own crystals"], stage: "mines" },
];

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => { let a = 11; Math.random = () => ((a = (a * 16807) % 2147483647) / 2147483647); });
// a save with some progress, so the camp, market and memories have something to show
await page.addInitScript(() => {
  const save = { reset: "2026-10-17", gold: 4280, up: { lantern: 2, pick: 1, charm: 1, lens: 0, tongs: 0, sieve: 0 }, owned: ["look:scarf:#35b38a", "look:hat:mushroom", "decor:mushrooms", "decor:jars", "tent:patchwork"],
    biomes: ["hollow", "ember", "grotto", "frostpine"], best: { hollow: 1840, ember: 2210, grotto: 1560 }, sel: "grotto", mode: "exp", opt: { music: true, sound: true, silent: false, vib: true, glyph: false },
    daily: { last: "", streak: 3, best: 1200 }, metPuddock: true, trial: [], found: ["moss", "jade", "amber", "ember", "glowcap", "frost"], camp: { tent: "patchwork", banner: "#5fa04e", fire: "ring", hide: [] },
    story: { prologue: true, mem: ["hollow1", "hollow2", "ember1", "grotto1", "grotto2", "frost1", "heart1"], confessed: false, sprout: true, site: "stump", ledge: false, finale: false, scale: false },
    pets: { owned: ["moss"], active: ["moss"], wear: {} }, coinTx: [], seen: ["silentTip"], light: 2600 };
  localStorage.setItem("gw.save", JSON.stringify(save));
});
await page.goto(`http://localhost:${server.address().port}/index.html?debug${LANG ? "&lang=" + LANG : ""}`);
await page.waitForFunction(() => window.gw, null, { timeout: 20000 });
await page.waitForTimeout(1200);

const stage = (what) => page.evaluate(async (what) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (what === "home") { gw.screen("home"); await sleep(1400); return; }
  if (what === "market") { gw.screen("market"); await sleep(1200); return; }
  if (what === "story") { gw.screen("memSheet"); await sleep(1200); return; }
  if (what === "mines") { gw.screen("mineSheet"); await sleep(1200); return; }
  if (what === "dig" || what === "clear") {
    gw.dig(what === "dig" ? "grotto" : "ember"); await sleep(1800);
    // fill some of the board so it reads as mid-game; for "clear", line up a row so a clear is about to happen
    const N = 8, spots = what === "dig" ? [[1, 1], [3, 4], [5, 2], [6, 5], [2, 6], [4, 0]] : [[7, 0], [7, 2], [7, 4], [6, 1], [5, 5], [4, 3]];
    for (const [r, c] of spots) { const i = gw.tray.findIndex((q) => q && gw.canPlace(gw.board, q.piece, r, c)); if (i >= 0) { gw.place(i, r, c); await sleep(420); } }
    await sleep(700); return;
  }
}, what);

// caption band: parchment on a wood plank, Grandstander headline, Fredoka line; drawn in-page so the game's fonts are used
const caption = (head, line, low) => page.evaluate(([head, line, low]) => {
  document.getElementById("storeCap")?.remove();
  const d = document.createElement("div"); d.id = "storeCap"; if (low) d.className = low;
  d.innerHTML = `<div class="plank"><div class="paper"><b>${head}</b><span>${line}</span></div></div>`;
  const css = document.createElement("style"); css.textContent = `
    #storeCap { position: fixed; left: 0; right: 0; top: 0; z-index: 1000; padding: 46px 26px 0; pointer-events: none; font-family: Fredoka, sans-serif; }
    #storeCap.sky { padding-top: 64px; } /* over the mine: below the HUD line, above the board frame */
    #storeCap.low { padding-top: 0; top: auto; bottom: 92px; } /* the board shots: the band sits in the quiet space under the tray, not over the board */
    #storeCap .plank { border: 4px solid transparent; border-image: var(--p-wood) 18 fill / 15px stretch; filter: drop-shadow(0 6px 0 rgba(48,24,6,.55)) drop-shadow(0 10px 18px rgba(0,0,0,.45)); padding: 10px; }
    #storeCap .paper { border: 3px solid transparent; border-image: var(--p-parch) 18 fill / 15px stretch; background: #efe0b8; color: #3a2208; text-align: center; padding: 10px 12px 12px; }
    #storeCap b { display: block; font-family: var(--font-display, Grandstander, Fredoka); font-size: 30px; line-height: 1.08; color: #5a3410; letter-spacing: .2px; }
    #storeCap span { display: block; margin-top: 4px; font-size: 19px; font-weight: 600; color: #6a4a2a; }`;
  d.append(css); document.body.append(d);
  // translate through the game's own dictionary, if another language is on
  for (const el of d.querySelectorAll("b, span")) el.textContent = window.__t ? window.__t(el.textContent) : el.textContent;
}, [head, line, low]);
// expose the translator for the captions
await page.evaluate(async () => { try { const m = await import("./i18n.js"); window.__t = m.t; } catch {} });

for (const s of SHOTS) {
  const before = errors.length;
  await stage(s.stage);
  await caption(...s.cap, s.stage === "clear" || s.stage === "market" ? "low" : s.stage === "dig" ? "sky" : "");
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(OUT, `${s.file}.png`) });
  await page.evaluate(() => document.getElementById("storeCap")?.remove());
  console.log(`${s.file}.png  ${errors.length > before ? "ERRORS: " + errors.slice(before).join(" | ") : "ok"}`);
  // back to a clean base between shots
  await page.evaluate(() => { document.querySelector(".screen.sheet.show .close")?.click(); });
  if (s.stage === "dig" || s.stage === "clear") { await page.evaluate(() => gw.end("stuck")); await page.waitForTimeout(2200); await page.evaluate(() => document.getElementById("rescueNo")?.click()); await page.waitForTimeout(1200); await page.evaluate(() => document.getElementById("sell")?.click()); await page.waitForTimeout(2000); }
}
await b.close(); server.close();
console.log(`wrote ${SHOTS.length} shots to ${OUT} (1320×2868)${errors.length ? "; page errors: " + errors.length : ""}`);

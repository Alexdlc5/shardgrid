// Block-edge sharpness at iPhone density, read straight from the game canvas's device pixels (1:1, no capture scaling).
//   node scripts/crisp.mjs                 table: browser x layer-off -> edge width (device px, 10-90%)
//   node scripts/crisp.mjs --check 2       exit 1 if any baseline edge is wider than 2 device px (CI gate)
// Edge width = device pixels between 10% and 90% of the contrast step across the block's left edge.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { webkit, chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg" };
const server = createServer((req, res) => {
  const f = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);
const port = server.address().port;
const check = process.argv.includes("--check") ? +process.argv[process.argv.indexOf("--check") + 1] : null;

async function measure(browserType, nolayer) {
  const b = await browserType.launch();
  const page = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  // same deal every run: seed Math.random before the game loads
  await page.addInitScript(() => { let a = 7; Math.random = () => ((a = (a * 16807) % 2147483647) / 2147483647); });
  await page.goto(`http://localhost:${port}/proto/index.html?debug${nolayer ? "&nolayer=" + nolayer : ""}`);
  await page.waitForFunction(() => window.gw, null, { timeout: 15000 });
  const out = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    gw.dig("hollow"); await sleep(900);
    // place a piece mid-board, so its left edge sits against an empty slot (not the board frame)
    const i = gw.tray.findIndex((q) => q && gw.canPlace(gw.board, q.piece, 3, 3)), cells = i >= 0 ? gw.tray[i].piece.cells : [];
    if (i >= 0) gw.place(i, 3, 3);
    await sleep(2000); // past the landing squash, even on a slow CI machine
    const cv = document.getElementById("cv"), dpr = cv.width / cv.clientWidth, g = cv.getContext("2d"), geo = gw.geo;
    const lum = (d, k) => .2126 * d[k] + .7152 * d[k + 1] + .0722 * d[k + 2];
    // same as scripts/edge-width.py: the steepest step, widened to the monotone ramp around it; 10-90 width (+1)
    const widthOf = (p) => { let k = 0; for (let i = 1; i < p.length - 1; i++) if (Math.abs(p[i + 1] - p[i]) > Math.abs(p[k + 1] - p[k])) k = i;
      const up = p[k + 1] > p[k], rise = (i, j) => (up ? p[j] - p[i] : p[i] - p[j]) > 1; let a = k, z = k + 1;
      while (a > 0 && rise(a - 1, a)) a--; while (z < p.length - 1 && rise(z, z + 1)) z++;
      const lo = p[a] + (p[z] - p[a]) * .1, hi = p[a] + (p[z] - p[a]) * .9; let n = 0;
      for (let i = a; i <= z; i++) if (p[i] > Math.min(lo, hi) && p[i] < Math.max(lo, hi)) n++;
      return { w: n + 1, step: Math.round(Math.abs(p[z] - p[a])), prof: p.slice(Math.max(0, a - 3), z + 4).map(Math.round).join(" ") }; };
    const row = (x0, x1, y) => { const d = g.getImageData(Math.round(x0 * dpr), Math.round(y * dpr), Math.round((x1 - x0) * dpr), 1).data; return [...Array(d.length / 4)].map((_, k) => lum(d, k * 4)); };
    const R = 3 + (cells[0]?.[0] ?? 0), C = 3 + Math.min(...cells.filter(([r]) => r === cells[0][0]).map(([, c]) => c));
    const board = i >= 0 ? widthOf(row(geo.bx + (C - .5) * geo.cell, geo.bx + (C + .35) * geo.cell, geo.by + (R + .5) * geo.cell)) : null;
    // tray: scan rows through each slot; report the sharpest strong edge per slot, then the worst slot
    let tray = 0;
    for (let s = 0; s < 3; s++) { if (!gw.tray[s]) continue; let bestW = 99;
      for (let y = geo.trayY + 4; y < geo.trayY + geo.trayH - 4; y += 3) { const r = widthOf(row(geo.trayX + s * geo.slotW, geo.trayX + (s + .5) * geo.slotW, y)); if (r.step > 60) bestW = Math.min(bestW, r.w); }  // ponytail: sharpest row per slot; median if one crisp row ever hides a soft piece
      if (bestW < 99) tray = Math.max(tray, bestW); }
    return { dpr, board, tray };
  });
  await b.close();
  return { ...out, errors };
}

const layers = check != null ? [""] : ["", "glow", "shadow", "inner", "bevel", "bg", "glow,shadow"];
let fail = false;
console.log("browser   layers-off      dpr  board-edge  tray-edge   (device px, 10-90%; crisp <= 2)");
for (const [name, bt] of [["webkit", webkit], ["chromium", chromium]]) for (const l of layers) {
  const r = await measure(bt, l);
  if (check != null && (r.board?.w ?? 99) > check) console.log("board profile:", r.board?.prof);
  console.log(`${name.padEnd(9)} ${(l || "(none)").padEnd(15)} ${r.dpr}    ${String(r.board?.w ?? "-").padStart(4)}        ${String(r.tray).padStart(4)}` + (r.errors.length ? `   errors: ${r.errors.join(" | ")}` : ""));
  if (check != null && ((r.board?.w ?? 99) > check || r.tray > check || r.errors.length)) fail = true;
}
server.close();
if (fail) { console.log(`FAIL: an edge is wider than ${check} device px (or the page threw)`); process.exit(1); }

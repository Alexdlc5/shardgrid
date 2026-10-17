// Soak: auto-play digs at 402x874 @3x for N minutes; per minute, how long each frame's work takes (p50/p95/p99, ms)
// and, in Chromium, the JS heap after a forced GC plus DOM node count. Budgets: 16.7 ms a frame at 60 Hz, 8.3 ms at 120 Hz.
// This is desktop CPU time, not an iPhone: it catches regressions and leaks; the device run (Instruments/TestFlight) is the truth.
//   node scripts/soak.mjs [--minutes 10] [--browser chromium|webkit] [--check]   --check: exit 1 if p95 > 8.3 ms or the heap grows > 25%
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { webkit, chromium } from "playwright";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const MIN = +arg("--minutes", 10), BROWSER = arg("--browser", "chromium"), check = process.argv.includes("--check");
const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };
const server = createServer((req, res) => {
  const f = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);

const b = await (BROWSER === "webkit" ? webkit : chromium).launch();
const page = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/proto/index.html?debug`);
await page.waitForFunction(() => window.gw, null, { timeout: 15000 });
const cdp = BROWSER === "chromium" ? await page.context().newCDPSession(page) : null;
if (cdp) await cdp.send("Performance.enable");
// the player: every 350 ms place the first piece that fits anywhere; a finished dig starts the next one
await page.evaluate(() => {
  const N = 8; gw.dig("hollow"); window.played = { places: 0, digs: 1 };
  setInterval(() => {
    if (gw.state !== "play") { gw.dig("hollow"); played.digs++; return; }
    gw.time = Math.max(gw.time, 30); // keep the Rootline from ending every dig
    for (let i = 0; i < 3; i++) { const q = gw.tray[i]; if (!q) continue;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (gw.canPlace(gw.board, q.piece, r, c)) { played.places++; return gw.place(i, r, c); } }
    gw.end("stuck");
  }, 350);
});
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
const rows = [];
console.log(`${BROWSER}, ${MIN} min   min  frames   p50    p95    p99    max  (ms of work)   heap MB  DOM nodes`);
for (let m = 1; m <= MIN; m++) {
  await page.waitForTimeout(60000);
  const ms = (await page.evaluate(() => gw.frameMs())).sort((x, y) => x - y);
  let heap = null;
  if (cdp) { await cdp.send("HeapProfiler.collectGarbage"); heap = (await cdp.send("Performance.getMetrics")).metrics.find((x) => x.name === "JSHeapUsedSize").value / 1048576; }
  const dom = await page.evaluate(() => document.getElementsByTagName("*").length);
  const row = { m, n: ms.length, p50: pct(ms, .5), p95: pct(ms, .95), p99: pct(ms, .99), max: ms.at(-1), heap, dom };
  rows.push(row);
  console.log(`${" ".repeat(BROWSER.length + 13)}${String(m).padStart(3)} ${String(row.n).padStart(7)} ${row.p50.toFixed(2).padStart(6)} ${row.p95.toFixed(2).padStart(6)} ${row.p99.toFixed(2).padStart(6)} ${row.max.toFixed(1).padStart(6)}   ${heap == null ? "     -" : heap.toFixed(1).padStart(8)}  ${String(dom).padStart(9)}`);
}
const played = await page.evaluate(() => window.played);
await b.close(); server.close();
const all95 = Math.max(...rows.map((r) => r.p95)), grow = rows[0].heap ? rows.at(-1).heap / rows[0].heap - 1 : 0;
console.log(`worst p95 ${all95.toFixed(2)} ms (120 Hz budget 8.3) · heap ${rows[0].heap ? (grow * 100).toFixed(0) + "% from minute 1" : "n/a"} · ${played.places} pieces placed over ${played.digs} digs · page errors ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 5).join("\n"));
if (check && (all95 > 8.3 || grow > .25 || errors.length || played.places < MIN * 60)) process.exit(1); // and it must really have played

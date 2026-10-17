// Performance probe on a slow-phone profile: Chromium at 402x874 @3x with the CPU slowed (default 4x, about an iPhone 11).
//   npm run build && node scripts/perf.mjs [--cpu 4] [--json out.json]   (measures www/, the bundle that ships: fonts local)
// Reports: cold start to the title, the hitch when a dig starts, and per screen the frame interval (p50/p95) plus the main
// thread's long tasks (>50 ms) over 6 s. Desktop CPU time scaled down, not an iPhone GPU: it ranks costs; the device has the last word.
import { createServer } from "node:http";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const CPU = +arg("--cpu", 4), OUT = arg("--json", null);
const ROOT = join(new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), "www");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const f = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });
await page.addInitScript(() => {
  let a = 7; Math.random = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  window.__long = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: "longtask", buffered: true });
});
const t0 = Date.now();
await page.goto(`http://localhost:${server.address().port}/index.html?debug`, { waitUntil: "commit" });
await page.waitForFunction(() => window.gw && document.getElementById("title")?.classList.contains("show"), null, { timeout: 60000 });
const start = { wall: Date.now() - t0, ...(await page.evaluate(() => ({ dcl: Math.round(performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd),
  long: Math.round(window.__long.reduce((s, d) => s + d, 0)), longMax: Math.round(Math.max(0, ...window.__long)) }))) };
const sample = (setup) => page.evaluate(async (setup) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await eval(setup); await sleep(1500);
  window.__long = []; const iv = []; let last = performance.now(), go = true;
  const tick = (now) => { iv.push(now - last); last = now; if (go) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  await sleep(6000); go = false;
  iv.sort((x, y) => x - y); const p = (q) => +iv[Math.floor(iv.length * q)].toFixed(1);
  return { frames: iv.length, p50: p(.5), p95: p(.95), max: +iv.at(-1).toFixed(0), long: Math.round(window.__long.reduce((s, d) => s + d, 0)), longN: window.__long.length };
}, setup);
const screens = {
  title: await sample("Promise.resolve()"),
  camp: await sample("(async () => gw.screen('home'))()"),
  market: await sample("(async () => gw.screen('market'))()"),
};
// the hitch when a dig starts: the longest frame in the 2 s after gw.dig
const dig = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); window.__long = [];
  const iv = []; let last = performance.now(), go = true; const tick = (now) => { iv.push(now - last); last = now; if (go) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); const t = performance.now(); gw.dig("hollow"); const sync = performance.now() - t; await sleep(2000); go = false;
  return { syncMs: Math.round(sync), worstFrame: Math.round(Math.max(...iv)), long: Math.round(window.__long.reduce((s, d) => s + d, 0)) };
});
screens.board = await sample("Promise.resolve()");
const r = { cpu: CPU, start, dig, screens };
await b.close(); server.close();
console.log(`CPU ${CPU}x slower · cold start ${start.wall} ms to the title (DOMContentLoaded ${start.dcl} ms; long tasks ${start.long} ms, worst ${start.longMax})`);
console.log(`dig start: ${dig.syncMs} ms in gw.dig, worst frame ${dig.worstFrame} ms, long tasks ${dig.long} ms`);
console.log("screen    frames  p50 ms  p95 ms  max ms   long tasks (ms / count) in 6 s");
for (const [k, v] of Object.entries(screens)) console.log(`${k.padEnd(9)} ${String(v.frames).padStart(6)} ${String(v.p50).padStart(7)} ${String(v.p95).padStart(7)} ${String(v.max).padStart(7)}   ${v.long} / ${v.longN}`);
if (OUT) writeFileSync(OUT, JSON.stringify(r, null, 1));

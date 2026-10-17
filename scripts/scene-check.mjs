// Story fit check: node scripts/scene-check.mjs [--shots <dir>]   (run npm run build first; needs Chrome or Edge)
// Serves www/ the way an iPhone shows it (59px top and 34px bottom safe-area insets baked in, a 62px banner ad),
// opens the title, every prologue panel and every story-scene step in headless Chrome at three iPhone sizes, and
// fails if anything overlaps, leaves the safe area, makes the card scroll, is too small to read (S1) or to tap (S2).
// --shots <dir> also saves a PNG of every screen (2x) and one contact sheet per size.
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SIZES = [[375, 667, "se"], [402, 874, "pro"], [440, 956, "max"]];
const shots = process.argv.includes("--shots") ? resolve(process.argv[process.argv.indexOf("--shots") + 1]) : null;
const chrome = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => p && existsSync(p));
if (!chrome) throw new Error("no Chrome found; set CHROME=/path/to/chrome");
if (!existsSync("www/index.html")) throw new Error("www/ missing; run npm run build first");

// the phone copy: what sa-test.html does by hand (the safe areas are in style.css, the ad class on <html>)
const phone = (html) => html.replaceAll("max(14px, env(safe-area-inset-bottom))", "34px").replaceAll("env(safe-area-inset-top, 0px)", "59px")
  .replaceAll("env(safe-area-inset-bottom, 0px)", "34px").replace('<html lang="en">', '<html lang="en" class="hasAd" style="--ad:62px">');
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png" };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname), file = join("www", path === "/" ? "index.html" : path);
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(/(index\.html|style\.css)$/.test(file) ? phone(readFileSync(file, "utf8")) : readFileSync(file));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/index.html`;

// one headless browser, driven over the DevTools protocol (so the viewport can be narrower than a desktop window)
const profile = mkdtempSync(join(tmpdir(), "gw-"));
const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--mute-audio", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"]);
const port = await new Promise((ok) => browser.stderr.on("data", (d) => { const m = String(d).match(/ws:\/\/[^:]+:(\d+)\//); if (m) ok(m[1]); }));
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl), waiting = new Map(), events = [];
await new Promise((ok) => ws.addEventListener("open", ok));
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id) waiting.get(m.id)?.(m); else events.push(m.method); });
let seq = 0;
const cdp = (method, params = {}) => new Promise((ok, fail) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  waiting.set(id, (m) => m.error ? fail(new Error(`${method}: ${m.error.message}`)) : ok(m.result)); });
const until = async (expr, ms = 15000) => { for (const t0 = Date.now(); Date.now() - t0 < ms; await new Promise((r) => setTimeout(r, 100))) {
  const { result } = await cdp("Runtime.evaluate", { expression: expr, returnByValue: true }); if (result.value) return result.value; }
  throw new Error(`timed out waiting for ${expr}`); };
// open ?scene=… on a fresh install (storage cleared) and wait for the page's report
const open = async (scene) => {
  await cdp("Storage.clearDataForOrigin", { origin: new URL(base).origin, storageTypes: "all" });
  await cdp("Page.navigate", { url: `${base}?scene=${scene}` });
  return JSON.parse(await until(`document.getElementById("fitReport")?.textContent`));
};
await cdp("Page.enable"); await cdp("Runtime.enable");

let failed = 0;
for (const [w, h, name] of SIZES) {
  await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  const report = await open("all");
  if (report.size[0] !== w || report.size[1] !== h) throw new Error(`${name}: viewport is ${report.size}, wanted ${w}x${h}`);
  const bad = Object.entries(report.steps).filter(([, p]) => p.length);
  console.log(`${name} ${w}x${h}: ${Object.keys(report.steps).length} screens, ${bad.length ? bad.length + " with problems" : "all fit"}`);
  for (const [id, p] of bad) console.log(`  ${id}: ${p.join("; ")}`);
  failed += bad.length;
  if (!shots) continue;
  mkdirSync(join(shots, name), { recursive: true });
  const ids = Object.keys(report.steps), file = (id) => `${name}/${id.replace(":", "-")}.png`;
  for (const id of ids) {
    await open(id); await new Promise((r) => setTimeout(r, 150)); // let fonts and SVG filters settle
    writeFileSync(join(shots, file(id)), Buffer.from((await cdp("Page.captureScreenshot", { format: "png" })).data, "base64"));
  }
  const cols = 9, sheet = join(shots, `${name}.html`);
  writeFileSync(sheet, `<body style="margin:0;background:#111;display:flex;flex-wrap:wrap;gap:8px;padding:8px;width:${cols * (w / 2 + 8) - 8}px">` +
    ids.map((id) => `<figure style="margin:0;color:#ccc;font:12px sans-serif"><img src="${file(id)}" width="${w / 2}"><figcaption>${id}</figcaption></figure>`).join("") + "</body>");
  await cdp("Emulation.setDeviceMetricsOverride", { width: Math.ceil(cols * (w / 2 + 8) + 8), height: Math.ceil(Math.ceil(ids.length / cols) * (h / 2 + 26) + 8), deviceScaleFactor: 1, mobile: false });
  await cdp("Page.navigate", { url: pathToFileURL(sheet).href }); await until("document.readyState === 'complete' && [...document.images].every((i) => i.complete)");
  writeFileSync(join(shots, `${name}-sheet.jpg`), Buffer.from((await cdp("Page.captureScreenshot", { format: "jpeg", quality: 82 })).data, "base64"));
}
ws.close(); browser.kill(); server.close();
setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
if (failed) { console.log(`${failed} screen(s) do not fit`); process.exitCode = 1; }

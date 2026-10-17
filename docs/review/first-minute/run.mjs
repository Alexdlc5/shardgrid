// Fresh-install proof for docs/RELEASE_REVIEW.md items 1, 4, 7 (one-tap dialogue, Rootline tip once, no moths on dig 1).
//   node docs/review/first-minute/run.mjs      (run from the repo root; Chrome at the path below, puppeteer-core installed)
import puppeteer from "puppeteer-core";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
const ROOT = process.cwd(), OUT = "docs/review/first-minute", TIP = "The Rootline is closing in. Clear lines to grow it back.";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer((req, res) => { const f = join(ROOT, decodeURIComponent(req.url.split("?")[0])); if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f)); }).listen(0);
const url = `http://localhost:${server.address().port}/proto/index.html?debug`;
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, userDataDir: mkdtempSync(join(tmpdir(), "gw-fresh-")), args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await b.newPage(); await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 3 });
page.on("pageerror", (e) => { console.error("PAGE ERROR", e.message); process.exitCode = 1; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, captureBeyondViewport: false, clip: { x: 0, y: 0, width: 402, height: 874, scale: 1 / 3 } });
let fails = 0; const check = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) fails++; };
const ready = async () => { await page.goto(url); await page.waitForFunction(() => window.gw, { timeout: 15000 }); };
await ready(); await page.evaluate(() => localStorage.clear()); await ready(); // fresh install: empty save
await page.evaluate(() => { const c = document.getElementById("cv").getContext("2d"), f = c.fillText.bind(c); window.__texts = []; c.fillText = (t, ...a) => { window.__texts.push(String(t)); return f(t, ...a); }; });
const seen = () => page.evaluate(() => JSON.parse(localStorage.getItem("gw.save") || "{}").seen || []);
const tipShown = () => page.evaluate((t) => window.__texts.filter((x) => x === t).length, TIP);

// 1. prologue: one tap per panel while the line is still typing
await page.click("#tPlay"); await page.waitForSelector("#talk.show"); await page.waitForSelector("#talkText .tw");
const panel = () => page.evaluate(() => document.getElementById("talkArt").innerHTML.length + ":" + document.getElementById("talkText")?.textContent.slice(0, 30));
const typing = () => page.evaluate(() => document.querySelectorAll("#talkText .tw").length > 0);
const btn = await page.evaluate(() => { const b = document.getElementById("talkNext"), cs = getComputedStyle(b); return { opacity: cs.opacity, pe: cs.pointerEvents, wait: b.classList.contains("wait") }; });
check(btn.wait && +btn.opacity > .5 && btn.pe !== "none", `Next stays visible and tappable while typing (opacity ${btn.opacity}, pointer-events ${btn.pe})`);
await shot("01-prologue-typing");
let p0 = await panel(); await page.click("#talkLine"); await sleep(150);
check(!(await typing()) && (await panel()) === p0, "tapping the text only finishes the line (same panel)");
let clicks = 0;
for (let k = 0; k < 4; k++) {
  const before = await panel(), wasTyping = await typing();
  await page.click("#talkNext"); clicks++; await sleep(350);
  const home = await page.evaluate(() => document.getElementById("home").classList.contains("show"));
  if (k === 0) await shot("02-prologue-after-one-tap");
  check(k < 3 ? (await panel()) !== before : home, `panel ${k + 1}: one tap${wasTyping ? " mid-typing" : ""} → ${k < 3 ? "next panel" : "camp"}`);
}
check(clicks === 4, `prologue took ${clicks} taps on the button (was 8)`);
await page.waitForSelector("#home.show"); await sleep(600); await shot("03-camp");

// a dig: place up to n pieces, first fit; returns the most moths alive at once
const dig = async (n, onPlaced) => {
  let maxMoths = 0;
  for (let i = 0; i < n; i++) {
    const ok = await page.evaluate(() => { const g = window.gw, N = 8; let best = null; // the placement that completes the most lines keeps the board open
      for (let t = 0; t < g.tray.length; t++) { const q = g.tray[t]; if (!q) continue;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (!g.canPlace(g.board, q.piece, r, c)) continue;
          const bd = [...g.board]; for (const [dr, dc] of q.piece.cells) bd[(r + dr) * N + c + dc] = 1; let lines = 0;
          for (let k = 0; k < N; k++) { if (bd.slice(k * N, k * N + N).every(Boolean)) lines++; if (bd.filter((_, i) => i % N === k).every(Boolean)) lines++; }
          if (!best || lines > best.lines) best = { t, r, c, lines }; } }
      if (best) g.place(best.t, best.r, best.c); return !!best; });
    if (!ok) { console.log(`  (no fit after ${i} placements: state ${await page.evaluate(() => window.gw.state + " fill " + window.gw.board.filter(Boolean).length + " tray " + JSON.stringify(window.gw.tray.map((q) => q ? q.piece.cells.length : 0)) + " time " + Math.round(window.gw.time))})`); break; }
    maxMoths = Math.max(maxMoths, await page.evaluate(() => window.gw.moths.length)); await onPlaced?.(i); await sleep(40);
  }
  return maxMoths;
};
// 2 + 3. dig 1 (fresh save): moths forced to 100% a tray, still none; Rootline tip once it drops under half
await page.evaluate(() => { window.gw.PM.chance.hollow = 1; window.gw.dig("hollow"); }); await page.waitForFunction(() => window.gw.state === "play"); await sleep(400);
await shot("04-dig1-start");
check((await tipShown()) === 0 && !(await seen()).includes("rootline"), "no Rootline tip before the Rootline drops");
const m1 = await dig(30, async (i) => { if (i === 2) { await page.evaluate(() => { window.gw.time = 20; }); await sleep(700); await shot("05-dig1-rootline-tip"); } });
check(m1 === 0, `dig 1: no Pilfermoth across 30 placements with the spawn chance forced to 100% (max alive ${m1})`);
check((await tipShown()) > 0 && (await seen()).includes("rootline"), `Rootline tip drawn on dig 1 and saved as seen (${await tipShown()} frames)`);
await page.evaluate(() => { window.gw.time = 20; }); await sleep(5500); const t1 = await tipShown(); await page.evaluate(() => { window.gw.time = 20; }); await sleep(800);
check((await tipShown()) === t1, "the tip fades after 4.5 s and does not come back in the same dig");
// finish dig 1 the way a player does: board full → haul → sell
await page.evaluate(() => window.gw.end("board")); await page.waitForSelector("#rescueOffer.show", { timeout: 8000 }); await page.click("#rescueNo");
await page.waitForSelector("#end.show"); await page.waitForSelector("#end .sheetFoot:not(.wait)", { timeout: 20000 }); await sleep(300); await page.click("#sell"); await page.waitForSelector("#home.show"); await sleep(800);
check(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("gw.save")).best).length > 0), "dig 1 sold: save.best is no longer empty");
// dig 2: tip stays away, moths spawn as usual
await page.evaluate(() => { for (const el of document.querySelectorAll(".screen.show")) if (el.id !== "home") el.classList.remove("show"); window.gw.dig("hollow"); });
await page.waitForFunction(() => window.gw.state === "play"); await sleep(400); await page.evaluate(() => { window.__texts = []; });
const m2 = await dig(12, async (i) => { if (i === 2) { await page.evaluate(() => { window.gw.time = 20; }); await sleep(700); await shot("06-dig2-no-tip"); } });
check((await tipShown()) === 0, "dig 2: Rootline under half again, tip not shown a second time");
check(m2 > 0, `dig 2: Pilfermoths spawn again once a dig is finished (max alive ${m2})`);
await shot("07-dig2-moth");
await b.close(); server.close();
console.log(fails ? `\n${fails} check(s) FAILED` : "\nall checks passed"); process.exit(fails ? 1 : 0);

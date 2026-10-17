// The six shots behind the strips in this folder: node docs/review/haze/shots.mjs <outDir> <port> [query]   (repo root, after build-web; needs Chrome)
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { MEMORIES, PETS } from "../../../proto/story.js";
const [out, port = "8861", q = "debug"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const srv = spawn("python", ["-m", "http.server", port, "--bind", "127.0.0.1", "--directory", "www"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
const mem = Object.values(MEMORIES).flatMap((ms) => ms.slice(0, 2).map((m) => m.id)), pets = Object.keys(PETS);
const save = { reset: "2026-10-17", gold: 40000000, light: 9000000, biomes: ["hollow", "ember", "grotto", "frostpine", "gulch", "heartwood", "cinder", "roost", "loom", "wickhold", "skywell"],
  owned: ["decor:mushrooms", "decor:jars", "decor:hammock", "decor:cart", "decor:lamps", "fireflies", "look:hat:miner", "look:scarf:#c8553d", "look:trinket:bow"],
  up: { lantern: 6, pick: 5, charm: 4, lens: 2, tongs: 1, sieve: 1 }, metPuddock: true, found: [{ color: "#8fd18b", cut: "brilliant" }, { color: "#f0b543", cut: "pear" }, { color: "#35b38a", cut: "step" }],
  look: { hat: "miner", scarf: "#c8553d", trinket: "bow" }, camp: { tent: "patchwork", banner: "#5fa04e", fire: "ring", hide: [] },
  story: { prologue: true, mem, confessed: true, sprout: true, site: "stump", ledge: true, finale: false, scale: false },
  pets: { owned: pets, active: pets.slice(0, 3), wear: { [pets[0]]: { head: "bow" } } }, coinTx: [] };
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--hide-scrollbars", "--mute-audio"] });
const p = await b.newPage();
const shot = async (name, wait = 900) => { await new Promise((r) => setTimeout(r, wait)); await p.screenshot({ path: `${out}/${name}.png` }); console.log(name); };
const tap = (sel) => p.evaluate((s) => document.querySelector(s)?.click(), sel);
const campTap = (what) => p.evaluate((w) => { const t = document.querySelector(`#campArt [data-tap="${w}"]`), r = t.getBoundingClientRect();
  t.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })); }, what);
try {
  await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3 });
  await p.evaluateOnNewDocument((s) => { if (!sessionStorage.seeded) { localStorage.setItem("gw.save", s); sessionStorage.seeded = 1; } }, JSON.stringify(save));
  await p.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: "networkidle0" });
  await shot("title", 1500);
  await tap("#tPlay"); await shot("camp", 2500);
  await campTap("market"); await shot("market");
  await p.goto(`http://127.0.0.1:${port}/index.html?${q}`, { waitUntil: "networkidle0" }); await tap("#tPlay"); await new Promise((r) => setTimeout(r, 1500));
  for (const id of ["hollow", "frostpine", "roost"]) {
    await p.evaluate((m) => window.gw.dig(m), id); await new Promise((r) => setTimeout(r, 1200));
    await p.evaluate(() => { const g = window.gw; for (let n = 0; n < 9; n++) for (let i = 0; i < 3; i++) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.tray[i]) { try { g.place(i, r, c); } catch {} } });
    await shot(id, 1500);
  }
} finally { await b.close(); srv.kill(); }

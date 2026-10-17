// Art audit: every screen at iPhone resolution (402×874 @3x), with a well-stocked save, for checking the art against
// docs/ART_STYLE.md. Usage: node scripts/build-web.mjs && node scripts/art-audit.mjs [outDir]   (needs Chrome)
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { MEMORIES, PETS } from "../proto/story.js";

const out = process.argv[2] || "docs/review/art", port = 8853, chrome = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync(out, { recursive: true });
const srv = spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", "www"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));

const mem = Object.values(MEMORIES).flatMap((ms) => ms.slice(0, 2).map((m) => m.id)), pets = Object.keys(PETS);
const save = { reset: "2026-10-17", gold: 40000000, light: 9000000, biomes: ["hollow", "ember", "grotto", "frostpine", "gulch", "heartwood", "cinder", "roost", "loom", "wickhold", "skywell"],
  owned: ["decor:mushrooms", "decor:jars", "decor:hammock", "decor:cart", "decor:lamps", "fireflies", "look:hat:miner", "look:scarf:#c8553d", "look:trinket:bow"],
  up: { lantern: 6, pick: 5, charm: 4, lens: 2, tongs: 1, sieve: 1 }, metPuddock: true, found: [{ color: "#8fd18b", cut: "brilliant" }, { color: "#f0b543", cut: "pear" }, { color: "#35b38a", cut: "step" }],
  look: { hat: "miner", scarf: "#c8553d", trinket: "bow" }, camp: { tent: "patchwork", banner: "#5fa04e", fire: "ring", hide: [] },
  story: { prologue: true, mem, confessed: true, sprout: true, site: "stump", ledge: true, finale: false, scale: false },
  pets: { owned: pets, active: pets.slice(0, 3), wear: { [pets[0]]: { head: "bow" } } }, coinTx: [] };

const b = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio"] });
const p = await b.newPage();
const shot = async (name, wait = 900) => { await new Promise((r) => setTimeout(r, wait)); await p.screenshot({ path: `${out}/${name}.png` }); console.log(name); };
const tap = (sel) => p.evaluate((s) => document.querySelector(s)?.click(), sel);
const campTap = (what) => p.evaluate((w) => { const t = document.querySelector(`#campArt [data-tap="${w}"]`), r = t.getBoundingClientRect();
  t.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })); }, what);
const back = () => p.evaluate(() => [...document.querySelectorAll(".screen.show .x, .screen.show [data-close], .screen.show .close")].find((x) => x.offsetParent)?.click());
try {
  await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3 });
  await p.evaluateOnNewDocument((s) => { if (!sessionStorage.seeded) { localStorage.setItem("gw.save", s); sessionStorage.seeded = 1; } }, JSON.stringify(save));
  await p.goto(`http://127.0.0.1:${port}/index.html?debug`, { waitUntil: "networkidle0" });
  await shot("01-title", 1500);
  // every art.js asset on one sheet, big, on the market's wood
  const sheet = await p.evaluate(async () => {
    const A = await import("./art.js"), grid = (title, items) => `<h3>${title}</h3><div class="g">${items.join("")}</div>`;
    const icons = "lantern pickaxe charm map fireflies dewdrop soundOn soundOff vibe symbols calendar vine leaf lock stall ad board regrow shatter tent banner mushroom jar forge cart hammock lens tongs sieve ticket campIco note back gear".split(" ");
    const cuts = ["brilliant", "step", "pear", "cabochon", "round", "prism", "star", "trillion"], cols = ["#8fd18b", "#35b38a", "#f0b543", "#d7def5", "#9b7cf2", "#4f7fe8", "#e0507a", "#ff7a3d"];
    const looks = [["hat", "leaf"], ["hat", "mushroom"], ["hat", "beanie"], ["hat", "flowers"], ["hat", "miner"], ["hat", "acorn"], ["hat", "bandana"], ["hat", "crown"], ["lantern", "amber"], ["lantern", "paper"], ["lantern", "jar"], ["lantern", "crystal"], ["lantern", "rose"], ["lantern", "golden"],
      ["trinket", "bow"], ["trinket", "clip"], ["trinket", "locket"], ["trinket", "goggles"], ["trinket", "pendant"], ["trinket", "heartstone"], ["cloak", "moss"], ["cloak", "shawl"], ["cloak", "mothwing"], ["cloak", "moonsilk"], ["scarf", "#c8553d"], ["fur", "sand"], ["fur", "starfur"]];
    const safe = (f) => { try { return f() || ""; } catch (e) { return `<i>${e.message.slice(0, 20)}</i>`; } };
    document.body.innerHTML = `<style>html,body{overflow:visible!important;height:auto!important;position:static!important} body{background:#4f331d;color:#f6ead0;font:12px Fredoka;margin:8px} .g{display:flex;flex-wrap:wrap;gap:6px} .g>*{background:rgba(0,0,0,.18);border-radius:8px}</style>
      ${grid("icons", icons.map((n) => safe(() => A.icon(n, 52))))}
      ${grid("gems", cuts.map((c, k) => safe(() => A.gem(cols[k], 52, "", c))))}${grid("coin, packs", [A.coin(52), ...["pouch", "satchel", "chest", "hoard"].map((k) => safe(() => A.coinPack(k, 60)))])}
      ${grid("wardrobe", looks.map(([pt, v]) => safe(() => A.lookItem(pt, v, 52))))}
      ${grid("builds", (A.BUILD_KINDS || []).map((k) => safe(() => A.buildTile(k, 64))))}
      ${grid("pets", (A.PET_KINDS || []).map((k) => safe(() => A.pet(k, 64))))}
      ${grid("folk", [safe(() => A.dibble(96)), safe(() => A.puddock(96)), safe(() => A.granny(96)), safe(() => A.bidder(96))])}`;
    return icons.length; });
  await new Promise((r) => setTimeout(r, 1200)); await p.screenshot({ path: `${out}/00-assets.png`, fullPage: true }); console.log("00-assets"); await p.reload({ waitUntil: "networkidle0" });
  await tap("#tPlay"); await shot("02-camp", 2500);
  await campTap("market"); await shot("03-market-tools");
  for (const t of ["wardrobe", "camp", "maps", "pets"]) { await tap(`#mktTabs [data-tab="${t}"]`); await shot("04-market-" + t); }
  await p.evaluate(() => { const s = document.querySelector("#market .scroll, #shop"); s && (s.scrollTop = 99999); }); await shot("05-market-pets-end");
  await back(); await campTap("wardrobe"); await shot("06-wardrobe");
  await back(); await campTap("mines"); await shot("07-mines");
  await back(); await campTap("memories"); await shot("08-memories");
  await p.evaluate(() => document.querySelector("#memShelf [data-mem]")?.click()); await shot("09-memory-dialog");
  await p.goto(`http://127.0.0.1:${port}/index.html?debug`, { waitUntil: "networkidle0" }); await tap("#tPlay"); await new Promise((r) => setTimeout(r, 1500));
  await p.evaluate(() => document.querySelector("#homeGoldPill")?.click()); await shot("10-coin-purse");
  for (const id of ["hollow", "ember", "frostpine", "gulch", "roost", "skywell"]) {
    await p.evaluate((m) => window.gw.dig(m), id); await new Promise((r) => setTimeout(r, 1200));
    await p.evaluate(() => { const g = window.gw; for (let n = 0; n < 9; n++) for (let i = 0; i < 3; i++) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.tray[i]) { try { g.place(i, r, c); } catch {} } });
    await shot("11-dig-" + id, 1500);
  }
} finally { await b.close(); srv.kill(); }

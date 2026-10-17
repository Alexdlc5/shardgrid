// Self-check: node proto/check.mjs  (rules must match sim/sim.py)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { N, buildCatalog, canPlace, place, fullLines, lineCells, clearCells, deal, rescueCells, breakCells, pureVeinCells, stoneBreak } from "./game.js";

const root = new URL("..", import.meta.url);
const cfg = JSON.parse(readFileSync(new URL("sim/generator.json", root)));
const cat = buildCatalog(cfg);

// same catalog as the Python sim: ids and placement counts
const py = JSON.parse(execFileSync("python", ["-c",
  "import json,sys; sys.path.insert(0,'sim'); import sim; " +
  "print(json.dumps({p[0]: len(p[2]) for p in sim.load(json.load(open('sim/generator.json')))}))"],
  { cwd: root }).toString());
const js = Object.fromEntries(cat.map((p) => [p.id, (N - p.h + 1) * (N - p.w + 1)]));
assert.deepEqual(Object.keys(js).sort(), Object.keys(py).sort());
for (const id in py) assert.equal(js[id], py[id], id);

// row + column crossing clears both, shared cell counted once
let b = Array(64).fill(0);
for (let i = 0; i < N; i++) { b[2 * N + i] = 1; b[i * N + 5] = 1; }
const lines = fullLines(b);
assert.deepEqual(lines, { rows: [2], cols: [5] });
assert.equal(lineCells(lines).length, 15);
assert.ok(clearCells(b, lineCells(lines)).every((v) => !v));

// bounds and overlap
const dot = cat.find((p) => p.id === "dot.0"), l5 = cat.find((p) => p.id === "line5.0");
assert.ok(canPlace(b, dot, 0, 0) && !canPlace(b, dot, 2, 0) && !canPlace(b, dot, 8, 0));
assert.ok(!canPlace(Array(64).fill(0), l5, N - l5.h + 1, N - l5.w + 1));

// rescue takes the fullest lines
b = Array(64).fill(0);
for (let i = 0; i < 24; i++) b[i] = 1;
assert.equal(rescueCells(b, 3).length, 24);

// deal is ad-blind: exactly (rng, board, cat, cfg)
assert.equal(deal.length, 4);
assert.equal(deal(Math.random, Array(64).fill(0), cat, cfg).length, 3);
assert.ok(place(Array(64).fill(0), dot, 3, 3, 9)[27] === 9);
// ember chain: row 0 cleared; ember at (0,0) breaks (1,0),(1,1); ember at (1,1) chains to (2,2)
b = Array(64).fill(0);
for (let c = 0; c < N; c++) b[c] = 1;        // row 0, uid 1 (ember)
b[8] = 2; b[9] = 3; b[18] = 4; b[30] = 5;   // (1,0) plain, (1,1) ember, (2,2) plain, (3,6) untouched
const isEmber = (u) => u === 1 || u === 3;
const br = breakCells(b, { rows: [0], cols: [] }, isEmber);
assert.deepEqual(new Set(br.cells), new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 18]));
assert.equal(br.embers, 9); // 8 ember cells in row 0 + the chained one

// pure vein: row of one type counts, mixed row doesn't
b = Array(64).fill(0);
for (let c = 0; c < N; c++) { b[c] = 1; b[8 + c] = c < 4 ? 1 : 2; }
const typeOf = (u) => (u === 1 ? "moss" : "jade");
assert.equal(pureVeinCells(b, { rows: [0, 1], cols: [] }, typeOf).size, 8);
// rubble stone, same case as sim/test_sim.py: row 0 clears; stones at (0,3) and (1,5) crack, (2,5) doesn't;
// a second clear breaks both cracked stones
b = Array(64).fill(1); b[3] = b[13] = b[21] = 2;
const isStone = (u) => u === 2, row0 = [...Array(N).keys()];
let sb = stoneBreak(b, row0, isStone, new Set());
assert.deepEqual(new Set(sb.cells), new Set(row0.filter((i) => i !== 3)));
assert.deepEqual(sb.cracked, new Set([3, 13]));
sb = stoneBreak(b, row0, isStone, sb.cracked);
assert.deepEqual(new Set(sb.cells), new Set([...row0, 13]));
assert.equal(sb.cracked.size, 0);
for (const [m, bm] of Object.entries(cfg.biomes)) assert.equal("rubble" in bm.types, m === "skywell", m);
console.log("ok");

// story (docs/STORY.md): every mine has memories, chalk and lines; memories come in order and ids are unique
const story = await import("./story.js");
for (const m of Object.keys(cfg.biomes)) assert.ok(story.MEMORIES[m]?.length && story.CHALK[m] && story.PUDDOCK_BY_MINE[m]?.length, m);
const ids = Object.values(story.MEMORIES).flat().map((m) => m.id);
assert.equal(new Set(ids).size, ids.length);
assert.equal(story.nextMemory("hollow", []).id, "hollow1");
assert.equal(story.nextMemory("hollow", ["hollow1"]).id, "hollow2");
assert.equal(story.nextMemory("hollow", ["hollow1", "hollow2", "hollow3"]), null);
assert.ok(story.MEMORIES.gulch.some((m) => m.id === "receipt")); // the confession trigger
console.log("story ok");
// scenes play in story order, one per sale
const all = (m) => story.MEMORIES[m].map((x) => x.id), st0 = { mem: [], site: "stump" };
assert.equal(story.nextScene(st0), null);
assert.equal(story.nextScene({ ...st0, mem: ["receipt"] }), "confession");
assert.equal(story.nextScene({ ...st0, mem: all("heartwood") }), "sprout");
assert.equal(story.nextScene({ ...st0, mem: all("heartwood"), sprout: true }), null);
assert.equal(story.nextScene({ ...st0, mem: ["receipt", ...all("heartwood")], confessed: true }), "lead");
assert.equal(story.nextScene({ ...st0, site: "underroot", mem: all("cinder"), confessed: true }), "ledge");
assert.equal(story.nextScene({ ...st0, site: "underroot", ledge: true, mem: all("wickhold"), confessed: true }), "reunion");
assert.equal(story.nextScene({ ...st0, site: "skywell", ledge: true, mem: all("skywell"), confessed: true }), "finale");
assert.equal(story.nextScene({ ...st0, site: "skywell", ledge: true, finale: true, mem: all("skywell"), confessed: true }), null);
assert.ok(story.MAP_GATE.loom({ mem: all("roost") }) && !story.MAP_GATE.loom({ mem: [] }));
for (const sc of Object.values(story.SCENES)) for (const st of sc) assert.ok(st.who || st.art, "scene step needs a speaker or a picture");
console.log("scenes ok");
// coin packs (platform.js): each transaction pays out once; bonus tags never overstate gold per dollar
globalThis.window = {};
const { claim, COIN_PACKS } = await import("./platform.js");
const credited = [], tx = (id, p = "coins_pouch") => ({ transactionIdentifier: id, productIdentifier: p });
assert.equal(claim([tx("a"), tx("a"), tx("b", "coins_hoard"), tx("c", "no_ads"), undefined], credited), 1200 + 32800);
assert.equal(claim([tx("a"), tx("b", "coins_hoard")], credited), 0);
assert.deepEqual(credited, ["a", "b"]);
const perUsd = (p) => p.gold / p.usd, base = perUsd(COIN_PACKS.coins_pouch);
for (const p of Object.values(COIN_PACKS)) assert.ok(perUsd(p) / base >= 1 + p.bonus / 100 && perUsd(p) / base < 1 + (p.bonus + 5) / 100, p.name);
console.log("coins ok");
// Daily Dig (daily.js): the day is the device's local date; the streak counts consecutive local days
const { localDate, streakAfter, untilMidnight } = await import("./daily.js");
const at = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi), day = (...a) => localDate(at(...a)), yday = (...a) => localDate(at(...a), -1);
assert.equal(day(2026, 3, 9), "2026-03-09"); // zero-padded local date, no UTC shift
assert.equal(yday(2026, 3, 1), "2026-02-28");
assert.equal(streakAfter("2026-10-15", 3, day(2026, 10, 16), yday(2026, 10, 16)), 4); // consecutive local days extend it
assert.equal(streakAfter("2026-10-14", 3, day(2026, 10, 16), yday(2026, 10, 16)), 1); // a two-day gap starts over
assert.equal(streakAfter("2026-10-16", 3, day(2026, 10, 16), yday(2026, 10, 16)), 3); // the same day doesn't double-count
assert.equal(streakAfter("", 0, day(2026, 10, 16), yday(2026, 10, 16)), 1); // first ever
const late = at(2026, 10, 16, 23, 30), early = at(2026, 10, 17, 0, 10); // 23:30 then 00:10: consecutive, whatever UTC says
assert.equal(streakAfter(localDate(late), 1, localDate(early), localDate(early, -1)), 2);
assert.equal(untilMidnight(at(2026, 10, 16, 20, 48)), "3h 12m");
assert.equal(untilMidnight(at(2026, 10, 16, 23, 48)), "12m");
assert.equal(untilMidnight(new Date(2026, 9, 16, 23, 47, 30)), "13m"); // rounds up
console.log("daily ok");

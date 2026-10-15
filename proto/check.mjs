// Self-check: node proto/check.mjs  (rules must match sim/sim.py)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { N, buildCatalog, canPlace, place, fullLines, lineCells, clearCells, deal, rescueCells } from "./game.js";

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
console.log("ok");

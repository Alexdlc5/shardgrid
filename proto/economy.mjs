// Expedition economy sim: gold, length and rare-gem odds per mine, using the game's own rules (game.js)
// and the shared config. Greedy bot, no upgrades, no rescues: the floor a new player sees.
//   node proto/economy.mjs [expeditions=300]     report
//   node proto/economy.mjs --tune                 solve drain, richness, rare odds and prices; writes sim/generator.json
import { readFileSync, writeFileSync } from "node:fs";
import { N, buildCatalog, canPlace, place, fullLines, clearCells, fitsAnywhere, deal, breakCells, pureVeinCells } from "./game.js";

const CFG_URL = new URL("../sim/generator.json", import.meta.url), cfg = JSON.parse(readFileSync(CFG_URL));
const T = cfg.rootline, C = cfg.crystals, RUNS = +process.argv[2] || 300;

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// board quality, same idea as sim.py value(): fewer filled/empty boundaries and walled-in holes
function quality(b) {
  let edges = 0, holes = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const f = !!b[r * N + c];
    if (c < N - 1 && f !== !!b[r * N + c + 1]) edges++;
    if (r < N - 1 && f !== !!b[(r + 1) * N + c]) edges++;
    if (!f && (c === 0 || b[r * N + c - 1]) && (c === N - 1 || b[r * N + c + 1]) && (r === 0 || b[(r - 1) * N + c]) && (r === N - 1 || b[(r + 1) * N + c])) holes++;
  }
  return -edges - 4 * holes;
}

function expedition(biomeId, seed) {
  const bm = cfg.biomes[biomeId], rng = mulberry(seed);
  const cat = buildCatalog({ ...cfg, families: { ...cfg.families, ...(bm.families || {}) } });
  const tw = Object.entries(bm.types), tot = tw.reduce((s, [, w]) => s + w, 0);
  const pickType = () => { let x = rng() * tot; for (const [t, w] of tw) if ((x -= w) < 0) return t; return tw[0][0]; };
  const meta = {}, haul = {};
  let board = Array(64).fill(0), uid = 1, time = T.max_time, clock = 0, combo = 0, miss = 0, frozen = 0;
  const [mu, sd] = T.bot_seconds.greedy;
  let tray = deal(rng, board, cat, cfg).map((piece) => ({ piece, type: pickType() }));
  for (;;) {
    let best = null;
    tray.forEach((q, i) => { if (!q) return;
      for (let r = 0; r <= N - q.piece.h; r++) for (let c = 0; c <= N - q.piece.w; c++) {
        if (!canPlace(board, q.piece, r, c)) continue;
        const nb = place(board, q.piece, r, c, -1), L = fullLines(nb), n = L.rows.length + L.cols.length;
        const sc = 20 * n + quality(n ? clearCells(nb, [...new Set([...L.rows.flatMap((x) => [...Array(N)].map((_, k) => x * N + k)), ...L.cols.flatMap((x) => [...Array(N)].map((_, k) => k * N + x))])]) : nb);
        if (!best || sc > best.sc) best = { sc, i, r, c };
      } });
    if (!best) return { end: "stuck", clock, haul };
    // thinking time drains the Rootline (unless frozen)
    const think = Math.max(.8, mu + sd * (rng() * 2 - 1)), drainT = Math.max(0, think - frozen);
    frozen = Math.max(0, frozen - think); time -= drainT * T.drain * bm.drain; clock += think;
    if (time <= 0) return { end: "time", clock, haul };
    const q = tray[best.i], id = uid++; meta[id] = q.type;
    board = place(board, q.piece, best.r, best.c, id);
    const L = fullLines(board), n = L.rows.length + L.cols.length;
    if (n) {
      combo++; miss = 0;
      const { cells } = breakCells(board, L, (u) => !!C[meta[u]]?.ember), pure = pureVeinCells(board, L, (u) => meta[u]);
      let bloom = 0, freeze = 0;
      for (const k of cells) { const t = meta[board[k]]; haul[t] = (haul[t] || 0) + (pure.has(k) ? 2 : 1); bloom += C[t].bloom || 0; freeze += C[t].freeze || 0; }
      board = clearCells(board, cells);
      time = Math.min(T.max_time, time + T.refill_per_line * n * (1 + T.combo_bonus * (combo - 1)) + bloom);
      frozen = Math.min(T.freeze_max, frozen + freeze);
    } else if (combo && ++miss >= T.combo_break) { combo = 0; miss = 0; }
    tray[best.i] = null;
    if (tray.every((x) => !x)) tray = deal(rng, board, cat, cfg).map((piece) => ({ piece, type: pickType() }));
    if (!tray.some((x) => x && fitsAnywhere(board, x.piece))) return { end: "stuck", clock, haul };
  }
}

const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * p)];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const rares = ["geode", "heart"];
export function report(runs = RUNS, only = null) {
  const out = {};
  for (const id of only || Object.keys(cfg.biomes)) {
    const res = [...Array(runs)].map((_, k) => expedition(id, 1000 + k));
    const rich = cfg.biomes[id].richness || 1, gold = res.map((r) => Object.entries(r.haul).reduce((s, [t, n]) => s + n * C[t].value, 0) * rich);
    const secs = res.map((r) => r.clock);
    const rare = Object.fromEntries(rares.filter((t) => cfg.biomes[id].types[t]).map((t) => [t, res.filter((r) => r.haul[t]).length / runs]));
    out[id] = { gold50: pct(gold, .5), goldMean: gold.reduce((s, v) => s + v, 0) / runs, len50: pct(secs, .5), rare, timeEnds: res.filter((r) => r.end === "time").length / runs };
  }
  return out;
}

// --- tuner: targets are design decisions, the sim finds the numbers that hit them ---
const TARGET = {
  len: { hollow: 195, ember: 180, grotto: 170, frostpine: 160, gulch: 150, heartwood: 140 }, // median seconds, no upgrades
  payStep: 1.7,                                    // each mine pays ~1.7x the previous one
  rare: { gulch: ["geode", .35], heartwood: ["heart", .30] }, // share of expeditions where the jackpot gem shows up
  expeditionsToUnlock: [5, 7, 9, 11, 13],          // in the previous mine, before upgrades
};
const nice = (g) => { const m = 10 ** Math.floor(Math.log10(g)) / 2; return Math.round(g / m) * m; };
function bisect(set, measure, target, lo, hi, increasing, steps = 9) {
  for (let k = 0; k < steps; k++) { const mid = (lo + hi) / 2; set(mid); (measure() < target) === increasing ? (lo = mid) : (hi = mid); }
  set(+((lo + hi) / 2).toFixed(3));
}
function tune() {
  const ids = Object.keys(cfg.biomes), R = 160;
  for (const id of ids) {
    const bm = cfg.biomes[id];
    bisect((d) => (bm.drain = d), () => report(R, [id])[id].len50, TARGET.len[id], .4, 2.5, false);
    if (TARGET.rare[id]) { const [g, share] = TARGET.rare[id]; // after drain: longer digs see more pieces
      bisect((w) => (bm.types[g] = w), () => report(R, [id])[id].rare[g], share, .005, 1.5, true); }
  }
  let prev = null;
  ids.forEach((id, k) => {
    const bm = cfg.biomes[id]; bm.richness = 1;
    const base = report(R, [id])[id].goldMean;
    bm.richness = k ? +((prev * TARGET.payStep) / base).toFixed(2) : 1;
    const mean = base * bm.richness;
    if (k) bm.cost = nice(prev * TARGET.expeditionsToUnlock[k - 1]);
    prev = mean;
  });
  writeFileSync(CFG_URL, JSON.stringify(cfg, null, 2) + String.fromCharCode(10));
}
if (process.argv.includes("--tune")) { tune(); console.log("tuned -> sim/generator.json"); }

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`.replace("file:////", "file:///")) {
  const r = report(), ids = Object.keys(r);
  console.log("mine        cost    gold/exp (p50, mean)  length p50  time-ends  rare gem seen in");
  ids.forEach((id, k) => {
    const x = r[id], cost = cfg.biomes[id].cost, prev = k ? r[ids[k - 1]].goldMean : 0;
    console.log(`${id.padEnd(10)} ${String(cost).padStart(7)}  ${String(Math.round(x.gold50)).padStart(5)} ${String(Math.round(x.goldMean)).padStart(6)}        ${mmss(x.len50).padStart(5)}      ${(x.timeEnds * 100).toFixed(0).padStart(3)}%   ${Object.entries(x.rare).map(([t, f]) => `${t} ${(f * 100).toFixed(0)}%`).join(" ") || "-"}` +
      (k ? `   (= ${(cost / prev).toFixed(1)} expeditions in ${ids[k - 1]})` : ""));
  });
}

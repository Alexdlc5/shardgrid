// Shardgrid rules: same as sim/sim.py, on a 64-cell array (0 = empty, else piece uid).
// Pure logic, no DOM: the browser prototype and the node self-check both import it.
export const N = 8;

const key = (cells) => cells.map(([r, c]) => r + "," + c).sort().join(" ");

function norm(cells) {
  const mr = Math.min(...cells.map(([r]) => r));
  const mc = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [r - mr, c - mc]);
}

export function orientations(art) {
  let cells = [];
  art.forEach((row, r) => [...row].forEach((ch, c) => ch === "X" && cells.push([r, c])));
  const out = new Map();
  for (let i = 0; i < 4; i++) {
    cells = cells.map(([r, c]) => [c, -r]);
    for (const v of [norm(cells), norm(cells.map(([r, c]) => [r, -c]))]) out.set(key(v), v);
  }
  return [...out.values()];
}

export function buildCatalog(cfg) {
  const cat = [];
  Object.entries(cfg.families).forEach(([fam, spec], fi) => {
    const ors = orientations(spec.art);
    ors.forEach((cells, i) => cat.push({
      id: `${fam}.${i}`, family: fi, weight: spec.weight / ors.length, cells,
      h: Math.max(...cells.map(([r]) => r)) + 1,
      w: Math.max(...cells.map(([, c]) => c)) + 1,
    }));
  });
  return cat;
}

export function canPlace(board, piece, r, c) {
  return piece.cells.every(([dr, dc]) => {
    const rr = r + dr, cc = c + dc;
    return rr >= 0 && rr < N && cc >= 0 && cc < N && !board[rr * N + cc];
  });
}

export function place(board, piece, r, c, uid) {
  const b = board.slice();
  for (const [dr, dc] of piece.cells) b[(r + dr) * N + c + dc] = uid;
  return b;
}

export function fullLines(board) {
  const rows = [], cols = [];
  for (let i = 0; i < N; i++) {
    let row = true, col = true;
    for (let j = 0; j < N; j++) {
      row &&= !!board[i * N + j];
      col &&= !!board[j * N + i];
    }
    if (row) rows.push(i);
    if (col) cols.push(i);
  }
  return { rows, cols };
}

export function lineCells({ rows, cols }) {
  const s = new Set();
  for (const r of rows) for (let c = 0; c < N; c++) s.add(r * N + c);
  for (const c of cols) for (let r = 0; r < N; r++) s.add(r * N + c);
  return [...s];
}

export function clearCells(board, cells) {
  const b = board.slice();
  for (const i of cells) b[i] = 0;
  return b;
}

export function fitsAnywhere(board, piece) {
  for (let r = 0; r <= N - piece.h; r++)
    for (let c = 0; c <= N - piece.w; c++) if (canPlace(board, piece, r, c)) return true;
  return false;
}

function pick(rng, cat, total) {
  let x = rng() * total;
  for (const p of cat) if ((x -= p.weight) < 0) return p;
  return cat[cat.length - 1];
}

// Ad-blind by construction: only the board and the RNG go in. See SPEC §0.6.
export function deal(rng, board, cat, cfg) {
  const total = cat.reduce((s, p) => s + p.weight, 0);
  const draw = () => [0, 1, 2].map(() => pick(rng, cat, total));
  let tray = draw();
  if (board.filter(Boolean).length >= cfg.mercy_fill * 64) {
    for (let i = 0; i < cfg.mercy_rerolls; i++) {
      if (tray.some((p) => fitsAnywhere(board, p))) break;
      tray = draw();
    }
  }
  return tray;
}

// Rescue: indexes of the cells in the n fullest lines.
export function rescueCells(board, n) {
  const lines = [];
  for (let i = 0; i < N; i++) {
    const row = [], col = [];
    for (let j = 0; j < N; j++) { row.push(i * N + j); col.push(j * N + i); }
    lines.push(row, col);
  }
  lines.sort((a, b) => b.filter((i) => board[i]).length - a.filter((i) => board[i]).length);
  return [...new Set(lines.slice(0, n).flat())].filter((i) => board[i]);
}

// Cells broken by clearing `lines`, plus ember chains: a broken ember shatters its 8 neighbours,
// and embers among those shatter theirs. isEmber(uid) says which pieces are embers.
export function breakCells(board, lines, isEmber) {
  const broken = new Set(lineCells(lines));
  const queue = [...broken];
  let embers = 0;
  while (queue.length) {
    const i = queue.pop();
    if (!isEmber(board[i])) continue;
    embers++;
    const r = Math.floor(i / N), c = i % N;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc, j = rr * N + cc;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N || !board[j] || broken.has(j)) continue;
      broken.add(j); queue.push(j);
    }
  }
  return { cells: [...broken], embers };
}

// Cleared lines whose 8 crystals are all one type ("pure veins") -> their cell indexes.
export function pureVeinCells(board, lines, typeOf) {
  const pure = new Set();
  const check = (idxs) => {
    const t = typeOf(board[idxs[0]]);
    if (idxs.every((i) => typeOf(board[i]) === t)) idxs.forEach((i) => pure.add(i));
  };
  for (const r of lines.rows) check([...Array(N)].map((_, c) => r * N + c));
  for (const c of lines.cols) check([...Array(N)].map((_, r) => r * N + c));
  return pure;
}

// Rubble stone (Skywell): stone doesn't break with its line. A clear through it or beside it (4 sides)
// cracks it once; the second crack breaks it. Takes the cells a clear would break and the cracked set,
// returns the cells that really break and the new cracked set. Same as stone_break in sim/sim.py.
export function stoneBreak(board, cells, isStone, cracked) {
  const hit = new Set(), out = [];
  for (const i of cells) {
    if (isStone(board[i])) { hit.add(i); continue; }
    out.push(i);
    const r = Math.floor(i / N), c = i % N;
    for (const [rr, cc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]])
      if (rr >= 0 && rr < N && cc >= 0 && cc < N && isStone(board[rr * N + cc])) hit.add(rr * N + cc);
  }
  const next = new Set(cracked);
  for (const i of hit) if (next.delete(i)) out.push(i); else next.add(i);
  return { cells: out, cracked: next, hits: hit.size };
}

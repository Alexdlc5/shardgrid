"""Shardgrid headless simulator: piece generator + bots on an 8x8 bitboard. Stdlib only.

    python sim/sim.py --games 10000 --bot greedy
    python sim/sim.py --check            # CI gate: greedy + lookahead vs target band
    python sim/sim.py --rescues 1        # value of one rescue continue, in placements

Board bit i = row*8 + col. generator.json is the single source of truth for weights;
the Unity build ships the same file as Remote Config defaults.
"""
import argparse
import json
import random
import statistics
import sys
from multiprocessing import Pool
from pathlib import Path

N = 8
FULL = (1 << 64) - 1
ROWS = [0xFF << (8 * r) for r in range(N)]
COLS = [sum(1 << (8 * r + c) for r in range(N)) for c in range(N)]
LINES = ROWS + COLS
COL0, COL7, ROW0, ROW7 = COLS[0], COLS[7], ROWS[0], ROWS[7]
CAP = 5000  # placements; a game this long counts as "capped"
CFG_PATH = Path(__file__).with_name("generator.json")


# --- shapes -----------------------------------------------------------------

def _norm(cells):
    mr = min(r for r, _ in cells)
    mc = min(c for _, c in cells)
    return frozenset((r - mr, c - mc) for r, c in cells)


def orientations(art):
    """All distinct rotations and mirrors of an ASCII shape."""
    cells = {(r, c) for r, row in enumerate(art) for c, ch in enumerate(row) if ch == "X"}
    out = set()
    for _ in range(4):
        cells = {(c, -r) for r, c in cells}
        out.add(_norm(cells))
        out.add(_norm({(r, -c) for r, c in cells}))
    return sorted(out, key=sorted)


def placements(shape):
    h = max(r for r, _ in shape) + 1
    w = max(c for _, c in shape) + 1
    return [sum(1 << ((r + dr) * 8 + c + dc) for dr, dc in shape)
            for r in range(N - h + 1) for c in range(N - w + 1)]


def load(cfg):
    """Catalog: list of (piece_id, weight, placement_masks)."""
    cat = []
    for fam, spec in cfg["families"].items():
        ors = orientations(spec["art"])
        for i, shape in enumerate(ors):
            cat.append((f"{fam}.{i}", spec["weight"] / len(ors), placements(shape)))
    return cat


# --- rules ------------------------------------------------------------------

def fits(board, masks):
    return any(not board & m for m in masks)


def clear(board):
    full = [m for m in LINES if board & m == m]  # find all first: row/col overlap
    for m in full:
        board &= ~m
    return board, len(full)


def deal(rng, board, cat, cum, cfg):
    """Tray of 3 piece indexes.

    Takes only the board and its own RNG. Ad, IAP and rescue state can never reach
    it, so the deal cannot be rigged to push players toward ads.
    """
    idx = range(len(cat))
    tray = rng.choices(idx, cum_weights=cum, k=3)
    if board.bit_count() >= cfg["mercy_fill"] * 64:
        for _ in range(cfg["mercy_rerolls"]):
            if any(fits(board, cat[i][2]) for i in tray):
                break
            tray = rng.choices(idx, cum_weights=cum, k=3)
    return tray


def rescue(board, lines=3):
    """Rescue continue: clear the `lines` fullest lines."""
    for m in sorted(LINES, key=lambda m: -(board & m).bit_count())[:lines]:
        board &= ~m
    return board


# --- bots -------------------------------------------------------------------

def isolated(b):
    """Empty cells walled in on all 4 sides (edges count as walls)."""
    west = ((b << 1) & ~COL0) | COL0
    east = ((b >> 1) & ~COL7) | COL7
    north = (b << 8) | ROW0
    south = (b >> 8) | ROW7
    return ~b & west & east & north & south & FULL


def value(b):
    """Board quality: fewer filled/empty boundaries and fewer holes is better."""
    h = ((b ^ (b >> 1)) & ~COL7 & FULL).bit_count()
    v = ((b ^ (b >> 8)) & (FULL >> 8)).bit_count()
    return -h - v - 4 * isolated(b).bit_count()


def moves(b, tray, cat):
    for i, pid in enumerate(tray):
        for m in cat[pid][2]:
            if not b & m:
                nb, lines = clear(b | m)
                yield i, nb, lines


def bot_random(rng, b, tray, cat):
    ms = list(moves(b, tray, cat))
    return rng.choice(ms) if ms else None


def bot_greedy(rng, b, tray, cat):
    return max(moves(b, tray, cat), key=lambda mv: 20 * mv[2] + value(mv[1]), default=None)


def bot_lookahead(rng, b, tray, cat, beam=6):
    """Beam search over the order and placement of the whole tray; play its first move."""
    frontier = [(0, b, tuple(tray), None)]  # (lines_score, board, remaining, first_move)
    best = None
    for depth in range(len(tray)):
        nxt = []
        for acc, bb, tr, first in frontier:
            for i, nb, lines in moves(bb, tr, cat):
                nxt.append((acc + 20 * lines, nb, tr[:i] + tr[i + 1:], first or (i, nb, lines)))
        if not nxt:
            break
        nxt.sort(key=lambda s: s[0] + value(s[1]), reverse=True)
        frontier = nxt[:beam]
        best = frontier[0]  # deeper beats shallower: placing more pieces is survival
    return best and best[3]


BOTS = {"random": bot_random, "greedy": bot_greedy, "lookahead": bot_lookahead}


# --- games ------------------------------------------------------------------

def play(seed, bot, cat, cum, cfg, rescues=0):
    """One game. Returns (placements, lines, trays, rescues_used)."""
    gen = random.Random(seed)
    brng = random.Random(seed ^ 0x5EED)
    b = placed = lines = used = 0
    tray, trays = deal(gen, b, cat, cum, cfg), 1
    while placed < CAP:
        mv = bot(brng, b, tray, cat)
        if mv is None:
            if used == rescues:
                break
            used += 1
            b = rescue(b, cfg["rescue_lines"])
            tray, trays = deal(gen, b, cat, cum, cfg), trays + 1
            continue
        i, b, ln = mv
        placed, lines = placed + 1, lines + ln
        tray = tray[:i] + tray[i + 1:]
        if not tray:
            tray, trays = deal(gen, b, cat, cum, cfg), trays + 1
    return placed, lines, trays, used


_W = {}


def _init(cfg):
    cat = load(cfg)
    cum, t = [], 0
    for _, w, _ in cat:
        t += w
        cum.append(t)
    _W.update(cfg=cfg, cat=cat, cum=cum)


def _job(args):
    seed, bot, rescues = args
    return play(seed, BOTS[bot], _W["cat"], _W["cum"], _W["cfg"], rescues)


def run(cfg, bot, games, seed=1, rescues=0, procs=None):
    with Pool(procs, _init, (cfg,)) as pool:
        return pool.map(_job, [(seed + g, bot, rescues) for g in range(games)], chunksize=50)


def summary(results):
    p = [r[0] for r in results]
    q = statistics.quantiles(p, n=100, method="inclusive")
    return {
        "games": len(p),
        "p10": q[9], "p50": q[49], "p90": q[89], "p99": q[98],
        "mean_lines": statistics.fmean(r[1] for r in results),
        "first_tray": sum(r[2] == 1 for r in results) / len(p),
        "capped": sum(r[0] >= CAP for r in results) / len(p),
    }


def fmt(name, s):
    return (f"{name:<10} n={s['games']} placements p10={s['p10']:.0f} p50={s['p50']:.0f} "
            f"p90={s['p90']:.0f} p99={s['p99']:.0f} | lines/game={s['mean_lines']:.1f} "
            f"first-tray={s['first_tray']:.2%} capped={s['capped']:.2%}")


def check(cfg, games, seed):
    t = cfg["target"]
    g = summary(run(cfg, t["bot"], games, seed))
    la = summary(run(cfg, "lookahead", games // 5, seed))  # 5x slower bot, smaller sample
    print(fmt(t["bot"], g))
    print(fmt("lookahead", la))
    fails = []
    if not t["p50"][0] <= g["p50"] <= t["p50"][1]:
        fails.append(f"greedy p50 {g['p50']:.0f} outside {t['p50']}")
    if g["p90"] > t["p90_max"]:
        fails.append(f"greedy p90 {g['p90']:.0f} > {t['p90_max']}")
    if g["first_tray"] > t["first_tray_max"]:
        fails.append(f"first-tray {g['first_tray']:.2%} > {t['first_tray_max']:.0%}")
    if la["p50"] < t["lookahead_p50_ratio_min"] * g["p50"]:
        fails.append(f"lookahead p50 {la['p50']:.0f} < {t['lookahead_p50_ratio_min']}x greedy")
    print("BAND OK" if not fails else "BAND FAIL: " + "; ".join(fails))
    return not fails


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", type=int, default=10000)
    ap.add_argument("--bot", choices=BOTS, default="greedy")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--rescues", type=int, default=0)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--config", type=Path, default=CFG_PATH)
    a = ap.parse_args()
    cfg = json.loads(a.config.read_text())
    if a.check:
        sys.exit(0 if check(cfg, a.games, a.seed) else 1)
    base = run(cfg, a.bot, a.games, a.seed)
    print(fmt(a.bot, summary(base)))
    if a.rescues:
        res = run(cfg, a.bot, a.games, a.seed, a.rescues)
        used = sum(r[3] for r in res) or 1
        gain = (sum(r[0] for r in res) - sum(r[0] for r in base)) / used
        print(fmt(f"+{a.rescues} rescue", summary(res)))
        print(f"each rescue adds {gain:.1f} placements on average")


if __name__ == "__main__":
    main()

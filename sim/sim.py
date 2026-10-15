"""Shardgrid headless simulator: piece generator + bots on an 8x8 bitboard. Stdlib only.

    python sim/sim.py --games 10000 --bot greedy
    python sim/sim.py --check            # CI gate: greedy + lookahead vs target band
    python sim/sim.py --rescues 1        # value of one rescue continue, in placements
    python sim/sim.py --timed            # Rootline timer: expedition seconds, time vs stuck, per mine

Board bit i = row*8 + col. generator.json is the single source of truth for weights;
the Unity build ships the same file as Remote Config defaults.
"""
import argparse
import itertools
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


def catalog(cfg, biome=None):
    """(catalog, cumulative weights), with a mine's own shape families added."""
    fams = {**cfg["families"], **cfg["biomes"][biome].get("families", {})} if biome else cfg["families"]
    cat = load({"families": fams})
    return cat, list(itertools.accumulate(w for _, w, _ in cat))


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


def grow(x):
    """x plus its 8 neighbours."""
    x |= ((x << 1) & ~COL0) | ((x >> 1) & ~COL7)
    return (x | (x << 8) | (x >> 8)) & FULL


def ember_break(b, e, broken):
    """Cells broken by clearing `broken` on board b with ember cells e: a broken ember
    shatters its 3x3, and embers among those chain (breakCells in proto/game.js)."""
    lit = 0
    while broken & e & ~lit:
        lit |= broken & e
        broken |= grow(lit) & b
    return broken


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
                yield i, nb, lines, m


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
            for i, nb, lines, m in moves(bb, tr, cat):
                nxt.append((acc + 20 * lines, nb, tr[:i] + tr[i + 1:], first or (i, nb, lines, m)))
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
        i, b, ln, _ = mv
        placed, lines = placed + 1, lines + ln
        tray = tray[:i] + tray[i + 1:]
        if not tray:
            tray, trays = deal(gen, b, cat, cum, cfg), trays + 1
    return placed, lines, trays, used


def play_timed(seed, bot, cat, cum, cfg, biome, rescues=0):
    """One Rootline expedition in `biome`, the bot thinking bot_seconds per placement.
    Returns (seconds, cause, placements, rescues_used); cause is time, stuck or capped."""
    rl, bm = cfg["rootline"], cfg["biomes"][biome]
    rate, top = rl["drain"] * bm["drain"], rl["max_time"]
    mean, sd = rl["bot_seconds"][bot]
    share = bm["types"].get("ember", 0) / sum(bm["types"].values())
    gen, brng, trng = random.Random(seed), random.Random(seed ^ 0x5EED), random.Random(seed ^ 0x7173)
    b = e = placed = used = combo = miss = 0
    clock, left, started, cause = 0.0, top, False, "capped"
    tray = deal(gen, b, cat, cum, cfg)
    hot = [trng.random() < share for _ in tray]  # ember pieces
    while placed < CAP:
        mv = BOTS[bot](brng, b, tray, cat)
        end = None
        if mv is None:
            end = "stuck"
        else:
            think = max(0.5, trng.gauss(mean, sd))
            if started and think * rate >= left:  # the Rootline only drains after the first placement
                clock, left, end = clock + left / rate, 0, "time"
            else:
                clock, left = clock + think, left - think * rate * started
        if end:
            if used == rescues:
                cause = end
                break
            used += 1
            if end == "time":
                left = min(top, rl["rescue_time"])
            else:
                b = rescue(b, cfg["rescue_lines"])
                e &= b
                tray = deal(gen, b, cat, cum, cfg)
                hot = [trng.random() < share for _ in tray]
                left = max(left, rl["rescue_time"])
            continue
        i, m = mv[0], mv[3]
        b, e, started = b | m, e | (m if hot[i] else 0), True
        nb, n = clear(b)
        if n:
            broken = ember_break(b, e, b & ~nb)
            b, e = b & ~broken, e & ~broken
            combo, miss = combo + 1, 0
            left = min(top, left + rl["refill_per_line"] * n * (1 + rl["combo_bonus"] * (combo - 1)))
        elif combo:
            miss += 1
            if miss >= rl["combo_break"]:
                combo = miss = 0
        placed += 1
        tray, hot = tray[:i] + tray[i + 1:], hot[:i] + hot[i + 1:]
        if not tray:
            tray = deal(gen, b, cat, cum, cfg)
            hot = [trng.random() < share for _ in tray]
    return clock, cause, placed, used


_W = {}


def _init(cfg):
    _W.update(cfg=cfg, cats={k: catalog(cfg, k) for k in [None, *cfg.get("biomes", {})]})


def _job(args):
    seed, bot, rescues, biome = args
    cat, cum = _W["cats"][biome]
    if biome:
        return play_timed(seed, bot, cat, cum, _W["cfg"], biome, rescues)
    return play(seed, BOTS[bot], cat, cum, _W["cfg"], rescues)


def run(cfg, bot, games, seed=1, rescues=0, procs=None, biome=None):
    """Untimed games (placements), or timed expeditions in `biome`."""
    with Pool(procs, _init, (cfg,)) as pool:
        return pool.map(_job, [(seed + g, bot, rescues, biome) for g in range(games)], chunksize=50)


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


def timed_summary(results):
    secs = [r[0] for r in results]
    q = statistics.quantiles(secs, n=100, method="inclusive")
    ends = {c: sum(r[1] == c for r in results) / len(secs) for c in ("time", "stuck", "capped")}
    return {"games": len(secs), "p10": q[9], "p50": q[49], "p90": q[89], **ends,
            "placements": statistics.median(r[2] for r in results)}


def fmt_timed(name, s):
    mmss = lambda t: f"{int(t // 60)}:{int(t % 60):02d}"
    return (f"{name:<18} n={s['games']} expedition p10={mmss(s['p10'])} p50={mmss(s['p50'])} "
            f"p90={mmss(s['p90'])} | ends: time {s['time']:.0%} stuck {s['stuck']:.0%} "
            f"capped {s['capped']:.0%} | placements p50={s['placements']:.0f}")


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
    rt = cfg["rootline"]["target"]
    for biome in cfg["biomes"]:
        s = timed_summary(run(cfg, rt["bot"], games, seed, biome=biome))
        print(fmt_timed(f"{rt['bot']} @ {biome}", s))
        if biome == rt["biome"] and not rt["p50_s"][0] <= s["p50"] <= rt["p50_s"][1]:
            fails.append(f"timed {biome} p50 {s['p50']:.0f}s outside {rt['p50_s']}")
    print("BAND OK" if not fails else "BAND FAIL: " + "; ".join(fails))
    return not fails


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--games", type=int, default=10000)
    ap.add_argument("--bot", choices=BOTS, default="greedy")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--rescues", type=int, default=0)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--timed", action="store_true", help="Rootline expeditions in every mine")
    ap.add_argument("--config", type=Path, default=CFG_PATH)
    a = ap.parse_args()
    cfg = json.loads(a.config.read_text())
    if a.check:
        sys.exit(0 if check(cfg, a.games, a.seed) else 1)
    if a.timed:
        for biome in cfg["biomes"]:
            print(fmt_timed(f"{a.bot} @ {biome}", timed_summary(run(cfg, a.bot, a.games, a.seed, a.rescues, biome=biome))))
        return
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

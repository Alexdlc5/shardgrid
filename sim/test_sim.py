"""Self-check: python sim/test_sim.py"""
import inspect
import json

from sim import (BOTS, CFG_PATH, ROWS, COLS, catalog, clear, deal, ember_break, stone_break, isolated, load,
                 orientations, play, play_timed, rescue)

cfg = json.loads(CFG_PATH.read_text())
cat = load(cfg)
cum = [sum(p[1] for p in cat[:i + 1]) for i in range(len(cat))]

# shapes: orientation counts and in-bounds placements
assert len(orientations(["X"])) == 1
assert len(orientations(["XX"])) == 2
assert len(orientations(["X.", "X.", "XX"])) == 8  # L + J, 4 rotations each
assert len(orientations(["XX", "XX"])) == 1
assert all(m.bit_length() <= 64 for _, _, ms in cat for m in ms)
assert len(next(p for p in cat if p[0] == "line5.0")[2]) == 8 * 4  # 4 x-positions on 8 rows or cols

# clearing: a full row + full column crossing clears both, including the shared cell
b, n = clear(ROWS[2] | COLS[5])
assert (b, n) == (0, 2)
b, n = clear(ROWS[0] ^ 1)
assert n == 0 and b == ROWS[0] ^ 1

# isolated hole: cell (1,1) walled in
walls = (1 << 1) | (1 << 8) | (1 << 10) | (1 << 17)
assert isolated(walls) & (1 << 9)
assert isolated(0) == 0
assert isolated((ROWS[0] ^ 1) | 1 << 8) == 1  # corner (0,0): edges count as walls

# rescue clears the 3 fullest lines
assert rescue(ROWS[0] | ROWS[1] | ROWS[2], 3) == 0

# generator is ad-blind: its only inputs are rng, board, catalog, weights, config
assert list(inspect.signature(deal).parameters) == ["rng", "board", "cat", "cum", "cfg"]

# determinism: same seed, same game
for bot in BOTS.values():
    assert play(7, bot, cat, cum, cfg) == play(7, bot, cat, cum, cfg)

# a rescue never shortens a game
assert play(3, BOTS["greedy"], cat, cum, cfg, rescues=1)[0] >= play(3, BOTS["greedy"], cat, cum, cfg)[0]

# ember chain, same case as proto/check.mjs: row 0 all ember breaks (1,0),(1,1); ember (1,1) chains to (2,2)
b = ROWS[0] | 1 << 8 | 1 << 9 | 1 << 18 | 1 << 30
assert ember_break(b, ROWS[0] | 1 << 9, ROWS[0]) == ROWS[0] | 1 << 8 | 1 << 9 | 1 << 18
assert ember_break(b, 0, ROWS[0]) == ROWS[0]

# rubble stone, same case as proto/check.mjs: row 0 clears; stone (0,3) and (1,5) next to it crack, (2,5) doesn't;
# a second clear breaks both cracked stones
stone = 1 << 3 | 1 << 13 | 1 << 21
br, ck = stone_break(ROWS[0], stone, 0)
assert (br, ck) == (ROWS[0] & ~(1 << 3), 1 << 3 | 1 << 13)
br, ck = stone_break(ROWS[0], stone, ck)
assert (br, ck) == (ROWS[0] | 1 << 13, 0)
assert "rubble" in cfg["biomes"]["skywell"]["types"]
assert all("rubble" not in b["types"] for k, b in cfg["biomes"].items() if k != "skywell")

# timed: deterministic, ends on a known cause, a rescue never shortens an expedition
for biome in cfg["biomes"]:
    tc, tcum = catalog(cfg, biome)
    g = play_timed(5, "greedy", tc, tcum, cfg, biome)
    assert g == play_timed(5, "greedy", tc, tcum, cfg, biome) and g[1] in ("time", "stuck", "capped")
    assert play_timed(5, "greedy", tc, tcum, cfg, biome, rescues=1)[0] >= g[0]

print("ok")

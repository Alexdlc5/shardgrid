# Glimmerwood (working title; repo: shardgrid)

Original block-placement puzzle for Android and iOS. Unity + AppLovin MAX + RevenueCat + Firebase.

- [SPEC.md](SPEC.md): product, teardown, stack, monetization, compliance, milestones, setup checklists
- [teardown/](teardown/): competitor observation log (observable behavior only)
- [sim/](sim/): headless piece-generator simulator (Python stdlib). `python sim/test_sim.py`, then `python sim/sim.py --check`
  - `--timed`: Rootline expeditions in every mine (Mossy Hollow, Ember Roots): expedition length in minutes (p10/p50/p90) and the share ending on time vs. a stuck board. Combine with `--bot`, `--games`, `--rescues`.
  - `--check` also gates the timed mode: greedy-bot median expedition in Mossy Hollow must be 3–5 min (`rootline.target`).
  - [sim/generator.json](sim/generator.json) holds the shared tuning: `rootline` (timer constants plus the sim-only `bot_seconds` per placement, mean and s.d.) and `biomes` (drain, crystal types, extra shapes). The prototype reads both, so edit them there, not in `proto/index.html`.
- [DESIGN.md](DESIGN.md): Glimmerwood theme, story, progression, rival research
- [proto/](proto/): playable browser prototype. From the parent folder: `python -m http.server 8123 --directory shardgrid`, then open http://localhost:8123/proto/ (`?gold=5000` to try the market, `&debug` exposes `window.gw`). Self-check: `node proto/check.mjs`

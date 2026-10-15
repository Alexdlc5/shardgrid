# Glimmerwood (working title; repo: shardgrid)

Original block-placement puzzle for Android and iOS. Unity + AppLovin MAX + RevenueCat + Firebase.

- [SPEC.md](SPEC.md): product, teardown, stack, monetization, compliance, milestones, setup checklists
- [teardown/](teardown/): competitor observation log (observable behavior only)
- [sim/](sim/): headless piece-generator simulator (Python stdlib). `python sim/test_sim.py`, then `python sim/sim.py --check`
- [DESIGN.md](DESIGN.md): Glimmerwood theme, story, progression, rival research
- [proto/](proto/): playable browser prototype. From the parent folder: `python -m http.server 8123 --directory shardgrid`, then open http://localhost:8123/proto/ (`?gold=5000` to try the market, `&debug` exposes `window.gw`). Self-check: `node proto/check.mjs`

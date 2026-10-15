# Shardgrid (working title)

Original block-placement puzzle for Android and iOS. Unity + AppLovin MAX + RevenueCat + Firebase.

- [SPEC.md](SPEC.md): product, teardown, stack, monetization, compliance, milestones, setup checklists
- [teardown/](teardown/): competitor observation log (observable behavior only)
- [sim/](sim/): headless piece-generator simulator (Python stdlib). `python sim/test_sim.py`, then `python sim/sim.py --check`
- [proto/](proto/): playable browser prototype (same rules as the sim). From the parent folder: `python -m http.server 8123 --directory shardgrid`, then open http://localhost:8123/proto/. Self-check: `node proto/check.mjs`

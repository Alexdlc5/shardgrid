# Glimmerwood (working title; repo: shardgrid)

Original block-placement puzzle for Android and iOS. Unity + AppLovin MAX + RevenueCat + Firebase.

- [SPEC.md](SPEC.md): product, teardown, stack, monetization, compliance, milestones, setup checklists
- [teardown/](teardown/): competitor observation log (observable behavior only)
- [sim/](sim/): headless piece-generator simulator (Python stdlib). `python sim/test_sim.py`, then `python sim/sim.py --check`
  - `--timed`: Rootline expeditions in all six mines: expedition length in minutes (p10/p50/p90) and the share ending on time vs. a stuck board. Combine with `--bot`, `--games`, `--rescues`.
  - `--check` also gates the timed mode: greedy-bot median expedition in Mossy Hollow must be 3–5 min (`rootline.target`).
  - [sim/generator.json](sim/generator.json) holds the shared tuning: `rootline` (timer constants plus the sim-only `bot_seconds` per placement, mean and s.d.), `biomes` (each mine's drain, crystal types, extra shapes) and `crystals` (specials: ember chain, bloom seconds, freeze seconds). The prototype reads both, so edit them there, not in `proto/index.html`.
- [DESIGN.md](DESIGN.md): Glimmerwood theme, story, progression, rival research
- [proto/](proto/): playable browser prototype. From the parent folder: `python -m http.server 8123 --directory shardgrid`, then open http://localhost:8123/proto/ (`?gold=5000` to try the market, `&debug` exposes `window.gw`). Self-check: `node proto/check.mjs`
- **App (Capacitor):** `npm ci && npm run build && npx cap sync android` builds `www/` from `proto/` and syncs it into `android/`. CI ("android apk") produces an installable debug APK. Ads/IAP/analytics live in `proto/platform.js`.
- [docs/SETUP.md](docs/SETUP.md): the accounts and steps you set up, in order. [site/](site/): privacy policy, terms, app-ads.txt (not yet published).

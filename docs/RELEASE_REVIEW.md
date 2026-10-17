# Release review, 2026-10-17 (build 95)

A pre-release pass over the whole game as it stands on `main`: every screen rendered at 402×874 @3× with a stocked save
(`scripts/art-audit.mjs`), a scripted fresh-install walkthrough (title → prologue → camp → first dig → roots close →
rescue offer → haul → camp → Puddock's intro), the iPhone SE size, and a read of the gameplay, audio, ads, save and
first-run code paths in `proto/main.js`, `platform.js`, `music.js`, `story.js` and `sim/generator.json`.

**Verdict:** the game is in good shape. Art is consistent, the board is sharp in both engines, the end-of-dig flow reads
well, dealing is fair and asserted, ads are capped and honest, the save is mirrored. What's left is a short list of fine
details that work against the first minute, trust, or the daily habit. None is large. Fix the P1s, ship, then the P2s.

## P1: fix before the App Store build

| # | What | Why it matters | Where |
|---|---|---|---|
| 1 | **Dialogue buttons need two taps while a line is typing.** Next / Begin / Take the map first finish the typewriter, then a second tap advances. The button is dimmed meanwhile, so it reads as disabled. The prologue is 4 panels = 8 taps before play. | First impression and "first dig in under 30 s". Players tap a big yellow button and nothing happens. | `dialog()` in main.js: `next.onclick` returns `typing.finish()` when typing. The button should finish *and* advance; tapping the text to finish stays. |
| 2 | **The Daily Dig's day is UTC.** `today()` uses `toISOString()`. In the US the day turns at 5 pm (4 pm in winter): "Done for today. Come back tomorrow" is wrong, and a streak can reset for someone who plays every evening (10 am day N, then 6 pm day N+1 local = two UTC days apart). | The streak is the daily habit. Losing one unfairly is a one-star review. | `today()`, the `y` yesterday in `sell()`, the streak check in `renderHome()`. Use the local date; show a countdown to local midnight on the done state. Game Center's `daily_dig` board can keep its UTC reset. |
| 3 | **Puddock's double deal (rewarded ad) isn't labelled as an ad on the button.** The rescue button says "Watch a short ad" underneath; the ×2 button doesn't. | Honesty about rewarded ads is the top trust item in the player research and in App Review's eyes. | `showHaul()`: `$("sell2").textContent`. Same small line as `rescueGo`. |
| 4 | **The Rootline is never explained.** The vine frame is the timer, but no tip says so; the first cue is "+3.5 s" floating up after a clear. | New players don't know why the roots "closed in". The one mechanic that ends a dig deserves one line. | `drawHint()` / `TIPS` with `save.seen`: once, the first time the Rootline drops under ~50% in a timed dig: "The Rootline is closing in. Clear lines to grow it back." |
| 5 | **The canvas diagnostics toast ships to players.** Holding the Haul box 1.5 s shows `dpr · view · canvas …`. | Players will find it; it looks broken. The owner still needs it on TestFlight. | Keep it, but only after tapping the version line in Options five times (toggle, with a toast). |

## P2: polish that affects feel (do after the P1s, same release if time allows)

| # | What | Where |
|---|---|---|
| 6 | **No way to leave a dig.** A 3-minute dig can only end by the roots or the board; there's no pause or quit, and nothing to confirm one. | A tap on the Haul box: "Climb out now? You keep your haul." → Leave / Keep digging. Leaving goes straight to the haul (no rescue offer), titled "Dibble climbs out early". |
| 7 | **Pilfermoths can appear in the very first dig** (from placement 7, 12% a tray in Mossy Hollow). The tip explains them, but dig 1 already has to teach placing, clearing and the Rootline. | `dealTray()` / moth spawn: no moths while `save.best` is empty (the player's first dig only). |
| 8 | **The camp's lantern line is 15 black blobs on a new save** (0 Lantern upgrades = none lit). It reads as dead, not unlit. | `art.js` `camp()` lanterns: unlit glass in a dark warm amber with a faint tint, so they read as lanterns waiting to be lit. Lit ones unchanged. |
| 9 | **The Remove-ads card uses the play-button "ad" icon**, which says "watch a video". | `renderMarket()` IAP row: use the `lock` icon for Remove ads and `leaf` for "Ads removed". |
| 10 | `<title>Glimmerwood Prototype</title>`; `scripts/art-audit.mjs` never opens the coin purse (selector should be `#homeGoldPill`). | Hygiene. |
| 11 | Mines sheet on the SE: the second card's name is clipped mid-word ("Cinderroot Cave") at the sheet's edge. It's a horizontal scroller, so the cut card is the affordance, but a clipped word looks like a bug. | Fade the right edge of the row (a mask) instead of a hard clip. Small CSS. |

## Checked and fine (don't spend time here)

- Every screen at 3× in WebKit and Chromium: no errors, nothing off screen; SE fits. Board and tray edges 2 px (PR #49).
- End-of-dig flow: "The roots closed in!" with the root tendrils, then the rescue offer (once), then the ledger with New tags, best-haul banner and new-shelf line, then coin rain into the camp counter. Clear and well paced.
- First-run camp: the bobbing arrow on Go mining, then "Puddock's waving you over" + the Psst! bubble after the first haul. Good.
- Fair dealing: `deal(rng, board, cat, cfg)` is ad- and purchase-blind and asserted in check.mjs; mercy rerolls on crowded boards.
- Ads: interstitial only at haul exit, grace 3 digs, every 2nd dig, 90 s gap, PG-capped, 2× payout on close, banner only on camp and market with the vine above it. Rewarded ads optional. Remove ads kills both and restores.
- Audio: a tune per place (all 11 mines, camp, title, plus a playlist), tension layer when the Rootline is low, unlock on touch end, silent switch respected with an opt-in. Haptics through the native Taptic engine with an Options toggle.
- Save: localStorage mirrored to native Preferences, newest wins; the one-time reset tag is harmless on new installs.
- Reduced motion: idles, boil, grain, dust, pets and transitions all have a still path.
- Performance: 10-minute soak p95 frame work ~2 ms, heap flat (desktop). Device numbers still needed (below).
- Version line in Options, Restore purchases, Privacy policy, privacy manifest, Crashlytics with dSYMs.

## For the owner, on the device (nothing a session can do)

1. **Build 95 blur check:** a screenshot of a dig, then `python scripts/edge-width.py shot.png 160 215 2140` should read ≤ 2.
2. **Sound balance with headphones:** music vs taps, clears, coins, voice blips; nothing louder than the music.
3. **Haptics** on place, clear, combo, roots-closed; the Options toggle turns them off.
4. **Silent switch:** with it on silent and the option off, nothing plays; with the option on, it plays.
5. **Ads:** the banner only on camp and market; the interstitial after the 4th dig, then every 2nd, never sooner than 90 s; closing it rains 2× gold with the message; Puddock's double deal and the rescue both play a rewarded ad and pay out.
6. **Purchases (sandbox tester):** Remove ads hides the banner immediately and survives a relaunch; Restore brings it back on a reinstall; a coin pack pays once.
7. **Frame rate** on the board during a big clear (an older iPhone if you have one).
8. **Decisions:** (a) Should the Credits line and the App Store copyright say "Bright Glow Production" instead of your name? (b) Language options are built on branch `claude/i18n` with empty dictionaries; include in 1.0 or hold for 1.1?

## How the fixes are split

Three sessions in their own worktrees, so none edits the same functions. I merge them in this order and ship one build.

| Session | Items | Touches |
|---|---|---|
| A. First minute | 1, 4, 7 | `main.js`: `dialog()`, `drawHint()` + `TIPS`, moth spawn gate |
| B. Daily Dig clock | 2 | `main.js`: `today()`, `sell()` streak, `renderHome()` daily block; docs/SETUP.md note |
| C. Trust and hygiene | 3, 5, 6, 8, 9, 10, 11 | `main.js`: `showHaul()`, IAP row, diagnostics, HUD tap + leave flow; `art.js` lanterns; `index.html` title; `style.css` mines row; `scripts/art-audit.mjs` |

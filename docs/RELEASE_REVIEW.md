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

---

# Pass 2 (2026-10-17, later): visual art, UI, music and sound, game design

Reviewed on `main` (with #53–#55 merged) and on PR #52 (eight languages + the golden-hour haze), the owner's chosen look.
Same method: every screen at 3×, side by side main vs #52, plus `music.js`, `style.css` and the tuning in `main.js` /
`sim/generator.json` read in full. Everything below respects two owner decisions: **blocks stay vivid** and **the haze stays**.
**Every text change must land in all eight languages** (`proto/lang/*.json`, `node scripts/i18n.mjs check`).

## Visual art

| # | Finding | Fix |
|---|---|---|
| A1 | **The haze turns the night into sepia.** On #52 the title sky and the moon go flat brown-grey, Mossy Hollow's green backdrop reads as autumn, and the mines lose their palette identity (hollow green, frostpine blue-white, grotto violet). A golden-hour grade should warm the shadows and leave the highlights and sky cool; today it's one global tint. | `lofiGrade()` in main.js and `.haze.h1–h4` in style.css: keep roughly 40% of each mine's own hue (lower `desat`, tint toward the palette's own warm tone rather than one fixed orange), and leave the sky band and moon ungraded on the title and camp. The board frame and blocks are already excluded. |
| A2 | **Characters and pets are muted by the haze.** On the camp, Dibble, Puddock and the pets sit under the `.haze` layers, so the second thing the eye should land on (after the crystals) is dulled. | Put the characters above the haze: `#campPets` and the character groups get a higher z-index than `.haze` (59), or the haze is drawn under the camp stage. Lit lanterns and the fire too. |
| A3 | **The camp's "?" gem shelf is twelve flat black discs with question marks** inside a painted world (ART_STYLE §2: no flat tokens). | `camp()` gem cells: an unfound gem is a faint dusty silhouette of its cut (like the memory shelf's unfound ovals), no glyph. |
| A4 | Checked and fine: the painted-edge style is consistent everywhere, the unlit lanterns now read as lanterns, the Rootline vine, the board frame, the pets peeking from the frame corner, the title composition, the memory ovals. | — |

## UI

| # | Finding | Fix |
|---|---|---|
| U1 | **"Wardrobe" breaks mid-word in the market tabs** on #52, in English (`overflow-wrap: anywhere; hyphens: auto` was added for long languages; five tabs at 14px don't fit 360px). German and Portuguese labels are longer still. | `.tabs`: `white-space: nowrap`, the row scrolls horizontally with scroll-snap and a soft right-edge mask when it overflows, the active tab scrolled into view. No mid-word breaks in any language. |
| U2 | **The Remove-ads card is the first thing on every market tab**, above the tabs, even on Pets and Wardrobe. It makes the cosy shop feel like a storefront. | Move it to the end of the Tools tab (Restore purchases stays in Options). |
| U3 | Checked and fine: four type sizes on variables, with only the HUD and camp labels fixed; 44pt rows; press states on every button; the coin purse; Options; the mines sheet; the SE size. | — |

## Music and sound

| # | Finding | Fix |
|---|---|---|
| M1 | **The low end is tuned for headphones and vanishes on the iPhone speaker.** The Rootline-low heartbeat is a 58 Hz sine, the tick knock is 98 Hz, and the bass sits at root−24 (≈40–60 Hz). The phone speaker rolls off under ~200 Hz, so the one audio cue that says "you're about to lose" is inaudible without headphones. | `music.js`: give the heartbeat an audible body (116 Hz and 174 Hz partials plus a short click) and the tick knock a second partial; the bass gets a quiet octave-up sine. Headphones keep the sub. |
| M2 | **No dynamics.** Every melody pluck is velocity .11, so twenty tunes play like a music box on rails. | `schedule()`: accent the downbeat (×1.15), soften off-beats (×.85), ±8% random; the swing on odd slots stays. |
| M3 | **One arrangement for all twenty tunes** (pad every bar, bass on 1 and 5, shaker on 2, sparkle at the turnaround). Variety comes only from key, tempo and voice, so the playlist is samey. | A small per-track `arr` with two or three templates: shaker on or off, a walking bass on some, and on the music-box tracks a pad-chord arpeggio in the second half of each phrase. The crossfade bridge stays as is. |
| M4 | **The scene transitions are silent.** Digging down through earth and climbing out have no sound; the lantern iris has none. | `wipe()`: down = a low rumble fading into a dry earth hush (noise 300→120 Hz), up = rising air, iris = one soft tine. Under 1 s, through the sfx bus. |
| M5 | **Most UI taps are silent.** Sheets open and close, tabs and chips switch, options toggle, all with a press animation but no sound (`ui.tap` is used twice). The board and camp are rich; the menus are mute next to them. | One small layer: sheet open = air + a soft knock, close = the reverse, tab or chip = `sfx.tap`, option toggle = two tines (up for on, down for off). Through `show()`, the tabs' onclick and `optRow`. |
| M6 | Checked and fine: the crossfade bridge on shared pitches, a tune per place with fitting ambience, a voice per character, the clear and combo escalation, the sfx compressor under the music, the silent-switch handling. | — |

## Game design

| # | Finding | Decision |
|---|---|---|
| G1 | **Pacing is sound.** A new mine every ~3, 5, 10, 12, 12, 12, 15, 13 digs (map price ÷ mean haul); upgrades 1.6× a level with the last levels at 100–160k; treasures 3.5–30M against ~350k a day late on. The Rootline (60 s + 3.5 s a line) gives a 3-minute median dig in Hollow. Calm Grove at ×0.6 is a fair trade. | Leave it. |
| G2 | **The Daily Dig streak rewards nothing** (the research's #10): no milestones, no freeze. It's the retention lever this genre runs on. | 1.1, not 1.0: milestones at 3, 7, 14 and 30 days (gold, then a pet accessory) and one earned streak freeze a week. New text in eight languages and new art, so not a launch blocker. |
| G3 | Undo and a Classic mode (the research's #5 and #6) are the switch-over features. | 1.1. Launch with what's here. |

## Delegation (pass 2)

Three sessions, each in its own worktree, **branched from `claude/languages`** (PR #52) with the PR based on it, so the
haze and the language files are there. New or changed strings go into all eight `proto/lang/*.json` files and
`node scripts/i18n.mjs check` must pass.

| Session | Items | Touches |
|---|---|---|
| D. Art: haze refinement | A1, A2, A3 | `main.js` `lofiGrade()`, `style.css` `.haze`, `art.js` `camp()` shelf and layer order |
| E. UI: tabs and the shop | U1, U2 | `style.css` `.tabs`, `main.js` `renderMarket()` IAP row placement |
| F. Sound: speaker, dynamics, variety, UI | M1–M5 | `music.js`; hooks in `main.js` `wipe()`, `show()`, the tabs' onclick, `optRow` |

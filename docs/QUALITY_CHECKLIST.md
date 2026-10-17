# Glimmerwood quality checklist

*Drafted 2026-10-16 for the owner to review before any work starts.*

**How to review:** mark each item ✅ (do it), ✏️ (do it, with your note) or ❌ (skip). Items marked **[P1]** are what I'd fix
before launch; **[P2]** is polish that makes it feel premium; **[P3]** is nice to have. After you approve, the work is split
into parallel tracks (bottom of this file) and every item is checked the way its "Done when" line says.

## Standards that apply to every screen

These are the bar. Every track checks its screens against them.

| # | Standard | How it's checked |
|---|---|---|
| S1 | Readable text: nothing under **13px** on a phone, body text 15px or more, and good contrast on the dark forest | Measured in the browser at each phone size |
| S2 | Tap targets at least **44×44pt**, Apple's minimum; props in the camp included | Hit-box measurement |
| S3 | Nothing under the clock, the Dynamic Island, the home bar or the banner ad; nothing cut off at the sides | Overlap and safe-area check script |
| S4 | Works on three sizes: **iPhone SE (375×667)**, **iPhone 17 Pro (402×874)**, **Pro Max (440×956)** | Screenshot set per screen and size |
| S5 | One art style: hand-painted shapes from `paint.js`; no flat clip-art, stock icons, emoji or glossy gradients | Visual review against the reskinned characters |
| S6 | One type system: Fredoka at a few set sizes (title, heading, body, small), not 17 one-off sizes like today | CSS audit |
| S7 | Every tap answers within 100ms: press state, sound and haptic where it makes sense | Device playtest |
| S8 | No console errors; 60fps on the board; no frame hitches when sheets open | Browser profiler plus device |

## A. First launch and title

- [ ] **A1 [P1]** The splash screen hands off to the title with no blank or flash frame (the frozen-screen bug class). *Done when:* a cold start on the device goes splash → title in under 2s with nothing black in between.
- [ ] **A2 [P2]** The title has a little life: Dibble idles, the fireflies drift, and the logo has a subtle painted treatment, not plain text. *Done when:* the title is reviewed on the device.
- [ ] **A3 [P1]** The prologue (4 amber memories) reads clearly: text at 15px or more, a "Skip" always visible, and it never shows twice. *Done when:* the flow is checked on a fresh install.
- [ ] **A4 [P2]** The first session teaches by doing. After the prologue, the camp points at **Go mining**. The first dig shows a short hint (place a piece, clear a line, the Rootline timer), and after the haul, Puddock's "Psst!" leads to the market. *Done when:* a first-time run reaches the market without the player guessing.

## B. Camp (home screen); your main note

- [ ] **B1 [P1] Everything bigger.** Props are drawn about 1.3–1.5× larger, filling the screen width and the height between the top bar and the ad. Less empty sky (the moon and canopy stay as a frame). Dibble goes from about 40px to about 60px tall. *Done when:* on the 17 Pro the props fill at least 70% of the area between the top bar and the ad, and nothing touches the edges or the ad.
- [ ] **B2 [P1] Readable signs.** The camp sign text (Mines, Wardrobe, Puddock's, Daily Dig, Memories) is at least 13px on screen. Today it's about 8px, and the Daily Dig sub-line about 5.6px. *Done when:* measured.
- [ ] **B3 [P1] Every prop tappable at 44pt or more**, with a visible press reaction (a squash or glow) and a sound. *Done when:* hit boxes are measured and the device is tested.
- [ ] **B4 [P2] Layout rethink for depth.** A clear foreground, middle and back (stall and board in front; Dibble, fire and tent in the middle; shelf and lantern line behind). The Go mining signpost stays the obvious first tap. *Done when:* you approve a mock-up screenshot before it's built.
- [ ] **B5 [P2] Camp feels alive.** Dibble blinks and idles, the fire flickers, fireflies drift, the flag waves, and Puddock looks up when you're near the stall. Motion stays subtle, and none of it plays when the phone asks for reduced motion. *Done when:* reviewed on the device.
- [ ] **B6 [P2] The top bar** (coins, site name, settings) is sized to match: coin count 18px or more, the settings button 44pt. *Done when:* measured.
- [ ] **B7 [P2] Progress you can see.** The gem shelf, lanterns, sapling and stump growth are each understandable at a glance, for example a short tooltip the first time each one changes. *Done when:* reviewed.
- [ ] **B8 [P3]** A day and night tint that follows the device clock (warmer at dusk). *Done when:* reviewed.

## C. Sheets and menus (mines, daily, wardrobe, options, market)

- [ ] **C1 [P1]** One sheet style everywhere: the same header, close or back button placement, padding and scroll behaviour. *Done when:* every sheet is screenshotted side by side.
- [ ] **C2 [P1]** Text sizes follow S1 and S6. The mine cards, tags and notes are the main offenders today at 11–12.5px. *Done when:* measured.
- [ ] **C3 [P1]** Every button and chip is 44pt tall, with a press state. *Done when:* measured.
- [ ] **C4 [P2]** Remove the leftover icons on buttons that read as clutter: the pick on **Dig**, the lantern on **Amber Memories**, the calendar on the daily button. Keep icons only where they carry meaning, such as the market items. *Done when:* you approve the screenshots.
- [ ] **C5 [P2]** Market: clear price tags, an "owned" state, a locked state, and a short "why buy" line per item. The Remove ads card shows the real App Store price from RevenueCat. *Done when:* reviewed with a sandbox price.
- [ ] **C6 [P2]** Options: sound, music, haptics, colour-blind symbols, privacy choices, restore purchases, credits, version number. *Done when:* every control works on the device.
- [ ] **C7 [P3]** Sheet open and close animation: a short slide or fade, about 200ms, off with reduced motion.

## D. The board (core gameplay)

- [ ] **D1 [P1]** The board fills the width on every size (with margins) and the tray pieces are easy to grab: drag starts from anywhere on the piece, and the piece lifts above the finger. *Done when:* tested on SE and Pro Max.
- [ ] **D2 [P1]** The HUD (Haul, mine name, Rootline timer) is readable and never overlaps the board or its hint text. *Done when:* the overlap check passes at all three sizes.
- [ ] **D3 [P1]** Every clear feels good: a short crystal shatter, coin pop, sound and haptic, scaled to the size of the clear. Combos feel bigger. *Done when:* reviewed on the device.
- [ ] **D4 [P2]** Placement preview: a ghost of the piece, and the lines it would clear lit before you drop it. *Done when:* reviewed.
- [ ] **D5 [P2]** Each mine looks distinct (palette, background, chalk note) while sharing one style. *Done when:* a screenshot of each of the 11 mines is reviewed.
- [ ] **D6 [P2]** Special crystals (frost, ember, geode, heartstone, rubble, and so on) each have a clear look and a one-line explanation the first time you see them. *Done when:* reviewed.
- [ ] **D7 [P1]** Losing feels fair and readable: a clear "no room" or "roots closed in" moment, then the rescue offer (rewarded ad), then the haul. *Done when:* the flow is tested.

## E. End of dig (haul)

- [ ] **E1 [P1]** The haul screen tallies the gems one by one with a counting animation, then the total, then the Sell and Double (ad) buttons. Nothing is cut off on SE. *Done when:* tested.
- [ ] **E2 [P2]** New personal best and new gem types get a moment (a banner and a sparkle).
- [ ] **E3 [P1]** Coin rain lands on the camp coin counter, and the camp's state updates (shelf, stump). *Done when:* reviewed.

## F. Story and memories

- [ ] **F1 [P1]** Every story scene and dialogue fits each phone size, uses readable text, and has a clear Continue. *Done when:* every scene in `story.js` is checked by the script.
- [ ] **F2 [P2]** The Amber Memories viewer looks like a collection: a grid of found and unfound (silhouetted) memories, with a count per mine.
- [ ] **F3 [P2]** Characters (Dibble, Puddock, Granny Burr, the Pale Bidder) appear at a consistent size and framing across dialogues.

## G. Ads, purchases and trust

- [ ] **G1 [P1]** The banner never covers gameplay or buttons (it only shows in menus) and nothing sits under it. Interstitials keep to the pacing caps. *Done when:* tested on the device with test ads.
- [ ] **G2 [P1]** Remove ads: buying it hides banners and interstitials immediately, it survives a restart, and **Restore purchases** works. *Done when:* tested with a sandbox tester.
- [ ] **G3 [P1]** Rewarded ads are always optional and labelled honestly: what you get, and "watch an ad". *Done when:* reviewed.
- [ ] **G4 [P1]** Privacy: the consent form (GDPR/US) and the tracking prompt appear in the right order with friendly text, and the privacy policy is linked in Options. *Done when:* tested on a fresh install.

## H. Sound, haptics and feel

- [ ] **H1 [P2]** One cohesive sound set (soft, woody, crystalline): taps, place, clear, combo, coin, purchase, sheet open, story chime. No sound louder than the music. *Done when:* reviewed with headphones.
- [ ] **H2 [P2]** Haptics on place, clear and combo, respecting the Options toggle.
- [ ] **H3 [P3]** Music changes gently between camp, board and story.

## I. Art consistency audit (your 10-point list)

- [ ] **I1 [P1]** No stock-looking UI left: the remaining flat CSS elements (gradient buttons, plain rounded cards, CSS chips) get the painted treatment, such as wood planks, parchment and painted edges. *Done when:* a screen-by-screen review finds nothing that looks like a template.
- [ ] **I2 [P1]** Consistent line weight and edges: every asset uses the `shape()` darker-edge style; no black outlines, no mixed outline widths.
- [ ] **I3 [P2]** One light direction (cool from the top-left, warm from lanterns and fire) across the camp, board, mines and memories.
- [ ] **I4 [P2]** Glow and bloom kept for things that really glow (lanterns, crystals, the heart-shard), not as decoration everywhere.
- [ ] **I5 [P2]** Characters' proportions and eyes are consistent across sizes, with no warped shapes at small sizes.
- [ ] **I6 [P2]** Motion has weight: an ease-out on drops, a little squash on landing; no linear floaty movement.

## J. Performance and stability

- [ ] **J1 [P1]** No errors or crashes across a full session (title → 5 digs → market → story → memories). Crashlytics shows a clean session.
- [ ] **J2 [P1]** Steady 60fps on the board on an older iPhone (the SE is the benchmark); SVG filters and animations are trimmed where needed.
- [ ] **J3 [P1]** The save is never lost: kill the app mid-dig, then relaunch, and progress is sane.
- [ ] **J4 [P2]** Launch time under 2s to the title on device.

## K. Accessibility

- [ ] **K1 [P1]** Reduced motion turns off the camp idle, line boil, film grain and dust.
- [ ] **K2 [P2]** The colour-blind symbols option covers every crystal type.
- [ ] **K3 [P2]** VoiceOver labels on the main buttons (Play, Go mining, sheets, purchases).
- [ ] **K4 [P3]** The game respects the iPhone's bold text and larger text settings where possible.

## L. App Store presence (A12)

- [ ] **L1 [P1]** App icon checked at every size against the in-game art style.
- [ ] **L2 [P1]** 6.9" screenshots (1320×2868), 5 to 8 of them: the camp, a satisfying clear, the story, the market, the mines variety. Each has a short caption in the game's painted style.
- [ ] **L3 [P1]** Listing text: name "Glimmerwood", a subtitle, a description, keywords, support and privacy URLs.
- [ ] **L4 [P1]** App Privacy labels match the SDKs (AdMob, Firebase, RevenueCat).
- [ ] **L5 [P1]** Remove ads review screenshot uploaded; age-rating questionnaire done; review notes written.
- [ ] **L6 [P3]** A 15–30s App Preview video of a dig.

## M. Launch configuration

- [ ] **M1 [P1]** `testAds: false` for the App Store build only (TestFlight keeps test ads).
- [ ] **M2 [P1]** Version and build numbers set (1.0, build from CI); the CI sim gate and `check.mjs` pass.
- [ ] **M3 [P1]** Remote Config defaults match the app; Crashlytics dSYM upload set up so crash reports are readable.
- [ ] **M4 [P2]** A sandbox tester account added, for testing purchases without your real Apple ID.

## How the work gets split (after your approval)

Parallel agents, each in its own git worktree and branch, each owning separate files or sections so no two touch the same code.
I review every branch with screenshots at the three sizes, then merge them one at a time and ship a TestFlight build.

| Track | Items | Owns |
|---|---|---|
| 1. Camp | B1–B8, A4 (camp part) | `art.js` `camp()` and the hub props; camp CSS |
| 2. Sheets and type system | S6, C1–C7, E1–E2, F2 | `index.html` CSS and sheet markup |
| 3. Board and feel | D1–D7, E3, H1–H3, I6 | board drawing and input in `index.html`, `game.js`, `music.js` |
| 4. Story, characters and art audit | A2–A3, F1, F3, I1–I5 | `story.js`, characters and memory art in `art.js` / `paint.js` |
| 5. Trust and launch | G1–G4, J1–J4, K1–K4, M1–M4 | `platform.js`, the iOS project, CI |
| 6. App Store listing | L1–L6 | `docs/`, the screenshot renderer (after tracks 1–4 land) |

**My role:** keep the standards (S1–S8), resolve overlaps, run the overlap and safe-area checker plus the screenshot set on
every branch, and merge in order: 5 → 2 → 1 → 3 → 4 → 6.

## Release-readiness evidence (2026-10-17)

| Check | Result | How to rerun |
|---|---|---|
| Block edges at 3× (10–90% width) | Browsers 2 px board and tray (WebKit + Chromium). The owner's iPhone shot before the fix: 9 px, with HTML 1 px beside it, so iOS showed the canvas through a 1× layer. Fixed in PR #49; **confirm on build 95** | `node scripts/crisp.mjs`, then `python scripts/edge-width.py shot.png 160 215 2140` on a device screenshot |
| Every screen loads at 3× and on iPhone SE | 13 screens × WebKit + Chromium: no errors, no 404s, canvas at full density, nothing off screen sideways | `node scripts/smoke.mjs`, `node scripts/smoke.mjs --se` |
| Frame time and memory, 10 min of play | Frame work p95 1.9–2.2 ms (60 Hz budget 16.7, 120 Hz budget 8.3); worst frame ~60 ms at each new dig's cave paint, hidden by the transition; heap 3.5 → 4.0 MB, DOM flat; 1,648 placements, 69 digs, 0 errors (desktop Chromium) | `node scripts/soak.mjs --minutes 10` (CI job `soak`); **device: Instruments or TestFlight run** |
| App Review 2.1 | Test ads only in TestFlight builds (the `appstore` input turns them off); the prototype ad note is replaced in the app | — |
| App Review 3.1.1 | Remove ads and coin packs go through StoreKit (RevenueCat); Restore purchases is in Options | Sandbox buy + restore on device |
| App Review 4.1 | Original names, characters and art (checked 2026-10-15/16; trademark desk search in SETUP A13) | — |
| App Review 5.1.1 / 5.1.2 | No accounts; privacy policy in Options; tracking only after the ATT prompt | — |
| Privacy manifest vs labels | `ios/App/App/PrivacyInfo.xcprivacy` matches SETUP A12 | Xcode → Archive → Generate Privacy Report |
| Crash reporting | Crashlytics on; JS errors reported as non-fatals; dSYMs uploaded by the ios workflow (build 95: ok) | — |

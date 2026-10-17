# Winning players from Block Blast, Woodoku and friends: research brief and build spec

**For:** a Claude agent working on **Glimmerwood** (repo `Alexdlc5/shardgrid`, web game in `proto/`, Capacitor iOS app).
**From:** player-review research on Tetris-like block puzzles (Block Blast, Blockudoku, Woodoku, 1010!, Tetris mobile, and smaller clones), October 2026.
**Goal:** know what players hate about new block puzzles, why they stay with the app they already have, and which features make them switch. Then build the gaps into Glimmerwood without breaking what already works.

Read `docs/ART_STYLE.md` before any visual work and `docs/STORY.md` before any story or pet work. Commit as Alexdlc5 only (`git -c user.name=Alexdlc5 -c user.email=80286400+Alexdlc5@users.noreply.github.com`). Never paste App Store keys or secrets.

---

## 1. What players say, in short

How strong the evidence is: app-store reviews (via review aggregators), Metacritic user reviews, industry reports (Google 2022 puzzle report, Mistplay, Udonis, AppMagic) and a monetization teardown of Block Blast (Balancy). The reviews are anecdotal and the vendor reports are self-interested, but the same themes repeat across every source, which is the signal that matters.

### 1.1 The top complaints (roughly in order of how often they come up)

1. **Ads, by a wide margin.** In the Block Blast negative reviews about half the complaints are ads. The specific grievances:
   - Too often: after every round, or every minute.
   - Too long: 30 to 60+ seconds, sometimes unskippable.
   - **Mid-game ads**, including an ad appearing *while a piece is being placed*, which ruins a long run.
   - Ads that **ignore the phone's silent switch**.
   - Ad close buttons that are hard to hit.
   - Ads that open Safari or scam-like pages.
   - Inappropriate ad content, which pushes the age rating to **17+** and locks out kids and families.
   - **No way to pay to remove ads**, or worse, paid "remove ads" that doesn't stick.
   - A paid ad-removal that also took away the *optional* reward ads players liked.
2. **"The game is rigged."** The second most common theme everywhere (Block Blast, Blockudoku, small clones):
   - Players believe pieces get worse as their score rises.
   - Trays come with no piece that fits.
   - Players think the game is tuned to make them lose so they'll watch a revive ad.
   - Nobody has proven any of this, but the *perception* drives one-star reviews and uninstalls. Pure randomness reads as malice when there's an ad waiting at game over.
3. **Updates that change the core game.** Blockudoku players were furious about added gimmicks (bushes, gems, bubbles). They say it "took away the stress relief", they were forced onto the new version, and there's no way back to classic. Tetris players ask for a **classic toggle**. Players stay *for* the calm core loop, so anything that clutters it betrays them.
4. **Visual overload and eye strain.** Players complained about bright white and blue themes, screens "too busy with coloured shapes", headaches from effects, a look "like Candy Crush", and **no dark mode**.
5. **Lost progress.** High scores that don't save, progress wiped by an update, everything gone after a reinstall.
6. **Controls and interruptions.**
   - A piece gets **auto-placed when a system pop-up interrupts the drag** (low battery alert).
   - Freezes that drop a piece in the wrong spot.
   - Restart buttons that are too easy to hit by accident.
   - Poor touch detection and laggy drags.
   - A game that never sleeps and drains the battery.
7. **Misleading store ads.** Players install because of an ad showing a different game (Block Blast ads show a Tetris-style game) and quit when it isn't that. Mistplay: **37% churn quickly when gameplay doesn't match expectations**, and misleading ads are a named churn driver.
8. **Shallow long-term play.** "No leaderboard, no meaningful progression", and an adventure mode that's repetitive and rewards nothing. Balancy's teardown of Block Blast lists these gaps:
   - Win streaks with no milestone rewards.
   - Notification permission asked for but no reminders ever sent.
   - Adventure pictures that can't be kept, so nothing to collect.
9. **Missing features players ask for:** undo, piece rotation (as an option), difficulty choice, dark mode, an in-app way to report bugs, and a setting to hide social comparisons (a Blockudoku percentile pop-up drew complaints).

### 1.2 Why players stay on the app they have

- **Habit and muscle memory.** The genre is a daily ritual: 84% of puzzle players play mainly to relax, 54% to escape (Mistplay). A familiar app is part of the ritual. A new one must feel instantly familiar before it can feel better.
- **Sunk progress: high scores, streaks, adventure levels.** Streak research shows loss aversion grows with streak length: on day 90 the streak itself is the reason to show up. Switching resets all of it.
- **Fear that the new app is worse.** Players assume a new block puzzle will have *more* ads and be *more* rigged. 46% want a 3.5 to 4.0-star rating before they'll even install.
- **"Good enough" plus low trust in discovery.** 66% find games through reward apps and 34% through other players, not store browsing. They don't go looking. Something has to reach them.
- **Quitting happens for specific reasons, not out of boredom with the genre.** The top quit reasons for puzzle games are dull gameplay (45%), too many ads (43%) and bugs (40%) (Google 2022). People switch *away* from pain, which is the opening.

### 1.3 What makes them try something new (and stay)

- **Fixing their pain on day one, visibly.** Fair, capped, honest ads; a one-time "remove ads" that really works; no mid-game ads; a proof that the dealing is fair; undo; a calm classic mode; offline play; progress that can't be lost.
- **The familiar core, then depth.** Block Blast's growth came from adding a goal layer (adventure mode) to a pure core loop. Hybrid-casual puzzle was the only casual segment to grow in-app revenue in 2025 (+20%), on a light core loop plus meta progression (a home to decorate, a story, a collection). Block puzzle launches rose 89% year on year in H1 2026, so the field is crowded and a clear differentiator matters.
- **Rewarded loyalty.** 71% want rewards for staying loyal, 69% value daily streaks and bonuses, and 52% want events and challenges (Mistplay).
- **Ads that are tolerable *by design*.** Players prefer **one 30-second ad per ~10 minutes** over six 5-second ads (Udonis). Optional rewarded ads are liked when they're truly optional.
- **Honest marketing.** Trailers made of real gameplay, so expectations match.

---

## 2. Where Glimmerwood stands (checked in the code, October 2026)

Already strong. **Protect these. Don't regress them:**

| Player wish | Glimmerwood today |
|---|---|
| Fair dealing | `deal(rng, board, cat, cfg)` is ad-blind and purchase-blind, and `check.mjs` asserts the signature. A mercy reroll (`mercy_fill`, `mercy_rerolls`) tries to give a placeable tray on crowded boards. A "Fair dealing" note is shown in menus. |
| Remove ads that works | `no_ads` IAP ($4.99, RevenueCat) kills banners and interstitials immediately and is restorable. Rewarded offers stay, by choice. |
| No mid-game ads | Interstitials only at haul exit, with caps from Remote Config (grace 3 digs, every 2nd dig, 90s gap). Banner only on camp and market. |
| Calm mode | Calm Grove: no timer, ×0.6 gold. |
| Depth and meta | Camp to decorate, story (Amber Memories, 33), pets to collect and dress, Someday treasures, gem shelf, Daily Dig with streak, Game Center leaderboards. |
| Honest ads | The trailers (`scripts/ad`) are rendered from the real game. |
| Accessibility | Colour-blind symbols, haptics and sound toggles, reduced-motion support. |
| Save safety (partial) | The save is mirrored to native Preferences (survives a localStorage wipe, not a reinstall). |

**Gaps found:**

- No undo.
- No classic/pure mode without specials and Pilfermoths.
- No dark/soft visual option.
- No cloud save.
- No notifications.
- No share card.
- No in-app bug report.
- No ad content rating cap.
- `pointercancel` commits the dragged piece where it hovers.
- Audio now ignores the silent switch (`navigator.audioSession.type = "playback"` in `proto/music.js`), which players dislike when *ads* do it.

---

## 3. Build spec, by priority

Each item lists what to build, where, and how to know it's done. Keep each item a small, separate PR. Run `node proto/check.mjs`, `python sim/test_sim.py` and the module syntax check, and verify at 375×667, 402×874 and 440×956 with the safe-area test page (`www/sa-test.html`, 59/34 px insets, `--ad:62px`). Use `scripts/art-audit.mjs` for visual checks.

### P0: trust killers (fix first; each is small)

1. **Interrupted drags never place a piece.**
   - Where: `proto/index.html`, `cv.addEventListener("pointercancel", drop)`.
   - Change: on `pointercancel`, on `visibilitychange` to hidden, and on `blur`, return the dragged piece to the tray (the `back[...]` path with `sfx.drop()`). Never call `commit`.
   - Done when: a simulated `pointercancel` mid-drag leaves the board unchanged and the piece back in its slot.
2. **Respect the silent switch by default.**
   - Make the "playback" audio session an option ("Play sound when the phone is on silent", default **off**). With it off, don't set `navigator.audioSession.type` (or set `"ambient"`).
   - Ads must never be louder than the game: if the AdMob plugin supports it, start ads muted, or follow the game's sound toggle.
   - Done when: with the switch on silent and the option off, nothing plays.
3. **Cap ad content to keep a family-friendly rating.**
   - Set AdMob's request configuration to `maxAdContentRating: "PG"` (or "G") in `proto/platform.js` init, and block sensitive categories where the plugin allows.
   - Document it in `docs/SETUP.md`.
   - Done when: the request config is set in code and the App Store age rating stays at 4+ or 9+ (not 17+).
4. **Accidental-reset guard.**
   - Any action that abandons a dig (Main menu, Give up) during play asks for confirmation.
   - Done when: you can't lose a run with one stray tap.

### P1: the switch-over features (these are why someone tries Glimmerwood)

5. **Undo.**
   - One free undo per dig, plus more by optional rewarded ad (the Balancy teardown suggests rewarded undo).
   - It must restore the board, the tray, haul and gold deltas, the combo and the Rootline time. It must never re-roll the tray, so dealing stays fair and deterministic.
   - Add it as a tray-side button that's disabled when empty.
   - Done when: undo, then the same move, gives the identical state; check.mjs gets an `undo ok` case.
6. **Classic mode (the "pure" board).**
   - A third mode next to Expedition and Calm Grove: 8×8, no specials, no Pilfermoths, no timer, endless, with its own best score and Game Center board (`classic_best`). Same fair `deal()`.
   - This is the answer to the Blockudoku complaint that new gimmicks ruin the stress relief. It's the familiar app inside Glimmerwood, and it's what a switcher plays first.
   - Done when: Classic is reachable from the mines sheet in one tap and plays exactly like 1010!/Block Blast classic.
7. **Show that the dealing is fair, so the "rigged" perception can't stick.**
   - A "How dealing works" page in Options, in plain words:
     - Crystals are random, with the odds per mine.
     - They're never changed by score, ads or purchases.
     - On a crowded board the game rerolls to try to give a piece that fits (mercy).
   - At game over, if no piece fit, show a short honest line ("No room for these three") and the **mercy reroll count** used this dig.
   - Optional: show the tray's seed in Daily Dig so players can compare runs. The daily is already the same for everyone.
   - Done when: the page exists, is linked from the end screen, and its words match `sim/generator.json` (`mercy_fill`, `mercy_rerolls`).
8. **Progress that can't be lost.**
   - Back up the save to **iCloud key-value storage** (native plugin; `NSUbiquitousKeyValueStore` is enough for a 100 KB JSON) alongside the Preferences mirror. On launch, the newest of the three copies wins (extend `restoreSave` in `proto/platform.js`).
   - Add "Restore from iCloud" in Options.
   - Done when: delete the app, reinstall, and gold, camp, pets and memories return. `scripts/check-save-mirror.mjs` gets a cloud case.
9. **Soft colours and dark option.**
   - An Options toggle that lowers saturation and brightness of board effects (`vivid()` factor, bloom alpha, screen glow) and the white of UI cards. It's for players who get eye strain.
   - The default stays jewel-bright (the owner wants vibrant).
   - Done when: toggling it is visible in a 3x render, and colour-blind symbols still work with it.
10. **Streaks that reward, and forgive.**
    - Daily Dig streak milestones (3, 7, 14, 30 days) give small, visible rewards: gold, a pet accessory, a camp item.
    - One **streak freeze** per week, earned by playing, so one missed day doesn't erase a 40-day streak.
    - Done when: the milestones show on the Daily Dig board, and a missed day with a freeze keeps the streak.
11. **Gentle reminders (opt-in).**
    - Local notifications (`@capacitor/local-notifications`), asked for only after the player's 3rd day, never at first launch:
      - "Today's Daily Dig is ready" at the player's usual time.
      - "Your N-day streak ends tonight" once, in the evening.
    - Max 1 per day. An off switch in Options.
    - Done when: a test build schedules exactly one notification and turning it off cancels it.

### P2: growth and polish

12. **Share card for the Daily Dig.**
    - After a daily, "Share" makes a small image or text card: mine, score, streak, an emoji grid of the cleared veins, and an App Store link. It uses the native share sheet (`@capacitor/share`).
    - 34% of puzzle players discover games through other players, so this is the cheapest marketing there is.
13. **A first dig in under 30 seconds.**
    - Measure the time from cold launch to the first placed crystal on a new install. The prologue is skippable; make sure "Skip" is obvious and the first dig doesn't wait on dialogue.
    - Track `first_place` with the elapsed time (Firebase).
14. **In-app feedback.**
    - "Report a problem" in Options opens a mail composer to the support address with the app version, device and the last error (Crashlytics already records JS errors).
15. **Battery and idle.**
    - Pause the render loop after 60 s with no input on camp and menus. Drop to 30 fps when iOS Low Power Mode is on, if detectable, or offer it as an option.
16. **Option to hide comparisons.**
    - If any "you beat X% of players" text is ever added, it gets an off switch from day one.
17. **Rotation option (experimental, off by default).**
    - Players ask for it, but it changes the puzzle. Ship it as a Calm/Classic-only toggle and watch the data before going further.

### Do not do

- Don't add mid-dig interstitials, ever, or ads after the first 3 digs of a new player (the grace period exists for a reason).
- Don't make "remove ads" also remove optional rewards.
- Don't change the core placement rules in Expedition without a "Classic" fallback. Players punish forced changes to the core loop.
- Don't tie any dealing, piece odds or difficulty to score, ads, purchases or how close the player is to a best. That's the "rigged" perception made true. Keep `deal()`'s signature asserted.
- Don't use store ads or trailers that show anything not in the game.
- Don't add energy or lives systems. Unlimited play is part of why this genre works.

---

## 4. Measure it

Add these Firebase events (helper: `track` in `proto/platform.js`) and watch them for two weeks after each release.

| Event | Fires when | Healthy sign |
|---|---|---|
| `first_place` | First crystal placed by a new install (with seconds since launch) | median under 30 s |
| `undo_used` | Each undo (free or rewarded) | used in 20 to 50% of digs: it's helping, not a crutch |
| `mode_start` | A dig starts (with mode: expedition/calm/classic/daily) | Classic gets real use from new players in their first week |
| `fair_page_open` | The fairness page is opened | spikes after losses, not a problem in itself |
| `streak_freeze_used` | A freeze saves a streak | D30 of players who used a freeze beats those who never needed one |
| `share_daily` | The share card is shared | any non-zero rate is new reach |
| `ad_double` (exists) | The forced ad paid 2× | watch it doesn't raise uninstalls the same day |

Targets for the genre (Mistplay; vendor data, so use it as a rough bar): puzzle D30 about 6.7% on iOS. Aim above it. App Store rating ≥ 4.5: below about 4.0, new players won't install.

---

## 5. Sources

- [Block Blast user reviews, Metacritic](https://www.metacritic.com/game/block-blast/user-reviews/)
- [Block Blast negative reviews, appsupports.co](https://appsupports.co/1617391485/block-blast/negative-reviews)
- [Blockudoku negative reviews, appsupports.co](https://appsupports.co/1452227871/blockudoku-block-puzzle-game/negative-reviews)
- [Blockudoku App Store listing and developer replies](https://apps.apple.com/us/app/blockudoku-block-puzzle-game/id1452227871)
- [Block Blast reviews aggregate, justuseapp](https://justuseapp.com/en/app/1617391485/block-blast-block-puzzle-games/reviews)
- [How could Block Blast earn more? Monetization and gameplay deconstruction, Balancy](https://balancy.co/blog/2025/03/26/how-could-block-blast-by-hungry-studio-earn-more-monetization-and-gameplay-deconstruction/)
- [Block Blast cracks 40 million daily players, Pocket Gamer](https://www.pocketgamer.com/block-blast/40m-players/)
- [Block Blast statistics, Udonis](https://www.blog.udonis.co/statistics/block-blast)
- [Puzzle game trends and player behaviour, Mistplay](https://business.mistplay.com/resources/puzzle-game-trends)
- [Puzzle Games Report: players, monetization and advertising, Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/puzzle-games-report)
- [Google: puzzle games on mobile devices, 2022 (GameDev Reports)](https://gamedevreports.substack.com/p/google-puzzle-games-on-mobile-devices)
- [The best block puzzle games in 2026 (top-100 ad and offline survey), ONI Games](https://onirealms.com/guides/best-block-puzzle-games/)
- [Best Block Blast alternatives 2026, PlayBrain](https://playbrain.games/blog/best-block-blast-alternatives-free-online)
- [Casual games trends in 2026, Cinevva](https://app.cinevva.com/guides/casual-games-trends-2026)
- [Mobile casual games in H1 2026 (AppMagic), GameDev Reports](https://gamedevreports.substack.com/p/appmagic-mobile-casual-games-in-h1)
- [Puzzle games rise in 2026, PocketGamer.biz](https://www.pocketgamer.biz/puzzle-games-rise-as-mobile-genres-compete-for-attention-in-2026/)
- [Why daily puzzle streaks are so addictive, greatest.games](https://greatest.games/blog/daily-puzzle-streak)
- [Tetris (EA) history and shutdown, Wikipedia](https://en.wikipedia.org/wiki/Tetris_(Electronic_Arts))
- [Tetris app review, Common Sense Media](https://www.commonsensemedia.org/app-reviews/tetris-0)

Caveats: review-aggregator pages and vendor reports (Mistplay, Udonis, Balancy, ONI Games) are self-interested or anecdotal. Use the numbers as direction, not as precise benchmarks. No Reddit threads came up in search, so community sentiment comes mainly from store reviews.

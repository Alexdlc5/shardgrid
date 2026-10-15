# Shardgrid: Project Spec

*Working title. Original block-placement puzzle for Android and iOS, ad- and IAP-monetized.*
*Spec date: 2026-10-15. Author: Claude (for Alexdlc5).*

> **How to read this.** Every claim about the competitor carries a source tag. **[ASL]** = Apple App Store listing, **[EXO]** = Exodus Privacy static-analysis report, **[UNVERIFIED]** = not yet observed by us, and the teardown in §2 must confirm it before we rely on it. Platform rules cite the platform's own docs. The thresholds in §8 are decision rules we chose, **not** facts. Each milestone is "done" only on the outside evidence named in its row.

---

## 0. Deviations from the brief (read first)

1. **I could not access the Reddit decompile video.** Reddit is blocked to both my web fetcher and the in-app browser. So nothing in this spec comes from it. If you watch it, write any concrete claims into `teardown/leads.md` as **[LEAD]**, and the teardown protocol (§2) tests them against real play. Even if the video shows code, we use it only to form hypotheses, never as a source to copy.
2. **I dropped Unity IAP. RevenueCat's own Unity SDK (`purchases-unity`) is the only purchase SDK.** Both SDKs bundle Google's `com.android.billingclient`, and running them together needs manual dependency surgery plus calling `SyncPurchases()` after every purchase ([Unity IAP docs](https://docs.unity.com/en-us/iap/ai-skill-features); [RevenueCat, "own IAP code"](https://www.revenuecat.com/docs/migrating-to-revenuecat/sdk-or-not/finishing-transactions)). RevenueCat alone already does StoreKit 2 and Play Billing purchases and validates every receipt on its server. Using one SDK removes the conflict entirely.
3. **The slowest setup step is on Google's side, not Apple's.** A *personal* Play developer account created after Nov 2023 must run a closed test with **≥12 testers opted in for 14 continuous days** before it can publish to production ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465)). **Decision (2026-10-15): personal accounts.** The gray-box prototype (M2) ships *as* that closed test, and your 15–20 testers are also our playtesters.
   **Update (2026-10-15): testers skipped for now.** M2 feedback comes from you playing a browser prototype (`proto/`, same rules and `generator.json` as the sim) on your PC. The Unity port starts once you sign off on the feel. The 12-tester × 14-day closed test is still required before the first *production* release, so it moves to just before M4.
4. **The competitor sells subscriptions, not one-time purchases.** Its iOS IAP list shows 1 week $4.99, 1 month $9.99 and 1 year $49.99 **[ASL]**. We still start with a one-time "Remove Ads" purchase (§4) and test a subscription later, because a subscription at launch is harder to get through review and harder to explain to players.
5. **Costs nothing to start, except Google's $25.** The Play Console fee is a one-time $25 and can't be avoided. Everything else is free until the game earns:

| Item | Cost | How it stays free |
|---|---|---|
| Google Play Console | **$25 once** | Unavoidable |
| Apple Developer | $99/yr, **deferred** | M2 runs Android-only. Pay only after M2's fun gate passes, then start iOS in M3. |
| Unity 6 Personal | $0 | Free under $200k revenue |
| Firebase (Spark plan) | $0 | Analytics, Remote Config and Crashlytics are free; we use no paid Firebase products |
| AppLovin MAX, AdMob, Unity Ads | $0 | Ad networks pay us |
| RevenueCat | $0 | Free up to $2.5k monthly tracked revenue |
| GitHub private repo + Actions | $0 | 2,000 Linux minutes/month free. The sim gate uses ~1–2 min. iOS builds on macOS count 10×, so they wait for M3 and run only on release tags. |
| Website, privacy policy, `app-ads.txt` | $0 | GitHub Pages at `alexdlc5.github.io`. If AdMob won't verify `app-ads.txt` on a github.io subdomain, buy a ~$10/yr domain **once ad revenue exists**. Test ads don't need it. |
| Art, audio, fonts | $0 | Procedural shard art (shapes + shaders, no textures to buy), CC0 sound effects (e.g. Kenney), SIL OFL fonts |
| Soft-launch installs | $0 | Organic: Play **open testing** track, devlog posts, your testers' friends. First ad revenue funds any paid installs later (§8 M5). |
| Test devices | $0 | Your own Android phone. An iPhone is needed only from M3. |

7. **Decision (2026-10-15): the app is the web game wrapped with Capacitor, not a Unity rewrite.** The prototype grew into the full game (Glimmerwood, see DESIGN.md), so rewriting it in C# would cost weeks for no player-visible gain. Ads move from AppLovin MAX to **AdMob with mediation** (AppLovin and Unity Ads can join as AdMob mediation partners; MAX has no supported Capacitor SDK). RevenueCat and Firebase stay, through their Capacitor plugins. Builds run in GitHub Actions, so no local Android Studio or Mac is needed. Your setup steps: `docs/SETUP.md`. Where §3, §5 and §9 below say Unity / MAX / fastlane, read Capacitor / AdMob / GitHub Actions.
6. **The piece generator is ad-blind, by construction.** Ads should feel voluntary *because the offer is worth it*, never because the game secretly got harder. `deal()` receives only the board and its own RNG; no ad, IAP or rescue state can reach it, and a self-check asserts its signature. Rigging deals to push ads would break Play's Deceptive Behavior policy, and players notice and churn.

---

## 1. Product

**Core loop (one round):** You are dealt a tray of **3 pieces** → you drag each onto an **8×8 grid** → full rows or columns clear, and clearing several at once or in consecutive turns builds combos → when the tray is empty, 3 new pieces are dealt → **game over** when none of the remaining tray pieces fits anywhere.

- 8×8 grid, row/column clearing and combos: **[ASL]** (the description says "8x8 block puzzle... clear rows and columns... combos").
- 3-piece tray: **[UNVERIFIED]** (genre convention; teardown T1 confirms it).
- Other modes the competitor ships: daily puzzle, endless high score, "Adventure" levels with jigsaw art, offline play, Game Center **[ASL]**. **We ship endless mode + a seeded Daily Puzzle** (see §1b). Adventure/levels wait until M5 passes.

**What makes ours distinct, legally and visually.** Game mechanics are not copyrightable, but *expression* is. In *Tetris Holding v. Xio Interactive* (D.N.J. 2012, 863 F. Supp. 2d 394), Xio lost on both **copyright** (it copied the game's overall look and feel, its audiovisual expression) and **trade dress** (the court called brightly colored pieces made of delineated blocks and the specific playfield proportions arbitrary, non-functional flourishes) ([Loeb & Loeb summary](https://www.loeb.com/en/insights/publications/2012/06/tetris-holding-llc-v-xio-interactive-inc)). Apple **4.1** rejects apps that "copy the latest popular app" or make minor changes to another app's name or UI, and since Nov 2025, **4.1(c)** also bars using another developer's icon, brand or name ([Apple 4.1 help](https://developer.apple.com/help/app-review/guideline-reference/4-1-prevent-copycat-rejection); [9to5Mac](https://9to5mac.com/2025/11/13/apple-tightens-app-review-guidelines-to-crack-down-on-copycat-apps/)). Google Play's **Deceptive Behavior / Impersonation** policy bans apps that mimic another app or imply a connection to it through name, icon or design ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/9887877)).

So we commit to the following, and **anyone who reviews the art checks every row**:

| Element | Ours | Rule |
|---|---|---|
| Name and icon | "Shardgrid" (working title). No "block", "blast", or anything that sounds like them. The icon is not a cluster of colored squares. | Apple 4.1(c); Play impersonation |
| Piece rendering | Pieces are **one fused shape with no internal grid lines** ("shards" with a beveled-glass or paper-cut look), not delineated beveled cubes. | The trade-dress element at issue in Xio |
| Palette | One limited per-theme palette (e.g. ink and paper). No rainbow piece-per-color scheme. | Xio look and feel |
| Board | Textured board with a visible theme. Clear effect is a "crack and shatter", not a flash-and-vanish. | Xio audiovisual expression |
| Audio, UI layout, fonts | All original or properly licensed. **No asset, string or code from the competitor's app package, ever.** | Copyright |
| Store listing | Never mentions the competitor. Screenshots show only our own art. | Play Deceptive Behavior |

**Before M4**, a person who is not on the team looks at our store page and the competitor's side by side and says whether they could confuse them. Their answer is the evidence. If they say yes, we change the art.

### 1b. Feel, slow progression and reasons to come back

**Moment-to-moment feel (the "satisfying" part).** Every one of these ships in M2, because M2 tests whether the game is fun:

- **Drag preview:** while you drag a piece, the cells it would fill show as a ghost, and **any lines it would complete glow**. You see the payoff before you commit.
- **Snap + haptic:** a short haptic tick on placement, and a stronger one on a clear.
- **Shatter clears:** cleared lines crack and burst into shards that fly off the board. Lines cleared at once break in a sweep, not all at the same instant.
- **Combo escalation:** consecutive clearing placements raise a combo counter; each step raises the pitch of the clear sound and intensifies the shatter. Breaking the chain plays a soft "cooldown" tone, not a fail sound.
- **Score count-up** and a "near personal best" pulse when you get within 10% of your best.
- **Calm game over:** the board dims slowly, the score counts up, and the rescue offer appears (§4). No harsh fail screen.

**Slow progression (no economy to balance, cosmetic only).**

| System | Rule | Why |
|---|---|---|
| **Player level (XP)** | XP = **lines cleared** (not score, so combos and rescues don't inflate it). XP to the next level = `40 + 25 × level`. | The sim's greedy bot clears ~52 lines per game. That pace gives level 2 in round 1, about level 5 in the first session, and about level 30 after ~240 rounds, so a level-up keeps arriving but slows down. Retune the curve from live `round_end` lines in M5. |
| **Unlocks per level** | Every level unlocks one cosmetic: shard material (glass → paper → slate → copper → gold…), board theme, clear effect or music track. Milestone levels (10, 20, 30…) unlock a full theme. | Visible, steady reward with nothing to balance. |
| **Shard Album** | Unlocks are grouped into themed sets; completing a set earns a board frame. | Gives the slow grind a visible collection goal. |
| **Personal records** | Best score, best combo, most lines in a round, daily-best history graph. | Mastery feedback at no build cost |

**Reasons to come back (no server needed).**

| Mechanic | How it works | Cost to build |
|---|---|---|
| **Daily Puzzle** | Seed = today's date, so every player gets the same trays. One free attempt per day. | The generator is already seeded; free |
| **Daily leaderboard** | Daily Puzzle scores post to **Google Play Games / Game Center** leaderboards. | Free platform services, no backend |
| **Streak** | Consecutive days with a Daily Puzzle played. One free **streak freeze** per week. | Local save |
| **Rested XP** | The first round each day earns **2× XP**, growing to 3× if you've been away 2+ days (cap). Being away is rewarded, never punished. | One timestamp |
| **Weekly theme** | Each week one locked cosmetic is free to *try* for the week (set via Remote Config, no new build). | Remote Config |
| **Local notifications** | Opt-in, asked **after** the first Daily Puzzle, not at launch. Max 1/day, at the player's usual play time ("Today's puzzle is ready"). They stop after 3 ignored in a row. | Local only; Android 13+ needs the `POST_NOTIFICATIONS` prompt |

M2 ships the feel list only. Progression and return mechanics ship in M3, because their payoff (D1/D7) is measured in M5.

---

## 2. Competitor teardown (primary sources only)

### 2a. Already collected

| Fact | Source |
|---|---|
| Developer: Hungry Studio (seller ARETIS LIMITED). Rated 4.9 from ~2.8M ratings. 205.9 MB. iOS 15+. Version 7.5.2 current. | [ASL](https://apps.apple.com/us/app/block-blast/id1617391485), read 2026-10-15 |
| Age rating **13+**, with descriptors "Infrequent Simulated Gambling", "Infrequent Sexual Content or Nudity" (very likely from the ads it serves) and "Contains Advertising". | ASL |
| IAP: weekly $4.99 / monthly $9.99 / yearly $49.99 subscriptions. | ASL |
| Privacy label: *Data used to track you* = Identifiers, Usage Data. *Linked to you* = Device ID, Advertising Data, User ID, Product Interaction, Crash, Performance and other diagnostics. | ASL |
| Android package `com.block.juggle`, v5.2.5 (Aug 2024): **23 tracker signatures**, including **AppLovin, Unity Ads, AdMob, Fyber, Mintegral, Pangle, Facebook Ads, AppsFlyer, Firebase Analytics, Bugsnag, ThinkingData** and Facebook Login/Analytics. 15 permissions, including the advertising ID. | [EXO 488935](https://reports.exodus-privacy.eu.org/en/reports/488935) |
| Earlier v3.4.7 (Oct 2023): 19 trackers, which included Vungle and Chartboost. So the ad stack changes over time. | [EXO 391110](https://reports.exodus-privacy.eu.org/en/reports/391110) |

**What this tells us:** the competitor runs **AppLovin MAX-style mediation** across 6+ ad networks with an attribution SDK (AppsFlyer), and its revenue comes mostly from ads, topped up with subscriptions. That matches our stack choice. Exodus only finds code signatures in the app package; it does not prove a network is actually active. The Exodus "latest" page returned junk when fetched, so **re-check for a 2025–26 report in T0**.

### 2b. Teardown protocol (you play, a spreadsheet records; about 3 hours total)

Fresh install on a test Android phone, offline first, then online. Record every row in `teardown/log.csv`. Claude creates this file with the columns below in M0.

| ID | Measure | How | Feeds |
|---|---|---|---|
| T0 | Current SDK list | Check Exodus and AppBrain for the newest version of `com.block.juggle` | §5 network list |
| T1 | **Piece distribution** | Screen-record **30 rounds**. Log every tray (3 piece IDs) from a shape catalog we define after round 1. Target sample is ≥600 pieces. | §6 generator weights |
| T2 | **"Mercy" dealing** | For each tray, log whether ≥1 piece fit when it was dealt, and how full the board was. Does the game deal easier pieces when the board is nearly full? | §6 dynamic difficulty |
| T3 | **Game length** | Placements per round and seconds per round, for all 30 rounds | §6 target band |
| T4 | **Interstitial triggers** | For every full-screen ad: what triggered it (game over, restart, menu), seconds since the last ad, rounds since the last ad, and seconds since app launch | §4 caps |
| T5 | **Rewarded offers** | Where the "watch an ad" button appears, what it grants, and how often | §4 |
| T6 | **Ad-free check** | Turn on airplane mode: does the game still run, and where do the ad slots go silent? | Offline design |
| T7 | Consent and ATT order (iOS) | Screenshot each prompt on first launch, from an EU VPN or an EU App Store account if possible | §7 |

Use the T1–T5 numbers **as calibration, never as a spec to clone**. Our weights and caps are derived from them and then changed on purpose (§6).

---

## 3. Stack

| Layer | Choice | Notes |
|---|---|---|
| Engine | **Unity 6 LTS** (Personal license, free under $200k revenue) | Every ad and IAP SDK supports Unity first. |
| Ads | **AppLovin MAX** mediation with **AdMob** and **Unity Ads** adapters at first. Add Mintegral and Pangle in M5 if fill or eCPM is weak. | MAX ≥12 runs Google UMP for us ([AppLovin docs](https://developers.applovin.com/en/max/unity/overview/terms-and-privacy-policy-flow)) |
| IAP | **RevenueCat `purchases-unity`** (StoreKit 2 on iOS, Play Billing **8+** on Android) | Play has required Billing Library ≥8 since Aug 31 2026, extendable to Nov 1 2026 ([Android dev](https://developer.android.com/google/play/billing/deprecation-faq)). Pin a RevenueCat SDK version that bundles BL8+. |
| Analytics, tuning, crashes | **Firebase** Analytics, Remote Config, Crashlytics | Remote Config holds every ad cap and generator weight (§4, §6). |
| Build and release | **fastlane** + **GitHub Actions**. Android builds on `ubuntu-latest`. iOS builds on **`macos-latest`**, because you are on Windows and Xcode needs a Mac. Signing via `fastlane match` in a private certs repo. | Uploads go to TestFlight and the Play internal/closed track. |
| Simulator | **Python 3** (stdlib only), with the board logic duplicated in C# and both checked against the same golden test vectors | Python is fast to iterate on. The golden vectors keep the C# and Python versions in sync. |

### Analytics events

Every event carries `session_id`, `round_id` (if in a round), `build`, `remote_config_version`, and `ab_group`. Names use Firebase snake_case, max 40 characters.

| Event | Params | Answers |
|---|---|---|
| `app_open` | `cold_start` | Sessions, DAU |
| `round_start` | `mode`, `round_index_today` | Rounds per session |
| `tray_dealt` | `pieces` (3 IDs), `fill_pct`, `mercy_applied` | Live check of the generator |
| `piece_placed` | `piece_id`, `lines_cleared`, `combo`, `ms_to_place` | Feel and difficulty |
| `round_end` | `score`, `placements`, `duration_s`, `cause` (`no_fit` / `quit`) | **Game-length distribution** (compared to the sim) |
| `continue_offered` / `continue_used` | `placements` | Rewarded take-up |
| `ad_requested` / `ad_shown` / `ad_failed` | `format`, `placement`, `network`, `ms_load` | Fill and latency |
| `ad_revenue` | `value`, `currency`, `network`, `format`, `placement` | ARPDAU. Comes from MAX `OnAdRevenuePaidEvent` and is logged as Firebase `ad_impression`. |
| `iap_view` / `iap_start` / `iap_success` / `iap_fail` | `product_id`, `price`, `error` | Purchase funnel. Revenue numbers come from RevenueCat, not the client. |
| `consent_result` | `gdpr_region`, `att_status`, `cmp_status` | Consent rates |
| `tutorial_step` | `step` | Early drop-off |
| `level_up` | `level`, `unlock_id`, `rounds_played` | Is the progression pace right? |
| `daily_puzzle` | `date_seed`, `score`, `attempt` (1 = free, 2 = ad retry), `streak` | The return loop |
| `streak_change` | `streak`, `cause` (`played` / `freeze` / `ad_save` / `broken`) | Streak health |
| `reward_offer` / `reward_taken` | `offer` (`rescue` / `double_xp` / `undo` / `try_cosmetic` / `streak_save` / `daily_retry` / `break_trade`) | Which voluntary offers earn their place |
| `notif_open` | `type` | Whether notifications bring players back |

Retention (D1/D7) comes from Firebase's built-in cohorts. Crash-free sessions come from Crashlytics.

---

## 4. Monetization: as much ad inventory as possible, nearly all of it voluntary

**Principle:** the most-watched ads are the ones players *choose*, because each offer is worth something they want right then (another life, faster progression, an unlock). Rewarded ads also pay the highest eCPM. So the design surrounds play with valuable rewarded offers, keeps the few forced ads at natural pauses, and puts passive display ads only on screens where nobody is mid-move. Every cap and toggle is a **Remote Config key**, A/B tested in M5.

**Rewarded (voluntary) offers**

| Offer | When it appears | Cap | Why players take it |
|---|---|---|---|
| **Rescue** | At game over (`no_fit`): "Watch to shatter 3 lines and get a fresh tray." | 1 per round | The sim shows one rescue adds **~96 placements**, roughly a whole extra game (§6). It's the most valuable thing in the game, offered at the peak of investment. |
| **Double XP** | On the score screen: "Watch to double this round's XP." | 1 per round | Ties ads directly to the slow progression (§1b); worth more the longer the round was. |
| **Undo** | Undo button during play, with an ad icon | 1 per round | Players want it most right after a bad drop. It's offered, never pushed. |
| **Try a locked cosmetic** | In the Shard Album: "Watch to use this theme for 3 rounds." | 3 per day | A preview of what's coming. Makes leveling more appealing. |
| **Streak save** | On the day after a missed Daily Puzzle: "Watch to keep your streak." | 1 per missed day, on top of the free weekly freeze | Protects something the player built up |
| **Daily Puzzle retry** | After the free daily attempt | 1 per day | Chasing a leaderboard spot |
| **Ad-break trade** | On the score screen when an interstitial is due: "Watch one now, skip the next 3 breaks." | — | Turns a forced ad into a chosen one, at rewarded eCPM |

**Forced ads (few, only at natural pauses)**

| Placement | Format | Rule | Default caps |
|---|---|---|---|
| **Round end** | Interstitial | Only after the score screen, on "Play again" or "Home". **Skipped if the player watched any rewarded ad this round**: they already "paid", and showing both feels like a tax. | `inter_min_gap_s=90`, `inter_min_rounds=2`, `inter_grace_rounds=3` |
| **App open** | App-open ad | **Off by default.** Test in M5 only if ARPDAU misses target. | — |
| **Never** | | App launch before the home screen, mid-round, right after a rescue, or two in a row | Play disruptive-ads policy ([Play policy](https://support.google.com/googleplay/android-developer/answer/9857753)): no unexpected full-screen ads, none before the splash screen, all closable within 15 s. Opted-in rewarded ads are exempt from the 15 s rule. |

**Passive display ads (extra inventory that never interrupts a move)**

| Placement | Format | Rule |
|---|---|---|
| **Score screen** | MREC (300×250) under the score | Visible while the score counts up and the player reads results. Refreshes per MAX settings. |
| **Home, Album, Settings** | Adaptive banner at the bottom | Menus only. **Never on the board screen**: the 8×8 grid needs the space, and a misplaced tap on a banner is the fastest way to get a 1-star review. |

**Purchases**

| Product | What it does | Why |
|---|---|---|
| **Remove Ads** (`shardgrid.remove_ads`, non-consumable, $4.99; A/B $2.99 in M5) | Removes interstitials, app-open ads, MRECs and banners. **Rewarded offers stay** (they're opt-in and players still want them). | Offered on the store page, and after the 3rd interstitial in a day. |
| Boosters / coins | **Not at launch.** A currency needs balancing, and the competitor's rating carries a "Simulated Gambling" descriptor **[ASL]** we want to avoid. | Revisit in M6 |
| Subscription | **Not at launch.** Test "Shardgrid+" (ad-free + all cosmetics early) in M6, priced against the competitor's **[ASL]** | See §0.4 |

**What we deliberately don't do:** rig the generator near an ad offer (§0.6), fake "free gift" buttons that are really ads, or countdowns that pressure a tap. Each would risk Play's Deceptive Behavior policy and would hurt D7 more than it earns.

---

## 5. Ad network setup

- **M3 adapters:** AdMob and Unity Ads (both have high fill and come free with the accounts you're creating anyway).
- **M5 additions** if fill is below 95% or eCPM is weak in the test markets: Mintegral and Pangle. Both appear in the competitor's package **[EXO]**, which shows they work in this genre.
- **app-ads.txt** goes at the root of your developer website, and that URL must be in both store listings (Play: contact details; Apple: marketing URL), or AdMob can't verify app ownership ([AdMob help](https://support.google.com/admob/answer/9363762)).

---

## 6. Piece generator and headless bot simulator

**Generator** (shared C# and Python logic):

1. Weighted draw from a shape catalog of about 20 shapes (singles through 3×3, L, T, lines, diagonals). Starting weights come from **T1** frequencies, then get an **intentional** offset so our difficulty curve is our own.
2. **Mercy rule:** if board fill ≥ `mercy_fill` (default 0.55), re-roll up to `mercy_rerolls` (default 2) times until at least one piece in the tray fits. This rule is calibrated against **T2**.
3. A seeded RNG (`seed` per round) so every round can be replayed and every bug reproduced.

**Simulator** (`sim/`, Python stdlib, run in CI):

- Three bots: **random-legal** (floor), **greedy** (most lines cleared, then fewest isolated holes), and **lookahead-1** (best ordering of the 3 tray pieces). Greedy stands in for a typical player, lookahead for a strong one.
- `python sim/sim.py --games 10000 --bot greedy` prints game-length percentiles (placements) and the share of games that end on the first tray. `--rescues 1` measures what a rescue is worth. `--check` runs the CI gate. Weights, mercy and rescue strength live in `sim/generator.json`, which the Unity build ships as its Remote Config defaults.
- **Lookahead** is implemented as a beam search (width 6) over the order and placement of the whole tray.
- **Target band** (initial; replaced by the T3 numbers once collected): greedy-bot median **60–120 placements**, p90 **≤ 350**, **<2%** of games ending on the first tray. Lookahead-1's median must be **≥1.5×** greedy's, so that skill visibly pays off.
- CI fails if a generator change moves the greedy-bot percentiles out of the band. That **CI run** is M1's outside evidence.
- **First results (2026-10-15, 10,000 games, starting weights):** greedy p10/p50/p90/p99 = **32 / 89 / 239 / 449** placements, 52 lines/game, 0% first-tray deaths. Lookahead (2,000 games) p50 = **365**, 4.1× greedy. Random bot p50 = 13. **Band OK.**
- **Rescue finding:** one rescue adds **~96 placements** with 3 lines cleared, and still ~78 with 1 line. Once the board is in a steady state, death is close to memoryless, so any continue is worth about one fresh game regardless of strength. **The cap (1 per round) is the real control**; `rescue_lines` is tuned only for feel (default 3, the most satisfying).
- After launch, compare the live `round_end.placements` distribution to the simulator's numbers. If real players last much less long than the greedy bot, the bot is too strong a model of players, and we recalibrate.

---

## 7. Compliance

| Item | What we do | Source |
|---|---|---|
| **GDPR / UMP** | Enable the MAX Terms and Privacy flow. Publish a GDPR message in **AdMob → Privacy & messaging** and **add every mediated network to it**. Settings menu → "Privacy choices" calls `MaxSdk.CmpService.ShowCmpForExistingUser()`. Test with Debug User Geography = GDPR. | [AppLovin Unity docs](https://developers.applovin.com/en/max/unity/overview/terms-and-privacy-policy-flow) |
| **ATT (iOS)** | MAX shows the ATT prompt after UMP. Set `NSUserTrackingUsageDescription` (written for players: "lets us show you fewer irrelevant ads"). Tell App Review in the notes that ATT is requested on iOS 14.5+. | AppLovin docs, same page |
| **Apple privacy label** | Declare the data each SDK collects: Device ID, Advertising Data, Product Interaction, Crash and Performance data, Purchase History (RevenueCat), User ID (RevenueCat's anonymous ID). *Tracking* = yes (Identifiers, Usage Data) when ATT is allowed. Re-check against each SDK's own privacy manifest at M4. | Each SDK's `PrivacyInfo.xcprivacy` |
| **Play Data safety** | Same data types. Ads ID is used for advertising and analytics. Data is encrypted in transit. Provide a deletion-request path (an email or form on the website). | Play Console Data safety form |
| **Ad ID permission** | Declare `com.google.android.gms.permission.AD_ID` (the MAX and Firebase SDKs merge it). | [Play Ad ID policy](https://play.google.com/about/monetization-ads/ads/ad-id/) |
| **Age rating** | **Not directed at children** (otherwise Play's Families policy restricts which ad networks we can use). Apple: answer the new questionnaire (tiers are 4+/9+/13+/16+/18+ since Jul 2025) honestly about ads. Play: IARC questionnaire. Expect around 9+ or 13+ because of ads; no gambling content of our own. | [Apple age ratings update](https://www.iphoneincanada.ca/2025/07/25/updated-app-store-age-ratings) |
| **IAP rules** | All digital purchases go through StoreKit or Play Billing (Apple 3.1.1). A "Restore Purchases" button on the store page (Apple requires it for non-consumables). | Apple App Review Guidelines 3.1.1 |
| **Server-side receipt validation** | The RevenueCat backend validates every transaction. The client unlocks Remove Ads only from RevenueCat's `CustomerInfo.Entitlements["no_ads"].IsActive`. Turn on RevenueCat webhooks only if we add a backend; we don't need one now. | RevenueCat docs |
| **Privacy policy and terms** | Hosted on the developer website and linked in the stores, in the app and in the MAX flow. | AppLovin docs |

---

## 8. Milestones, gates and kill numbers

Thresholds are **our decision rules**. Evidence must come from a system or person outside this team.

| # | Milestone | Claude builds | **Done = outside evidence** | Kill / pivot rule |
|---|---|---|---|---|
| **M0** | Setup and teardown | Repo, `teardown/log.csv` template, shape catalog, CI skeleton | You've filed every slow-lead account application (§9 steps 1–6). T0–T5 rows logged. | — |
| **M1** | Generator and simulator | `sim/` (generator, 3 bots, percentile report, rescue value, CI band gate) | **GitHub Actions run** green with greedy-bot percentiles in band over 10,000 games | If no weights hit the band, change the mercy rule, not the band |
| **M2** | **Gray-box prototype, Android only** (no ads, no IAP; Firebase only) | Unity project: board, tray, drag/drop, clears, combos, game over, **the full feel list in §1b**, analytics events, fastlane lane to the closed track. C# port of `sim/`, checked against golden vectors exported from the Python sim. | Play **closed test with ≥12 testers for 14 continuous days** (counts toward production access). Firebase shows **≥60% of testers starting ≥3 rounds in their first session** and **median session ≥5 min**. | **Below either number → no monetization work, and don't pay Apple's $99.** Iterate on feel (2 more test cycles max), then stop the project. |
| **M3** | Progression, monetization, compliance, iOS | **Pay Apple $99 here.** XP/levels, unlocks, Shard Album, Daily Puzzle + Play Games/Game Center leaderboard, streaks, rested XP, local notifications (§1b). All rewarded offers, interstitial rules, MREC and menu banners (§4). RevenueCat Remove Ads + Restore. UMP/ATT/"Privacy choices" menu. Procedural art and audio pass. iOS build on macOS runners, TestFlight. | **MAX Mediation Debugger: every network green, CMP row = "Google consent management solutions"** (screenshots on both platforms). **Sandbox purchase + restore** shown in the RevenueCat dashboard for an Apple sandbox tester **and** a Play license tester. EU-debug geography shows the UMP form. Closed testers reach level 5 in their first session (Firebase `level_up`). | Any red adapter → drop that network |
| **M4** | Store review | Store listings, screenshots, privacy label, Data safety, review notes | **Apple App Review approved. Play production access granted and release approved. Play pre-launch report shows 0 crashes.** An outside person passes the "could you confuse them?" check (§1). | Rejection under 4.1 or impersonation → art and name change, not an appeal |
| **M5** | **Soft launch**: Play **open testing**, organic only, focused on **Philippines + Canada** | A/B tests via Remote Config (interstitial gap, grace rounds, break trade, MREC on/off, Remove Ads price), dashboards | Firebase cohort of **≥300 installs per market** (organic; treat as directional, and buy installs with ad revenue to reach 1,000 before global): **D1 ≥ 40%, D7 ≥ 15%**, **crash-free sessions ≥ 99.5%** (Crashlytics), **ARPDAU ≥ $0.03 PH / $0.08 CA** (MAX revenue ÷ Firebase DAU). | D1 < 30% → stop. 30–40% → one core-loop iteration, then re-test. Hits D1/D7 but misses ARPDAU → test app-open ads and boosters before global. |
| **M6** | Global launch | Subscription test, extra ad networks, Adventure levels if D30 data supports them | All M5 numbers hold for 2 weeks after adding US/UK/DE | — |

---

## 9. Checklists

### What **you** set up, ordered by how long each takes to clear (start the top ones today)

| # | Step | Lead time | Notes |
|---|---|---|---|
| 1 | ~~Personal or LLC~~ **Decided: personal accounts** (2026-10-15). The store shows your legal name as the developer. | — | Check in Play Console whether your address will be shown publicly once you sell an IAP; if so, decide before M3. |
| 2 | **Recruit 15–20 testers** (Android, with Gmail accounts) who agree to keep the app installed for 14 days | 1–2 weeks | Gates M2 *and* Play production access. Recruiting more than 12 means people dropping out don't reset the clock. |
| 3 | **Google Play Console** account ($25) plus identity verification | Days | Then create the app and the closed-test track |
| 4 | **Apple Developer Program** ($99/yr), **only after M2 passes** | 1–2 days for an individual | Deferred to keep the start at $25 |
| 5 | **Developer website** via GitHub Pages (`alexdlc5.github.io`): privacy policy, terms, a deletion-request contact; later `app-ads.txt` | 1 hour | Free. Required by AdMob, the stores and the MAX flow. |
| 6 | **Play payments profile** now; **App Store Connect Paid Apps Agreement + tax + banking** after step 4 | Days (agreement review) | Sandbox IAP doesn't work until this is active |
| 7 | **AdMob** account → payments info → publish a **GDPR message** under Privacy & messaging | Days for account approval; app review after the listing is live | |
| 8 | **AppLovin** account → MAX SDK key → connect the AdMob and Unity Ads networks (**Unity Ads** account too) | 1–3 days | |
| 9 | **RevenueCat** project → connect an **App Store Connect In-App Purchase key** and a **Play service account** (Google service-account permissions can take a day or more to take effect) | 1–2 days | |
| 10 | **Firebase** project with an iOS and an Android app; download the config files into the repo secrets | 1 hour | |
| 11 | **Create the product** `shardgrid.remove_ads` in both stores at the $4.99 tier, then the `no_ads` entitlement in RevenueCat | 1 hour + store review of the product | |
| 12 | **Test devices:** your Android phone now; an iPhone (iOS 15+, borrowed is fine) from M3. **Play license testers** list; **Apple sandbox tester** from M3. | — | You can't test iOS purchases without a physical iPhone |
| 13 | **GitHub secrets:** a `fastlane match` repo plus password, an App Store Connect API key, a Play service-account JSON, a keystore | 1 hour | I'll give exact names in M2 |
| 14 | **Organic soft-launch push:** Play open-testing link, devlog posts (r/AndroidGaming promo threads, short gameplay clips), testers' friends | Before M5 | $0. Spend ad revenue on installs only after D1/D7 hold. |
| 15 | **Play the teardown (§2b)** and fill in `teardown/log.csv` | About 3 hours | Recalibrates the M1 target band |

### What **Claude** builds, by milestone

- **M0:** repo, this spec, `teardown/log.csv` template and shape catalog, CI workflow skeleton.
- **M1 (done 2026-10-15):** `sim/sim.py` (generator, random/greedy/lookahead bots, percentile report, rescue value, `--check` gate), `sim/generator.json` (weights, mercy, rescue strength, target band), `sim/test_sim.py`, `.github/workflows/sim.yml`.
- **M2:** Unity project (board, tray, drag/drop, clears, combos, game over, settings, the §1b feel list), C# port of the generator and rules with golden vectors from the Python sim, Firebase events (§3), fastlane lane to the Android closed track, Actions workflow on Ubuntu.
- **M3:** progression and return loops (§1b), every ad placement in §4 with Remote Config caps, RevenueCat Remove Ads + Restore, UMP/ATT/"Privacy choices" menu, procedural art and CC0 audio, iOS build on macOS runners + TestFlight, the §1 distinctness table filled in with screenshots.
- **M4:** store listing copy, screenshot pipeline, privacy-label and Data-safety worksheets mapped from each SDK's manifest, App Review notes, a pre-launch-report fix pass.
- **M5:** A/B test configs, a KPI query or dashboard (Firebase + MAX revenue), and a written gate decision with numbers.
- **M6:** subscription experiment, extra ad networks, Adventure levels.

---

## 10. Open questions for you

1. ~~Personal account or LLC?~~ Decided: personal.
2. Art: I'll start with procedural shard art (free). Do you want to hire an artist later, once there's revenue?
3. ~~Soft-launch budget?~~ Decided: $0, organic first.

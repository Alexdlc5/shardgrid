# Shardgrid: Project Spec

*Working title. Original block-placement puzzle for Android and iOS, ad- and IAP-monetized.*
*Spec date: 2026-10-15. Author: Claude (for Alexdlc5).*

> **How to read this.** Every claim about the competitor carries a source tag. **[ASL]** = Apple App Store listing, **[EXO]** = Exodus Privacy static-analysis report, **[UNVERIFIED]** = not yet observed by us, and the teardown in §2 must confirm it before we rely on it. Platform rules cite the platform's own docs. The thresholds in §8 are decision rules we chose, **not** facts. Each milestone is "done" only on the outside evidence named in its row.

---

## 0. Deviations from the brief (read first)

1. **I could not access the Reddit decompile video.** Reddit is blocked to both my web fetcher and the in-app browser. So nothing in this spec comes from it. If you watch it, write any concrete claims into `teardown/leads.md` as **[LEAD]**, and the teardown protocol (§2) tests them against real play. Even if the video shows code, we use it only to form hypotheses, never as a source to copy.
2. **I dropped Unity IAP. RevenueCat's own Unity SDK (`purchases-unity`) is the only purchase SDK.** Both SDKs bundle Google's `com.android.billingclient`, and running them together needs manual dependency surgery plus calling `SyncPurchases()` after every purchase ([Unity IAP docs](https://docs.unity.com/en-us/iap/ai-skill-features); [RevenueCat, "own IAP code"](https://www.revenuecat.com/docs/migrating-to-revenuecat/sdk-or-not/finishing-transactions)). RevenueCat alone already does StoreKit 2 and Play Billing purchases and validates every receipt on its server. Using one SDK removes the conflict entirely.
3. **The slowest setup step is on Google's side, not Apple's.** A *personal* Play developer account created after Nov 2023 must run a closed test with **≥12 testers opted in for 14 continuous days** before it can publish to production ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465)). So the gray-box prototype (M2) is shipped *as* that closed test, and your 12–20 testers are also our playtesters.
4. **The competitor sells subscriptions, not one-time purchases.** Its iOS IAP list shows 1 week $4.99, 1 month $9.99 and 1 year $49.99 **[ASL]**. We still start with a one-time "Remove Ads" purchase (§4) and test a subscription later, because a subscription at launch is harder to get through review and harder to explain to players.

---

## 1. Product

**Core loop (one round):** You are dealt a tray of **3 pieces** → you drag each onto an **8×8 grid** → full rows or columns clear, and clearing several at once or in consecutive turns builds combos → when the tray is empty, 3 new pieces are dealt → **game over** when none of the remaining tray pieces fits anywhere.

- 8×8 grid, row/column clearing and combos: **[ASL]** (the description says "8x8 block puzzle... clear rows and columns... combos").
- 3-piece tray: **[UNVERIFIED]** (genre convention; teardown T1 confirms it).
- Other modes the competitor ships: daily puzzle, endless high score, "Adventure" levels with jigsaw art, offline play, Game Center **[ASL]**. **We ship endless mode only** until M5 passes. Daily puzzles come next, because they are cheap to build and give players a reason to come back.

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

Retention (D1/D7) comes from Firebase's built-in cohorts. Crash-free sessions come from Crashlytics.

---

## 4. Monetization

All caps are **Remote Config keys** with the defaults below. The soft launch (M5) runs an A/B test on them.

| Placement | Format | Trigger | Default cap | Why |
|---|---|---|---|---|
| **Continue** | Rewarded | At `no_fit` game over, offer "watch an ad to clear 3 random rows and get a new tray". **Once per round.** | 1 per round | The best opt-in moment, because the player is invested. Play's 15-second close rule doesn't apply to opted-in rewarded ads ([Play policy](https://support.google.com/googleplay/android-developer/answer/9857753)). |
| **Round end** | Interstitial | Only **after the score screen**, on tapping "Play again" or "Home" | `inter_min_gap_s=90`, `inter_min_rounds=2`, `inter_grace_rounds=3` (no interstitials in a player's first 3 rounds ever) | Play allows full-screen ads at natural breaks such as after a score screen, and bans **unexpected** ones, ads before the splash screen, and ads that can't be closed within 15 s ([Play policy](https://support.google.com/googleplay/android-developer/answer/9857753)). The grace rounds protect D1. Tune them against T4. |
| **Never** | | App launch, mid-round, after continue, two taps in a row | | Play disruptive-ads policy; also bad for retention |
| Banner | | **None at launch.** | | 8×8 boards need the vertical space. Test a banner in M5 only if ARPDAU misses target. |
| **Remove Ads** | Non-consumable IAP, `shardgrid.remove_ads` | Store page, and after the 3rd interstitial in a day | — | Removes interstitials only. **Rewarded continues stay**, because they are opt-in and still earn money. |
| **Boosters** | **Not at launch.** | | | A coin or booster economy needs balancing, and the competitor's rating already carries a "Simulated Gambling" descriptor **[ASL]** that we want to avoid. Revisit in M6. |
| Subscription | **Not at launch.** Test a "Shardgrid+" (ad-free + daily themes) in M6, priced against the competitor's **[ASL]**. | | | See §0.4 |

Pricing for Remove Ads: start at the **$4.99** tier, then A/B test $2.99 against it in M5 via RevenueCat Offerings.

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
- `python sim/run.py --games 10000 --bot greedy --seed 1` prints game-length percentiles (placements) and the share of games that end on the first tray.
- **Target band** (initial; replaced by the T3 numbers once collected): greedy-bot median **60–120 placements**, p90 **≤ 350**, **<2%** of games ending on the first tray. Lookahead-1's median must be **≥1.5×** greedy's, so that skill visibly pays off.
- CI fails if a generator change moves the greedy-bot percentiles out of the band. That **CI run** is M1's outside evidence.
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
| **M1** | Generator and simulator | `sim/` (3 bots, generator, golden vectors), C# port, CI band check | **GitHub Actions run** green with greedy-bot percentiles in band over 10,000 games | If no weights hit the band, change the mercy rule, not the band |
| **M2** | **Gray-box prototype** (no ads, no IAP; Firebase only) | Unity project: board, tray, drag/drop, clears, combos, game over, placeholder art, analytics events, fastlane lanes | Play **closed test with ≥12 testers for 14 continuous days** (counts toward production access). TestFlight to the same people. Firebase shows **≥60% of testers starting ≥3 rounds in their first session** and **median session ≥5 min**. | **Below either number → no monetization work.** Iterate on feel (2 more test cycles max), then stop the project. |
| **M3** | Monetization and compliance | MAX + adapters, rewarded continue, interstitial caps, RevenueCat Remove Ads + Restore, UMP/ATT flow, privacy menu, real art pass | **MAX Mediation Debugger: every network green, CMP row = "Google consent management solutions"** (screenshots on both platforms). **Sandbox purchase + restore** shown in the RevenueCat dashboard for an Apple sandbox tester **and** a Play license tester. EU-debug geography shows the UMP form. | Any red adapter → drop that network |
| **M4** | Store review | Store listings, screenshots, privacy label, Data safety, review notes | **Apple App Review approved. Play production access granted and release approved. Play pre-launch report shows 0 crashes.** An outside person passes the "could you confuse them?" check (§1). | Rejection under 4.1 or impersonation → art and name change, not an appeal |
| **M5** | **Soft launch**: **Philippines + Canada** (cheap installs plus an English-speaking, Western-like market) | A/B tests via Remote Config (interstitial gap, grace rounds, Remove Ads price), dashboards | Firebase cohort of **≥1,000 installs per market**: **D1 ≥ 40%, D7 ≥ 15%**, **crash-free sessions ≥ 99.5%** (Crashlytics), **ARPDAU ≥ $0.03 PH / $0.08 CA** (MAX revenue ÷ Firebase DAU). | D1 < 30% → stop. 30–40% → one core-loop iteration, then re-test. Hits D1/D7 but misses ARPDAU → test banners and boosters before global. |
| **M6** | Global launch | Daily puzzle, subscription test, extra networks | All M5 numbers hold for 2 weeks after adding US/UK/DE | — |

---

## 9. Checklists

### What **you** set up, ordered by how long each takes to clear (start the top ones today)

| # | Step | Lead time | Notes |
|---|---|---|---|
| 1 | **Decide: personal or LLC.** With an LLC you need a **D-U-N-S number** (free, up to 5 business days from D&B plus 2 for Apple) and a website on your own domain. In return you skip Play's 12-tester rule, and the store shows the company name, not your legal name. | Days (LLC formation + D-U-N-S) | [Apple D-U-N-S](https://developer.apple.com/support/D-U-N-S/) |
| 2 | **Recruit 15–20 testers** (Android and iPhone, with Gmail accounts) who agree to keep the app installed for 14 days | 1–2 weeks | Gates M2 *and* Play production access. Recruit more than 12 so that people dropping out doesn't reset the clock. |
| 3 | **Google Play Console** account ($25) plus identity verification | Days | Then create the app and the closed-test track |
| 4 | **Apple Developer Program** ($99/yr) | 1–2 days for an individual, longer for an organization | |
| 5 | **Developer website** with privacy policy, terms and a deletion-request contact; later `app-ads.txt`. Firebase Hosting or GitHub Pages is fine. | 1 day + DNS | Required by AdMob, the stores and the MAX flow |
| 6 | **App Store Connect Paid Apps Agreement + tax + banking**; **Play payments profile** | Days (agreement review) | Sandbox IAP doesn't work until this is active |
| 7 | **AdMob** account → payments info → publish a **GDPR message** under Privacy & messaging | Days for account approval; app review after the listing is live | |
| 8 | **AppLovin** account → MAX SDK key → connect the AdMob and Unity Ads networks (**Unity Ads** account too) | 1–3 days | |
| 9 | **RevenueCat** project → connect an **App Store Connect In-App Purchase key** and a **Play service account** (Google service-account permissions can take a day or more to take effect) | 1–2 days | |
| 10 | **Firebase** project with an iOS and an Android app; download the config files into the repo secrets | 1 hour | |
| 11 | **Create the product** `shardgrid.remove_ads` in both stores at the $4.99 tier, then the `no_ads` entitlement in RevenueCat | 1 hour + store review of the product | |
| 12 | **Test devices:** one Android phone and one iPhone (iOS 15+). **Apple sandbox tester** account. **Play license testers** list. | — | You can't test iOS purchases without a physical iPhone |
| 13 | **GitHub secrets:** a `fastlane match` repo plus password, an App Store Connect API key, a Play service-account JSON, a keystore | 1 hour | I'll give exact names in M2 |
| 14 | **Soft-launch install budget** ≈ $500–1,500 (AppLovin or Google App Campaigns) for 1,000+ installs per market | Before M5 | Without it, M5 has no data |
| 15 | **Play the teardown (§2b)** and fill in `teardown/log.csv` | About 3 hours | Feeds M1 |

### What **Claude** builds, by milestone

- **M0:** repo, this spec, `teardown/log.csv` template and shape catalog, CI workflow skeleton.
- **M1:** `sim/` (generator, 3 bots, percentile report, CI band gate), golden test vectors, C# board/generator port with tests matching the vectors.
- **M2:** Unity project (board, tray, drag/drop, clears, combos, game over, settings), Firebase events (§3), fastlane `beta` lanes (Android closed track, TestFlight), Actions workflows on Ubuntu and macOS.
- **M3:** MAX integration and placements with Remote Config caps, rewarded continue, RevenueCat Remove Ads + Restore, UMP/ATT/"Privacy choices" menu, original art and audio pass (or a brief for a hired artist), the §1 distinctness table filled in with screenshots.
- **M4:** store listing copy, screenshot pipeline, privacy-label and Data-safety worksheets mapped from each SDK's manifest, App Review notes, a pre-launch-report fix pass.
- **M5:** A/B test configs, a KPI query or dashboard (Firebase + MAX revenue), and a written gate decision with numbers.
- **M6:** daily puzzle mode, subscription experiment, extra ad networks.

---

## 10. Open questions for you

1. Personal account or LLC? (This decides how long step 1 takes and whether the 12-tester rule applies.)
2. Art: do you want me to generate original art, or will you hire an artist (budget)?
3. Is the soft-launch budget in §9.14 acceptable?

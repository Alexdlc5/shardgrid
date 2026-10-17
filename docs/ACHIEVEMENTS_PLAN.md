# Game Center achievements: plan (for approval, nothing built yet)

30 achievements, **790 of Apple's 1000 points**. The 210 left over are kept for a later chapter (the Pale Bidder's "other hearts").
Every one is earned by playing. None is for buying coins, Remove ads, or watching an ad. Things an ad can help with (a rescue,
a double deal) count the same way they already do for the game's own collections, but no achievement needs an ad, and an ad
never grants one by itself.

All titles and descriptions, in all 8 languages, are in [achievements-localization.csv](achievements-localization.csv)
(one row per achievement per language, ready to paste into App Store Connect). The proper nouns come from `proto/lang/*.json`,
so they match the game word for word.

## 1. The list

**Progress** means Game Center shows a bar (for example 12 of 33) instead of just locked or earned.
**Hidden** means players see "Hidden" until they earn it. That's used for later mines and story moments, so the list
never spoils the story. "Code" is where in `proto/main.js` (or the save) the condition already lives.

### Digging (4)
| # | ID | Title | Earned when | Code | Pts | Hidden | Progress | Art |
|---|---|---|---|---|---|---|---|---|
| 1 | `gw.ach.first_haul` | First Haul | The first haul is sold (any mode) | `sell()` | 5 | no | no | `coin()` on a little gem pile |
| 2 | `gw.ach.pure_vein` | Pure Vein | A clear includes a pure vein (one crystal type in the line) | `commit()`: `pure.size > 0` | 10 | no | no | a row of four Moss Quartz `gem()`s |
| 3 | `gw.ach.glimmering` | Glimmering! | One piece clears 4+ lines (the "Glimmering!" pop) | `commit()`: `n >= 4` | 20 | no | no | four gem cuts in a star burst |
| 4 | `gw.ach.combo_5` | Combo ×5 | `combo` reaches 5 in one dig | `commit()`: `combo >= 5` | 15 | no | no | five gem colours fanned out |

### Story (3)
| # | ID | Title | Earned when | Code | Pts | Hidden | Progress | Art |
|---|---|---|---|---|---|---|---|---|
| 5 | `gw.ach.met_puddock` | Coins for Crystals | Meeting Old Puddock finishes | `talk()`: `save.metPuddock` | 5 | no | no | `puddock()` |
| 6 | `gw.ach.reunion` | Found You, Gran | The reunion scene ends | `AFTER.reunion`: `story.site === "skywell"` | 40 | yes | no | `granny()` |
| 7 | `gw.ach.finale` | The Wickway is Lit | The finale scene ends | `AFTER.finale`: `story.finale` | 100 | yes | no | `memoryArt("wickway")` |

### Mines: all 3 Amber Memories of each mine (11)
The title is the mine's own name. The bar shows 0, 1, 2 or 3 of 3 memories (`mineDone(save.story, mine)`). They unlock where the
memory breaks open in `commit()` (`save.story.mem.push`). The art is that mine's painted scene: `scene()` with the mine's palette
and gem colours, the same painting as its map tile (`mapTile()`), drawn large.

| # | ID | Title | Pts | Hidden |
|---|---|---|---|---|
| 8 | `gw.ach.mine_hollow` | Mossy Hollow | 5 | no |
| 9 | `gw.ach.mine_ember` | Cinderroot Caverns | 10 | no |
| 10 | `gw.ach.mine_grotto` | Gloamcap Grotto | 10 | no |
| 11 | `gw.ach.mine_frostpine` | Frostpine Deep | 15 | no |
| 12 | `gw.ach.mine_gulch` | Geode Gulch | 15 | no |
| 13 | `gw.ach.mine_heartwood` | Heartroot Deep | 20 | no |
| 14 | `gw.ach.mine_cinder` | Cinderthread Run | 20 | yes |
| 15 | `gw.ach.mine_roost` | Scalefall Roost | 25 | yes |
| 16 | `gw.ach.mine_loom` | The Moonloom | 25 | yes |
| 17 | `gw.ach.mine_wickhold` | Wickhold | 30 | yes |
| 18 | `gw.ach.mine_skywell` | The Skywell | 30 | yes |

The hidden five match the game: the mine list only shows those mines once the story reaches them (`revealed()`, `MAP_GATE`, `GIVEN`).

### Collections and camp (12)
| # | ID | Title | Earned when | Code | Pts | Hidden | Progress | Art |
|---|---|---|---|---|---|---|---|---|
| 19 | `gw.ach.all_memories` | Every Memory | 33 of 33 Amber Memories | `story.mem.length / MEMORY_COUNT` | 60 | no | yes | `memoryArt("oak")` |
| 20 | `gw.ach.full_shelf` | A Full Shelf | 12 of 12 gem types on the shelf | `save.found.length / GEMS.length` (`sell()`) | 40 | no | yes | the 12 gem cuts in a ring |
| 21 | `gw.ach.first_pet` | Someone Asleep | The first pet is freed | `freePets()`: `pets.owned.length >= 1` | 10 | no | no | `pet("moss", …, { sleep: true })` in a crystal |
| 22 | `gw.ach.all_pets` | All Seven | 7 of 7 pets | `pets.owned.length / PET_KINDS.length` | 50 | no | yes | all seven `pet()`s together |
| 23 | `gw.ach.shoo_50` | Shoo, Shoo! | 50 Pilfermoths shooed | new counter `save.ach.shoo`, +1 per moth in `shooMoths()` | 25 | no | yes | `memoryArt("circling")` |
| 24 | `gw.ach.camp_full` | Camp in Full Glow | The camp is 100% grown | `campProgress()` (after a buy or a sale) | 50 | no | yes | `buildTile("tower")` (lantern tower) |
| 25 | `gw.ach.streak_7` | A Week of Digs | A 7-day Daily Dig streak | `save.daily.streak` (`sell()`, daily) | 20 | no | yes | `icon("calendar")` plus lantern, 7 lights |
| 26 | `gw.ach.streak_30` | A Month of Digs | A 30-day Daily Dig streak | same | 40 | no | yes | same, a full ring of lights |
| 27 | `gw.ach.gold_100k` | A Pouch of Gold | 100,000 gold of crystals sold, all time | new counter `save.ach.dug` | 10 | no | yes | a small `coin()` pile |
| 28 | `gw.ach.gold_1m` | A Cart of Gold | 1,000,000 sold | same | 25 | no | yes | `icon("cart")` heaped with coins |
| 29 | `gw.ach.gold_10m` | A Mountain of Gold | 10,000,000 sold | same | 50 | no | yes | a coin mountain |
| 30 | `gw.ach.calm_grove` | Calm Grove | A haul is sold from a Calm Grove dig | `sell()` with `calm` (a `":calm"` key in `save.best`) | 10 | no | no | `forest()` with `icon("hammock")` |

Points: digging 50 + story 145 + mines 205 + collections and camp 390 = **790**. Every value is a multiple of 5, which Google Play Games
also needs (section 6).

**Notes on fairness.**
- **Gold milestones** count `save.ach.dug`, a new running total: `haulValue()` added once per sale. It leaves out coin packs,
  the ×2 double deal and the interstitial's extra payout. (`save.light` would count the double deal, which is why it isn't used.)
- **Camp in Full Glow** is earned with in-game gold, and coin packs are a small shortcut to that gold. The packs are tiny next to
  the late-game prices, so I kept it. If you'd rather keep it strictly clean, say so and I'll swap it for a tools goal.

## 2. Languages

[achievements-localization.csv](achievements-localization.csv) has columns `achievement_id, language_code,
app_store_connect_language, title, pre_earned_description, earned_description`. That's 30 × 8 = 240 rows: en, de, es, pt-BR, ja, ko,
zh-Hans and hi. Titles are at most 64 characters and descriptions at most 255 (Apple's limits).
- **Spanish**: App Store Connect has two Spanish choices. Add the `es` rows as **Spanish (Mexico)** and again as **Spanish (Spain)**.
  The text is the same; the game ships one Spanish.
- The mine titles are the exact mine names from `proto/lang/*.json`. The mine descriptions say "in this mine", so they read
  correctly in every language without fitting the name into a sentence.
- **Big numbers** are written the local way: 100.000 (de/es/pt), 10万 (ja/zh), 10만 (ko), 1 लाख (hi).
- **Before upload**: a native speaker skim is worth it for ja/ko/hi, the same as for the game text.

## 3. Art

One painted badge per achievement, generated from the game's own art. Nothing is drawn by hand.
- **The script**: a new `scripts/achievement-art.mjs`, built like `scripts/app-art.mjs`. It imports the art functions from
  `proto/art.js`/`proto/paint.js`, wraps each subject in a shared frame, and renders with `@resvg/resvg-js` (already installed)
  to **1024×1024 opaque PNG** files in `assets/achievements/gw.ach.<id>.png`. It also writes a contact sheet,
  `docs/achievements-art.png`, so you can approve all 30 badges at once.
- **The frame**: the dark forest gradient and warm amber glow from `app-art.mjs`'s backdrop, with a hand-wobbled amber rim
  (`paint.js` `ring`/`shape`/`stroke`, the same brushwork as the painted UI skins). The subject stays inside the middle 80% circle,
  because Game Center crops badges to a circle. There's **no text**, so one image works for all 8 languages.
- **The subjects** are listed in the Art column above. The mine badges reuse each mine's `scene()` painting. Story beats reuse the
  amber-memory panels (`memoryArt`) and the character portraits (`puddock`, `granny`). Collections reuse `gem`, `pet`, `coin` and
  `buildTile`. Gold milestones use plain coins, never the coin-pack art, so they never look like a purchase.
- Apple greys out locked badges itself, so no second "locked" image is needed.

## 4. How it will be built (after you approve the list)

The changes stay small and mostly outside `main.js`, because another session is working on its performance.

**Native (`ios/App/App/GameCenterPlugin.swift`)**: two methods next to the leaderboard ones.
- `reportAchievements({ list: [{ id, percent }] })` builds `GKAchievement(identifier:)` objects with
  `percentComplete` and `showsCompletionBanner = true`, then calls `GKAchievement.report`. It resolves `{ sent: true }`, or `{ sent: false }`
  when the player isn't signed in. Game Center never lowers progress, so sending a lower number is harmless.
- `showAchievements()` opens `GKGameCenterViewController(state: .achievements)`, or the sign-in sheet, like `showLeaderboards`.
- `resetAchievements()` is for testing only. It's reachable when diagnostics are on (`gw.diag`).

**Bridge (`proto/platform.js`)**: `platform.reportAchievements(list)` returns a promise of true/false, and
`platform.showAchievements()`. Both do nothing (they resolve false) on the web and Android, the same as `submitScore`.

**Rules (new `proto/achievements.js`)**: a single table of the 30 IDs. Each ID has a rule that turns the save into a percent,
for example `s => s.story.mem.length / 33 * 100`. One function, `sync(save, extra)`, works out every percent. It sends only those
that went up since the last time Game Center accepted them (`save.ach.sent[id]`, a high-water mark) and records them once Game
Center says yes.

**Hooks in `main.js`**: about 10 one-line calls.
- In `commit()` (during a dig): `ach.hit("pure_vein")`, `ach.hit("glimmering")` and `ach.hit("combo_5")`. These only note the hit in
  `save.ach.hit`. Nothing is sent mid-dig, so no Game Center banner ever covers the board.
- In `shooMoths()`: `save.ach.shoo++` for each moth.
- In `sell()`: `save.ach.dug += haulValue()`.
- `ach.sync()` runs after `sell()`, after a market buy, after each story scene (`playScene`'s end), after `talk()`, at launch,
  and when the app comes back to the foreground. All of these are camp or menu moments.

**Earned before the update**: at the first launch with the update, `save.ach` is created with `dug` set to `save.light` and
`shoo` set to 1 if `story.scale` is true. Then `sync()` runs. Everything that comes from the save (story, mines, memories, shelf,
pets, camp, streak, Calm Grove, gold) is credited straight away. The three moment-only ones (pure vein, Glimmering!, combo) can't
be known from an old save. They're earned the next time they happen.
Note: the one-off fresh start (`RESET = "2026-10-17"` in `main.js`) wipes `save.ach` along with the rest of the save, and that's
fine. Game Center keeps whatever a tester already earned.

**Offline and retries**: GameKit holds reports itself while the phone is offline. On top of that, `save.ach.sent` only moves forward
once a report succeeds, so anything that failed (offline, signed out, Game Center down) is sent again by the next `sync()`. A player
who signs in to Game Center later gets everything they've already earned at the next launch.

**In-game button**: an **Achievements** button next to the existing **Leaderboards** buttons (in the Daily Dig sheet and Options).
Its label gets added to all 8 `proto/lang/*.json` files, so the i18n check stays green.

**Check**: one assertion in `proto/check.mjs` that the 30 IDs in `achievements.js` match the CSV, with all 8 languages for each, and
that the points add up to 1000 or less. That way the code and App Store Connect can't drift apart.

**Test plan (TestFlight, Game Center sandbox)**:
TestFlight builds use Apple's Game Center sandbox automatically, and achievements show up there as soon as they're created in App
Store Connect, before any review.
1. Build from `main` with `.github/workflows/ios.yml`, with **upload** ticked. Install from TestFlight while signed in to Game Center.
2. **Fresh save**: sell a first haul. The "First Haul" banner shows at camp, not during the dig. Clear a pure vein in a dig: the
   banner shows after the sale.
3. **Earned before the update**: install over a TestFlight build that has some progress. Everything earned so far is credited at
   launch, and the progress bars match the camp (memories, gems, pets, camp %).
4. **Offline**: turn on Airplane mode and earn one. Nothing breaks. Turn Airplane mode off and relaunch: it appears.
5. **Signed out of Game Center**: the game plays normally. Sign in and relaunch: everything earned is credited.
6. Hidden ones show as "Hidden" in the Achievements screen until they're earned.
7. Diagnostics on → reset achievements, so the run can be repeated.

## 5. Owner steps (App Store Connect)

> **IDs are permanent.** Once an achievement ID is created it can **never be used again**, even if you delete the achievement.
> Once a version with achievements goes live, those achievements can't be deleted. Type the IDs exactly as written
> (lower case, dots and underscores).

**Option A (recommended, about 5 minutes for you).** I create all 30 achievements, their 240 localizations and the images
through the App Store Connect API. This uses the API key already in the repo's secrets for TestFlight uploads (`KEY_ID`, `ISSUER`,
`KEY_P8`), if the key's role is **App Manager** or **Admin**. You then only do steps 1–2 and 10–12 below and check the list.
Just say "use the API".

**Option B (by hand, about 3–4 hours).** Every step:
1. **developer.apple.com** → Certificates, IDs & Profiles → **Identifiers** → `io.github.alexdlc5.glimmerwood` → check that
   **Game Center** is ticked. (It already should be, from the leaderboards.)
2. **appstoreconnect.apple.com** → **Apps** → **Glimmerwood** → **Game Center** (in the sidebar under Features or Services).
   Game Center is already on, from the leaderboards.
3. Next to **Achievements**, click **+** (Create).
4. Fill in **Reference Name** with the English title from the table (only you see it), and **Achievement ID** with the ID from the
   table, e.g. `gw.ach.first_haul`.
5. **Point Value**: the Pts column. **Hidden**: Yes only where the table says yes. **Achievable More Than Once**: **No**.
6. Click **Save**. (Or **Create**, depending on the page.)
7. On that achievement's page, under **Localization**, click **+** / **Add Localization**. For each of the 8 languages, take the
   CSV rows with this ID:
   - **Language**: the `app_store_connect_language` column. For `es`, add it twice: **Spanish (Mexico)** and **Spanish (Spain)**.
   - **Display Name**: the `title` column.
   - **Pre-earned Description**: the `pre_earned_description` column.
   - **Earned Description**: the `earned_description` column.
   - **Image**: `assets/achievements/gw.ach.<id>.png`. It's the same image for every language.
   - Click **Save**.
8. Repeat steps 3–7 for all 30 achievements.
9. Check the Achievements list: it shows 30 rows and a total of 790 points.
10. When the build with achievements is ready to submit: **App Store** tab → the new version's page → scroll to **Game Center** →
    make sure it's ticked.
11. Under **Achievements**, click **+** / **Add**, select **all 30** → **Done**. Then click **Save** at the top of the page.
    The first set of achievements must be attached to a version like this, or they won't go live with it.
12. Submit the version as usual. The achievements go to review together with it. Any achievement added later must also be
    attached to the version that first uses it.

The leaderboards are done the same way (docs/SETUP.md, A14). If they haven't been attached to a version yet, do both in the same
step 10.

## 6. Later: Android (Google Play Games)

- **Where**: Play Console → **Grow users** → **Play Games Services** → **Setup and management** → **Achievements** → **Add achievement**.
  Use the same names, descriptions, points and images, and the CSV's languages map to Play's translations. Images are 512×512, and the
  1024 renders scale down.
- **IDs**: Google generates its own (`CgkI…`). A small table in `platform.js` maps `gw.ach.*` to each Play ID, and `achievements.js`
  doesn't change.
- **Progress**: the bar achievements become Play "incremental" achievements, with steps = the total (33 memories, 12 gems, 7 pets,
  50 moths, 7 or 30 days). Gold and camp % use 100 steps. Play's rules (5 or more achievements to publish, points in multiples of 5,
  1000 at most) are already met.
- **Code**: a small local Kotlin plugin (`AchievementsClient.unlock` / `setSteps`), the Android twin of `GameCenterPlugin.swift`.
  It's only needed once Android ships.

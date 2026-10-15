# Glimmerwood: Game Design

*Working title (repo stays `shardgrid`). 2026-10-15. Supersedes the "Shardgrid" theme in SPEC §1/§1b; the business plan, stack, compliance and milestones in SPEC.md still apply.*

## Pitch (the one line a store page and a 6-second ad must sell)

**A cozy forest block puzzle where you mine glowing crystals before the roots close in.**

Store title: **Glimmerwood: Crystal Block Puzzle**. Generic genre words in the subtitle are normal for search, and no competitor name or look is used (SPEC §1).

## Story, in three sentences a player never has to read

Under the Glimmerwood, the great roots store sunlight as crystal. **Pip**, a mole with a firefly lantern, mines them to sell to **Old Bramble**, the toad who runs the market under the stump. The roots slowly reclaim every tunnel, and only the light from crystal veins broken clean pushes them back.

That last sentence *is* the timer:

- The **Rootline** is a living root that wraps the board frame. It **creeps back continuously** (the roots reclaiming the mine) and turns from green → amber → **red bramble** as time runs out.
- **Breaking a vein (clearing a line) releases light into the roots and pushes them back**: time refills, more for combos.
- When the Rootline closes, the tunnel seals and you climb out with your haul. **You never lose crystals**, so the timer adds tension, not punishment.

## Brainstorm: crystals that interact (ideas, ranked by how cheap they are to build × how marketable)

| # | Idea | What it does | Verdict |
|---|---|---|---|
| 1 | **Pure vein** | A cleared line made of one crystal type pays ×2. Players start *planning colors*, not just shapes. | **Build now** (biome 1). Zero assets, adds depth. |
| 2 | **Ember crystal** | Breaking it shatters every crystal around it (3×3), and embers chain into each other. | **Build now** (biome 2). Chain reactions are the best ad footage there is. |
| 3 | **Frost crystal** | Breaking it freezes the Rootline for 5 s | Biome 4 |
| 4 | **Glowcap spores** | A spore cell spreads to one empty neighbor each tray unless cleared. Spores sell high. | Biome 3: risk vs reward |
| 5 | **Geode** | A 2×2 stone that needs two clears through it, then pays a pile of gold | Biome 5 |
| 6 | **Amber with a fossil** | Rare; breaking it adds a Codex entry | Collection layer |
| 7 | **Resonance** | Same-type crystals that touch fuse into one bigger crystal that is worth more | Maybe. Strong, but it changes the core rules; test after 1–2 land. |
| 8 | **Bramble stone** | Unbreakable cells that crack after 2 adjacent clears | Later difficulty tool |

Rules for every special: **(a)** readable in one glance, **(b)** never decided by ads (the generator stays ad-blind, SPEC §0.6), **(c)** each one is introduced by its own biome, so the game keeps teaching something new for months.

## Long-term progression

```
Dig an expedition → break crystals → sell the haul to Old Bramble for gold
      ↑                                                   ↓
      └──── stronger tools, new mines, new shapes, cosmetics ←── Market
```

**1. Mines (biomes).** You pay gold once to open each new mine. Each mine adds new crystal types worth more, one new special, its own crystal **shapes**, and a faster Rootline.

| Mine | Open cost | New crystals | Special | Rootline speed |
|---|---|---|---|---|
| **Mossy Hollow** | start | Moss Quartz 1g · Leaf Jade 2g · Sun Amber 3g | Pure vein | ×1.0 |
| **Ember Roots** | 1,200g | + Garnet 3g · Ember 4g | Ember chain | ×1.15 |
| Glowcap Grotto | 5,000g | + Glowcap 6g | Spores | ×1.25 |
| Frostpine Deep | 15,000g | + Frost 8g | Freeze | ×1.35 |
| Geode Gulch | 40,000g | + Geode 25g | Geode | ×1.45 |
| Heartwood | 100,000g | all | all, plus "Heartwood season" weekly rules | ×1.6 |

**2. Tools (permanent upgrades, price ×1.7 per level, 10 levels each).** The game gets *easier* as you upgrade, while mines get *harder*. That tug-of-war is what keeps progress feeling earned.

- **Lantern:** +5 s of Rootline
- **Pickaxe:** +10% crystal value
- **Root Charm:** +10% time from each vein

**3. Shapes from the market.** "Seed pouches" add helpful shapes to your trays (e.g. *Dewdrop*: more tiny 1-cell crystals). This is the player's own choice and it changes the catalog weights, so it doesn't conflict with the ad-blind rule.

**4. Cosmetics (pure gold sinks, and the main IAP and ad-reward stock later):** Rootline styles (fireflies, ivy, thorns), lantern glow colors, board frames (moss, birch, mushroom), crystal facet styles, Pip outfits.

**5. Crystal Codex.** Every crystal type, fossil and special, by mine. "37 / 60 found" is a reason to open new mines.

**6. Records:** best haul per mine, longest combo, biggest ember chain.

## Ads in this theme (replaces SPEC §4's offers, same caps and rules)

| Moment | Rewarded offer |
|---|---|
| Rootline closes | **"Roots regrow"**: +20 s and keep digging (1 per expedition) |
| Board stuck | **"Shatter 3 veins"** (1 per expedition, shared with the above) |
| Haul screen | **"Bramble's double deal"**: sell this haul for ×2 (the strongest offer, because it feeds long-term progress) |
| Market, once a day | **"Bramble's free sample"**: a random cosmetic or seed pouch |

Interstitials only after the haul screen, with the same caps and skip rules as SPEC §4. IAP adds **gold pouches** (a soft-currency top-up) next to Remove Ads.

## Marketability checklist

- **Mascot first:** Pip the mole and lantern is the app icon, the loading screen and every ad end card. A face sells a puzzle game better than blocks do.
- **Three ad hooks, all captured from real gameplay:** (1) an ember chain clearing half the board in a burst of gold; (2) the Rootline going red with a last-second clear pushing it back; (3) a "pure vein" ASMR shatter.
- **Cozy forest** is a strong mood on the stores right now, and it is far from the competitor's neon-on-dark look (trade-dress distance, SPEC §1).
- **Sound is half the "satisfying":** crystal "tinks", a combo chime that rises in pitch, coin pours.
- **Keep the genre's relaxing audience:** add a **Calm Grove** mode later (no Rootline, crystals worth half), so players who hate timers still stay.

## Style guide (minimal assets until approved)

- **Everything is drawn in code:** no image files. Crystals are fused shapes with a light-to-dark gradient, a diagonal shine and a soft glow in their own color. The board is dark loam with moss tufts along the frame. The background is a deep forest gradient with faint light shafts.
- **Palette:** forest `#0f2219 → #1d3b2a`, loam `#2b2a24`, parchment text `#efe6cf`, lantern amber `#f0b543`, Rootline green `#7cc46a` → amber → bramble red `#d6453d`.
- **Type:** Fredoka (SIL OFL), rounded and friendly.
- **Not yet:** Pip and Bramble art, music, the Codex UI, biomes 3–6. They come after you approve the feel.

## What players praise in rival games, and what we built from it (2026-10-15)

| Praised / complained about | Where | What we did |
|---|---|---|
| **Relaxing, no time pressure.** This is the genre's top praise, and Block Blast is described as "stress-free" with "no time limit" | [Block Blast student review](https://berkleyspectator.com/6655/features/block-blast-the-hottest-game-taking-over-berkley-high-school/), [Woodoku listing](https://apps.apple.com/app/woodoku-block-puzzle-game/id1496354836), [cozy-game review analysis](https://kimola.com/reports/unlock-insights-with-our-cozy-solitaire-feedback-analysis-app-store-us-149756) | **Calm Grove** mode: no Rootline, gold ×0.6. Expedition stays the main mode. |
| **The sound of placing blocks** ("satisfying sound effects"; a user likes "the sound of placing blocks") | [Woodoku listing and a Japanese review](https://games.appmatch.jp/?p=11486) | Placement is now a layered "thunk + tink". Clear chimes rise in pitch with the combo. |
| **Daily puzzles** | Woodoku listing | **Daily Dig:** same crystals for everyone (seeded by date), one attempt a day, streak counter |
| **Themes and customization** | [Blockudoku listing](https://apps.apple.com/us/app/blockudoku-block-puzzle-game/id1452227871) | Already covered by the cosmetics market (Firefly roots for now) |
| **Beat your own best** | Block Blast reviews | Best haul per mine and mode, plus a "New best haul!" banner |
| **Encouraging messages** | Cozy-game analysis | Old Bramble says a line on every haul screen |
| **Complaint: "bad blocks when approaching high score"** (players suspect rigging) | Block Blast reviews | A **fair dealing** promise on the home screen. It's true by construction: the generator is ad-blind (SPEC §0.6). |
| **Complaint: pushy revive button** | Block Blast reviews | Rescue is one quiet option on the haul screen, once per dig, never a countdown |
| **Complaint: redesign hurt readability** (neurodivergent players) | [Blockudoku reviews](https://justuseapp.com/en/app/1452227871/blockudoku-block-puzzle-game/reviews) | **Crystal symbols** toggle (● ▲ ◆ ■ ✦), so pure veins don't rely on color alone |
| **Sound and haptics control** | General | Sound and Vibration toggles |
| **Offline play** | Woodoku, Block Blast | The prototype is fully offline except the web font (the native build bundles it) |
| **Few ads, one-time Remove Ads** | Blockudoku, cozy-game analysis | Already in SPEC §4 |

Not built yet: Undo (some rivals offer it; ours is planned as a rewarded offer, SPEC §4).

## Open design questions

1. Timer tension vs. cozy: is the Rootline fun, or should Calm Grove be the default mode?
2. Should the shape pouches (helpful shapes) be in the first market, or wait?
3. Name: Glimmerwood (preferred) or Rootdeep (backup)?

## Sim impact

The Rootline makes rounds end on **time** as well as on a stuck board, so the M1 band (placements per game) no longer describes a round. Next sim step: give each bot a seconds-per-placement model and tune `max_time`, drain and refill so a typical expedition lasts **3–5 minutes**.

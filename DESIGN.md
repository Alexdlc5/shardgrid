# Glimmerwood: Game Design

*Working title (repo stays `shardgrid`). 2026-10-15. Supersedes the "Shardgrid" theme in SPEC §1/§1b; the business plan, stack, compliance and milestones in SPEC.md still apply.*

## Pitch (the one line a store page and a 6-second ad must sell)

**A cozy forest block puzzle where you mine glowing crystals before the roots close in.**

Store title: **Glimmerwood: Crystal Block Puzzle**. Generic genre words in the subtitle are normal for search, and no competitor name or look is used (SPEC §1).

## Story, in three sentences a player never has to read

Under the Glimmerwood, the great roots store sunlight as crystal. **Dibble**, a mole with a firefly lantern, mines them to sell to **Old Puddock**, the toad who runs the market under the stump. The roots slowly reclaim every tunnel, and only the light from crystal veins broken clean pushes them back.

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
| 4 | **Gloamcap spores** | A spore cell spreads to one empty neighbor each tray unless cleared. Spores sell high. | Biome 3: risk vs reward |
| 5 | **Geode** | A 2×2 stone that needs two clears through it, then pays a pile of gold | Biome 5 |
| 6 | **Amber with a fossil** | Rare; breaking it adds a Codex entry | Collection layer |
| 7 | **Resonance** | Same-type crystals that touch fuse into one bigger crystal that is worth more | Maybe. Strong, but it changes the core rules; test after 1–2 land. |
| 8 | **Puddock stone** | Unbreakable cells that crack after 2 adjacent clears | Later difficulty tool |

Rules for every special: **(a)** readable in one glance, **(b)** never decided by ads (the generator stays ad-blind, SPEC §0.6), **(c)** each one is introduced by its own biome, so the game keeps teaching something new for months.

## Long-term progression

```
Dig an expedition → break crystals → sell the haul to Old Puddock for gold
      ↑                                                   ↓
      └──── stronger tools, new mines, new shapes, cosmetics ←── Market
```

**1. Mines (biomes).** You pay gold once to open each new mine. Each mine adds new crystal types worth more, one new special, its own crystal **shapes**, and a faster Rootline.

| Mine | Open cost | Gems (cut) | Special (built) | New shape | Rootline |
|---|---|---|---|---|---|
| **Mossy Hollow** | start | Moss Quartz 1g (brilliant) · Leaf Jade 2g (step) · Sun Amber 3g (pear) | Pure vein ×2 | — | ×1.0 |
| **Cinderroot Caverns** | 1,200g | + Garnet 3g (trillion) · Ember Shard 4g (star) | Embers shatter their 3×3, chain | plus / flame | ×1.15 |
| **Gloamcap Grotto** | 5,000g | + Moonstone 5g (cabochon) · Gloamcap 6g (round) | Each Gloamcap broken: +1 s | cap (U) | ×1.25 |
| **Frostpine Deep** | 15,000g | + Pine Sapphire 7g (step) · Frostspar 8g (prism) | Frostspar freezes the Rootline 1.5 s each (max 8 s) | snowflake (X) | ×1.35 |
| **Geode Gulch** | 40,000g | + Deep Topaz 9g (trillion) · Geode 25g (rough, rare) | Rare jackpot gem | ring (hollow 3×3) | ×1.45 |
| **Heartroot Deep** | 100,000g | mix of everything + Rootheart 40g (heart, rare) | All specials at once | heart | ×1.6 |

Built 2026-10-15 in the prototype. Simplified from the brainstorm: Gloamcap *spores* became +time, and the two-hit *geode* became a rare jackpot. The spreading and two-hit versions stay on the list for later.

**2. Tools (permanent upgrades, price ×1.7 per level, 10 levels each).** The game gets *easier* as you upgrade, while mines get *harder*. That tug-of-war is what keeps progress feeling earned.

- **Lantern:** +5 s of Rootline
- **Pickaxe:** +10% crystal value
- **Root Charm:** +10% time from each vein

**3. Shapes from the market.** "Seed pouches" add helpful shapes to your trays (e.g. *Dewdrop*: more tiny 1-cell crystals). This is the player's own choice and it changes the catalog weights, so it doesn't conflict with the ad-blind rule.

**4. Cosmetics (pure gold sinks, and the main IAP and ad-reward stock later):** Rootline styles (fireflies, ivy, thorns), lantern glow colors, board frames (moss, birch, mushroom), crystal facet styles, Dibble outfits.

**5. Crystal Codex.** Every crystal type, fossil and special, by mine. "37 / 60 found" is a reason to open new mines.

**6. Records:** best haul per mine, longest combo, biggest ember chain.

## Ads in this theme (replaces SPEC §4's offers, same caps and rules)

| Moment | Rewarded offer |
|---|---|
| Rootline closes | **"Roots regrow"**: +20 s and keep digging (1 per expedition) |
| Board stuck | **"Shatter 3 veins"** (1 per expedition, shared with the above) |
| Haul screen | **"Puddock's double deal"**: sell this haul for ×2 (the strongest offer, because it feeds long-term progress) |
| Market, once a day | **"Puddock's free sample"**: a random cosmetic or seed pouch |

Interstitials only after the haul screen, with the same caps and skip rules as SPEC §4. IAP adds **gold pouches** (a soft-currency top-up) next to Remove Ads.

## Marketability checklist

- **Mascot first:** Dibble the mole and lantern is the app icon, the loading screen and every ad end card. A face sells a puzzle game better than blocks do.
- **Three ad hooks, all captured from real gameplay:** (1) an ember chain clearing half the board in a burst of gold; (2) the Rootline going red with a last-second clear pushing it back; (3) a "pure vein" ASMR shatter.
- **Cozy forest** is a strong mood on the stores right now, and it is far from the competitor's neon-on-dark look (trade-dress distance, SPEC §1).
- **Sound is half the "satisfying":** crystal "tinks", a combo chime that rises in pitch, coin pours.
- **Keep the genre's relaxing audience:** add a **Calm Grove** mode later (no Rootline, crystals worth half), so players who hate timers still stay.

## Style guide (minimal assets until approved)

- **Everything is drawn in code:** no image files. Crystals are fused shapes with a light-to-dark gradient, a diagonal shine and a soft glow in their own color. The board is dark loam with moss tufts along the frame. The background is a deep forest gradient with faint light shafts.
- **Palette:** forest `#0f2219 → #1d3b2a`, loam `#2b2a24`, parchment text `#efe6cf`, lantern amber `#f0b543`, Rootline green `#7cc46a` → amber → bramble red `#d6453d`.
- **Type:** Fredoka (SIL OFL), rounded and friendly.
- **Not yet:** Dibble and Puddock art, music, the Codex UI, biomes 3–6. They come after you approve the feel.

## What players praise in rival games, and what we built from it (2026-10-15)

| Praised / complained about | Where | What we did |
|---|---|---|
| **Relaxing, no time pressure.** This is the genre's top praise, and Block Blast is described as "stress-free" with "no time limit" | [Block Blast student review](https://berkleyspectator.com/6655/features/block-blast-the-hottest-game-taking-over-berkley-high-school/), [Woodoku listing](https://apps.apple.com/app/woodoku-block-puzzle-game/id1496354836), [cozy-game review analysis](https://kimola.com/reports/unlock-insights-with-our-cozy-solitaire-feedback-analysis-app-store-us-149756) | **Calm Grove** mode: no Rootline, gold ×0.6. Expedition stays the main mode. |
| **The sound of placing blocks** ("satisfying sound effects"; a user likes "the sound of placing blocks") | [Woodoku listing and a Japanese review](https://games.appmatch.jp/?p=11486) | Placement is now a layered "thunk + tink". Clear chimes rise in pitch with the combo. |
| **Daily puzzles** | Woodoku listing | **Daily Dig:** same crystals for everyone (seeded by date), one attempt a day, streak counter |
| **Themes and customization** | [Blockudoku listing](https://apps.apple.com/us/app/blockudoku-block-puzzle-game/id1452227871) | Already covered by the cosmetics market (Firefly roots for now) |
| **Beat your own best** | Block Blast reviews | Best haul per mine and mode, plus a "New best haul!" banner |
| **Encouraging messages** | Cozy-game analysis | Old Puddock says a line on every haul screen |
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

The Rootline makes rounds end on **time** as well as on a stuck board, so the M1 band (placements per game) no longer describes a round. The sim now models it (`python sim/sim.py --timed`): timer constants, the six mines and the crystal specials live in `sim/generator.json` (`rootline`, `biomes`, `crystals`), shared with the prototype; each bot takes seconds per placement (random 2 ± 0.7 s, greedy 3 ± 1 s, lookahead 4.5 ± 1.5 s); embers chain-break as in `breakCells`, Gloamcap adds +1 s per gem broken, Frostspar pauses the drain 1.5 s per gem (8 s cap).

Results, 2026-10-15, current constants (max 60 s, refill 3.5 s/line, combo +25%):

| Bot @ mine | Expedition p10 / p50 / p90 | Ends on time / stuck | Placements p50 |
|---|---|---|---|
| greedy @ Mossy Hollow (n=10k) | 1:32 / **3:24** / 8:47 | 32% / 68% | 68 |
| greedy @ Cinderroot Caverns ×1.15 (n=10k) | 1:14 / **1:36** / 2:34 | 91% / 9% | 32 |
| greedy @ Gloamcap Grotto ×1.25 | 1:19 / **2:42** / 7:04 | 37% / 63% | 53 |
| greedy @ Frostpine Deep ×1.35 | 1:06 / **2:19** / 5:55 | 22% / 78% | 47 |
| greedy @ Geode Gulch ×1.45 | 0:57 / **1:11** / 1:59 | 88% / 12% | 23 |
| greedy @ Heartroot Deep ×1.6 | 0:53 / **1:23** / 3:05 | 89% / 11% | 27 |
| lookahead @ Mossy Hollow (n=2k) | 1:28 / 1:49 / 3:20 | 99% / 1% | 24 |
| greedy @ Mossy Hollow, 1 rescue | 2:43 / 5:46 / 13:00 | 48% / 52% | 115 |

`--check` now gates **greedy median in Mossy Hollow at 3–5 min**; it passes at 3:24, near the low edge.

What it tells us:
1. **Mossy Hollow hits the target as is**, and most rounds end on a stuck board, so the timer adds tension without being the usual cause of death.
2. **Cinderroot Caverns is twice as short and ends on time 92% of the time.** Isolated: drain ×1.15 alone (Hollow shapes and crystals) cuts the median 3:24 → 2:10 (Hollow sits near break-even, so drain is very sensitive), and embers cut it further, because cells an ember shatters are not *lines*, so they refill no time and leave fewer lines to clear later. Options: refill a little per ember-shattered cell, a higher `max_time` per mine, or a lower Ember drain (~×1.05). Not tuned yet; the owner's call.
3. **The slow, careful bot dies sooner** (lookahead 1:49 vs greedy 3:24): at 4.5 s a placement the clock, not the board, ends 99% of its runs. The Rootline rewards speed over planning; that supports making Calm Grove prominent for players who like to think (open question 1).
4. The rescue (+20 s or shatter 3) adds about 2½ minutes at the median.
5. **Mines with a time special outlast faster-drain mines without one.** Bloom lifts Gloamcap Grotto from 1:42 to 2:42, and freeze lifts Frostpine Deep from 1:19 to 2:19 (measured by switching each special off). **Geode Gulch has no time special and is the shortest mine (1:11, 88% time-outs)**, shorter than Heartroot Deep. Mines don't get harder in a steady line yet: the order is Hollow > Grotto > Frostpine > Ember ≈ Heartroot Deep > Gulch. The difficulty curve should come from the drain multipliers on purpose, not from which specials a mine happens to have; this needs tuning (likely Gulch and Ember first).

The bots' think times are guesses; once the prototype has real players, measure seconds per placement and replace `bot_seconds`.

## Overhaul (2026-10-15): look, sound, camp, Pilfermoths

- **Character style:** soft brown outlines (never black), one cel-shade tone, big glossy eyes with two highlights, gentle blush, idle breathing and blinking. A subtle anime influence, without overt cultural props.
- **Dibble** (player): a mole with tiny ear nubs, a soft round pink nose, big pale digging paws and a firefly lantern. **Wardrobe** (Market tab, 16 items from 300g to 20,000g): hats (leaf, toadstool, beanie, flower crown, miner's helmet), scarves (5 colours), lanterns (amber, paper, firefly jar, crystal), fur dyes (cocoa, sand, slate, snow, rosewood). You change outfits at camp.
- **Old Puddock:** a travelling toad merchant with a straw hat, round spectacles that glint, droopy white brows, half-lidded eyes and a patched indigo coat.
- **Music** (`proto/music.js`, composed in code): one fixed pentatonic tune per place (home, camp, each mine), kalimba/music-box over a warm pad, soft bass and a whisper shaker, with reverb and echo. Ambience: crickets and fire at camp, drips in caves, wind in Frostpine. Crossfades between places. A soft heartbeat fades in only when the Rootline runs low. Separate Music toggle.
- **Feel:** springy buttons with tap sounds, signboards swing in on their ropes, coins fly into the purse, star bursts on purchases, sliding tabs. In the dig: pieces land with a squash, star bursts and shockwave rings, screen shake and a 70 ms hit-stop on big clears, combo callouts, wandering gem glints.
- **Camp:** a full-width night scene with parallax layers, a moon, twinkling stars, a flickering fire light, sparks, smoke, swaying lanterns, a rippling banner and fireflies. Tap Dibble (hop), the fire (sparks), the lanterns (chime), shelf gems (each plays its own note), the tent, and Puddock (if his cart is there).
- **Pilfermoths** (cave critters; tuning in `sim/generator.json → pilfermoths`): after 6 placements, when a tray is dealt, a fluffy moth may flutter onto an empty cell. The chance is 12% in Mossy Hollow, rising to 34% in Heartroot Deep. There's at most 1 at a time (2 in Heartroot). Each new tray, a moth next to crystals nibbles 8% of the haul (a pulsing **!** warns you first), then hops toward glimmer; after 3 nibbles it flies off with the loot. Clearing a line through it, or an ember blast, shoos it: it drops what it took ×1.5 + 4. Never in Calm Grove. Seeded in the Daily Dig. Never affects which pieces are dealt.
- **Not yet modelled in the sims:** `proto/economy.mjs` and `sim/sim.py` don't include Pilfermoths. The numbers above are first guesses; retune after playtest feedback.

## Art direction (2026-10-15): rubber-hose hybrid

The owner compared three takes on the 1930s rubber-hose cartoon look in a style lab and picked the **hybrid**: today's shaded Dibble, re-inked.
- **Characters:** a fluffy scalloped silhouette, bold ink (`#1d120c`), pie-cut eyes that blink, noodle arms. Kept the detail: form shading, a warm lantern rim light, detailed lanterns (metal frames, glass, fireflies), shaded hats, knitted scarves, clawed paws. Old Puddock and the Pilfermoth get the same ink and pie eyes.
- **Board:** gems keep their bevels and glints but get bold ink outlines to sit with the characters. The board itself stays unfiltered so it's easy to read.
- **Filter stack:**
  - Line boil on character SVGs: a feTurbulence displacement re-seeded about 8 times a second, like hand-inked frames.
  - A warm multiply grade with a vignette over everything.
  - Film grain with flicker.
  - A subtle sepia on the forest.
  - Dust specks and hair scratches in menus and camp only.
  - All motion is off when the device asks for reduced motion.
- **Borrowed:** only the era's techniques. No Cuphead (Studio MDHR) character designs.

# Glimmerwood ads

Two short ads made from the real game: its board, clears, pets, camp, title and its own dialogue (`say()`, typing letter by
letter with each speaker's voice blips). The music and sound effects are the game's synth (`proto/music.js`).

```
node scripts/ad/render.mjs                        # both cuts → ad-out/
node scripts/ad/render.mjs --cut cozy             # one cut
node scripts/ad/render.mjs --stills 1,5.2         # those moments as PNGs (add --appstore for the 6.9" shape)
node scripts/ad/render.mjs --live                 # watch it live: http://127.0.0.1:8812/trailer.html?cut=onemore (tap to play)
```

Each cut renders as:

| File | Size | For |
|---|---|---|
| `glimmerwood-<cut>-9x16.mp4` | 1080×1920 | TikTok, Reels, Shorts, YouTube ads. Ends on **Free on the App Store**. |
| `glimmerwood-<cut>-16x9.mp4` | 1920×1080 | YouTube: the vertical cut centred on a blurred copy of itself. |
| `glimmerwood-<cut>-appstore-886x1920.mp4` | 886×1920 | App Store app preview, 6.9" and 6.5" iPhones. Captured again at that screen's shape; **no store line** (Apple disallows prices and store references inside previews). |
| `glimmerwood-<cut>-appstore-1080x1920.mp4` | 1080×1920 | App Store app preview, 5.5" slot: the 9:16 cut with the store line hidden. |
| `glimmerwood-<cut>-contact-sheet.jpg` | | 12 story beats of the 9:16 cut. |

All 30 fps, H.264 High + AAC 48 kHz, BT.709, -16 LUFS. The previews are 27.6 s and 28.4 s (Apple: 15–30 s, ≤ 500 MB).

How it works: `render.mjs` builds `www/`, then serves the game with `scripts/ad/clock.js` in front (virtual time: timers,
animation frames, CSS and SVG animations only move when the capture steps them; `Math.random` is seeded) and
`scripts/ad/trailer.js` appended to the game's module, `main.js` (the scripted timeline, calling the game's own functions).
Each frame is stepped and screenshot. The sounds the timeline played are logged and then replayed through `music.js` in an
OfflineAudioContext, so the audio is sample-placed against the same clock. Same input, same video, every time.

## "One more crystal" (27.6s): quick, funny, a little mystery

| t (s) | Shot | Dialogue / sound |
|---|---|---|
| 0.0 | A dark forest; the mine mouth glows. Dibble walks in with his lantern. | Title theme starts. **Dibble:** "Okay. Just one more crystal." |
| 3.6 | Mossy Hollow. Two drags: a row clears, then two rows (Combo ×2). Shards, coins fly to the Haul. | Clears, coin pops |
| 6.25 | Frostpine Deep. One piece clears three rows and a column: "Glimmering!" | Big clear |
| 8.45 | Gloamcap Grotto. Something is asleep in a crystal. The row clears; it cracks and a Glowcap Sprite bounces out. | Pet arpeggio. **Dibble:** "…you were IN there?" Squeak. |
| 13.1 | Camp: Puddock's stall, Dibble by the fire. | **Puddock** (croaky): "Shiny rocks, shiny coins. Fair trade, little mole." Coin pop: the pet hops onto the counter in a tiny bow. "Everything fits. They're all round." |
| 19.35 | The music drops. An empty tunnel; Granny's chalk "↓ —B" glows on the floor. Something pale drifts past in the dark. | Moth flutters. *Narration:* "Something down here is still glowing." |
| 23.75 | End card: the Glimmerwood title, Dibble, the pet in its bow. | Music back, chime. "Mine glowing crystals before the roots close in." **Free on the App Store** |

## "Cozy" (28.4s): the camp, a calm dig, a new friend, the lanterns coming on

| t (s) | Shot | Dialogue / sound |
|---|---|---|
| 0.0 | The camp at night, fading up: patchwork tent, the fire, the lantern string, the gem shelf. | Camp tune (music box, fire crackle). *Narration:* "At the edge of the Glimmerwood, the fire's always lit." **Dibble:** "Mm. Cozy." |
| 4.8 | Calm Grove dig (no Rootline timer). Slow drags, gentle clears. | **Dibble:** "No timer. No rush. Just crystals." |
| 9.05 | The row through a sleeping Moss Puff clears; it pops out. | **Puddock:** "Crystals keep things, little mole. Sometimes they keep someone." Squeak. |
| 14.55 | By the fire, Dibble tries on outfits (beanie, toadstool cap, flower crown), back to his leaf cap; the Moss Puff gets a mini leaf cap. | A chirp per outfit. **Dibble:** "Matching is the whole point." |
| 20.0 | The whole camp. The lanterns come on one by one. | Rising chimes. *Narration:* "Every crystal brings a little light home." |
| 23.6 | End card over the camp. | Chime. "Glowing crystals, tiny friends, and a fire that's always lit." **Free on the App Store** |

## Renders

**2026-10-17** (this one), from `main` after the App Store prep: the golden-hour lo-fi haze (the camp's painted haze, the
graded cave behind the board; the crystals stay vivid), the new camp layout (Dibble and the fire higher, the hammock by
the sapling, Puddock standing taller at his stall), the world-integrated menus (signboards, the gem shelf), the Rootline
vine timer and the new sound design. Pipeline fixes for the split `index.html` → `main.js` + `style.css` (the director is
now appended to `main.js`; the server had no MIME type for `.css`, so the game rendered unstyled and the board got a
negative cell size), the SVG animation clock (`?smil=live`: the virtual clock alone drives them), the camp pet pinned by
Dibble for the dressing-up shot (the camp's ResizeObserver redraws it under the close-up zoom; the pin now keeps its own
transform and size), the cozy end card's dim (a `css()` call had been swallowed by a comment), dialogue under the board
placed from the board's own geometry (so it works at the 6.9" shape too), and no first-run nudge arrow over the signpost.
Storyboards unchanged. New: the App Store preview variants above.

**2026-10-16**: first renders (PR #26), re-rendered the same day with the crystal-break effects, pets at camp and camp items.

Known: one frame at the cut to the dressing-up close-up (cozy, ~14.6 s, during the fade) shows the pet at Dibble's feet
before the pin takes hold; it is under the fade and not visible at speed.

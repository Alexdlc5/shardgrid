# Glimmerwood ads

Two short ads made from the real game: its board, clears, pets, camp, title and its own dialogue (`say()`, typing letter by
letter with each speaker's voice blips). The music and sound effects are the game's synth (`proto/music.js`).

```
node scripts/ad/render.mjs              # both cuts → ad-out/
node scripts/ad/render.mjs --cut cozy   # one cut
node scripts/ad/render.mjs --live       # watch it live: http://127.0.0.1:8812/trailer.html?cut=onemore (tap to play)
```

Each cut renders as `glimmerwood-<cut>-9x16.mp4` (1080×1920, for TikTok, Reels, Shorts), `-16x9.mp4` (1920×1080, the
vertical cut centred on a blurred copy of itself) and a 12-frame contact sheet. 30 fps, H.264 + AAC, -16 LUFS.

How it works: `render.mjs` builds `www/`, then serves the game with `scripts/ad/clock.js` in front (virtual time: timers,
animation frames, CSS and SVG animations only move when the capture steps them; `Math.random` is seeded) and
`scripts/ad/trailer.js` pasted into the game's module (the scripted timeline, calling the game's own functions). Each frame
is stepped and screenshot. The sounds the timeline played are logged and then replayed through `music.js` in an
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

Notes: App Store app previews must be 15–30s and, for 6.5"/6.9" iPhones, 886×1920; these are 1080×1920 (the 5.5" size and
the social size). Apple also discourages prices in previews, so for the App Store slot the "Free on the App Store" line
may be worth dropping.

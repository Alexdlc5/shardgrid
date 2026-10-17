# Glimmerwood art style

One idea: **a painted storybook lit by a lantern in a dark wood.** Everything is hand-shaped and softly lit. Nothing
is drawn with a stock primitive or a black ink line. The toolkit lives in `proto/paint.js` (`curve`, `ring`, `shape`,
`limb`, `stroke`, `pieEye`), and `proto/art.js` builds every asset from it.

Check your work against every screen at phone resolution: `node scripts/build-web.mjs && node scripts/art-audit.mjs`
(this writes PNGs at 402×874 @3x to `docs/review/art`, plus `00-assets.png` with every icon, gem, item and character).

## 1. Light

- **Cool cave light from the top left** gives every object its highlight: one warm-white highlight stroke or spot,
  top left (`hl()` in icons, the glint on gems and crystals).
- **The far side is shaded:** the right or lower-right part of an object is a darker overlay of its own colour
  (gems' `dk` facets, icons' shade paths at about 20% `#3a2410`).
- **Characters add a warm lantern rim on the right** (Dibble, Puddock, pets). Props don't need one.

## 2. Edges: no ink, a darker self peeking out down-left

- Every painted thing has a copy of its own shape, in **its own colour darkened** (`mix(c, "#1a0f08", .5)`), offset
  **down-left** behind it. That's `shape()` / `I()`. It reads as an edge on the shadow side and vanishes on the lit side.
- **No black or uniform outlines on world art.** If an edge needs more weight, darken the peeking copy or offset it further.
- **Exception: board pieces** (crystals, stones, Pilfermoths) also get a thin rim in their own dark tone all the way
  round, so they stay crisp and readable at tray size (about 20px). They keep the down-left edge too.
- **Exception: UI glyphs** (sound, vibration, gear, back, note, symbols, play) are flat single-colour shapes in
  `currentColor`. They're controls, not things in the world. Anything that *is* a thing (a tent, a jar, a banner) is painted.

## 3. Shadows

- **Anything that stands on the ground casts a soft contact shadow:** a blurred dark ellipse under its base. In camp
  that's `foot()` in `camp()`, used by the tent, banner pole, signpost, fire, Dibble, cart, stump, wardrobe rack,
  chalkboard, bench and stall. The pets get one too (`.cpet .psh`).
- **UI boards hang in front of the scene and cast their shadow straight down** (the wooden sheets, cards and buttons).
  The solid strip under a wooden button is its thickness, not a shadow.
- **Icons inside cards and buttons cast no shadow of their own.**
- **Glow is only for light sources** (lanterns, fire, embers, crystals' own light, memories). It is never used as an edge.

## 4. Colour

- Night greens and browns for the world (`#0f1a14` to `#2f5a2f`, wood `#4f331d` to `#8a5a32`), cream for paper and
  text (`#f6ead0`, `#efe9da`), and amber/gold for anything valuable or interactive (`#f0b543`, `#ffd27a`).
- **Crystals are jewel-bright** (pure, saturated hues: `#5fe85a`, `#00d6a1`, `#ffc414`, `#e8194f`, `#2a6cff`, `#8a52ff`...), shaded toward their own deep tone (never toward grey or teal-black), with a soft light inside. **Their breaks are brighter still** (`vivid()` ×2.05, glows only 6% cream). They're the brightest things on screen: keep props and UI less saturated so the crystals catch the eye.
- Darken with `mix(c, "#1a0f08", t)` (warm) or `mix(c, "#0e1c1a", t)` (cool, for stones and crystals). Never with grey.

## 5. Shape

- Hand-made: corners softened (`box()`), outlines jittered (`ring()`), no perfect circles, rectangles or polygons
  (`rough()` converts them in gem cuts).
- Small faces: pie-cut eyes (`pieEye`), slightly small, no glossy highlights.

## 6. Text

- Display lettering is Grandstander 700, body text Fredoka. Numbers of gold go through `bigG()` (`1,200`, `40M`).

## Checklist for a new asset

1. Built from `paint.js` shapes, with no primitives?
2. Darker self peeking out down-left, and no ink outline (unless it's a board piece)?
3. Highlight top left, shade on the right?
4. If it stands on the ground, does it have a contact shadow?
5. Less saturated than the crystals, unless it's valuable or a light source?
6. Seen on `art-audit.mjs` output at 3x, next to its neighbours?

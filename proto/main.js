// The game: everything index.html used to run inline. Loaded as a module by index.html.
import { N, buildCatalog, canPlace, place, fullLines, lineCells, clearCells, fitsAnywhere, deal,
  rescueCells, breakCells, pureVeinCells, stoneBreak } from "./game.js";

import { gem, coin, icon, dibble, puddock, scene, forest, vine, mystery, camp, lookItem, DEFAULT_LOOK, FUR, memoryArt, stumpArt, granny, bidder, darkLantern, logoSwash, titleScene, titleHero, logoLetters, pet, PET_KINDS, PET_WEAR_SLOT, buildTile, BUILD_KINDS, coinPack } from "./art.js";
import { PROLOGUE, MEMORIES, MEMORY_COUNT, nextMemory, memoryById, mineOfMemory, mineDone, CHALK, PUDDOCK_BY_MINE, PUDDOCK_AFTER, PUDDOCK_POSTGAME,
  CAMP_LINES, SCALE_NOTE, SCENES, nextScene, SITES, GIVEN, MAP_GATE, MURMURS, MURMURS_DEEP, MURMURS_AFTER, PETS, PET_HINT, PET_SHOP } from "./story.js";
import { soundtrack, sfx } from "./music.js";
import { platform, track, COIN_PACKS } from "./platform.js";
import { drawLife, lifeDig, lifeStop, lifeTap, campLife, campPrints } from "./ambient.js";
import { curve, ring, limb, shape, stroke, rng as prng } from "./paint.js";

// ---------- painted UI skins: plank, parchment and carved-recess shapes from paint.js, as 9-slice SVGs for CSS border-image (--p-*) ----------
function uiSkins() {
  const W = 96, H = 48, m = 3.5, rr = 12;
  const outline = (seed) => { // a rounded plank, hand-wobbled; corners stay inside the 18px slice
    const R = prng(seed), j = () => (R() - .5) * 1.6, pts = [];
    const corner = (cx, cy, a0) => { for (let k = 0; k <= 2; k++) { const a = a0 + k * Math.PI / 4; pts.push([cx + Math.cos(a) * rr + j(), cy + Math.sin(a) * rr + j()]); } };
    corner(W - m - rr, m + rr, -Math.PI / 2); pts.push([W - m + j() * .4, H / 2]); corner(W - m - rr, H - m - rr, 0);
    for (const x of [.66, .33]) pts.push([W * x + j() * 3, H - m + j()]);
    corner(m + rr, H - m - rr, Math.PI / 2); pts.push([m + j() * .4, H / 2]); corner(m + rr, m + rr, Math.PI);
    for (const x of [.33, .66]) pts.push([W * x + j() * 3, m + j()]);
    return curve(pts);
  };
  const skin = (fill, line, light, grain, seed, off = [-1.4, 2]) => { // body + darker shadow-side edge, brush grain, a soft light
    const d = outline(seed), R = prng(seed + 9);
    const marks = [...Array(7)].map(() => stroke(8 + R() * 64, 10 + R() * 28, (R() - .5) * .06, 12 + R() * 22, .6 + R() * .5, grain, .4, .03)).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="c"><path d="${d}"/></clipPath>
      <filter id="b" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter></defs>${shape(d, fill, line, off)}
      <g clip-path="url(#c)">${marks}<path d="${curve(ring(34, 9, 30, 6, 10, .25, seed))}" fill="${light}" opacity=".6" filter="url(#b)"/>
      <path d="${curve(ring(62, H - 7, 34, 6, 10, .25, seed + 3))}" fill="${line}" opacity=".22" filter="url(#b)"/></g></svg>`;
  };
  const S = { amber: skin("#eeb04a", "#8a5418", "#ffe7a8", "#c47f22", 11), wood: skin("#7c5434", "#2b1a0e", "#a87c55", "#4f331d", 23),
    moss: skin("#79b863", "#2f5a2a", "#c6f0aa", "#4f8a3e", 37), parch: skin("#f1e2bd", "#a2824c", "#fffaea", "#c9ad78", 41),
    recess: skin("#3a2414", "#8a6a48", "#140a03", "#2a180c", 53, [1.2, 1.6]) };
  for (const k in S) document.documentElement.style.setProperty("--p-" + k, `url("data:image/svg+xml,${encodeURIComponent(S[k])}")`);
}
uiSkins();
// a painted close mark: two tapered brush strokes
const brushX = (size = 20, col = "#f6ead0") => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${stroke(4.5, 4.5, Math.PI / 4, 21, 2.4, col, 1, .04)}${stroke(19.5, 4.5, Math.PI * .75, 21, 2.4, col, 1, -.04)}</svg>`;
const cfg0 = await (await fetch("../sim/generator.json", { cache: "no-cache" })).json();
const $ = (id) => document.getElementById(id);

// ---------- tuning (all Remote Config later) ----------
const T = cfg0.rootline; // timer tuning, shared with sim/sim.py
const CRYSTALS = {
  moss:      { name: "Moss Quartz", color: "#5fe85a", glyph: "●", cut: "brilliant" },
  jade:      { name: "Leaf Jade",   color: "#00d6a1", glyph: "▲", cut: "step" },
  amber:     { name: "Sun Amber",   color: "#ffc414", glyph: "◆", cut: "pear" },
  garnet:    { name: "Garnet",      color: "#e8194f", glyph: "■", cut: "trillion" },
  ember:     { name: "Ember Shard", color: "#ff5414", glyph: "✦", cut: "star" },
  moonstone: { name: "Moonstone",   color: "#e2eaff", glyph: "◐", cut: "cabochon" },
  glowcap:   { name: "Gloamcap", color: "#8a52ff", glyph: "✿", cut: "round" },
  sapphire:  { name: "Pine Sapphire", color: "#2a6cff", glyph: "◇", cut: "step" },
  frost:     { name: "Frostspar",   color: "#5ce6ff", glyph: "❄", cut: "prism" },
  topaz:     { name: "Deep Topaz",  color: "#ff8c1a", glyph: "▼", cut: "trillion" },
  geode:     { name: "Geode",       color: "#d23cff", glyph: "⬢", cut: "geode" },
  heart:     { name: "Rootheart",  color: "#ff3d9a", glyph: "♥", cut: "heart" },
  rubble:    { name: "Skystone",    color: "#8a8a99", glyph: "", cut: "stone" },
};
for (const [k, v] of Object.entries(cfg0.crystals)) Object.assign(CRYSTALS[k], v); // value, ember, bloom, freeze, stone
const GEMS = Object.keys(CRYSTALS).filter((t) => !CRYSTALS[t].stone); // the camp shelf's 12; Skystone is rock
const BIOMES = [ // gameplay (cost, drain, gem weights, shapes) lives in sim/generator.json, shared with the sims
  { id: "hollow", name: "Mossy Hollow", pal: { bg: "#1f3a28", cave: "#101c14", root: "#5a4a32", ground: "#2f5a2f", glow: "#8fd18b", feature: "moss" },
    blurb: "Soft moss, easy veins. Match one crystal type in a line for ×2." },
  { id: "ember", name: "Cinderroot Caverns", pal: { bg: "#3a1f17", cave: "#1c0f0b", root: "#6b2f22", ground: "#2a1610", glow: "#ff6a3d", feature: "lava" },
    blurb: "Embers shatter everything around them, and chain." },
  { id: "grotto", name: "Gloamcap Grotto", pal: { bg: "#241a3a", cave: "#100b1c", root: "#4a3a5a", ground: "#1c1630", glow: "#9b7cf2", feature: "caps" },
    blurb: "Gloamcap gems feed the roots: +1s for every one you break." },
  { id: "frostpine", name: "Frostpine Deep", pal: { bg: "#17283a", cave: "#0a121c", root: "#3a4a5a", ground: "#22364a", glow: "#9fe6ff", feature: "snow" },
    blurb: "Breaking Frostspar freezes the Rootline for a moment." },
  { id: "gulch", name: "Geode Gulch", pal: { bg: "#33281c", cave: "#160f09", root: "#5a4632", ground: "#3a2e20", glow: "#b06ad8", feature: "geode" },
    blurb: "Rare geodes are worth a fortune. Rings of stone get in the way." },
  { id: "heartwood", name: "Heartroot Deep", pal: { bg: "#3a1724", cave: "#1a0a10", root: "#7a3a2a", ground: "#2a1018", glow: "#ff4f7a", feature: "heart" },
    blurb: "The great tree's heart. Every special at once, and Roothearts." },
  { id: "cinder", name: "Cinderthread Run", pal: { bg: "#2e160e", cave: "#140806", root: "#5a2a1a", ground: "#24120c", glow: "#ff8a3d", feature: "scorch" },
    blurb: "The tunnel the fire burned on its way down. Every scorch mark points the same way." },
  { id: "roost", name: "Scalefall Roost", pal: { bg: "#2a2438", cave: "#120e1a", root: "#4a405a", ground: "#221c30", glow: "#e6dcff", feature: "scales" },
    blurb: "A moth nursery. Scales drift like snow, and Pilfermoths are everywhere." },
  { id: "loom", name: "The Moonloom", pal: { bg: "#202436", cave: "#0c0e18", root: "#3e4258", ground: "#1a1e2e", glow: "#f4f0ff", feature: "loom" },
    blurb: "Where the Undermoon is woven. Frostspar and rare geodes in the threads." },
  { id: "wickhold", name: "Wickhold", pal: { bg: "#2e2418", cave: "#140f08", root: "#5a4632", ground: "#241a10", glow: "#ffd27a", feature: "lanterns" },
    blurb: "A village of lanterns around a moon that isn't. Embers, frost and Roothearts." },
  { id: "skywell", name: "The Skywell", pal: { bg: "#1c1c26", cave: "#0a0a10", root: "#3a3a48", ground: "#16161e", glow: "#f4f0ff", feature: "shaft" },
    blurb: "A shaft choked with fallen rock. For once, you dig up." },
].map((b) => ({ families: {}, ...b, ...cfg0.biomes[b.id] }));
const BANNERS = { "#5fa04e": "Moss green", "#c8553d": "Ember red", "#9b7cf2": "Gloamcap violet", "#4f7fe8": "Frost blue", "#f0c75a": "Royal gold" };
const LOOKS = {
  hat: { none: "No hat", leaf: "Leaf cap", mushroom: "Toadstool cap", beanie: "Knit beanie", flowers: "Flower crown", miner: "Miner's helmet", acorn: "Acorn helmet", bandana: "Travel bandana", crown: "First Lantern crown" },
  scarf: { none: "No scarf", "#c8553d": "Ember scarf", "#35b38a": "Jade scarf", "#4f7fe8": "Frost scarf", "#9b7cf2": "Gloam scarf", "#f0c75a": "Gold scarf", "#ef8fb0": "Petal scarf" },
  lantern: { amber: "Amber lantern", paper: "Paper lantern", jar: "Firefly jar", crystal: "Crystal lantern", granny: "Granny's lantern", rose: "Rose lantern", golden: "Golden lantern" },
  fur: { cocoa: "Cocoa fur", sand: "Sand fur", slate: "Slate fur", snow: "Snow fur", rosewood: "Rosewood fur", blossom: "Blossom fur", midnight: "Midnight fur", starfur: "Starfur" },
  trinket: { none: "No trinket", bow: "Pink bow", clip: "Gloamcap clip", locket: "Heart locket", goggles: "Explorer goggles", pendant: "Frostspar pendant", heartstone: "Heartstone pendant" },
  cloak: { none: "No cloak", moss: "Moss cloak", shawl: "Lace shawl", mothwing: "Moth-wing cape", moonsilk: "Moonsilk cloak" },
};
const LOOK_FREE = { hat: ["none", "leaf"], scarf: ["none"], lantern: ["amber"], fur: ["cocoa"], trinket: ["none"], cloak: ["none"] };
const lookOwned = (part, v) => LOOK_FREE[part].includes(v) || save.owned.includes(`look:${part}:${v}`);
const WARDROBE = [
  ["scarf", "#c8553d", 300, "Knitted by a very patient spider"], ["scarf", "#35b38a", 600, "Smells faintly of mint"], ["hat", "mushroom", 800, "Spotted, springy, slightly magical"],
  ["fur", "sand", 1000, "A sunny dye from Puddock's jars"], ["scarf", "#4f7fe8", 1200, "Stays cool, even near embers"], ["hat", "beanie", 1500, "With a pompom that bounces"],
  ["lantern", "paper", 2000, "Glows a warm sunset red"], ["scarf", "#9b7cf2", 2500, "Faintly glows in Gloamcap Grotto"], ["fur", "slate", 3000, "Moody, mysterious, very soft"],
  ["hat", "flowers", 4000, "Picked fresh every morning"], ["lantern", "jar", 5000, "Three fireflies who like you"], ["scarf", "#f0c75a", 6000, "Woven from gold thread"],
  ["fur", "snow", 9000, "White as Frostpine powder"], ["hat", "miner", 12000, "A proper mole's helmet, with a lamp"], ["fur", "rosewood", 15000, "A rare red from Heartroot sap"],
  ["lantern", "crystal", 20000, "Cut from a single Frostspar"],
  ["trinket", "bow", 400, "Granny always said a bow cheers up any tunnel"], ["scarf", "#ef8fb0", 700, "Knitted from the pink wool Granny left behind"],
  ["hat", "bandana", 1100, "Puddock swears it's been past the edge of the map"], ["fur", "blossom", 1800, "Puddock mixed it from crushed petals. Mostly petals."],
  ["cloak", "moss", 2200, "Grown, not sewn. Water it now and then."], ["hat", "acorn", 2800, "Fell from the Glimmeroak itself. Pebble-proof."],
  ["trinket", "clip", 3500, "A gloamcap blossom that never quite stops glowing"], ["trinket", "locket", 5500, "A tiny picture of Granny inside. She's waving."],
  ["trinket", "goggles", 7000, "For peering into veins. Fogs up near embers."], ["cloak", "shawl", 8500, "Granny's spare. Still smells of chamomile."],
  ["fur", "midnight", 11000, "Dark as a mine with the lantern out"], ["trinket", "pendant", 16000, "A sliver of Frostspar, cold as a winter morning"],
  ["lantern", "rose", 26000, "Cut by Puddock's cousin. Don't tell him it's lovely."],
  ["cloak", "mothwing", 45000, "Spun from fallen scales by the Bidder's kin. A thank-you.", (st) => st.site === "skywell"], // after the reunion
].sort((a, b) => a[2] - b[2]);
// pet clothes: one head and one neck item per pet; every item fits every pet (Market Pets tab, once you own a pet)
const PET_WEAR = [["bow", "Little bow", 500, "Granny tied one on every lantern. This one's smaller."], ["leaf", "Mini leaf cap", 900, "Just like Dibble's. Matching is the whole point."],
  ["scarf", "Tiny scarf", 1400, "Knitted on two pine needles"], ["bell", "Bell collar", 2200, "So you can hear them hop"], ["goggles", "Tiny goggles", 3500, "For very small explorers"],
  ["acorn", "Acorn cap", 5000, "The smallest acorn Puddock could find. He looked for a week."], ["crown", "Tiny crown", 9000, "Puddock says it's real gold. Puddock says a lot of things."]];
// Someday: very long-term goals for after the mines run out. Priced from the economy sim (see the PR that added them): a regular late-game player
// makes about 350k gold a day, so the cheapest take one to two weeks, the middle three to four, the last one to three months.
// Gated ones show "Unlocks ..." and a teaser instead of their lore, so nothing is spoiled.
const GATES = { ledge: [(st) => st.ledge, "Unlocks deeper in the story"], reunion: [(st) => st.site === "skywell", "Unlocks later in the story"], finale: [(st) => st.finale, "Unlocks after the last chapter"] };
const TREASURES = [
  { id: "decor:lamps", name: "Wickway lamp posts", price: 3500000, desc: "Two posts from the old Wickway. Puddock found them. He won't say where." },
  { part: "trinket", val: "heartstone", name: "Heartstone pendant", price: 4000000, desc: "A chip of Rootheart, warm as a paw. Every so often it beats." },
  { part: "lantern", val: "golden", name: "Golden lantern", price: 5000000, desc: "Puddock's cousin made it. Puddock says it's gaudy. Puddock is jealous." },
  { id: "decor:wall", name: "Wall of Names", price: 8000000, desc: "Every Lantern Mole who ever lit a tunnel, carved in amber-wood. There's room for one more.", gate: "reunion", tease: "Some names deserve to be carved where everyone can see them." },
  { part: "cloak", val: "moonsilk", name: "Moonsilk cloak", price: 9000000, desc: "Woven from moonlight and patience. Mostly patience. Weighs less than a sigh." },
  { id: "decor:roost", name: "Moth roost", price: 12000000, desc: "A little silk moon on a pole. Lost moths stop here to find their way.", gate: "ledge", tease: "Someone small and fluttery needs a place to rest." },
  { part: "fur", val: "starfur", name: "Starfur dye", price: 14000000, desc: "Fur as dark as a clear night, with stars in it. They move when you're not looking." },
  { id: "decor:tower", name: "Lantern tower", price: 20000000, desc: "Lanterns all the way up. You'll never come home to a dark camp again." },
  { part: "hat", val: "crown", name: "Crown of the First Lantern", price: 26000000, desc: "The first Lantern Mole wore it to light the first tunnel. Granny says it suits you.", gate: "reunion", tease: "Fit for whoever lights the way." },
  { id: "decor:mirror", name: "Moonlight mirror", price: 30000000, desc: "Catches the moonlight pouring down the Skywell and shares it round camp.", gate: "finale", tease: "It needs a light that isn't here yet." },
].map((t) => ({ ...t, treasure: true, ...(t.part ? { id: `look:${t.part}:${t.val}`, tab: "wardrobe", kind: "look" } : { tab: "camp", kind: "camp" }) }));
const SHOP = [
  // Tools: permanent upgrades, price ×1.6 per level
  { id: "lantern", tab: "tools", icon: "lantern", kind: "up", name: "Lantern", desc: "+5s of Rootline", base: 150, max: 15 },
  { id: "pick", tab: "tools", icon: "pickaxe", kind: "up", name: "Pickaxe", desc: "+10% crystal value", base: 200, max: 15 },
  { id: "charm", tab: "tools", icon: "charm", kind: "up", name: "Root Charm", desc: "+10% time from every vein", base: 180, max: 15 },
  { id: "lens", tab: "tools", icon: "lens", kind: "up", name: "Gem Lens", desc: "Pure veins pay +0.5× more", base: 900, max: 6 },
  { id: "tongs", tab: "tools", icon: "tongs", kind: "up", name: "Ember Tongs", desc: "+25% gold from crystals an ember shatters", base: 3000, max: 6 },
  { id: "sieve", tab: "tools", icon: "sieve", kind: "up", name: "Lucky Sieve", desc: "Geodes and Roothearts turn up 15% more", base: 25000, max: 5 },
  { id: "dewdrop", tab: "tools", icon: "dewdrop", kind: "once", name: "Dewdrop pouch", desc: "More tiny 1-cell crystals in your trays", price: 900 },
  // Wardrobe: Dibble's looks
  ...WARDROBE.map(([part, val, price, desc, gate]) => ({ id: `look:${part}:${val}`, tab: "wardrobe", kind: "look", part, val, name: LOOKS[part][val], desc, price, gate })),
  // Camp: looks only, shown at Dibble's Camp
  { id: "tent:patchwork", tab: "camp", icon: "tent", kind: "camp", name: "Patchwork tent", desc: "Scraps from every mine, stitched by Dibble", price: 1500 },
  { id: "tent:treehouse", tab: "camp", icon: "tent", kind: "camp", name: "Treehouse", desc: "A ladder, a lookout, a lamp in the window", price: 20000 },
  { id: "tent:pavilion", tab: "camp", icon: "tent", kind: "camp", name: "Crystal pavilion", desc: "A roof of Frostspar that hums at night", price: 90000 },
  ...Object.entries(BANNERS).slice(1).map(([c, n], k) => ({ id: "banner:" + c, tab: "camp", icon: "banner", color: c, kind: "camp", name: `${n} banner`, desc: "Fly your colours over camp", price: [400, 2500, 8000, 40000][k] })),
  { id: "fire:forge", tab: "camp", icon: "forge", kind: "camp", name: "Stone forge", desc: "Swap the campfire for a roaring forge", price: 12000 },
  { id: "decor:mushrooms", tab: "camp", icon: "mushroom", kind: "camp", name: "Gloamcap garden", desc: "Mushrooms that light the path home", price: 3000 },
  { id: "decor:jars", tab: "camp", icon: "jar", kind: "camp", name: "Firefly jars", desc: "Borrowed fireflies (they come back)", price: 5000 },
  { id: "decor:hammock", tab: "camp", icon: "hammock", kind: "camp", name: "Moss hammock", desc: "For naps between digs", price: 9000 },
  { id: "decor:cart", tab: "camp", icon: "cart", kind: "camp", name: "Puddock's spare cart", desc: "He says it's a loan. It isn't.", price: 60000 },
  { id: "fireflies", tab: "camp", icon: "fireflies", kind: "once", name: "Firefly roots", desc: "Fireflies drift along your Rootline while you dig", price: 600 },
  ...TREASURES,
  ...PET_WEAR.map(([val, name, price, desc]) => ({ id: "pet:" + val, tab: "pets", kind: "petwear", slot: PET_WEAR_SLOT[val], val, name, desc, price })),
  // Maps
  ...BIOMES.slice(1).filter((b) => !GIVEN[b.id]).map((b) => ({ id: "biome:" + b.id, tab: "maps", icon: "map", kind: "biome", name: `Map to ${b.name}`, desc: b.blurb, price: b.cost })),
];

// ---------- save (per-browser) ----------
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem("gw." + k)) ?? d; } catch { return d; } },
                set(k, v) { const s = JSON.stringify(v); try { localStorage.setItem("gw." + k, s); } catch {} platform.backup("gw." + k, s); } }; // backup: a native copy (platform.js)
const DEFAULTS = { look: { ...DEFAULT_LOOK, trinket: "none", cloak: "none" }, gold: 0, up: { lantern: 0, pick: 0, charm: 0, lens: 0, tongs: 0, sieve: 0 }, owned: [], biomes: ["hollow"], best: {}, sel: "hollow",
  mode: "exp", opt: { music: true, sound: true, silent: false, vib: true, glyph: false }, daily: { last: "", streak: 0, best: 0 },
  metPuddock: false, trial: [], found: [], camp: { tent: "canvas", banner: "#5fa04e", fire: "ring", hide: [] },
  story: { prologue: false, mem: [], confessed: false, sprout: false, site: "stump", ledge: false, finale: false, scale: false },
  pets: { owned: [], active: [], wear: {} }, coinTx: [] }; // coinTx: coin-pack transactions already paid out (platform.buyCoins); active: the pets out at camp; wear: { [pet]: { head, neck } }
// a one-off fresh start (the owner's play-through, 2026-10-17): runs once per device, the tag lives in the save itself;
// coinTx stays so no coin pack is paid out twice. Bump the tag to wipe everyone's progress again.
const RESET = "2026-10-17", kept = store.get("save", {}), stored = kept.reset === RESET ? kept : { reset: RESET, coinTx: kept.coinTx || [] };
if (stored.opt && stored.opt.music === undefined) stored.opt.music = true;
const save = { ...DEFAULTS, ...stored, up: { ...DEFAULTS.up, ...stored.up }, look: { ...DEFAULTS.look, ...stored.look }, camp: { ...DEFAULTS.camp, ...stored.camp }, story: { ...DEFAULTS.story, ...stored.story }, pets: { ...DEFAULTS.pets, ...stored.pets } };
if (!Array.isArray(save.pets.active)) save.pets.active = save.pets.active && save.pets.active !== "none" ? [save.pets.active] : []; // older saves had one pet out (or "none")
save.light ??= save.gold; // lifetime gold sold: the light Dibble has given back to the roots (grows the stump)
const CALM_MULT = 0.6;
const PUDDOCK = ["\"Fine rocks. Finer than my cousin's, anyway.\"", "\"Every vein you break, the roots grow kinder.\"",
  "\"Slow digging is still digging, little mole.\"", "\"Hmph. I've seen worse hauls. Mine, mostly.\"",
  "\"The Glimmerwood remembers good miners.\"", "\"Pure veins! Now that's a mole with an eye.\"",
  "\"Rest your paws. The crystals will wait.\"", "\"Coins for crystals. Fair as rain.\""];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const quote = (t) => `"${t}"`;
function puddockLine() { // half the time a line from this mine's chapter; after the confession his tone changes
  const mine = daily ? [] : PUDDOCK_BY_MINE[biome.id] || [];
  if (Math.random() < .5 && mine.length) return quote(pick(mine));
  if (save.story.finale && Math.random() < .6) return quote(pick(PUDDOCK_POSTGAME));
  return save.story.confessed && Math.random() < .6 ? quote(pick(PUDDOCK_AFTER)) : pick(PUDDOCK);
}
const today = () => new Date().toISOString().slice(0, 10);
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const qs = new URLSearchParams(location.search);
const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches; // the title paints its glints only when motion is welcome
if (qs.has("gold")) save.gold = +qs.get("gold"); // ?gold=5000 to try the market quickly
const persist = () => store.set("save", save);
const price = (it) => it.kind === "up" ? Math.round(it.base * 1.6 ** save.up[it.id]) : it.price;
const valueMult = () => (1 + 0.1 * save.up.pick) * (calm ? CALM_MULT : 1) * (biome?.richness || 1); // deeper veins are purer
const mapShown = (id) => !MAP_GATE[id] || MAP_GATE[id](save.story) || save.biomes.includes(id);
const revealed = (b) => !GIVEN[b.id] && !MAP_GATE[b.id] || save.biomes.includes(b.id) || (MAP_GATE[b.id] && mapShown(b.id)); // no spoilers on the mine list
const canEnter = (id) => save.biomes.includes(id) || save.trial.includes(id);

// ---------- audio (synth, no assets): one soft set of woody knocks and crystal tines, in music.js ----------
sfx.isOn = () => save.opt.sound;
const tone = (...a) => { try { sfx.tone(...a); } catch {} };
const ui = { tap: () => sfx.tap(), buy: () => sfx.buy(), whoosh: () => sfx.whoosh(), chirp: () => sfx.chirp() };
// haptics: the native Taptic engine in the app (@capacitor/haptics), vibrate() in browsers that allow it (not iOS Safari)
const Haptics = window.Capacitor?.Plugins?.Haptics;
const buzz = (ms) => {
  if (!save.opt.vib) return;
  if (Haptics) { try { Haptics.impact({ style: ms >= 40 ? "HEAVY" : ms >= 15 ? "MEDIUM" : "LIGHT" }).catch(() => {}); } catch {} return; }
  if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(ms); // browsers block vibrate before a tap
};

// ---------- layout ----------
const cv = $("cv"); let ctx = cv.getContext("2d"); // swapped briefly to paint the board into a cache
let W, H, cell, bx, by, trayY, trayH, trayX, slotW, ts, hintY, haulAt = [0, 0];
// The board fills the width (side margins keep the Rootline and its leaves on screen) and starts below the HUD, measured,
// so a long mine name never overlaps it. Spare height on tall phones goes mostly between the board and the tray.
function layout() {
  const dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight;
  const sb = parseFloat(getComputedStyle($("safeProbe")).paddingBottom) || 0;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // iOS: if the web view starts at 1x (before it's on screen), WebKit keeps showing the canvas through a 1x layer even after
  // the canvas is resized to 3x: the HTML is crisp and the board looks like a 3x upscale (measured: 9 px edges vs 2 px in WebKit).
  // Taking the canvas out of the render tree and back makes WebKit build a fresh layer at today's scale. The pixels survive.
  cv.style.display = "none"; void cv.offsetWidth; cv.style.display = "";
  hudTop = $("hud").getBoundingClientRect().top;
  const top = $("hud").getBoundingClientRect().bottom + 30, bottom = H - sb - 8, GAP = 54, TR = 3.1; // 30: Rootline + leaves; GAP: Rootline + hint line
  cell = Math.floor(Math.min((W - 64) / N, (bottom - top - GAP) / (N + TR)));
  const spare = Math.max(0, bottom - top - GAP - cell * (N + TR));
  bx = Math.round((W - cell * N) / 2); by = Math.round(top + spare * .2);
  trayY = by + cell * N + GAP + spare * .45; trayH = cell * TR; hintY = (by + cell * N + 26 + trayY) / 2 + 5;
  slotW = Math.min(W - 16, cell * N + 48) / 3; trayX = (W - slotW * 3) / 2; ts = Math.min(cell * .6, slotW * .92 / 5);
  const hc = $("coinHud").getBoundingClientRect(); haulAt = [hc.left + hc.width / 2, hc.top + hc.height / 2];
  bgCache = null;
}
let hudTop = 0; // where ambient life may fly: from the HUD's top down to the board
addEventListener("resize", layout);
// and whenever the pixel density or the visible area changes (an app can be measured before its screen is settled,
// which would leave the board on a low-res canvas for the whole session); every dig re-measures too
visualViewport?.addEventListener("resize", layout);
const watchDpr = () => matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener("change", () => { layout(); watchDpr(); }, { once: true }); watchDpr();
// diagnostics: hold a finger on the Haul box for a second and a half to see how the board's canvas is set up
let diagT; addEventListener("pointerdown", (e) => { const r = $("hud").firstElementChild.getBoundingClientRect();
  if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) diagT = setTimeout(() =>
    toast(`<small>dpr ${devicePixelRatio} · view ${innerWidth}×${innerHeight} · canvas ${cv.width}×${cv.height} (css ${cv.style.width} × ${cv.style.height}) · scale ${ctx.getTransform().a} · zoom ${(visualViewport?.scale ?? 1).toFixed(2)}</small>`, 7000), 1500); });
for (const ev of ["pointerup", "pointercancel"]) addEventListener(ev, () => clearTimeout(diagT));

// ---------- color helpers ----------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t))})`; };
const calmMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const easeOut = (t) => 1 - (1 - t) ** 3, easeBack = (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;
const lerpHex = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");

// ---------- round state ----------
let biome, cat, board, meta, tray, uid, combo, miss, rescueUsed, state = "home", endCause, calm = false, daily = false, rng = Math.random;
let newMem = [], newPets = [], frees = [], petHop = 0, petDress = null; // pets freed this dig, their release animations, the peeking pet's last hop
let cracked = new Set(); // rubble stone cells with one crack
let stolen = 0, moths = [], placedN = 0, mothRng = Math.random, bonus = 0, frozenUntil = 0, time, maxTime, started, haul, floats = [], parts = [];
function catalogFor(b) {
  const fam = { ...structuredClone(cfg0.families), ...b.families };
  if (save.owned.includes("dewdrop")) fam.dot.weight += 4;
  return buildCatalog({ ...cfg0, families: fam });
}
function pickType() {
  const rare = (t) => (t === "geode" || t === "heart" ? 1 + .15 * save.up.sieve : 1);
  const e = Object.entries(biome.types).map(([t, w]) => [t, w * rare(t)]), total = e.reduce((s, [, w]) => s + w, 0);
  let x = rng() * total;
  for (const [t, w] of e) if ((x -= w) < 0) return t;
  return e[0][0];
}
const dealTray = () => {
  const t = deal(rng, board, cat, cfg0).map((piece) => ({ piece, type: pickType() })); dealtAt = performance.now(); back = [];
  // ponytail: one memory in play at a time, ~1 in 7 trays after a few placements; separate RNG so dealing stays untouched
  const next = !daily && biome && nextMemory(biome.id, save.story.mem), inPlay = Object.values(meta || {}).some((m) => m.memory) || tray?.some((q) => q?.memory);
  if (next && !inPlay && placedN >= 3 && Math.random() < .15) Object.assign(t[Math.floor(Math.random() * 3)], { type: "amber", memory: next.id });
  // a pet asleep in one cell of a crystal: one at a time, same separate RNG; the crystal keeps its own type
  const petIn = Object.values(meta || {}).some((m) => m.pet) || tray?.some((q) => q?.pet), kind = !daily && biome && !petIn && placedN >= 3 && petFor(biome.id);
  const slots = kind ? t.filter((q) => !q.memory && !CRYSTALS[q.type].stone) : [];
  if (slots.length) { const q = slots[Math.floor(Math.random() * slots.length)]; Object.assign(q, { pet: kind, petCell: Math.floor(q.piece.cells.length / 2) }); }
  return t;
};
// which pet (if any) sleeps in this tray: after the first, ~1.8% of trays with six still to find, ~0.7% with one left (all seven in
// ~90 digs, a week or two), none once all are found;
// a mine's own pets are 6x likelier there. Odds in docs/STORY.md ("Pets").
// The first pet comes quickly: 2% a tray for the first 8 trays (about a dig), then 35%, so it turns up in dig 2 or 3.
function petFor(mine) {
  const left = PET_KINDS.filter((k) => !save.pets.owned.includes(k)), first = left.length === PET_KINDS.length;
  if (first) save.petDry = (save.petDry || 0) + 1; // trays dealt with no pet yet (saved with the next persist)
  if (!left.length || Math.random() >= (first ? (save.petDry > 8 ? .35 : .02) : .005 + .015 * left.length / PET_KINDS.length)) return null;
  const w = left.map((k) => (PETS[k].home.includes(mine) ? 6 : 1)); let x = Math.random() * w.reduce((a, b) => a + b);
  return left.find((_, i) => (x -= w[i]) < 0);
}
const typeOf = (u) => (u === -1 ? drag?.type : meta[u]?.type);
const isEmber = (u) => !!CRYSTALS[typeOf(u)]?.ember;
const isStone = (u) => !!CRYSTALS[typeOf(u)]?.stone;

function startDig(isDaily = false) {
  layout(); // measure afresh: the board is drawn at the phone's full resolution
  daily = isDaily; calm = !daily && save.mode === "calm";
  rng = daily ? mulberry(+today().replaceAll("-", "")) : Math.random; // same crystals for everyone today
  if (!daily && !canEnter(save.sel)) save.sel = "hollow";
  biome = BIOMES.find((b) => b.id === (daily ? "hollow" : save.sel)); cat = daily ? buildCatalog(cfg0) : catalogFor(biome);
  if (!daily && !save.biomes.includes(biome.id)) { // Puddock's trial map: one entry, then it crumbles
    save.trial = save.trial.filter((x) => x !== biome.id); persist();
    setTimeout(() => toast("Puddock's old map crumbles as you step inside.<br><small>One dig, make it count!</small>", 2600), 300);
  }
  bonus = 0; stolen = 0; moths = []; placedN = 0; newMem = []; newPets = []; frees = []; meta = {}; tray = null;
  mothRng = daily ? mulberry(+today().replaceAll("-", "") + 777) : Math.random; // daily: same moths for everyone
  board = Array(64).fill(0); cracked = new Set(); meta = {}; uid = 1; combo = 0; miss = 0; rescueUsed = false;
  haul = {}; frozenUntil = 0; maxTime = T.max_time + 5 * save.up.lantern; time = maxTime; started = false;
  tray = dealTray(); state = "play"; show(null);
  soundtrack.play(daily ? "hollow" : biome.id);
  $("biomeName").textContent = daily ? `Daily Dig · ${today()}` : biome.name + (calm ? " · Calm" : "");
  $("comboTxt").textContent = ""; ending = null; tip = null; coins = []; pops = []; floats = []; parts = []; fx = []; fxR = mulberry(7); shownHaul = 0; layout();
  track("round_start", { mine: biome.id, mode: daily ? "daily" : calm ? "calm" : "expedition" });
  pawPrints = false; lifeDig(["fur", "hat", "scarf", "lantern"].map((p) => [p, Object.keys(LOOKS[p]).filter((v) => v !== "granny")]), !daily && Object.keys(save.best).length > 0);
}
const rawHaul = () => Object.entries(haul).reduce((s, [t, n]) => s + n * CRYSTALS[t].value, 0) + bonus;
const haulValue = () => Math.max(0, Math.round((rawHaul() - stolen) * valueMult()));

// ---------- Pilfermoths: fluffy cave moths drawn to glimmer. They nibble your haul; clear a line through one to
// shoo it and it drops everything it took, plus a bit. They never touch how pieces are dealt.
const PM = cfg0.pilfermoths;
const isMoth = (u) => meta[u]?.type === "moth";
const nbrs = (i, diag) => { const r = Math.floor(i / N), c = i % N, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; if (!diag && dr && dc) continue;
    const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc); } return out; };
const crystalNbrs = (i) => nbrs(i, true).filter((j) => board[j] && !isMoth(board[j])).length;
const mothXY = (i) => [bx + (i % N + .5) * cell, by + (Math.floor(i / N) + .5) * cell];
function mothTurn() {
  if (calm) return; // Calm Grove stays calm
  for (const m of [...moths]) {
    if (crystalNbrs(m.i) && rawHaul() - stolen > 0) { // nibble
      const amt = Math.max(1, Math.round((rawHaul() - stolen) * PM.nibble_share));
      stolen += amt; m.stolen += amt; m.nibbles++; m.nibbleAt = performance.now();
      const [x, y] = mothXY(m.i); float(`-${Math.round(amt * valueMult())}g`, x, y - cell * .4, "#ff8f8f");
      sfx.nibble(); buzz(12);
      if (m.nibbles >= PM.max_nibbles) { // flies off with it
        board[m.i] = 0; moths = moths.filter((x) => x !== m);
        pops.push({ text: "It flew off!", life: 1, col: "#ff8f8f" }); [880, 660, 440].forEach((f, k) => tone(f, .12, "triangle", .05, k * .06));
        continue;
      }
    }
    const step = nbrs(m.i, false).filter((j) => !board[j]).sort((a, b) => crystalNbrs(b) - crystalNbrs(a))[0]; // hop toward glimmer
    if (step !== undefined) { board[step] = m.uid; board[m.i] = 0; m.from = m.i; m.i = step; m.hopAt = performance.now(); }
  }
  const max = PM.max_alive[biome.id] || PM.max_alive.default;
  if (placedN >= PM.grace_placements && moths.length < max && mothRng() < (PM.chance[biome.id] || 0)) { // a new one flutters in
    const empty = board.map((u, i) => (u ? -1 : i)).filter((i) => i >= 0).sort((a, b) => crystalNbrs(b) - crystalNbrs(a));
    if (empty.length > 3) {
      const i = empty[Math.floor(mothRng() * Math.min(6, empty.length))], id = 900000 + uid++;
      meta[id] = { type: "moth" }; board[i] = id; moths.push({ uid: id, i, from: i, stolen: 0, nibbles: 0, hopAt: performance.now(), bornAt: performance.now() });
      pops.push({ text: "A Pilfermoth!", life: 1, col: "#c9b6ff" }); sfx.moth();
    }
  }
}
function shooMoths(cells) { // called with the cells a clear is about to remove
  let loot = 0;
  for (const k of cells) { const m = moths.find((x) => x.uid === board[k]); if (!m) continue;
    loot += m.stolen * PM.loot_mult + PM.loot_bonus; stolen -= m.stolen; moths = moths.filter((x) => x !== m);
    if (!save.story.scale) { save.story.scale = true; persist(); setTimeout(() => toast(`<i>${SCALE_NOTE}</i>`, 2600), 500); }
    const [x, y] = mothXY(m.i); starBurst(x, y, 14, "#c9b6ff");
    pops.push({ text: "Shooed!", life: 1, col: "#c9b6ff" }); [784, 988, 1319].forEach((f, k) => tone(f, .14, "sine", .06, k * .05)); }
  bonus += loot; return loot;
}
function drawMoth(m, now) {
  const t = Math.min(1, (now - m.hopAt) / 260), [x0, y0] = mothXY(m.from), [x1, y1] = mothXY(m.i);
  const born = Math.min(1, (now - m.bornAt) / 400), s = cell * .5 * (born < 1 ? .4 + .6 * born : 1);
  const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * cell * .35 + Math.sin(now / 280 + m.uid) * cell * .04;
  const flap = Math.sin(now / 70 + m.uid) * .3, wig = now - (m.nibbleAt || 0) < 300 ? Math.sin(now / 25) * .12 : 0;
  const fur = "#b6a3e6", furLine = mix(fur, "#1a0f08", .62), wing = "#efe6fb", wingLine = mix("#c9b6ff", "#1a0f08", .5);
  const radial = (cx, cy, r, c0, c1, c2) => { const g = ctx.createRadialGradient(cx - r * .35, cy - r * .4, 0, cx, cy, r * 1.1); g.addColorStop(0, c0); g.addColorStop(.6, c1); g.addColorStop(1, c2); return g; };
  ctx.save(); ctx.translate(x, y); ctx.rotate(wig); ctx.lineJoin = "round"; ctx.lineCap = "round";
  { const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.5); hg.addColorStop(0, "rgba(201,182,255,.16)"); hg.addColorStop(1, "rgba(201,182,255,0)"); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0, 0, s * 1.5, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(0, s * .78, s * .55, s * .12, 0, 0, 7); ctx.fill(); // ground shadow
  for (const side of [-1, 1]) { // dusty wings: graded, veined, with a soft eyespot
    ctx.save(); ctx.scale(side, 1); ctx.rotate(-.45 + flap);
    const wg = ctx.createLinearGradient(s * .2, -s * .8, s * 1.4, s * .2); wg.addColorStop(0, "#ffffff"); wg.addColorStop(.6, wing); wg.addColorStop(1, "#cbbbe8");
    ctx.fillStyle = wg; ctx.strokeStyle = wingLine; ctx.lineWidth = Math.max(.8, s * .035);
    ctx.beginPath(); ctx.moveTo(s * .2, -s * .1); ctx.bezierCurveTo(s * .5, -s * .95, s * 1.45, -s * .85, s * 1.42, -s * .2); ctx.bezierCurveTo(s * 1.4, s * .2, s * .8, s * .3, s * .2, s * .15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(150,120,200,.35)"; ctx.lineWidth = Math.max(.6, s * .025); ctx.beginPath();
    ctx.moveTo(s * .25, 0); ctx.quadraticCurveTo(s * .8, -s * .5, s * 1.25, -s * .55); ctx.moveTo(s * .25, .02 * s); ctx.quadraticCurveTo(s * .8, -s * .05, s * 1.3, -s * .1); ctx.stroke();
    ctx.fillStyle = "rgba(160,130,215,.45)"; ctx.beginPath(); ctx.arc(s * 1.02, -s * .38, s * .16, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,246,216,.85)"; ctx.beginPath(); ctx.arc(s * 1.02, -s * .38, s * .07, 0, 7); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = furLine; ctx.lineWidth = Math.max(1, s * .045); // feathery antennae
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(side * s * .18, -s * .52); ctx.quadraticCurveTo(side * s * .3, -s * 1.08, side * s * .62, -s * 1.12); ctx.stroke();
    ctx.lineWidth = Math.max(.6, s * .025); ctx.beginPath();
    for (let k = 1; k <= 4; k++) { const u = k / 5, ax = side * (s * .18 + (s * .44) * u), ay = -s * .52 - s * .58 * Math.sin(u * 1.4); ctx.moveTo(ax, ay); ctx.lineTo(ax + side * s * .1, ay - s * .08); }
    ctx.stroke(); ctx.lineWidth = Math.max(1, s * .045);
  }
  ctx.fillStyle = radial(0, 0, s * .62, "#ddd2fa", fur, mix(fur, "#000000", .3)); ctx.strokeStyle = furLine; ctx.lineWidth = Math.max(.9, s * .045);
  ctx.beginPath(); ctx.arc(0, 0, s * .62, 0, 7); ctx.fill(); ctx.stroke(); // fluffy body
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = Math.max(.8, s * .035); ctx.beginPath(); ctx.arc(0, 0, s * .5, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
  ctx.fillStyle = radial(0, s * .36, s * .38, "#fffbee", "#f6ead0", "#d9c9a6"); ctx.strokeStyle = mix("#f6ead0", "#1a0f08", .5); ctx.lineWidth = Math.max(.8, s * .035);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * .6, 0, 7); ctx.clip(); // soft fluffy ruff low on the chest, clipped to the body
  for (const [fx, fy, fr] of [[-.36, .5, .2], [-.18, .56, .22], [0, .58, .23], [.18, .56, .22], [.36, .5, .2]]) { ctx.beginPath(); ctx.arc(fx * s, fy * s, fr * s, 0, 7); ctx.fill(); }
  ctx.restore();
  for (const side of [-1, 1]) { // pie-cut eyes, like Dibble's
    const ex = side * s * .22, ey = -s * .07, w = s * .15, h = s * .2, pw = w * .78, ph = h * .8, px = ex + s * .02, py = ey + h * .12;
    ctx.fillStyle = "#fffaf0"; ctx.strokeStyle = furLine; ctx.lineWidth = Math.max(.8, s * .04);
    ctx.beginPath(); ctx.ellipse(ex, ey, w, h, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#241812"; ctx.beginPath(); ctx.ellipse(px, py, pw, ph, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#fffaf0"; ctx.beginPath(); ctx.moveTo(px, py); ctx.ellipse(px, py, pw, ph, 0, -Math.PI * .42, -Math.PI * .08); ctx.closePath(); ctx.fill();
  }

  const bl = ctx.createRadialGradient(0, 0, 0, 0, 0, s * .12); bl.addColorStop(0, "rgba(255,143,163,.55)"); bl.addColorStop(1, "rgba(255,143,163,0)");
  for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * s * .4, s * .08); ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(0, 0, s * .12, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = furLine; ctx.lineWidth = Math.max(.7, s * .03); ctx.beginPath(); ctx.moveTo(-s * .06, s * .1); ctx.quadraticCurveTo(0, s * .15, s * .06, s * .1); ctx.stroke();
  if (m.stolen > 0) { // burlap loot sack, grows with what it took
    const k = Math.min(1, m.stolen / 40), r = s * (.2 + .12 * k), sx = s * .58, sy = s * .52;
    ctx.fillStyle = radial(sx, sy, r, "#e8cf98", "#c9a46a", "#8a6a3a"); ctx.strokeStyle = "#5a4024"; ctx.lineWidth = Math.max(.8, s * .035);
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - r * .5, sy - r * .8); ctx.lineTo(sx + r * .5, sy - r * .8); ctx.stroke();
    ctx.fillStyle = "#f0c75a"; ctx.strokeStyle = "#a8761a"; ctx.beginPath(); ctx.arc(sx + r * .2, sy - r * .95, r * .32, 0, 7); ctx.fill(); ctx.stroke();
  }
  if (crystalNbrs(m.i) && m.nibbles < PM.max_nibbles) { // warning: it nibbles when the next tray is dealt
    const pulse = 1 + .15 * Math.sin(now / 120); ctx.font = `700 ${Math.round(s * .9 * pulse)}px Fredoka, sans-serif`; ctx.textAlign = "center";
    ctx.lineWidth = 3; ctx.strokeStyle = "#3a2418"; ctx.strokeText("!", 0, -s * 1.3); ctx.fillStyle = "#ff8f8f"; ctx.fillText("!", 0, -s * 1.3); }
  ctx.restore();
}


// ---------- crystal drawing ----------
// ?nolayer=glow,shadow,inner,bevel,bg switches drawing layers off, for measuring edge sharpness (scripts/crisp.mjs)
const NOLAYER = new Set((new URLSearchParams(location.search).get("nolayer") || "").split(","));
function drawCrystal(cells, color, box, size, ox, oy, alpha = 1, glow = .35, glyph = "", cut = "brilliant") {
  if (!cells.length) return;
  { // land every cell edge on a whole device pixel (whatever scale the context is under), so edges never straddle two pixels
    const m = ctx.getTransform(); if (m.a > 0 && !m.b && !m.c) { size = Math.round(size * m.a) / m.a; ox = (Math.round(ox * m.a + m.e) - m.e) / m.a; oy = (Math.round(oy * m.d + m.f) - m.f) / m.d; } }
  const x0 = ox + box.c * size, y0 = oy + box.r * size, bw = box.w * size, bh = box.h * size;
  const own = new Set(cells.map(([r, c]) => r * 100 + c)), edgeOf = (r, c, dr, dc) => !own.has((r + dr) * 100 + c + dc);
  const outline = () => { ctx.beginPath(); // the piece's outer edges only (no grid lines inside)
    for (const [r, c] of cells) { const x = ox + c * size, y = oy + r * size;
      if (edgeOf(r, c, -1, 0)) { ctx.moveTo(x, y); ctx.lineTo(x + size, y); } if (edgeOf(r, c, 1, 0)) { ctx.moveTo(x, y + size); ctx.lineTo(x + size, y + size); }
      if (edgeOf(r, c, 0, -1)) { ctx.moveTo(x, y); ctx.lineTo(x, y + size); } if (edgeOf(r, c, 0, 1)) { ctx.moveTo(x + size, y); ctx.lineTo(x + size, y + size); } } };
  ctx.save(); ctx.globalAlpha = alpha;
  // its glow: the baked sprite behind each cell, never canvas shadowBlur (iOS draws that far wider, a soft halo over every edge)
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = alpha * Math.min(1, glow * 1.1);
  if (!NOLAYER.has("glow")) for (const [r, c] of cells) { const gs = size * 1.9; ctx.drawImage(glowSpr(color, true), ox + (c + .5) * size - gs / 2, oy + (r + .5) * size - gs / 2, gs, gs); }
  ctx.restore();
  if (!NOLAYER.has("shadow")) { ctx.fillStyle = mix(color, "#000000", .55); ctx.beginPath(); } for (const [r, c] of cells) if (!NOLAYER.has("shadow")) ctx.rect(ox + c * size - size * .05, oy + r * size + size * .045, size + .5, size + .5); if (!NOLAYER.has("shadow")) ctx.fill();
  ctx.beginPath(); for (const [r, c] of cells) ctx.rect(ox + c * size, oy + r * size, size + .5, size + .5);
  const g = ctx.createLinearGradient(x0, y0, x0 + bw, y0 + bh);
  g.addColorStop(0, mix(color, "#ffffff", .26)); g.addColorStop(.45, color); g.addColorStop(1, mix(color, "#000000", .16));
  ctx.fillStyle = g; ctx.fill();
  ctx.clip();
  // light inside the stone: its own colour, brighter at the heart, added on top so it glows rather than greys
  const ig = ctx.createRadialGradient(x0 + bw * .45, y0 + bh * .42, 0, x0 + bw * .45, y0 + bh * .42, Math.max(bw, bh) * .65);
  ig.addColorStop(0, hexA(lerpHex(color, "#ffffff", .2), .5)); ig.addColorStop(1, hexA(color, 0));
  if (!NOLAYER.has("inner")) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = ig; ctx.fillRect(x0, y0, bw, bh); ctx.restore(); }
  // inner bevel: light from the top-left, shadow bottom-right
  if (!NOLAYER.has("bevel")) { ctx.lineWidth = size * .2; ctx.strokeStyle = "rgba(0,0,0,.2)"; ctx.save(); ctx.translate(-size * .05, -size * .05); outline(); ctx.stroke(); ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.save(); ctx.translate(size * .05, size * .05); outline(); ctx.stroke(); ctx.restore(); }
  // refraction bands across the whole stone
  ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.beginPath();
  ctx.moveTo(x0, y0 + bh * .55); ctx.lineTo(x0 + bw * .55, y0); ctx.lineTo(x0 + bw * .72, y0); ctx.lineTo(x0, y0 + bh * .72); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath();
  ctx.moveTo(x0 + bw * .3, y0 + bh); ctx.lineTo(x0 + bw, y0 + bh * .3); ctx.lineTo(x0 + bw, y0 + bh * .42); ctx.lineTo(x0 + bw * .42, y0 + bh); ctx.fill();
  // facets by cut, fine and crisp
  const cx = x0 + bw * .42, cy = y0 + bh * .4;
  ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = Math.max(.8, size * .025); ctx.beginPath();
  if (cut === "step" || cut === "prism") for (const k of [.2, .4]) ctx.rect(x0 + bw * k * .5, y0 + bh * k * .5, bw * (1 - k), bh * (1 - k));
  else if (cut === "round" || cut === "cabochon") { ctx.save(); const hg = ctx.createRadialGradient(x0 + bw * .32, y0 + bh * .28, 0, x0 + bw * .32, y0 + bh * .28, Math.max(bw, bh) * .4);
    hg.addColorStop(0, "rgba(255,255,255,.35)"); hg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = hg; ctx.fillRect(x0, y0, bw, bh); ctx.restore(); }
  else if (cut === "star" || cut === "trillion") for (const [px, py] of [[x0 + bw / 2, y0], [x0 + bw, y0 + bh / 2], [x0 + bw / 2, y0 + bh], [x0, y0 + bh / 2], [x0, y0], [x0 + bw, y0 + bh]]) { ctx.moveTo(cx, cy); ctx.lineTo(px, py); }
  else for (const [px, py] of [[x0, y0], [x0 + bw, y0], [x0 + bw, y0 + bh], [x0, y0 + bh]]) { ctx.moveTo(cx, cy); ctx.lineTo(px, py); }
  ctx.stroke();
  ctx.restore();
  // crisp outer line in the stone's own dark tone, and a thin highlight on the lit edges
  ctx.save(); ctx.globalAlpha = alpha; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.strokeStyle = mix(color, "#000000", .5); ctx.lineWidth = Math.max(1.2, size * .05); outline(); ctx.stroke(); // a hard edge, so small stones never read as a glow
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = Math.max(1, size * .025); ctx.beginPath();
  for (const [r, c] of cells) { const x = ox + c * size, y = oy + r * size, i = size * .07;
    if (edgeOf(r, c, -1, 0)) { ctx.moveTo(x + i, y + i); ctx.lineTo(x + size - (edgeOf(r, c, 0, 1) ? i : 0), y + i); }
    if (edgeOf(r, c, 0, -1)) { ctx.moveTo(x + i, y + i); ctx.lineTo(x + i, y + size - (edgeOf(r, c, 1, 0) ? i : 0)); } }
  ctx.stroke();
  // one sharp glint near the top-left corner of the stone
  const [gr, gc] = cells.reduce((a, b) => (b[0] * 10 + b[1] < a[0] * 10 + a[1] ? b : a)), gx = ox + gc * size + size * .3, gy = oy + gr * size + size * .3, gs = size * .1;
  if ((box.r * 7 + box.c * 13 + cells.length) % 3) { ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(gx, gy - gs); ctx.lineTo(gx + gs * .22, gy - gs * .22); ctx.lineTo(gx + gs, gy);
  ctx.lineTo(gx + gs * .22, gy + gs * .22); ctx.lineTo(gx, gy + gs); ctx.lineTo(gx - gs * .22, gy + gs * .22); ctx.lineTo(gx - gs, gy); ctx.lineTo(gx - gs * .22, gy - gs * .22); ctx.fill(); }
  if (glyph && save.opt.glyph) {
    ctx.fillStyle = "rgba(20,20,10,.5)"; ctx.font = `${Math.round(size * .38)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [r, c] of cells) ctx.fillText(glyph, ox + (c + .5) * size, oy + (r + .52) * size);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}
function drawStone(cells, size, ox, oy, alpha, isCracked = () => false) { // fallen rock: matte lumps, cracks after a clear
  ctx.save(); ctx.globalAlpha = alpha;
  for (const [r, c] of cells) {
    const x = ox + c * size, y = oy + r * size, s = size, h = (r * 7 + c * 13) % 5;
    const g = ctx.createLinearGradient(x, y, x, y + s); g.addColorStop(0, "#a9a9b6"); g.addColorStop(1, "#55555f"); // lit from the sky above
    ctx.fillStyle = "#24242c"; ctx.beginPath(); ctx.roundRect(x, y + s * .095, s * .9, s * .9, s * (.18 + h * .03)); ctx.fill(); // its darker edge, down-left like a crystal's
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x + s * .05, y + s * .05, s * .9, s * .9, s * (.18 + h * .03)); ctx.fill();
    ctx.strokeStyle = "#2c2c34"; ctx.lineWidth = Math.max(1.4, s * .05); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.ellipse(x + s * .38, y + s * .28, s * .2, s * .08, -.3, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(30,30,40,.35)"; for (const [px, py] of [[.3, .62], [.66, .45], [.55, .75]]) { ctx.beginPath(); ctx.arc(x + s * px, y + s * py, s * .04, 0, 7); ctx.fill(); }
    if (isCracked(r, c)) { ctx.strokeStyle = "#1a1a20"; ctx.lineWidth = Math.max(1.2, s * .05); ctx.beginPath();
      ctx.moveTo(x + s * .5, y + s * .1); ctx.lineTo(x + s * .42, y + s * .38); ctx.lineTo(x + s * .6, y + s * .55); ctx.lineTo(x + s * .48, y + s * .9);
      ctx.moveTo(x + s * .6, y + s * .55); ctx.lineTo(x + s * .85, y + s * .62); ctx.stroke(); }
  }
  ctx.restore();
}
function drawPiece({ piece, type, memory, pet: p, petCell }, size, ox, oy, alpha) {
  if (CRYSTALS[type].stone) return drawStone(piece.cells, size, ox, oy, alpha);
  const em = CRYSTALS[type].ember ? .6 + .3 * Math.sin(performance.now() / 120) : .35;
  if (memory) memoryHalo(ox + piece.w * size / 2, oy + piece.h * size / 2, Math.max(piece.w, piece.h) * size);
  drawCrystal(piece.cells, CRYSTALS[type].color, { r: 0, c: 0, h: piece.h, w: piece.w }, size, ox, oy, alpha, em, CRYSTALS[type].glyph, CRYSTALS[type].cut);
  if (memory) fossil(piece.cells.map(([r, c]) => [r, c]), size, ox, oy);
  else special(type, piece.cells, size, ox, oy, alpha);
  if (p) { const [r, c] = piece.cells[petCell]; sleeper(p, ox + c * size, oy + r * size, size, alpha); }
}
// ---------- pets on the canvas: each look painted once into an image, at 3x so a Retina canvas never upscales it ----------
const petImgs = {}, wearOf = (k) => save.pets.wear[k] || {};
const petImg = (k, o = wearOf(k)) => petImgs[k + JSON.stringify(o)] ??= Object.assign(new Image(),
  { src: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(pet(k, 288, o).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')) });
function sleeper(k, x, y, s, a = 1) { // curled up asleep in a crystal cell, faintly visible through the stone, breathing
  const im = petImg(k, { sleep: true }), now = performance.now(), b = calmMotion ? 1 : 1 + .04 * Math.sin(now / 600), z = s * .96 * b;
  const g = ctx.createRadialGradient(x + s / 2, y + s / 2, 0, x + s / 2, y + s / 2, s * .7); g.addColorStop(0, `rgba(255,240,248,${.32 + .1 * Math.sin(now / 500)})`); g.addColorStop(1, "rgba(255,240,248,0)");
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - s * .2, y - s * .2, s * 1.4, s * 1.4);
  if (im.complete) { ctx.globalAlpha = a * .7; ctx.drawImage(im, x + (s - z) / 2, y + (s - z) / 2 + s * .02, z, z); }
  ctx.restore();
}
const aName = (k) => (/^[AEIOU]/.test(PETS[k].name) ? "an " : "a ") + PETS[k].name;
function freePets(cells, before) { // a clear through a pet's cell wakes it: it's yours, and it pops out
  for (const k of cells) { const m = meta[before[k]]; if (!m?.pet || m.petAt !== k) continue;
    const kind = m.pet, P = save.pets; m.pet = null;
    if (!P.owned.includes(kind)) { P.owned.push(kind); P.active.push(kind); persist(); }
    newPets.push(kind); track("pet_found", { pet: kind, mine: biome.id });
    const x = bx + (k % N + .5) * cell, y = by + (Math.floor(k / N) + .5) * cell; frees.push({ kind, x, y, at: performance.now() }); starBurst(x, y, 12, "#ffd2e2");
    pops.push({ text: `${PETS[kind].name}!`, life: 1.4, col: "#ffd2e2" }); [784, 988, 1175, 1568, 1976].forEach((f, j) => tone(f, .3, "sine", .06, j * .07)); buzz(25); }
}
function drawFrees(now) { // the crystal cracks, then the pet pops out and bounces three times
  frees = frees.filter((f) => now - f.at < 2000);
  for (const f of frees) {
    const t = (now - f.at) / 2000;
    if (t < .1) { const k = t / .1, g = cell * (1 + 1.6 * k); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .8 * k; ctx.drawImage(glowSpr("#ffe2ec"), f.x - g / 2, f.y - g / 2, g, g); ctx.restore();
      ctx.save(); ctx.strokeStyle = "#fffaf0"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = 1 - k * .4; ctx.beginPath();
      for (let j = 0; j < 6; j++) { const a = j * 1.05 + .3, l = cell * .62 * k; ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a + .3) * l * .5, f.y + Math.sin(a + .3) * l * .5); ctx.lineTo(f.x + Math.cos(a) * l, f.y + Math.sin(a) * l); }
      ctx.stroke(); ctx.restore(); continue; }
    const u = (t - .1) / .9, im = petImg(f.kind); if (!im.complete) continue;
    { const g = cell * (2.4 + .8 * Math.sin(Math.min(1, u * 4) * Math.PI / 2)); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .65 * (1 - u) ** 1.5; // a warm halo as it wakes
      ctx.drawImage(glowSpr("#ffc8da"), f.x - g / 2, f.y - g / 2, g, g); ctx.restore(); }
    const hop = calmMotion ? 0 : Math.abs(Math.sin(u * Math.PI * 3)) * cell * 1.4 * (1 - u) ** 1.2, land = calmMotion ? 0 : Math.max(0, 1 - hop / (cell * .2)) * (1 - u);
    const s = cell * 1.35 * (u < .12 ? .25 + .75 * easeBack(u / .12) : 1);
    ctx.save(); ctx.globalAlpha = Math.min(1, (1 - u) * 6); ctx.translate(f.x, f.y + cell * .45 - hop); ctx.scale(1 + .2 * land, 1 - .18 * land); ctx.drawImage(im, -s / 2, -s * .92, s, s); ctx.restore();
  }
}
function drawPeek(now) { // your pet sits on the Rootline's bottom-right corner, watching, and hops when a line clears
  const k = save.pets.active[0]; if (!k || frees.length) return;
  const im = petImg(k); if (!im.complete) return;
  const s = cell * 1.15, h = calmMotion ? 0 : Math.max(0, Math.sin(Math.min(1, (now - petHop) / 420) * Math.PI)) * cell * .55;
  ctx.drawImage(im, bx + cell * N + 12 - s / 2, by + cell * N + 21 - s * .92 - h, s, s); // centred on the frame's edge, clear of the cells
}
// ---------- special crystals: each wears its power, so it reads at a glance (and in the tray) ----------
const MARK = {
  ember: (x, y, s, now, k) => { // two flame licks flickering up out of the stone
    for (let j = 0; j < 2; j++) { const fx = x + s * (.33 + j * .34), fy = y + s * .8, h = s * (.34 + .12 * Math.sin(now / 90 + k * 1.7 + j * 2)), w = s * .1, sway = Math.sin(now / 130 + k + j) * w;
      ctx.fillStyle = j ? "rgba(255,214,122,.9)" : "rgba(255,138,61,.85)";
      ctx.beginPath(); ctx.moveTo(fx - w, fy); ctx.quadraticCurveTo(fx - w * 1.3, fy - h * .5, fx + sway, fy - h); ctx.quadraticCurveTo(fx + w * 1.3, fy - h * .5, fx + w, fy); ctx.fill(); } },
  frost: (x, y, s, now, k) => { // rime: a frost star in the corner and a glint that comes and goes
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = Math.max(1, s * .045); ctx.lineCap = "round"; ctx.beginPath();
    for (const [cx, cy, l] of [[.28, .28, .17], [.74, .72, .1]]) for (let a = 0; a < 3; a++) { const dx = Math.cos(a * Math.PI / 3) * s * l, dy = Math.sin(a * Math.PI / 3) * s * l;
      ctx.moveTo(x + s * cx - dx, y + s * cy - dy); ctx.lineTo(x + s * cx + dx, y + s * cy + dy); }
    ctx.stroke(); const tw = Math.max(0, Math.sin(now / 400 + k * 2.1)); ctx.fillStyle = `rgba(255,255,255,${tw * .8})`; ctx.beginPath(); ctx.arc(x + s * .66, y + s * .3, s * .06 * tw, 0, 7); ctx.fill(); },
  glowcap: (x, y, s, now, k) => { // spores rising: it feeds the roots
    for (let j = 0; j < 3; j++) { const p = (now / 1700 + j / 3 + k * .137) % 1, a = Math.sin(p * Math.PI);
      ctx.fillStyle = `rgba(241,232,255,${a * .9})`; ctx.beginPath(); ctx.arc(x + s * (.25 + .25 * j + Math.sin(p * 6 + j) * .06), y + s * (.85 - .7 * p), s * .055, 0, 7); ctx.fill(); } },
  geode: (x, y, s, now, k) => { // a hollow full of tiny amethyst teeth
    const cx = x + s * .5, cy = y + s * .52; ctx.fillStyle = "#3a2350"; ctx.fill(new Path2D(curve(ring(cx, cy, s * .24, s * .2, 9, .15, k + 3))));
    ctx.fillStyle = "#e6c8ff"; for (let j = 0; j < 7; j++) { const a = j / 7 * Math.PI * 2 + k, px = cx + Math.cos(a) * s * .19, py = cy + Math.sin(a) * s * .16;
      ctx.beginPath(); ctx.moveTo(px + Math.cos(a + 1.6) * s * .03, py + Math.sin(a + 1.6) * s * .03); ctx.lineTo(cx + Math.cos(a) * s * .08, cy + Math.sin(a) * s * .07); ctx.lineTo(px - Math.cos(a + 1.6) * s * .03, py - Math.sin(a + 1.6) * s * .03); ctx.fill(); }
    ctx.fillStyle = `rgba(255,255,255,${.5 + .4 * Math.sin(now / 300 + k)})`; ctx.beginPath(); ctx.arc(cx - s * .06, cy - s * .05, s * .035, 0, 7); ctx.fill(); },
  heart: (x, y, s, now) => { // a heart that beats
    const b = 1 + .16 * Math.max(0, Math.sin(now / 240)) ** 6, cx = x + s * .5, cy = y + s * .5, h = s * .2 * b;
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * .45); gl.addColorStop(0, `rgba(255,224,234,${.35 * b})`); gl.addColorStop(1, "rgba(255,224,234,0)"); ctx.fillStyle = gl; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = "#ffe0ea"; ctx.beginPath(); ctx.moveTo(cx, cy + h); ctx.bezierCurveTo(cx - h * 1.6, cy, cx - h * .8, cy - h * 1.3, cx, cy - h * .45); ctx.bezierCurveTo(cx + h * .8, cy - h * 1.3, cx + h * 1.6, cy, cx, cy + h); ctx.fill(); },
};
function special(type, cells, size, ox, oy, alpha = 1, now = performance.now()) {
  const mark = MARK[type]; if (!mark) return;
  ctx.save(); ctx.globalAlpha = alpha;
  for (const [r, c] of cells) mark(ox + c * size, oy + r * size, size, now, r * 8 + c);
  ctx.restore();
}
// the first time each special turns up, one line under the board says what it does
const TIPS = { ember: "Ember Shard: shatters its neighbours too", glowcap: "Gloamcap: each one feeds the Rootline +1s",
  frost: "Frostspar: freezes the Rootline a moment", geode: "Geode: rare, and worth a small fortune", heart: "Rootheart: the rarest crystal of all",
  rubble: "Skystone: two clears beside it crack it open", moth: "Pilfermoth: clear a line through it!", memory: "Amber Memory: clear its line to open it", pet: "Someone's asleep in there! Clear its line" };
save.seen ??= [];
let tip = null;
function drawHint(now) {
  if (!tip && state === "play") { // a new special in the tray (or a moth on the board) gets its line
    const k = [...(tray || []).filter(Boolean).map((q) => (q.pet ? "pet" : q.memory ? "memory" : q.type)), ...(moths.length ? ["moth"] : [])].find((k) => TIPS[k] && !save.seen.includes(k));
    if (k) { tip = { k, at: now, pet: tray.find((q) => q?.pet)?.pet }; save.seen.push(k); persist(); }
  }
  let text = null, a = 1;
  if (tip) { const t = (now - tip.at) / 4500; if (t >= 1) tip = null; else { text = TIPS[tip.k]; a = Math.min(1, t * 8, (1 - t) * 6); } }
  if (!text && !started && !calm && state === "play") text = "Place a crystal to start the Rootline";
  if (!text) return;
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  let px = 15; ctx.font = `600 ${px}px Fredoka, sans-serif`; const room = W - 40 - (tip ? 26 : 0);
  if (ctx.measureText(text).width > room) { px = 13; ctx.font = `600 ${px}px Fredoka, sans-serif`; }
  const tw = ctx.measureText(text).width, sw = tip ? 26 : 0, x = (W - tw - sw) / 2;
  if (tip) { const s = 18, y = hintY - s / 2 - 1, tp = tip.k === "memory" ? "amber" : tip.k;
    if (tip.k === "moth") { ctx.fillStyle = "#c9b6ff"; ctx.beginPath(); ctx.arc(x + s / 2, hintY, s * .4, 0, 7); ctx.fill(); }
    else { drawPiece({ piece: { cells: [[0, 0]], w: 1, h: 1 }, type: tip.k === "pet" ? "moonstone" : tp, memory: tip.k === "memory", pet: tip.k === "pet" && tip.pet, petCell: 0 }, s, x, y, a); ctx.globalAlpha = a; } }
  ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(20,12,6,.7)"; ctx.strokeText(text, x + sw, hintY);
  ctx.fillStyle = tip ? "#ffe9b0" : "rgba(239,230,207,.8)"; ctx.fillText(text, x + sw, hintY);
  ctx.restore();
}
function memoryHalo(x, y, r) { // flickers like a firefly that has noticed something
  const now = performance.now(), a = .25 + .2 * Math.sin(now / 160) * Math.sin(now / 410);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,214,122,${a})`); g.addColorStop(1, "rgba(255,214,122,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
}
function fossil(cells, size, ox, oy) { // a tiny leaf caught in the amber, in each cell
  ctx.save(); ctx.strokeStyle = "rgba(90,52,16,.75)"; ctx.fillStyle = "rgba(90,52,16,.45)"; ctx.lineWidth = Math.max(1, size * .04);
  for (const [r, c] of cells) { const x = ox + (c + .5) * size, y = oy + (r + .52) * size, l = size * .26;
    ctx.beginPath(); ctx.moveTo(x - l * .6, y + l * .6); ctx.quadraticCurveTo(x - l, y - l * .5, x + l * .6, y - l * .6); ctx.quadraticCurveTo(x + l * .3, y + l * .4, x - l * .6, y + l * .6); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
function drawChalk() { // Granny's marks, scratched into the tunnel floor by a mole's paw: every letter wobbles, scraped twice, signed with a paw print
  const txt = CHALK[biome?.id]; if (!txt || daily) return;
  const w = cell * N, words = txt.split(" "), lines = [], lh = cell * .62;
  let s = [...txt].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 1; // seeded from the text: the marks don't shimmer between frames
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  ctx.save(); ctx.font = `600 ${Math.round(cell * .42)}px Fredoka, sans-serif`;
  for (const wd of words) { const l = lines.length ? lines[lines.length - 1] + " " + wd : wd;
    if (lines.length && ctx.measureText(l).width < w * .8) lines[lines.length - 1] = l; else lines.push(wd); }
  ctx.translate(bx + w / 2, by + w * (biome.id === "skywell" ? .22 : .5)); ctx.rotate(-.06); // Skywell: scratched up toward the light ctx.textBaseline = "middle";
  ctx.fillStyle = "rgb(239,230,207)";
  let ex = 0, ey = 0;
  lines.forEach((l, k) => { const y0 = (k - (lines.length - 1) / 2) * lh; let x = -ctx.measureText(l).width / 2 + (rnd() - .5) * cell * .3;
    for (const ch of l) { const cw = ctx.measureText(ch).width, a = .15 + rnd() * .1;
      ctx.save(); ctx.translate(x + cw / 2, y0 + Math.sin(x / cell * 1.7 + k) * cell * .05 + (rnd() - .5) * cell * .07);
      ctx.rotate((rnd() - .5) * .3); ctx.scale(.86 + rnd() * .26, .86 + rnd() * .26); ctx.textAlign = "center";
      ctx.globalAlpha = a; ctx.fillText(ch, 0, 0); ctx.globalAlpha = a * .45; ctx.fillText(ch, cell * .035, cell * .025);
      ctx.restore(); x += cw * (.94 + rnd() * .14); }
    ex = x; ey = y0; });
  if (txt.endsWith("B")) { const px = ex + cell * .32, py = ey + cell * .04, p = cell * .1; // the paw that signed it
    ctx.globalAlpha = .2; ctx.beginPath(); ctx.ellipse(px, py + p * .6, p * 1.1, p * .85, .2, 0, Math.PI * 2); ctx.fill();
    [[-1.3, -.7], [-.45, -1.25], [.45, -1.25], [1.3, -.7]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(px + dx * p, py + dy * p, p * .34, p * .42, dx * .3, 0, Math.PI * 2); ctx.fill(); }); }
  ctx.restore();
}

// ---------- board, moss and the Rootline ----------
const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const mossRnd = seeded(7), moss = [...Array(12)].map(() => ({ t: mossRnd(), r: .5 + mossRnd(), side: mossRnd() < .7 ? 0 : 1 }));
const look = () => (daily || !biome ? BIOMES[0] : biome).pal;
const hexA = (h, a) => `rgba(${hex(h)},${a})`;
// tufts on the frame, per mine: [dark, light, lit edge]
const TUFT = { moss: ["#3a5f2c", "#4f7a3a", "rgba(190,240,150,.22)"], lava: ["#3a1a12", "#5a2a1a", "rgba(255,138,61,.5)"], caps: ["#3e3060", "#5a4690", "rgba(217,204,255,.4)"],
  snow: ["#b9d6e6", "#e6f6ff", "rgba(255,255,255,.6)"], geode: ["#4a3a5a", "#6a4a8a", "rgba(230,200,255,.35)"], heart: ["#5a2a34", "#7a3a48", "rgba(255,157,181,.4)"],
  scorch: ["#2a1810", "#4a2a1a", "rgba(255,138,61,.45)"], scales: ["#8a80a0", "#c8bce0", "rgba(255,255,255,.4)"], loom: ["#5a5e78", "#9a9ec0", "rgba(244,240,255,.4)"],
  lanterns: ["#3a5f2c", "#5a7a3a", "rgba(255,210,122,.45)"], shaft: ["#4a4a58", "#6a6a78", "rgba(244,240,255,.35)"] };
// motes drifting through each mine: [colour, direction (-1 rises, 1 falls), count]
const MOTES = { moss: ["#c9f5a0", -1, 12], lava: ["#ffb15a", -1, 18], caps: ["#d9ccff", -1, 16], snow: ["#ffffff", 1, 26], geode: ["#e6c8ff", -1, 10], heart: ["#ff9db5", -1, 14],
  scorch: ["#ffb15a", 1, 16], scales: ["#f4f0ff", 1, 22], loom: ["#f4f0ff", -1, 14], lanterns: ["#ffd27a", -1, 14], shaft: ["#f4f0ff", 1, 18] };

// ---------- the mine around the board: painted once per dig and screen size (paint.js shapes as canvas paths) ----------
let bgCache = null; // { mine, board: canvases; x, y, w: where the board canvas goes }
function paintMine() {
  const pal = look(), f = pal.feature, dpr = devicePixelRatio || 1, c = document.createElement("canvas");
  c.width = W * dpr; c.height = H * dpr; const g = c.getContext("2d"); g.scale(dpr, dpr);
  const r = seeded(f.length * 31 + 7), P = (pts) => new Path2D(curve(pts));
  const fill = (path, col, line, off = [-1.8, 1.6]) => { if (line) { g.save(); g.translate(off[0], off[1]); g.fillStyle = line; g.fill(path); g.restore(); } g.fillStyle = col; g.fill(path); };
  const glow = (x, y, rad, col, a) => { const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, hexA(col, a)); rg.addColorStop(1, hexA(col, 0)); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  const shardAt = (x, y, w, h, a, col) => { // a painted crystal shard, lit from the left, darker edge on the shadow side
    const pts = [[-w * .55, 0], [-w * .62, -h * .55], [-w * .1, -h], [w * .5, -h * .62], [w * .58, 0]].map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);
    const p = new Path2D(); pts.forEach(([px, py], k) => (k ? p.lineTo(px, py) : p.moveTo(px, py))); p.closePath();
    fill(p, col, mix(col, "#0e1c1a", .55), [1.4, 1]);
    const m = [(pts[0][0] + pts[4][0]) / 2, (pts[0][1] + pts[4][1]) / 2]; g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.moveTo(...pts[2]); g.lineTo(...pts[1]); g.lineTo(...pts[0]); g.lineTo(...m); g.fill(); };
  const cols = Object.keys((daily ? BIOMES[0] : biome).types).map((t) => CRYSTALS[t].color);
  // cave air: lit at the top-left (cool light), falling to the cave colour
  let gr = g.createLinearGradient(0, 0, W * .35, H); gr.addColorStop(0, mix(pal.bg, "#fff1d8", .1)); gr.addColorStop(.5, pal.bg); gr.addColorStop(1, pal.cave);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 10; k++) { const x = r() < .5 ? r() * W * .22 : W * (.78 + r() * .22); glow(x, r() * H, 24 + r() * 40, k % 2 ? lerpHex(pal.bg, "#fff1d8", .14) : "#000000", .3); }
  const wl = mix(pal.bg, "#000000", .3), wr = mix(pal.bg, "#000000", .45);
  fill(P([[-40, -20], [W * .3, -20], [W * .17, H * .12], [W * .07, H * .36], [W * .04, H * .7], [W * .09, H + 20], [-40, H + 20]]), wl, mix(pal.bg, "#000000", .55), [2, 0]);
  fill(P([[W + 40, -20], [W * .7, -20], [W * .85, H * .15], [W * .95, H * .42], [W * .97, H * .76], [W * .9, H + 20], [W + 40, H + 20]]), wr, mix(pal.bg, "#000000", .6), [-2, 1]);
  gr = g.createLinearGradient(W * .1, 0, W * .6, H * .75); gr.addColorStop(0, "rgba(220,235,255,.12)"); gr.addColorStop(1, "rgba(220,235,255,0)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(W * .1, 0); g.lineTo(W * .4, 0); g.lineTo(W * .8, H * .8); g.lineTo(W * .42, H * .8); g.fill();
  glow(bx + cell * N / 2, by + cell * N / 2, cell * N * .85, pal.glow, .2); // the mine's glow pooling behind the board
  for (const [x, len, w] of [[.1, .15, 9], [.3, .09, 6], [.66, .12, 7], [.9, .18, 10]]) { const x1 = W * x;
    fill(new Path2D(limb(x1, -10, x1 + (r() - .5) * 30, H * len * .6, x1 + (r() - .5) * 40, H * len, w, 1)), pal.root, mix(pal.root, "#000000", .5)); }
  const floor = H * .9;
  fill(P([[-30, H + 30], [-30, floor], [W * .25, floor - H * .02], [W * .5, floor + H * .01], [W * .78, floor - H * .03], [W + 30, floor], [W + 30, H + 30]]), pal.ground, mix(pal.ground, "#000000", .45), [0, -2]);
  for (const [x, s, k] of [[.08, 1, 0], [.92, .8, 1], [.2, .5, 2]]) { const cx = W * x, cy = floor + H * .015; glow(cx, cy - 20 * s, 50 * s, pal.glow, .25);
    [[-.5, .42, .5, -.45], [.42, .36, .62, .35], [0, .55, 1, -.08], [.15, .25, .35, .7]].forEach(([dx, w, h, a], j) => shardAt(cx + dx * 40 * s, cy, 40 * s * w, 40 * s * h, a, cols[(j + k) % cols.length])); }
  // what makes each mine itself
  ({ moss: () => { for (const x of [.32, .5, .68]) for (let k = 0; k < 4; k++) { const x1 = W * x + (k - 1.5) * 7; // moss hanging from the roof
        fill(new Path2D(limb(x1, -6, x1 + (r() - .5) * 8, 30, x1 + (r() - .5) * 10, 40 + r() * 50, 3, .6)), k % 2 ? "#3f6a34" : "#4f7a3a", "#25401f"); }
      for (let k = 0; k < 14; k++) { const x = r() * W, y = floor + r() * 8; fill(new Path2D(limb(x, y, x + (r() - .5) * 6, y - 8, x + (r() - .5) * 10, y - 12 - r() * 12, 2.4, .3)), k % 2 ? "#5f8a46" : "#7aa057"); }
      for (const x of [.02, .97]) fill(P(ring(W * x, H * .62, 26, 40, 10, .3, 3)), "#3f6a34", "#25401f"); },
    lava: () => { g.lineCap = "round"; g.lineJoin = "round"; g.shadowColor = "#ff6a3d"; g.shadowBlur = 14; // glowing cracks in the floor and the roof
      for (const [w, col] of [[4, "#ff6a3d"], [1.6, "#ffd27a"]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath();
        g.moveTo(W * .08, floor + 22); g.lineTo(W * .22, floor + 12); g.lineTo(W * .3, floor + 18); g.lineTo(W * .46, floor + 8); g.moveTo(W * .6, floor + 14); g.lineTo(W * .74, floor + 22); g.lineTo(W * .92, floor + 10);
        g.moveTo(W * .36, by - 40); g.lineTo(W * .42, by - 62); g.lineTo(W * .5, by - 54); g.lineTo(W * .58, by - 80); g.stroke(); }
      g.shadowBlur = 0; glow(W * .5, by - 60, 70, "#ff6a3d", .3); },
    caps: () => { for (const [x, s] of [[.1, 22], [.2, 13], [.84, 26], [.94, 14]]) { const cx = W * x, cy = floor + 6; glow(cx, cy - s, s * 2.2, pal.glow, .35);
      fill(P(ring(cx, cy - s * .3, s * .18, s * .5, 7, .1, s)), "#e2d8f0"); fill(P([[cx - s, cy - s * .55], [cx - s * .5, cy - s * 1.25], [cx + s * .4, cy - s * 1.3], [cx + s, cy - s * .6], [cx, cy - s * .75]]), pal.glow, mix(pal.glow, "#1a0f2a", .55)); } },
    snow: () => { fill(P([[-30, H + 30], [-30, floor + 4], [W * .3, floor - 6], [W * .55, floor + 2], [W * .8, floor - 8], [W + 30, floor], [W + 30, H + 30]]), "#e6f6ff", "#7a9aaa", [0, -2]);
      for (const x of [.18, .26, .44, .58, .74, .82]) { const cx = W * x, h = 18 + r() * 34; fill(new Path2D(limb(cx, -4, cx, h * .5, cx + (r() - .5) * 4, h, 4, .2)), "#cfefff", "#5a7a8a", [-1, 1]); } },
    geode: () => { const cx = W * .5, cy = Math.max(48, by - 64); fill(P(ring(cx, cy, 34, 30, 12, .1, 4)), "#8a8277", "#3a332c"); fill(P(ring(cx, cy, 25, 21, 10, .1, 6)), "#3a2350");
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; shardAt(cx + Math.cos(a) * 22, cy + Math.sin(a) * 18, 6, 12, a - Math.PI / 2, pal.glow); } glow(cx, cy, 50, pal.glow, .25); },
    heart: () => { const cx = W * .5, cy = Math.max(40, by - 70), h = 16; glow(cx, cy, 90, pal.glow, .4); // the great tree's heart, above the board, roots running out of it
      for (const [x2, y2] of [[.1, .02], [.9, .04], [.2, .3], [.8, .28]]) fill(new Path2D(limb(cx, cy, (cx + W * x2) / 2, cy + 20, W * x2, H * y2, 5, 1)), "#5a2a20", "#2a1210");
      const hp = new Path2D(); hp.moveTo(cx, cy + h); hp.bezierCurveTo(cx - h * 1.6, cy, cx - h * .8, cy - h * 1.3, cx, cy - h * .45); hp.bezierCurveTo(cx + h * .8, cy - h * 1.3, cx + h * 1.6, cy, cx, cy + h);
      fill(hp, pal.glow, "#6a2020"); },
    scorch: () => { g.shadowColor = "#ff6a3d"; g.shadowBlur = 10; g.fillStyle = "rgba(255,120,61,.55)"; // scorch marks above the board, every one pointing down
      for (const [x, d] of [[.36, 0], [.5, 12], [.64, 0]]) { const cx = W * x, cy = by - 78 + d;
        g.beginPath(); g.moveTo(cx - 12, cy); g.quadraticCurveTo(cx - 4, cy + 14, cx, cy + 34); g.quadraticCurveTo(cx + 4, cy + 14, cx + 12, cy); g.quadraticCurveTo(cx, cy + 10, cx - 12, cy); g.fill(); }
      g.shadowBlur = 0; },
    scales: () => { for (let k = 0; k < 9; k++) { const x = r() * W, y = floor - 4 + r() * 20, a = r() * 6; g.save(); g.translate(x, y); g.rotate(a); fill(P([[0, 0], [-8, -6], [-11, -1], [-3, 2]]), "#efe6fb", "#5a4a6a"); fill(P([[0, 0], [8, -6], [11, -1], [3, 2]]), "#efe6fb", "#5a4a6a"); g.restore(); } },
    loom: () => { const cx = W * .5, cy = Math.max(60, by - 80); glow(cx, cy, 120, "#f4f0ff", .3); g.strokeStyle = "rgba(244,240,255,.25)"; g.lineWidth = 1;
      g.beginPath(); for (const x of [-.3, -.1, .1, .3, .5, .7, .9, 1.1, 1.3]) { g.moveTo(cx, cy); g.lineTo(W * x, H); } g.stroke(); fill(P(ring(cx, cy, 16, 16, 12, .04, 9)), "#f4f0ff", "#9a9ec0"); },
    lanterns: () => { const y0 = Math.max(60, by - 110); g.strokeStyle = "#4a3a2a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-10, y0); g.quadraticCurveTo(W * .5, y0 + 64, W + 10, y0); g.stroke();
      for (let k = 1; k < 7; k++) { const t = k / 7, x = W * t, y = y0 + Math.sin(t * Math.PI) * 32 + 2; glow(x, y + 6, 26, "#f0b543", .45); fill(P([[x - 5, y], [x + 5, y], [x + 6, y + 13], [x - 6, y + 13]]), "#f7d77a", "#6a4a24"); } },
    shaft: () => { gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(244,240,255,.3)"); gr.addColorStop(1, "rgba(244,240,255,0)"); g.fillStyle = gr;
      g.beginPath(); g.moveTo(W * .4, 0); g.lineTo(W * .6, 0); g.lineTo(W * .75, H); g.lineTo(W * .25, H); g.fill(); glow(W * .5, 0, 60, "#f4f0ff", .6);
      for (const [x, w] of [[.12, 40], [.36, 26], [.7, 34], [.9, 30]]) fill(P(ring(W * x, floor + 4, w, w * .55, 9, .12, w)), "#4a4a58", "#1a1a22"); } })[f]?.();
  const vg = g.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .45, W / 2, H * .45, Math.max(W, H) * .75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // the board itself (frame, cells, Granny's chalk) is static too: paint it once, into its own canvas
  const pad = 28, bw = cell * N + pad * 2, b = document.createElement("canvas"); b.width = bw * dpr; b.height = bw * dpr;
  const keep = ctx; ctx = b.getContext("2d"); ctx.scale(dpr, dpr); ctx.translate(pad - bx, pad - by); drawBoard(); drawChalk(); ctx = keep;
  return { mine: c, board: b, x: bx - pad, y: by - pad, w: bw };
}
function drawMine(now) { // the painted cave, plus motes drifting through it
  bgCache ??= paintMine(); if (!NOLAYER.has("bg")) ctx.drawImage(bgCache.mine, 0, 0, W, H);
  if (state === "play") drawLife(ctx, now, { W, bx, by, bw: cell * N, top: hudTop, low: trayY, feature: look().feature, busy: !!drag }); // ambient.js: what passes, and the other lantern
  const [col, dir, n] = MOTES[look().feature] || MOTES.moss;
  if (calmMotion) return; ctx.fillStyle = col;
  for (let k = 0; k < n; k++) { const sp = 18 + (k * 7) % 23, y = (((k * 137) % 100) / 100 * H + dir * now / 1000 * sp) % H, yy = y < 0 ? y + H : y;
    const x = ((k * 61) % 100) / 100 * W + Math.sin(now / 1700 + k) * 14; ctx.globalAlpha = .25 + .45 * Math.abs(Math.sin(now / 900 + k * 1.3));
    ctx.beginPath(); ctx.arc(x, yy, 1 + (k % 3) * .6, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function drawBoard() {
  const pad = 9, x = bx - pad, y = by - pad, sz = cell * N + pad * 2, pal = look(), tuft = TUFT[pal.feature] || TUFT.moss;
  // carved wooden frame with a beveled lip, stained by the mine's roots
  const fg = ctx.createLinearGradient(x, y, x, y + sz); fg.addColorStop(0, mix("#4a3422", pal.root, .3)); fg.addColorStop(1, mix("#2a1d12", pal.cave, .3));
  ctx.fillStyle = fg; ctx.beginPath(); ctx.roundRect(x - 3, y - 3, sz + 6, sz + 6, 16); ctx.fill();
  ctx.strokeStyle = "rgba(255,220,170,.18)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x - 2, y - 2, sz + 4, sz + 4, 15); ctx.stroke();
  ctx.fillStyle = "#1e1912"; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, sz - 6, sz - 6, 11); ctx.fill();
  // recessed cells: darker top edge, faint lit bottom edge
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const cx = bx + c * cell + 2, cy = by + r * cell + 2, w = cell - 4;
    const up = biome?.id === "skywell" && !daily, cg = ctx.createLinearGradient(cx, cy, cx, cy + w); // Skywell: you dig up, toward the light
    cg.addColorStop(0, up ? "#3a3a44" : mix("#26221b", pal.cave, .4)); cg.addColorStop(1, up ? "#1e1e26" : mix("#38342b", pal.cave, .3));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(cx, cy, w, w, 5); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 4, cy + .5); ctx.lineTo(cx + w - 4, cy + .5); ctx.stroke();
    ctx.strokeStyle = "rgba(255,240,210,.05)"; ctx.beginPath(); ctx.moveTo(cx + 4, cy + w - .5); ctx.lineTo(cx + w - 4, cy + w - .5); ctx.stroke();
  }
  for (const m of moss) { // moss tufts on the top and left of the frame, two tones with a lit edge
    const px = m.side ? x : x + m.t * sz, py = m.side ? y + m.t * sz * .6 : y;
    for (let k = 0; k < 3; k++) { ctx.fillStyle = tuft[k % 2 ? 0 : 1];
      ctx.beginPath(); ctx.arc(px + (k - 1) * 3 * m.r, py + (k % 2) * 1.6, 3 * m.r, 0, 7); ctx.fill();
      ctx.fillStyle = tuft[2]; ctx.beginPath(); ctx.arc(px + (k - 1) * 4 * m.r - 1, py + (k % 2) * 2 - 1.2, 1.6 * m.r, 0, 7); ctx.fill(); }
  }
  if (biome?.id === "skywell" && !daily) { // a thin shaft of sky through the rubble, brightest at the top
    const lg = ctx.createLinearGradient(0, by, 0, by + cell * N); lg.addColorStop(0, "rgba(244,240,255,.22)"); lg.addColorStop(.6, "rgba(244,240,255,0)");
    ctx.fillStyle = lg; ctx.fillRect(bx, by, cell * N, cell * N);
  }
}
function rootPath() { // frame rectangle, starting top-centre, clockwise
  const m = 18, x = bx - m, y = by - m, w = cell * N + 2 * m, h = w;
  const segs = [[x + w / 2, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y], [x, y, x + w / 2, y]];
  const lens = segs.map(([a, b, c, d]) => Math.hypot(c - a, d - b));
  return { segs, lens, L: lens.reduce((s, v) => s + v, 0) };
}
function pointAt(p, d) {
  for (let i = 0; i < p.segs.length; i++) {
    if (d <= p.lens[i] || i === p.segs.length - 1) { const [a, b, c, e] = p.segs[i], t = Math.min(1, d / p.lens[i]);
      return { x: a + (c - a) * t, y: b + (e - b) * t, ang: Math.atan2(e - b, c - a) }; }
    d -= p.lens[i];
  }
}
function rootColor(f) {
  return f > .5 ? "#7cc46a" : f > T.warn ? lerpHex("#e0a33a", "#7cc46a", (f - T.warn) / (.5 - T.warn)) : lerpHex(T.warn > 0 ? "#d6453d" : "#d6453d", "#e0a33a", f / T.warn);
}
function drawRootline(now) {
  const f = Math.max(0, time / maxTime), p = rootPath(), len = p.L * f, col = now < frozenUntil ? "#bfefff" : rootColor(f);
  // dead puddock track underneath
  ctx.strokeStyle = "rgba(80,40,30,.35)"; ctx.lineWidth = 3; ctx.setLineDash([3, 7]); ctx.beginPath();
  p.segs.forEach(([a, b, c, d]) => { ctx.moveTo(a, b); ctx.lineTo(c, d); }); ctx.stroke(); ctx.setLineDash([]);
  if (len <= 0) return;
  // painted like the rest of the world: its own darker tone peeking out down-left, the body, one thin highlight on top
  const vine = new Path2D(), st = pointAt(p, 0); vine.moveTo(st.x, st.y);
  for (let d = 6; d < len; d += 6) { const q = pointAt(p, d); vine.lineTo(q.x, q.y); }
  const tip = pointAt(p, len); vine.lineTo(tip.x, tip.y); ctx.lineCap = "round"; ctx.lineJoin = "round";
  const edge = (dx, dy, c, w, a = 1) => { ctx.save(); ctx.translate(dx, dy); ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.stroke(vine); ctx.restore(); };
  edge(-1.3, 1.2, mix(col, "#0e1c12", .55), 7); edge(0, 0, col, 7); edge(.7, -1.4, mix(col, "#fff8e0", .5), 1.6, .55);
  // leaves (thorns when low), each with the same darker edge down-left
  for (let d = 14, k = 0; d < len - 6; d += 26, k++) {
    const q = pointAt(p, d), side = k % 2 ? 1 : -1, leaf = f > T.warn ? mix(col, "#1d3b2a", .25) : "#8c2f22";
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.ang + side * .9);
    const shape = () => { ctx.beginPath(); f > T.warn ? ctx.ellipse(8, 0, 8, 3.5, 0, 0, 7) : (ctx.moveTo(0, -3), ctx.lineTo(10, 0), ctx.lineTo(0, 3)); };
    ctx.save(); ctx.rotate(-(q.ang + side * .9)); ctx.translate(-1, .9); ctx.rotate(q.ang + side * .9); shape(); ctx.fillStyle = mix(leaf, "#0e1c12", .5); ctx.fill(); ctx.restore();
    shape(); ctx.fillStyle = leaf; ctx.fill(); ctx.restore();
  }
  // glowing growing tip
  const pulse = 1 + .25 * Math.sin(now / (f > T.warn ? 300 : 110));
  ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.fillStyle = mix(col, "#ffffff", .4);
  ctx.beginPath(); ctx.arc(tip.x, tip.y, 6 * pulse, 0, 7); ctx.fill(); ctx.restore();
  if (save.owned.includes("fireflies")) for (let i = 0; i < 9; i++) {
    const q = pointAt(p, (len * (i + .5)) / 9 + Math.sin(now / 900 + i) * 10);
    ctx.save(); ctx.globalAlpha = .5 + .5 * Math.sin(now / 250 + i * 2); ctx.fillStyle = "#fff3a0"; ctx.shadowColor = "#fff3a0"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(q.x + Math.cos(now / 700 + i) * 9, q.y + Math.sin(now / 600 + i) * 9, 2.2, 0, 7); ctx.fill(); ctx.restore();
  }
}

// ---------- effects ----------
// Glow is baked once per colour into a small sprite and drawn with "lighter" blending: no shadowBlur on particles.
// Effects roll their own seeded stream (reset each dig), so a seeded run (the trailer) replays the same bursts,
// and the game's Math.random (memories, pets) doesn't shift when an effect changes.
let fxR = mulberry(7);
const glows = new Map(), pals = new Map();
function glowSpr(col, pure = false) { // white-hot core, the colour, then nothing; pure: all colour, no white (the burst)
  let c = glows.get(col + pure); if (c) return c;
  c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, pure ? hexA(col, 1) : "rgba(255,255,250,.95)"); r.addColorStop(pure ? .35 : .2, hexA(col, pure ? .7 : .8)); r.addColorStop(.6, hexA(col, .2)); r.addColorStop(1, hexA(col, 0));
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); glows.set(col + pure, c); return c;
}
const vivid = (h) => { const c = hex(h), l = (c[0] + c[1] + c[2]) / 3; // pushed well past the stone's own colour: the breaks are the brightest thing on screen
  return "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(l + (v - l) * 2.05))).toString(16).padStart(2, "0")).join(""); };
const palOf = (h) => { let p = pals.get(h); if (!p) { const col = vivid(h); pals.set(h, p = { col, lt: lerpHex(col, "#ffffff", .45), dk: lerpHex(col, "#000000", .4), glow: lerpHex(col, "#fff4dc", .06) }); } return p; };
const FLAVOUR = { // how the specials break: shard shape, gravity, fade per frame, extra motes, their colour
  frost: { k: "flake", pal: "#6fe8ff", g: .1, fade: .02, motes: 1, mote: "#c4f6ff" },
  ember: { k: "spark", pal: "#ff6414", g: .2, fade: .034, motes: 2, mote: "#ffa040" },
  geode: { rock: "#6b5a70", sparkle: 4, mote: "#f0dcff" },
  heart: { pulse: true, motes: 2, mote: "#ff9ccc" },
  glowcap: { motes: 3, mote: "#c2a6ff", slow: true },
  rubble: { matte: true },
};
// a clear: each cell blooms with light and bursts into faceted shards in its own colour, a light sweeps the line, motes drift up.
// power 1–6 (lines, combo, embers, pure veins) scales the bloom, the motes and a soft glow over the board; reduced motion keeps the glow only
function shatter(idxs, typeAt, stagger = 12, power = 1, lines = null) {
  const big = Math.min(1, (power - 1) / 4), per = Math.max(2, Math.min(3 + Math.round(Math.min(3, power)), Math.floor(170 / idxs.length)));
  let motes = 0; const maxMotes = 6 + Math.round(26 * big), ba = Math.min(.9, 3 / Math.sqrt(idxs.length)); // many blooms overlap in a big clear: each one softer
  const p0 = palOf(CRYSTALS[typeAt(idxs[0])]?.color || "#c9b6ff");
  if (!calmMotion && lines) for (const [list, row] of [[lines.rows, true], [lines.cols, false]]) for (const v of list) fx.push({ kind: "sweep", row, v, life: 1, dur: .34, delay: 20 });
  if (!calmMotion && power >= 2) fx.push({ kind: "screen", col: p0.glow, a: .08 + .1 * big, life: 1, dur: .6 + .25 * big, delay: 0 });
  idxs.forEach((i, k) => {
    const t = typeAt(i), F = FLAVOUR[t] || {}, P = palOf(F.pal || CRYSTALS[t]?.color || "#c9b6ff"), d = k * stagger;
    const x = bx + (i % N + .5) * cell, y = by + (Math.floor(i / N) + .5) * cell;
    fx.push({ kind: "flash", x: x - cell / 2, y: y - cell / 2, col: P.lt, a: ba * .8, life: 1, dur: .24, delay: d });
    if (!F.matte) fx.push({ kind: "burst", x, y, col: P.col, s: cell * (1.7 + .5 * big), rays: idxs.length > 16 ? 4 : 7, rot: fxR() * 6, a: Math.min(1, 5.5 / Math.sqrt(idxs.length)), life: 1, dur: calmMotion ? .3 : .4 + .1 * big, delay: d });
    if (!F.matte) fx.push({ kind: "bloom", x, y, col: P.glow, s: cell * (2.6 + .8 * big), a: Math.min(1, ba * 1.2) * (1 - .3 * big), life: 1, dur: calmMotion ? .35 : .32 + .14 * big, delay: d });
    if (calmMotion || parts.length > 240) return;
    const rock = F.rock && palOf(F.rock);
    for (let j = 0; j < per; j++) { const a = fxR() * Math.PI * 2, v = 1.5 + fxR() * (2.5 + power), q = rock && j % 2 ? rock : P;
      parts.push({ k: F.k && j % 3 !== 2 ? F.k : "shard", x, y, vx: Math.cos(a) * v * (F.k === "spark" ? 1.6 : 1), vy: Math.sin(a) * v - 2.5, rot: fxR() * 6, vr: (fxR() - .5) * .35,
        s: cell * (.15 + fxR() * .24), w: .65 + fxR() * .55, ph: fxR() * 6, g: F.g || .35, fade: F.fade || .024, col: q.col, dk: q.dk, lt: q.lt, life: 1, delay: d + 40 }); }
    for (let j = (k % 2 ? 0 : 1) + (F.motes || 0) + Math.round(big * 1.5); j > 0 && motes < maxMotes + (F.motes || 0) * 2; j--, motes++) // sparkle motes drift up and twinkle out
      fx.push({ kind: "mote", x: x + (fxR() - .5) * cell * .8, y: y + (fxR() - .5) * cell * .5, vx: (fxR() - .5) * .8, vy: -(F.slow ? .7 : 1.1) - fxR() * 1.4 - big,
        s: cell * (.45 + fxR() * .35), col: F.mote || P.glow, ph: fxR() * 6, life: 1, dur: .75 + fxR() * .3, delay: d + 60 });
    for (let j = 0; j < (F.sparkle || 0); j++) { const a = (j / F.sparkle) * Math.PI * 2 + fxR(), v = 2 + fxR() * 2.5; // the geode's cavity bursts into glints
      fx.push({ kind: "star", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 3 + fxR() * 4, col: "#f6e8ff", life: 1, dur: .5, delay: d + 30 }); }
    if (F.pulse) for (const pd of [0, 170]) fx.push({ kind: "pulse", x, y, col: "#ff8fae", life: 1, dur: .6, delay: d + pd }); // the heartstone's warm beat
  });
}
// coins pop out of the clear, arc up, and fly into the Haul badge (count grows with the gold)
const coinImg = new Image(); coinImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(coin(144).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
let coins = [], lastBump = 0;
function coinPop(idxs, gold) {
  const n = Math.max(2, Math.min(14, Math.round(1 + Math.log2(1 + gold) * 1.3))), now = performance.now();
  for (let k = 0; k < n; k++) { const i = idxs[Math.floor(fxR() * idxs.length)], x = bx + (i % N + .5) * cell, y = by + (Math.floor(i / N) + .5) * cell;
    coins.push({ x, y, cx: x + (fxR() - .5) * cell * 3, cy: y - cell * (1.5 + fxR() * 1.5), at: now + 60 + k * 45, dur: 620 + fxR() * 160, k }); }
}
function drawCoins(now) {
  ctx.globalCompositeOperation = "lighter"; // first a warm glow under each coin, and a glint as it leaves the clear
  for (const q of coins) { const t = (now - q.at) / q.dur; if (t < 0 || t >= 1) continue;
    const e = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2, u = 1 - e, [hx, hy] = haulAt, s = cell * .5 * (t < .15 ? easeBack(t / .15) : 1 - .4 * t);
    const x = u * u * q.x + 2 * u * e * q.cx + e * e * hx, y = u * u * q.y + 2 * u * e * q.cy + e * e * hy, gl = Math.sin(Math.PI * Math.min(1, t / .4));
    ctx.globalAlpha = .5 * (1 - .5 * t); ctx.drawImage(glowSpr("#ffc24a"), x - s, y - s, s * 2, s * 2);
    if (gl > 0) { ctx.globalAlpha = gl; ctx.drawImage(glowSpr("#fff1c0"), x - s * .55, y - s * .6, s * .7 * gl, s * .7 * gl); } }
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  coins = coins.filter((q) => {
    const t = (now - q.at) / q.dur; if (t < 0) return true;
    if (t >= 1) { if (now - lastBump > 70) { lastBump = now; $("coinHud").animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 180, easing: "ease-out" }); }
      if (q.k < 6) sfx.coin(q.k); return false; }
    const e = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2, u = 1 - e, [hx, hy] = haulAt; // ease in-out along a curve: pop up, then home in
    const x = u * u * q.x + 2 * u * e * q.cx + e * e * hx, y = u * u * q.y + 2 * u * e * q.cy + e * e * hy, s = cell * .5 * (t < .15 ? easeBack(t / .15) : 1 - .4 * t);
    ctx.drawImage(coinImg, x - s / 2, y - s / 2, s, s); return true;
  });
}
const float = (text, x, y, color = "#f0b543") => floats.push({ text, x, y, color, life: 1 });
// satisfying extras: star bursts, shockwave rings, screen shake, a brief hit-stop, combo pops, gem twinkles
let fx = [], shakeAmp = 0, hitStop = 0, pops = [], twinkles = [], lastTwinkle = 0;
function starBurst(x, y, n = 10, col = "#fff6c8") {
  if (calmMotion) return; // reduced motion: the cells' glow says it
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + fxR() * .4, v = 3 + fxR() * 4;
    fx.push({ kind: "star", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 4 + fxR() * 5, col, life: 1, dur: .55 }); }
  fx.push({ kind: "ring", x, y, r: cell * .4, life: 1, dur: .37 });
}
function toast(html, ms = 1500) {
  const el = $("toast"); el.innerHTML = html; el.style.opacity = 1;
  clearTimeout(toast.t); toast.t = setTimeout(() => (el.style.opacity = 0), ms);
}

// ---------- input ----------
let drag = null, back = [], dealtAt = 0; // back[i]: a piece that didn't fit, gliding home to its slot
function trayRect(i) {
  const p = tray[i].piece;
  return { s: ts, x: trayX + slotW * i + (slotW - p.w * ts) / 2, y: trayY + (trayH - p.h * ts) / 2 };
}
// drag starts anywhere in a piece's third of the tray (the whole slot, down to the bottom of the screen)
cv.addEventListener("pointerdown", (e) => {
  if (state !== "play" || !tray) return;
  const said = lifeTap(e.clientX, e.clientY); // tapped the other lantern in time: a line, and a tally nobody shows you (yet)
  if (said) { toast("", 2800); say($("toast"), said, "dibble"); save.lanterns = (save.lanterns || 0) + 1; persist(); return; }
  const i = Math.floor((e.clientX - trayX) / slotW);
  if (i < 0 || i > 2 || !tray[i] || e.clientY < trayY - 18) return;
  drag = { i, ...tray[i], x: e.clientX, y: e.clientY, touch: e.pointerType !== "mouse", at: performance.now(), from: trayRect(i) };
  back[i] = null; cv.setPointerCapture(e.pointerId); sfx.pick(); buzz(6);
});
cv.addEventListener("pointermove", (e) => { if (drag) { drag.x = e.clientX; drag.y = e.clientY; } });
// cancel: an interrupted drag (system alert, app switch, lost focus) never places; the piece glides home
const drop = (e, cancel) => { if (!drag) return; const t = target();
  if (!cancel && !t.bad && state === "play") commit(drag.i, t.r, t.c, t);
  else { back[drag.i] = { x: t.x, y: t.y, s: cell, at: performance.now() }; sfx.drop(); }
  drag = null; };
const cancelDrag = () => drop(null, true);
cv.addEventListener("pointerup", drop); cv.addEventListener("pointercancel", cancelDrag);
addEventListener("blur", cancelDrag); document.addEventListener("visibilitychange", () => { if (document.hidden) cancelDrag(); });
function target() {
  // touch: the piece rides above the finger (its bottom edge most of a cell above it) so you can see where it goes
  const p = drag.piece, x = drag.x - (p.w * cell) / 2, y = drag.touch ? drag.y - cell * .8 - p.h * cell : drag.y - (p.h * cell) / 2;
  const fr = (y - by) / cell, fc = (x - bx) / cell; // forgiving snap: the nearest legal spot within a cell of the rounded one
  let best = null;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r = Math.round(fr) + dr, c = Math.round(fc) + dc, d = (r - fr) ** 2 + (c - fc) ** 2;
    if (d < .72 && (!best || d < best.d) && canPlace(board, p, r, c)) best = { r, c, d }; }
  return best ? { r: best.r, c: best.c, x, y } : { x, y, bad: true };
}

// ---------- a placement ----------
function commit(i, r, c, from) {
  const { piece, type } = tray[i], id = uid++;
  const pc = tray[i].pet && piece.cells[tray[i].petCell]; // the sleeping pet's cell, as a board index
  meta[id] = { type, r, c, h: piece.h, w: piece.w, at: performance.now(), memory: tray[i].memory, pet: tray[i].pet, petAt: pc ? (r + pc[0]) * N + c + pc[1] : -1, // `at` drives the landing: glide into the cell, squash, settle
    ox: from ? from.x - (bx + c * cell) : 0, oy: from ? from.y - (by + r * cell) : 0 };
  board = place(board, piece, r, c, id);
  started = true; placedN++;
  sfx.place(); buzz(8);
  const lines = fullLines(board), n = lines.rows.length + lines.cols.length;
  if (n) {
    combo++; miss = 0;
    const br = breakCells(board, lines, isEmber), embers = br.embers, sb = stoneBreak(board, br.cells, isStone, cracked), cells = sb.cells, pure = pureVeinCells(board, lines, typeOf), before = board;
    const shooLoot = shooMoths(cells); freePets(cells, before); petHop = performance.now();
    for (const k of cells) { const mem = meta[before[k]]?.memory; if (mem && !save.story.mem.includes(mem)) { // an Amber Memory breaks open
      save.story.mem.push(mem); newMem.push(mem); persist(); meta[before[k]].memory = null; track("memory_found", { id: mem }); platform.submitScore("memories_found", save.story.mem.length);
      pops.push({ text: "An Amber Memory!", life: 1.2, col: "#ffd27a" }); [659, 880, 1047, 1319].forEach((f, j) => tone(f, .5, "sine", .07, j * .09)); } }
    let gained = shooLoot;
    const inLine = new Set(lineCells(lines)), lens = .5 * save.up.lens, tongs = .25 * save.up.tongs;
    for (const k of cells) {
      if (isMoth(before[k])) continue;
      const t = typeOf(before[k]), v = CRYSTALS[t].value, m = pure.has(k) ? 2 : 1;
      haul[t] = (haul[t] || 0) + m; gained += v * m;
      const extra = (pure.has(k) ? v * lens : 0) + (!inLine.has(k) ? v * m * tongs : 0); // Gem Lens, Ember Tongs
      bonus += extra; gained += extra;
    }
    gained = Math.round(gained * valueMult());
    const ctr = cells.reduce((a, k) => [a[0] + (k % N), a[1] + Math.floor(k / N)], [0, 0]).map((v) => v / cells.length);
    const cx = bx + (ctr[0] + .5) * cell, cy = by + (ctr[1] + .5) * cell;
    const power = Math.min(6, n + (combo - 1) * .5 + (embers ? 1 : 0) + (pure.size ? 1 : 0)); // how big this clear feels
    starBurst(cx, cy, 6 + Math.round(power * 4), pure.size ? "#ffd27a" : "#fff6c8");
    if (power >= 2 && !calmMotion) { shakeAmp = Math.min(12, 2 + power * 1.7); hitStop = performance.now() + 30 + 20 * power; }
    if (combo >= 2) pops.push({ text: combo >= 5 ? `Combo ×${combo}!!` : `Combo ×${combo}!`, life: 1, col: combo >= 5 ? "#ff9db5" : "#ffd27a" });
    if (n >= 3) pops.push({ text: n >= 4 ? "Glimmering!" : "Brilliant!", life: 1.15, col: "#9fe6ff" });
    shatter(cells.sort((a, b) => (a % N + Math.floor(a / N)) - (b % N + Math.floor(b / N))), (k) => typeOf(before[k]), 12, power, lines);
    coinPop(cells, gained);
    board = clearCells(board, cells); cracked = sb.cracked;
    if (sb.hits) { sfx.crack(); buzz(20); }
    const add = T.refill_per_line * n * (1 + .1 * save.up.charm) * (1 + T.combo_bonus * (combo - 1));
    let bloom = 0, freeze = 0;
    for (const k of cells) { const cr = CRYSTALS[typeOf(before[k])] || {}; bloom += cr.bloom || 0; freeze += cr.freeze || 0; }
    time = Math.min(maxTime, time + add + bloom);
    if (freeze) frozenUntil = Math.max(frozenUntil, performance.now()) + Math.min(T.freeze_max, freeze) * 1000;
    float(`+${gained}g`, bx + (ctr[0] + .5) * cell, by + (ctr[1] + .5) * cell);
    float(`+${add.toFixed(1)}s`, bx + cell * N / 2, by - 30, "#9be08a");
    sfx.clear(n, combo, power);
    if (pure.size) { toast("Pure vein ×2!"); sfx.pure(); }
    if (bloom) { float(`+${bloom}s glow`, bx + cell * N / 2, by - 8, "#c9b6ff"); sfx.bloom(); }
    if (freeze) { toast("Frozen roots!"); sfx.freeze(); }
    if (embers) { toast(embers > 3 ? `Ember chain ×${embers}!` : "Ember burst!"); sfx.ember(); }
    buzz(power >= 3 ? 60 : power >= 2 ? 25 : 15);
    $("comboTxt").textContent = combo > 1 ? `Combo ×${combo}` : "";
  } else if (combo && ++miss >= T.combo_break) { combo = 0; miss = 0; $("comboTxt").textContent = ""; tone(196, .25, "sine", .06); }
  tray[i] = null;
  if (tray.every((q) => !q)) { tray = dealTray(); mothTurn(); }
  if (!tray.some((q) => q && fitsAnywhere(board, q.piece))) endRound("stuck");
}

// ---------- round end, selling ----------
function endRound(cause) {
  if (state === "play") track("round_end", { mine: biome.id, cause, value: haulValue(), seconds: Math.round(maxTime - time) });
  if (state !== "play") return;
  state = "end"; endCause = cause; drag = null; ending = { cause, at: performance.now() }; lifeStop();
  pops.push({ text: cause === "time" ? "The roots closed in!" : "No room left!", life: 1.3, col: cause === "time" ? "#ff9d7a" : "#ffd27a" });
  sfx.thud(); buzz(40);
  // first a beat to see what happened, then the rescue offer (once per dig), then the haul
  setTimeout(() => (rescueUsed ? showHaul() : offerRescue()), 1400);
}
let ending = null; // { cause, at }: the "no room" / "roots closed in" moment, drawn on the board
function offerRescue() {
  const time = endCause === "time";
  $("offerIco").innerHTML = icon(time ? "vine" : "board", 44);
  $("offerTitle").textContent = time ? "The roots closed in" : "No room left";
  $("offerSub").textContent = "Keep digging? Your haul is safe either way.";
  $("rescueGo").innerHTML = `<span class="btnrow">${icon(time ? "regrow" : "shatter", 22)}${time ? `Roots regrow +${T.rescue_time}s` : "Shatter the 3 fullest veins"}</span><small style="display:block;font-weight:600;font-size:13px;opacity:.85">Watch a short ad</small>`;
  $("rescueOffer").classList.add("show"); sfx.whoosh();
}
$("rescueNo").onclick = () => { $("rescueOffer").classList.remove("show"); showHaul(); };
function showHaul() {
  $("rescueOffer").classList.remove("show");
  const cause = endCause;
  {
    $("endTitle").textContent = cause === "time" ? "The roots closed the tunnel" : "No room left to dig";
    $("endSub").innerHTML = (cause === "time" && !daily ? `<i>${pick(save.story.finale ? MURMURS_AFTER : save.story.site === "stump" ? MURMURS : MURMURS_DEEP)}</i><br>` : "") + "Dibble climbs out with the haul. Nothing is lost.";
    $("memCard").innerHTML = newMem.map((id) => { const m = memoryById(id), mine = mineOfMemory(id), k = MEMORIES[mine].indexOf(m) + 1;
      return `<div class="memCard">${memoryArt(m.art, 200)}<div class="memCap">${m.text}</div><small>Amber Memory · ${BIOMES.find((b) => b.id === mine).name} ${k}/${MEMORIES[mine].length}</small></div>`; }).join("") +
      newPets.map((k) => `<div class="memCard">${pet(k, 104, wearOf(k))}<div class="memCap">${PETS[k].line}</div><small>${PETS[k].name} · waiting at camp</small></div>`).join("");
    clearTimeout(tallyHaul.t);
    $("causeIco").innerHTML = cause === "time" ? icon("vine", 34) : icon("board", 34);
    $("rescue").innerHTML = `<span class="btnrow">${icon(cause === "time" ? "regrow" : "shatter", 22)}${cause === "time" ? `Roots regrow +${T.rescue_time}s` : "Shatter the 3 fullest veins"}</span>`;
    $("rescue").style.display = "none"; // offered before the haul now (offerRescue)
    // Puddock's ledger, one line per gem type; tallyHaul() reveals them one by one
    const mult = valueMult(), fresh = Object.keys(haul).filter((t) => GEMS.includes(t) && !save.found.includes(t));
    const rows = Object.entries(haul).map(([t, n]) => ({ v: Math.round(n * CRYSTALS[t].value * mult), fresh: fresh.includes(t),
      html: `${gem(CRYSTALS[t].color, 26, save.opt.glyph ? CRYSTALS[t].glyph : "", CRYSTALS[t].cut)}<span class="n">×${n}</span><span class="nm">${CRYSTALS[t].name}${fresh.includes(t) ? `<em class="newTag">New</em>` : ""}</span>` }));
    if (stolen > 0) rows.push({ v: -Math.round(stolen * mult), html: `<i class="ph"></i><span class="n"></span><span class="nm">Pilfermoths<small>clear a line through one to win it back</small></span>` });
    if (bonus) rows.push({ v: Math.round(bonus * mult), html: `${icon(save.up.tongs ? "tongs" : "lens", 26)}<span class="n"></span><span class="nm">Bonuses<small>lens, tongs, shooed moths</small></span>` });
    $("haulList").innerHTML = rows.map((r) => `<div class="haulRow${r.v < 0 ? " neg" : ""}">${r.html}<span class="v">${r.v < 0 ? "−" : ""}${Math.abs(r.v)}g</span></div>`).join("") ||
      `<div class="note">No crystals this time.</div>`;
    $("sell2").textContent = "Puddock's double deal: ×2";
    $("sell").textContent = "Sell to Old Puddock";
    $("haulTotal").textContent = "0g";
    $("sell2").style.display = haulValue() ? "block" : "none";
    $("puddockLine").textContent = puddockLine();
    show("end"); $("endBody").scrollTop = 0;
    tallyHaul(rows, haulValue() > (daily ? save.daily.best : save.best[bestKey()] || 0) && haulValue(), fresh);
  }
}
// the haul tallies: each ledger line lands with a tick and the total counts up, then the total, any new best or new gem, then Sell
function tallyHaul(rows, best, fresh) {
  const els = [...$("haulList").querySelectorAll(".haulRow")], total = $("ledger").querySelector(".total"), foot = $("endFoot");
  let k = 0, sum = 0, done = false;
  const reveal = (el) => { const b = $("endBody"), d = el.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom + 6; if (d > 0) b.scrollTop += d; }; // scroll the ledger only, never the page
  for (const id of ["newBest", "newGem", "newPet"]) $(id).style.display = "none";
  total.classList.remove("land"); foot.classList.add("wait");
  const countTo = (from, to) => { const t0 = performance.now(), f = (now) => { if (done) return; const p = Math.min(1, (now - t0) / 280);
    $("haulTotal").textContent = Math.max(0, Math.round(from + (to - from) * p)) + "g"; if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
  const finish = () => {
    if (done) return; done = true; clearTimeout(tallyHaul.t);
    for (const el of els) el.classList.add("in");
    $("haulTotal").textContent = haulValue() + "g"; total.classList.add("land"); tone(1319, .18, "triangle", .07); tone(1760, .22, "triangle", .05, .06);
    const moments = [];
    if (best) moments.push($("newBest"));
    if (fresh.length) { $("newGem").textContent = `New on the shelf: ${fresh.map((t) => CRYSTALS[t].name).join(", ")}`; moments.push($("newGem")); }
    if (newPets.length) { $("newPet").innerHTML = newPets.map((k) => `${pet(k, 30, wearOf(k))}Found ${aName(k)}!`).join("<br>"); moments.push($("newPet")); }
    for (const el of moments) el.style.display = "block";
    if (moments.length) setTimeout(() => { for (const el of moments) sparkleAt(el); [1047, 1319, 1568, 2093].forEach((f, j) => tone(f, .3, "sine", .06, j * .07)); buzz(20); }, 120);
    reveal(moments.at(-1) || total);
    foot.classList.remove("wait");
  };
  const step = () => {
    if (k >= els.length) return finish();
    const el = els[k], r = rows[k]; el.classList.add("in"); reveal(el);
    countTo(sum, sum += r.v); tone(880 + Math.min(k, 8) * 90, .07, "triangle", .05); buzz(5);
    if (r.fresh) sparkleAt(el.querySelector("svg") || el);
    k++; tallyHaul.t = setTimeout(step, 360);
  };
  $("ledger").onclick = finish; // tap the ledger to skip the count
  if (!els.length || matchMedia("(prefers-reduced-motion: reduce)").matches) finish(); else tallyHaul.t = setTimeout(step, 500);
}
$("rescueGo").onclick = async () => {
  if (!(await platform.rewarded(endCause === "time" ? "rescue_time" : "rescue_stuck"))) return toast("No ad ready, try again in a moment");
  rescueUsed = true; state = "play"; ending = null; $("rescueOffer").classList.remove("show"); show(null);
  if (endCause === "time") time = Math.min(maxTime, T.rescue_time);
  else {
    const cells = rescueCells(board, 3), before = board;
    shooMoths(cells); freePets(cells, before);
    shatter(cells, (k) => typeOf(before[k]), 5);
    board = clearCells(board, cells); cells.forEach((k) => cracked.delete(k)); tray = dealTray();
    if (time < T.rescue_time) time = T.rescue_time;
  }
  sfx.rescue(); buzz(40);
  if (!tray.some((q) => q && fitsAnywhere(board, q.piece))) endRound("stuck");
};
const bestKey = () => biome.id + (calm ? ":calm" : "");
// coin rain: coins burst up from the middle of camp and arc into the coin counter, which counts up as they land;
// then whatever the haul changed in camp (a new gem on the shelf, the stump) sparkles
function coinRain(v, from, fresh = [], pillId = "homeGoldPill", numId = "homeGold") {
  const pill = $(pillId).getBoundingClientRect(), n = Math.min(16, 5 + Math.floor(Math.log2(1 + v) * 1.2)), tx = pill.left + 8, ty = pill.top + pill.height / 2 - 13;
  $(numId).textContent = from;
  for (let k = 0; k < n; k++) {
    const el = document.createElement("div"); el.className = "flyCoin"; el.innerHTML = coin(26); document.body.appendChild(el);
    const sx = innerWidth / 2 + (Math.random() - .5) * 120, sy = innerHeight * .6 + (Math.random() - .5) * 60, px = sx + (Math.random() - .5) * 140, py = sy - 90 - Math.random() * 90;
    const at = (t) => { const u = 1 - t; return [u * u * sx + 2 * u * t * px + t * t * tx, u * u * sy + 2 * u * t * py + t * t * ty]; };
    const a = el.animate([0, .2, .45, .7, .88, 1].map((t, j) => { const [x, y] = at(t); return { transform: `translate(${x}px, ${y}px) scale(${j ? 1 - t * .35 : .3})`, opacity: j ? 1 : 0, offset: t }; }),
      { duration: 820, easing: "cubic-bezier(.45,0,.55,1)", delay: k * 55, fill: "backwards" });
    a.onfinish = () => { el.remove(); if (k < 8) sfx.coin(k); if (k % 3 === 0) buzz(5); $(numId).textContent = bigG(Math.round(from + v * (k + 1) / n));
      $(pillId).animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 160, easing: "ease-out" }); };
  }
  setTimeout(() => {
    $(numId).textContent = bigG(save.gold);
    if (numId !== "homeGold") return;
    for (const t of fresh) { const el = document.querySelector(`#campArt [data-tap="gem-${GEMS.indexOf(t)}"]`); if (el) { sparkleAt(el); soundtrack.chime(GEMS.indexOf(t)); } }
    const stump = document.querySelector('#campArt [data-tap="memories"]'); if (stump && save.story.site === "stump") sparkleAt(stump);
  }, 900 + n * 55);
}
function sell(mult) {
  const v = haulValue() * mult;
  save.gold += v; save.light += v;
  const fresh = Object.keys(haul).filter((t) => GEMS.includes(t) && !save.found.includes(t));
  save.found.push(...fresh);
  if (daily) {
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (save.daily.last !== today()) save.daily = { last: today(), streak: save.daily.last === y ? save.daily.streak + 1 : 1, best: haulValue() };
    else save.daily.best = Math.max(save.daily.best, haulValue());
  } else save.best[bestKey()] = Math.max(save.best[bestKey()] || 0, haulValue());
  persist();
  if (!calm) platform.submitScore("best_haul", haulValue()); // Game Center keeps each player's best. Calm Grove has no clock, so it stays off the board
  if (daily) platform.submitScore("daily_dig", save.daily.best); // a leaderboard that resets daily (docs/SETUP.md)
  state = "home"; renderHome(); show("home");
  track("haul_sold", { mine: biome.id, value: v, doubled: mult > 1 });
  platform.expeditionDone().then((shown) => { // interstitial, only when the pacing caps allow: sitting through one pays the haul again
    if (!shown || !v) return;
    save.gold += v; persist(); track("ad_double", { value: v });
    toast(`<b>2× gold awarded!</b>`, 2600); coinRain(v, save.gold - v, []);
  });
  if (v) coinRain(v, save.gold - v, fresh);
  // before the first talk, the stall's "Psst!" bubble and the camp hint invite the player over (tapping the stall starts it)
  if (save.metPuddock) { const sc = nextScene(save.story); if (sc) setTimeout(() => playScene(sc), 900); } // docs/STORY.md, in order
}
$("sell").onclick = () => wipe("up", () => sell(1));
$("sell2").onclick = async () => (await platform.rewarded("double_deal")) ? wipe("up", () => sell(2)) : toast("No ad ready, try again in a moment");

// ---------- home and market ----------
const SHEETS = ["mineSheet", "dailySheet", "wardrobe", "optsSheet", "market", "memSheet", "purseSheet"];
let base = "title"; // the screen popups sit on: the title screen or the camp
function show(id) {
  if (id === "title" || id === "home") base = id;
  const under = SHEETS.includes(id) ? base : null;
  document.body.classList.toggle("playing", !id);
  for (const s of ["title", "home", "end", "talk", ...SHEETS]) $(s).classList.toggle("show", s === id || s === under);
  $("hud").style.visibility = id && id !== "end" ? "hidden" : "visible";
  platform.banner(id === "home" || id === "market");
  if (id === "title") soundtrack.play("home"); else if (id && id !== "end" && id !== "talk") soundtrack.play("camp"); }
for (const b of document.querySelectorAll(".close")) b.onclick = () => { renderHome(); show(base); };
// ---------- scene transitions: cover, switch the scene underneath (mid), uncover ----------
// iris: the dark closes in on a lantern (from) and opens again on Dibble (to). down: a wall of earth rushes up past you as
// you dig in, crystals glinting in the soil; up: the same earth falls away as you climb out into the lantern light.
// Reduced motion: a short fade. Taps are held while it plays.
let wiping = false;
function earthArt(w, h) { // painted soil, 1.5 screens tall: ragged lips top and bottom, strata, stones, a few crystals
  const r = prng(Math.round(w * 7 + h)), lip = (y, dir) => [...Array(13)].map((_, k) => [k / 12 * w, y + dir * (6 + r() * 16)]);
  const top = lip(18, 1), bot = lip(h - 18, -1), body = curve([[-20, top[0][1]], ...top, [w + 20, top[12][1]], [w + 20, bot[12][1]], ...bot.reverse(), [-20, bot[12][1]]]);
  const bands = [.18, .34, .5, .66, .82].map((f, k) => `<path d="${curve([...Array(9)].map((_, j) => [j / 8 * (w + 40) - 20, f * h + Math.sin(j * 1.7 + k) * 10]), false)}" stroke="${k % 2 ? "#3a2818" : "#140d07"}" stroke-width="${10 + k * 3}" fill="none" opacity=".45"/>`).join("");
  const stones = [...Array(16)].map((_, k) => { const x = r() * w, y = h * (.06 + r() * .88), s = 5 + r() * 12;
    return shape(curve(ring(x, y, s, s * .7, 8, .25, k + 3)), k % 3 ? "#4a3a2c" : "#5e4c3a", "#1a120b", [-1.4, 1.2]); }).join("");
  const gems = Object.values(CRYSTALS).filter((c) => !c.stone), shards = [...Array(9)].map((_, k) => { const c = gems[k % gems.length].color, x = w * (.08 + r() * .84), y = h * (.1 + r() * .8), s = 7 + r() * 8;
    return `<path d="${curve(ring(x, y, s * 2.4, s * 2.4, 10, .2, k))}" fill="${c}" opacity=".18"/>${shape(curve([[x - s * .5, y + s * .6], [x, y - s], [x + s * .55, y + s * .5]]), c, mix(c, "#000000", .5), [-1, 1])}<path d="M${x - s * .1} ${y - s * .5} L${x + s * .15} ${y + s * .2}" stroke="#ffffff" stroke-width="1.4" opacity=".7"/>`; }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2014"/><stop offset=".5" stop-color="#22170e"/><stop offset="1" stop-color="#2e2014"/></linearGradient></defs>
    <path d="${body}" fill="#120b06" transform="translate(-3 4)"/><path d="${body}" fill="url(#soil)"/>${bands}${stones}${shards}</svg>`;
}
function wipe(kind, mid, from = null, to = null) {
  if (wiping) return; wiping = true;
  const el = $("wipe"), W = innerWidth, H = innerHeight, R = Math.hypot(W, H);
  el.classList.add("on"); el.innerHTML = "";
  const done = () => { el.classList.remove("on"); el.innerHTML = ""; wiping = false; };
  if (calmMotion) { const v = el.appendChild(document.createElement("i")); v.className = "veil";
    v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "forwards" }).onfinish = () => { mid();
      v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).onfinish = done; }; return; }
  if (kind === "iris") {
    const hole = el.appendChild(document.createElement("i")); hole.className = "iris";
    const at = (p) => p || [W / 2, H / 2], box = ([x, y], r) => ({ left: x - r + "px", top: y - r + "px", width: 2 * r + "px", height: 2 * r + "px" });
    hole.animate([box(at(from), R), box(at(from), 0)], { duration: 520, easing: "cubic-bezier(.55,0,.75,.4)", fill: "forwards" }).onfinish = () => {
      mid(); const t = typeof to === "function" ? to() : to; // the point to open on may only exist once the new scene is drawn
      setTimeout(() => hole.animate([box(at(t), 0), box(at(t), R)], { duration: 620, easing: "cubic-bezier(.2,.6,.35,1)", fill: "forwards" }).onfinish = done, 140); };
    return;
  }
  const e = el.appendChild(document.createElement("div")), Ht = H * 1.5; e.className = "earth"; e.style.height = Ht + "px"; e.innerHTML = earthArt(W, Ht);
  const y = (v) => ({ transform: `translateY(${v}px)` }), down = kind === "down"; // down: the earth rises past you; up: it falls away
  const a = down ? [y(H), y(-H * .25)] : [y(-Ht), y(-H * .25)], b = down ? [y(-H * .25), y(-Ht - 20)] : [y(-H * .25), y(H + 20)];
  e.animate(a, { duration: 430, easing: "cubic-bezier(.5,0,.8,.5)", fill: "forwards" }).onfinish = () => { mid();
    setTimeout(() => e.animate(b, { duration: 560, easing: "cubic-bezier(.2,.55,.3,1)", fill: "forwards" }).onfinish = done, 90); };
}
// where the lanterns are: the title Dibble's, and Dibble at camp (for the iris)
const pointOf = (el, fx = .5, fy = .5) => { const b = el?.getBoundingClientRect(); return b && b.width ? [b.left + b.width * fx, b.top + b.height * fy] : null; };
function teaser() { // the card after the last mine you can see: a hint of what's next
  const S = save.story, [title, text] = S.finale ? ["A dark lantern", "It has a little toad print on it. Not lit yet. Puddock keeps 'meaning to write'."]
    : S.site === "skywell" ? ["Above the rubble", "Somewhere up there: the sky."]
    : S.site === "underroot" ? (S.ledge ? ["Far below", "A pale glow, where no light should be. Somebody built a moon."] : ["Further down", "The scorch marks all point the same way."])
    : ["More caves soon…", "Old Puddock swears there's something even deeper. He won't say what."];
  return `<div class="mine teaser">${S.finale ? darkLantern(134, 80) : mystery(134, 80)}<div class="info"><b>${title}</b>
    <small>${text}</small></div></div>`;
}
function renderHome() {
  $("homeGold").textContent = bigG(save.gold);
  const optRow = (id, ico, label, on) => { // on: true/false for a toggle, undefined for a row that opens something
    $(id).innerHTML = `${icon(ico, 22)}<span class="lbl">${label}</span>${on === undefined ? "" : `<span class="state">${on ? "On" : "Off"}</span>`}`;
    if (on !== undefined) { $(id).classList.toggle("on", on); $(id).setAttribute("aria-pressed", on); } };
  optRow("oMusic", "note", "Music", save.opt.music); optRow("oSound", save.opt.sound ? "soundOn" : "soundOff", "Sound", save.opt.sound);
  optRow("oSilent", "soundOn", "Play sound when the phone is on silent", !!save.opt.silent);
  optRow("oVib", "vibe", "Haptics", save.opt.vib); optRow("oGlyph", "symbols", "Colour-blind symbols", save.opt.glyph); optRow("oPrivacy", "lock", "Privacy choices"); optRow("oLb", "shatter", "Leaderboards");
  $("dibbleArt").innerHTML = titleHero(save.look, STILL);
  const mem = `Amber Memories · ${save.story.mem.length}/${MEMORY_COUNT}`;
  $("tMem").textContent = mem; $("campMem").textContent = mem;
  const done = save.daily.last === today(), st = save.daily.last === today() || save.daily.last === new Date(Date.now() - 864e5).toISOString().slice(0, 10) ? save.daily.streak : 0;
  $("dailyInfo").innerHTML = `<span class="streak" title="streak: ${st} day(s)">${[...Array(7)].map((_, k) => `<i class="${k < Math.min(st, 7) ? "on" : ""}"></i>`).join("")}</span>
    <div class="note" style="margin-top:6px">${st ? `${st}-day streak` : "No streak yet"}${done ? ` · today's best ${save.daily.best}g` : ""}</div>`;
  $("daily").textContent = done ? "Done for today. Come back tomorrow" : "Start today's dig";
  $("daily").disabled = done;
  $("campHint").textContent = !Object.keys(save.best).length ? "Tap the signpost to go mining ✦" : !save.metPuddock ? "Puddock's waving you over to his stall ✦" : "Tap things around camp ✦";
  renderMines(); renderCamp();
  campDaily = { done, streak: st, best: save.daily.best }; drawCamp();
}
function renderMines() {
  $("mExp").classList.toggle("on", save.mode === "exp"); $("mCalm").classList.toggle("on", save.mode === "calm");
  const wick = save.story.finale, glow = (b) => Math.min(1, Math.log10((save.best[b.id] || 0) + 1) / 4);
  $("wickHead").innerHTML = wick ? `<div class="wickHead">${icon("lantern", 20)}The Wickway · step into any lantern</div>` : "";
  $("mines").innerHTML = BIOMES.filter(revealed).map((b) => {
    const owned = save.biomes.includes(b.id), open = canEnter(b.id), trial = !owned && open, last = b === BIOMES[BIOMES.length - 1];
    const best = save.best[b.id + (save.mode === "calm" ? ":calm" : "")], cols = Object.keys(b.types).map((t) => CRYSTALS[t].color);
    return `<div class="mine ${open ? "" : "locked"} ${save.sel === b.id ? "sel" : ""} ${last ? "legend" : ""}" data-id="${b.id}">
      ${scene(cols, b.pal, 134, 80)}${wick && open ? `<span class="wickLamp" style="--g:${glow(b).toFixed(2)}">${icon("lantern", 20)}</span>` : ""}
      ${open ? "" : `<span class="lockTag">${icon("lock", 22)}${b.cost}g</span>`}${trial ? `<span class="trialTag">${icon("ticket", 18)}Trial map · 1 dig</span>` : ""}
      <div class="info"><b>${b.name}</b>${open && best ? `<small class="gold">Best ${best}g</small>` : ""}
        <div class="gems">${Object.keys(b.types).map((t) => gem(CRYSTALS[t].color, 18, "", CRYSTALS[t].cut)).join("")}</div>
        <small>${open ? b.blurb : "Buy the map at Old Puddock's Market."}</small></div></div>`;
  }).join("") + teaser();
  for (const el of document.querySelectorAll(".mine[data-id]")) el.onclick = () => {
    if (!canEnter(el.dataset.id)) return;
    save.sel = el.dataset.id; persist(); renderMines();
  };
}
const mapTile = (id) => { const b = BIOMES.find((x) => x.id === id); return scene(Object.keys(b.types).map((t) => CRYSTALS[t].color), b.pal, 46, 46); };
let mktTab = "tools";
function sparkleAt(el) { // a burst of little stars from a button or tile
  const r = el.getBoundingClientRect();
  for (let k = 0; k < 10; k++) {
    const s = document.createElement("i"); s.className = "spark"; document.body.appendChild(s);
    const a = (k / 10) * Math.PI * 2, d = 30 + Math.random() * 30, x = r.left + r.width / 2, y = r.top + r.height / 2;
    s.animate([{ transform: `translate(${x}px, ${y}px) scale(.3) rotate(0)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px, ${y + Math.sin(a) * d}px) scale(1) rotate(90deg)`, opacity: 0 }],
      { duration: 520, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => s.remove();
  }
}
async function renderIap() {
  const row = $("iapRow");
  if (platform.noAds) { row.innerHTML = `<div class="iap">${icon("ad", 22)}<span class="grow"><b>Ads removed</b><small>Thanks for supporting Glimmerwood!</small></span></div>`; return; }
  if (!platform.canBuy) { row.innerHTML = `<div class="iap">${icon("ad", 22)}<span class="grow"><b>Remove ads</b><small>A one-time purchase in the app. Rewarded offers stay, by choice.</small></span></div>`; return; }
  const price = (await platform.removeAdsPrice()) || "";
  row.innerHTML = `<div class="iap">${icon("ad", 22)}<span class="grow"><b>Remove ads</b><small>One-time. Rewarded offers stay, by choice.</small></span>
    <button id="buyNoAds">${price || "Buy"}</button></div><button id="restoreBtn" class="linkBtn">Restore purchases</button>`;
  $("buyNoAds").onclick = async () => { if (await platform.buyRemoveAds()) { toast("Ads removed. Thank you!"); renderIap(); } };
  $("restoreBtn").onclick = async () => { toast((await platform.restore()) ? "Purchase restored" : "Nothing to restore"); renderIap(); };
}
// the Someday shelf at the end of the Camp and Wardrobe tabs: locked prices, a lore line, and a bar toward the next one in reach
const bigG = (n) => n >= 1e6 ? `${+(n / 1e6).toFixed(n < 1e7 ? 2 : 1)}M` : n.toLocaleString("en-US");
function someday() {
  const items = TREASURES.filter((t) => t.tab === mktTab), open = (t) => !t.gate || GATES[t.gate][0](save.story);
  const next = items.filter((t) => open(t) && !save.owned.includes(t.id))[0], pc = next && Math.min(1, save.gold / next.price);
  return `<div class="treasures"><h3 class="subHead">Someday</h3><div class="puddock">"${mktTab === "camp" ? "The good stuff. I keep it at the back. Bring me a mountain of gold and we'll talk." : "Finery for a mole of means. You're not one. Yet."}"</div>
    ${next ? `<div class="saving"><small>Saving for the ${next.name}: ${Math.floor(pc * 100)}%</small><div class="bar"><i style="width:${(pc * 100).toFixed(1)}%"></i></div></div>` : ""}
    ${items.map((t) => { const own = save.owned.includes(t.id), ok = open(t), short = t.price - save.gold;
      return `<div class="shopItem${ok ? "" : " sealed"}"><span class="tile">${t.part ? lookItem(t.part, t.val, 56) : buildTile(t.id.slice(6), 56)}</span><span class="grow"><b>${t.name}</b><small>${ok ? t.desc : t.tease}</small>
        ${!ok ? `<small class="need">${GATES[t.gate][1]}</small>` : !own && short > 0 ? `<small class="need">${bigG(short)} more to go</small>` : ""}</span>
        ${own ? `<span class="stamp">Owned</span>` : `<button data-id="${t.id}" ${ok && short <= 0 ? "" : "disabled"}>${ok && short <= 0 ? coin(16) : icon("lock", 16)}${bigG(t.price)}</button>`}</div>`; }).join("")}</div>`;
}
function renderMarket() {
  renderIap();
  $("mktGold").textContent = bigG(save.gold);
  const pets = save.pets.owned, shown = dressPet();
  $("petTab").style.display = pets.length ? "" : "none"; if (mktTab === "pets" && !pets.length) mktTab = "tools";
  for (const b of document.querySelectorAll("#mktTabs button")) b.classList.toggle("on", b.dataset.tab === mktTab);
  $("shop").innerHTML = (mktTab === "pets" ? `<div class="puddock">"${PET_SHOP}"</div>` : "") + (mktTab === "tools" && !save.story.confessed ? `<div class="shopItem"><span class="tile">${lookItem("lantern", "granny", 40)}</span>
    <span class="grow"><b>An old lantern</b><small>"Not for sale. Not that one."</small></span><span class="stamp no">Not for sale</span></div>` : "") + SHOP.filter((it) => it.tab === mktTab && !it.treasure && mapShown(it.id.split(":")[1] || "") && (!it.gate || it.gate(save.story))).map((it) => {
    const lvl = it.kind === "up" ? save.up[it.id] : 0;
    const done = it.kind === "up" ? lvl >= it.max : it.kind === "biome" ? save.biomes.includes(it.id.split(":")[1]) : save.owned.includes(it.id);
    const cost = price(it), short = cost - save.gold; // owned: a stamp; can't afford yet: locked tag and how far to go
    return `<div class="shopItem"><span class="tile" ${it.color ? `style="color:${it.color}"` : ""}>${it.kind === "biome" ? mapTile(it.id.split(":")[1]) : it.kind === "look" ? lookItem(it.part, it.val, 40) : it.kind === "petwear" ? pet(shown, 46, { [it.slot]: it.val }) : icon(it.icon, 34)}</span><span class="grow"><b>${it.name}</b><small>${it.desc}</small>
      ${!done && short > 0 ? `<small class="need">${short}g more to go</small>` : ""}
      ${it.kind === "up" ? `<span class="pips" title="level ${lvl} of ${it.max}">${[...Array(it.max)].map((_, k) => `<i class="${k < lvl ? "on" : ""}"></i>`).join("")}</span>` : ""}</span>
      ${done ? `<span class="stamp">${it.kind === "up" ? "Max" : "Owned"}</span>` : `<button data-id="${it.id}" ${short > 0 ? "disabled" : ""}>${short > 0 ? icon("lock", 16) : coin(16)}${bigG(cost)}</button>`}</div>`;
  }).join("") + (mktTab === "camp" || mktTab === "wardrobe" ? someday() : "");
  for (const btn of $("shop").querySelectorAll("button")) btn.onclick = () => {
    const it = SHOP.find((s) => s.id === btn.dataset.id), cost = price(it);
    if (save.gold < cost) return;
    save.gold -= cost;
    sparkleAt(btn); ui.buy(); buzz(20);
    if (it.kind === "up") save.up[it.id]++;
    else if (it.kind === "look") { save.owned.push(it.id); save.look[it.part] = it.val; } // put it on straight away
    else if (it.kind === "biome") { const b = it.id.split(":")[1]; save.biomes.push(b); save.sel = b; }
    else if (it.kind === "petwear") { save.owned.push(it.id); (save.pets.wear[shown] ??= {})[it.slot] = it.val; } // on your pet straight away
    else {
      save.owned.push(it.id);
      const [grp, val] = it.id.split(":");
      if (grp === "tent" || grp === "banner" || grp === "fire") save.camp[grp] = val; // wear it straight away
    }
    persist(); renderMarket(); track("market_buy", { item: it.id, cost });
  };
}
$("dig").onclick = () => wipe("down", () => startDig(false));
$("daily").onclick = () => wipe("down", () => startDig(true));
$("mExp").onclick = () => { save.mode = "exp"; persist(); renderMines(); };
$("mCalm").onclick = () => { save.mode = "calm"; persist(); renderMines(); };
for (const [id, k] of [["oSound", "sound"], ["oVib", "vib"], ["oGlyph", "glyph"]]) $(id).onclick = () => { save.opt[k] = !save.opt[k]; persist(); renderHome(); };
$("oMusic").onclick = () => { save.opt.music = !save.opt.music; persist(); soundtrack.setEnabled(save.opt.music); renderHome(); };
soundtrack.setIgnoreSilent(save.opt.silent);
$("oSilent").onclick = () => { save.opt.silent = !save.opt.silent; persist(); soundtrack.setIgnoreSilent(save.opt.silent); renderHome(); };
$("oPrivacy").onclick = () => platform.privacyChoices(); // the consent form where the region needs one, otherwise the privacy policy
const openMarket = () => save.metPuddock ? (renderMarket(), show("market")) : talk(() => { renderMarket(); show("market"); });
for (const b of document.querySelectorAll("#mktTabs button")) b.onclick = () => { mktTab = b.dataset.tab; renderMarket(); $("shop").animate([{ opacity: 0, transform: "translateX(14px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" }); };
$("campMem").onclick = $("tMem").onclick = () => replayMemories();
$("hubMenu").onclick = () => show("optsSheet");
// ---------- Coin purse: coin packs (platform.js COIN_PACKS), opened from any coin counter. Coins never touch dealing ----------
let purseFrom = "home";
const openPurse = (from) => { purseFrom = from; renderPurse(); show("purseSheet"); track("purse_open", { from }); };
$("homeGoldPill").onclick = () => openPurse("home");
$("mktGoldPill").onclick = () => openPurse("market");
$("purseClose").onclick = () => { renderHome(); if (purseFrom === "market") { renderMarket(); show("market"); } else show(base); };
async function renderPurse() {
  $("purseGold").textContent = bigG(save.gold);
  const cards = (btn) => Object.entries(COIN_PACKS).map(([id, p]) => `<div class="pack">${coinPack(id.slice(6), 56)}<b>${p.name}</b>
    <span class="amt">${coin(18)}${p.gold.toLocaleString("en-US")}</span>${p.bonus ? `<span class="extra">+${p.bonus}% extra</span>` : ""}${btn(id)}</div>`).join("");
  const state = (t) => { $("purseState").textContent = t; $("purseState").style.display = t ? "" : "none"; };
  if (!platform.canBuy) { state("Purchases are available in the app."); $("packs").innerHTML = cards(() => `<button disabled>In the app</button>`); return; }
  state(""); $("packs").innerHTML = cards(() => `<button disabled>…</button>`);
  const live = await platform.coinPacks();
  if (!live.length) { state("Puddock can't reach the App Store just now. Try again in a moment."); $("packs").innerHTML = cards(() => `<button disabled>Unavailable</button>`); return; }
  const price = Object.fromEntries(live.map((p) => [p.id, p.price]));
  $("packs").innerHTML = cards((id) => `<button data-id="${id}" ${price[id] ? "" : "disabled"}>${price[id] || "Unavailable"}</button>`);
  for (const btn of $("packs").querySelectorAll("button[data-id]")) btn.onclick = async () => {
    const all = $("packs").querySelectorAll("button[data-id]"); all.forEach((b) => (b.disabled = true));
    const gold = await platform.buyCoins(btn.dataset.id, save.coinTx);
    all.forEach((b) => (b.disabled = !price[b.dataset.id]));
    if (!gold) return;
    save.gold += gold; persist(); // bought gold doesn't grow the stump (save.light): that's the light Dibble gives back
    ui.buy(); sparkleAt(btn); coinRain(gold, save.gold - gold, [], "purseGoldPill", "purseGold");
  };
}
$("tOpts").onclick = () => show("optsSheet");
$("toTitle").onclick = () => wipe("iris", () => { renderHome(); show("title"); }, null, () => pointOf($("dibbleArt"), .72, .78));
$("tPlay").onclick = () => wipe("iris", () => (save.story.prologue ? home() : prologue()), pointOf($("dibbleArt"), .72, .78),
  () => save.story.prologue ? pointOf(document.querySelector("#campArt .campDibble"), .5, .55) : null);

// ---------- meeting Old Puddock ----------
const INTRO = [
  "Well now! A mole with a lantern. Haven't seen one of those since the old oak fell. Name's Puddock. <b>Old</b> Puddock, to the Glimmerwood.",
  "I trade coins for crystals, and crystals for… well, more coins. Bring me what you dig and I'll keep that lantern burning.",
  "Here, take this. An old map to <b>Cinderroot Caverns</b>, worn thin as a leaf. It'll get you in <b>once</b>. Bring back something warm, eh?",
];
const home = () => { renderHome(); show("home"); };
// steps: [{ say, html (picture, default Puddock), gift, btn }]; skip shows a Skip link (prologue, replays)
// voice: who is talking (see say()); the line types out, and Go on… shows once it's all there
function dialog(steps, then, skip = false, k = 0) {
  const next = $("talkNext"), line = $("talkLine"), art = $("talkArt"), step = () => {
    const st = steps[k], lastStep = k === steps.length - 1;
    art.innerHTML = st.html || puddock(120);
    line.innerHTML = st.say ? (st.name ? `<b class="who">${st.name}</b>` : "") + `<div id="talkText"></div>` : "";
    $("talkGift").innerHTML = st.gift || "";
    next.innerHTML = st.btn || (lastStep ? "Back" : "Go on…");
    $("talkSkip").style.display = skip ? "block" : "none";
    tone(220 + k * 40, .12, "triangle", .07); tone(180 + k * 30, .1, "triangle", .05, .1);
    const text = $("talkText"), shown = () => { next.classList.remove("wait"); line.classList.add("done"); art.classList.remove("talking"); };
    next.classList.add("wait"); line.classList.remove("done"); art.classList.add("talking");
    text ? say(text, st.say, st.voice).then(() => text.isConnected && shown()) : shown();
  };
  next.onclick = () => { if (typing) return typing.finish(); if (++k < steps.length) return step(); then(); };
  $("talkSkip").onclick = () => { typing?.finish(); then(); };
  step(); show("talk");
}
// tap anywhere while a line types: show it all; tap again: go on. Only taps that start here count: the camp stall opens a talk
// on pointerdown, and that tap's click must not skip the first line.
let talkPress = false;
$("talk").addEventListener("pointerdown", () => { talkPress = true; });
$("talk").addEventListener("click", (e) => { if (talkPress && !e.target.closest("button")) typing ? typing.finish() : $("talkNext").click(); talkPress = false; });

// ---------- talking: lines type out a letter at a time, with a little voice blip (music.js VOICES) ----------
// say(el, html, voice) types html into el (tags stay whole, only the text types) and resolves once it's all shown.
// voice: "dibble" | "puddock" | "granny" | "bidder" | null (narration: a soft chime). Also on window, for scripted sequences.
// Reduced motion and the fit check (?scene=) get the whole line at once.
const PAUSE = { ",": 120, ";": 120, ":": 120, "—": 160, ".": 280, "!": 280, "?": 300, "…": 350 };
const CPS = { dibble: 40, puddock: 28, granny: 32, bidder: 30 }; // letters a second; narration 36
let typing = null; // the line typing now: { finish }
function say(el, html, voice = null) {
  typing?.finish();
  el.innerHTML = html;
  const blip = () => { try { if (sfx.voice(voice)) buzz(4); } catch {} };
  if (calmMotion || qs.has("scene")) { blip(); return Promise.resolve(); }
  const chars = [], wrap = (n) => [...n.childNodes].forEach((c) => {
    if (c.nodeType !== 3) return wrap(c);
    const f = document.createDocumentFragment();
    for (const ch of c.data) { const s = f.appendChild(document.createElement("span")); s.className = "tw"; s.textContent = ch; chars.push(s); }
    c.replaceWith(f);
  });
  wrap(el); // every letter in place but invisible, so the line never reflows as it types
  return new Promise((done) => {
    let i = 0, n = 0, timer;
    const finish = () => { clearTimeout(timer); el.innerHTML = html; if (typing === me) typing = null; done(); }, me = { finish };
    const tick = () => {
      const s = chars[i++]; if (!s) return finish();
      const ch = s.textContent, after = chars[i]?.textContent; s.className = "";
      if (/[\p{L}\p{N}]/u.test(ch) && n++ % (voice ? 2 : 3) === 0) blip(); // spaces and stops are silent
      timer = setTimeout(tick, 1000 / (CPS[voice] || 36) + (PAUSE[ch] && (ch === "…" || !after || /\s/.test(after)) ? PAUSE[ch] : 0));
    };
    typing = me; tick();
  });
}
window.say = say;
function talk(then) {
  dialog(INTRO.map((say, k) => k < INTRO.length - 1 ? { say, voice: "puddock" } : { say, voice: "puddock", btn: `<span class="btnrow">${icon("map", 22)}Take the map</span>`,
    gift: `<div class="gift">${mapTile("ember")}<div><b>Puddock's old map</b><small>Cinderroot Caverns · good for one dig</small></div>${icon("ticket", 28)}</div>` }), () => {
    save.metPuddock = true; track("met_puddock"); if (!save.biomes.includes("ember") && !save.trial.includes("ember")) save.trial.push("ember");
    persist(); [784, 988, 1175, 1568].forEach((f, j) => tone(f, .18, "triangle", .08, j * .07)); then();
  });
}
const PANEL_W = Math.min(300, innerWidth - 80);
// shown once: it counts as seen as soon as it starts, so quitting halfway never brings it back
function prologue(start = 0) {
  save.story.prologue = true; persist();
  dialog(PROLOGUE.map(({ art, text }, k) => ({ html: memoryArt(art, PANEL_W), say: `<i>${text}</i>`, btn: k < PROLOGUE.length - 1 ? "Next" : "Begin" })), home, true, start);
}
const NAMES = { puddock: "Old Puddock", granny: "Granny Burr", bidder: "The Pale Bidder" };
// sized so each figure stands about 150px tall on the stage (their boxes leave different headroom)
const SPEAKER = { puddock: () => puddock(164), granny: () => granny(184), bidder: () => bidder(162) };
const giftCard = (art, title, sub) => `<div class="gift">${art}<div><b>${title}</b><small>${sub}</small></div></div>`;
const GIFTS = {
  lantern: () => [giftCard(lookItem("lantern", "granny", 46), "Granny Burr's lantern", "It still knows the way down."), `${icon("lantern", 22)}Take Granny's lantern`],
  "move:underroot": () => [giftCard(mapTile("cinder"), "Camp moves to the Underroot", "Everything you own comes too. Cinderthread Run is open."), `${icon("campIco", 22)}Follow the scorch marks`],
  maps: () => [giftCard(mapTile("roost"), "Puddock's new map", "Scalefall Roost, at the Market."), "Onward"],
  "move:skywell": () => [giftCard(mapTile("skywell"), "Camp moves to the Skywell", "Everything comes too. Granny and the Lantern Moles join you."), `${icon("campIco", 22)}To the Skywell`],
  shard: () => [giftCard(gem(CRYSTALS.heart.color, 40, "", "heart"), "The heart-shard", "Warm, and humming. It wants to go home."), "Take it home"],
  wickway: () => [giftCard(icon("lantern", 40), "The Wickway is lit", "Step into any lantern to dig any mine. Your best hauls make them glow."), "Rest a while"],
};
const AFTER = { // what each scene changes, once it has played
  sprout: (st) => { st.sprout = true; },
  confession: (st) => { st.confessed = true; if (!save.owned.includes("look:lantern:granny")) save.owned.push("look:lantern:granny"); save.look.lantern = "granny"; },
  lead: (st) => { st.sprout = true; st.site = "underroot"; if (!save.biomes.includes("cinder")) save.biomes.push("cinder"); save.sel = "cinder"; },
  ledge: (st) => { st.ledge = true; },
  reunion: (st) => { st.site = "skywell"; if (!save.biomes.includes("skywell")) save.biomes.push("skywell"); save.sel = "skywell"; },
  finale: (st) => { st.finale = true; },
};
function playScene(name, start = 0) {
  dialog(SCENES[name].map((st, k, all) => {
    const [gift, btn = k === all.length - 1 ? "Continue" : null] = st.gift ? GIFTS[st.gift]() : [];
    const html = st.who ? SPEAKER[st.who]() : memoryArt(st.art, PANEL_W);
    const say = st.letter ? `<div class="letter">${st.letter}</div>` : st.chalk ? `<div class="chalkNote">${st.chalk}</div>` : st.say;
    const voice = st.who || (st.chalk ? "dibble" : st.letter ? "granny" : null); // the chalk is Dibble's, the letter Granny's
    return { html, say, gift, voice, name: NAMES[st.who], btn: btn && `<span class="btnrow">${btn}</span>` };
  }), () => {
    AFTER[name]?.(save.story); persist(); track("story_" + name);
    [523, 659, 784, 1047].forEach((f, j) => tone(f, .4, "sine", .07, j * .12));
    if (name === "lead" || name === "reunion") { home(); toast("Camp unpacked. Everything's here.", 2200); }
    else home();
  }, false, start);
}
function replayMemories() { // the collection: a shelf per mine, found memories in amber, the rest as dark silhouettes; tap one to replay it
  const found = save.story.mem;
  $("memCount").textContent = `${found.length} of ${MEMORY_COUNT}`;
  $("memShelf").innerHTML = BIOMES.filter((b) => MEMORIES[b.id] && (revealed(b) || MEMORIES[b.id].some((m) => found.includes(m.id)))).map((b) => {
    const ms = MEMORIES[b.id], n = ms.filter((m) => found.includes(m.id)).length;
    return `<div class="memMine"><h3 class="subHead">${b.name} · ${n}/${ms.length}</h3><div class="memGrid">${ms.map((m) => found.includes(m.id)
      ? `<button class="memTile found" data-mem="${m.id}" aria-label="${m.text}">${memoryArt(m.art, 96)}</button>`
      : `<span class="memTile unfound" role="img" aria-label="Not found yet">${memoryArt(m.art, 96)}</span>`).join("")}</div></div>`;
  }).join("");
  for (const t of $("memShelf").querySelectorAll("[data-mem]")) t.onclick = () => {
    const m = memoryById(t.dataset.mem); dialog([{ html: memoryArt(m.art, PANEL_W), say: `<i>${m.text}</i>` }], () => show("memSheet")); };
  show("memSheet");
}

// Story fit check (scripts/scene-check.mjs): ?scene=title | all | prologue:2 | confession:3 opens that screen with
// motion frozen; "all" walks every prologue and scene step. Problems go in <pre id="fitReport"> as JSON.
const STORY_STEPS = [...PROLOGUE.map((_, k) => "prologue:" + k), ...Object.entries(SCENES).flatMap(([n, s]) => s.map((_, k) => `${n}:${k}`))];
function openStep(id) {
  if (id === "title") return show("title");
  const [name, k] = id.split(":");
  name === "prologue" ? prologue(+k) : playScene(name, +k);
}
function fitProblems(title) {
  const probe = getComputedStyle($("safeProbe")), root = document.documentElement, out = [];
  const ad = root.classList.contains("hasAd") ? parseFloat(getComputedStyle(root).getPropertyValue("--ad")) || 0 : 0;
  const top = parseFloat(probe.paddingTop), bottom = innerHeight - parseFloat(probe.paddingBottom) - ad;
  const card = title ? $("title").querySelector(".titleWrap") : $("talk").querySelector(".card");
  const ids = title ? ["dibbleArt", "logo", "logoSwash", "tagline", "tPlay", "tOpts", "tMem", "titleNote"] : ["talkArt", "talkLine", "talkGift", "talkNext", "talkSkip"];
  const parts = ids.map((id) => [id, $(id)]).filter(([, el]) => el && getComputedStyle(el).display !== "none" && el.getBoundingClientRect().height > 0)
    .map(([id, el]) => [id, el, el.getBoundingClientRect()]);
  const c = card.getBoundingClientRect();
  for (const el of [card, ...card.querySelectorAll(".sheetBody")]) if (el.scrollHeight > el.clientHeight + 1) out.push(el === card ? "card scrolls" : "card body scrolls");
  for (const [id, el, r] of [["card", card, c], ...parts]) {
    if (r.top < top - .5 || r.bottom > bottom + .5) out.push(`${id} leaves the safe area (${Math.round(r.top)}–${Math.round(r.bottom)}, safe ${top}–${bottom})`);
    if (r.left < 0 || r.right > innerWidth) out.push(`${id} cut off at the side`);
    if (el !== card && (r.top < c.top - .5 || r.bottom > c.bottom + .5)) out.push(`${id} clipped by the card`);
    if (el.tagName === "BUTTON" && r.height < 44) out.push(`${id} is ${Math.round(r.height)}px tall (44 minimum)`);
  }
  parts.forEach(([a, , r], i) => parts.slice(i + 1).forEach(([b, , q]) => {
    if (Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1) out.push(`${a} overlaps ${b}`); }));
  for (const el of card.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || !el.getClientRects().length) continue;
    const px = parseFloat(getComputedStyle(el).fontSize), min = !title && $("talkLine").contains(el) && !el.matches(".who") ? 15 : 13;
    if (px < min) out.push(`"${el.textContent.trim().slice(0, 24)}" is ${px}px (${min} minimum)`);
  }
  return out;
}
function sceneCheck(which) {
  document.head.insertAdjacentHTML("beforeend", "<style>*, *::before, *::after { animation: none !important; transition: none !important; } #dust { display: none; }</style>");
  const report = { size: [innerWidth, innerHeight], steps: {} };
  for (const id of which === "all" ? ["title", ...STORY_STEPS] : [which]) { openStep(id); report.steps[id] = fitProblems(id === "title"); }
  if (which === "all") openStep("title");
  document.body.insertAdjacentHTML("beforeend", `<pre id="fitReport" hidden>${JSON.stringify(report)}</pre>`);
}

// ---------- Dibble's Camp: every purchase shows up here ----------
function campState() {
  const own = (id) => save.owned.includes(id) && !save.camp.hide.includes(id), S = save.story;
  const spare = (part) => Object.keys(LOOKS[part]).find((v) => v !== "none" && v !== save.look[part] && lookOwned(part, v));
  const hub = { metPuddock: save.metPuddock, firstRun: !Object.keys(save.best).length, memories: S.mem.length || null, rackHat: spare("hat"), rackScarf: spare("scarf"),
    stumpSvg: S.site === "stump" ? stumpArt(Math.log10(save.light + 1) / 5.3, S.sprout, 340, S.finale) : "" };
  return { ...hub, ...save.up, mines: BIOMES.filter((b) => save.biomes.includes(b.id)).map((b) => b.pal.glow),
    found: GEMS.map((t) => save.found.includes(t) ? { color: CRYSTALS[t].color, cut: CRYSTALS[t].cut } : null),
    tent: save.camp.tent, banner: save.camp.banner, fire: save.camp.fire,
    site: save.story.site, sky: save.story.finale, packed: save.story.finale, puddockHere: save.story.site !== "stump",
    grannySvg: save.story.site === "skywell" ? granny(60) : "", puddockSvg: puddock(60), decor: { mushrooms: own("decor:mushrooms"), jars: own("decor:jars"), hammock: own("decor:hammock"), cart: own("decor:cart"), flies: save.owned.includes("fireflies") },
    builds: Object.fromEntries(BUILD_KINDS.map((k) => [k, own("decor:" + k)])) };
}
function campProgress() {
  const ups = SHOP.filter((i) => i.kind === "up"), extras = SHOP.filter((i) => i.kind !== "up" && i.kind !== "petwear" && !i.treasure); // Someday items are extra credit
  const have = ups.reduce((s, i) => s + save.up[i.id], 0) + extras.filter((i) => i.kind === "biome" ? save.biomes.includes(i.id.split(":")[1]) : save.owned.includes(i.id)).length + save.found.length;
  const total = ups.reduce((s, i) => s + i.max, 0) + extras.length + GEMS.length;
  return have / total;
}
function renderCamp() {
  $("campTitle").textContent = `Dibble's Camp · ${SITES[save.story.site]}`;
  const P = save.pets, dp = dressPet(), pw = wearOf(dp);
  $("wardDibble").innerHTML = dibble(84, save.look) + (dp ? `<span class="wardPet">${pet(dp, 44, pw)}</span>` : ""); // with the pet you're dressing
  const pc = campProgress();
  $("campProg").innerHTML = `<div class="bar"><i style="width:${(pc * 100).toFixed(1)}%"></i></div><small>Camp ${Math.round(pc * 100)}% grown · ${save.found.length}/${GEMS.length} gems on the shelf</small>`;
  const chip = (grp, val, label, swatch) => `<button class="chip ${save.camp[grp] === val ? "on" : ""}" data-grp="${grp}" data-val="${val}">${swatch || ""}${label}</button>`;
  const tents = [["canvas", "Canvas"], ["patchwork", "Patchwork"], ["treehouse", "Treehouse"], ["pavilion", "Pavilion"]].filter(([v]) => v === "canvas" || save.owned.includes("tent:" + v));
  const banners = Object.entries(BANNERS).filter(([c], k) => !k || save.owned.includes("banner:" + c));
  const fires = [["ring", "Campfire"], ["forge", "Forge"]].filter(([v]) => v === "ring" || save.owned.includes("fire:" + v));
  const decor = SHOP.filter((i) => i.id.startsWith("decor:") && save.owned.includes(i.id));
  $("campCustom").innerHTML = `
    <h3 class="subHead">Dibble</h3>${["hat", "trinket", "scarf", "cloak", "lantern", "fur"].map((part) => `<div class="custRow"><span>${{ hat: "Hat", trinket: "Trinket", scarf: "Scarf", cloak: "Cloak", lantern: "Lantern", fur: "Fur" }[part]}</span>${Object.keys(LOOKS[part]).filter((v) => lookOwned(part, v))
      .map((v) => `<button class="chip ${save.look[part] === v ? "on" : ""}" data-look="${part}" data-val="${v}">${part === "scarf" && v !== "none" ? `<i class="sw" style="background:${v}"></i>` : part === "fur" ? `<i class="sw" style="background:${FUR[v][0]}"></i>` : ""}${v === "none" ? "None" : LOOKS[part][v].replace(/ (fur|scarf|lantern|cloak)$/i, "")}</button>`).join("")}</div>`).join("")}
    ${P.owned.length ? `<h3 class="subHead">Pet · ${P.owned.length} of ${PET_KINDS.length} found</h3>
      <div class="custRow"><span>At camp</span>${P.owned.map((k) => `<button class="chip petChip ${P.active.includes(k) ? "on" : ""}" data-pet="${k}" aria-pressed="${P.active.includes(k)}">${pet(k, 32, wearOf(k))}${PETS[k].name}</button>`).join("")}</div>
      ${PET_WEAR.some(([v]) => save.owned.includes("pet:" + v)) ? `<div class="custRow"><span>Dress</span>${P.owned.map((k) => `<button class="chip ${dp === k ? "on" : ""}" data-dress="${k}">${PETS[k].name}</button>`).join("")}</div>` : ""}
      ${[["head", "Head"], ["neck", "Neck"]].map(([slot, lbl]) => { const have = PET_WEAR.filter(([v]) => PET_WEAR_SLOT[v] === slot && save.owned.includes("pet:" + v));
        return have.length ? `<div class="custRow"><span>${lbl}</span>${[["none", "None"], ...have].map(([v, n]) => `<button class="chip ${(pw[slot] || "none") === v ? "on" : ""}" data-pwear="${slot}" data-val="${v}">${n}</button>`).join("")}</div>` : ""; }).join("")}
      <div class="note">Tap a pet to bring it out to camp or send it to bed. ${P.owned.length < PET_KINDS.length ? "More are asleep in the mines. " : ""}Tiny clothes at Old Puddock's, in the Pets tab.</div>`
    : `<h3 class="subHead">Pet</h3><div class="note">"${PET_HINT}" Some crystals in the mines have someone asleep inside. Clear the line to wake them.</div>`}
    <h3 class="subHead">Camp</h3><div class="custRow"><span>Tent</span>${tents.map(([v, l]) => chip("tent", v, l)).join("")}</div>
    <div class="custRow"><span>Banner</span>${banners.map(([c, l]) => chip("banner", c, "", `<i class="sw" style="background:${c}" title="${l}"></i>`)).join("")}</div>
    <div class="custRow"><span>Fire</span>${fires.map(([v, l]) => chip("fire", v, l)).join("")}</div>
    ${decor.length ? `<div class="custRow"><span>Decor</span>${decor.map((i) => `<button class="chip ${save.camp.hide.includes(i.id) ? "" : "on"}" data-hide="${i.id}">${i.name}</button>`).join("")}</div>` : ""}
    <div class="note">Lanterns = Lantern level · tool rack = Pickaxe · the sapling = Root Charm · signpost = mines opened · shelf = gem types found. More in Old Puddock's Camp tab.</div>`;
  for (const b of $("campCustom").querySelectorAll("[data-look]")) b.onclick = () => { save.look[b.dataset.look] = b.dataset.val; persist(); renderHome(); ui.chirp(); };
  for (const b of $("campCustom").querySelectorAll("[data-pet]")) b.onclick = () => { const k = b.dataset.pet; // out to camp, or back to bed; out means dressing it next
    P.active = P.active.includes(k) ? P.active.filter((x) => x !== k) : (petDress = k, [...P.active, k]); persist(); renderHome(); ui.chirp(); };
  for (const b of $("campCustom").querySelectorAll("[data-dress]")) b.onclick = () => { petDress = b.dataset.dress; renderCamp(); ui.chirp(); };
  for (const b of $("campCustom").querySelectorAll("[data-pwear]")) b.onclick = () => { (P.wear[dp] ??= {})[b.dataset.pwear] = b.dataset.val; persist(); renderHome(); ui.chirp(); };
  for (const b of $("campCustom").querySelectorAll("[data-grp]")) b.onclick = () => { save.camp[b.dataset.grp] = b.dataset.val; persist(); renderHome(); tone(660, .08, "triangle", .06); };
  for (const b of $("campCustom").querySelectorAll("[data-hide]")) b.onclick = () => {
    const h = save.camp.hide, id = b.dataset.hide; save.camp.hide = h.includes(id) ? h.filter((x) => x !== id) : [...h, id]; persist(); renderHome(); };
}

// the camp is drawn to the stage size (so it fills the phone and labels stay one size), and again when that changes
let campDaily = {};
function drawCamp() {
  const stage = $("campStage"); if (!stage.clientHeight) return; // hidden: the ResizeObserver draws it once it shows
  const barBottom = document.querySelector(".hubBar").getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
  $("campArt").innerHTML = camp({ ...campState(), daily: campDaily, view: [stage.clientWidth, stage.clientHeight, barBottom] }, gem, dibble(100, save.look));
  const art = $("campArt").querySelector("svg"), pud = () => $("campArt").querySelector(".pud");
  if (pawPrints && save.story.site === "stump") campPrints(art);
  campLife(art, save.story.site === "skywell" && save.story.finale ? "sky" : save.story.site, { visible: () => $("home").classList.contains("show") && !["talk", ...SHEETS].some((id) => $(id).classList.contains("show")),
    extra: pud() ? ["hum"] : [], hum: () => { const b = pud()?.getBoundingClientRect(), st = stage.getBoundingClientRect(); // Puddock hums a line of something old
      if (b) campFx(Math.min(st.width - 100, b.left + b.width / 2 - st.left), b.top - st.top - 34, pick(["♪ Hm-hm… lanterns low… ♪", "♪ Hmm, hm-hm-hmm… ♪", "♪ …down she goes, hm… ♪"]), "campSay"); } });
  campPets(); setTimeout(campTips, 900);
}
new ResizeObserver(drawCamp).observe($("campStage"));
// someone came by the stump while you were away (8h or more): small prints lead out of it, until your next dig
let pawPrints = false;
const cameBack = () => { pawPrints ||= Date.now() - (save.seenAt || Date.now()) > 8 * 3600e3; save.seenAt = Date.now(); persist(); };
cameBack(); document.addEventListener("visibilitychange", () => { if (document.hidden) { save.seenAt = Date.now(); persist(); } else if (cameBack(), pawPrints) drawCamp(); });

// ---------- the pets out at camp: they roam the open ground between the middle and front props, resting a lot ----------
// Each pet is two pre-rendered images (eyes open, eyes shut) in its own element over the camp art, moved only with
// transforms (WAAPI), so the camp SVG never redraws. Every pet runs its own timers, so no two move together:
// rest 2.4-6.5s (one rest in five is a 7-12s doze, eyes shut, a "z"), then 2-4 hops of ~.5s each to a free spot nearby.
// Blinks and breathing are CSS loops with a random length per pet. Reduced motion: they sit still and blink.
function dressPet() { const P = save.pets; return P.owned.includes(petDress) ? petDress : P.active[0] || P.owned[0]; }
const campPet = {}, rnd = (a, b) => a + Math.random() * (b - a);
let petGround = null; // { w, free(x, y), spots, depth(y) } in stage px, from the last camp drawing
function campPets() {
  const svg = $("campArt").querySelector("svg"), stage = $("campStage").getBoundingClientRect(), m = svg.getScreenCTM(), [top, bot, kf] = svg.dataset.ground.split(" ").map(Number);
  const X = (x) => m.a * x + m.e - stage.left, Y = (y) => m.d * y + m.f - stage.top, W = stage.width, w = 56 * kf * m.a, y0 = Y(top), y1 = Y(bot) - 2;
  const avoid = svg.dataset.keep.split(",").map((b) => b.split(" ").map(Number).map((v, i) => (i % 2 ? Y(v) : X(v)) + (i < 2 ? -2 : 2))); // camp()'s keep-out boxes, 2px roomier
  const depth = (y) => .9 + .14 * Math.max(0, Math.min(1, (y - y0) / (y1 - y0))); // lower on screen = nearer = a little bigger
  const free = (x, y) => { const h = .3 * w * depth(y), t = y - .64 * w * depth(y);
    return y >= y0 && y <= y1 && Math.min(x - h - 4, x - 22, W - 4 - x - h, W - 22 - x) >= 0 && !avoid.some(([l, tp, r, b]) => x + h > l && x - h < r && y > tp && t < b); };
  const cells = new Map(); let spots = [];
  for (let j = 0, y = y0; y <= y1; j++, y += w * .12) for (let i = 0, x = w * .3; x < W; i++, x += w * .14) if (free(x, y)) cells.set(i + "," + j, [x, y, i, j]);
  for (const c of cells.values()) { if (c.seen) continue; const patch = [c]; c.seen = true; // keep the biggest joined-up patch: a pocket behind Dibble would trap a pet
    for (let n = 0; n < patch.length; n++) { const [, , i, j] = patch[n]; for (const k of [`${i + 1},${j}`, `${i - 1},${j}`, `${i},${j + 1}`, `${i},${j - 1}`]) { const d = cells.get(k); if (d && !d.seen) { d.seen = true; patch.push(d); } } }
    if (patch.length > spots.length) spots = patch; }
  const onPatch = (x, y) => spots.some(([sx, sy]) => Math.abs(sx - x) < w * .08 && Math.abs(sy - y) < w * .07);
  petGround = { w, free, spots, depth, avoid }; $("campPets").style.transform = ""; // a fresh drawing has no parallax yet
  for (const k in campPet) if (!save.pets.active.includes(k)) { clearTimeout(campPet[k].t); clearTimeout(campPet[k].t2); campPet[k].el.remove(); delete campPet[k]; }
  for (const k of save.pets.active) {
    const look = JSON.stringify(wearOf(k)), p = campPet[k] ??= petMake(k);
    if (p.look !== look) { p.look = look; [p.open.src, p.shut.src] = [{ bare: true }, { bare: true, sleep: true }].map((o) => petImg(k, { ...wearOf(k), ...o }).src); }
    Object.assign(p.el.style, { width: w + "px", height: w + "px" });
    if (!onPatch(p.x, p.y)) { const taken = Object.values(campPet).filter((q) => q !== p && q.x != null), roomy = spots.filter(([x, y]) => taken.every((q) => Math.hypot(x - q.x, y - q.y) > w * .7));
      [p.x, p.y] = pick(roomy.length ? roomy : spots.length ? spots : [[W / 2, y0]]); p.el.getAnimations({ subtree: true }).forEach((a) => a instanceof CSSAnimation || a.cancel()); } // a hop in flight, not the blink
    p.el.style.transform = petAt(p.x, p.y); p.el.style.zIndex = Math.round(p.y);
    if (!p.t && !calmMotion) p.t = setTimeout(() => petRest(p), rnd(0, 3000));
  }
}
const petAt = (x, y) => { const { w, depth } = petGround; return `translate(${(x - w / 2).toFixed(1)}px, ${(y - w * .93).toFixed(1)}px) scale(${depth(y).toFixed(3)})`; };
function petMake(k) {
  const el = document.createElement("div"); el.className = "cpet"; el.dataset.tap = "pet"; el.dataset.kind = k;
  el.setAttribute("role", "button"); el.setAttribute("aria-label", PETS[k].name);
  el.innerHTML = `<i class="psh"></i><div class="pf"><div class="pb"><img alt=""><img class="shut" alt=""></div></div><b class="pz">z</b>`;
  el.style.setProperty("--blink", rnd(3.2, 6.4).toFixed(2) + "s"); el.style.setProperty("--breathe", rnd(2.4, 3.4).toFixed(2) + "s"); el.style.setProperty("--off", (-rnd(0, 6)).toFixed(2) + "s");
  $("campPets").appendChild(el);
  const [open, shut] = el.querySelectorAll("img"), p = { k, el, open, shut, body: el.querySelector(".pb"), flip: el.querySelector(".pf"), shadow: el.querySelector(".psh") };
  el.pet = p; petFace(p, Math.random() < .5 ? 1 : -1); return p;
}
function petFace(p, dir) { p.dir = dir; p.flip.style.transform = `scaleX(${dir})`; }
function petRest(p) { // sit: blink, breathe, look the other way now and then, or doze off
  const doze = Math.random() < .2, ms = doze ? rnd(7000, 12000) : rnd(2400, 6500);
  p.el.classList.toggle("doze", doze);
  if (!doze && Math.random() < .5) p.t2 = setTimeout(() => petFace(p, -p.dir), rnd(.3, .7) * ms);
  p.t = setTimeout(() => petWalk(p), ms);
}
function petWalk(p) { // a few hops to a free spot nearby (never through a prop or onto another pet), then rest again
  p.el.classList.remove("doze");
  const G = petGround, others = Object.values(campPet).filter((q) => q !== p);
  if (!p.el.isConnected || document.hidden || !$("home").classList.contains("show")) return petRest(p); // nobody's watching: rest on
  const ok = ([x, y]) => { const d = Math.hypot(x - p.x, (y - p.y) * 1.5); if (d < G.w * .45 || d > G.w * 1.7 || others.some((q) => Math.hypot(x - q.x, y - q.y) < G.w * .6)) return false;
    for (let i = 1; i < 6; i++) if (!G.free(p.x + (x - p.x) * i / 6, p.y + (y - p.y) * i / 6)) return false; return true; };
  const near = G.spots.filter(ok); if (!near.length) return petRest(p);
  const [tx, ty] = pick(near), sx = p.x, sy = p.y, n = Math.max(2, Math.min(4, Math.round(Math.hypot(tx - sx, ty - sy) / (G.w * .38))));
  if (Math.abs(tx - sx) > 2) petFace(p, tx < sx ? -1 : 1);
  [p.x, p.y] = [tx, ty]; // claimed now, so nobody else heads here
  let i = 0; const next = () => { if (!p.el.isConnected) return; if (i === n) return petRest(p); i++;
    const d = rnd(440, 540); petJump(p, sx + (tx - sx) * (i - 1) / n, sy + (ty - sy) * (i - 1) / n, sx + (tx - sx) * i / n, sy + (ty - sy) * i / n, d); p.t = setTimeout(next, d + rnd(40, 160)); };
  next();
}
function petJump(p, x0, y0, x1, y1, d, high = rnd(.17, .25)) { // crouch, stretch up, squash on landing; the shadow shrinks mid-air
  const h = (p.el.offsetWidth || 50) * high, from = petAt(x0, y0), to = petAt(x1, y1);
  p.el.style.transform = to; p.el.style.zIndex = Math.round(Math.max(y0, y1));
  if (from !== to) p.el.animate([{ transform: from }, { transform: from, offset: .14, easing: "ease-in-out" }, { transform: to, offset: .84 }, { transform: to }], d);
  p.body.animate([{ transform: "none" }, { transform: "scale(1.12, .86)", offset: .14, easing: "ease-out" }, { transform: `translateY(${-h * .7}px) scale(.9, 1.12)`, offset: .32, easing: "ease-out" },
    { transform: `translateY(${-h}px) scale(.97, 1.03)`, offset: .5, easing: "ease-in" }, { transform: `translateY(${-h * .45}px) scale(.94, 1.07)`, offset: .7, easing: "ease-in" },
    { transform: "scale(1.15, .85)", offset: .84, easing: "ease-out" }, { transform: "scale(.97, 1.03)", offset: .93 }, { transform: "none" }], d);
  p.shadow.animate([{ transform: "none", opacity: 1 }, { transform: "none", opacity: 1, offset: .14 }, { transform: "scale(.55)", opacity: .45, offset: .5 }, { transform: "none", opacity: 1, offset: .84 }, { transform: "none", opacity: 1 }], d);
}
function petHappy(p) { // tapped: wakes up and does two big happy bounces on the spot
  p.el.classList.remove("doze");
  if (!calmMotion) { petJump(p, p.x, p.y, p.x, p.y, 520, .5); setTimeout(() => p.el.isConnected && petJump(p, p.x, p.y, p.x, p.y, 420, .28), 520); }
  const f = 1 + PET_KINDS.indexOf(p.k) * .05; tone(1320 * f, .08, "sine", .05); tone(1760 * f, .1, "sine", .04, .07);
}
// the first time the lanterns, shelf, sapling or stump grow, they say what they mean (once each, after Puddock is met)
const CAMP_TIPS = { lanterns: "Another lantern lit! One for every Lantern upgrade.", shelf: "A new gem for the shelf. Find all twelve kinds.",
  sapling: "The sapling grew. It grows with your Root Charm.", memories: "The old stump is healing. Every coin you sell gives light back to its roots." };
function campTips() {
  if (!save.metPuddock || !$("home").classList.contains("show") || ["talk", ...SHEETS].some((id) => $(id).classList.contains("show"))) return;
  const now = { lanterns: save.up.lantern, shelf: save.found.length, sapling: save.up.charm, memories: save.story.site === "stump" ? Math.floor(Math.log10(save.light + 1) / 5.3 * 9) : 0 };
  const seen = save.campSeen ??= { ...now, told: [] }, tip = Object.keys(now).find((k) => now[k] > seen[k] && !seen.told.includes(k));
  Object.assign(seen, now); if (tip) seen.told.push(tip); persist();
  const el = tip && $("campArt").querySelector(`[data-tip="${tip}"]`); if (!el) return;
  const b = el.getBoundingClientRect(), st = $("campStage").getBoundingClientRect();
  campFx(Math.max(120, Math.min(st.width - 120, b.left + b.width / 2 - st.left)), Math.max(190, b.top - st.top + b.height / 2 + 40), CAMP_TIPS[tip], "campSay campTip");
}

// camp: taps make things happen, and the layers drift with your finger (parallax)
function campFx(x, y, html, cls = "campPop") {
  const el = document.createElement("div"); el.className = cls; el.innerHTML = html; el.style.left = x + "px"; el.style.top = y + "px"; $("campFx").appendChild(el);
  el.animate([{ transform: "translate(-50%, 0) scale(.6)", opacity: 0 }, { transform: "translate(-50%, -26px) scale(1)", opacity: 1, offset: .3 }, { transform: "translate(-50%, -48px)", opacity: 0 }],
    { duration: cls === "campSay" ? 2600 : cls.includes("campTip") ? 4600 : 900, easing: "ease-out" }).onfinish = () => el.remove();
}
$("campStage").addEventListener("pointerdown", (e) => {
  const t = e.target.closest("[data-tap]"), st = $("campStage").getBoundingClientRect(), x = e.clientX - st.left, y = e.clientY - st.top;
  if (!t) return;
  const what = t.dataset.tap;
  if (what !== "dibble" && what !== "pet") for (const g of $("campArt").querySelectorAll(`[data-tap="${what}"]`)) // every prop answers a press: a little squash and glow
    g.animate([{ transform: "scale(1)" }, { transform: "scale(1.06, .93)", filter: "brightness(1.35)", offset: .35 }, { transform: "scale(.98, 1.03)", offset: .7 }, { transform: "scale(1)" }], { duration: 300, easing: "ease-out" });
  if (what === "dibble") { t.animate([{ transform: "translateY(0)" }, { transform: "translateY(-12px)" }, { transform: "translateY(0)" }, { transform: "translateY(-4px)" }, { transform: "translateY(0)" }], { duration: 520, easing: "ease-out" });
    ui.chirp(); campFx(x, y - 10, "♪"); buzz(10); }
  else if (what === "pet") { petHappy(t.pet); campFx(x, y - 10, "♪"); buzz(8); }
  else if (what === "fire") { for (let k = 0; k < 5; k++) setTimeout(() => campFx(x + (Math.random() - .5) * 30, y, "✦", "campSpark"), k * 40); for (let k = 0; k < 4; k++) tone(2000 + Math.random() * 2000, .03, "square", .02, k * .03); buzz(15); }
  else if (what === "lanterns") { [523, 659, 784].forEach((f, k) => tone(f * 2, .3, "sine", .05, k * .07)); campFx(x, y, "✧"); }
  else if (what.startsWith("gem-")) { soundtrack.chime(+what.slice(4)); campFx(x, y, "✦", "campSpark"); }
  else if (what === "tent" || what === "wardrobe") { tone(520, .08, "triangle", .05); show("wardrobe"); }
  else if (what === "mines") { tone(392, .1, "triangle", .06); renderMines(); show("mineSheet"); }
  else if (what === "daily") { tone(660, .08, "triangle", .05); show("dailySheet"); }
  else if (what === "market") { tone(330, .1, "triangle", .06); openMarket(); }
  else if (what === "memories") { tone(440, .14, "sine", .05); replayMemories(home); }
  else if (what === "sapling") { tone(880, .12, "sine", .04); tone(1320, .1, "sine", .03, .06); campFx(x, y - 10, "✦", "campSpark"); buzz(8); }
  else if (what === "tools") { tone(1800, .05, "square", .025); tone(2400, .05, "square", .02, .07); buzz(8); }
  else if (what === "flag") { tone(300, .1, "triangle", .04); buzz(6); }
  else if (what.startsWith("build-")) { campFx(x, y - 20, quote(SHOP.find((i) => i.id === "decor:" + what.slice(6)).desc), "campSay"); tone(587, .14, "sine", .05); tone(880, .12, "sine", .04, .08); }
  else if (what === "granny") { campFx(x, y - 20, quote(pick(CAMP_LINES.granny)), "campSay"); tone(330, .12, "triangle", .06); }
  else if (what === "puddock") { campFx(x, y - 20, quote(pick(CAMP_LINES[save.story.finale ? "puddockPost" : save.story.site === "stump" ? "puddock" : "puddockUnder"])), "campSay"); tone(220, .12, "triangle", .07); }
});
$("campStage").addEventListener("pointermove", (e) => {
  const st = $("campStage").getBoundingClientRect(), dx = (e.clientX - st.left) / st.width - .5, dy = (e.clientY - st.top) / st.height - .5;
  const pud = $("campArt").querySelector(".pud"), m = pud && $("campArt").querySelector("[data-tap=market]").getBoundingClientRect(); // Puddock looks up when you come near
  if (pud) pud.classList.toggle("near", Math.hypot(e.clientX - (m.left + m.width / 2), e.clientY - (m.top + m.height / 2)) < m.width * 1.1);
  for (const g of $("campArt").querySelectorAll("[data-depth]")) g.setAttribute("transform", `translate(${(-dx * 18 * g.dataset.depth).toFixed(2)} ${(-dy * 8 * g.dataset.depth).toFixed(2)})`);
  const k = st.width / 400 * .75; $("campPets").style.transform = `translate(${(-dx * 18 * k).toFixed(2)}px, ${(-dy * 8 * k).toFixed(2)}px)`; // the pets drift with the middle props
});

// ---------- frame ----------
let last = performance.now(), shownHaul = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (state === "play" && started && !calm && !document.hidden) {
    if (now > frozenUntil) time -= dt * T.drain * biome.drain;
    const f = time / maxTime;
    if (f < T.warn && Math.floor(time) !== Math.floor(time + dt * T.drain * biome.drain)) { sfx.tick(); buzz(10); }
    if (time <= 0) { time = 0; endRound("time"); }
  }
  ctx.clearRect(0, 0, W, H);
  if (state === "play" && !calm) { const f = time / maxTime, tns = f < T.warn ? (T.warn - f) / T.warn : 0; if (Math.abs(tns - (frame.tns || 0)) > .05) soundtrack.setTension(frame.tns = tns); }
  else if (frame.tns) soundtrack.setTension(frame.tns = 0);
  const frozenFx = now < hitStop, onBoard = state !== "home" && board, endT = ending ? easeOut(Math.min(1, (now - ending.at) / 900)) : 1;
  if (onBoard) drawMine(now);
  ctx.save();
  if (shakeAmp > .2) { ctx.translate((fxR() - .5) * shakeAmp, (fxR() - .5) * shakeAmp); if (!frozenFx) shakeAmp *= .86; }
  if (onBoard) {
    if (!NOLAYER.has("bg")) ctx.drawImage(bgCache.board, bgCache.x, bgCache.y, bgCache.w, bgCache.w);
    if (!calm) drawRootline(now);
    drawPeek(now);
    const groups = {}, dim = state === "end" ? 1 - .55 * endT : 1;
    board.forEach((u, i) => { if (u) (groups[u] ??= []).push([Math.floor(i / N), i % N]); });
    for (const u in groups) {
      if (isMoth(+u)) continue;
      const m = meta[u], cr = CRYSTALS[m.type];
      // landing: glide the last bit into the cell (ease-out), then squash and spring back
      const age = now - (m.at || 0), gk = 1 - easeOut(Math.min(1, age / 90)), sk = Math.max(0, (age - 90) / 280);
      const dx = (m.ox || 0) * gk, dy = (m.oy || 0) * gk, sq = sk < 1 ? 1 + .13 * Math.sin(sk * Math.PI * 2) * (1 - sk) ** 2 : 1, moved = gk > 0 || sq !== 1;
      if (moved) { const px = bx + (m.c + m.w / 2) * cell, py = by + (m.r + m.h) * cell; ctx.save(); ctx.translate(px + dx, py + dy); ctx.scale(sq, 2 - sq); ctx.translate(-px, -py); }
      if (m.memory) memoryHalo(bx + (m.c + m.w / 2) * cell, by + (m.r + m.h / 2) * cell, Math.max(m.w, m.h) * cell);
      if (cr.stone) drawStone(groups[u], cell, bx, by, dim, (r, c) => cracked.has(r * N + c));
      else drawCrystal(groups[u], cr.color, m, cell, bx, by, dim, cr.ember ? .6 + .3 * Math.sin(now / 120 + +u) : .3, cr.glyph, cr.cut);
      if (m.memory) fossil(groups[u], cell, bx, by); else special(m.type, groups[u], cell, bx, by, dim, now);
      if (m.pet && board[m.petAt] === +u) sleeper(m.pet, bx + (m.petAt % N) * cell, by + Math.floor(m.petAt / N) * cell, cell, dim);
      if (moved) ctx.restore();
    }
    const t = drag && target();
    if (t && !t.bad) { // placement preview: the lines it would clear light up, and a ghost shows where it lands
      const after = place(board, drag.piece, t.r, t.c, -1), lines = fullLines(after), pure = pureVeinCells(after, lines, typeOf), p = .5 + .5 * Math.sin(now / 110);
      const col = pure.size ? "#f0b543" : lerpHex(CRYSTALS[drag.type].color, "#ffffff", .45);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 2;
      const band = (x, y, w, h) => { ctx.fillStyle = hexA(col, .16 + .12 * p); ctx.strokeStyle = hexA("#fff6d8", .3 + .3 * p); ctx.beginPath(); ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 8); ctx.fill(); ctx.stroke(); };
      for (const r of lines.rows) band(bx, by + r * cell, cell * N, cell);
      for (const c of lines.cols) band(bx + c * cell, by, cell, cell * N);
      ctx.restore();
      drawPiece(drag, cell, bx + t.c * cell, by + t.r * cell, .38);
      ctx.strokeStyle = "rgba(255,246,216,.55)"; ctx.lineWidth = 2; ctx.beginPath();
      for (const [r, c] of drag.piece.cells) ctx.roundRect(bx + (t.c + c) * cell + 3, by + (t.r + r) * cell + 3, cell - 6, cell - 6, 6);
      ctx.stroke();
    }
    for (const m of moths) drawMoth(m, now);
    if (now - lastTwinkle > 420) { // little glints wandering over the crystals
      lastTwinkle = now; const filled = board.map((u, i) => (u && !isMoth(u) ? i : -1)).filter((i) => i >= 0);
      if (filled.length) { const i = filled[Math.floor(Math.random() * filled.length)]; twinkles.push({ x: bx + (i % N + .25 + Math.random() * .5) * cell, y: by + (Math.floor(i / N) + .25 + Math.random() * .5) * cell, life: 1 }); }
    }
    twinkles = twinkles.filter((t) => (t.life -= .03) > 0);
    for (const t of twinkles) { const r = cell * .16 * Math.sin(t.life * Math.PI); ctx.fillStyle = `rgba(255,255,255,${.85 * Math.sin(t.life * Math.PI)})`;
      ctx.beginPath(); ctx.moveTo(t.x, t.y - r); ctx.lineTo(t.x + r * .25, t.y - r * .25); ctx.lineTo(t.x + r, t.y); ctx.lineTo(t.x + r * .25, t.y + r * .25);
      ctx.lineTo(t.x, t.y + r); ctx.lineTo(t.x - r * .25, t.y + r * .25); ctx.lineTo(t.x - r, t.y); ctx.lineTo(t.x - r * .25, t.y - r * .25); ctx.fill(); }
    if (ending?.cause === "time") { // the roots close in: they creep in from the frame and darken the board
      const pal = look(), col = mix(pal.root, "#2a1a10", .3), dark = mix(pal.root, "#000000", .6), cx = bx + cell * N / 2, cy = by + cell * N / 2;
      ctx.fillStyle = `rgba(10,6,4,${.3 * endT})`; ctx.fillRect(bx, by, cell * N, cell * N);
      for (let k = 0; k < 12; k++) { const side = k % 4, u = ((k * .37 + .13) % 1) * .8 + .1, len = cell * (1.4 + (k % 3) * .8) * endT;
        const [x1, y1] = [[bx + u * cell * N, by - 14], [bx + cell * N + 14, by + u * cell * N], [bx + u * cell * N, by + cell * N + 14], [bx - 14, by + u * cell * N]][side];
        const l = Math.hypot(cx - x1, cy - y1), ux = (cx - x1) / l, uy = (cy - y1) / l, bend = (k % 2 ? 1 : -1) * len * .3;
        const path = new Path2D(limb(x1, y1, x1 + ux * len * .5 - uy * bend, y1 + uy * len * .5 + ux * bend, x1 + ux * len, y1 + uy * len, 7, .8));
        ctx.save(); ctx.translate(-1.5, 1.5); ctx.fillStyle = dark; ctx.fill(path); ctx.restore(); ctx.fillStyle = col; ctx.fill(path); }
    }
    tray.forEach((q, i) => {
      if (!q || drag?.i === i) return;
      const h = trayRect(i), b = back[i], fits = fitsAnywhere(board, q.piece), a = (now - dealtAt - i * 70) / 300;
      if (a < 0) return; // a new tray pops in, one piece after another
      let x = h.x, y = h.y, sz = ts;
      if (b) { const k = easeOut(Math.min(1, (now - b.at) / 220)); x = b.x + (h.x - b.x) * k; y = b.y + (h.y - b.y) * k; sz = b.s + (ts - b.s) * k; if (k >= 1) back[i] = null; }
      if (ending?.cause === "stuck") x += Math.sin(now / 28 + i) * 4 * Math.max(0, 1 - (now - ending.at) / 700); // no room: the pieces shake their heads
      const sc = a < 1 ? easeBack(a) : 1;
      if (sc !== 1) { const px = x + q.piece.w * sz / 2, py = y + q.piece.h * sz / 2; ctx.save(); ctx.translate(px, py); ctx.scale(sc, sc); ctx.translate(-px, -py); }
      drawPiece(q, sz, x, y, fits ? 1 : .3);
      if (sc !== 1) ctx.restore();
    });
    if (!calm && time / maxTime < T.warn && state === "play") { // red vignette when the roots close in
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(150,30,20,${.25 + .12 * Math.sin(now / 150)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (t) { const k = Math.min(1, (now - drag.at) / 160), e = easeOut(k), sz = ts + (cell - ts) * easeBack(k); // lift out of the tray: grow and rise to the finger
      drawPiece(drag, sz, drag.from.x + (t.x - drag.from.x) * e, drag.from.y + (t.y - drag.from.y) * e, .95); }
  }
  // glow first (additive, from the cached sprites), then the shards on top of it; everything steps on dt, so 120Hz plays at the same speed
  const fk = dt * 60, run = !frozenFx; // hit-stop: hold still for a beat
  fx = fx.filter((f) => f.life > 0);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (const f of fx) {
    if (f.delay > 0) { f.delay -= dt * 1000; continue; }
    if (run || f.kind === "flash") f.life -= dt / f.dur;
    const L = Math.max(0, f.life), e = 1 - L;
    if (f.kind === "flash") { ctx.globalAlpha = L * L * f.a; ctx.fillStyle = f.col; ctx.beginPath(); ctx.roundRect(f.x + 2, f.y + 2, cell - 4, cell - 4, 6); ctx.fill(); }
    else if (f.kind === "bloom") { const s = f.s * (calmMotion ? 1 : .55 + .55 * easeOut(e)); ctx.globalAlpha = Math.min(1, e * 8) * L ** 1.4 * f.a; ctx.drawImage(glowSpr(f.col), f.x - s / 2, f.y - s / 2, s, s); }
    else if (f.kind === "burst") { // the crystal's own colour bursts out: a full-colour glow and short tapered rays, painted (not added) so overlaps keep their hue
      const s = f.s * (calmMotion ? .9 : .5 + .7 * easeOut(e)), a = Math.min(1, e * 10) * L * f.a; ctx.globalAlpha = a; ctx.globalCompositeOperation = "source-over"; ctx.drawImage(glowSpr(f.col, true), f.x - s / 2, f.y - s / 2, s, s);
      if (!calmMotion) { const r0 = cell * (.2 + .5 * easeOut(e)), r1 = cell * (.45 + 1.05 * easeOut(e)); ctx.strokeStyle = f.col; ctx.lineCap = "round"; ctx.lineWidth = cell * .11 * L; ctx.beginPath();
        for (let j = 0; j < f.rays; j++) { const an = f.rot + j * Math.PI * 2 / f.rays, c = Math.cos(an), sn = Math.sin(an), r = j % 2 ? r1 * .75 : r1; ctx.moveTo(f.x + c * r0, f.y + sn * r0); ctx.lineTo(f.x + c * r, f.y + sn * r); }
        ctx.stroke(); } ctx.globalCompositeOperation = "lighter"; }
    else if (f.kind === "sweep") { // a streak of light runs along the cleared line, leaving a faint shine behind it
      const p = easeOut(e) * (cell * N + cell * 2) - cell, mid = (f.v + .5) * cell, a = Math.sin(Math.PI * e), im = glowSpr("#fff0c4");
      ctx.globalAlpha = a * .12; ctx.fillStyle = "#fff0c4"; if (f.row) ctx.fillRect(bx, by + f.v * cell, Math.max(0, Math.min(cell * N, p)), cell); else ctx.fillRect(bx + f.v * cell, by, cell, Math.max(0, Math.min(cell * N, p)));
      ctx.globalAlpha = a * .85; if (f.row) ctx.drawImage(im, bx + p - cell * 1.6, by + mid - cell * .6, cell * 3.2, cell * 1.2); else ctx.drawImage(im, bx + mid - cell * .6, by + p - cell * 1.6, cell * 1.2, cell * 3.2); }
    else if (f.kind === "screen") { const w = cell * (N + 5); ctx.globalAlpha = f.a * Math.min(1, e * 6) * L; ctx.drawImage(glowSpr(f.col), bx + cell * N / 2 - w / 2, by + cell * N / 2 - w / 2, w, w); }
    else if (f.kind === "mote") { // drifts up, sways, twinkles out
      if (run) { f.x += (f.vx + Math.sin(f.ph + e * 9) * .35) * fk; f.y += f.vy * fk; f.vy *= .985 ** fk; }
      const s = f.s * (.6 + .4 * Math.sin(f.ph * 3 + e * 20) ** 2); ctx.globalAlpha = Math.min(1, e * 6) * L; ctx.drawImage(glowSpr(f.col), f.x - s / 2, f.y - s / 2, s, s); }
    else if (f.kind === "pulse") { const s = cell * (1.4 + 3.2 * easeOut(e)); ctx.globalAlpha = .9 * Math.min(1, e * 8) * L; ctx.drawImage(glowSpr(f.col), f.x - s / 2, f.y - s / 2, s, s); }
    else if (f.kind === "ring") { ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(255,246,200,${L * .8})`; ctx.lineWidth = 3 * L; ctx.beginPath(); ctx.arc(f.x, f.y, f.r + easeOut(e) * cell * 2.6, 0, 7); ctx.stroke(); }
    else { // star
      if (run) { f.x += f.vx * fk; f.y += f.vy * fk; f.vx *= .93 ** fk; f.vy *= .93 ** fk; }
      const r = f.s * L; ctx.fillStyle = f.col; ctx.globalAlpha = L;
      ctx.beginPath(); ctx.moveTo(f.x, f.y - r); ctx.lineTo(f.x + r * .3, f.y - r * .3); ctx.lineTo(f.x + r, f.y); ctx.lineTo(f.x + r * .3, f.y + r * .3);
      ctx.lineTo(f.x, f.y + r); ctx.lineTo(f.x - r * .3, f.y + r * .3); ctx.lineTo(f.x - r, f.y); ctx.lineTo(f.x - r * .3, f.y - r * .3); ctx.fill(); }
  }
  ctx.restore();
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) { // faceted shards: shadow face, body, lit face with a light edge; a glint when a face turns to the light
    if (p.delay > 0) { p.delay -= dt * 1000; continue; }
    if (run) { p.x += p.vx * fk; p.y += p.vy * fk; p.vy += p.g * fk; p.vx *= (p.k === "flake" ? .96 : .98) ** fk; p.rot += p.vr * fk * (p.k === "flake" ? .5 : 1); p.life -= p.fade * fk; }
    const a = Math.min(1, p.life * 2.5), h = p.s / 2, w = h * p.w;
    if (p.k === "spark") { // ember sparks: a hot streak and a glowing head
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a; ctx.strokeStyle = p.lt; ctx.lineWidth = Math.max(1.2, h * .5); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4); ctx.stroke(); ctx.drawImage(glowSpr(p.col), p.x - h * 2, p.y - h * 2, h * 4, h * 4);
      ctx.globalCompositeOperation = "source-over"; continue; }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.k === "flake") { // frost: a six-armed ice flake with a bright core
      ctx.strokeStyle = p.lt; ctx.lineWidth = Math.max(1.3, h * .3); ctx.lineCap = "round"; ctx.beginPath();
      for (let j = 0; j < 3; j++) { const c = Math.cos(j * 1.047) * h * 1.1, s = Math.sin(j * 1.047) * h * 1.1; ctx.moveTo(-c, -s); ctx.lineTo(c, s); }
      ctx.stroke(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, h * .28, 0, 7); ctx.fill(); ctx.restore(); continue; }
    ctx.fillStyle = p.dk; ctx.beginPath(); ctx.moveTo(-w - 1, h + 1); ctx.lineTo(-1, -h + 1); ctx.lineTo(w - 1, h * .66 + 1); ctx.fill();
    ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(-w, h); ctx.lineTo(0, -h); ctx.lineTo(w, h * .66); ctx.fill();
    ctx.fillStyle = p.lt; ctx.beginPath(); ctx.moveTo(-w, h); ctx.lineTo(0, -h); ctx.lineTo(0, h * .8); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w, h); ctx.lineTo(0, -h); ctx.stroke();
    const gl = Math.max(0, Math.sin(p.rot * 1.6 + p.ph)) ** 10;
    if (gl > .05) { ctx.globalAlpha = a * gl; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(-w, h); ctx.lineTo(0, -h); ctx.lineTo(0, h * .8); ctx.fill(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (onBoard) drawFrees(now);
  ctx.restore(); // end screen shake
  if (onBoard) drawHint(now);
  pops = pops.filter((p) => p.life > 0).slice(-2); // newest two only
  pops.forEach((p, k) => { // anime-style combo callouts: pop in big, settle, float away
    p.full ??= p.life; p.life -= .016; const t = 1 - p.life / p.full, sc = t < .15 ? .4 + t / .15 * .9 : t < .25 ? 1.3 - (t - .15) * 3 : 1, y = by + cell * 1.1 + k * 36 - Math.max(0, t - .6) * 50;
    ctx.save(); ctx.translate(bx + cell * N / 2, y); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, p.life * 2.5);
    ctx.font = "700 30px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.lineJoin = "round"; ctx.lineWidth = 7; ctx.strokeStyle = "#3a2418";
    ctx.strokeText(p.text, 0, 0); ctx.fillStyle = p.col; ctx.fillText(p.text, 0, 0); ctx.restore();
  });
  floats = floats.filter((f) => f.life > 0);
  ctx.textAlign = "center"; ctx.font = "700 22px Fredoka, sans-serif"; ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(40,24,12,.8)";
  for (const f of floats) { // rise with an ease-out, a little pop at the start, fade at the end
    f.life -= .014; const t = 1 - f.life, sc = t < .12 ? .6 + .4 * easeBack(t / .12) : 1;
    ctx.save(); ctx.translate(f.x, f.y - 46 * easeOut(t)); ctx.scale(sc, sc); ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 3));
    ctx.strokeText(f.text, 0, 0); ctx.fillStyle = f.color; ctx.fillText(f.text, 0, 0); ctx.restore(); }
  ctx.globalAlpha = 1;
  drawCoins(now);
  if (haul) { // the Haul badge counts up as the coins fly in
    const v = haulValue(); shownHaul += (v - shownHaul) * .08; if (Math.abs(v - shownHaul) < .5) shownHaul = v;
    const txt = Math.round(shownHaul) + "g"; if (txt !== frame.haulTxt) $("haul").textContent = frame.haulTxt = txt;
  }
  requestAnimationFrame(frame);
}

document.addEventListener("pointerdown", (e) => { if (e.target.closest("button:not(:disabled)")) { ui.tap(); buzz(6); } }, true);
// iOS only lets a tap start audio as the touch ends (touchend/pointerup/click), so wake it on those whenever it's asleep
// (after the app was in the background too); the first one also starts the music
let heard = false;
for (const ev of ["pointerup", "touchend", "click", "keydown"]) document.addEventListener(ev, () => {
  soundtrack.unlock(); if (!heard) { heard = true; soundtrack.setEnabled(save.opt.music); } }, { capture: true, passive: true });
// dust specks flash in menus and camp
{ const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dust = $("dust");
  if (!still) setInterval(() => {
    if (document.hidden || document.body.classList.contains("playing")) return;
    const i = document.createElement("i"), hair = Math.random() < .25, sz = 1 + Math.random() * 2.5;
    i.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${hair ? 1 : sz}px;height:${hair ? 14 + Math.random() * 26 : sz}px;${hair ? `transform:rotate(${Math.random() * 40 - 20}deg)` : ""}`;
    dust.appendChild(i); setTimeout(() => i.remove(), 80 + Math.random() * 90);
  }, 220); }
if (qs.has("debug")) window.gw = { place: (i, r, c) => commit(i, r, c), get tray() { return tray; }, get board() { return board; },
  get time() { return time; }, set time(v) { time = v; }, canPlace, get state() { return state; },
  get moths() { return moths; }, get stolen() { return stolen; }, get bonus() { return bonus; }, PM, end: endRound,
  get geo() { return { bx, by, cell, trayX, slotW, trayY, trayH, hintY }; },
  // tests: open any screen the way the game does (scripts/smoke.mjs walks them all)
  screen: (id) => { renderHome(); if (id === "memSheet") return replayMemories(); if (id === "talk") return talk(() => show("home"));
    ({ market: renderMarket, purseSheet: renderPurse, mineSheet: renderMines })[id]?.(); show(id); },
  dig: (id = "hollow") => { if (!save.biomes.includes(id)) save.biomes.push(id); save.sel = id; startDig(); } }; // in-memory only: screenshots of any mine

$("world").innerHTML = forest();
for (const el of document.querySelectorAll(".vineSlot")) el.outerHTML = vine();
$("flies").innerHTML = [...Array(14)].map((_, k) => `<i class="fly" style="left:${(k * 37) % 100}%;top:${20 + (k * 53) % 70}%;animation-delay:${-k * 0.7}s,${-k * 0.37}s"></i>`).join("");
$("talkArt").innerHTML = puddock(120); $("puddockArtEnd").innerHTML = puddock(52); $("puddockArtMkt").innerHTML = puddock(60); $("puddockArtPurse").innerHTML = puddock(60);
$("hubMenu").innerHTML = icon("gear", 24);
for (const el of document.querySelectorAll(".icoX")) el.innerHTML = brushX();
document.querySelector(".icoCredits").innerHTML = icon("leaf", 22);
for (const id of ["coinA", "coinB", "coinC", "coinD"]) $(id).innerHTML = coin(22);
$("coinHud").innerHTML = coin(26);


// ===== track 5 (trust and launch): Options extras, version, VoiceOver labels, reduced motion. Keep this block together. =====
{ // Options: Restore purchases (App Store rule for non-consumables), the privacy policy, the version
  const card = $("optsSheet").querySelector(".card"), el = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls, textContent: text });
  const restore = el("button", "alt", "Restore purchases"), policy = el("button", "linkBtn", "Privacy policy"), ver = el("div", "note", `Glimmerwood ${platform.version}`);
  restore.onclick = async () => {
    if (!platform.canBuy) return toast("Purchases are restored in the app");
    restore.disabled = true; const r = await platform.restore(); restore.disabled = false;
    toast(r ? "Remove ads restored. Thank you!" : r === false ? "No purchases to restore on this Apple Account" : "Couldn't reach the App Store. Try again in a moment");
  };
  policy.onclick = () => window.open(platform.privacyUrl, "_blank"); policy.style.minHeight = "44px"; // S2 tap target
  $("toTitle").before(restore); card.append(policy, ver);
}
{ // VoiceOver: camp props are painted SVG, so give them a role and a name; mine cards act as buttons
  const NAMES = { mines: "Go mining", daily: "Daily Dig", wardrobe: "Wardrobe", tent: "Wardrobe", market: "Puddock's market", memories: "Amber Memories",
    dibble: "Dibble", pet: "Your pet", fire: "Campfire", lanterns: "Lanterns", puddock: "Old Puddock", granny: "Granny Burr" };
  const name = (t) => { const gem = t.startsWith("gem-") && GEMS[+t.slice(4)]; return gem ? (save.found.includes(gem) ? CRYSTALS[gem].name : "Empty gem slot") : NAMES[t] || t; };
  const label = () => {
    document.querySelectorAll('#campArt [data-tap="lanterns"]').forEach((g, k) => k && g.setAttribute("aria-hidden", "true")); // one string of lanterns, read once
    for (const g of document.querySelectorAll("#campArt [data-tap]:not([role])")) g.setAttribute("role", "button"), g.setAttribute("aria-label", name(g.dataset.tap));
    for (const m of document.querySelectorAll("#mines .mine:not(.teaser):not([role])")) m.setAttribute("role", "button");
  };
  for (const id of ["campArt", "mines"]) new MutationObserver(label).observe($(id), { childList: true });
  $("hubMenu").setAttribute("aria-label", "Options"); $("cv").setAttribute("aria-label", "Mining board");
}
{ // reduced motion (K1): CSS stops the CSS loops; SVG <animate> idles (camp, characters, forest) are paused here as they appear
  const still = matchMedia("(prefers-reduced-motion: reduce)"), pause = (n) => n.nodeType === 1 && [n, ...n.querySelectorAll("svg")].forEach((s) => s.pauseAnimations?.());
  if (still.matches) { pause(document.body); new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(pause))).observe(document.body, { childList: true, subtree: true }); }
  // J2: during a dig the forest sits blurred at 16% behind the board; its glow pulse re-filtered the whole layer every frame
  else new MutationObserver(() => document.querySelectorAll("#world svg").forEach((s) => document.body.classList.contains("playing") ? s.pauseAnimations() : s.unpauseAnimations()))
    .observe(document.body, { attributes: true, attributeFilter: ["class"] });
}
// ===== end of track 5 block =====

if (platform.native) $("adNote").textContent = "Green buttons play a short video ad.";
platform.init().then(async () => { // then pay out any coin pack the app closed before crediting
  const gold = await platform.unclaimedCoins(save.coinTx);
  if (gold) { save.gold += gold; persist(); toast(`Puddock found ${gold.toLocaleString("en-US")} coins you'd paid for`, 2500); }
  renderHome();
});
platform.gameCenter.then((ok) => { // Game Center leaderboards (iOS): the entries appear once it's available
  if (!ok) return;
  for (const id of ["dLb", "oLb"]) { $(id).style.display = ""; $(id).onclick = async () => (await platform.showLeaderboards()) || toast("Sign in to Game Center in Settings to see the leaderboards"); }
  // scores from before sign-in (or before this update) reach the boards too; Game Center ignores ones below the player's best
  const best = Math.max(0, ...Object.entries(save.best).filter(([k]) => !k.endsWith(":calm")).map(([, v]) => v));
  if (best) platform.submitScore("best_haul", best);
  if (save.story.mem.length) platform.submitScore("memories_found", save.story.mem.length);
  if (save.daily.last === today()) platform.submitScore("daily_dig", save.daily.best);
});
$("logoSwash").innerHTML = logoSwash(); $("logo").innerHTML = logoLetters(); $("titleScene").innerHTML = titleScene(STILL);
renderHome(); show("title"); layout(); document.fonts?.ready.then(layout);
if (qs.has("scene")) sceneCheck(qs.get("scene"));
requestAnimationFrame(() => requestAnimationFrame(() => window.Capacitor?.Plugins?.SplashScreen?.hide())); // the title has painted
requestAnimationFrame(frame);

// Glimmerwood story (docs/STORY.md). Text and story rules only; pictures are in art.js
// (memoryArt kinds, stumpArt, granny, bidder). index.html plays the scenes.

// First launch: four amber panels, one line each (memoryArt kind + caption).
export const PROLOGUE = [
  { art: "oak", text: "Every autumn, the Glimmeroak glowed." },
  { art: "rootglow", text: "One autumn, something under its roots glowed back." },
  { art: "lanterns", text: "The Lantern Moles lit their lanterns and went down to see." },
  { art: "dawn", text: "By morning there was a stump, a toad with a cart, and one small mole with a lantern." },
];

// Amber Memories, in the order each mine gives them up. art = memoryArt kind.
export const MEMORIES = {
  // Ring One: the Glimmeroak
  hollow: [
    { id: "hollow1", art: "leaf", text: "The last leaf. It should not have been that bright." },
    { id: "hollow2", art: "oak", text: "The whole wood glowed that autumn. Nobody asked why." },
    { id: "hollow3", art: "dawn", text: "Dawn. A stump, and a toad who would not look at it." },
  ],
  ember: [
    { id: "ember1", art: "smoke", text: "Smoke rose from the ground, not the sky." },
    { id: "ember2", art: "thaw", text: "The soil was warm in midwinter." },
    { id: "ember3", art: "rootglow", text: "Something under the roots was burning, slow and patient." },
  ],
  grotto: [
    { id: "grotto1", art: "lanterns", text: "Lanterns going down. Dozens. None coming up." },
    { id: "grotto2", art: "count", text: "An old mole counting lanterns. Counting twice." },
    { id: "grotto3", art: "caps", text: "Mushrooms came the next spring, where the fire had been." },
  ],
  frostpine: [
    { id: "frost1", art: "toad", text: "A toad in the hollow, a light in his arms, running the wrong way." },
    { id: "frost2", art: "frost", text: "Frostspar laid on the burning roots, one stone at a time." },
    { id: "frost3", art: "deeper", text: "The fire froze. The light did not. It went on down." },
  ],
  gulch: [
    { id: "receipt", art: "receipt", text: "One shard, heartwood, fist-sized. Paid in full. Do not ask what for. —P.B." },
    { id: "gulch2", art: "coin", text: "Pale coin, pressed into a young toad's palm." },
    { id: "gulch3", art: "market", text: "A market in the oak's hollow, built on one fist-sized secret." },
  ],
  heartwood: [
    { id: "heart1", art: "heart", text: "There is a hollow where the shard was. It aches like a missing tooth." },
    { id: "heart2", art: "deeper", text: "Every lantern passed the heart. Not one stopped." },
    { id: "heart3", art: "pull", text: "Somewhere below, the light is still being pulled." },
  ],
  // The bridge into the Underroot
  cinder: [
    { id: "cinder1", art: "scorch", text: "The fire did not wander. It was called." },
    { id: "cinder2", art: "wings", text: "Wings folded like a cloak. A heart-shard held up like a candle." },
    { id: "cinder3", art: "carriers", text: "A thousand small wings, each carrying a crumb of light." },
  ],
  // Ring Two: the Undermoon
  roost: [
    { id: "roost1", art: "spirals", text: "Round and round the brightest thing, looking for the sky." },
    { id: "roost2", art: "scalefall", text: "Scales falling like snow on little ones who cannot fly straight." },
    { id: "roost3", art: "circling", text: "A moth circling a mole's lantern, sure it had found the moon." },
  ],
  loom: [
    { id: "loom1", art: "skyhole", text: "Once there was a hole in the roof, and through it, the real one." },
    { id: "loom2", art: "cavein", text: "The roof fell. The sky went out. Only she remembers it." },
    { id: "loom3", art: "bracket", text: "Mole brackets, bolted into the loom. Neat work. Familiar work." },
  ],
  wickhold: [
    { id: "wick1", art: "village", text: "A ring of lanterns, hung around a moon that isn't." },
    { id: "wick2", art: "count", text: "An old mole counting lanterns. All of them still lit." },
    { id: "wick3", art: "window", text: "A small lantern left in a window, every night, for whoever comes looking." },
  ],
  // The finale
  skywell: [
    { id: "sky1", art: "rubble", text: "Stone on stone on stone, and somewhere above it all, the sky." },
    { id: "sky2", art: "listening", text: "Small wings pressed to the rock, listening for the moon." },
    { id: "sky3", art: "thread", text: "A thread of silver through the stone. Real moonlight. Just a thread." },
  ],
};
export const MEMORY_COUNT = Object.values(MEMORIES).flat().length;
export const nextMemory = (mine, found) => (MEMORIES[mine] || []).find((m) => !found.includes(m.id)) || null;
export const memoryById = (id) => Object.values(MEMORIES).flat().find((m) => m.id === id);
export const mineOfMemory = (id) => Object.keys(MEMORIES).find((k) => MEMORIES[k].some((m) => m.id === id));
export const mineDone = (st, mine) => MEMORIES[mine].every((m) => st.mem.includes(m.id));

// Where camp is: the stump (Ring One), the Underroot (bridge + Ring Two), the Skywell (finale and after).
export const SITES = { stump: "The old stump", underroot: "The Underroot", skywell: "The Skywell" };
// Mines the story hands you (no map to buy), and maps Puddock only sells once the story has reached them.
export const GIVEN = { cinder: "underroot", skywell: "skywell" };
export const MAP_GATE = { roost: (st) => !!st.ledge, loom: (st) => mineDone(st, "roost"), wickhold: (st) => mineDone(st, "loom") };

// Which scene plays after a sale, if any (one per sale, in story order).
export function nextScene(st) {
  if (!st.confessed && st.mem.includes("receipt")) return "confession";
  if (st.site === "stump" && mineDone(st, "heartwood")) return st.confessed ? "lead" : st.sprout ? null : "sprout";
  if (st.site === "underroot" && !st.ledge && mineDone(st, "cinder")) return "ledge";
  if (st.site === "underroot" && mineDone(st, "wickhold")) return "reunion";
  if (st.site === "skywell" && !st.finale && mineDone(st, "skywell")) return "finale";
  return null;
}

// Granny's chalk, scratched faintly across each mine's board.
export const CHALK = {
  hollow: "↓  —B",
  ember: "TOO HOT HERE. GONE DEEPER. —B",
  grotto: "Frost stops it. Bring all the frost.",
  frostpine: "Fire's frozen. Heart still leaks. Following it down. —B",
  gulch: "Light cools to stone down here. So do secrets. —B",
  heartwood: "The under-roots go everywhere. So did the fire. Keep your lantern lit. —B",
  cinder: "Moths everywhere. Not attacking. Hauling. Following them. —B",
  roost: "They follow lanterns because they think we're the moon. Don't swat them. —B",
  loom: "Couldn't take it. Couldn't leave it. So we tend it. —B",
  wickhold: "Nearly home. Wipe your paws. —B",
  skywell: "Dig up. Always up, now. —B",
};

// Puddock's haul lines by the mine you dug in; they read differently once you know.
export const PUDDOCK_BY_MINE = {
  hollow: ["Old girl just got tired, that's all. Trees do.", "Lanterns and moles. Brings back… nothing. Brings back nothing.", "Folk sit on that stump. I don't."],
  ember: ["Burnt? Lightning, I expect. Lot of lightning that year.", "Don't bring the smoky ones near my cart.", "Embers stay warm a long time. Longer than they ought to."],
  grotto: ["Mushrooms only grow where something's finished.", "Your gran? Never met her. …Small forest, though."],
  frostpine: ["Cold's honest. I like cold.", "That night? Asleep. Snoring. Ask anyone. Don't, actually."],
  gulch: ["Geodes keep things. Best not to crack every one.", "Stone remembers. Toads try not to."],
  heartwood: ["Deep enough to hear her heartbeat, they say. Not that I've listened.", "Mind the heart. It's had enough taken from it."],
  cinder: ["Every scorch mark points the same way. Fire doesn't do that. Not on its own.", "Mind the scales. They're warm. Scales shouldn't be warm.",
    "I sold a chip of the heart to a moth. Say it out loud and it sounds worse."],
  roost: ["They're not attacking. They're… lost.", "Every one of them's flying in circles. Like me, after the oak."],
  loom: ["That's my shard. Right there. Wearing a moon like a coat.", "Those are mole brackets. Your gran's work. I'd know them anywhere."],
  wickhold: ["Quiet down here. Too quiet for a village.", "If your gran's here, let me talk first. Actually, you talk first."],
  skywell: ["Digging up! My knees have never been so confused.", "Every rock you shift, those moths hold their breath."],
};
// After the confession these join every haul; after the finale, the last set does.
export const PUDDOCK_AFTER = ["I sold a piece of her for a shop. You're buying her back, one crystal at a time.",
  "Fair as rain. Trying to be, anyway.", "Your gran would've liked your digging. Hated your haggling."];
export const PUDDOCK_POSTGAME = ["Beat your best in the Roost? Your gran says you can't.", "That lantern's looking dim. Just saying.",
  "Coins for crystals. Same as ever. Nicer view, though.", "My cousin still hasn't written. Probably fine. Probably."];
// Tapping people at camp.
export const CAMP_LINES = {
  puddock: ["Nice fire. Mind my eyebrows.", "I'm not staying. I'm just… resting my cart.", "Your shelf's looking richer than my shop.", "Tea? No? More for me."],
  puddockUnder: ["Never thought I'd miss the rain.", "Moths keep landing on my hat. I think they like it.", "Keep that lantern high. Whoever's down here, they're watching it."],
  puddockPost: ["The cart? Half-packed. Just in case. No reason.", "Back soon (probably). That's what the sign says.", "A whole sky. Still can't get used to it."],
  granny: ["Eat something. Then dig.", "I counted the lanterns twice that night. Now I count one more.", "You hold that lantern just like I did. Too high.", "Puddock's been fussing over that cart for forty years."],
};
// Pets: small round creatures that fell asleep inside crystals (docs/STORY.md, "Pets"). home: the mines they turn up in most.
export const PETS = {
  moss: { name: "Moss Puff", home: ["hollow"], line: "Sat on a crystal so long it grew moss. Then it was the moss." },
  ember: { name: "Ember Mite", home: ["ember", "cinder", "heartwood"], line: "A spark that cooled into somebody. Still warm." },
  glowcap: { name: "Glowcap Sprite", home: ["grotto", "wickhold"], line: "Its antennae light up when it's happy. They're always lit." },
  frost: { name: "Frost Bun", home: ["frostpine", "loom"], line: "Fell asleep in a snowdrift and woke up in a crystal. Still sleepy." },
  pebble: { name: "Pebble Beetle", home: ["gulch", "skywell"], line: "Carries its house on its back, and a few spare pebbles." },
  moth: { name: "Tiny Moth", home: ["roost", "loom", "skywell"], line: "Too small to fly in circles. Flies in little loops instead." },
  geode: { name: "Geode Hedgehog", home: ["gulch", "heartwood"], line: "Amethyst spines. Doesn't like hugs. Allows them." },
};
export const PET_HINT = "Crystals keep things, little mole. Sometimes they keep someone."; // Puddock
export const PET_SHOP = "Tiny clothes for tiny friends. Everything fits. They're all round.";
export const SCALE_NOTE = "A pale scale. Warm to the touch. Faintly humming.";

// Scenes. who: "puddock" | "granny" | "bidder" | null (a picture with mysterious text). art: memoryArt kind.
export const SCENES = {
  sprout: [{ who: null, art: "sprout", say: "<i>At the stump, something green.</i>" }, { who: "puddock", say: "Well. Would you look at that. Green." }],
  confession: [
    { who: "puddock", say: "Just a chip, I told myself. The heart's as big as a pond." },
    { who: "puddock", say: "I watched those leaves glow all autumn and said nothing." },
    { who: "puddock", say: "Your gran gave me this the night she went down. I've kept it on that shelf for years, too ashamed to deliver it." },
    { who: null, art: "lanterns", letter: "If a little one comes asking, Puddock, give them this and tell them the truth. Tell them we followed the light down. Tell them not to follow. They will anyway. —B" },
    { who: "puddock", say: "It's yours. It always was.", gift: "lantern" },
  ],
  lead: [
    { who: null, art: "sprout", say: "<i>At the stump, something green.</i>" },
    { who: "puddock", say: "Well. Would you look at that. Green." },
    { who: null, art: "coin", say: "<i>A pale coin, never spent. A pale scale from a moth. Side by side, they match.</i>" },
    { who: "puddock", say: "That's no coin. Never was. That's a <b>wing</b>." },
    { who: "puddock", say: "Whoever paid me… the moths are theirs. And they've been carrying something down." },
    { who: "puddock", say: "You're going after her. …Course you are. I'll pack the cart." },
    { who: null, art: "cart", say: "<i>Tent, banner, shelf, every last lantern: into the cart.</i>" },
    { who: "puddock", say: "Careful with the shelf. That's twenty years of 'not for sale'." },
    { who: "puddock", say: "My cart's never gone further than the stump. Neither have I." },
    { who: "puddock", say: "Lantern lit? Good. You lead. I'll complain.", gift: "move:underroot" },
  ],
  ledge: [
    { who: null, art: "undermoon", say: "<i>The scorch marks end at a ledge. Far below, where no light should be, a pale glow hangs in the dark.</i>" },
    { who: "puddock", say: "Well. Somebody built themselves a moon." },
    { who: "puddock", say: "There's a roost down there. Moths, thick as fog. I'll draw you a map. It won't be cheap. Old habits.", gift: "maps" },
  ],
  reunion: [
    { who: null, art: "village", say: "<i>A ring of lanterns. Under them, a small figure, counting.</i>" },
    { who: "granny", say: "…Look at you. Carrying my lantern, too." },
    { who: "granny", say: "We came down to take it back. Then we saw the little ones." },
    { who: "bidder", say: "I did not want a heart. I wanted a sky. The heart was what was for sale." },
    { who: "puddock", say: "You paid fair. I didn't sell fair. I knew it was hers." },
    { who: "granny", say: "Open the Skywell. Give them a real moon, and the shard can go home." },
    { who: null, art: "cart", say: "<i>Into the cart again. This time, the Lantern Moles help carry.</i>" },
    { who: "puddock", say: "Twice in one life. My cart's going to want a raise.", gift: "move:skywell" },
  ],
  finale: [
    { who: null, art: "moonbeam", say: "<i>The last rock falls. Moonlight pours down the Skywell.</i>" },
    { who: null, art: "straight", say: "<i>For the first time, the moths fly straight.</i>" },
    { who: "bidder", say: "Take it home, little lantern.", gift: "shard" },
    { who: "granny", say: "Lantern Moles never walked when they could step. Watch." },
    { who: null, art: "wickway", say: "<i>Moonlight runs down every old lantern line at once. The Wickway is lit.</i>" },
    { who: null, art: "youngoak", say: "<i>The shard goes home. At the stump, a young Glimmeroak.</i>" },
    { who: "puddock", say: "Well. Would you look at that. A whole sky." },
    { who: null, art: "thread", chalk: "Found you, Gran. —D" },
    { who: "bidder", say: "My children see far now. Other hearts glow on the horizon. Some are dimming." },
    { who: "bidder", say: "I was not the only one buying." },
    { who: "puddock", say: "Dimmest one's near my cousin's shop. Course it is." },
    { who: "puddock", say: "Rest your paws. I'll… start packing. Eventually.", gift: "wickway" },
  ],
};

// The roots, when the Rootline closes.
export const MURMURS = ["The roots are reaching for your light.", "They don't mean harm. They're cold.", "Down here, light is food."];
export const MURMURS_DEEP = ["Down here, someone else is hungry too.", "Small wings. So tired.", "Warm again, soon. Soon."];
export const MURMURS_AFTER = ["Warm again.", "The roots remember your light.", "Dig as long as you like. They're listening."];

// Glimmerwood story, Ring One (docs/STORY.md). Text only; pictures are memoryArt()/stumpArt() in art.js.

// First launch: four wordless panels.
export const PROLOGUE = ["oak", "rootglow", "lanterns", "dawn"];

// Amber Memories, in the order each mine gives them up. art = memoryArt kind.
export const MEMORIES = {
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
    { id: "gulch3", art: "leaf", text: "He watched the leaves glow all autumn, and said nothing." },
  ],
  heartwood: [
    { id: "heart1", art: "heart", text: "There is a hollow where the shard was. It aches like a missing tooth." },
    { id: "heart2", art: "deeper", text: "Every lantern passed the heart. Not one stopped." },
    { id: "heart3", art: "lanterns", text: "Somewhere below, the light is still being pulled." },
  ],
};
export const MEMORY_COUNT = Object.values(MEMORIES).flat().length;
export const nextMemory = (mine, found) => (MEMORIES[mine] || []).find((m) => !found.includes(m.id)) || null;
export const memoryById = (id) => Object.values(MEMORIES).flat().find((m) => m.id === id);
export const mineOfMemory = (id) => Object.keys(MEMORIES).find((k) => MEMORIES[k].some((m) => m.id === id));

// Granny's chalk, scratched faintly across each mine's board.
export const CHALK = {
  hollow: "↓  —B",
  ember: "TOO HOT HERE. GONE DEEPER. —B",
  grotto: "Frost stops it. Bring all the frost.",
  frostpine: "Fire's frozen. Heart still leaks. Following it down. —B",
  gulch: "Light cools to stone down here. So do secrets. —B",
  heartwood: "The under-roots go everywhere. So did the fire. Keep your lantern lit. —B",
};

// Puddock's haul lines by the mine you dug in; they read differently once you know.
export const PUDDOCK_BY_MINE = {
  hollow: ["Old girl just got tired, that's all. Trees do.", "Lanterns and moles. Brings back… nothing. Brings back nothing.", "Folk sit on that stump. I don't."],
  ember: ["Burnt? Lightning, I expect. Lot of lightning that year.", "Don't bring the smoky ones near my cart.", "Embers stay warm a long time. Longer than they ought to."],
  grotto: ["Mushrooms only grow where something's finished.", "Your gran? Never met her. …Small forest, though."],
  frostpine: ["Cold's honest. I like cold.", "That night? Asleep. Snoring. Ask anyone. Don't, actually."],
  gulch: ["Geodes keep things. Best not to crack every one.", "Stone remembers. Toads try not to."],
  heartwood: ["Deep enough to hear her heartbeat, they say. Not that I've listened.", "Mind the heart. It's had enough taken from it."],
};
// After the confession, these join every haul.
export const PUDDOCK_AFTER = ["I sold a piece of her for a shop. You're buying her back, one crystal at a time.",
  "Fair as rain. Trying to be, anyway.", "Your gran would've liked your digging. Hated your haggling."];
export const SPROUT_LINE = "Well. Would you look at that. Green.";

// Geode Gulch, after the receipt turns up.
export const CONFESSION = [
  "Just a chip, I told myself. The heart's as big as a pond.",
  "I watched those leaves glow all autumn and said nothing.",
  "Your gran gave me this the night she went down. I've kept it on that shelf for years, too ashamed to deliver it.",
];
export const LETTER = "If a little one comes asking, Puddock, give them this and tell them the truth. Tell them we followed the light down. Tell them not to follow. They will anyway. —B";

// The roots, when the Rootline closes.
export const MURMURS = ["The roots are reaching for your light.", "They don't mean harm. They're cold.", "Down here, light is food."];

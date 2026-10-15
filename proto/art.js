// Glimmerwood menu art: every picture is inline SVG drawn in code (no image files until the look is approved).
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
let uid = 0;
// shimmer: a light band clipped to the icon's outline, sweeping across on a loop (CSS .shimmer).
// Negative random delays keep a row of gems from flashing in unison.
function shimmer(clipShape) {
  const id = "sh" + uid++, d = (-Math.random() * 3.2).toFixed(2);
  return `<clipPath id="${id}">${clipShape}</clipPath><g clip-path="url(#${id})">
    <polygon class="shimmer" style="animation-delay:${d}s" points="-4,0 2,0 -6,24 -12,24" fill="#fff" opacity=".75"/></g>`;
}
const svg = (size, vb, body, cls = "") => `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;

// Gem cuts. Each: outline (also the shimmer clip) + facet detail drawn from the gem's colour.
const CUTS = {
  brilliant: { o: '<polygon points="4,9 8,4 16,4 20,9 12,21"/>', d: (c, lt, dk) => `
    <polygon points="4,9 8,4 16,4 20,9" fill="${lt}"/><polygon points="4,9 20,9 12,21" fill="${c}"/>
    <polygon points="12,9 20,9 12,21" fill="${dk}" opacity=".55"/>
    <polyline points="8,4 10,9 12,4 14,9 16,4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>` },
  step: { o: '<polygon points="7,3 17,3 21,7 21,17 17,21 7,21 3,17 3,7"/>', d: (c, lt, dk) => `
    <polygon points="7,3 17,3 21,7 21,17 17,21 7,21 3,17 3,7" fill="${c}"/>
    <polygon points="9,7 15,7 17,9 17,15 15,17 9,17 7,15 7,9" fill="${lt}" opacity=".7"/>
    <polygon points="17,3 21,7 21,17 17,21 15,17 17,15 17,9 15,7" fill="${dk}" opacity=".5"/>
    <path d="M7 3 L9 7 M17 3 L15 7 M3 17 L7 15 M21 17 L17 15" stroke="#fff" stroke-opacity=".4" stroke-width=".8"/>` },
  pear: { o: '<path d="M12 2 Q20 11 18.5 16 A6.6 6.6 0 0 1 5.5 16 Q4 11 12 2 Z"/>', d: (c, lt, dk) => `
    <path d="M12 2 Q20 11 18.5 16 A6.6 6.6 0 0 1 5.5 16 Q4 11 12 2 Z" fill="${c}"/>
    <path d="M12 2 Q20 11 18.5 16 A6.6 6.6 0 0 1 12 22 Z" fill="${dk}" opacity=".45"/>
    <path d="M12 8 L8 15 L12 19 L16 15 Z" fill="${lt}" opacity=".6"/>` },
  trillion: { o: '<polygon points="12,3 22,20 2,20"/>', d: (c, lt, dk) => `
    <polygon points="12,3 22,20 2,20" fill="${c}"/><polygon points="12,3 22,20 12,15" fill="${dk}" opacity=".5"/>
    <polygon points="12,9 16,16 8,16" fill="${lt}" opacity=".7"/>` },
  star: { o: '<polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9"/>', d: (c, lt, dk) => `
    <polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="${c}"/>
    <polygon points="12,1 15,9 12,12 9,9" fill="${lt}"/><polygon points="12,12 15,15 12,23 23,12 15,9" fill="${dk}" opacity=".45"/>
    <circle cx="12" cy="12" r="2.2" fill="#fff" opacity=".8"/>` },
  cabochon: { o: '<ellipse cx="12" cy="12" rx="8.5" ry="10.5"/>', d: (c, lt, dk) => `
    <ellipse cx="12" cy="12" rx="8.5" ry="10.5" fill="${c}"/><ellipse cx="13.5" cy="14" rx="6" ry="7.5" fill="${dk}" opacity=".3"/>
    <ellipse cx="9.5" cy="8" rx="3.5" ry="4.5" fill="${lt}" opacity=".85"/>` },
  round: { o: '<circle cx="12" cy="12" r="10"/>', d: (c, lt, dk) => `
    <circle cx="12" cy="12" r="10" fill="${c}"/><polygon points="12,5 17,7 19,12 17,17 12,19 7,17 5,12 7,7" fill="${lt}" opacity=".55"/>
    <path d="M12 2 V5 M19 5 L17 7 M22 12 H19 M19 19 L17 17 M12 22 V19 M5 19 L7 17 M2 12 H5 M5 5 L7 7" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>
    <path d="M12 12 L22 12 A10 10 0 0 1 12 22 Z" fill="${dk}" opacity=".35"/>` },
  prism: { o: '<polygon points="12,1 21,6 21,18 12,23 3,18 3,6"/>', d: (c, lt, dk) => `
    <polygon points="12,1 21,6 21,18 12,23 3,18 3,6" fill="${c}"/><polygon points="12,1 21,6 12,11 3,6" fill="${lt}"/>
    <polygon points="12,11 21,6 21,18 12,23" fill="${dk}" opacity=".45"/><path d="M12 11 V23" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/>` },
  geode: { o: '<polygon points="3,9 7,3 16,2 22,8 21,17 14,22 5,20 2,14"/>', d: (c, lt, dk) => `
    <polygon points="3,9 7,3 16,2 22,8 21,17 14,22 5,20 2,14" fill="#8a8277"/>
    <polygon points="6,10 9,6 15,5 19,9 18,16 13,19 7,17 5,13" fill="${dk}"/>
    <g fill="${c}"><polygon points="8,15 10,9 12,15"/><polygon points="11,16 14,7 16,16"/><polygon points="14,17 17,11 18,16"/><polygon points="7,12 9,8 10,13"/></g>
    <g fill="${lt}" opacity=".8"><polygon points="11,16 14,7 13,16"/><polygon points="8,15 10,9 9.5,15"/></g>` },
  heart: { o: '<path d="M12 21 C3 14 2 9 5 6 C8 3 11 5 12 7 C13 5 16 3 19 6 C22 9 21 14 12 21 Z"/>', d: (c, lt, dk) => `
    <path d="M12 21 C3 14 2 9 5 6 C8 3 11 5 12 7 C13 5 16 3 19 6 C22 9 21 14 12 21 Z" fill="${c}"/>
    <path d="M12 7 C13 5 16 3 19 6 C22 9 21 14 12 21 Z" fill="${dk}" opacity=".4"/>
    <path d="M7 7 Q5 9 6.5 12" stroke="${lt}" stroke-width="2" fill="none" stroke-linecap="round"/>` },
};

export function gem(color, size = 22, glyph = "", cut = "brilliant") {
  const k = CUTS[cut] || CUTS.brilliant, lt = mix(color, "#ffffff", .5), dk = mix(color, "#000000", .3);
  return svg(size, "0 0 24 24", `${k.d(color, lt, dk)}${shimmer(k.o)}
    ${glyph ? `<text x="12" y="15" font-size="6" text-anchor="middle" fill="#1a1a0f" opacity=".6">${glyph}</text>` : ""}`, "gem");
}

export const coin = (size = 18) => svg(size, "0 0 24 24", `
  <circle cx="12" cy="12" r="10" fill="#d99a2b"/><circle cx="12" cy="12" r="8" fill="#f0b543"/>
  <circle cx="12" cy="12" r="5.5" fill="none" stroke="#c6872a" stroke-width="1.2"/>
  <path d="M7 8 Q9 5 13 5" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  ${shimmer('<circle cx="12" cy="12" r="10"/>')}`, "coin");

const ICONS = {
  lantern: `<path d="M9 5 Q12 1 15 5" stroke="#c9b48a" stroke-width="1.5" fill="none"/><rect x="7" y="5" width="10" height="3" rx="1" fill="#6b5a3a"/>
    <circle cx="12" cy="14" r="8" fill="#f0b543" opacity=".25"/><rect x="8" y="8" width="8" height="11" rx="2" fill="#f7d77a" stroke="#6b5a3a" stroke-width="1.5"/>
    <circle cx="12" cy="13.5" r="2.2" fill="#fff6c8"/><rect x="7" y="19" width="10" height="2.5" rx="1" fill="#6b5a3a"/>`,
  pickaxe: `<path d="M6 20 L16 8" stroke="#a0703f" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M7 6 Q14 1 21 7 Q15 5 11 9 Z" fill="#b8c3cc" stroke="#6f7c87" stroke-width="1"/>`,
  charm: `<circle cx="12" cy="13" r="7" fill="none" stroke="#8a5a32" stroke-width="2.5"/><path d="M12 6 Q9 3 12 1 Q15 3 12 6" fill="#7cc46a"/>
    <path d="M12 13 Q8 10 9 7 M12 13 Q16 10 15 7" stroke="#8a5a32" stroke-width="1.5" fill="none"/><circle cx="12" cy="14" r="2.5" fill="#7cc46a"/>`,
  map: `<path d="M3 6 L9 4 L15 6 L21 4 L21 18 L15 20 L9 18 L3 20 Z" fill="#e8d6aa" stroke="#8a6d3b" stroke-width="1.2"/>
    <path d="M9 4 V18 M15 6 V20" stroke="#8a6d3b" stroke-width=".8" opacity=".6"/>
    <path d="M5 16 Q9 9 13 12 T18 8" stroke="#c8553d" stroke-width="1.4" fill="none" stroke-dasharray="2 2"/><path d="M17 6 l2 2 M19 6 l-2 2" stroke="#c8553d" stroke-width="1.5"/>`,
  fireflies: `<g fill="#fff3a0"><circle cx="7" cy="9" r="5" opacity=".18"/><circle cx="7" cy="9" r="2"/><circle cx="17" cy="7" r="4" opacity=".18"/>
    <circle cx="17" cy="7" r="1.6"/><circle cx="13" cy="17" r="5" opacity=".18"/><circle cx="13" cy="17" r="2"/></g>
    <path d="M3 21 Q8 15 12 18 T21 14" stroke="#7cc46a" stroke-width="2" fill="none"/>`,
  dewdrop: `<path d="M12 3 Q19 12 18 15 A6 6 0 0 1 6 15 Q5 12 12 3 Z" fill="#7fd1e8" stroke="#3f8fae" stroke-width="1.2"/>
    <path d="M9 14 Q9 11 11 9" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>`,
  soundOn: `<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor"/><path d="M16 9 Q18 12 16 15 M18.5 7 Q22 12 18.5 17" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  soundOff: `<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor"/><path d="M16 9 L21 15 M21 9 L16 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  vibe: `<rect x="8" y="3" width="8" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <path d="M4 8 L2 10 L4 12 L2 14 L4 16 M20 8 L22 10 L20 12 L22 14 L20 16" stroke="currentColor" stroke-width="1.4" fill="none"/>`,
  symbols: `<circle cx="7" cy="8" r="3" fill="currentColor"/><path d="M17 4 L21 11 H13 Z" fill="currentColor"/><path d="M12 13 L16 17 L12 21 L8 17 Z" fill="currentColor"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="3" fill="#efe6cf"/><rect x="3" y="5" width="18" height="5" rx="2" fill="#c8553d"/>
    <path d="M8 3 V7 M16 3 V7" stroke="#5a4a3a" stroke-width="2" stroke-linecap="round"/><text x="12" y="19" font-size="8" font-weight="700" text-anchor="middle" fill="#2a1d06">✦</text>`,
  vine: `<path d="M4 20 Q4 8 12 8 Q20 8 20 4" stroke="#7cc46a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="7" cy="12" rx="3" ry="1.6" transform="rotate(-50 7 12)" fill="#7cc46a"/><ellipse cx="15" cy="9" rx="3" ry="1.6" transform="rotate(30 15 9)" fill="#5fa04e"/>
    <circle cx="20" cy="4" r="2" fill="#d6453d"/>`,
  leaf: `<path d="M4 20 Q4 6 19 4 Q19 18 4 20 Z" fill="#7cc46a"/><path d="M5 19 Q11 12 16 7" stroke="#2f6b33" stroke-width="1.3" fill="none"/>`,
  lock: `<rect x="5" y="10" width="14" height="11" rx="2.5" fill="#c9b48a"/><path d="M8 10 V7 A4 4 0 0 1 16 7 V10" stroke="#c9b48a" stroke-width="2.4" fill="none"/>
    <circle cx="12" cy="15" r="1.8" fill="#5a4a3a"/>`,
  stall: `<path d="M3 9 L5 4 H19 L21 9 Z" fill="#c8553d"/><path d="M3 9 Q5 11 7 9 Q9 11 11 9 Q13 11 15 9 Q17 11 19 9 Q20 10 21 9" fill="#efe6cf"/>
    <rect x="5" y="11" width="14" height="9" fill="#8a5a32"/><circle cx="10" cy="15" r="2" fill="#f0b543"/><circle cx="14" cy="16" r="1.6" fill="#8fd18b"/>`,
  ad: `<circle cx="12" cy="12" r="10" fill="currentColor" opacity=".25"/><path d="M10 8 L16 12 L10 16 Z" fill="currentColor"/>`,
  board: `<g fill="#8fd18b">${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${3 + c * 6.3}" y="${3 + r * 6.3}" width="5.5" height="5.5" rx="1"/>`)).join("")}</g>`,
  regrow: `<path d="M12 21 V11" stroke="#7cc46a" stroke-width="2.4" stroke-linecap="round"/><path d="M12 13 Q5 12 5 5 Q12 6 12 13 Z" fill="#7cc46a"/>
    <path d="M12 11 Q19 10 19 3 Q12 4 12 11 Z" fill="#9be08a"/>`,
  shatter: `<path d="M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z" fill="#f0b543"/>`,
  tent: `<path d="M12 3 L22 20 H2 Z" fill="#e8d6aa" stroke="#8a6d3b" stroke-width="1.2"/><path d="M12 3 L12 20" stroke="#8a6d3b" stroke-width="1"/><path d="M12 11 L9 20 H15 Z" fill="#5a3b24"/>`,
  banner: `<path d="M5 2 V22" stroke="#8a6d3b" stroke-width="2"/><path d="M6 4 H19 L16 8.5 L19 13 H6 Z" fill="currentColor"/>`,
  mushroom: `<path d="M4 12 Q12 1 20 12 Z" fill="#9b7cf2"/><circle cx="9" cy="8" r="1.4" fill="#fff" opacity=".8"/><circle cx="15" cy="9" r="1.1" fill="#fff" opacity=".8"/><rect x="10" y="12" width="4" height="9" rx="2" fill="#e8dcc8"/>`,
  jar: `<rect x="7" y="7" width="10" height="14" rx="3" fill="#9fd7c8" opacity=".35" stroke="#cfe" stroke-width="1"/><rect x="8" y="4" width="8" height="3" rx="1" fill="#8a6d3b"/><circle cx="11" cy="13" r="1.6" fill="#fff3a0"/><circle cx="14" cy="17" r="1.3" fill="#fff3a0"/>`,
  forge: `<rect x="3" y="9" width="18" height="12" rx="2" fill="#7a746a"/><path d="M8 21 V15 Q12 11 16 15 V21 Z" fill="#ff8a3d"/><rect x="5" y="4" width="4" height="6" fill="#5e5850"/>`,
  cart: `<path d="M3 9 H21 L19 17 H5 Z" fill="#8a5a32"/><circle cx="8" cy="19" r="2.2" fill="#3a2a1a"/><circle cx="16" cy="19" r="2.2" fill="#3a2a1a"/><path d="M3 5 H21 V8 H3 Z" fill="#c8553d"/>`,
  hammock: `<path d="M3 5 V21 M21 5 V21" stroke="#5a3b24" stroke-width="2"/><path d="M3 9 Q12 20 21 9" stroke="#e8d6aa" stroke-width="3" fill="none"/>`,
  lens: `<circle cx="10" cy="10" r="6.5" fill="#bfefff" opacity=".35" stroke="#c9a24a" stroke-width="2.2"/><path d="M15 15 L21 21" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/><path d="M7 8 Q8 6 10 6" stroke="#fff" stroke-width="1.2" fill="none"/>`,
  tongs: `<path d="M6 21 L14 6 M10 21 L16 7" stroke="#6f7c87" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="5" r="3" fill="#ff6a3d"/>`,
  sieve: `<ellipse cx="12" cy="12" rx="9" ry="5" fill="#8a5a32"/><ellipse cx="12" cy="11" rx="7.5" ry="3.6" fill="#c9b48a"/><g fill="#8a5a32"><circle cx="9" cy="11" r=".7"/><circle cx="12" cy="10" r=".7"/><circle cx="15" cy="11" r=".7"/><circle cx="11" cy="12.4" r=".7"/><circle cx="14" cy="12.3" r=".7"/></g><polygon points="18,16 20,19 16,19" fill="#b06ad8"/>`,
  ticket: `<path d="M3 7 H21 V10 A2 2 0 0 0 21 14 V17 H3 V14 A2 2 0 0 0 3 10 Z" fill="#f0b543"/><path d="M8 7 V17" stroke="#8a5a1a" stroke-dasharray="1.5 1.5"/>`,
  campIco: `<path d="M3 20 L10 6 L17 20 Z" fill="#e8d6aa"/><path d="M10 13 L8 20 H12 Z" fill="#5a3b24"/><path d="M16 20 Q18 15 20 20 Z" fill="#ff8a3d"/><path d="M17.5 20 Q18 17 18.5 20 Z" fill="#fff3a0"/>`,
  note: `<path d="M9 18 V5 L19 3 V16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><ellipse cx="7" cy="18" rx="3" ry="2.4" fill="currentColor"/><ellipse cx="17" cy="16" rx="3" ry="2.4" fill="currentColor"/>`,
  back: `<path d="M15 5 L8 12 L15 19" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
};
export const icon = (name, size = 22) => svg(size, "0 0 24 24", ICONS[name]);

// ---------- characters ----------
// Style: soft brown outlines (never black), one cel-shade tone, big glossy eyes with two highlights, gentle idle motion.
const INK = "#3a2418";
const blink = (cx, cy, dur, delay, body) => `<g transform="translate(${cx} ${cy})"><g>
  <animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 .08;1 1" keyTimes="0;.93;.96;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
  ${body}</g></g>`;
const bob = (body, dur = 3.2, amt = 1.4) => `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -${amt};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${body}</g>`;

// Dibble's wardrobe. Every part is swappable; the Market's Wardrobe tab sells the rest.
export const FUR = { cocoa: ["#8a5a44", "#6b4232"], sand: ["#c49a6c", "#a07a50"], slate: ["#7a7584", "#5c5866"], snow: ["#eee6dc", "#cbbfb1"], rosewood: ["#a86a5e", "#87504a"] };
export const LANTERN_GLOW = { amber: "#f0b543", crystal: "#9fe6ff", jar: "#fff3a0", paper: "#ff9a7a" };
export const DEFAULT_LOOK = { fur: "cocoa", hat: "leaf", scarf: "none", lantern: "amber" };

function lanternArt(kind) {
  if (kind === "crystal") return `<polygon points="80,55 86,63 80,73 74,63" fill="#bff0ff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><polygon points="80,55 86,63 80,63" fill="#fff" opacity=".7"/>`;
  if (kind === "jar") return `<rect x="74.5" y="57" width="11" height="14" rx="4" fill="#d9f4ec" fill-opacity=".55" stroke="${INK}" stroke-width="1.6"/><rect x="75.5" y="54.5" width="9" height="3" rx="1" fill="#8a6d3b" stroke="${INK}" stroke-width="1"/>
    <circle cx="78.5" cy="62" r="1.5" fill="#fff3a0"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="82" cy="66.5" r="1.2" fill="#fff3a0"><animate attributeName="opacity" values=".3;1;.3" dur="1.9s" repeatCount="indefinite"/></circle>`;
  if (kind === "paper") return `<ellipse cx="80" cy="63.5" rx="7" ry="8.5" fill="#f08a6a" stroke="${INK}" stroke-width="1.6"/><path d="M73.5 61 H86.5 M73.3 65.5 H86.7" stroke="#c8553d" stroke-width="1"/><rect x="77" y="54" width="6" height="2.5" rx="1" fill="${INK}"/><rect x="77" y="71" width="6" height="2.5" rx="1" fill="${INK}"/>`;
  return `<rect x="74.5" y="56" width="11" height="15" rx="3.5" fill="#f7d77a" stroke="${INK}" stroke-width="1.6"/><rect x="73.5" y="54" width="13" height="3" rx="1.5" fill="#6b5a3a" stroke="${INK}" stroke-width="1"/><circle cx="80" cy="63.5" r="2.6" fill="#fff"/>`;
}
function hatArt(kind, f) {
  switch (kind) {
    case "leaf": return `<path d="M27 27 Q50 9 73 27 Q50 22 27 27 Z" fill="#6aa84f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M52 15 Q57 3 67 5 Q62 13 52 15 Z" fill="#9be08a" stroke="${INK}" stroke-width="1.6"/><path d="M53 14 Q58 9 64 7" stroke="${INK}" stroke-width=".9" fill="none"/>`;
    case "mushroom": return `<path d="M24 28 Q26 6 50 5 Q74 6 76 28 Q50 22 24 28 Z" fill="#d9534f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <g fill="#fff6ea"><ellipse cx="39" cy="15" rx="4" ry="3"/><ellipse cx="57" cy="11" rx="3.4" ry="2.6"/><ellipse cx="66" cy="20" rx="2.6" ry="2"/><ellipse cx="31" cy="23" rx="2.2" ry="1.6"/></g>`;
    case "beanie": return `<path d="M26 30 Q26 10 50 9 Q74 10 74 30 Z" fill="#5f8fd0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="25" y="26" width="50" height="7" rx="3.5" fill="#4a72a8" stroke="${INK}" stroke-width="1.8"/><g stroke="#4a72a8" stroke-width="1.2">${[34, 42, 50, 58, 66].map((x) => `<path d="M${x} 13 V26"/>`).join("")}</g>
      <circle cx="50" cy="8" r="5" fill="#f6ead0" stroke="${INK}" stroke-width="1.6"/>`;
    case "flowers": return [[30, 24, "#ff9db5"], [40, 18, "#fff3a0"], [50, 16, "#ffffff"], [60, 18, "#ff9db5"], [70, 24, "#c9b6ff"]].map(([x, y, c]) =>
      `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3" rx="2.2" ry="3" fill="${c}" stroke="${INK}" stroke-width=".8" transform="rotate(${a})"/>`).join("")}<circle r="1.6" fill="#f0b543"/></g>`).join("") +
      `<path d="M26 27 Q50 15 74 27" stroke="#6aa84f" stroke-width="2" fill="none"/>`;
    case "miner": return `<path d="M25 30 Q25 9 50 8 Q75 9 75 30 Z" fill="#f0c75a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><rect x="21" y="27" width="58" height="6" rx="3" fill="#d9a83a" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="50" cy="17" r="5" fill="#fff6c8" stroke="${INK}" stroke-width="1.6"/><path d="M50 17 L30 -4 L70 -4 Z" fill="#fff6c8" opacity=".18"/>`;
    default: return "";
  }
}
export function dibble(size = 96, look = {}) {
  const L = { ...DEFAULT_LOOK, ...look }, [f, fd] = FUR[L.fur] || FUR.cocoa, lt = mix(f, "#ffffff", .5), id = "dib" + uid++;
  const glow = LANTERN_GLOW[L.lantern] || LANTERN_GLOW.amber;
  const eye = `<ellipse rx="4" ry="4.9" fill="#2a1a12"/><ellipse cy="1.9" rx="3.1" ry="2.3" fill="#6b4a32" opacity=".7"/>
    <circle cx="1.4" cy="-1.9" r="1.7" fill="#fff"/><circle cx="-1.2" cy="2.3" r=".8" fill="#fff" opacity=".9"/>`;
  return svg(size, "0 0 100 100", `
    <defs><radialGradient id="${id}g"><stop offset="0" stop-color="${glow}" stop-opacity=".75"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <clipPath id="${id}b"><ellipse cx="50" cy="78" rx="21" ry="17"/></clipPath><clipPath id="${id}h"><circle cx="50" cy="44" r="26"/></clipPath></defs>
    <circle cx="80" cy="63" r="20" fill="url(#${id}g)"><animate attributeName="r" values="18;21;18" dur="2.6s" repeatCount="indefinite"/></circle>
    ${bob(`
    <ellipse cx="40" cy="94" rx="7.5" ry="4" fill="${fd}" stroke="${INK}" stroke-width="2"/><ellipse cx="60" cy="94" rx="7.5" ry="4" fill="${fd}" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="50" cy="78" rx="21" ry="17" fill="${f}" stroke="${INK}" stroke-width="2.2"/>
    <g clip-path="url(#${id}b)"><ellipse cx="62" cy="86" rx="14" ry="14" fill="${fd}" opacity=".45"/><ellipse cx="50" cy="83" rx="12" ry="10" fill="${lt}"/></g>
    ${L.scarf !== "none" ? `<path d="M31 63 Q50 71 69 63" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M31 63 Q50 71 69 63" stroke="${L.scarf}" stroke-width="6.4" fill="none" stroke-linecap="round"/>
      <path d="M58 67 L62 79 L67 77 L63 66 Z" fill="${L.scarf}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` : ""}
    <ellipse cx="26.5" cy="36" rx="3.2" ry="2.6" fill="${fd}" stroke="${INK}" stroke-width="1.6"/><ellipse cx="73.5" cy="36" rx="3.2" ry="2.6" fill="${fd}" stroke="${INK}" stroke-width="1.6"/>
    <circle cx="50" cy="44" r="26" fill="${f}" stroke="${INK}" stroke-width="2.2"/>
    <g clip-path="url(#${id}h)"><ellipse cx="64" cy="56" rx="20" ry="20" fill="${fd}" opacity=".35"/></g>
    <ellipse cx="50" cy="55.5" rx="9.5" ry="8.5" fill="${lt}"/>
    ${blink(40.5, 43, 4.8, 0, eye)}${blink(59.5, 43, 4.8, 0, eye)}
    <ellipse cx="30.5" cy="53" rx="5" ry="2.8" fill="#ff8fa3" opacity=".5"/><ellipse cx="69.5" cy="53" rx="5" ry="2.8" fill="#ff8fa3" opacity=".5"/>
    <ellipse cx="50" cy="52.6" rx="4.3" ry="3.2" fill="#e8768e" stroke="${INK}" stroke-width="1.2"/><ellipse cx="48.6" cy="51.6" rx="1.3" ry=".8" fill="#fff" opacity=".85"/>
    <path d="M47.5 59.5 Q50 61.6 52.5 59.5" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <g stroke="${INK}" stroke-width=".8" opacity=".5" stroke-linecap="round"><path d="M40 55 L33 53.5 M40 57.5 L33 58"/><path d="M60 55 L67 53.5 M60 57.5 L67 58"/></g>
    <g><animateTransform attributeName="transform" type="rotate" values="-2 50 22;2 50 22;-2 50 22" dur="4s" repeatCount="indefinite"/>${hatArt(L.hat, f)}</g>
    <path d="M24 73 Q24 66 32 66 Q40 66 40 73 Q40 80 32 80 Q24 80 24 73 Z" fill="#f3c1b8" stroke="${INK}" stroke-width="1.8"/><path d="M26.5 79 l-1 3 M30 80 l-.4 3.2 M33.6 80 l.4 3.2 M37 79 l1 3" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M68 72 Q74 64 79 55" stroke="#6b5a3a" stroke-width="1.8" fill="none"/>
    <g><animateTransform attributeName="transform" type="rotate" values="-4 79 54;4 79 54;-4 79 54" dur="3.2s" repeatCount="indefinite"/>${lanternArt(L.lantern)}</g>
    <path d="M60 72 Q60 65 67 65 Q74 65 74 72 Q74 79 67 79 Q60 79 60 72 Z" fill="#f3c1b8" stroke="${INK}" stroke-width="1.8"/><path d="M63 78 l-.6 2.6 M67 79 v2.8 M71 78 l.6 2.6" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`)}
  `, "dibble");
}

// Old Puddock: a wise travelling toad merchant. Straw hat, round spectacles, droopy white brows, patched indigo coat.
export function puddock(size = 64) {
  const g = "#86a64e", gd = "#6a8a3c", lid = (cx) => `<g transform="translate(${cx} 36)"><g>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 3.4;0 0" keyTimes="0;.9;.95;1" dur="5.5s" repeatCount="indefinite"/>
      <path d="M-8 -1 Q0 -9 8 -1 L8 -8 L-8 -8 Z" fill="${g}"/></g></g>`;
  return svg(size, "0 0 100 100", bob(`
    <ellipse cx="50" cy="76" rx="35" ry="22" fill="${g}" stroke="${INK}" stroke-width="2.2"/>
    <path d="M17 76 Q20 58 36 56 L50 70 L64 56 Q80 58 83 76 Q83 96 50 97 Q17 96 17 76 Z" fill="#3e4f7c" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M36 56 L50 70 L64 56" fill="#e9dfb4" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <rect x="22" y="78" width="9" height="8" rx="1.5" fill="#c8553d" stroke="${INK}" stroke-width="1.2" transform="rotate(-8 26 82)"/>
    <rect x="68" y="82" width="8" height="7" rx="1.5" fill="#f0c75a" stroke="${INK}" stroke-width="1.2" transform="rotate(10 72 85)"/>
    <path d="M54 76 Q62 82 70 76" stroke="#f0c75a" stroke-width="1.4" fill="none"/><circle cx="70.5" cy="76" r="2.4" fill="#f0c75a" stroke="${INK}" stroke-width="1"/>
    <circle cx="50" cy="78" r="1.8" fill="#f0c75a" stroke="${INK}" stroke-width=".8"/><circle cx="50" cy="86" r="1.8" fill="#f0c75a" stroke="${INK}" stroke-width=".8"/>
    <ellipse cx="50" cy="46" rx="31" ry="19" fill="${g}" stroke="${INK}" stroke-width="2.2"/>
    <ellipse cx="57" cy="52" rx="20" ry="9" fill="${gd}" opacity=".35"/>
    <circle cx="35" cy="35" r="10" fill="${g}" stroke="${INK}" stroke-width="2.2"/><circle cx="65" cy="35" r="10" fill="${g}" stroke="${INK}" stroke-width="2.2"/>
    <ellipse cx="35" cy="36" rx="6" ry="5" fill="#f6efd4"/><ellipse cx="65" cy="36" rx="6" ry="5" fill="#f6efd4"/>
    <circle cx="36" cy="37" r="3" fill="#2a1a12"/><circle cx="66" cy="37" r="3" fill="#2a1a12"/><circle cx="37" cy="36" r="1" fill="#fff"/><circle cx="67" cy="36" r="1" fill="#fff"/>
    ${lid(35)}${lid(65)}
    <circle cx="35" cy="36" r="7.5" fill="#cfefff" fill-opacity=".12" stroke="#c9a24a" stroke-width="1.6"/><circle cx="65" cy="36" r="7.5" fill="#cfefff" fill-opacity=".12" stroke="#c9a24a" stroke-width="1.6"/>
    <path d="M42.5 36 Q50 33 57.5 36" stroke="#c9a24a" stroke-width="1.4" fill="none"/>
    <path d="M60 31 L63 30" stroke="#fff" stroke-width="1.4" stroke-linecap="round"><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;.8;.85;1" dur="6s" repeatCount="indefinite"/></path>
    <path d="M26 30 Q31 23 40 27 Q35 27 33 31 Q30 34 26 30 Z M74 30 Q69 23 60 27 Q65 27 67 31 Q70 34 74 30 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="1.1"/>
    <path d="M33 54 Q50 62 67 54" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M31 53 Q30 55 32 56 M69 53 Q70 55 68 56" stroke="${INK}" stroke-width="1.2" fill="none"/>
    <ellipse cx="26" cy="50" rx="4.5" ry="2.4" fill="#ff8fa3" opacity=".35"/><ellipse cx="74" cy="50" rx="4.5" ry="2.4" fill="#ff8fa3" opacity=".35"/>
    <g fill="${gd}"><circle cx="44" cy="46" r="1.2"/><circle cx="56" cy="47" r="1"/><circle cx="76" cy="60" r="1.4"/></g>
    <ellipse cx="50" cy="22" rx="33" ry="6.5" fill="#d9b46a" stroke="${INK}" stroke-width="2"/>
    <path d="M35 21 Q36 8 50 7 Q64 8 65 21 Z" fill="#e6c47e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M35.6 18 Q50 22 64.4 18" stroke="#c8553d" stroke-width="3" fill="none"/>
    <g stroke="#b8924a" stroke-width=".8" opacity=".7"><path d="M22 22 L28 24 M72 24 L78 22 M40 10 L44 18 M58 10 L56 18"/></g>
    <ellipse cx="22" cy="78" rx="6" ry="4.5" fill="${g}" stroke="${INK}" stroke-width="1.8"/>`, 3.6, 1.1), "puddock");
}

// cave scene per mine (menu postcards): layered rock, stalactites, rails into the dark, crystal clusters
// with halos, a hanging lantern, and one environment feature per mine with drifting motes.
const motes = (n, col, r, dir, seed) => [...Array(n)].map((_, k) => {
  const x = 20 + ((k * 37 + seed) % 120), d = 3 + (k % 4), b = -((k * 1.3 + seed) % d);
  const [y0, y1] = dir === "down" ? [-4, 96] : [92, 18];
  return `<circle cx="${x}" cy="${y0}" r="${r}" fill="${col}"><animate attributeName="cy" values="${y0};${y1}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
}).join("");
function cluster(x, y, sz, cols, glow) {
  const one = (dx, h, c, tilt) => `<g transform="rotate(${tilt} ${x + dx} ${y})">
    <polygon points="${x + dx},${y} ${x + dx - h * .3},${y - h * .55} ${x + dx},${y - h} ${x + dx + h * .3},${y - h * .55}" fill="${c}"/>
    <polygon points="${x + dx},${y} ${x + dx},${y - h} ${x + dx + h * .3},${y - h * .55}" fill="#000" opacity=".22"/>
    <polygon points="${x + dx - h * .3},${y - h * .55} ${x + dx},${y - h} ${x + dx - h * .08},${y - h * .5}" fill="#fff" opacity=".35"/></g>`;
  return `<circle cx="${x}" cy="${y - sz * .5}" r="${sz * .9}" fill="${glow}" opacity=".18"/>` +
    one(-sz * .35, sz * .7, cols[1 % cols.length], -18) + one(sz * .38, sz * .6, cols[2 % cols.length], 16) + one(0, sz, cols[0], 0);
}
export function scene(colors, pal, w = 160, h = 96) {
  const id = "sc" + uid++, f = pal.feature, dark = mix(pal.bg, "#000000", .35), rock = mix(pal.bg, "#000000", .18);
  const feat = {
    moss: `<g fill="#4f7d3a">${[12, 26, 132, 146].map((x) => `<path d="M${x} 90 q3 -10 6 0 q2 -7 5 0 z"/>`).join("")}</g>
      <path d="M6 96 Q10 74 26 70 Q16 82 18 96 Z M154 96 Q150 76 136 72 Q146 84 142 96 Z" fill="#3f6f34"/>
      ${motes(6, "#c9f5a0", .9, "up", 3)}`,
    lava: `<path d="M30 92 L44 84 L52 88 L66 80 M96 82 L108 88 L118 84 L132 92" stroke="#ff8a3d" stroke-width="1.6" fill="none"/>
      <path d="M30 92 L44 84 L52 88 L66 80 M96 82 L108 88 L118 84 L132 92" stroke="#ffd27a" stroke-width=".6" fill="none"/>
      ${motes(9, "#ffb15a", 1, "up", 7)}`,
    caps: `${[[18, 84, 9], [34, 90, 6], [128, 86, 10], [144, 91, 6]].map(([x, y, r]) => `<rect x="${x - 1.2}" y="${y - r * .2}" width="2.4" height="${r * .9}" fill="#e2d8f0"/>
      <path d="M${x - r} ${y - r * .2} Q${x} ${y - r * 1.4} ${x + r} ${y - r * .2} Z" fill="${pal.glow}"/><circle cx="${x}" cy="${y - r * .6}" r="${r * 1.4}" fill="${pal.glow}" opacity=".18"/>`).join("")}
      ${motes(10, "#d9ccff", .8, "up", 11)}`,
    snow: `<path d="M0 96 V86 Q20 80 40 86 T80 84 T120 86 T160 84 V96 Z" fill="#e6f6ff" opacity=".85"/>
      <path d="M8 60 L14 40 L20 60 Z M140 58 L147 34 L154 58 Z" fill="#20384e"/>
      ${motes(14, "#ffffff", .9, "down", 5)}`,
    geode: `      <circle cx="136" cy="74" r="13" fill="#8a8277"/><circle cx="136" cy="74" r="9.5" fill="#3a2350"/>
      <g fill="${pal.glow}">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<polygon points="136,74 ${136 + 9 * Math.cos((a - 8) * Math.PI / 180)},${74 + 9 * Math.sin((a - 8) * Math.PI / 180)} ${136 + 9 * Math.cos((a + 8) * Math.PI / 180)},${74 + 9 * Math.sin((a + 8) * Math.PI / 180)}" opacity=".85"/>`).join("")}</g>
      ${motes(5, "#e6c8ff", .8, "up", 2)}`,
    heart: `<circle cx="80" cy="44" r="22" fill="${pal.glow}" opacity=".18"><animate attributeName="r" values="18;24;18" dur="2.4s" repeatCount="indefinite"/></circle>
      <path d="M80 58 C66 48 64 40 70 35 C75 31 79 34 80 37 C81 34 85 31 90 35 C96 40 94 48 80 58 Z" fill="${pal.glow}" stroke="#7a2a2a" stroke-width="2"/>
      <path d="M62 30 Q70 40 80 37 Q90 40 98 30 M80 58 Q78 70 70 80 M80 58 Q84 70 92 80" stroke="#6a2a20" stroke-width="2.5" fill="none"/>
      ${motes(8, "#ff9db5", .9, "up", 9)}`,
  }[f] || "";
  return `<svg class="scene" width="${w}" height="${h}" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><radialGradient id="${id}g" cx=".5" cy=".75" r=".6"><stop offset="0" stop-color="${pal.glow}" stop-opacity=".45"/><stop offset="1" stop-color="${pal.glow}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
    <rect width="160" height="96" fill="${pal.bg}"/>
    <path d="M0 0 H160 V40 L150 44 L138 36 L126 46 L112 38 L100 44 L86 34 L72 42 L58 36 L44 46 L30 38 L16 44 L0 38 Z" fill="${rock}"/>
    ${f === "geode" ? `<g stroke="${mix(pal.bg, "#ffffff", .12)}" stroke-width="1" fill="none" opacity=".6"><path d="M0 34 Q40 30 80 36 T160 32"/><path d="M0 46 Q50 42 90 48 T160 44"/></g>` : ""}
    <rect width="160" height="96" fill="url(#${id}g)"/>
    <path d="M18 96 Q16 30 80 22 Q144 30 142 96 Z" fill="${pal.cave}"/>
    <path d="M18 96 Q16 30 80 22 Q144 30 142 96" fill="none" stroke="${dark}" stroke-width="4"/>
    <g fill="${f === "snow" ? "#cfefff" : dark}">${[[40, 30, 10], [56, 25, 14], [74, 23, 9], [92, 24, 16], [110, 28, 10], [124, 34, 8]].map(([x, y, hh]) => `<polygon points="${x - 3},${y} ${x + 3},${y} ${x},${y + hh}"/>`).join("")}</g>
    <path d="M30 40 Q34 54 28 66 M48 30 Q52 42 46 50 M112 30 Q108 44 114 54 M128 40 Q124 52 130 62" stroke="${pal.root}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g stroke="#3a2a1a" stroke-width="1.6"><path d="M64 96 L76 58 M96 96 L84 58"/></g>
    <g stroke="#3a2a1a" stroke-width="1.4">${[90, 82, 75, 69, 64].map((y, k) => `<path d="M${66 + k * 2.4} ${y} H${94 - k * 2.4}"/>`).join("")}</g>
    ${cluster(38, 92, 22, colors, pal.glow)}${cluster(122, 92, 20, colors.slice(1).concat(colors[0]), pal.glow)}${cluster(80, 60, 12, colors.slice(2).concat(colors), pal.glow)}
    <path d="M22 26 V34" stroke="#5a4a3a" stroke-width="1.2"/><rect x="18.5" y="34" width="7" height="9" rx="2" fill="#f7d77a"/><circle cx="22" cy="38.5" r="9" fill="#f0b543" opacity=".22"/>
    <ellipse cx="80" cy="98" rx="70" ry="9" fill="${pal.ground}"/>
    <g fill="${mix(pal.ground, "#ffffff", .15)}"><ellipse cx="52" cy="93" rx="3" ry="1.6"/><ellipse cx="108" cy="94" rx="2.5" ry="1.3"/><ellipse cx="96" cy="92" rx="1.6" ry="1"/></g>
    ${feat}
    <rect width="160" height="96" fill="url(#${id}v)"/>
  </svg>`;
}

// teaser: a cave not yet found
export function mystery(w = 160, h = 96) {
  return `<svg class="scene" width="${w}" height="${h}" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="160" height="96" fill="#141a16"/>
    <path d="M18 96 Q16 30 80 22 Q144 30 142 96 Z" fill="#070a08"/>
    ${[0, 1, 2].map((k) => `<ellipse cx="${40 + k * 40}" cy="${70 - k * 6}" rx="46" ry="10" fill="#cfd8c8" opacity=".07"><animate attributeName="cx" values="${30 + k * 40};${54 + k * 40};${30 + k * 40}" dur="${7 + k * 2}s" repeatCount="indefinite"/></ellipse>`).join("")}
    <text x="80" y="66" font-size="40" font-weight="700" text-anchor="middle" fill="#ffd27a" opacity=".85" font-family="Fredoka, sans-serif">?<animate attributeName="opacity" values=".5;.95;.5" dur="2.6s" repeatCount="indefinite"/></text>
  </svg>`;
}

// Dibble's Camp: a living night clearing. Every Market purchase shows up here, and most things react to a tap
// (elements with data-tap). Groups with data-depth drift for parallax (index.html moves them).
// st = { lantern, pick, charm, lens, tongs, sieve, mines:[colour], found:[{color,cut}|null], tent, banner, fire,
//        decor:{mushrooms,jars,hammock,cart,flies}, puddockSvg }
export function camp(st, gemFn, dibbleSvg) {
  const W = 400, H = 300, n = Math.min(st.lantern, 15), strip = (svgStr) => svgStr.replace(/^<svg[^>]*>|<\/svg>$/g, "");
  const sagX = (t) => 46 + t * 308, sagY = (t) => 74 + Math.sin(t * Math.PI) * 30;
  const lanterns = [...Array(15)].map((_, k) => {
    const t = (k + .5) / 15, x = sagX(t), y = sagY(t), lit = k < n, sw = 2 + (k % 3);
    return `<g data-tap="lanterns"><animateTransform attributeName="transform" type="rotate" values="-${sw} ${x} ${y};${sw} ${x} ${y};-${sw} ${x} ${y}" dur="${2.6 + (k % 4) * .4}s" repeatCount="indefinite"/>
      <path d="M${x} ${y} v5" stroke="#5a4a3a" stroke-width="1"/>${lit ? `<circle cx="${x}" cy="${y + 11}" r="11" fill="#f0b543" opacity=".22"><animate attributeName="opacity" values=".16;.28;.16" dur="${1.8 + k % 3 * .5}s" repeatCount="indefinite"/></circle>` : ""}
      <rect x="${x - 3.6}" y="${y + 5}" width="7.2" height="9" rx="2.4" fill="${lit ? "#f7d77a" : "#3a3328"}" stroke="#3a2418" stroke-width=".9"/></g>`;
  }).join("");
  const tier = (lv) => ["#9aa3ab", "#c6ccd2", "#f0c75a", "#9fe6ff"][Math.min(3, Math.floor(lv / 5))];
  const picks = [...Array(5)].map((_, k) => { const on = k < Math.ceil(st.pick / 3), x = 318 + k * 12;
    return on ? `<path d="M${x} 232 L${x} 194" stroke="#8a5a32" stroke-width="2.6"/><path d="M${x - 8} 196 Q${x} 187 ${x + 8} 196 Q${x} 193 ${x - 8} 196 Z" fill="${tier(st.pick)}" stroke="#3a2418" stroke-width=".8"/>`
      : `<path d="M${x} 232 L${x} 206" stroke="#3a2a1a" stroke-width="1" stroke-dasharray="2 2"/>`; }).join("");
  const c = Math.min(st.charm, 15), trunk = 16 + c * 4.5, crown = 10 + c * 2.4, tx = 218, ty = 196;
  const tree = `${c >= 15 ? `<circle cx="${tx}" cy="${ty - trunk - crown * .4}" r="${crown + 16}" fill="#9be08a" opacity=".18"><animate attributeName="opacity" values=".1;.3;.1" dur="3s" repeatCount="indefinite"/></circle>` : ""}
    <path d="M${tx} ${ty} V${ty - trunk}" stroke="#6b4a2a" stroke-width="${3 + c * .4}" stroke-linecap="round"/>
    <g><animateTransform attributeName="transform" type="rotate" values="-1.5 ${tx} ${ty - trunk};1.5 ${tx} ${ty - trunk};-1.5 ${tx} ${ty - trunk}" dur="5s" repeatCount="indefinite"/>
    <circle cx="${tx}" cy="${ty - trunk - crown * .3}" r="${crown}" fill="#5fa04e" stroke="#2f5a2a" stroke-width="1.5"/><circle cx="${tx - crown * .45}" cy="${ty - trunk}" r="${crown * .6}" fill="#7cc46a"/>
    <circle cx="${tx + crown * .5}" cy="${ty - trunk - crown * .1}" r="${crown * .55}" fill="#4f8a3e"/></g>`;
  const tents = {
    canvas: `<path d="M44 236 L88 156 L132 236 Z" fill="#e8d6aa" stroke="#3a2418" stroke-width="2.2" stroke-linejoin="round"/><path d="M88 156 L88 236" stroke="#8a6d3b"/><path d="M88 186 L74 236 H102 Z" fill="#2a1d12"/>`,
    patchwork: `<path d="M44 236 L88 156 L132 236 Z" fill="#e8d6aa" stroke="#3a2418" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M64 206 L78 182 L84 206 Z" fill="#c8553d"/><path d="M98 196 L110 214 L96 218 Z" fill="#35b38a"/><path d="M54 228 L66 216 L70 230 Z" fill="#9b7cf2"/><path d="M110 224 L122 230 L108 232 Z" fill="#f0b543"/>
      <path d="M88 156 L88 236" stroke="#8a6d3b"/><path d="M88 186 L74 236 H102 Z" fill="#2a1d12"/>`,
    treehouse: `<rect x="80" y="140" width="15" height="96" fill="#6b4a2a" stroke="#3a2418" stroke-width="1.5"/><rect x="50" y="140" width="76" height="7" fill="#8a5a32" stroke="#3a2418" stroke-width="1.2"/>
      <rect x="58" y="110" width="58" height="30" fill="#a0703f" stroke="#3a2418" stroke-width="2"/><path d="M52 112 L87 86 L122 112 Z" fill="#c8553d" stroke="#3a2418" stroke-width="2" stroke-linejoin="round"/>
      <rect x="78" y="118" width="11" height="22" fill="#2a1d12"/><rect x="98" y="118" width="10" height="10" fill="#f7d77a"><animate attributeName="opacity" values=".8;1;.8" dur="2.4s" repeatCount="indefinite"/></rect>
      <path d="M66 147 V236 M72 156 H60 M72 172 H60 M72 188 H60 M72 204 H60 M72 220 H60" stroke="#8a5a32" stroke-width="1.8"/>`,
    pavilion: `<path d="M48 236 V178 M128 236 V178" stroke="#c9b48a" stroke-width="4.5"/><path d="M38 180 L88 140 L138 180 Z" fill="#9fe6ff" opacity=".85" stroke="#3a2418" stroke-width="1.5"/>
      <path d="M38 180 L88 140 L88 180 Z" fill="#ffffff" opacity=".35"/><path d="M54 180 L88 154 L122 180" stroke="#f0b543" stroke-width="1.6" fill="none"/>
      <circle cx="88" cy="196" r="20" fill="#9fe6ff" opacity=".15"><animate attributeName="opacity" values=".08;.22;.08" dur="3s" repeatCount="indefinite"/></circle><rect x="70" y="218" width="36" height="18" rx="3" fill="#5a3b24"/>`,
  }[st.tent] || "";
  const flame = (x, y, h, col, dur) => `<path fill="${col}" d="M${x - h * .32} ${y} Q${x} ${y - h * 1.15} ${x + h * .32} ${y} Z">
    <animate attributeName="d" values="M${x - h * .32} ${y} Q${x} ${y - h * 1.15} ${x + h * .32} ${y} Z;M${x - h * .3} ${y} Q${x - 2} ${y - h * 1.3} ${x + h * .3} ${y} Z;M${x - h * .33} ${y} Q${x + 2} ${y - h} ${x + h * .33} ${y} Z;M${x - h * .32} ${y} Q${x} ${y - h * 1.15} ${x + h * .32} ${y} Z" dur="${dur}s" repeatCount="indefinite"/></path>`;
  const sparks = [...Array(7)].map((_, k) => `<circle cx="${178 + (k % 4) * 4}" cy="250" r="1.2" fill="#ffd27a"><animate attributeName="cy" values="246;196" dur="${1.6 + k * .23}s" begin="${-k * .4}s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="${178 + (k % 4) * 4};${170 + (k * 7) % 22}" dur="${1.6 + k * .23}s" begin="${-k * .4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${1.6 + k * .23}s" begin="${-k * .4}s" repeatCount="indefinite"/></circle>`).join("");
  const fire = st.fire === "forge"
    ? `<g data-tap="fire"><rect x="160" y="230" width="44" height="26" rx="5" fill="#7a746a" stroke="#3a2418" stroke-width="1.6"/><path d="M169 256 V244 Q182 232 195 244 V256 Z" fill="#ff8a3d"><animate attributeName="fill" values="#ff8a3d;#ffb15a;#ff8a3d" dur="1.2s" repeatCount="indefinite"/></path><rect x="192" y="210" width="8" height="22" fill="#5e5850" stroke="#3a2418" stroke-width="1.2"/>${sparks}</g>`
    : `<g data-tap="fire"><g fill="#6f6a60" stroke="#3a2418" stroke-width=".8">${[0, 1, 2, 3, 4, 5].map((k) => `<ellipse cx="${167 + k * 6}" cy="${254 + (k % 2)}" rx="5" ry="3"/>`).join("")}</g>
      <path d="M170 252 L196 244 M170 244 L196 252" stroke="#6b4a2a" stroke-width="3.5" stroke-linecap="round"/>
      ${flame(183, 250, 26, "#ff7a3d", .9)}${flame(183, 250, 17, "#ffb15a", .7)}${flame(183, 250, 9, "#fff3a0", .55)}${sparks}
      <path d="M183 214 Q178 196 186 180 Q192 166 184 150" stroke="#cfd6cc" stroke-width="4" fill="none" opacity=".08"><animate attributeName="opacity" values=".05;.12;.05" dur="4s" repeatCount="indefinite"/></path></g>`;
  const shelf = `<rect x="252" y="128" width="128" height="5" fill="#8a5a32" stroke="#3a2418" stroke-width=".8"/><rect x="252" y="158" width="128" height="5" fill="#8a5a32" stroke="#3a2418" stroke-width=".8"/>
    <path d="M254 128 V166 M378 128 V166" stroke="#5a3b24" stroke-width="2.4"/>
    ${st.found.map((g, k) => { const x = 257 + (k % 6) * 20.5, y = k < 6 ? 108 : 138;
      return `<g data-tap="gem-${k}"><rect x="${x - 1}" y="${y - 1}" width="20" height="21" fill="transparent"/><svg x="${x}" y="${y}" width="18" height="18" viewBox="0 0 24 24">${g ? strip(gemFn(g.color, 24, "", g.cut)) : `<circle cx="12" cy="13" r="6" fill="#000" opacity=".3"/><text x="12" y="16" font-size="9" text-anchor="middle" fill="#8a7a5a">?</text>`}</svg></g>`; }).join("")}`;
  const sign = `<path d="M26 262 V172" stroke="#6b4a2a" stroke-width="4.5"/>${st.mines.map((col, k) => {
    const y = 176 + k * 12, right = k % 2 === 0;
    return `<path d="${right ? `M26 ${y} H56 L62 ${y + 5} L56 ${y + 10} H26 Z` : `M26 ${y} H-2 L-8 ${y + 5} L-2 ${y + 10} H26 Z`}" fill="#a0703f" stroke="#3a2418" stroke-width="1"/><circle cx="${right ? 46 : 6}" cy="${y + 5}" r="2.8" fill="${col}"/>`; }).join("")}`;
  const flag = `<path fill="${st.banner}" stroke="#3a2418" stroke-width="1.2" d="M141 152 Q156 148 170 153 L163 163 L170 173 Q156 168 141 172 Z">
    <animate attributeName="d" values="M141 152 Q156 148 170 153 L163 163 L170 173 Q156 168 141 172 Z;M141 152 Q156 157 170 151 L163 162 L170 171 Q156 177 141 172 Z;M141 152 Q156 148 170 153 L163 163 L170 173 Q156 168 141 172 Z" dur="2.8s" repeatCount="indefinite"/></path>`;
  const d = st.decor, flies = [...Array(d.flies ? 12 : 5)].map((_, k) => `<circle r="1.7" fill="#fff3a0"><animateMotion dur="${9 + k * 1.7}s" begin="${-k * 1.3}s" repeatCount="indefinite" path="M${40 + k * 30} ${120 + (k % 3) * 30} q30 -20 60 0 t60 0 q-30 25 -60 0 t-60 0"/>
    <animate attributeName="opacity" values="0;1;0" dur="${2 + k % 3}s" begin="${-k * .4}s" repeatCount="indefinite"/></circle>`).join("");
  const stars = [[30, 18], [90, 34], [170, 14], [250, 28], [340, 16], [210, 44], [130, 52], [300, 54], [380, 40], [60, 58]].map(([x, y], k) =>
    `<circle cx="${x}" cy="${y}" r="${k % 3 ? .9 : 1.3}" fill="#fff"><animate attributeName="opacity" values=".2;1;.2" dur="${2.5 + k % 4}s" begin="${-k * .6}s" repeatCount="indefinite"/></circle>`).join("");
  const pine = (x, y, h, col) => `<path d="M${x} ${y - h} L${x - h * .3} ${y - h * .45} L${x - h * .18} ${y - h * .45} L${x - h * .36} ${y} L${x + h * .36} ${y} L${x + h * .18} ${y - h * .45} L${x + h * .3} ${y - h * .45} Z" fill="${col}"/>`;
  return `<svg class="campArt" viewBox="0 0 ${W} ${H}" width="100%" aria-label="Dibble's camp">
    <defs><linearGradient id="campSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1510"/><stop offset=".6" stop-color="#173022"/><stop offset="1" stop-color="#1d3b2a"/></linearGradient>
      <radialGradient id="fireLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb15a" stop-opacity=".42"/><stop offset=".5" stop-color="#ff8a3d" stop-opacity=".12"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
      <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#campSky)"/>
    <g data-depth=".15">${stars}<circle cx="320" cy="46" r="34" fill="url(#moonGlow)"/><circle cx="320" cy="46" r="13" fill="#fff6d8"/><circle cx="315" cy="43" r="3" fill="#e8dcb8" opacity=".6"/><circle cx="325" cy="51" r="2" fill="#e8dcb8" opacity=".6"/>
      <ellipse cx="120" cy="70" rx="60" ry="7" fill="#cfd8c8" opacity=".06"><animate attributeName="cx" values="80;200;80" dur="40s" repeatCount="indefinite"/></ellipse></g>
    <g data-depth=".3">${[10, 60, 300, 350, 395].map((x, k) => pine(x, 172, 110 + (k % 3) * 18, "#10261a")).join("")}</g>
    <g data-depth=".5">${pine(18, 190, 150, "#173322")}${pine(380, 190, 160, "#173322")}${pine(46, 186, 96, "#1b3a26")}${pine(352, 186, 100, "#1b3a26")}
      <path d="M${sagX(0)} ${sagY(0)} ${[...Array(29)].map((_, k) => `L${sagX((k + 1) / 29)} ${sagY((k + 1) / 29)}`).join(" ")}" stroke="#5a4a3a" stroke-width="1.3" fill="none"/>${lanterns}</g>
    <g data-depth=".75">
      <path d="M0 192 Q200 160 400 192 V${H} H0 Z" fill="#244a2e"/><ellipse cx="200" cy="252" rx="190" ry="40" fill="#2f5a36"/>
      <ellipse cx="183" cy="246" rx="120" ry="58" fill="url(#fireLight)"><animate attributeName="rx" values="112;128;116;112" dur="1.3s" repeatCount="indefinite"/></ellipse>
      ${tree}${shelf}<g data-tap="tent">${tents}</g>
      <path d="M140 262 V150" stroke="#6b4a2a" stroke-width="2.6"/>${flag}
      ${d.hammock ? `<path d="M380 168 V262 M300 186 V262" stroke="#5a3b24" stroke-width="3.2"/><path d="M300 194 Q340 226 380 176" stroke="#e8d6aa" stroke-width="5.5" fill="none"/>` : ""}
      <rect x="306" y="230" width="76" height="7" rx="2" fill="#5a3b24" stroke="#3a2418" stroke-width="1"/><path d="M310 237 L303 256 M378 237 L385 256" stroke="#5a3b24" stroke-width="3"/>${picks}
      ${st.lens ? `<g transform="translate(330 214) scale(.9)">${ICONS.lens}</g>` : ""}${st.tongs ? `<g transform="translate(352 212) scale(.9)">${ICONS.tongs}</g>` : ""}${st.sieve ? `<g transform="translate(98 156) scale(.9)">${ICONS.sieve}</g>` : ""}
      ${fire}${sign}
      ${d.mushrooms ? [[106, 268, 8], [120, 273, 6], [94, 276, 5]].map(([x, y, r]) => `<rect x="${x - 1.2}" y="${y - 2}" width="2.4" height="${r}" fill="#e2d8f0"/><path d="M${x - r} ${y - 1} Q${x} ${y - r * 1.6} ${x + r} ${y - 1} Z" fill="#9b7cf2" stroke="#3a2418" stroke-width=".8"/>
        <circle cx="${x}" cy="${y - r * .6}" r="${r * 1.6}" fill="#9b7cf2" opacity=".2"><animate attributeName="opacity" values=".1;.3;.1" dur="${2.4 + r * .1}s" repeatCount="indefinite"/></circle>`).join("") : ""}
      ${d.jars ? `<rect x="238" y="246" width="26" height="12" rx="3" fill="#6b4a2a"/><g transform="translate(236 222) scale(1)">${ICONS.jar}</g><g transform="translate(252 226) scale(.8)">${ICONS.jar}</g>` : ""}
      ${d.cart ? `<g transform="translate(270 240) scale(1.8)">${ICONS.cart}</g>${st.puddockSvg ? `<g data-tap="puddock"><svg x="252" y="208" width="42" height="42" viewBox="0 0 100 100">${strip(st.puddockSvg)}</svg></g>` : ""}` : ""}
      <g data-tap="dibble" class="campDibble"><svg x="194" y="208" width="54" height="54" viewBox="0 0 100 100">${strip(dibbleSvg)}</svg></g>
      ${flies}
    </g>
    <g data-depth="1.1" fill="#07130c"><path d="M-10 300 Q8 238 46 222 Q26 260 34 300 Z M-10 280 Q30 246 76 254 Q40 270 30 300 Z"/><path d="M410 300 Q392 236 352 222 Q374 260 366 300 Z M410 272 Q370 246 326 254 Q362 270 372 300 Z"/></g>
  </svg>`;
}

// the world behind the menus: layered forest, the mine entrance Dibble works from, ferns in front
export function forest() {
  const pines = (y, n, hgt, col, seed) => {
    let out = "", r = seed;
    for (let k = 0; k < n; k++) {
      r = (r * 16807) % 2147483647;
      const x = (k + .5) * (420 / n) - 10 + (r % 20) - 10, h = hgt * (.75 + (r % 100) / 300);
      out += `<polygon points="${x},${y - h} ${x - h * .28},${y} ${x + h * .28},${y}" fill="${col}"/>`;
    }
    return out;
  };
  return `<svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><radialGradient id="mineGlow"><stop offset="0" stop-color="#f0b543" stop-opacity=".55"/><stop offset="1" stop-color="#f0b543" stop-opacity="0"/></radialGradient></defs>
    ${pines(560, 14, 190, "#173322", 11)}
    ${pines(640, 10, 260, "#11281b", 29)}
    <path d="M0 640 Q100 600 200 620 T400 610 V800 H0 Z" fill="#0d1f15"/>
    <circle cx="200" cy="720" r="120" fill="url(#mineGlow)"/>
    <path d="M140 800 V720 Q140 660 200 655 Q260 660 260 720 V800 Z" fill="#070d09"/>
    <path d="M132 800 V716 Q132 650 200 645 Q268 650 268 716 V800" fill="none" stroke="#5a3b24" stroke-width="12"/>
    <path d="M126 700 H274" stroke="#4a2f1c" stroke-width="10"/>
    <path d="M170 800 L188 730 M230 800 L212 730" stroke="#3b2a1a" stroke-width="4"/>
    <path d="M178 770 H222 M183 750 H217" stroke="#3b2a1a" stroke-width="3"/>
    <path d="M285 700 L285 660" stroke="#5a4a3a" stroke-width="2"/><rect x="278" y="660" width="14" height="18" rx="3" fill="#f7d77a"/>
    <circle cx="285" cy="669" r="22" fill="#f0b543" opacity=".18"/>
    <path d="M0 800 Q20 720 60 700 Q40 740 50 800 Z M0 760 Q40 720 90 730 Q50 750 40 800 Z" fill="#06100a"/>
    <path d="M400 800 Q380 710 330 695 Q360 740 350 800 Z M400 750 Q350 720 310 735 Q350 755 360 800 Z" fill="#06100a"/>
  </svg>`;
}

// a strip of vine with leaves, to trim the top edge of signboards
export function vine(w = 360) {
  let leaves = "";
  for (let x = 10, k = 0; x < w - 6; x += 22, k++) {
    const y = 8 + Math.sin(x / 30) * 3, up = k % 2;
    leaves += `<ellipse cx="${x}" cy="${y + (up ? -5 : 5)}" rx="6" ry="2.8" transform="rotate(${up ? -30 : 30} ${x} ${y + (up ? -5 : 5)})" fill="${k % 3 ? "#7cc46a" : "#5fa04e"}"/>`;
  }
  let d = `M0 8`; for (let x = 0; x <= w; x += 10) d += ` L${x} ${8 + Math.sin(x / 30) * 3}`;
  return `<svg class="vineTrim" width="100%" height="20" viewBox="0 0 ${w} 20" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" stroke="#4f7d3a" stroke-width="3" fill="none"/>${leaves}</svg>`;
}

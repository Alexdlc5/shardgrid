// Glimmerwood menu art: every picture is inline SVG drawn in code (no image files until the look is approved).
import { dibbleBody, puddockBody, rng, curve, ring, shape, stroke, limb, shard, shardCluster } from "./paint.js";
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
  const k = CUTS[cut] || CUTS.brilliant, lt = mix(color, "#ffffff", .5), dk = mix(color, "#000000", .3), gid = "gm" + uid++;
  // body gets a light-to-dark gradient, a crisp darker outline and one star glint: reads as a cut stone, not a sticker
  return svg(size, "0 0 24 24", `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(color, "#ffffff", .35)}"/>
      <stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${mix(color, "#000000", .25)}"/></linearGradient></defs>
    ${k.d(`url(#${gid})`, lt, dk)}
    <g fill="none" stroke="${mix(color, "#1a0f08", .55)}" stroke-width=".9" stroke-linejoin="round">${k.o}</g>
    ${shimmer(k.o)}
    <path d="M7.4 5.2 l.55 1.5 l1.5 .55 l-1.5 .55 l-.55 1.5 l-.55 -1.5 l-1.5 -.55 l1.5 -.55 Z" fill="#fff" opacity=".95"/>
    ${glyph ? `<text x="12" y="15" font-size="6" text-anchor="middle" fill="#1a1a0f" opacity=".6">${glyph}</text>` : ""}`, "gem");
}

export const coin = (size = 18) => { const cid = "cn" + uid++; return svg(size, "0 0 24 24", `
  <defs><radialGradient id="${cid}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#f0b543"/><stop offset="1" stop-color="#b8771f"/></radialGradient></defs>
  <circle cx="12" cy="12" r="10.2" fill="#a8681a"/><circle cx="12" cy="12" r="9.4" fill="url(#${cid})" stroke="#8a5512" stroke-width=".8"/>
  <g stroke="#c98a26" stroke-width=".7">${[...Array(16)].map((_, k) => { const a = k / 16 * Math.PI * 2; return `<path d="M${12 + Math.cos(a) * 8.2} ${12 + Math.sin(a) * 8.2} L${12 + Math.cos(a) * 9.2} ${12 + Math.sin(a) * 9.2}"/>`; }).join("")}</g>
  <circle cx="12" cy="12" r="5.6" fill="none" stroke="#b8771f" stroke-width="1.1"/><path d="M12 8.6 L13 11 L15.4 12 L13 13 L12 15.4 L11 13 L8.6 12 L11 11 Z" fill="#fff4c8" stroke="#b8771f" stroke-width=".5"/>
  <path d="M6.4 8 Q8.4 5 12.4 4.6" stroke="#fff" stroke-opacity=".75" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  ${shimmer('<circle cx="12" cy="12" r="10"/>')}`, "coin"); };

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
// Painting rules for characters: light from the top-left, a warm rim light from the lantern on the right,
// gradient form shading + one crisp cel shadow, outlines tinted from each part's own colour (thick outside, thin inside).
const line = (c) => mix(c, "#1a0f08", .62);
const shade = (c, k = .28) => mix(c, "#000000", k), lite = (c, k = .3) => mix(c, "#ffffff", k);
const radial = (id, c, cx = .36, cy = .3) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".78"><stop offset="0" stop-color="${lite(c, .32)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, .3)}"/></radialGradient>`;
const linear = (id, c, angle = 90) => `<linearGradient id="${id}" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${lite(c, .25)}"/><stop offset="1" stop-color="${shade(c, .22)}"/></linearGradient>`;
const blink = (cx, cy, dur, delay, body) => `<g transform="translate(${cx} ${cy})"><g>
  <animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 .08;1 1" keyTimes="0;.93;.96;1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
  ${body}</g></g>`;
const bob = (body, dur = 3.2, amt = 1.4) => `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -${amt};0 0" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>${body}</g>`;

// Dibble's wardrobe. Every part is swappable; the Market's Wardrobe tab sells the rest.
export const FUR = { cocoa: ["#8a5a44", "#6b4232"], sand: ["#c49a6c", "#a07a50"], slate: ["#7a7584", "#5c5866"], snow: ["#eee6dc", "#cbbfb1"], rosewood: ["#a86a5e", "#87504a"] };
export const LANTERN_GLOW = { amber: "#f0b543", crystal: "#9fe6ff", jar: "#fff3a0", paper: "#ff9a7a" };
export const DEFAULT_LOOK = { fur: "cocoa", hat: "leaf", scarf: "none", lantern: "amber" };

function lanternArt(kind, id) {
  const metal = "#5b4630", ml = line(metal);
  const frame = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.6" fill="url(#${id}m)" stroke="${ml}" stroke-width="1.1"/>`;
  const defs = `<linearGradient id="${id}m" x1="0" x2="1"><stop offset="0" stop-color="#8a6d48"/><stop offset=".45" stop-color="#c8a46a"/><stop offset="1" stop-color="#4a3824"/></linearGradient>`;
  if (kind === "crystal") return `<defs>${defs}<linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#bff0ff"/><stop offset="1" stop-color="#5fb8d8"/></linearGradient></defs>
    ${frame(77, 53, 6, 2.6)}<polygon points="80,55.5 86.2,63.5 80,73.5 73.8,63.5" fill="url(#${id}c)" stroke="#2f6f8a" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M80 55.5 V73.5 M73.8 63.5 H86.2" stroke="#ffffff" stroke-opacity=".5" stroke-width=".7" fill="none"/><polygon points="80,56.5 84,63 80,63" fill="#fff" opacity=".75"/>`;
  if (kind === "jar") return `<defs>${defs}<radialGradient id="${id}j"><stop offset="0" stop-color="#fffbe0" stop-opacity=".9"/><stop offset="1" stop-color="#bfe8dc" stop-opacity=".35"/></radialGradient></defs>
    <rect x="74.5" y="57" width="11" height="14.5" rx="4" fill="url(#${id}j)" stroke="#4f7d70" stroke-width="1.2"/>${frame(75.3, 54.3, 9.4, 3.2)}
    <path d="M76.6 59 Q76 64 77 69" stroke="#fff" stroke-width=".9" opacity=".7" fill="none" stroke-linecap="round"/>
    <circle cx="79" cy="62.5" r="1.4" fill="#fff6a0"><animate attributeName="opacity" values="1;.25;1" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="82.4" cy="67" r="1.1" fill="#fff6a0"><animate attributeName="opacity" values=".3;1;.3" dur="1.9s" repeatCount="indefinite"/></circle>`;
  if (kind === "paper") return `<defs>${defs}<radialGradient id="${id}p" cx=".45" cy=".45"><stop offset="0" stop-color="#ffd2b8"/><stop offset=".6" stop-color="#f08a6a"/><stop offset="1" stop-color="#b8503a"/></radialGradient></defs>
    <ellipse cx="80" cy="63.5" rx="7.2" ry="8.6" fill="url(#${id}p)" stroke="#8a3424" stroke-width="1.2"/><path d="M73.4 60.6 Q80 59 86.6 60.6 M73 64.6 Q80 63.4 87 64.6 M73.6 68.4 Q80 67.4 86.4 68.4" stroke="#a8432f" stroke-width=".7" fill="none" opacity=".7"/>
    ${frame(76.8, 53.6, 6.4, 2.6)}${frame(76.8, 71.4, 6.4, 2.6)}<ellipse cx="77.6" cy="60.6" rx="1.8" ry="2.6" fill="#fff" opacity=".35"/>`;
  return `<defs>${defs}<radialGradient id="${id}a"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#f7d77a"/><stop offset="1" stop-color="#d99a2b"/></radialGradient></defs>
    <rect x="75" y="56.5" width="10" height="14.5" rx="3" fill="url(#${id}a)" stroke="${ml}" stroke-width="1.2"/>${frame(73.6, 54, 12.8, 3)}${frame(74.2, 70.4, 11.6, 2.4)}
    <path d="M77.6 57 V70.4 M82.4 57 V70.4" stroke="${ml}" stroke-width=".8" opacity=".7"/><circle cx="80" cy="63.6" r="2.2" fill="#fff"/><path d="M76.4 59 V64" stroke="#fff" stroke-width=".9" opacity=".7" stroke-linecap="round"/>`;
}
function hatArt(kind, id) {
  const H = (c, d) => `fill="url(#${id}${d})" stroke="${line(c)}" stroke-width="1.1" stroke-linejoin="round"`;
  switch (kind) {
    case "leaf": return `<defs>${linear(id + "l", "#6aa84f", 100)}${linear(id + "s", "#9be08a", 60)}</defs>
      <path d="M26 28 Q50 8 74 28 Q50 21 26 28 Z" ${H("#6aa84f", "l")}/><path d="M33 22 Q50 14 63 19" stroke="#c7f0b0" stroke-width="1.3" fill="none" opacity=".7" stroke-linecap="round"/>
      <path d="M52 15 Q56 2 68 4 Q63 13 52 15 Z" ${H("#9be08a", "s")}/><path d="M53 14 Q59 8 65 6" stroke="${line("#9be08a")}" stroke-width=".8" fill="none"/>`;
    case "mushroom": return `<defs><radialGradient id="${id}m" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".6" stop-color="#d9534f"/><stop offset="1" stop-color="#9c2f2c"/></radialGradient></defs>
      <path d="M23 29 Q25 5 50 4 Q75 5 77 29 Q50 22 23 29 Z" fill="url(#${id}m)" stroke="${line("#d9534f")}" stroke-width="1.1" stroke-linejoin="round"/>
      <g fill="#fff6ea" stroke="#e8d8c4" stroke-width=".6"><ellipse cx="38" cy="14" rx="4.4" ry="3.2"/><ellipse cx="57" cy="10" rx="3.6" ry="2.7"/><ellipse cx="67" cy="20" rx="2.8" ry="2.1"/><ellipse cx="30" cy="23" rx="2.3" ry="1.7"/><ellipse cx="49" cy="20" rx="2" ry="1.5"/></g>
      <path d="M30 13 Q36 7 44 6" stroke="#ffffff" stroke-width="1.4" opacity=".55" fill="none" stroke-linecap="round"/>`;
    case "beanie": return `<defs>${linear(id + "b", "#5f8fd0", 95)}</defs>
      <path d="M26 31 Q26 10 50 9 Q74 10 74 31 Z" ${H("#5f8fd0", "b")}/><g stroke="${shade("#5f8fd0", .25)}" stroke-width="1.1" opacity=".8">${[33, 39, 45, 51, 57, 63, 69].map((x) => `<path d="M${x} 13 Q${x - 1} 20 ${x} 27"/>`).join("")}</g>
      <rect x="24.5" y="26.5" width="51" height="7.5" rx="3.7" fill="${shade("#5f8fd0", .18)}" stroke="${line("#5f8fd0")}" stroke-width="1.1"/>
      <g stroke="${shade("#5f8fd0", .4)}" stroke-width=".8">${[29, 34, 39, 44, 49, 54, 59, 64, 69].map((x) => `<path d="M${x} 28 V32.5"/>`).join("")}</g>
      <circle cx="50" cy="8" r="5.4" fill="#f6ead0" stroke="#b8a888" stroke-width="1.4"/><path d="M47 5.6 Q49 4.4 51 5" stroke="#fff" stroke-width="1" fill="none"/>`;
    case "flowers": return `<path d="M25 28 Q50 15 75 28" stroke="#4f8a3e" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      [[30, 25, "#ff9db5"], [40, 19, "#fff3a0"], [50, 17, "#ffffff"], [60, 19, "#ff9db5"], [70, 25, "#c9b6ff"]].map(([x, y, c]) =>
      `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-3.1" rx="2.3" ry="3.1" fill="${c}" stroke="${line(c)}" stroke-width=".7" transform="rotate(${a})"/>`).join("")}<circle r="1.7" fill="#f0b543" stroke="#a8761a" stroke-width=".6"/><circle cx="-.5" cy="-.5" r=".5" fill="#fff"/></g>`).join("");
    case "miner": return `<defs><radialGradient id="${id}h" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="#ffe8a0"/><stop offset=".55" stop-color="#f0c75a"/><stop offset="1" stop-color="#b88a28"/></radialGradient></defs>
      <path d="M25 31 Q25 9 50 8 Q75 9 75 31 Z" fill="url(#${id}h)" stroke="${line("#f0c75a")}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M50 9 V30" stroke="${shade("#f0c75a", .2)}" stroke-width="2"/><rect x="20.5" y="27.5" width="59" height="6" rx="3" fill="#d9a83a" stroke="${line("#f0c75a")}" stroke-width="1.1"/>
      <circle cx="50" cy="17" r="5.2" fill="#fffbe6" stroke="#8a6a2a" stroke-width="1.4"/><circle cx="48.6" cy="15.6" r="1.6" fill="#fff"/><path d="M50 17 L28 -6 L72 -6 Z" fill="#fff6c8" opacity=".14"/>`;
    default: return `<path d="M44 20 Q46 13 49 19 Q51 11 54 19 Q57 14 57 21" stroke="${INK}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`; // a little tuft
  }
}
// ---- rubber-hose hybrid toolkit: bold ink, fluffy scalloped silhouettes, pie-cut eyes ----
export const INK2 = "#1d120c";
// a fluffy outline: scallops around an ellipse (cx, cy, rx, ry), n bumps, bump depth d
export function fluff(cx, cy, rx, ry, n, d, seed = 3) {
  let p = "", r = seed;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const pts = [...Array(n)].map((_, k) => (k + (rnd() - .5) * .45) / n * Math.PI * 2); // uneven spacing
  pts.push(pts[0] + Math.PI * 2);
  pts.forEach((a, k) => {
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    if (!k) { p += `M${x.toFixed(2)} ${y.toFixed(2)}`; return; }
    const am = (pts[k - 1] + a) / 2 + (rnd() - .5) * .08, dd = d * (.45 + rnd() * 1.1); // tufts of different sizes, slightly swept
    p += ` Q${(cx + Math.cos(am) * (rx + dd)).toFixed(2)} ${(cy + Math.sin(am) * (ry + dd)).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return p + " Z";
}
// pie-cut eye: white oval, big black pupil with a pie-slice glint cut from its upper right; blinks
export function pieEye(cx, cy, w, h, look = 0, dur = 4.4) {
  const pw = w * .78, ph = h * .8, px = look * .6, py = h * .12, a0 = -Math.PI * .42, a1 = -Math.PI * .08;
  const wedge = `M${px} ${py} L${px + Math.cos(a0) * pw} ${py + Math.sin(a0) * ph} A${pw} ${ph} 0 0 1 ${px + Math.cos(a1) * pw} ${py + Math.sin(a1) * ph} Z`;
  return `<g transform="translate(${cx} ${cy})"><g>
    <animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 .1;1 1" keyTimes="0;.94;.97;1" dur="${dur}s" repeatCount="indefinite"/>
    <ellipse rx="${w}" ry="${h}" fill="#fffaf0" stroke="${INK2}" stroke-width="2.1"/>
    <ellipse cx="${px}" cy="${py}" rx="${pw}" ry="${ph}" fill="${INK2}"/><path d="${wedge}" fill="#fffaf0"/></g></g>`;
}
const noodle = (d, c, w = 7) => `<path d="${d}" stroke="${INK2}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w - 3}" fill="none" stroke-linecap="round"/>`;

// Dibble in the approved painterly style (proto/paint.js), fitted into the 100x100 box everything else expects.
export function dibble(size = 96, look = {}) {
  const L = { ...DEFAULT_LOOK, ...look }, [f] = FUR[L.fur] || FUR.cocoa, id = "dib" + uid++, glow = LANTERN_GLOW[L.lantern] || LANTERN_GLOW.amber;
  const D = dibbleBody(id, { fur: f, scarf: L.scarf, hat: L.hat === "leaf" ? null : hatArt(L.hat, id + "t"), lantern: L.lantern === "amber" ? null : lanternArt(L.lantern, id + "L") });
  return svg(size, "0 0 100 100", `
    <defs><radialGradient id="${id}g"><stop offset="0" stop-color="${glow}" stop-opacity=".6"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>${D.defs}</defs>
    <circle cx="75" cy="77" r="20" fill="url(#${id}g)"><animate attributeName="r" values="18;21;18" dur="2.6s" repeatCount="indefinite"/></circle>
    ${bob(`<g transform="translate(2 2) scale(.37) translate(-34 -158)">${D.body}</g>`)}
  `, "dibble");
}

// A wardrobe item on its own (shop tiles): the hat, scarf, lantern, or a jar of fur dye.
export function lookItem(part, val, size = 40) {
  const id = "li" + uid++;
  if (part === "hat") return svg(size, val === "miner" || val === "beanie" ? "16 0 68 40" : "18 -2 64 40", hatArt(val, id) || "", "lookItem");
  if (part === "lantern") return svg(size, "66 48 28 30", `<path d="M80 49 Q76 52 79 55" stroke="#4a3824" stroke-width="1.4" fill="none"/>${lanternArt(val, id)}`, "lookItem");
  if (part === "scarf") return svg(size, "0 0 40 40", `<defs>${linear(id, val, 90)}</defs>
    <path d="M6 14 Q20 24 34 14" stroke="${line(val)}" stroke-width="9.6" fill="none" stroke-linecap="round"/><path d="M6 14 Q20 24 34 14" stroke="url(#${id})" stroke-width="7.2" fill="none" stroke-linecap="round"/>
    <path d="M10 17 Q20 22.6 30 17" stroke="#fff" stroke-width=".8" stroke-dasharray="1.2 2.2" fill="none" opacity=".45"/>
    <path d="M24 19 L27.5 33 L33 31 L29 18 Z" fill="url(#${id})" stroke="${line(val)}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M27.5 33 l-.6 2.6 M29.4 32.4 l-.2 2.8 M31.2 31.6 l.3 2.7" stroke="${val}" stroke-width="1.2" stroke-linecap="round"/>`, "lookItem");
  const [f] = FUR[val] || FUR.cocoa; // fur dye: a little stoppered jar
  return svg(size, "0 0 40 40", `<defs>${radial(id, f, .35, .35)}</defs>
    <rect x="11" y="13" width="18" height="21" rx="6" fill="#d9f0ec" fill-opacity=".35" stroke="#5a7a70" stroke-width="1.4"/>
    <rect x="12.4" y="19" width="15.2" height="13.6" rx="5" fill="url(#${id})" stroke="${line(f)}" stroke-width=".8"/>
    <rect x="14" y="8" width="12" height="6" rx="2" fill="#a0703f" stroke="#5a3b24" stroke-width="1.2"/>
    <path d="M14 16 Q13 24 15 31" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none" stroke-linecap="round"/>
    <circle cx="23" cy="24" r="1.3" fill="#fff" opacity=".5"/>`, "lookItem");
}

// Old Puddock: a wise travelling toad merchant. Straw hat, round spectacles, droopy white brows, patched indigo coat.
export function puddock(size = 64) {
  const P = puddockBody("pud" + uid++);
  return svg(size, "0 0 100 100", `<defs>${P.defs}</defs>${bob(P.body, 3.6, 1.1)}`, "puddock");
}

// cave scene per mine (menu postcards): layered rock, stalactites, rails into the dark, crystal clusters
// with halos, a hanging lantern, and one environment feature per mine with drifting motes.
const motes = (n, col, r, dir, seed) => [...Array(n)].map((_, k) => {
  const x = 20 + ((k * 37 + seed) % 120), d = 3 + (k % 4), b = -((k * 1.3 + seed) % d);
  const [y0, y1] = dir === "down" ? [-4, 96] : [92, 18];
  return `<circle cx="${x}" cy="${y0}" r="${r}" fill="${col}"><animate attributeName="cy" values="${y0};${y1}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
}).join("");
export function scene(colors, pal, w = 160, h = 96) {
  const id = "sc" + uid++, f = pal.feature, rock = mix(pal.bg, "#000000", .3), rock2 = mix(pal.bg, "#000000", .45), lit = mix(pal.bg, "#fff1d8", .12);
  const r = rng(f ? f.length * 7 + 3 : 5);
  const feat = {
    moss: `${[[8, 90, -1.7], [14, 92, -1.3], [148, 91, -1.8], [154, 93, -1.4], [62, 92, -1.5]].map(([x, y, a]) => stroke(x, y, a, 7 + r() * 4, 1.6, r() < .5 ? "#5f8a46" : "#7aa057", .9)).join("")}
      <path d="${curve([[0, 96], [2, 80], [14, 74], [22, 86], [18, 96]])}" fill="#3f6a34"/>${motes(6, "#c9f5a0", .9, "up", 3)}`,
    lava: `<path d="M28 93 L42 86 L50 89 L62 83 M98 86 L110 90 L120 87" stroke="#ff8a3d" stroke-width="1.5" fill="none" filter="url(#${id}b)"/>
      <path d="M28 93 L42 86 L50 89 L62 83 M98 86 L110 90 L120 87" stroke="#ffd27a" stroke-width=".5" fill="none"/>${motes(9, "#ffb15a", 1, "up", 7)}`,
    caps: `${[[16, 88, 8], [30, 92, 5], [136, 90, 9], [150, 93, 5]].map(([x, y, s]) => `<path d="${curve(ring(x, y - s * .25, s * .2, s * .5, 6, .1, x))}" fill="#e2d8f0"/>
      ${shape(curve([[x - s, y - s * .55], [x - s * .5, y - s * 1.25], [x + s * .4, y - s * 1.3], [x + s, y - s * .6], [x, y - s * .75]]), pal.glow, mix(pal.glow, "#1a0f2a", .55), [-.5, .5])}
      <path d="${curve(ring(x, y - s * .8, s * 1.5, s, 8, .2, x + 1))}" fill="${pal.glow}" opacity=".22" filter="url(#${id}b)"/>`).join("")}${motes(10, "#d9ccff", .8, "up", 11)}`,
    snow: `<path d="${curve([[-4, 96], [-4, 88], [20, 84], [44, 89], [80, 86], [116, 89], [140, 85], [164, 88], [164, 96]])}" fill="#e6f6ff" opacity=".85"/>
      ${motes(14, "#ffffff", .9, "down", 5)}`,
    geode: `${shape(curve(ring(140, 76, 13, 12, 12, .1, 4)), "#8a8277", "#3a332c", [-.7, .6])}<path d="${curve(ring(140, 76, 9.5, 8.6, 10, .1, 6))}" fill="#3a2350"/>
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => shard(140 + Math.cos(a * Math.PI / 180) * 8.6, 76 + Math.sin(a * Math.PI / 180) * 7.8, 2.2, 6, (a - 90) * Math.PI / 180, pal.glow, r)).join("")}
      ${motes(5, "#e6c8ff", .8, "up", 2)}`,
    heart: `<path d="${curve(ring(108, 46, 20, 18, 10, .1, 8))}" fill="${pal.glow}" opacity=".22" filter="url(#${id}b)"><animate attributeName="opacity" values=".12;.3;.12" dur="2.4s" repeatCount="indefinite"/></path>
      <path d="M108 32 Q112 50 102 66 M108 32 Q118 44 126 40" stroke="#5a2a20" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${shape("M108 60 C95 51 93 43 98 38 C103 34 107 37 108 40 C109 37 113 34 118 38 C123 43 121 51 108 60 Z", pal.glow, "#6a2020", [-.8, .7])}
      <path d="M100 41 q2 -3 5 -2" stroke="#ffd0d8" stroke-width="1" fill="none" opacity=".8" stroke-linecap="round"/>${motes(8, "#ff9db5", .9, "up", 9)}`,
  }[f] || "";
  return `<svg class="scene" width="${w}" height="${h}" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="${id}bg" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${lit}"/><stop offset="1" stop-color="${mix(pal.bg, "#000000", .2)}"/></linearGradient>
      <radialGradient id="${id}g" cx="112" cy="80" r="46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${pal.glow}" stop-opacity=".5"/><stop offset="1" stop-color="${pal.glow}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}L" cx="22" cy="40" r="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd59a" stop-opacity=".5"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".2"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
      <radialGradient id="${id}v" cx=".42" cy=".45" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
      <filter id="${id}b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
    <rect width="160" height="96" fill="url(#${id}bg)"/>
    <path d="${curve([[-6, -6], [70, -6], [52, 12], [30, 22], [16, 46], [10, 72], [-6, 84]])}" fill="${rock}"/>
    <path d="${curve([[60, -6], [166, -6], [166, 100], [150, 92], [156, 60], [140, 30], [112, 14], [84, 10]])}" fill="${rock2}"/>
    <g filter="url(#${id}b)">${[...Array(7)].map((k) => `<path d="${curve(ring(r() < .5 ? r() * 30 : 120 + r() * 36, 8 + r() * 70, 6 + r() * 8, 4 + r() * 6, 8, .3, 40 + (r() * 99 | 0)))}" fill="${r() < .5 ? lit : rock2}" opacity="${(.25 + r() * .3).toFixed(2)}"/>`).join("")}</g>
    ${f === "geode" ? `<g stroke="${mix(pal.bg, "#ffffff", .12)}" stroke-width="1" fill="none" opacity=".5"><path d="M110 30 Q130 34 158 28"/><path d="M118 44 Q136 46 158 42"/></g>` : ""}
    <path d="M30 -4 L54 -4 L96 96 L62 96 Z" fill="url(#${id}s)" filter="url(#${id}b)"/>
    ${[[34, -4, 30, 26, 38, 40, 2.4], [90, -4, 96, 20, 86, 32, 1.8], [128, -4, 122, 26, 134, 46, 2.2]].map(([x1, y1, cx, cy, x2, y2, w]) =>
      shape(limb(x1, y1, cx, cy, x2, y2, w, .35), pal.root, mix(pal.root, "#000000", .5), [-.6, .4])).join("")}
    ${f === "snow" ? [[44, 22, 9], [70, 14, 12], [100, 18, 8], [118, 24, 10]].map(([x, y, hh]) => shape(curve([[x - 3, y - 4], [x + 3, y - 4], [x + .6, y + hh], [x - .4, y + hh]]), "#cfefff", "#5a7a8a", [-.4, .3])).join("") : ""}
    <path d="${curve([[-6, 100], [-6, 86], [30, 82], [70, 86], [110, 80], [166, 84], [166, 100]])}" fill="${pal.ground}"/>
    <path d="${curve([[20, 90], [50, 86], [80, 89], [56, 93], [30, 94]])}" fill="${mix(pal.ground, "#ffffff", .08)}"/>
    <rect width="160" height="96" fill="url(#${id}g)"/>
    ${shardCluster(112, 84, 30, colors, mix(pal.ground, "#ffffff", .05), 21)}
    ${shardCluster(40, 88, 14, colors.slice(1).concat(colors[0]), pal.ground, 33)}
    ${[[70, 90, 2.2], [84, 88, 1.4], [138, 90, 1.8]].map(([x, y, s], k) => shape(curve(ring(x, y, s * 1.4, s, 7, .3, 60 + k)), mix(pal.ground, "#ffffff", .2), mix(pal.ground, "#000000", .5), [-.4, .4])).join("")}
    <circle cx="22" cy="40" r="26" fill="url(#${id}L)"/>
    <path d="M22 22 Q24 28 22 33" stroke="#4a3a2a" stroke-width=".9" fill="none"/>
    ${shape(curve([[18.6, 33], [25.4, 33], [25.8, 41.4], [18.2, 41.4]]), "#ffd894", "#6a4a24", [-.5, .5])}
    <path d="${curve([[20, 34.4], [24, 34.4], [24, 40], [20, 40]])}" fill="#fff4d6" opacity=".9"/>
    ${shape(curve([[18, 32], [26, 32], [26, 33.6], [18, 33.6]]), "#6a5236", "#2a1e14", [-.3, .3])}
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

// a painted pine: three soft drooping tiers (Catmull-Rom rounds the corners), a faint lit edge on the left
function paintPine(x, y, h, col, edge, r) {
  const w = h * (.28 + r() * .06), j = () => 1 + (r() - .5) * .12;
  const pts = [[x, y - h], [x - w * .38 * j(), y - h * .64], [x - w * .3, y - h * .6], [x - w * .68 * j(), y - h * .3], [x - w * .54, y - h * .29],
    [x - w * j(), y], [x + w * j(), y], [x + w * .54, y - h * .29], [x + w * .68 * j(), y - h * .3], [x + w * .3, y - h * .6], [x + w * .38 * j(), y - h * .64]];
  return `<path d="${curve(pts)}" fill="${col}"/>` + (edge ? `<path d="${curve(pts.slice(0, 6), false)}" stroke="${edge}" stroke-width="${f1(h * .012)}" fill="none" opacity=".3"/>` : "");
}
const f1 = (n) => n.toFixed(1);
// a plank / board: slightly wonky rounded rectangle with a tinted shadow-side line
const plank = (x, y, w, h, c, r) => shape(curve([[x, y + r() * .8], [x + w * .5, y + (r() - .5) * .8], [x + w, y + r() * .8], [x + w + .4, y + h * .5], [x + w, y + h], [x + w * .5, y + h + (r() - .5) * .6], [x, y + h], [x - .4, y + h * .5]]), c, mix(c, "#1a0f08", .55), [-1, 1]);

// Dibble's Camp: a living night clearing. Every Market purchase shows up here, and most things react to a tap
// (elements with data-tap). Groups with data-depth drift for parallax (index.html moves them).
// st = { lantern, pick, charm, lens, tongs, sieve, mines:[colour], found:[{color,cut}|null], tent, banner, fire,
//        decor:{mushrooms,jars,hammock,cart,flies}, puddockSvg }
export function camp(st, gemFn, dibbleSvg) {
  const W = 400, H = 300, n = Math.min(st.lantern, 15), strip = (svgStr) => svgStr.replace(/^<svg[^>]*>|<\/svg>$/g, "");
  const sagX = (t) => 46 + t * 308, sagY = (t) => 74 + Math.sin(t * Math.PI) * 30;
  const r = rng(77), O = [-1.2, 1.1];
  const lanterns = [...Array(15)].map((_, k) => {
    const t = (k + .5) / 15, x = sagX(t), y = sagY(t), lit = k < n, sw = 2 + (k % 3);
    return `<g data-tap="lanterns"><animateTransform attributeName="transform" type="rotate" values="-${sw} ${x} ${y};${sw} ${x} ${y};-${sw} ${x} ${y}" dur="${2.6 + (k % 4) * .4}s" repeatCount="indefinite"/>
      <path d="M${x} ${y} v5" stroke="#5a4a3a" stroke-width="1"/>${lit ? `<circle cx="${x}" cy="${y + 11}" r="13" fill="url(#lanternGlow)"><animate attributeName="opacity" values=".16;.28;.16" dur="${1.8 + k % 3 * .5}s" repeatCount="indefinite"/></circle>` : ""}
      ${shape(curve([[x - 3.4, y + 5.4], [x + 3.4, y + 5.4], [x + 3.8, y + 13.6], [x - 3.8, y + 13.6]]), lit ? "#f7d77a" : "#3a3328", lit ? "#8a5a24" : "#1a1610", [-.6, .6])}
      ${lit ? `<path d="M${x - 1.6} ${y + 7} v5 M${x + 1.6} ${y + 7} v5" stroke="#c08a3a" stroke-width=".6" opacity=".7"/>` : ""}</g>`;
  }).join("");
  const tier = (lv) => ["#9aa3ab", "#c6ccd2", "#f0c75a", "#9fe6ff"][Math.min(3, Math.floor(lv / 5))];
  const picks = [...Array(5)].map((_, k) => { const on = k < Math.ceil(st.pick / 3), x = 318 + k * 12;
    return on ? `${shape(limb(x, 232, x - .4, 214, x, 196, 1.5, 1.1), "#8a5a32", "#3a2418", [-.6, .5])}${shape(curve([[x - 8, 197], [x - 3, 190.6], [x + 3, 190.6], [x + 8, 197], [x, 194]]), tier(st.pick), mix(tier(st.pick), "#1a0f08", .55), [-.7, .6])}`
      : `<path d="M${x} 232 L${x} 206" stroke="#3a2a1a" stroke-width="1" stroke-dasharray="2 2"/>`; }).join("");
  const c = Math.min(st.charm, 15), trunk = 16 + c * 4.5, crown = 10 + c * 2.4, tx = 218, ty = 196, ct = ty - trunk;
  const lobe = (dx, dy, rr, col, seed) => shape(curve(ring(tx + dx * crown, ct + dy * crown, rr * crown, rr * crown * .9, 12, .14, seed)), col, "#1d3a19", [-1.4, 1.2]);
  const tree = `${c >= 15 ? `<circle cx="${tx}" cy="${ct - crown * .4}" r="${crown + 16}" fill="#9be08a" opacity=".18"><animate attributeName="opacity" values=".1;.3;.1" dur="3s" repeatCount="indefinite"/></circle>` : ""}
    ${shape(limb(tx, ty + 2, tx - 2, ty - trunk * .5, tx, ct, 2 + c * .3, 1 + c * .15), "#6b4a2a", "#2e1e12", [-1, 1])}
    <g><animateTransform attributeName="transform" type="rotate" values="-1.5 ${tx} ${ct};1.5 ${tx} ${ct};-1.5 ${tx} ${ct}" dur="5s" repeatCount="indefinite"/>
    ${lobe(.5, -.05, .58, "#4f8a3e", 1)}${lobe(-.48, .02, .62, "#4a8239", 2)}${lobe(0, -.35, .82, "#5f9a48", 3)}
    <path d="${curve(ring(tx - crown * .3, ct - crown * .6, crown * .4, crown * .3, 9, .2, 4))}" fill="#a8dc88" opacity=".35" filter="url(#campBlur)"/>
    ${[...Array(5)].map(() => stroke(tx + (r() - .5) * crown * 1.2, ct - crown * (.1 + r() * .7), -1 - r(), crown * .22, crown * .05, "#2f5a2a", .4)).join("")}</g>`;
  const tentLine = "#5a4024", canvas = "#e8d6aa";
  const tentBody = (extra) => `${shape(curve([[44, 236], [62, 200], [88, 156], [112, 200], [132, 236], [88, 239]]), canvas, tentLine, O)}
      <path d="${curve([[88, 158], [110, 200], [130, 235], [88, 238]])}" fill="#7a5a30" opacity=".22"/>${extra}
      <path d="M88 158 Q66 196 52 230" stroke="#fff6e0" stroke-width="1.4" opacity=".45" fill="none"/>
      ${shape(curve([[88, 188], [80, 212], [74, 236], [102, 236], [96, 212]]), "#2a1d12", "#120c06", [-.6, .6])}`;
  const tents = {
    canvas: tentBody(""),
    patchwork: tentBody([[70, 200, "#c8553d"], [104, 210, "#35b38a"], [60, 224, "#9b7cf2"], [116, 228, "#f0b543"]].map(([x, y, col], k) =>
      shape(curve(ring(x, y, 5, 4, 6, .2, 90 + k)), col, mix(col, "#1a0f08", .5), [-.6, .6])).join("")),
    treehouse: `${shape(limb(88, 238, 86, 190, 88, 140, 8, 6), "#6b4a2a", "#2e1e12", O)}${plank(50, 140, 76, 7, "#8a5a32", r)}
      ${plank(58, 110, 58, 30, "#a0703f", r)}${shape(curve([[52, 113], [70, 98], [87, 86], [104, 98], [122, 113], [87, 110]]), "#c8553d", "#5a1e14", O)}
      ${shape(curve([[78, 119], [89, 119], [89, 140], [78, 140]]), "#2a1d12", "#120c06", [-.5, .5])}
      <path d="${curve([[98, 118], [108, 118], [108, 128], [98, 128]])}" fill="#f7d77a"><animate attributeName="opacity" values=".8;1;.8" dur="2.4s" repeatCount="indefinite"/></path>
      <path d="M62 147 V236 M70 147 V236" stroke="#6b4a2a" stroke-width="1.8"/>${[156, 172, 188, 204, 220].map((y) => `<path d="M62 ${y} H70" stroke="#8a5a32" stroke-width="1.8"/>`).join("")}`,
    pavilion: `${shape(limb(48, 236, 47, 206, 48, 178, 2.4, 2), "#c9b48a", "#5a4a30", O)}${shape(limb(128, 236, 129, 206, 128, 178, 2.4, 2), "#c9b48a", "#5a4a30", O)}
      ${shape(curve([[38, 181], [64, 160], [88, 140], [112, 160], [138, 181], [88, 177]]), "#9fe6ff", "#2a5a6a", O, 'opacity=".9"')}
      <path d="${curve([[40, 180], [88, 141], [88, 177]])}" fill="#ffffff" opacity=".3"/><path d="M54 180 Q88 150 122 180" stroke="#f0b543" stroke-width="1.6" fill="none"/>
      <circle cx="88" cy="196" r="20" fill="#9fe6ff" opacity=".15"><animate attributeName="opacity" values=".08;.22;.08" dur="3s" repeatCount="indefinite"/></circle>${plank(70, 218, 36, 18, "#5a3b24", r)}`,
  }[st.tent] || "";
  const flame = (x, y, h, col, dur) => `<path fill="${col}" d="M${x - h * .32} ${y} Q${x} ${y - h * 1.15} ${x + h * .32} ${y} Z">
    <animate attributeName="d" values="M${x - h * .32} ${y} Q${x} ${y - h * 1.15} ${x + h * .32} ${y} Z;M${x - h * .3} ${y} Q${x - 2} ${y - h * 1.3} ${x + h * .3} ${y} Z;M${x - h * .33} ${y} Q${x + 2} ${y - h} ${x + h * .33} ${y} Z;M${x - h * .32} ${y} Q${x} ${y - h * 1.15} ${x + h * .32} ${y} Z" dur="${dur}s" repeatCount="indefinite"/></path>`;
  const sparks = [...Array(7)].map((_, k) => `<circle cx="${178 + (k % 4) * 4}" cy="250" r="1.2" fill="#ffd27a"><animate attributeName="cy" values="246;196" dur="${1.6 + k * .23}s" begin="${-k * .4}s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="${178 + (k % 4) * 4};${170 + (k * 7) % 22}" dur="${1.6 + k * .23}s" begin="${-k * .4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${1.6 + k * .23}s" begin="${-k * .4}s" repeatCount="indefinite"/></circle>`).join("");
  const fire = st.fire === "forge"
    ? `<g data-tap="fire">${plank(160, 230, 44, 26, "#7a746a", r)}<path d="M169 256 V244 Q182 232 195 244 V256 Z" fill="#ff8a3d"><animate attributeName="fill" values="#ff8a3d;#ffb15a;#ff8a3d" dur="1.2s" repeatCount="indefinite"/></path>${plank(192, 210, 8, 22, "#5e5850", r)}${sparks}</g>`
    : `<g data-tap="fire">${[0, 1, 2, 3, 4, 5].map((k) => shape(curve(ring(167 + k * 6, 254 + (k % 2), 5, 3, 8, .2, 110 + k)), k % 2 ? "#6f6a60" : "#7d776c", "#2a2620", [-.7, .6])).join("")}
      ${shape(limb(168, 253, 183, 249, 198, 243, 2.2, 1.8), "#6b4a2a", "#2e1e12", [-.6, .6])}${shape(limb(168, 243, 183, 248, 198, 253, 2.2, 1.8), "#7a5432", "#2e1e12", [-.6, .6])}
      <g filter="url(#campBlur1)">${flame(183, 250, 26, "#ff7a3d", .9)}</g>${flame(183, 250, 17, "#ffb15a", .7)}${flame(183, 250, 9, "#fff3a0", .55)}${sparks}
      <path d="M183 214 Q178 196 186 180 Q192 166 184 150" stroke="#cfd6cc" stroke-width="4" fill="none" opacity=".08"><animate attributeName="opacity" values=".05;.12;.05" dur="4s" repeatCount="indefinite"/></path></g>`;
  const shelf = `${plank(252, 128, 128, 5, "#8a5a32", r)}${plank(252, 158, 128, 5, "#8a5a32", r)}
    ${shape(limb(254, 126, 253, 146, 254, 167, 1.3, 1.2), "#5a3b24", "#2e1e12", [-.5, .5])}${shape(limb(378, 126, 379, 146, 378, 167, 1.3, 1.2), "#5a3b24", "#2e1e12", [-.5, .5])}
    ${st.found.map((g, k) => { const x = 257 + (k % 6) * 20.5, y = k < 6 ? 108 : 138;
      return `<g data-tap="gem-${k}"><rect x="${x - 1}" y="${y - 1}" width="20" height="21" fill="transparent"/><svg x="${x}" y="${y}" width="18" height="18" viewBox="0 0 24 24">${g ? strip(gemFn(g.color, 24, "", g.cut)) : `<path d="${curve(ring(12, 13, 6, 6, 8, .1, k))}" fill="#000" opacity=".3"/><text x="12" y="16" font-size="9" text-anchor="middle" fill="#8a7a5a">?</text>`}</svg></g>`; }).join("")}`;
  const sign = `${shape(limb(26, 264, 25, 220, 26, 170, 2.6, 2), "#6b4a2a", "#2e1e12", [-.8, .7])}${st.mines.map((col, k) => {
    const y = 176 + k * 12, right = k % 2 === 0;
    return `${shape(curve(right ? [[26, y], [56, y + .4], [62, y + 5], [56, y + 10], [26, y + 9.6]] : [[26, y], [-2, y + .4], [-8, y + 5], [-2, y + 10], [26, y + 9.6]]), "#a0703f", "#3a2418", [-.7, .6])}
      <path d="${curve(ring(right ? 46 : 6, y + 5, 2.8, 2.8, 8, .08, k))}" fill="${col}"/>`; }).join("")}`;
  const flag = `<path fill="${st.banner}" stroke="${mix(st.banner, "#1a0f08", .5)}" stroke-width=".8" d="M141 152 Q156 148 170 153 L163 163 L170 173 Q156 168 141 172 Z">
    <animate attributeName="d" values="M141 152 Q156 148 170 153 L163 163 L170 173 Q156 168 141 172 Z;M141 152 Q156 157 170 151 L163 162 L170 171 Q156 177 141 172 Z;M141 152 Q156 148 170 153 L163 163 L170 173 Q156 168 141 172 Z" dur="2.8s" repeatCount="indefinite"/></path>`;
  const d = st.decor, flies = [...Array(d.flies ? 12 : 5)].map((_, k) => `<circle r="1.7" fill="#fff3a0"><animateMotion dur="${9 + k * 1.7}s" begin="${-k * 1.3}s" repeatCount="indefinite" path="M${40 + k * 30} ${120 + (k % 3) * 30} q30 -20 60 0 t60 0 q-30 25 -60 0 t-60 0"/>
    <animate attributeName="opacity" values="0;1;0" dur="${2 + k % 3}s" begin="${-k * .4}s" repeatCount="indefinite"/></circle>`).join("");
  const stars = [[30, 18], [90, 34], [170, 14], [250, 28], [340, 16], [210, 44], [130, 52], [300, 54], [380, 40], [60, 58]].map(([x, y], k) =>
    `<circle cx="${x}" cy="${y}" r="${k % 3 ? .9 : 1.3}" fill="#fff"><animate attributeName="opacity" values=".2;1;.2" dur="${2.5 + k % 4}s" begin="${-k * .6}s" repeatCount="indefinite"/></circle>`).join("");
  const fern = (x, y, a, sz, col) => { let o = ""; for (let k = 0; k < 8; k++) { const t = k / 8, px = x + Math.cos(a) * sz * t, py = y + Math.sin(a) * sz * t;
    o += stroke(px, py, a - 1.1, sz * .32 * (1 - t * .6), 3 * (1 - t * .5), col) + stroke(px, py, a + 1.1, sz * .3 * (1 - t * .6), 2.8 * (1 - t * .5), col); }
    return o + stroke(x, y, a, sz, 2.4, col, 1, .05); };
  return `<svg class="campArt" viewBox="0 0 ${W} ${H}" width="100%" aria-label="Dibble's camp">
    <defs><linearGradient id="campSky" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#0d1a14"/><stop offset=".6" stop-color="#1a3326"/><stop offset="1" stop-color="#20402e"/></linearGradient>
      <radialGradient id="fireLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb15a" stop-opacity=".42"/><stop offset=".5" stop-color="#ff8a3d" stop-opacity=".12"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
      <radialGradient id="lanternGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#f0b543" stop-opacity="0"/></radialGradient>
      <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <filter id="campBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="campBlur1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
    <rect width="${W}" height="${H}" fill="url(#campSky)"/>
    <g data-depth=".15">${stars}<circle cx="320" cy="46" r="34" fill="url(#moonGlow)"/><path d="${curve(ring(320, 46, 13, 13, 14, .02, 5))}" fill="#fff6d8"/>
      <path d="${curve(ring(315, 43, 3, 2.6, 8, .2, 6))}" fill="#e8dcb8" opacity=".6"/><path d="${curve(ring(325, 51, 2, 1.8, 8, .2, 7))}" fill="#e8dcb8" opacity=".6"/>
      <path d="${curve(ring(120, 70, 60, 7, 12, .2, 8))}" fill="#cfd8c8" opacity=".06" filter="url(#campBlur)"/></g>
    <g data-depth=".3">${[10, 60, 300, 350, 395].map((x, k) => paintPine(x, 172, 110 + (k % 3) * 18, "#10261a", null, r)).join("")}</g>
    <g data-depth=".5">${paintPine(18, 190, 150, "#173322", "#3a6a48", r)}${paintPine(380, 190, 160, "#173322", "#3a6a48", r)}${paintPine(46, 186, 96, "#1b3a26", "#3a6a48", r)}${paintPine(352, 186, 100, "#1b3a26", "#3a6a48", r)}
      <path d="M${sagX(0)} ${sagY(0)} ${[...Array(29)].map((_, k) => `L${sagX((k + 1) / 29)} ${sagY((k + 1) / 29)}`).join(" ")}" stroke="#5a4a3a" stroke-width="1.3" fill="none"/>${lanterns}</g>
    <g data-depth=".75">
      <defs><linearGradient id="campGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a5434"/><stop offset="1" stop-color="#16301e"/></linearGradient>
        <radialGradient id="campVig" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient></defs>
      <path d="${curve([[-10, 196], [60, 182], [140, 176], [220, 172], [300, 178], [410, 192], [410, 310], [-10, 310]])}" fill="url(#campGround)"/>
      <path d="${curve(ring(200, 254, 190, 40, 16, .08, 9))}" fill="#2f5a36" opacity=".6" filter="url(#campBlur)"/>
      ${[[60, 260], [120, 282], [250, 276], [330, 268], [160, 292], [290, 290], [30, 286], [370, 284]].map(([x, y]) => stroke(x, y, -1.4 - r() * .4, 6 + r() * 4, 1.4, r() < .5 ? "#3f7348" : "#4f8a54", .7)).join("")}
      <ellipse cx="183" cy="246" rx="120" ry="58" fill="url(#fireLight)"><animate attributeName="rx" values="112;128;116;112" dur="1.3s" repeatCount="indefinite"/></ellipse>
      ${tree}${shelf}<g data-tap="tent">${tents}</g>
      ${shape(limb(140, 262, 139, 206, 140, 150, 1.4, 1.1), "#6b4a2a", "#2e1e12", [-.6, .5])}${flag}
      ${d.hammock ? `${shape(limb(380, 262, 381, 214, 380, 168, 1.8, 1.5), "#5a3b24", "#2e1e12", [-.6, .5])}${shape(limb(300, 262, 299, 224, 300, 186, 1.8, 1.5), "#5a3b24", "#2e1e12", [-.6, .5])}<path d="M300 194 Q340 226 380 176" stroke="#e8d6aa" stroke-width="5.5" fill="none"/><path d="M302 196 Q340 222 378 179" stroke="#b8a678" stroke-width="1" fill="none" opacity=".6"/>` : ""}
      ${plank(306, 230, 76, 7, "#5a3b24", r)}${shape(limb(310, 237, 306, 246, 303, 256, 1.6, 1.3), "#5a3b24", "#2e1e12", [-.5, .5])}${shape(limb(378, 237, 382, 246, 385, 256, 1.6, 1.3), "#5a3b24", "#2e1e12", [-.5, .5])}${picks}
      ${st.lens ? `<g transform="translate(330 214) scale(.9)">${ICONS.lens}</g>` : ""}${st.tongs ? `<g transform="translate(352 212) scale(.9)">${ICONS.tongs}</g>` : ""}${st.sieve ? `<g transform="translate(98 156) scale(.9)">${ICONS.sieve}</g>` : ""}
      ${fire}${sign}
      ${d.mushrooms ? [[106, 268, 8], [120, 273, 6], [94, 276, 5]].map(([x, y, s]) => `<path d="${curve(ring(x, y + s * .3, s * .2, s * .6, 6, .1, x))}" fill="#e2d8f0"/>
        ${shape(curve([[x - s, y - .5], [x - s * .5, y - s * 1.1], [x + s * .4, y - s * 1.15], [x + s, y - .6], [x, y - s * .3]]), "#9b7cf2", "#3a2458", [-.6, .6])}
        <circle cx="${x}" cy="${y - s * .6}" r="${s * 1.6}" fill="#9b7cf2" opacity=".2"><animate attributeName="opacity" values=".1;.3;.1" dur="${2.4 + s * .1}s" repeatCount="indefinite"/></circle>`).join("") : ""}
      ${d.jars ? `${plank(238, 246, 26, 12, "#6b4a2a", r)}<g transform="translate(236 222) scale(1)">${ICONS.jar}</g><g transform="translate(252 226) scale(.8)">${ICONS.jar}</g>` : ""}
      ${d.cart ? `<g transform="translate(270 240) scale(1.8)">${ICONS.cart}</g>${st.puddockSvg ? `<g data-tap="puddock"><svg x="252" y="208" width="42" height="42" viewBox="0 0 100 100">${strip(st.puddockSvg)}</svg></g>` : ""}` : ""}
      <g data-tap="dibble" class="campDibble"><svg x="190" y="196" width="68" height="68" viewBox="0 0 100 100">${strip(dibbleSvg)}</svg></g>
      ${flies}
    </g>
    <path d="${curve(ring(200, 286, 230, 18, 14, .1, 11))}" fill="#cfe0d0" opacity=".06" filter="url(#campBlur)"/>
    <g data-depth="1.1" filter="url(#campBlur1)">${fern(-6, 304, -1.1, 90, "#07130c")}${fern(20, 310, -1.45, 70, "#0a1a10")}${fern(406, 304, -2.05, 90, "#07130c")}${fern(382, 310, -1.7, 66, "#0a1a10")}</g>
  <rect width="${W}" height="${H}" fill="url(#campVig)" pointer-events="none"/>
  </svg>`;
}

// the world behind the menus: layered forest, the mine entrance Dibble works from, ferns in front
export function forest() {
  const r = rng(41);
  const pines = (y, n, hgt, col, edge) => [...Array(n)].map((_, k) => paintPine((k + .5) * (420 / n) - 10 + (r() - .5) * 20, y + r() * 8, hgt * (.75 + r() * .33), col, edge, r)).join("");
  const fern = (x, y, a, sz, col) => { let o = ""; for (let k = 0; k < 8; k++) { const t = k / 8, px = x + Math.cos(a) * sz * t, py = y + Math.sin(a) * sz * t;
    o += stroke(px, py, a - 1.1, sz * .32 * (1 - t * .6), 4 * (1 - t * .5), col) + stroke(px, py, a + 1.1, sz * .3 * (1 - t * .6), 3.6 * (1 - t * .5), col); }
    return o + stroke(x, y, a, sz, 3, col, 1, .05); };
  return `<svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><radialGradient id="mineGlow"><stop offset="0" stop-color="#f0b543" stop-opacity=".5"/><stop offset="1" stop-color="#f0b543" stop-opacity="0"/></radialGradient>
      <linearGradient id="fSky" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#11241a"/><stop offset=".45" stop-color="#1a3a2c"/><stop offset="1" stop-color="#0d2016"/></linearGradient>
      <linearGradient id="fFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc4a8" stop-opacity="0"/><stop offset=".6" stop-color="#9fc4a8" stop-opacity=".09"/><stop offset="1" stop-color="#9fc4a8" stop-opacity="0"/></linearGradient>
      <linearGradient id="fRay" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity=".13"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>
      <filter id="fBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="fBlur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter></defs>
    <rect width="400" height="800" fill="url(#fSky)"/>
    <path d="M60 -10 L150 -10 L250 560 L150 560 Z M240 -10 L272 -10 L330 520 L290 520 Z" fill="url(#fRay)" filter="url(#fBlur)"/>
    ${pines(470, 18, 150, "#18382a", null)}
    <rect y="380" width="400" height="120" fill="url(#fFog)"/>
    ${pines(560, 14, 200, "#132d20", "#2a5a3e")}
    <rect y="470" width="400" height="120" fill="url(#fFog)"/>
    ${pines(650, 10, 270, "#0e2318", "#22492f")}
    <path d="${curve([[-10, 646], [90, 606], [200, 622], [310, 604], [410, 616], [410, 810], [-10, 810]])}" fill="#0b1b12"/>
    <circle cx="200" cy="720" r="130" fill="url(#mineGlow)"/>
    <path d="${curve([[118, 810], [120, 720], [150, 660], [200, 642], [252, 662], [282, 724], [284, 810]])}" fill="#1a2a1e"/>
    <path d="${curve([[142, 810], [142, 724], [164, 678], [200, 664], [238, 680], [258, 726], [258, 810]])}" fill="#060b08"/>
    ${shape(limb(146, 806, 144, 756, 147, 702, 7, 6), "#5a3b24", "#2a1a10", [-2, 1.6])}${shape(limb(254, 806, 256, 756, 253, 702, 7, 6), "#5a3b24", "#2a1a10", [-2, 1.6])}
    ${shape(limb(130, 704, 200, 694, 270, 700, 6, 6), "#4a2f1c", "#22140a", [-2, 1.6])}<path d="M136 699 Q200 690 264 695" stroke="#8a6040" stroke-width="1.6" fill="none" opacity=".6"/>
    ${shape(limb(200, 694, 199, 676, 200, 664, 3, 2), "#4a2f1c", "#22140a", [-1, 1])}
    <path d="${curve([[160, 810], [178, 760], [200, 740], [222, 760], [240, 810]])}" fill="#f0b543" opacity=".08" filter="url(#fBlur2)"/>
    <path d="M285 700 Q288 680 285 660" stroke="#5a4a3a" stroke-width="2" fill="none"/>
    ${shape(curve([[278.4, 661], [291.6, 661], [292.4, 678], [277.6, 678]]), "#f7d77a", "#6b5030", [-1.2, 1])}<path d="${curve([[281, 664], [289, 664], [289, 675], [281, 675]])}" fill="#fff4d6" opacity=".85"/>
    <circle cx="285" cy="669" r="26" fill="#f0b543" opacity=".16"><animate attributeName="r" values="24;28;24" dur="3s" repeatCount="indefinite"/></circle>
    <g filter="url(#fBlur2)">${fern(-10, 806, -1.15, 130, "#050d08")}${fern(30, 812, -1.45, 100, "#08130c")}${fern(410, 806, -2.0, 130, "#050d08")}${fern(372, 812, -1.7, 96, "#08130c")}</g>
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

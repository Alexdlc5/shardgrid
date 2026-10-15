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
  back: `<path d="M15 5 L8 12 L15 19" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
};
export const icon = (name, size = 22) => svg(size, "0 0 24 24", ICONS[name]);

export function dibble(size = 96) {
  const g = "pg" + uid++;
  return svg(size, "0 0 100 100", `
    <defs><radialGradient id="${g}"><stop offset="0" stop-color="#fff3a0" stop-opacity=".9"/><stop offset="1" stop-color="#f0b543" stop-opacity="0"/></radialGradient></defs>
    <circle cx="80" cy="62" r="20" fill="url(#${g})"/>
    <ellipse cx="48" cy="74" rx="28" ry="22" fill="#6b4a3a"/>
    <ellipse cx="48" cy="80" rx="16" ry="12" fill="#8a6650"/>
    <circle cx="48" cy="46" r="23" fill="#7a5644"/>
    <ellipse cx="48" cy="25" rx="21" ry="8" fill="#5f9a45"/><ellipse cx="44" cy="22" rx="12" ry="5" fill="#7cc46a"/>
    <path d="M52 18 Q55 8 62 9 Q58 15 52 18 Z" fill="#9be08a"/>
    <circle cx="39" cy="44" r="2.8" fill="#1a120d"/><circle cx="57" cy="44" r="2.8" fill="#1a120d"/>
    <circle cx="40" cy="43" r=".9" fill="#fff"/><circle cx="58" cy="43" r=".9" fill="#fff"/>
    <ellipse cx="48" cy="55" rx="10" ry="7" fill="#e8b4a0"/><circle cx="48" cy="51" r="4" fill="#e0607e"/>
    <ellipse cx="34" cy="53" rx="4" ry="2.5" fill="#e0607e" opacity=".35"/><ellipse cx="62" cy="53" rx="4" ry="2.5" fill="#e0607e" opacity=".35"/>
    <path d="M44 60 Q48 63 52 60" stroke="#5a3a2a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="30" cy="80" rx="7" ry="5" fill="#e8b4a0"/>
    <path d="M66 70 L78 58" stroke="#5a4a3a" stroke-width="2.5"/><ellipse cx="66" cy="72" rx="7" ry="5" fill="#e8b4a0"/>
    <path d="M76 50 Q80 44 84 50" stroke="#c9b48a" stroke-width="1.5" fill="none"/>
    <rect x="75" y="51" width="10" height="13" rx="2.5" fill="#f7d77a" stroke="#6b5a3a" stroke-width="1.5"/><circle cx="80" cy="57.5" r="2.5" fill="#fff"/>`, "dibble");
}

export function puddock(size = 64) {
  return svg(size, "0 0 100 100", `
    <ellipse cx="50" cy="68" rx="36" ry="26" fill="#6f8f3a"/>
    <ellipse cx="50" cy="76" rx="22" ry="14" fill="#c9cf8a"/>
    <circle cx="32" cy="42" r="12" fill="#7fa244"/><circle cx="68" cy="42" r="12" fill="#7fa244"/>
    <circle cx="32" cy="42" r="6" fill="#efe6cf"/><circle cx="68" cy="42" r="6" fill="#efe6cf"/>
    <circle cx="33" cy="43" r="3.4" fill="#1a1a0f"/><circle cx="69" cy="43" r="3.4" fill="#1a1a0f"/>
    <path d="M20 40 Q32 30 44 40" stroke="#4f6a2a" stroke-width="2.5" fill="none"/><path d="M56 40 Q68 30 80 40" stroke="#4f6a2a" stroke-width="2.5" fill="none"/>
    <path d="M30 62 Q50 72 70 62" stroke="#3d5220" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="27" cy="72" r="2" fill="#5a7a2a"/><circle cx="74" cy="70" r="2.4" fill="#5a7a2a"/><circle cx="66" cy="82" r="1.8" fill="#5a7a2a"/>
    <ellipse cx="50" cy="32" rx="14" ry="3.5" fill="#6b4a2a"/><rect x="41" y="18" width="18" height="14" rx="3" fill="#7a5632"/>
    <rect x="41" y="27" width="18" height="3" fill="#c8553d"/>
    <circle cx="68" cy="42" r="8" fill="none" stroke="#c9b48a" stroke-width="1.6"/>`, "puddock");
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

// Dibble's Camp: every Market purchase shows up here. st = { lantern, pick, charm, lens, tongs, sieve, mines:[colour],
//   found:[{colour,cut}|null], tent, banner, fire, decor:{mushrooms,jars,hammock,cart,flies} }
export function camp(st, gemFn, dibbleSvg) {
  const W = 360, H = 230, n = Math.min(st.lantern, 15);
  const sagX = (t) => 40 + t * 280, sagY = (t) => 46 + Math.sin(t * Math.PI) * 26;
  const lanterns = [...Array(15)].map((_, k) => { const t = (k + .5) / 15, x = sagX(t), y = sagY(t), lit = k < n;
    return `<path d="M${x} ${y} v4" stroke="#5a4a3a" stroke-width="1"/>${lit ? `<circle cx="${x}" cy="${y + 9}" r="9" fill="#f0b543" opacity=".22"/>` : ""}
      <rect x="${x - 3.2}" y="${y + 4}" width="6.4" height="8" rx="2" fill="${lit ? "#f7d77a" : "#3a3328"}" stroke="#5a4a3a" stroke-width=".8"/>`; }).join("");
  const tier = (lv) => ["#9aa3ab", "#c6ccd2", "#f0c75a", "#9fe6ff"][Math.min(3, Math.floor(lv / 5))];
  const picks = [...Array(5)].map((_, k) => { const on = k < Math.ceil(st.pick / 3), x = 288 + k * 11;
    return on ? `<path d="M${x} 176 L${x} 140" stroke="#8a5a32" stroke-width="2.4"/><path d="M${x - 7} 142 Q${x} 134 ${x + 7} 142 Q${x} 139 ${x - 7} 142 Z" fill="${tier(st.pick)}" stroke="#555" stroke-width=".6"/>`
      : `<path d="M${x} 176 L${x} 152" stroke="#3a2a1a" stroke-width="1" stroke-dasharray="2 2"/>`; }).join("");
  const c = Math.min(st.charm, 15), trunk = 14 + c * 4, crown = 9 + c * 2.2, tx = 196, ty = 150;
  const tree = `${c >= 15 ? `<circle cx="${tx}" cy="${ty - trunk - crown * .4}" r="${crown + 14}" fill="#9be08a" opacity=".18"><animate attributeName="opacity" values=".1;.3;.1" dur="3s" repeatCount="indefinite"/></circle>` : ""}
    <path d="M${tx} ${ty} V${ty - trunk}" stroke="#6b4a2a" stroke-width="${3 + c * .35}" stroke-linecap="round"/>
    <circle cx="${tx}" cy="${ty - trunk - crown * .3}" r="${crown}" fill="#5fa04e"/><circle cx="${tx - crown * .45}" cy="${ty - trunk}" r="${crown * .6}" fill="#7cc46a"/>
    <circle cx="${tx + crown * .5}" cy="${ty - trunk - crown * .1}" r="${crown * .55}" fill="#4f8a3e"/>`;
  const tents = {
    canvas: `<path d="M40 176 L78 108 L116 176 Z" fill="#e8d6aa" stroke="#8a6d3b" stroke-width="2"/><path d="M78 108 L78 176" stroke="#8a6d3b"/><path d="M78 134 L66 176 H90 Z" fill="#3a2a1a"/>`,
    patchwork: `<path d="M40 176 L78 108 L116 176 Z" fill="#e8d6aa" stroke="#8a6d3b" stroke-width="2"/>
      <path d="M58 150 L70 130 L76 150 Z" fill="#c8553d"/><path d="M86 140 L96 156 L84 160 Z" fill="#35b38a"/><path d="M50 170 L60 160 L64 172 Z" fill="#9b7cf2"/><path d="M98 166 L108 172 L96 174 Z" fill="#f0b543"/>
      <path d="M78 108 L78 176" stroke="#8a6d3b"/><path d="M78 134 L66 176 H90 Z" fill="#3a2a1a"/>`,
    treehouse: `<rect x="70" y="96" width="14" height="80" fill="#6b4a2a"/><rect x="44" y="96" width="66" height="6" fill="#8a5a32"/>
      <rect x="52" y="70" width="50" height="26" fill="#a0703f" stroke="#5a3b24" stroke-width="2"/><path d="M46 72 L77 50 L108 72 Z" fill="#c8553d"/>
      <rect x="70" y="78" width="10" height="18" fill="#3a2a1a"/><rect x="88" y="78" width="8" height="8" fill="#f7d77a"/><path d="M60 102 V176 M64 110 H56 M64 124 H56 M64 138 H56 M64 152 H56 M64 166 H56" stroke="#8a5a32" stroke-width="1.6"/>`,
    pavilion: `<path d="M44 176 V128 M112 176 V128" stroke="#c9b48a" stroke-width="4"/><path d="M36 130 L78 96 L120 130 Z" fill="#9fe6ff" opacity=".85"/>
      <path d="M36 130 L78 96 L78 130 Z" fill="#ffffff" opacity=".35"/><path d="M50 130 L78 108 L106 130" stroke="#f0b543" stroke-width="1.5" fill="none"/>
      <circle cx="78" cy="140" r="16" fill="#9fe6ff" opacity=".15"/><rect x="62" y="160" width="32" height="16" rx="3" fill="#5a3b24"/>`,
  }[st.tent] || "";
  const fire = st.fire === "forge"
    ? `<rect x="140" y="170" width="36" height="22" rx="4" fill="#7a746a"/><path d="M148 192 V182 Q158 172 168 182 V192 Z" fill="#ff8a3d"><animate attributeName="fill" values="#ff8a3d;#ffb15a;#ff8a3d" dur="1.2s" repeatCount="indefinite"/></path><rect x="166" y="156" width="7" height="16" fill="#5e5850"/>`
    : `<g fill="#6f6a60">${[0, 1, 2, 3, 4, 5].map((k) => `<ellipse cx="${146 + k * 5}" cy="${190 + (k % 2)}" rx="4" ry="2.5"/>`).join("")}</g>
      <path d="M150 188 Q158 166 166 188 Z" fill="#ff8a3d"><animate attributeName="d" values="M150 188 Q158 166 166 188 Z;M150 188 Q157 162 166 188 Z;M150 188 Q159 168 166 188 Z;M150 188 Q158 166 166 188 Z" dur="0.9s" repeatCount="indefinite"/></path>
      <path d="M154 188 Q158 174 162 188 Z" fill="#fff3a0"/>`;
  const shelf = `<rect x="232" y="96" width="112" height="4" fill="#8a5a32"/><rect x="232" y="122" width="112" height="4" fill="#8a5a32"/>
    <path d="M234 96 V130 M342 96 V130" stroke="#5a3b24" stroke-width="2"/>
    ${st.found.map((g, k) => { const x = 236 + (k % 6) * 17.5, y = k < 6 ? 79 : 105;
      return `<svg x="${x}" y="${y}" width="16" height="16" viewBox="0 0 24 24">${g ? gemFn(g.color, 24, "", g.cut).replace(/^<svg[^>]*>|<\/svg>$/g, "") : `<circle cx="12" cy="13" r="6" fill="#000" opacity=".3"/><text x="12" y="16" font-size="9" text-anchor="middle" fill="#8a7a5a">?</text>`}</svg>`; }).join("")}`;
  const sign = `<path d="M22 196 V128" stroke="#6b4a2a" stroke-width="4"/>${st.mines.map((col, k) => {
    const y = 132 + k * 10, right = k % 2 === 0;
    return `<path d="${right ? `M22 ${y} H48 L53 ${y + 4} L48 ${y + 8} H22 Z` : `M22 ${y} H-2 L-7 ${y + 4} L-2 ${y + 8} H22 Z`}" fill="#a0703f" stroke="#5a3b24" stroke-width=".8"/><circle cx="${right ? 40 : 6}" cy="${y + 4}" r="2.4" fill="${col}"/>`; }).join("")}`;
  const d = st.decor;
  return `<svg class="campArt" viewBox="0 0 ${W} ${H}" width="100%" aria-label="Dibble's camp">
    <defs><linearGradient id="campSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1d15"/><stop offset="1" stop-color="#1d3b2a"/></linearGradient></defs>
    <rect width="${W}" height="${H}" rx="14" fill="url(#campSky)"/>
    <g fill="#fff" opacity=".5">${[[30, 14], [90, 24], [170, 10], [250, 20], [330, 12], [210, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9"/>`).join("")}</g>
    <path d="M0 120 L20 40 L40 120 Z M320 120 L340 34 L360 120 Z" fill="#11281b"/><path d="M28 120 L40 70 L52 120 Z M306 120 L318 76 L330 120 Z" fill="#173322"/>
    <path d="M0 150 Q180 118 360 150 V${H} H0 Z" fill="#244a2e"/><ellipse cx="180" cy="196" rx="150" ry="30" fill="#2f5a36"/>
    <path d="M${sagX(0)} ${sagY(0)} ${[...Array(29)].map((_, k) => `L${sagX((k + 1) / 29)} ${sagY((k + 1) / 29)}`).join(" ")}" stroke="#5a4a3a" stroke-width="1.2" fill="none"/>${lanterns}
    ${tree}${shelf}${tents}
    <path d="M124 196 V112" stroke="#6b4a2a" stroke-width="2.4"/><path d="M125 114 H150 L144 123 L150 132 H125 Z" fill="${st.banner}"/>
    ${d.hammock ? `<path d="M318 122 V196 M262 140 V196" stroke="#5a3b24" stroke-width="3"/><path d="M262 148 Q290 176 318 130" stroke="#e8d6aa" stroke-width="5" fill="none"/>` : ""}
    <rect x="280" y="176" width="64" height="6" rx="2" fill="#5a3b24"/><path d="M284 182 L278 198 M340 182 L346 198" stroke="#5a3b24" stroke-width="3"/>${picks}
    ${st.lens ? `<g transform="translate(300 160) scale(.9)">${ICONS.lens}</g>` : ""}${st.tongs ? `<g transform="translate(318 158) scale(.9)">${ICONS.tongs}</g>` : ""}${st.sieve ? `<g transform="translate(86 112) scale(.9)">${ICONS.sieve}</g>` : ""}
    ${fire}${sign}
    ${d.mushrooms ? `<g>${[[96, 200, 7], [108, 204, 5], [86, 206, 4]].map(([x, y, r]) => `<rect x="${x - 1}" y="${y - 2}" width="2" height="${r}" fill="#e2d8f0"/><path d="M${x - r} ${y - 1} Q${x} ${y - r * 1.6} ${x + r} ${y - 1} Z" fill="#9b7cf2"/><circle cx="${x}" cy="${y - r * .6}" r="${r * 1.5}" fill="#9b7cf2" opacity=".2"/>`).join("")}</g>` : ""}
    ${d.jars ? `<rect x="214" y="186" width="22" height="10" rx="3" fill="#6b4a2a"/><g transform="translate(212 166) scale(.9)">${ICONS.jar}</g><g transform="translate(226 168) scale(.75)">${ICONS.jar}</g>` : ""}
    ${d.cart ? `<g transform="translate(246 186) scale(1.6)">${ICONS.cart}</g>` : ""}
    ${d.flies ? [...Array(8)].map((_, k) => `<circle cx="${40 + k * 40}" cy="${80 + (k % 3) * 20}" r="1.6" fill="#fff3a0"><animate attributeName="opacity" values="0;1;0" dur="${2 + k % 3}s" begin="${-k * .4}s" repeatCount="indefinite"/></circle>`).join("") : ""}
    <svg x="160" y="150" width="46" height="46" viewBox="0 0 100 100">${dibbleSvg.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>
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

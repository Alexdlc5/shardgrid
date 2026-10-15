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
  back: `<path d="M15 5 L8 12 L15 19" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
};
export const icon = (name, size = 22) => svg(size, "0 0 24 24", ICONS[name]);

export function pip(size = 96) {
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
    <rect x="75" y="51" width="10" height="13" rx="2.5" fill="#f7d77a" stroke="#6b5a3a" stroke-width="1.5"/><circle cx="80" cy="57.5" r="2.5" fill="#fff"/>`, "pip");
}

export function bramble(size = 64) {
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
    <circle cx="68" cy="42" r="8" fill="none" stroke="#c9b48a" stroke-width="1.6"/>`, "bramble");
}

// little cave scene per mine: arch, hanging roots, crystal clusters in the mine's colours
export function scene(colors, pal, w = 92, h = 60) {
  const xtal = (x, y, sz, c) => `<polygon points="${x},${y} ${x - sz * .45},${y - sz * .55} ${x},${y - sz * 1.3} ${x + sz * .45},${y - sz * .55}" fill="${c}"/>
    <polygon points="${x},${y} ${x},${y - sz * 1.3} ${x + sz * .45},${y - sz * .55}" fill="#000" opacity=".2"/>`;
  return `<svg class="scene" width="${w}" height="${h}" viewBox="0 0 92 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="92" height="60" rx="10" fill="${pal.bg}"/>
    <circle cx="46" cy="42" r="30" fill="${pal.glow}" opacity=".22"/>
    <path d="M10 60 Q10 14 46 12 Q82 14 82 60 Z" fill="${pal.cave}"/>
    <path d="M22 18 Q24 30 20 38 M34 12 Q36 22 33 28 M60 13 Q58 24 62 32 M72 20 Q70 28 74 34" stroke="${pal.root}" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${pal.snow ? `<g fill="#e6f6ff" opacity=".8"><circle cx="20" cy="10" r="1.3"/><circle cx="70" cy="8" r="1"/><circle cx="58" cy="20" r="1.2"/><circle cx="30" cy="24" r="1"/></g>` : ""}
    ${pal.caps ? `<g><path d="M14 54 Q18 46 22 54 Z" fill="${pal.glow}"/><path d="M70 55 Q75 45 80 55 Z" fill="${pal.glow}"/><rect x="17.3" y="54" width="1.4" height="4" fill="#cfc6e8"/><rect x="74.3" y="55" width="1.4" height="4" fill="#cfc6e8"/></g>` : ""}
    <ellipse cx="46" cy="60" rx="40" ry="8" fill="${pal.ground}"/>
    ${xtal(30, 56, 16, colors[0])}${xtal(40, 56, 24, colors[1 % colors.length])}${xtal(52, 57, 18, colors[2 % colors.length])}${xtal(62, 56, 12, colors[3 % colors.length])}
  </svg>`;
}

// the world behind the menus: layered forest, the mine entrance Pip works from, ferns in front
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

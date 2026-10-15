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

export function gem(color, size = 22, glyph = "") {
  const lt = mix(color, "#ffffff", .5), dk = mix(color, "#000000", .3);
  return svg(size, "0 0 24 24", `
    <polygon points="4,9 8,4 16,4 20,9" fill="${lt}"/>
    <polygon points="4,9 20,9 12,21" fill="${color}"/>
    <polygon points="12,9 20,9 12,21" fill="${dk}" opacity=".55"/>
    <polyline points="8,4 10,9 12,4 14,9 16,4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
    <polyline points="4,9 12,21 20,9" fill="none" stroke="#000" stroke-opacity=".25" stroke-width=".8"/>
    ${shimmer('<polygon points="4,9 8,4 16,4 20,9 12,21"/>')}
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
export function scene(colors, warm = false, w = 92, h = 60) {
  const bg = warm ? "#3a1f17" : "#1f3a28", cave = warm ? "#1c0f0b" : "#101c14", root = warm ? "#6b2f22" : "#5a4a32";
  const xtal = (x, y, s, c) => `<polygon points="${x},${y} ${x - s * .45},${y - s * .55} ${x},${y - s * 1.3} ${x + s * .45},${y - s * .55}" fill="${c}"/>
    <polygon points="${x},${y} ${x},${y - s * 1.3} ${x + s * .45},${y - s * .55}" fill="#000" opacity=".2"/>`;
  return `<svg class="scene" width="${w}" height="${h}" viewBox="0 0 92 60" aria-hidden="true">
    <rect width="92" height="60" rx="10" fill="${bg}"/>
    ${warm ? `<circle cx="46" cy="44" r="30" fill="#ff6a3d" opacity=".22"/>` : `<circle cx="46" cy="40" r="28" fill="#8fd18b" opacity=".08"/>`}
    <path d="M10 60 Q10 14 46 12 Q82 14 82 60 Z" fill="${cave}"/>
    <path d="M22 18 Q24 30 20 38 M34 12 Q36 22 33 28 M60 13 Q58 24 62 32 M72 20 Q70 28 74 34" stroke="${root}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="46" cy="60" rx="40" ry="8" fill="${warm ? "#2a1610" : "#2f5a2f"}"/>
    ${xtal(30, 56, 16, colors[0])}${xtal(40, 56, 24, colors[1 % colors.length])}${xtal(52, 57, 18, colors[2 % colors.length])}${xtal(62, 56, 12, colors[3 % colors.length])}
  </svg>`;
}

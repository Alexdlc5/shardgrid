// Glimmerwood menu art: every picture is inline SVG drawn in code (no image files until the look is approved).
import { dibbleBody, puddockBody, rng, curve, ring, shape, stroke, limb, shard, shardCluster, pieEye } from "./paint.js";
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

// Gems are cut stones, painted like the board's crystals: every vertex nudged a little (the same nudge wherever a vertex
// repeats, so facets still meet), circles drawn by hand, a darker copy peeking out down-left instead of an ink outline.
const nudge = (x, y) => { const h = (t) => { const v = Math.sin(t) * 43758.5453; return (v - Math.floor(v) - .5) * .7; }; return [+x + h(x * 12.99 + y * 78.23), +y + h(x * 39.35 + y * 11.13)]; };
const pts = (list) => list.trim().split(/\s+/).map((q) => nudge(...q.split(",")).map((v) => v.toFixed(2)).join(" ")).join(" L");
const rough = (frag) => frag
  .replace(/<polygon points="([^"]+)"/g, (m, l) => `<path d="M${pts(l)} Z"`).replace(/<polyline points="([^"]+)"/g, (m, l) => `<path d="M${pts(l)}"`)
  .replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g, (m, x, y, r) => `<path d="${curve(ring(+x, +y, +r, +r, 12, .05, (+x * 7 + +r * 13) | 0))}"`)
  .replace(/<ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g, (m, x, y, rx, ry) => `<path d="${curve(ring(+x, +y, +rx, +ry, 12, .05, (+x * 7 + +rx * 13) | 0))}"`);
const ROUGH = Object.fromEntries(Object.entries(CUTS).map(([k, v]) => [k, { o: rough(v.o), d: (c, lt, dk) => rough(v.d(c, lt, dk)) }]));
export function gem(color, size = 22, glyph = "", cut = "brilliant") {
  const k = ROUGH[cut] || ROUGH.brilliant, lt = mix(color, "#fff6e0", .45), dk = mix(color, "#0e1c1a", .35);
  return svg(size, "0 0 24 24", `<g fill="${mix(color, "#1a0f08", .55)}" transform="translate(-.8 .7)">${k.o}</g>${k.d(color, lt, dk)}
    ${shimmer(k.o)}<path d="${curve(ring(9.2, 7.8, .9, .7, 6, .25, 5, -.6))}" fill="#fffaf0" opacity=".85"/>
    ${glyph ? `<text x="12" y="15" font-size="6" text-anchor="middle" fill="#1a1a0f" opacity=".6">${glyph}</text>` : ""}`, "gem");
}

export const coin = (size = 18) => svg(size, "0 0 24 24", `
  ${I(R(12, 12, 9.8, 9.6, 71, 0, .04, 14), "#d99a2e", [-.8, .7])}<path d="${R(13.4, 13.6, 6.6, 6.2, 72, 0, .12)}" fill="#a8681a" opacity=".35"/>
  <path d="${R(10.4, 10.2, 5.4, 5, 73, 0, .14)}" fill="#ffe08a" opacity=".6"/>
  <path d="${donut(R(12, 12, 7.3, 7.1, 74), ring(12, 12, 6.2, 6.1, 10, .05, 75))}" fill="#a8681a" fill-rule="evenodd" opacity=".55"/>
  ${I(star(12, 12, 3.7, 1.4, 4, 76), "#fff0b8", [-.35, .35])}${hl([[6.2, 8.8], [8.4, 5.9], [12, 4.6]], 1.2, .75, "#fffbe8")}
  ${shimmer('<circle cx="12" cy="12" r="10"/>')}`, "coin");

// ---------- UI icons, painted like the rest of the world (24-box) ----------
// Hand-built shapes from paint.js, a darker edge peeking out down-left, one warm highlight. No stock circles,
// rects or polygons. Glyph icons (sound, gear, back...) stay one colour (currentColor) but are hand-drawn too.
const I = (d, c, o = [-.55, .5], extra = "") => shape(d, c, mix(c, "#1a0f08", .55), o, extra);
const R = (x, y, rx, ry, seed, rot = 0, j = .08, n = 10) => curve(ring(x, y, rx, ry, n, j, seed, rot));
const halo = (x, y, r, c, op = .22, seed = 1) => `<path d="${R(x, y, r, r * .95, seed, 0, .14)}" fill="${c}" opacity="${(op * .45).toFixed(2)}"/><path d="${R(x, y, r * .6, r * .58, seed + 1, 0, .14)}" fill="${c}" opacity="${op}"/>`;
const ln = (pts, c, w, extra = "") => `<path d="${curve(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const hl = (pts, w = .9, op = .7, c = "#fff8e0") => ln(pts, c, w, `opacity="${op}"`);
const donut = (outer, inner) => `${outer} ${curve(inner.reverse())}`; // even-odd ring: outer path, then the inner ring wound backwards
// a hand-drawn box: corners softened, edges not quite straight (k bows the top and bottom)
const box = (x1, y1, x2, y2, k = .3) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, c = Math.min(x2 - x1, y2 - y1) * .12;
  return curve([[x1 + c, y1], [mx, y1 - k], [x2 - c, y1 + .1], [x2, y1 + c], [x2 + .15, my], [x2 - .1, y2 - c], [x2 - c, y2], [mx, y2 + k], [x1 + c, y2 - .1], [x1, y2 - c], [x1 - .15, my], [x1 + .1, y1 + c]]); };
const leafAt = (x, y, a, l, w, c) => { const P = (u, v) => [x + Math.cos(a) * u - Math.sin(a) * v, y + Math.sin(a) * u + Math.cos(a) * v];
  return I(curve([P(0, 0), P(l * .45, -w), P(l, 0), P(l * .45, w * .8)]), c, [-.4, .35]); };
const star = (x, y, r1, r2, n, seed) => { const r = rng(seed); return curve([...Array(n * 2)].map((_, k) => { const a = k / (n * 2) * Math.PI * 2 - Math.PI / 2, rr = (k % 2 ? r2 : r1) * (.9 + r() * .2);
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; })); };
const ICONS = {
  lantern: `${halo(12, 14, 10, "#f0b543", .26, 3)}${ln([[8.6, 5.4], [12, 1.8], [15.4, 5.4]], "#8a7550", 1.2)}
    ${I(curve([[8, 8], [16, 7.8], [16.6, 13.5], [15.8, 19], [8.2, 19.2], [7.4, 13.5]]), "#f7d77a")}<path d="${R(12, 13.8, 2.3, 3.2, 5)}" fill="#fff6c8"/>
    ${ln([[10, 8.6], [9.7, 13.6], [9.9, 18.6]], "#b08a40", .7)}${ln([[14, 8.6], [14.3, 13.6], [14.1, 18.6]], "#b08a40", .7)}
    ${I(curve([[7, 5.2], [17, 5], [17.4, 7.8], [6.6, 8]]), "#6b5a3a")}${I(curve([[6.8, 19], [17.2, 18.8], [17.4, 21.6], [6.6, 21.8]]), "#6b5a3a")}${hl([[8.8, 10], [8.6, 14.4]], .9, .6)}`,
  pickaxe: `${I(limb(5, 21.4, 9.6, 15.4, 15.4, 9.2, 1.6, 1.1), "#a0703f")}${hl([[6.4, 19], [10, 14.8]], .6, .4, "#e8c08a")}
    ${I(curve([[3.4, 9], [6.8, 5.2], [12.4, 3.2], [18.4, 3.8], [21.6, 7.6], [17.2, 6.4], [12.8, 6.6], [8.4, 8.4], [5, 11]]), "#aeb8bf")}
    ${hl([[7, 6.4], [11.8, 4.6], [17, 4.8]], .8, .75, "#f2f7f8")}${ln([[13.2, 8.8], [16.4, 6.4]], "#5a3b24", 1.2)}`,
  charm: `<path d="${donut(R(12, 13.4, 7.4, 7.2, 7), ring(12, 13.4, 4.6, 4.4, 10, .08, 8))}" fill="#3a2418" fill-rule="evenodd" transform="translate(-.55 .5)"/>
    <path d="${donut(R(12, 13.4, 7.4, 7.2, 7), ring(12, 13.4, 4.6, 4.4, 10, .08, 8))}" fill="#8a5a32" fill-rule="evenodd"/>${hl([[6.4, 10.6], [8.4, 7.4], [11.4, 6.2]], .9, .45, "#e8c08a")}
    ${ln([[12, 11.6], [9.2, 9.4], [9.6, 6.8]], "#8a5a32", 1.1)}${ln([[12, 11.6], [14.8, 9.4], [14.4, 6.8]], "#8a5a32", 1.1)}
    ${I(curve([[12, 6.4], [9.4, 3.6], [11, 1.2], [14.2, 2.4], [13.4, 5.4]]), "#7cc46a")}${I(R(12, 13.8, 2.3, 2.2, 9), "#7cc46a")}${hl([[11, 13], [11.8, 12.4]], .7, .8)}`,
  map: `${I(curve([[3, 6.4], [9, 4], [15, 6], [21.2, 3.8], [21, 11], [21.4, 18], [15, 20.2], [9, 18], [2.8, 20.2], [3.2, 13]]), "#e8d6aa")}
    ${ln([[9, 4.4], [9.3, 11], [9, 17.6]], "#8a6d3b", .7, 'opacity=".55"')}${ln([[15, 6.4], [14.7, 13], [15, 19.8]], "#8a6d3b", .7, 'opacity=".55"')}
    ${ln([[5, 16.4], [8, 11.4], [11.2, 12.8], [14, 10.2], [16.8, 8.4]], "#c8553d", 1.2, 'stroke-dasharray="1.6 1.8"')}
    ${ln([[16.8, 5.4], [19.4, 8.2]], "#c8553d", 1.5)}${ln([[19.6, 5.6], [16.6, 8]], "#c8553d", 1.5)}`,
  fireflies: `${[[7, 9, 2], [17, 7, 1.6], [13, 17, 2]].map(([x, y, r], k) => halo(x, y, r * 2.6, "#fff3a0", .3, 10 + k) + `<path d="${R(x, y, r, r * .8, 13 + k, .5, .15, 7)}" fill="#fff3a0"/>`).join("")}
    ${ln([[3, 21.4], [7, 16.4], [12, 18.6], [16.4, 15.6], [21, 14.4]], "#7cc46a", 1.8)}${stroke(7, 16.4, -2.2, 3.6, .7, "#7cc46a")}${stroke(16.4, 15.6, -1.1, 3, .6, "#7cc46a")}`,
  dewdrop: `${I(curve([[12, 2.6], [15.4, 8], [18.2, 12.8], [17.4, 17.6], [12, 20.8], [6.6, 17.6], [5.8, 12.8], [8.6, 8]]), "#7fd1e8")}
    <path d="${R(10, 16.4, 4, 3, 21)}" fill="#3f8fae" opacity=".3"/>${hl([[8.8, 14.6], [9, 11.6], [10.8, 9]], 1.2, .85, "#ffffff")}`,
  soundOn: `<path d="${curve([[4, 9.4], [8.2, 9.2], [13, 5], [13.4, 12], [13, 19], [8.2, 14.8], [4, 14.6]])}" fill="currentColor"/>
    ${ln([[16, 9], [17.8, 12], [16, 15]], "currentColor", 1.6)}${ln([[18.6, 6.8], [21.8, 12], [18.6, 17.2]], "currentColor", 1.6)}`,
  soundOff: `<path d="${curve([[4, 9.4], [8.2, 9.2], [13, 5], [13.4, 12], [13, 19], [8.2, 14.8], [4, 14.6]])}" fill="currentColor"/>
    ${ln([[16, 9.2], [21, 14.8]], "currentColor", 1.8)}${ln([[21, 9], [16.2, 15]], "currentColor", 1.8)}`,
  vibe: `<path d="${donut(curve([[8, 3.2], [16, 3], [16.5, 12], [16, 21], [8, 21.2], [7.5, 12]]), [[9.6, 5], [14.4, 4.9], [14.6, 12], [14.4, 19.2], [9.6, 19.3], [9.4, 12]])}" fill="currentColor" fill-rule="evenodd"/>
    ${ln([[4, 8], [2.2, 10], [4, 12], [2.2, 14], [4, 16]], "currentColor", 1.4)}${ln([[20, 8], [21.8, 10], [20, 12], [21.8, 14], [20, 16]], "currentColor", 1.4)}`,
  symbols: `<path d="${R(7, 8, 3, 3, 23)}" fill="currentColor"/><path d="M17 3.4 Q19.4 7.4 21.4 11.2 Q17 11.6 12.6 11.2 Q14.8 7.4 17 3.4 Z" fill="currentColor"/>
    <path d="${curve([[12, 12.8], [16.2, 17], [12, 21.2], [7.8, 17]])}" fill="currentColor"/>`,
  calendar: `${I(box(3.2, 5.8, 20.8, 21), "#efe6cf")}
    ${I(curve([[3.2, 6], [12, 5.4], [20.8, 6], [20.9, 10], [12, 10.4], [3.1, 10]]), "#c8553d", [-.4, .4])}
    ${ln([[8, 3], [8.2, 7.4]], "#5a4a3a", 2)}${ln([[16, 3], [15.8, 7.4]], "#5a4a3a", 2)}${I(star(12, 15.6, 3.6, 1.5, 4, 25), "#c9a24a", [-.4, .4])}`,
  vine: `${ln([[4, 20.4], [4.6, 13], [8, 9], [12, 8], [17.4, 7.4], [20, 4]], "#7cc46a", 2.2)}${leafAt(6.4, 12.4, -2.4, 6, 2, "#7cc46a")}${leafAt(14, 7.8, -.7, 6, 2, "#5fa04e")}
    ${I(R(20, 4, 2, 1.9, 27), "#d6453d", [-.4, .4])}${hl([[19.2, 3.4], [19.8, 3]], .6, .8)}`,
  leaf: `${I(curve([[4, 20.4], [4.4, 12], [9, 6.4], [19.6, 3.6], [18, 12], [12.6, 17.6]]), "#7cc46a")}${ln([[5, 19.4], [11, 12.4], [16.4, 7]], "#2f6b33", 1.2)}
    ${[[8, 15.6, -2.4], [10.6, 12.6, -2.5], [13.4, 9.8, -2.6], [9.4, 14, .8], [12.4, 11, .7]].map(([x, y, a]) => stroke(x, y, a, 3, .4, "#2f6b33", .7, .1)).join("")}${hl([[8, 8.4], [12.4, 5.6]], .8, .4)}`,
  lock: `${ln([[8, 10.6], [7.8, 7], [12, 3.4], [16.2, 7], [16, 10.6]], "#a8925e", 2.4)}
    ${I(box(5, 10.2, 19, 21.2), "#c9b48a")}
    ${I(R(12, 14.6, 1.8, 1.7, 29), "#5a4a3a", [-.3, .3])}${ln([[12, 15.4], [11.9, 18]], "#5a4a3a", 1.3)}${hl([[6.6, 12], [6.4, 16]], .8, .45)}`,
  stall: `${I(box(5, 10.8, 19, 20.4), "#8a5a32")}${ln([[5.6, 14], [18.4, 13.8]], "#5a3b24", .6, 'opacity=".6"')}${I(R(10, 15.4, 2, 1.9, 31), "#f0b543", [-.4, .4])}${I(R(14.2, 16.4, 1.6, 1.5, 32), "#8fd18b", [-.4, .4])}
    ${I("M3 9.2 Q4 6 5.2 4 Q12 3.4 18.8 4 Q20 6 21 9.2 Q12 9.8 3 9.2 Z", "#c8553d")}
    <path d="M3 9.2 Q5 11.4 7 9.4 Q9 11.4 11 9.4 Q13 11.4 15 9.4 Q17 11.4 19 9.4 Q20 10.4 21 9.2" fill="#efe6cf"/>`,
  ad: `<path d="${R(12, 12, 10, 10, 33, 0, .04, 12)}" fill="currentColor" opacity=".25"/><path d="${curve([[10, 7.8], [16.4, 12], [10, 16.2]])}" fill="currentColor"/>`,
  board: [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => I(R(5.8 + c * 6.2, 5.8 + r * 6.2, 2.7, 2.6, 35 + r * 3 + c, .1, .14, 7), (r + c) % 2 ? "#8fd18b" : "#a6dfa0", [-.4, .4]))).join(""),
  regrow: `${I(limb(12, 21.4, 11.4, 16, 12.2, 10.6, 1.3, .9), "#5fa04e")}${leafAt(12, 14, -2.6, 7.4, 2.8, "#7cc46a")}${leafAt(12.2, 11, -.6, 7.4, 2.8, "#9be08a")}`,
  shatter: `${I(star(12, 12, 9.4, 3, 4, 39), "#f0b543")}${hl([[11, 6], [11.6, 9.6]], .8, .7)}`,
  tent: `${I("M12 2.6 Q16.6 11 22 20 Q12 20.8 2 20 Q7.4 11 12 2.6 Z", "#e8d6aa")}${ln([[12, 3.2], [12.2, 12], [12, 20.2]], "#8a6d3b", .9)}
    ${I("M12 11 Q10 15.6 8.8 20.2 Q12 20.6 15.2 20.2 Q14 15.6 12 11 Z", "#5a3b24", [-.3, .3])}${hl([[13.6, 6.4], [17, 12.6]], .8, .45)}`,
  banner: `${I(limb(5.2, 22, 5, 12, 5.2, 2, 1.1, .8), "#8a6d3b", [-.4, .4])}<path d="M6 4 Q12 3.2 19 4.2 Q16.6 8.4 19 13 Q12 12 6 13 Z" fill="currentColor"/>
    <path d="M6 4 Q12 3.2 19 4.2 L17.8 6.4 Q12 5.6 6 6.6 Z" fill="#ffffff" opacity=".18"/>`,
  mushroom: `${I(limb(12, 21.4, 11.2, 16.6, 12.2, 12.2, 2.3, 1.8), "#e8dcc8")}${I("M3.6 12.6 Q4.8 3.6 12 2.6 Q19.2 3.6 20.4 12.6 Q12 13.8 3.6 12.6 Z", "#9b7cf2")}
    ${[[8.6, 7.8, 1.4], [14.8, 6.6, 1.1], [16.6, 10, .8]].map(([x, y, r], k) => `<path d="${R(x, y, r, r * .85, 41 + k)}" fill="#fff" opacity=".8"/>`).join("")}`,
  jar: `${I(curve([[7.4, 7.4], [16.6, 7.2], [17.6, 13], [16.8, 20.6], [12, 21.2], [7.2, 20.6], [6.4, 13]]), "#9fd7c8", [-.55, .5], 'opacity=".55"')}
    ${halo(11, 13.4, 3.6, "#fff3a0", .35, 43)}<path d="${R(11, 13.4, 1.5, 1.3, 45)}" fill="#fff3a0"/><path d="${R(14, 17, 1.2, 1.1, 46)}" fill="#fff3a0"/>
    ${I(curve([[7.8, 4.2], [16.2, 4], [16.4, 7.2], [7.6, 7.4]]), "#8a6d3b")}${hl([[8.4, 10], [8.2, 16]], .9, .55)}`,
  forge: `${ln([[7, 3.6], [6.2, 1.8], [7.4, .4]], "#c9c2b6", .8, 'opacity=".5"')}${I(curve([[5, 3.8], [9, 3.6], [9.2, 10], [5.2, 10.2]]), "#5e5850")}
    ${I(box(3, 9.4, 21, 21.2), "#7a746a")}${ln([[3.6, 13], [8, 12.8]], "#5e5850", .6)}${ln([[16, 13.2], [20.4, 13]], "#5e5850", .6)}
    ${halo(12, 17, 6, "#ff8a3d", .3, 47)}${I("M8 21 V15.6 Q12 10.6 16 15.6 V21 Z", "#ff8a3d", [-.3, .3])}<path d="M10 21 Q12 15 14 21 Z" fill="#fff3a0" opacity=".8"/>`,
  cart: `${I(curve([[3, 5.4], [21, 5], [21.2, 8.2], [2.8, 8.4]]), "#c8553d")}${I("M3 8.8 Q12 8.4 21 8.8 L19.6 17.2 Q12 17.6 4.4 17.2 Z", "#8a5a32")}
    ${ln([[5, 12.6], [19, 12.2]], "#5a3b24", .7, 'opacity=".7"')}
    ${[8, 16].map((x, k) => I(R(x, 19.4, 2.6, 2.5, 49 + k), "#3a2a1a", [-.3, .3]) + ln([[x - 1.8, 19.4], [x + 1.8, 19.4]], "#6b5a3a", .5) + ln([[x, 17.6], [x, 21.2]], "#6b5a3a", .5)).join("")}`,
  hammock: `${I(limb(3, 21.6, 3.2, 13, 3, 4.4, 1.1, .9), "#5a3b24", [-.3, .3])}${I(limb(21, 21.6, 20.8, 13, 21, 4.4, 1.1, .9), "#5a3b24", [-.3, .3])}
    ${I(curve([[3.6, 8.8], [12, 18.8], [20.4, 8.8], [12, 15.4]]), "#e8d6aa")}${ln([[6, 11.6], [12, 16.6], [18, 11.6]], "#c8553d", .6, 'opacity=".7"')}`,
  lens: `${I(limb(14.8, 14.8, 18, 18, 21.2, 21.2, 1.7, 1.4), "#8a5a32")}<path d="${R(10, 10, 5.4, 5.3, 51)}" fill="#bfefff" opacity=".4"/>
    <path d="${donut(R(10, 10, 7, 6.9, 52), ring(10, 10, 5.2, 5.1, 10, .06, 53))}" fill="#c9a24a" fill-rule="evenodd"/>${hl([[7, 8.4], [8, 6.6], [10, 6]], 1.1, .85, "#ffffff")}`,
  tongs: `${halo(16.6, 5, 5, "#ff6a3d", .25, 55)}${I(limb(6, 21.4, 9.4, 13, 14, 6.4, 1.1, .8), "#6f7c87", [-.3, .3])}${I(limb(10, 21.4, 12.6, 13.6, 16.2, 7.2, 1.1, .8), "#6f7c87", [-.3, .3])}
    ${I(R(16.6, 5, 3, 2.7, 57, .4, .18, 8), "#ff6a3d", [-.4, .4])}${hl([[15.6, 4], [16.8, 3.4]], .7, .8, "#fff3a0")}`,
  sieve: `${I(R(12, 12.4, 9, 5, 59), "#8a5a32")}${I(R(12, 11.4, 7.4, 3.5, 60), "#c9b48a", [-.3, .3])}
    ${[[9, 11], [12, 10], [15, 11], [10.8, 12.4], [13.8, 12.2]].map(([x, y], k) => `<path d="${R(x, y, .7, .6, 61 + k, 0, .2, 6)}" fill="#8a5a32"/>`).join("")}
    ${I(curve([[18, 15.6], [20.4, 19.2], [15.8, 19.4]]), "#b06ad8", [-.3, .3])}`,
  ticket: `${I("M3 7 Q12 6.4 21 7 V10 A2 2 0 0 0 21 14 V17 Q12 17.6 3 17 V14 A2 2 0 0 0 3 10 Z", "#f0b543")}${ln([[8, 7.4], [8.2, 12], [8, 16.8]], "#8a5a1a", .8, 'stroke-dasharray="1.4 1.6"')}
    ${I(star(14.6, 12, 2.6, 1.1, 4, 63), "#fff3c0", [-.3, .3])}`,
  campIco: `${halo(18, 18.4, 4, "#ff8a3d", .3, 65)}${I("M3 20.2 Q6.4 13 10 6 Q13.6 13 17 20.2 Q10 20.8 3 20.2 Z", "#e8d6aa")}${I("M10 13 Q8.8 16.6 8 20.4 Q10 20.8 12 20.4 Q11.2 16.6 10 13 Z", "#5a3b24", [-.3, .3])}
    ${I("M15.8 20.4 Q16 16.8 18 14.4 Q20 16.8 20.2 20.4 Q18 21 15.8 20.4 Z", "#ff8a3d", [-.3, .3])}<path d="M17.2 20.4 Q17.6 18 18 17 Q18.4 18 18.8 20.4 Z" fill="#fff3a0"/>`,
  note: `${ln([[9, 18], [9.1, 11], [9, 5], [14, 4], [19, 3], [19.1, 9.6], [19, 16]], "currentColor", 1.8)}<path d="${R(7, 18, 3, 2.3, 67, -.4)}" fill="currentColor"/><path d="${R(17, 16, 3, 2.3, 68, -.4)}" fill="currentColor"/>`,
  back: ln([[15, 5], [11.4, 8.6], [8, 12], [11.4, 15.4], [15, 19]], "currentColor", 2.4),
  gear: `<path d="${donut(curve([...Array(32)].map((_, k) => { const a = (k / 32) * Math.PI * 2 - Math.PI / 32, rr = k % 4 < 2 ? 9.8 : 7.2; return [12 + Math.cos(a) * rr, 12 + Math.sin(a) * rr]; })), ring(12, 12, 3.2, 3.1, 10, .06, 69))}" fill="currentColor" fill-rule="evenodd"/>`,
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
export const FUR = { silver: ["#b8aea4", "#958a80"], cocoa: ["#8a5a44", "#6b4232"], sand: ["#c49a6c", "#a07a50"], slate: ["#7a7584", "#5c5866"], snow: ["#eee6dc", "#cbbfb1"], rosewood: ["#a86a5e", "#87504a"] };
export const LANTERN_GLOW = { amber: "#f0b543", granny: "#e8f0a0", crystal: "#9fe6ff", jar: "#fff3a0", paper: "#ff9a7a" };
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
  if (kind === "granny") return `<defs>${defs}<radialGradient id="${id}g"><stop offset="0" stop-color="#fbffe6"/><stop offset=".55" stop-color="#e2ea9a"/><stop offset="1" stop-color="#9aa84a"/></radialGradient></defs>
    <path d="M74.6 57.5 Q80 54.5 85.4 57.5 V70 H74.6 Z" fill="url(#${id}g)" stroke="${ml}" stroke-width="1.2"/>${frame(73.2, 53.6, 13.6, 3.2)}${frame(73.8, 70, 12.4, 2.6)}
    <path d="M77.2 57 V70 M80 56 V70 M82.8 57 V70" stroke="${ml}" stroke-width=".7" opacity=".6"/><circle cx="80" cy="63.4" r="2" fill="#fff"/><path d="M84 66 l-1.2 1.6 M83.4 64.6 q1 .8 0 1.6" stroke="#fff" stroke-width=".5" opacity=".6"/>`;
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
    scorch: `<path d="M8 40 L22 70 L18 56 Z M152 40 L138 70 L142 56 Z M30 30 L40 52 L36 44 Z M130 30 L120 52 L124 44 Z" fill="#ff6a3d" opacity=".55"/>
      ${motes(9, "#ffb15a", 1, "down", 13)}`,
    scales: `${[[30, 60, 20], [128, 56, -20], [80, 40, 0]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})" fill="#efe6fb" stroke="#3a2418" stroke-width=".6"><path d="M0 0 Q-7 -7 -10 -2 Q-9 2 0 1 Z M0 0 Q7 -7 10 -2 Q9 2 0 1 Z"/><ellipse cy="1" rx="1.3" ry="3"/></g>`).join("")}
      ${motes(16, "#f4f0ff", .8, "down", 17)}`,
    loom: `<circle cx="80" cy="30" r="20" fill="#f4f0ff" opacity=".15"/><circle cx="80" cy="30" r="10" fill="#f4f0ff"/>
      <path d="M70 30 L30 96 M90 30 L130 96 M80 40 V96 M74 36 L54 96 M86 36 L106 96" stroke="#f4f0ff" stroke-width=".6" opacity=".45"/>${motes(8, "#f4f0ff", .7, "up", 19)}`,
    lanterns: `${[...Array(8)].map((_, k) => { const a = k / 8 * Math.PI * 2, x = 80 + Math.cos(a) * 46, y = 44 + Math.sin(a) * 12;
      return `<circle cx="${x}" cy="${y}" r="6" fill="#f0b543" opacity=".25"/>${shape(curve([[x - 2.2, y - 3.4], [x + 2.2, y - 3.4], [x + 2.5, y + 3.4], [x - 2.5, y + 3.4]]), "#f7d77a", "#6a4a24", [-.4, .4])}`; }).join("")}
      <circle cx="80" cy="44" r="9" fill="#f4f0ff" opacity=".9"/>${motes(6, "#ffd27a", .8, "up", 23)}`,
    shaft: `<path d="M70 0 H90 L104 96 H56 Z" fill="#f4f0ff" opacity=".2"/><circle cx="80" cy="6" r="7" fill="#f4f0ff"/>
      ${[[40, 70, 14, 8], [104, 74, 16, 9], [62, 86, 12, 7]].map(([x, y, w, h]) => shape(curve(ring(x + w / 2, y + h / 2, w / 2, h / 2, 9, .12, x)), "#4a4a58", "#1a1a22", [-.7, .6])).join("")}
      ${motes(8, "#f4f0ff", .8, "down", 29)}`,
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
  const c = Math.min(st.charm, 15), trunk = 14 + c * 2.2, crown = 9 + c * .9, tx = 288, ty = 250, ct = ty - trunk; // the Root Charm sapling: planted on open ground right of the fire, not behind Dibble
  const lobe = (dx, dy, rr, col, seed) => shape(curve(ring(tx + dx * crown, ct + dy * crown, rr * crown, rr * crown * .9, 12, .14, seed)), col, "#1d3a19", [-1.4, 1.2]);
  const ringStones = [-9, -4.5, 0, 4.5, 9].map((dx, k) => shape(curve(ring(tx + dx, ty + 2.5 - Math.abs(dx) * .12, 2.6, 1.7, 8, .25, 80 + k)), k % 2 ? "#6a6458" : "#7a7366", "#2a2620", [-.5, .4])).join("");
  const tree = `${ringStones}${c >= 15 ? `<path d="${curve(ring(tx, ct - crown * .4, crown + 12, crown + 10, 10, .15, 90))}" fill="#9be08a" opacity=".2" filter="url(#campBlur)"><animate attributeName="opacity" values=".12;.28;.12" dur="3s" repeatCount="indefinite"/></path>` : ""}
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
    const y = 176 + k * Math.min(12, 70 / Math.max(1, st.mines.length - 1)), right = k % 2 === 0;
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
  const pine = (x, y, h, col) => paintPine(x, y, h, col, col === "#10261a" ? null : "#3a6a48", r);
  const moonSky = `${stars}<circle cx="320" cy="46" r="34" fill="url(#moonGlow)"/><path d="${curve(ring(320, 46, 13, 13, 14, .02, 5))}" fill="#fff6d8"/>
      <path d="${curve(ring(315, 43, 3, 2.6, 8, .2, 6))}" fill="#e8dcb8" opacity=".6"/><path d="${curve(ring(325, 51, 2, 1.8, 8, .2, 7))}" fill="#e8dcb8" opacity=".6"/>
      <path d="${curve(ring(120, 70, 60, 7, 12, .2, 8))}" fill="#cfd8c8" opacity=".06" filter="url(#campBlur)"/>`;
  const drift = (n, col, seed) => [...Array(n)].map((_, k) => { const x = (k * 71 + seed) % 400, d = 9 + (k % 5) * 2;
    return `<ellipse cx="${x}" rx="1.6" ry="1" fill="${col}"><animate attributeName="cy" values="-10;200" dur="${d}s" begin="${-k * 1.3}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;0" dur="${d}s" begin="${-k * 1.3}s" repeatCount="indefinite"/></ellipse>`; }).join("");
  const rootPillar = (x, w, col) => `<path d="M${x - w} 200 Q${x - w * .6} 120 ${x - w * 1.4} 0 H${x + w * 1.4} Q${x + w * .6} 120 ${x + w} 200 Z" fill="${col}"/><path d="M${x - w * .3} 190 Q${x} 110 ${x - w * .6} 10" stroke="#ff8a3d" stroke-width="1.2" fill="none" opacity=".35"/>`;
  const rock = (x, h, col) => `<path d="M${x - h * .3} 200 L${x - h * .2} ${200 - h} L${x} ${200 - h * 1.1} L${x + h * .22} ${200 - h * .9} L${x + h * .32} 200 Z" fill="${col}"/>`;
  const open = st.sky; // the Skywell, after the finale
  const S = {
    stump: { sky: ["#0a1510", "#173022", "#1d3b2a"], ground: ["#2a5434", "#16301e", "#2f5a36"], far: moonSky,
      mid: [10, 60, 300, 350, 395].map((x, k) => pine(x, 172, 110 + (k % 3) * 18, "#10261a")).join(""),
      near: `${pine(18, 190, 150, "#173322")}${pine(380, 190, 160, "#173322")}${pine(46, 186, 96, "#1b3a26")}${pine(352, 186, 100, "#1b3a26")}` },
    underroot: { sky: ["#0c0705", "#1e120b", "#2a1a10"], ground: ["#4a3424", "#22160e", "#5a4030"],
      far: `<path d="M0 0 H400 V40 Q300 70 200 50 Q100 70 0 40 Z" fill="#140c07"/>${[40, 120, 210, 290, 360].map((x, k) => `<path d="M${x} 40 Q${x + 6} ${70 + k * 6} ${x - 4} ${96 + k * 5}" stroke="#2a1a10" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}
        <circle cx="200" cy="140" r="120" fill="#f4f0ff" opacity=".05"/>${drift(18, "#f4f0ff", 17)}`,
      mid: `${rootPillar(30, 16, "#1c120b")}${rootPillar(370, 18, "#1c120b")}${rootPillar(300, 10, "#24170e")}`,
      near: `${rootPillar(8, 22, "#2a1b11")}${rootPillar(392, 22, "#2a1b11")}` },
    skywell: { sky: open ? ["#0c1024", "#1a1f3a", "#262a40"] : ["#08080c", "#15151f", "#22222e"], ground: ["#3a3a4a", "#1c1c26", "#45455a"],
      far: open ? `${stars}<path d="M150 0 H250 L300 300 H100 Z" fill="#f4f0ff" opacity=".1"/><circle cx="200" cy="34" r="40" fill="url(#moonGlow)"/><circle cx="200" cy="34" r="16" fill="#fff6d8"/>
          <path d="M0 0 H150 Q170 60 140 120 Q100 150 0 130 Z M400 0 H250 Q230 60 260 120 Q300 150 400 130 Z" fill="#101018"/>${drift(10, "#f4f0ff", 5)}`
        : `<path d="M0 0 H400 V120 Q300 150 200 130 Q100 150 0 120 Z" fill="#101018"/>${[[160, 40, 28, 16], [190, 30, 30, 18], [222, 44, 26, 15], [176, 60, 34, 16]].map(([x, y, w, h]) => shape(curve(ring(x + w / 2, y + h / 2, w / 2, h / 2, 10, .1, x)), "#24242e", "#0a0a10", [-1, .9])).join("")}
          <path d="M201 0 L198 30 L203 48 L199 76" stroke="#f4f0ff" stroke-width="1" opacity=".5"/>`,
      mid: `${rock(30, 120, "#16161e")}${rock(90, 70, "#1a1a24")}${rock(320, 90, "#1a1a24")}${rock(380, 130, "#16161e")}`,
      near: `${rock(10, 150, "#20202a")}${rock(394, 160, "#20202a")}` },
  }[st.site || "stump"];
  const puddockAt = !st.stall && st.puddockHere && !st.packed && !st.decor.cart && st.puddockSvg ? `<g data-tap="puddock"><svg x="262" y="206" width="46" height="46" viewBox="0 0 100 100">${strip(st.puddockSvg)}</svg></g>` : "";
  const grannyAt = st.grannySvg ? `<g data-tap="granny"><svg x="112" y="206" width="54" height="54" viewBox="0 0 100 100">${strip(st.grannySvg)}</svg></g>` : "";
  const packed = st.packed ? `<g transform="translate(278 236) scale(1.8)">${ICONS.cart}</g>
      ${st.puddockSvg ? `<g data-tap="puddock"><svg x="246" y="208" width="42" height="42" viewBox="0 0 100 100">${strip(st.puddockSvg)}</svg></g>` : ""}
      <g transform="translate(336 204) rotate(-4)"><path d="M0 4 V26" stroke="#5a3b24" stroke-width="2"/><rect x="-38" y="-10" width="76" height="15" rx="2" fill="#e8d6aa" stroke="#3a2418" stroke-width="1"/>
      <text x="0" y=".2" font-size="6.6" text-anchor="middle" fill="#3a2418" font-family="Fredoka, sans-serif" font-weight="600">Back soon (probably)</text></g>` : "";
  // ---- hub props: a clothes rack, the Daily Dig chalkboard, the stump (or the memory jar), Puddock's stall ----
  const tag = (x, y, text, w = 46) => `<g pointer-events="none">${plank(x - w / 2, y - 7, w, 13, "#8a5a32", r)}<text x="${x}" y="${y + 2.6}" font-size="8" text-anchor="middle" fill="#fff1d0" font-family="Fredoka, sans-serif" font-weight="600">${text}</text></g>`;
  const sc = st.rackScarf || "#c8553d";
  const rack = `<g data-tap="wardrobe"><rect x="10" y="296" width="82" height="106" fill="transparent"/>
    ${shape(limb(28, 396, 27, 362, 28, 326, 2, 1.6), "#6b4a2a", "#2e1e12", [-.6, .5])}${shape(limb(76, 396, 77, 362, 76, 326, 2, 1.6), "#6b4a2a", "#2e1e12", [-.6, .5])}
    ${plank(20, 324, 64, 4.5, "#8a5a32", r)}<path d="M40 324 q0 -4 3 -4 M59 324 q0 -4 3 -4" stroke="#3a2a1a" stroke-width=".8" fill="none"/>
    ${shape(curve([[37, 328], [45, 328], [47, 352], [45, 374], [40, 376], [38, 352]]), sc, mix(sc, "#1a0f08", .55), [-.6, .5])}
    <path d="M38 340 Q42 342 46 340 M38 360 Q42 362 46 360" stroke="${mix(sc, "#ffffff", .35)}" stroke-width=".8" fill="none" opacity=".6"/>
    ${shape(curve([[52, 328], [67, 328], [71, 356], [63, 368], [51, 364], [50, 344]]), "#c9a46a", "#5a4024", [-.6, .5])}<path d="M58.5 330 V364" stroke="#8a6a3a" stroke-width=".7" opacity=".7"/>
    ${st.rackHat ? `<g transform="translate(5.5 313.4) scale(.45)">${hatArt(st.rackHat, "rk")}</g>` : ""}
    ${shape(curve(ring(44, 394, 6, 3, 8, .1, 3)), "#5a3b24", "#2a1a10", [-.5, .4])}${shape(curve(ring(59, 395, 6, 3, 8, .1, 4)), "#5a3b24", "#2a1a10", [-.5, .4])}
    ${tag(52, 306, "Wardrobe", 52)}</g>`;
  const dy = st.daily || {}, chalk = "#efe9da";
  const board = `<g data-tap="daily"><rect x="92" y="322" width="72" height="82" fill="transparent"/>
    ${shape(limb(128, 398, 128, 372, 128, 346, 1.3, 1), "#4a3420", "#2a1a10", [-.5, .4])}
    ${shape(limb(104, 400, 108, 370, 112, 336, 1.7, 1.3), "#6b4a2a", "#2e1e12", [-.6, .5])}${shape(limb(152, 400, 148, 370, 144, 336, 1.7, 1.3), "#6b4a2a", "#2e1e12", [-.6, .5])}
    ${shape(curve([[98, 330], [158, 328], [160, 372], [96, 374]]), "#2c3a32", "#121a14", [-.9, .8])}
    <path d="${curve([[98, 330], [158, 328], [160, 372], [96, 374]])}" fill="none" stroke="#8a5a32" stroke-width="2.2"/>
    <text x="128" y="341" font-size="8.6" text-anchor="middle" fill="${chalk}" font-family="Fredoka, sans-serif" font-weight="600" opacity=".92">Daily Dig</text>
    ${[...Array(7)].map((_, k) => k < (dy.streak || 0) ? stroke(105 + k * 7.4, 357, -1.35, 8, .7, chalk, .9, .08) : `<path d="M${105 + k * 7.4} 356 v1" stroke="${chalk}" stroke-width=".8" opacity=".3" stroke-linecap="round"/>`).join("")}
    <text x="102" y="368" font-size="5.6" fill="${chalk}" font-family="Fredoka, sans-serif" opacity=".75">${dy.done ? `best ${dy.best || 0}g` : dy.streak ? `${dy.streak}-day streak` : "new today"}</text>
    ${plank(99, 373, 58, 3, "#8a5a32", r)}
    ${dy.done ? `<path d="M142 371 l3 3 l6 -8" stroke="${chalk}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".85"/>`
      : `<circle cx="148" cy="364" r="9" fill="#9fe6c8" opacity=".3"><animate attributeName="opacity" values=".15;.4;.15" dur="2.2s" repeatCount="indefinite"/></circle>${shard(148, 373, 6, 13, -.1, "#5fc9a8", r, true)}`}</g>`;
  const stumpSvg = st.stumpSvg ? st.stumpSvg.replace(/<path d="M0 80 Q150 70 300 80 V90 H0 Z" fill="#14241a"\/>/, "").replace(/<svg class="stumpArt" width="([\d.]+)" height="([\d.]+)"/, (m, w, h) => `<svg class="stumpArt" x="${228 - w / 2}" y="${360 - h}" width="${w}" height="${h}"`) : "";
  const keep = `<g data-tap="memories"><rect x="172" y="288" width="112" height="92" fill="transparent"/>${stumpSvg || `<circle cx="220" cy="386" r="20" fill="#f0b543" opacity=".22"><animate attributeName="opacity" values=".12;.3;.12" dur="3s" repeatCount="indefinite"/></circle>
      ${shape(curve([[210, 372], [230, 372], [234, 392], [229, 404], [211, 404], [206, 392]]), "#e8a84a", "#6a3a10", [-.8, .7], 'opacity=".9"')}${plank(209, 366, 22, 6, "#8a5a32", r)}
      <path d="M213 378 Q212 390 214 398" stroke="#fff3d0" stroke-width="1.2" fill="none" opacity=".6"/>`}
    ${st.memories != null ? tag(228, 372, `Memories ${st.memories}`, 66) : ""}</g>`;
  const stripe = (k) => { const x = 282 + k * 19.3; return shape(curve([[x, 312], [x + 19.3, 312], [x + 19.3, 328], [x + 9.6, 334], [x, 328]]), k % 2 ? "#f1e4c4" : "#c8553d", k % 2 ? "#a08a60" : "#5a1e14", [-.6, .6]); };
  const stall = `<g data-tap="market"><rect x="278" y="282" width="122" height="124" fill="transparent"/>
    ${shape(limb(288, 404, 287, 360, 288, 314, 2.2, 1.8), "#6b4a2a", "#2e1e12", [-.7, .6])}${shape(limb(388, 404, 389, 360, 388, 314, 2.2, 1.8), "#6b4a2a", "#2e1e12", [-.7, .6])}
    ${st.stall && st.metPuddock && st.puddockSvg && !st.packed ? `<svg x="306" y="312" width="64" height="64" viewBox="0 0 100 100">${strip(st.puddockSvg)}</svg>` : ""}
    ${[0, 1, 2, 3, 4, 5].map(stripe).join("")}${plank(300, 298, 76, 13, "#8a5a32", r)}
    <text x="338" y="307.4" font-size="8" text-anchor="middle" fill="#fff1d0" font-family="Fredoka, sans-serif" font-weight="600">${st.packed ? "Back soon (probably)" : "Puddock's"}</text>
    ${plank(282, 366, 112, 9, "#8a5a32", r)}${plank(286, 375, 104, 26, "#6b4a2a", r)}
    <path d="M292 381 H384 M292 389 H384" stroke="#4a3220" stroke-width=".8" opacity=".6"/>
    <g transform="translate(290 350) scale(.7)">${ICONS.jar}</g>${shard(352, 367, 5, 11, .2, "#9b7cf2", r)}${shard(360, 367, 4, 8, -.3, "#5fa99b", r)}
    <path d="M394 326 Q395 332 394 336" stroke="#4a3a2a" stroke-width=".9" fill="none"/>${shape(curve([[390.6, 336], [397.4, 336], [397.8, 345], [390.2, 345]]), "#f7d77a", "#6a4a24", [-.5, .5])}
    <circle cx="394" cy="341" r="14" fill="url(#lanternGlow)"/>
    ${st.metPuddock ? "" : tag(338, 283, "Market?", 50)}</g>`;
  const OFF = 250, H2 = 730;
  const bough = (x, y, dir, len) => { let o = shape(limb(x, y, x + dir * len * .5, y + len * .12, x + dir * len, y + len * .3, 5, 1), "#07130c", "#07130c", [0, 0]);
    for (let k = 1; k < 9; k++) { const t = k / 9, px = x + dir * len * t, py = y + len * .3 * t * t; o += stroke(px, py, Math.PI / 2 + dir * .5, 22 * (1 - t * .5), 3.4 * (1 - t * .4), "#07130c") + stroke(px, py, Math.PI / 2 - dir * .2, 16 * (1 - t * .5), 3 * (1 - t * .4), "#091710"); }
    return o; };
  const tall = (st.site || "stump") === "stump" ? `${[[24, 340], [96, 300], [312, 290], [384, 350], [200, 250]].map(([x, h]) => paintPine(x, 520, h, "#10241a", null, r)).join("")}${bough(-10, 8, 1, 150)}${bough(410, 30, -1, 130)}`
    : st.site === "underroot" ? [[30, 14, 210], [92, 8, 120], [170, 10, 170], [260, 6, 140], [330, 12, 230], [384, 4, 150]].map(([x, w, h]) => shape(limb(x, -10, x + 10, h * .5, x - 6, h, w, 1.5), "#1a110a", "#0c0704", [-1, 1])).join("")
    : `<path d="${curve([[-10, 0], [70, 0], [96, 140], [60, 300], [80, 480], [-10, 520]])}" fill="#15151d"/><path d="${curve([[410, 0], [330, 0], [300, 160], [340, 320], [320, 500], [410, 520]])}" fill="#15151d"/>`;
  return `<svg class="campArt" viewBox="0 0 ${W} ${H2}" preserveAspectRatio="xMidYMax meet" aria-label="Dibble's camp">
    <defs><linearGradient id="campSky" x1="0" y1="0" x2="0" y2="1">${S.sky.map((c, k) => `<stop offset="${[0, .6, 1][k]}" stop-color="${c}"/>`).join("")}</linearGradient>
      <radialGradient id="fireLight" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb15a" stop-opacity=".42"/><stop offset=".5" stop-color="#ff8a3d" stop-opacity=".12"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
      <radialGradient id="lanternGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#f0b543" stop-opacity="0"/></radialGradient>
      <radialGradient id="moonGlow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <filter id="campBlur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="campBlur1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
    <rect x="-300" y="-900" width="1000" height="${H2 + 1200}" fill="${S.sky[0]}"/>
    <rect width="${W}" height="${H2}" fill="url(#campSky)"/>
    <g transform="translate(0 40)"><g data-depth=".15">${S.far}</g></g>
    <g data-depth=".22">${tall}</g>
    <g transform="translate(0 ${OFF})">
    <g data-depth=".3">${S.mid}</g>
    <g data-depth=".5">${S.near}
      <path d="M${sagX(0)} ${sagY(0)} ${[...Array(29)].map((_, k) => `L${sagX((k + 1) / 29)} ${sagY((k + 1) / 29)}`).join(" ")}" stroke="#5a4a3a" stroke-width="1.3" fill="none"/>${lanterns}</g>
    <g data-depth=".75">
      <defs><linearGradient id="campGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.ground[0]}"/><stop offset="1" stop-color="${S.ground[1]}"/></linearGradient>
        <radialGradient id="campVig" cx=".5" cy=".55" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient></defs>
      <path d="${curve([[-10, 196], [60, 182], [140, 176], [220, 172], [300, 178], [410, 192], [410, 310], [-10, 310]])}" fill="url(#campGround)"/>
      <path d="${curve([[-10, 296], [120, 302], [280, 298], [410, 294], [410, 490], [-10, 490]])}" fill="${S.ground[1]}"/>
      <path d="${curve(ring(200, 400, 200, 34, 16, .1, 13))}" fill="${S.ground[2]}" opacity=".35" filter="url(#campBlur)"/>
      ${[[20, 420], [90, 430], [170, 414], [250, 428], [300, 440], [370, 424], [130, 452], [230, 456]].map(([x, y]) => stroke(x, y, -1.4 - r() * .4, 6 + r() * 4, 1.4, r() < .5 ? "#3f7348" : "#4f8a54", .7)).join("")}
      <path d="${curve(ring(200, 254, 190, 40, 16, .08, 9))}" fill="${S.ground[2]}" opacity=".6" filter="url(#campBlur)"/>
      ${[[60, 260], [120, 282], [250, 276], [330, 268], [160, 292], [290, 290], [30, 286], [370, 284]].map(([x, y]) => stroke(x, y, -1.4 - r() * .4, 6 + r() * 4, 1.4, r() < .5 ? "#3f7348" : "#4f8a54", .7)).join("")}
      <ellipse cx="183" cy="246" rx="120" ry="58" fill="url(#fireLight)"><animate attributeName="rx" values="112;128;116;112" dur="1.3s" repeatCount="indefinite"/></ellipse>
      ${tree}${shelf}<g data-tap="tent">${tents}</g>
      ${shape(limb(140, 262, 139, 206, 140, 150, 1.4, 1.1), "#6b4a2a", "#2e1e12", [-.6, .5])}${flag}
      ${d.hammock ? `${shape(limb(380, 262, 381, 214, 380, 168, 1.8, 1.5), "#5a3b24", "#2e1e12", [-.6, .5])}${shape(limb(300, 262, 299, 224, 300, 186, 1.8, 1.5), "#5a3b24", "#2e1e12", [-.6, .5])}<path d="M300 194 Q340 226 380 176" stroke="#e8d6aa" stroke-width="5.5" fill="none"/><path d="M302 196 Q340 222 378 179" stroke="#b8a678" stroke-width="1" fill="none" opacity=".6"/>` : ""}
      ${plank(306, 230, 76, 7, "#5a3b24", r)}${shape(limb(310, 237, 306, 246, 303, 256, 1.6, 1.3), "#5a3b24", "#2e1e12", [-.5, .5])}${shape(limb(378, 237, 382, 246, 385, 256, 1.6, 1.3), "#5a3b24", "#2e1e12", [-.5, .5])}${picks}
      ${st.lens ? `<g transform="translate(330 214) scale(.9)">${ICONS.lens}</g>` : ""}${st.tongs ? `<g transform="translate(352 212) scale(.9)">${ICONS.tongs}</g>` : ""}${st.sieve ? `<g transform="translate(98 156) scale(.9)">${ICONS.sieve}</g>` : ""}
      ${fire}<g data-tap="mines"><rect x="-10" y="146" width="78" height="122" fill="transparent"/>${sign}</g>
      ${d.mushrooms ? [[106, 268, 8], [120, 273, 6], [94, 276, 5]].map(([x, y, s]) => `<path d="${curve(ring(x, y + s * .3, s * .2, s * .6, 6, .1, x))}" fill="#e2d8f0"/>
        ${shape(curve([[x - s, y - .5], [x - s * .5, y - s * 1.1], [x + s * .4, y - s * 1.15], [x + s, y - .6], [x, y - s * .3]]), "#9b7cf2", "#3a2458", [-.6, .6])}
        <circle cx="${x}" cy="${y - s * .6}" r="${s * 1.6}" fill="#9b7cf2" opacity=".2"><animate attributeName="opacity" values=".1;.3;.1" dur="${2.4 + s * .1}s" repeatCount="indefinite"/></circle>`).join("") : ""}
      ${d.jars ? `${plank(238, 246, 26, 12, "#6b4a2a", r)}<g transform="translate(236 222) scale(1)">${ICONS.jar}</g><g transform="translate(252 226) scale(.8)">${ICONS.jar}</g>` : ""}
      ${grannyAt}${puddockAt}${packed}${d.cart && !st.packed ? `<g transform="translate(270 240) scale(1.8)">${ICONS.cart}</g>${st.puddockSvg && !st.stall ? `<g data-tap="puddock"><svg x="252" y="208" width="42" height="42" viewBox="0 0 100 100">${strip(st.puddockSvg)}</svg></g>` : ""}` : ""}
      ${st.hub ? rack + board + keep + stall + tag(26, 156, "Mines", 40) : ""}
      <g data-tap="dibble" class="campDibble"><svg x="190" y="196" width="68" height="68" viewBox="0 0 100 100">${strip(dibbleSvg)}</svg></g>
      ${flies}
    </g>
    <path d="${curve(ring(200, 286, 230, 18, 14, .1, 11))}" fill="#cfe0d0" opacity=".06" filter="url(#campBlur)"/>
    <g data-depth="1.1" filter="url(#campBlur1)">${fern(-6, 484, -1.1, 80, "#07130c")}${fern(406, 484, -2.05, 80, "#07130c")}</g>
    </g>
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

// ---------- story pictures (docs/STORY.md) ----------
// Amber Memories and the prologue: small scenes seen through old amber (warm, sepia, one glowing thing).
// Painted with the paint.js toolkit in the 160x100 box: hand-built silhouettes with a darker edge peeking out
// down-left, a warm rim where the light catches, soft blurred blobs for every glow.
const AM = { ink: "#2a1606", mid: "#5a3410", glow: "#ffe6a0", hot: "#ff7a3a", ice: "#cfefff", deep: "#160b03" };
const PALE = "#f4f0ff";
let F = "am"; // filter prefix of the picture being painted (set by memoryArt)
const S = (d, c = AM.ink, o = [-.9, .8]) => shape(d, c, mix(c, "#000000", .55), o);
const blob = (x, y, rx, ry, c, op, seed = 1, f = "s") => `<path d="${curve(ring(x, y, rx, ry, 9, .25, seed))}" fill="${c}" opacity="${op}" filter="url(#${F}${f})"/>`;
const rim = (pts, op = .5, w = 1.2, c = AM.glow) => `<path d="${curve(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round" filter="url(#${F}b)"/>`;
const wash = (op = .55, x = 80, c = AM.deep) => `<path d="${curve(ring(x, 50, 120, 86, 10, .08, 5))}" fill="${c}" opacity="${op}"/>`;
const spark = (x, y, s = 1.4, c = AM.glow, op = 1) => `<g opacity="${op}">${blob(x, y, s * 2.6, s * 2.6, c, .4, x | 0, "b")}<path d="${curve(ring(x, y, s, s * .8, 6, .35, (x * 7 + y) | 0))}" fill="${c}"/></g>`;
const brush = (pts, c, w, op = 1, extra = "") => `<path d="${curve(pts, false)}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linecap="round" ${extra}/>`;
// a glowing thread or root: wide soft halo, tapered body, bright core
const glowLimb = (x1, y1, cx, cy, x2, y2, w, c = AM.hot) => `<path d="${limb(x1, y1, cx, cy, x2, y2, w * 2.6, w * .8)}" fill="${c}" opacity=".3" filter="url(#${F}s)"/>
  <path d="${limb(x1, y1, cx, cy, x2, y2, w, w * .2)}" fill="${c}"/><path d="${limb(x1, y1, cx, cy, x2, y2, w * .35, .1)}" fill="${AM.glow}" opacity=".8"/>`;
const wisp = (x, y, h, w, seed, c = AM.glow, op = .45) => { const r = rng(seed), pts = [...Array(6)].map((_, k) => [x + Math.sin(k * 1.3 + r() * 2) * (2 + k * .9), y - k * h / 5]);
  return brush(pts, c, w * 2.6, op * .4, `filter="url(#${F}s)"`) + brush(pts, c, w, op, `filter="url(#${F}b)"`); };
// uneven ground with a lit lip, grass tufts and a pebble or two; tilt lifts the right side
const ground = (y = 78, seed = 1, tilt = -3) => { const r = rng(seed), at = (x) => y + ((x + 10) / 180 - .5) * tilt;
  const top = [...Array(7)].map((_, k) => [-10 + k * 30, at(-10 + k * 30) + (r() - .5) * 3]);
  return S(curve([...top, [172, 106], [-12, 106]])) + rim(top.slice(1, 6).map(([x, yy]) => [x, yy + .4]), .22, 1) +
    [...Array(9)].map(() => { const x = 6 + r() * 148; return stroke(x, at(x) + 1.5, -1.57 + (r() - .5) * .9, 2.5 + r() * 3, .7, AM.ink); }).join("") +
    [...Array(2)].map((_, k) => { const x = 20 + r() * 120; return S(curve(ring(x, at(x) + 5 + r() * 6, 2.4, 1.4, 7, .3, seed + k)), AM.mid, [-.5, .4]); }).join(""); };
// a tree in the old style of the wood: tapered trunk and boughs, a crown of lumpy lobes, light on the upper right
const oakSil = (x, y, s = 1, glow = 0, seed = 3) => { const P = (dx, dy) => [x + dx * s, y + dy * s];
  const lobes = [[-2, -40, 19, 14], [-16, -31, 12, 10], [15, -33, 13, 11], [-8, -49, 12, 9], [9, -48, 12, 9], [25, -27, 7, 6], [-25, -25, 6, 5]];
  return (glow ? blob(x + 4 * s, y - 38 * s, 44 * s, 38 * s, AM.glow, glow, seed) : "") +
    [[-3, -1, -9, 0, -15, 2.5], [3, -1, 9, .5, 14, 2], [0, -1, -2, 1, -6, 3]].map(([a, b, c, d, e, f]) => S(limb(...P(a, b), ...P(c, d), ...P(e, f), 2.4 * s, .4 * s))).join("") +
    S(limb(...P(0, 0), ...P(-2.5, -14), ...P(1.5, -30), 5.8 * s, 2.6 * s)) +
    [[1, -22, -8, -28, -16, -33], [2, -25, 10, -29, 16, -36], [1.5, -28, 0, -38, -4, -46]].map(([a, b, c, d, e, f]) => S(limb(...P(a, b), ...P(c, d), ...P(e, f), 2 * s, .6 * s))).join("") +
    lobes.map(([dx, dy, rx, ry], k) => S(curve(ring(...P(dx, dy), rx * s, ry * s, 11, .14, seed * 10 + k, (k - 3) * .2)), k % 3 ? AM.ink : mix(AM.ink, AM.mid, .3))).join("") +
    blob(...P(10, -46), 12 * s, 7 * s, AM.mid, .55, seed + 1) + rim([P(-4, -58), P(8, -58), P(19, -52), P(26, -42), P(31, -30)], .45, 1.3 * s); };
// stump with a jagged, broken top
const stumpSil = (x, y, s = 1, seed = 5) => { const r = rng(seed), P = (dx, dy) => [x + dx * s, y + dy * s];
  const top = [-9, -6, -3, 0, 3, 6, 9].map((dx, k) => P(dx, -15 - (k % 2 ? 4 + r() * 3 : r() * 2) + (dx < 0 ? 2 : 0)));
  return [[-8, -2, -13, 0, -17, 2], [8, -3, 12, 0, 16, 2]].map(([a, b, c, d, e, f]) => S(limb(...P(a, b), ...P(c, d), ...P(e, f), 2.6 * s, .5 * s))).join("") +
    S(curve([P(-10, 1), P(-10.5, -9), ...top, P(10.5, -8), P(11, 1)])) + S(curve(ring(...P(1, -16), 8.5 * s, 2.2 * s, 9, .2, seed)), AM.mid, [-.4, .3]) +
    brush([P(-6, -12), P(-7, -6), P(-6.5, 0)], AM.mid, .7 * s, .7) + rim([P(4, -18), P(9, -14), P(10.5, -4)], .35, .9); };
// Dibble's kin: round body, head turned right, pointed snout, leaf cap
const moleSil = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  ${S(curve(ring(-4, -.6, 3.6, 1.8, 7, .1, 3)))}${S(curve(ring(4.4, -.6, 3.4, 1.8, 7, .1, 4)))}
  ${S(curve(ring(0, -8.4, 9, 9.6, 12, .08, 7, -.1, (a) => a > 0 && a < Math.PI ? 1.05 : .97)))}
  ${S(curve(ring(2, -19, 6.6, 6, 10, .06, 9, -.2)))}${S(curve([[5, -22], [10.4, -19.6], [12.6, -17.6], [9, -15.4], [4.6, -15.8]]))}
  ${S(curve([[-6.6, -23.4], [-2, -27.6], [5, -28.2], [10.4, -24.6], [3, -23.6]]), AM.mid, [-.6, .5])}${stroke(1.6, -27.6, -1.1, 4.2, .8, AM.mid)}
  ${rim([[-2, -24.6], [5, -25.4], [9, -22], [7, -16.4]], .3, .8)}${rim([[4, -11], [8.6, -6], [8, 0]], .25, .8)}</g>`;
// toad side-on, facing right (flip -1 faces left): squat body, folded back leg, two eye bumps
const toadSil = (x, y, s = 1, flip = 1) => `<g transform="translate(${x} ${y}) scale(${flip * s} ${s})">
  ${S(limb(-6, -4, -14, -3, -11, 0, 3.4, 1.4))}${S(curve(ring(0, -6.4, 11, 7, 12, .07, 11, -.08, (a) => a > 0 && a < Math.PI ? .9 : 1.04)))}
  ${S(limb(6, -4, 9, -1, 11.6, .2, 2.2, 1.1))}${S(curve(ring(-3, -12, 3.2, 3, 8, .08, 13)))}${S(curve(ring(5, -12.6, 3.4, 3.2, 8, .08, 15)))}
  ${brush([[2, -6], [7, -5.2], [11, -7]], AM.mid, .6, .8)}${rim([[-1, -13], [5, -16], [9, -12.6], [11, -7]], .3, .7)}</g>`;
// moth: two forewings and hindwings (left a touch bigger than right), tapered body, feathery antennae
const mothSil = (x, y, s = 1, col = AM.ink, op = 1, rot = 0) => { const l = mix(col, AM.ink, .55), o = [-.7, .6];
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${op}">
  ${shape(curve([[0, -.6], [-6, -9], [-12.6, -9.4], [-15, -4.6], [-11, -.4], [-4, 1.2]]), col, l, o)}${shape(curve([[0, -.6], [5.6, -8.4], [12, -8.8], [14, -4.4], [10.6, -.2], [4, 1.2]]), col, l, o)}
  ${shape(curve([[0, 1], [-6, 2.6], [-10.6, 6.6], [-6.4, 8.8], [-1, 4.6]]), col, l, o)}${shape(curve([[0, 1], [5.6, 2.4], [9.8, 6.2], [6, 8.2], [1, 4.4]]), col, l, o)}
  <path d="${curve(ring(-9, -5, 2.2, 1.6, 7, .3, 3))}" fill="${l}" opacity=".35"/><path d="${curve(ring(8.4, -4.6, 1.8, 1.4, 7, .3, 4))}" fill="${l}" opacity=".35"/>
  ${shape(limb(0, -4.4, .6, 1, 0, 6.4, 1.9, .8), col, l, o)}${stroke(-.4, -4, -2.1, 6.4, .45, col)}${stroke(.4, -4, -1.05, 6.4, .45, col)}</g>`; };
// a little hand-made lantern: cap, glowing glass, base, bail
const lan = (x, y, s = 1, o = 1) => `<g opacity="${o}">${blob(x, y, 8 * s, 8 * s, AM.glow, .32, x | 0)}
  ${brush([[x - 1.6 * s, y - 3.8 * s], [x, y - 6 * s], [x + 1.6 * s, y - 3.8 * s]], AM.ink, .6 * s)}
  ${shape(curve([[x - 2.3 * s, y - 2.6 * s], [x + 2.2 * s, y - 2.8 * s], [x + 2.5 * s, y + 2.7 * s], [x - 2.2 * s, y + 2.9 * s]]), AM.glow, AM.mid, [-.5 * s, .4 * s])}
  ${S(curve([[x - 2.9 * s, y - 3.8 * s], [x + 2.8 * s, y - 4 * s], [x + 3 * s, y - 2.5 * s], [x - 3.1 * s, y - 2.4 * s]]), AM.ink, [-.3, .3])}
  ${S(curve([[x - 2.8 * s, y + 2.6 * s], [x + 3 * s, y + 2.5 * s], [x + 2.8 * s, y + 3.9 * s], [x - 2.7 * s, y + 4 * s]]), AM.ink, [-.3, .3])}</g>`;
// a rock ceiling with one ragged opening (centre x, y, half-width r)
const hole = (x, y, r) => `<path d="${curve([[-12, -12], [172, -12], [172, y + r * .3], [x + r * 1.7, y + r * 1.1], [x + r * .6, y + r * .95], [x - r * .5, y + r * 1.05], [x - r * 1.5, y + r * 1.4], [-12, y + r * .5]])} ${curve(ring(x, y, r, r * .55, 11, .14, r | 0).reverse())}"
  fill="${AM.ink}" fill-rule="evenodd"/>${rim(ring(x, y, r, r * .55, 11, .14, r | 0).slice(0, 5), .35, 1, PALE)}`;
const moonDisc = (x, y, r) => `${blob(x, y, r * 2.6, r * 2.4, PALE, .28, 2)}<path d="${curve(ring(x, y, r, r, 12, .04, 4))}" fill="${PALE}"/>
  ${blob(x - r * .3, y - r * .2, r * .3, r * .24, "#cfc6e6", .7, 6, "b")}${blob(x + r * .35, y + r * .3, r * .2, r * .16, "#cfc6e6", .6, 8, "b")}`;
const stones = (rows, c = AM.ink) => rows.map(([x, y, w, h], k) => S(curve(ring(x + w / 2, y + h / 2, w / 2, h / 2, 9, .16, k + 31, (k % 3 - 1) * .08)), c) +
  brush([[x + w * .25, y + h * .3], [x + w * .55, y + h * .18], [x + w * .8, y + h * .3]], AM.mid, .9, .7)).join("");
// cart: a planked box on two spoked wheels, w wide, top-left at (x, y)
const wagon = (x, y, w = 50) => { const h = w * .4, R = w * .15;
  return S(curve([[x, y + 1.4], [x + 2, y], [x + w - 2, y - .6], [x + w, y + 1], [x + w - .4, y + h - 1], [x + w - 2, y + h], [x + 2, y + h + .4], [x + .3, y + h - 1]])) +
    brush([[x + 3, y + h * .45], [x + w - 3, y + h * .4]], AM.mid, .8, .7) + [w * .2, w * .78].map((dx, k) => S(curve(ring(x + dx, y + h + R * .6, R, R, 11, .05, 40 + k)), AM.mid) +
    [0, 1, 2].map((j) => brush([[x + dx + Math.cos(j + k) * R * .85, y + h + R * .6 + Math.sin(j + k) * R * .85], [x + dx - Math.cos(j + k) * R * .85, y + h + R * .6 - Math.sin(j + k) * R * .85]], AM.ink, .8)).join("") +
    S(curve(ring(x + dx, y + h + R * .6, R * .25, R * .25, 6, .1, 42 + k)))).join(""); };
const MEM = {
  oak: () => `${oakSil(28, 80, .3, .12, 9)}${oakSil(134, 80, .36, .14, 7)}${ground(80, 2)}${oakSil(70, 80, 1.05, .38)}
    ${[[48, 30], [96, 24], [104, 46], [86, 16], [58, 52], [122, 34], [132, 60], [26, 50]].map(([x, y], k) => spark(x, y, 1 + (k % 3) * .3)).join("")}`,
  leaf: () => `${blob(92, 54, 30, 26, AM.glow, .45, 3)}${S(limb(-6, 10, 36, 22, 102, 6, 3.4, .6))}${S(limb(40, 20, 54, 24, 62, 34, 1.4, .5))}
    ${[[22, 15, -1.9], [76, 13, -1.2], [88, 10, -2.3]].map(([x, y, a]) => stroke(x, y, a, 4, .8, AM.ink)).join("")}
    <g transform="rotate(-28 90 52)">${shape(curve([[90, 36], [97, 44], [98.6, 54], [92, 66], [89.4, 68], [84, 56], [84.6, 44]]), AM.glow, AM.mid, [-.9, .8])}
    ${brush([[90, 38], [90.6, 52], [90, 67]], AM.mid, .8, .8)}${[[90.4, 46, -.6], [90.6, 53, -.7], [90.4, 60, -2.5], [90.6, 49, -2.4]].map(([x, y, a]) => stroke(x, y, a, 5, .4, AM.mid, .6, .1)).join("")}</g>
    ${brush([[62, 34], [70, 40], [76, 46]], AM.glow, .5, .4, `stroke-dasharray="1.5 2.5"`)}${ground(88, 3, 4)}
    ${[[30, 88, .4], [118, 87, -.3], [44, 90, 2.6]].map(([x, y, a]) => `<g transform="rotate(${a * 40} ${x} ${y})">${S(curve([[x - 4, y], [x, y - 1.6], [x + 4.4, y], [x, y + 1.2]]), AM.mid, [-.4, .3])}</g>`).join("")}`,
  dawn: () => `${blob(30, 66, 70, 10, AM.glow, .55, 4)}${blob(18, 64, 16, 12, "#fff3cf", .6, 5)}${ground(78, 4, -2)}
    ${stumpSil(56, 79, 1.1)}${wagon(92, 62, 28)}${brush([[120, 68], [130, 70.6]], AM.ink, 1.2)}${toadSil(141, 78, .9)}`,
  smoke: () => `${ground(72, 5, -4)}${oakSil(124, 71, .5, 0, 5)}${[[38, 72, 54, 3.4, 1], [62, 71, 46, 2.4, 2], [88, 70, 40, 1.6, 3]].map(([x, y, h, w, s]) => wisp(x, y, h, w, s)).join("")}
    ${blob(60, 76, 40, 6, AM.hot, .3, 6)}${[[34, 73, .8], [58, 72, 2.1], [86, 71, 1.1], [72, 74, .3]].map(([x, y, a]) => stroke(x, y, a, 7, 1, AM.hot, .8, .3)).join("")}`,
  thaw: () => `${blob(78, 90, 34, 16, AM.hot, .35, 7)}${S(curve([[-12, 72], [40, 67], [80, 66], [120, 69], [172, 70], [172, 106], [-12, 106]]))}
    ${[[-12, 66, 62], [98, 64, 76]].map(([x0, y, x1], k) => S(curve([[x0, y + 2], [(x0 + x1) / 2, y - 1.5], [x1, y + 3.4], [x1 - 4, y + 5], [(x0 + x1) / 2, y + 3], [x0, y + 6]]), "#fff6e6", [-.6, .8])).join("")}
    ${S(curve(ring(80, 69, 16, 3.4, 9, .2, 9)), AM.mid, [-.5, .4])}${wisp(74, 66, 16, 1, 9, "#fff6e6", .4)}${wisp(86, 66, 12, .8, 10, "#fff6e6", .3)}
    ${glowLimb(80, 76, 66, 86, 46, 92, 1.8)}${glowLimb(80, 76, 94, 88, 116, 94, 1.6)}${glowLimb(79, 76, 80, 90, 72, 104, 1.4)}
    ${[[20, 22], [48, 36], [118, 20], [140, 42], [98, 38], [66, 14]].map(([x, y]) => spark(x, y, 1, "#fff6e6", .9)).join("")}`,
  rootglow: () => `${blob(76, 82, 40, 20, AM.hot, .4, 8)}${ground(60, 6, 3)}${oakSil(74, 60, .8, 0, 4)}
    ${[[74, 61, 62, 72, 38, 80, 2.2], [75, 61, 92, 76, 126, 82, 2.2], [74, 62, 76, 80, 70, 100, 1.8], [62, 70, 46, 86, 24, 90, 1.4], [96, 74, 106, 86, 112, 98, 1.2]].map((a) => glowLimb(...a)).join("")}`,
  lanterns: () => `${ground(40, 7, 2)}${S(curve([[60, 36], [72, 40], [88, 39], [100, 42], [96, 64], [92, 106], [66, 106], [64, 66]]), AM.deep, [-1.2, 1])}
    ${blob(80, 70, 12, 30, AM.glow, .12, 9)}${[[79, 47, 1.15, 1], [82, 57, 1, .9], [78, 66, .85, .75], [81, 74, .72, .6], [79, 81, .6, .5], [81, 87, .5, .38], [80, 92, .4, .28]].map((a) => lan(...a)).join("")}
    ${moleSil(48, 41, .8)}${brush([[54, 30], [58, 24]], AM.ink, 1.6)}${lan(60, 28, .8)}`,
  count: () => `${ground(78, 8, -4)}${moleSil(28, 79, 1.1)}${brush([[36, 64], [44, 58], [50, 63]], AM.glow, .9, .7, `filter="url(#${F}b)"`)}
    ${[[54, 72], [71, 70], [88, 71], [105, 69], [122, 70], [139, 68]].map(([x, y], k) => lan(x, y, .85 + (k % 2) * .08, k < 4 ? 1 : .35)).join("")}
    ${[54, 71, 88, 105].map((x, k) => stroke(x - 1.4, 60 - (k % 2), -1.3, 3, .5, AM.glow, .6)).join("")}`,
  caps: () => `${ground(78, 9, 3)}${S(limb(44, 80, 42, 66, 48, 54, 4.6, 2), "#1a0d04")}${S(limb(46, 60, 52, 56, 56, 50, 1.4, .4), "#1a0d04")}${S(limb(112, 80, 114, 64, 108, 52, 5, 2.2), "#1a0d04")}
    ${[[52, 68, 8], [64, 74, 5.5], [100, 70, 7], [124, 62, 9.5], [88, 76, 4.4], [136, 74, 5]].map(([x, y, r], k) => blob(x, y - r * .4, r * 1.9, r * 1.3, AM.glow, .35, k + 10) +
      S(limb(x - .6, 80, x + (k % 2 ? 1 : -1), (y + 80) / 2, x, y, r * .22, r * .16), mix(AM.glow, AM.mid, .5), [-.5, .4]) +
      shape(curve([[x - r, y + .6], [x - r * .7, y - r * .6], [x, y - r * 1.05], [x + r * .8, y - r * .5], [x + r * 1.05, y + .8], [x, y - r * .1]]), AM.glow, AM.mid, [-.7, .6]) +
      brush([[x - r * .7, y], [x, y - r * .2], [x + r * .8, y + .3]], AM.mid, .5, .6)).join("")}`,
  toad: () => `${ground(78, 10, -2)}${S(curve([[8, 82], [12, 46], [24, 28], [46, 22], [66, 30], [78, 50], [82, 82]]), AM.deep, [-1.4, 1.2])}
    ${S(curve([[24, 82], [27, 58], [40, 44], [56, 46], [66, 60], [68, 82]]), "#0e0602", [-.8, .6])}${blob(92, 60, 18, 14, AM.glow, .45, 11)}
    ${toadSil(104, 73, 1.2, -1)}${S(curve(ring(93, 60, 3.6, 4, 8, .2, 12)), AM.glow, AM.mid)}
    ${[[118, 56, 12], [122, 64, 16], [116, 48, 8]].map(([x, y, l]) => stroke(x, y, 0, l, .6, AM.glow, .6, .03)).join("")}`,
  frost: () => { const r = rng(13); return `${wash(.35, 90, AM.ink)}${brush([[-6, 60], [30, 52], [60, 58], [96, 62], [130, 55], [168, 58]], AM.ink, 10)}
    ${brush([[-6, 60], [30, 52], [60, 58], [96, 62], [130, 55], [168, 58]], AM.hot, 2, .5, `filter="url(#${F}b)"`)}${blob(120, 60, 30, 8, AM.hot, .25, 14)}
    ${[[26, 54, .9], [52, 57, -.2], [82, 61, .3], [108, 59, -.4], [140, 56, .2]].map(([x, y, a], k) => blob(x, y - 8, 9, 9, AM.ice, .25 - k * .03, k + 3) + shard(x, y + 2, 9 - k * .6, 18 - k * 1.4, a * .4, AM.ice, r, k === 0)).join("")}
    ${moleSil(66, 94, .7)}${brush([[73, 82], [78, 80]], AM.ink, 1.2)}${lan(82, 80, .7)}`; },
  deeper: () => `${wash(.55, 70)}${S(curve([[62, -6], [70, 30], [64, 56], [72, 80], [68, 106], [96, 106], [92, 74], [100, 44], [94, 10], [98, -6]]), AM.mid, [-1.4, 1])}
    ${blob(82, 50, 14, 50, AM.glow, .16, 15)}${brush([[80, -2], [77, 22], [84, 44], [80, 66], [86, 84], [82, 104]], AM.glow, 7, .2, `filter="url(#${F}s)"`)}
    ${brush([[80, -2], [77, 22], [84, 44], [80, 66], [86, 84], [82, 104]], AM.glow, 2, .9, `filter="url(#${F}b)"`)}${brush([[80, -2], [77, 22], [84, 44], [80, 66], [86, 84], [82, 104]], "#fffaf0", .7)}
    ${lan(70, 38, .6, .5)}${lan(92, 70, .5, .35)}${lan(74, 90, .4, .2)}`,
  receipt: () => `${blob(84, 56, 50, 34, AM.deep, .45, 16)}<g transform="rotate(-6 80 50)">
    ${shape(curve([[40, 16], [80, 15], [120, 16.4], [121, 50], [119.4, 80], [110, 82], [100, 79.6], [88, 82.4], [76, 79.4], [62, 82.6], [50, 80], [40.6, 82]]), "#f3e6c4", "#8a6a3a", [-1.2, 1.1])}
    ${blob(108, 26, 14, 8, "#fffaf0", .55, 17)}${blob(50, 70, 16, 10, "#c9a46a", .35, 18)}
    ${[28, 36, 44, 52].map((y, k) => stroke(47, y + (k % 2) * .4, .01 * (k - 1), 58 - k * 9, .9, AM.mid, .85, .02)).join("")}
    ${brush([[84, 68], [88, 62], [92, 67], [96, 70], [100, 64], [106, 66]], AM.ink, 1.1)}${brush([[50, 70], [62, 69.4]], AM.mid, .5, .5)}
    <text x="52" y="68" font-size="9" font-style="italic" fill="${AM.ink}">P.B.</text>${S(curve([[112, 16.6], [120, 16.4], [120.6, 25], [114, 22]]), "#d9c49a", [-.6, .5])}</g>`,
  coin: () => `${blob(90, 50, 26, 24, PALE, .3, 19)}${S(limb(-6, 104, 26, 84, 62, 72, 12, 7))}
    ${[[60, 66, 74, 60, 86, 64], [62, 70, 78, 68, 92, 72], [60, 74, 74, 78, 86, 80], [56, 76, 62, 84, 70, 86]].map(([a, b, c, d, e, f], k) => S(limb(a, b, c, d, e, f, 3.4 - k * .3, 2))).join("")}
    ${rim([[30, 80], [50, 72], [70, 62], [86, 63]], .3, 1)}<g transform="rotate(-14 88 52)">${shape(curve(ring(88, 52, 12, 11, 14, .03, 21)), "#efe8f7", "#8f82aa", [-1, .9])}
    ${brush([[88, 52], [81, 45], [77, 50], [81, 55], [88, 52], [95, 45], [99, 50], [95, 55], [88, 52]], "#a89ac0", .9)}${blob(84, 46, 4, 3, "#ffffff", .7, 22, "b")}</g>`,
  market: () => `${ground(80, 11, -3)}${S(curve([[24, 82], [28, 50], [34, 20], [48, 2], [116, 4], [128, 26], [132, 56], [138, 82]]))}${S(limb(30, 78, 18, 80, 8, 84, 4, .6))}${S(limb(132, 78, 144, 80, 156, 86, 4, .6))}
    ${S(curve([[56, 82], [56, 56], [66, 40], [84, 36], [100, 44], [106, 60], [106, 82]]), AM.deep, [-1, .8])}${blob(82, 64, 22, 18, AM.glow, .4, 23)}
    ${shape(curve([[58, 52], [70, 50], [84, 49], [104, 52], [101, 57], [96, 55], [90, 58], [84, 55], [78, 58], [72, 55], [66, 58], [60, 56]]), AM.glow, AM.mid, [-.7, .6])}
    ${toadSil(80, 80, .9)}${spark(68, 68, 1.6)}${spark(92, 70, 1.2, PALE)}${rim([[116, 8], [126, 28], [130, 54]], .35, 1.2)}`,
  heart: () => `${wash(.55, 90)}${blob(80, 54, 40, 36, AM.hot, .3, 24)}
    ${shape(`${curve([[80, 84], [66, 72], [52, 58], [46, 44], [52, 32], [64, 28], [74, 33], [80, 40], [84, 32], [92, 28], [103, 30], [111, 40], [108, 54], [96, 70]])}`, AM.hot, "#7a2a10", [-1.4, 1.2])}
    ${S(curve([[92, 36], [101, 41], [98, 50], [91, 52], [88, 44]]), AM.deep, [.6, -.6])}${blob(64, 64, 14, 12, "#a83a14", .5, 25)}
    ${rim([[54, 40], [60, 33], [70, 33]], .8, 1.6, "#ffd2b0")}${[[90, 54], [97, 51.6]].map(([x, y]) => stroke(x, y, 1.9, 4, .4, AM.deep, .7)).join("")}`,
  pull: () => `${wash(.55, 80)}${[-64, -36, -12, 14, 40, 66].map((dx, k) => brush([[80 + dx, -4], [80 + dx * .72 + (k % 2 ? 3 : -2), 34], [80 + dx * .3, 70], [80, 92]], AM.glow, .9 + (k % 3) * .4, .5 + (k % 2) * .2)).join("")}
    ${[[30, 20], [104, 40], [62, 52], [118, 16], [92, 66]].map(([x, y]) => spark(x, y, .8, AM.glow, .8)).join("")}${blob(80, 90, 16, 12, AM.glow, .45, 26)}${spark(80, 92, 3.2, PALE)}`,
  scorch: () => { const r = rng(27), trail = [...Array(9)].map((_, k) => [80 + Math.sin(k * 1.4) * 3, 18 + k * 8]);
    return `${wash(.55, 80, "#1c0e04")}${S(curve([[-12, -12], [36, -12], [50, 30], [58, 70], [64, 106], [-12, 106]]))}${S(curve([[172, -12], [118, -12], [112, 40], [100, 76], [96, 106], [172, 106]]))}
    ${[[22, 12], [36, 34], [42, 58], [132, 16], [120, 40], [112, 64]].map(([x, y]) => { const a = x < 80 ? 1.2 : 1.94; return stroke(x, y, a, 14 + r() * 8, 2.2, AM.hot, .7, .3) + stroke(x + 2, y + 4, a, 8, 1, AM.glow, .5, .3); }).join("")}
    ${blob(80, 100, 30, 12, AM.hot, .5, 28)}${trail.map(([x, y], k) => spark(x, y, .5 + k * .08, AM.glow, .4 + k * .06)).join("")}`; },
  wings: () => `${wash(.55, 90, "#1a0d04")}${blob(98, 34, 22, 20, AM.hot, .38, 29)}
    ${S(curve([[80, 30], [68, 36], [58, 56], [52, 80], [48, 106], [114, 106], [108, 76], [100, 50], [92, 36]]))}
    ${brush([[78, 36], [68, 62], [62, 104]], AM.mid, .8, .8)}${brush([[84, 36], [92, 62], [98, 104]], AM.mid, .8, .8)}
    ${S(curve(ring(80, 25, 9, 8.4, 11, .06, 30)))}${S(limb(77, 19, 70, 6, 56, 6, 1, .3))}${S(limb(84, 19, 92, 5, 106, 7, 1, .3))}
    ${S(limb(90, 46, 98, 42, 96, 34, 2.6, 1.6))}${shape(curve([[96, 21], [101, 29], [96.6, 38], [91.4, 30]]), AM.hot, "#7a2a10", [-.6, .5])}${blob(97, 27, 2, 3, "#ffd2b0", .9, 31, "b")}
    ${rim([[86, 18], [89, 24], [90, 32]], .45, .8)}`,
  carriers: () => `${wash(.55, 80, "#1a0d04")}${[...Array(14)].map((_, k) => { const x = 10 + k * 10.5 + Math.sin(k * 2.1) * 3, y = 12 + k * 5.4 + Math.sin(k * 1.3) * 5;
    return spark(x + 1, y + 6.6, 1.1, AM.glow) + mothSil(x, y, .38 + (k % 3) * .04, PALE, .85, 14 + Math.sin(k) * 14); }).join("")}`,
  spirals: () => `${wash(.55, 80, "#1a0d04")}${blob(80, 54, 18, 16, AM.glow, .45, 32)}${shard(80, 64, 10, 22, .08, AM.glow, rng(33), true)}
    ${brush([...Array(22)].map((_, k) => { const a = k * .55, R = 14 + k * 1.6; return [80 + Math.cos(a) * R * 1.3, 54 + Math.sin(a) * R * .8]; }), PALE, .7, .55, `stroke-dasharray="2 3"`)}
    ${[[52, 56, -96], [108, 48, 84], [80, 30, -6], [42, 70, -124], [120, 72, 120], [66, 84, 176]].map(([x, y, a], k) => mothSil(x, y, .44 + (k % 2) * .1, PALE, .9, a)).join("")}`,
  scalefall: () => `${wash(.55, 80, "#1a0d04")}${[...Array(26)].map((_, k) => { const x = (k * 37) % 160, y = (k * 23) % 80;
    return `<path d="${curve(ring(x, y, 1.9, 1.1, 6, .2, k, k * .6))}" fill="${PALE}" opacity="${.35 + (k % 4) * .15}"/>`; }).join("")}
    ${ground(86, 12, -3)}${[[40, 84, 10], [70, 85, -14], [104, 83, 22], [128, 84, -8]].map(([x, y, a], k) => mothSil(x, y, .5 + (k % 2) * .08, PALE, .9, a)).join("")}
    ${brush([[30, 72], [36, 62], [30, 54], [36, 44]], PALE, .7, .6, `stroke-dasharray="1.5 2.5"`)}${brush([[118, 70], [112, 60], [120, 52], [114, 42]], PALE, .7, .6, `stroke-dasharray="1.5 2.5"`)}`,
  circling: () => `${ground(78, 13, -3)}${moleSil(60, 79, 1.2)}${S(limb(70, 58, 78, 54, 82, 46, 2.4, 1.6))}${lan(86, 42, 1.4)}
    <path d="${curve(ring(88, 44, 28, 13, 12, .08, 34, -.15))}" stroke="${PALE}" stroke-width=".8" stroke-dasharray="2 3" fill="none" opacity=".7"/>${mothSil(114, 40, .6, PALE, .95, 70)}`,
  skyhole: () => `${wash(.55, 80, AM.ink)}${moonDisc(84, 10, 7)}${hole(80, 14, 22)}
    <path d="${curve([[62, 16], [98, 16], [124, 106], [36, 106]])}" fill="${PALE}" opacity=".16" filter="url(#${F}s)"/>${[[70, 50, -10], [94, 38, 15], [84, 70, 4]].map(([x, y, a], k) => mothSil(x, y, .46 + k * .04, AM.ink, .9, a)).join("")}${ground(92, 14)}`,
  cavein: () => `${wash(.55, 80, "#1a0d04")}${hole(80, 12, 20)}${stones([[66, 4, 14, 9], [82, 1, 16, 10], [58, 26, 12, 8], [88, 32, 14, 9], [72, 50, 10, 7], [96, 62, 12, 8], [60, 74, 14, 8]])}
    ${[...Array(10)].map((_, k) => spark(50 + k * 7, 20 + (k * 17) % 60, .6, AM.glow, .5)).join("")}${ground(92, 15)}`,
  bracket: () => `${wash(.55, 90, "#1a0d04")}${blob(34, 50, 60, 56, PALE, .2, 35)}<path d="${curve(ring(18, 50, 56, 54, 16, .02, 36))}" fill="${PALE}" opacity=".85"/>
    ${brush([[58, 22], [72, 34], [76, 50], [72, 68], [58, 78]], "#c9bfe0", 1)}${blob(40, 40, 14, 12, "#cfc6e6", .6, 37)}
    ${[["#2a1606", 5.4], ["#c8a46a", 2]].map(([c, w]) => brush([[74, 36], [88, 35.4], [96.6, 37], [97, 50], [96, 63.6], [86, 64.6], [74, 64]], c, w, 1, `stroke-linejoin="round"`)).join("")}
    ${[[90, 35.6], [89, 64.4], [96.8, 50]].map(([x, y], k) => shape(curve(ring(x, y, 2.2, 2, 8, .1, k + 38)), "#c8a46a", AM.ink, [-.5, .4])).join("")}${brush([[97, 50], [106, 48], [110, 45]], AM.ink, 1)}${lan(112, 52, 1)}`,
  village: () => `${wash(.55, 80, "#1a0d04")}${moonDisc(80, 38, 17)}${brush([[70, 32], [80, 27], [90, 32]], "#d9d2ec", 1, .8)}${brush([[66, 44], [80, 51], [94, 44]], "#d9d2ec", 1, .8)}
    ${[...Array(10)].map((_, k) => { const a = k / 10 * Math.PI * 2 + .2; return lan(80 + Math.cos(a) * 36, 38 + Math.sin(a) * 15 + Math.cos(a * 2) * 2, .62 + (k % 3) * .06); }).join("")}${ground(84, 16, -4)}
    ${[[30, 85, 1], [58, 84, .8], [120, 84, 1.15]].map(([x, y, s]) => S(curve([[x - 8 * s, y + 1], [x - 8.4 * s, y - 9 * s], [x - 1.4 * s, y - 17 * s], [x - .2 * s, y - 17.4 * s], [x + 9 * s, y - 9.4 * s], [x + 8 * s, y + 1]])) +
      shape(curve([[x - 2 * s, y - 8 * s], [x + 2 * s, y - 8.2 * s], [x + 2.2 * s, y - 4 * s], [x - 2 * s, y - 3.8 * s]]), AM.glow, AM.mid, [-.4, .3]) + blob(x, y - 6 * s, 5 * s, 4 * s, AM.glow, .4, x | 0, "b")).join("")}`,
  window: () => `${wash(.55, 70, "#1a0d04")}${S(curve([[40, 18], [82, 15], [120, 20], [118, 50], [121, 82], [80, 84], [42, 81], [44, 50]]))}${blob(80, 50, 26, 22, AM.glow, .4, 39)}
    ${shape(curve([[62, 33], [80, 31], [99, 34], [98, 50], [99, 66], [80, 66.6], [61, 65.4], [62, 50]]), "#3a1e08", "#120801", [-1, .8])}${blob(84, 54, 12, 10, AM.glow, .3, 40)}
    ${lan(82, 55, 1.3)}${brush([[80.6, 32], [80, 48], [80.4, 66]], AM.ink, 2.2)}${brush([[62, 49], [80, 50], [98, 49.6]], AM.ink, 2.2)}
    ${S(curve([[56, 65], [104, 64], [106, 69], [55, 70]]), AM.mid)}${rim([[86, 64.6], [104, 64.2]], .5, .8)}`,
  rubble: () => `${wash(.55, 80, "#1a0d04")}${blob(80, 0, 14, 8, PALE, .45, 41)}${stones([[50, 8, 22, 12], [72, 6, 20, 13], [92, 10, 18, 11], [44, 22, 18, 12], [62, 21, 26, 14], [88, 24, 24, 12],
    [48, 38, 24, 13], [72, 37, 18, 12], [90, 39, 22, 13], [44, 54, 20, 12], [64, 52, 26, 14], [90, 55, 22, 12], [50, 69, 24, 13], [74, 68, 22, 13]])}
    ${S(curve([[-12, -12], [42, -12], [46, 30], [40, 70], [46, 106], [-12, 106]]))}${S(curve([[172, -12], [116, -12], [114, 40], [120, 72], [112, 106], [172, 106]]))}${moleSil(80, 98, .7)}${lan(90, 87, .6)}`,
  listening: () => `${wash(.55, 80, "#1a0d04")}${S(curve([[-12, -12], [172, -12], [172, 44], [130, 50], [98, 46], [70, 50], [40, 45], [-12, 46]]))}
    ${[[34, 53, 182], [60, 55, 168], [92, 51, 192], [122, 54, 176]].map(([x, y, a], k) => mothSil(x, y, .62 + (k % 2) * .1, PALE, .9, a)).join("")}
    ${[...Array(5)].map((_, k) => brush([[28 + k * 24, 40], [32 + k * 24, 36.6], [36 + k * 24, 40]], PALE, .7, .4)).join("")}${ground(92, 17)}`,
  thread: () => `${wash(1, 80, AM.ink)}${stones([[30, 6, 30, 18], [62, 4, 34, 20], [98, 8, 30, 18], [26, 28, 36, 20], [66, 30, 28, 18], [96, 30, 36, 20], [34, 54, 30, 20], [68, 52, 34, 22], [104, 56, 28, 18], [30, 78, 36, 18], [70, 78, 30, 20], [102, 80, 32, 18]], "#3a2008")}
    ${[[5, .2], [1.4, 1]].map(([w, op]) => `<path d="M82 -2 L78 22 L84 40 L79 58 L83 76 L80 102" stroke="${PALE}" stroke-width="${w}" fill="none" opacity="${op}" stroke-linejoin="round" ${w > 2 ? `filter="url(#${F}b)"` : ""}/>`).join("")}${spark(84, 40, 1.2, PALE)}`,
  sprout: () => `${blob(40, 64, 70, 14, AM.glow, .4, 42)}${ground(78, 18, 3)}${stumpSil(80, 79, 1.2, 7)}
    ${blob(82, 44, 16, 16, AM.glow, .45, 43)}${S(limb(80, 58, 78, 48, 82, 38, 1.4, .6), AM.glow, [-.4, .3])}
    ${shape(curve([[80, 49], [74, 44], [68, 46], [74, 51]]), AM.glow, AM.mid, [-.4, .4])}${shape(curve([[81, 42], [87, 36], [93, 38], [87, 44]]), AM.glow, AM.mid, [-.4, .4])}`,
  cart: () => `${wash(.55, 70, AM.ink)}${S(curve([[132, 94], [132, 50], [140, 32], [154, 24], [172, 30], [176, 94]]), "#120801", [-1, .8])}${ground(92, 19, 2)}
    ${S("M40 58 Q47 45 52 32.6 Q57 46 66 58 Q53 59.4 40 58 Z", AM.mid)}${S(curve([[64, 58], [65, 42], [82, 43], [82, 58]]), AM.mid)}${brush([[48, 30], [48, 44]], AM.ink, 1)}
    ${shape(curve([[48, 30.4], [57, 32.6], [48, 36]]), AM.glow, AM.mid, [-.4, .3])}${wagon(36, 58)}
    ${[42, 52, 62, 72, 82].map((x) => spark(x, 53 - Math.sin((x - 36) / 50 * Math.PI) * 4, .9)).join("")}${brush([[36, 54], [60, 47], [86, 54]], AM.ink, .7)}
    ${S(limb(86, 66, 92, 68, 98, 72, 1.4, 1))}${toadSil(102, 92, 1)}${moleSil(120, 92, .8)}${lan(128, 80, .8)}`,
  undermoon: () => `${wash(.6, 110, "#120801")}${moonDisc(106, 72, 19)}${brush([[92, 66], [106, 61], [120, 67]], "#d9d2ec", 1, .7)}${brush([[90, 77], [106, 83], [121, 76]], "#d9d2ec", 1, .7)}
    ${[...Array(8)].map((_, k) => mothSil(70 + (k * 19) % 70, 40 + (k * 13) % 50, .24, PALE, .7, k * 40)).join("")}
    ${S(curve([[-12, 40], [30, 38], [56, 41], [60, 50], [54, 66], [50, 106], [-12, 106]]))}${rim([[20, 38.6], [44, 39], [57, 44]], .3, 1)}
    ${toadSil(14, 40, .8)}${moleSil(32, 40, .8)}${S(limb(38, 26, 42, 22, 44, 18, 1.4, 1))}${lan(46, 23, .7)}`,
  moonbeam: () => `${wash(.55, 80)}${moonDisc(82, 8, 8)}<path d="${curve([[64, -4], [96, -4], [126, 104], [32, 104]])}" fill="${PALE}" opacity=".32" filter="url(#${F}s)"/>
    ${S(curve([[-12, -12], [62, -12], [52, 40], [40, 106], [-12, 106]]))}${S(curve([[172, -12], [100, -12], [110, 50], [122, 106], [172, 106]]))}
    ${stones([[22, 30, 16, 9], [126, 46, 14, 9], [14, 62, 18, 10]], AM.mid)}${[[70, 30], [88, 52], [76, 74], [96, 84]].map(([x, y]) => spark(x, y, .7, PALE, .6)).join("")}${ground(94, 20)}`,
  straight: () => `${wash(.55, 80)}<path d="${curve([[64, -4], [96, -4], [126, 104], [32, 104]])}" fill="${PALE}" opacity=".24" filter="url(#${F}s)"/>
    ${[...Array(4)].map((_, k) => brush([[48 + k * 21, 98], [48.6 + k * 21, 50], [48 + k * 21, 6]], PALE, .6, .45, `stroke-dasharray="2 4"`)).join("")}
    ${[...Array(12)].map((_, k) => mothSil(48 + (k % 4) * 21, 86 - Math.floor(k / 4) * 28 - (k % 4) * 4, .44 + (k % 3) * .04, PALE, .95, (k % 2 ? 3 : -3))).join("")}`,
  wickway: () => { const pts = [[20, 20], [50, 34], [86, 18], [124, 30], [146, 56], [110, 66], [74, 54], [40, 70], [16, 88], [60, 90], [100, 92], [140, 86]];
    const links = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [6, 7], [7, 8], [7, 9], [9, 10], [10, 5], [10, 11], [11, 4]];
    return `${wash(.6, 80, "#120801")}${links.map(([a, b]) => { const [x1, y1] = pts[a], [x2, y2] = pts[b], sag = [(x1 + x2) / 2, (y1 + y2) / 2 + Math.hypot(x2 - x1, y2 - y1) * .08];
      return brush([[x1, y1], sag, [x2, y2]], PALE, 3, .2, `filter="url(#${F}b)"`) + brush([[x1, y1], sag, [x2, y2]], PALE, .9, .7); }).join("")}${pts.map(([x, y], k) => lan(x, y, .7 + (k % 3) * .08)).join("")}`; },
  youngoak: () => `${blob(80, 62, 90, 18, AM.glow, .4, 44)}${ground(78, 21, -3)}${stumpSil(74, 79, 1.3, 9)}${oakSil(76, 60, .62, .4, 6)}
    ${[[56, 26], [100, 20], [88, 12], [64, 16], [110, 38]].map(([x, y]) => spark(x, y, 1.1)).join("")}${moleSil(118, 79, .8)}${toadSil(140, 79, .8, -1)}`,
};
export function memoryArt(kind, w = 160) {
  const id = "am" + uid++; F = id;
  return `<svg class="memArt" width="${w}" height="${w * .625}" viewBox="0 0 160 100" aria-hidden="true">
    <defs><radialGradient id="${id}" cx=".44" cy=".42" r=".78"><stop offset="0" stop-color="#c98a2c"/><stop offset=".7" stop-color="#7a4a14"/><stop offset="1" stop-color="#3a2208"/></radialGradient>
      <clipPath id="${id}c"><ellipse cx="80" cy="50" rx="78" ry="48"/></clipPath>
      <radialGradient id="${id}v" cx=".5" cy=".5" r=".6"><stop offset=".62" stop-color="#1a0d04" stop-opacity="0"/><stop offset="1" stop-color="#1a0d04" stop-opacity=".7"/></radialGradient>
      <filter id="${id}s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1"/></filter>
      <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .85  0 0 0 0 .55  0 0 0 1.4 -.5"/></filter></defs>
    <g clip-path="url(#${id}c)"><rect width="160" height="100" fill="url(#${id})"/>${(MEM[kind] || MEM.leaf)()}
      <rect width="160" height="100" fill="url(#${id}v)"/><rect width="160" height="100" filter="url(#${id}n)" opacity=".1"/>
      <path d="${curve(ring(52, 22, 38, 8, 10, .12, 1, -.22))}" fill="#fff" opacity=".08" filter="url(#${id}b)"/></g>
    <ellipse cx="80" cy="50" rx="78" ry="48" fill="none" stroke="#3a2208" stroke-width="3"/><ellipse cx="80" cy="50" rx="74" ry="44.5" fill="none" stroke="#ffd27a" stroke-width=".8" opacity=".35"/></svg>`;
}

// The old stump on the home screen. growth 0..1 (lifetime light released) brings moss, glowing roots and caps;
// sprout = the first green shoot (all of Heartroot Deep's memories found).
export function stumpArt(growth = 0, sprout = false, w = 300, tree = false) {
  const g = Math.max(0, Math.min(1, growth)), id = "st" + uid++, r = rng(5);
  const bark = "#6b4a32", barkLine = "#22140c", wood = "#b08a62", O = [-1.4, 1.2];
  // roots spread from the flared base and grip the ground; amber light creeps back into them as the wood heals
  const roots = [[118, 77, 106, 82, 94, 87, 7], [128, 80, 121, 86, 112, 90, 5], [182, 77, 194, 82, 206, 87, 7], [172, 80, 179, 86, 188, 90.5, 5], [150, 82, 153, 87, 158, 91, 4]];
  const rootSvg = roots.map(([x1, y1, cx, cy, x2, y2, wd]) => shape(limb(x1, y1, cx, cy, x2, y2, wd, .8), bark, barkLine, O)).join("") +
    (g ? `<path d="${curve(ring(150, 85, 64, 7, 10, .2, 7))}" fill="#f0b543" opacity="${(g * .3).toFixed(2)}" filter="url(#${id}b)"/>` +
      roots.map(([x1, y1, cx, cy, x2, y2, wd]) => `<path d="${limb(x1, y1 - 1, cx, cy - 1, x2, y2 - .5, wd * .3, .15)}" fill="#ffd27a" opacity="${(.25 + g * .6).toFixed(2)}"/>`).join("") : "");
  // the trunk: the pale cut face, then the front of the trunk, its lip following the face
  const body = curve([[120, 48], [117, 60], [114, 72], [107, 82], [128, 85.5], [150, 86.5], [172, 85.5], [193, 82], [186, 72], [183, 60], [180, 48],
    [173, 52.6], [162, 54.8], [150, 55.4], [138, 54.8], [127, 52.6]]);
  const face = curve(ring(150, 49, 30, 6.4, 14, .04, 9));
  const moss = [...Array(Math.round(g * 9))].map((_, k) => shape(curve(ring(118 + r() * 64, 64 + r() * 16, 4 + r() * 4, 2 + r() * 2, 8, .25, k + 3)), k % 2 ? "#4f7a3a" : "#5f9a45", "#24451f", [-.6, .5])).join("");
  const caps = [[96, 84], [206, 85], [194, 81]].slice(0, g > .35 ? Math.ceil((g - .35) * 5) : 0).map(([x, y], k) =>
    `<path d="${curve(ring(x, y - 8, 10, 8, 9, .2, 40 + k))}" fill="#9b7cf2" opacity=".25" filter="url(#${id}b)"/>${shape(limb(x, y, x - .4, y - 3, x, y - 6, 1.1, .9), "#d8cbb0", "#7a6e5a", [-.4, .4])}
    ${shape(curve([[x - 5, y - 5.6], [x - 2.4, y - 10.6], [x + 2.2, y - 10.8], [x + 5, y - 5.8], [x, y - 7.4]]), "#9b7cf2", "#3a2458", [-.5, .5])}`).join("");
  const oak = tree ? `<path d="${curve(ring(150, 8, 52, 46, 12, .12, 50))}" fill="#9be08a" opacity=".14" filter="url(#${id}b)"><animate attributeName="opacity" values=".08;.2;.08" dur="4s" repeatCount="indefinite"/></path>
    ${[[147, 50, 146, 30, 144, 14, 3.2], [153, 50, 154, 30, 157, 14, 3], [149, 32, 140, 22, 128, 21, 1.8], [151, 27, 162, 18, 173, 20, 1.8]].map(([x1, y1, cx, cy, x2, y2, wd]) => shape(limb(x1, y1, cx, cy, x2, y2, wd, wd * .45), "#6b4a2a", "#2e1e12", [-1, .9])).join("")}
    ${[[150, 2, 22], [128, 14, 16], [172, 12, 16], [138, -4, 14], [162, -4, 14]].map(([x, y, rr], k) => shape(curve(ring(x, y, rr, rr * .92, 12, .12, k + 20)), k ? "#558f40" : "#5f9a45", "#24451f", O)).join("")}
    <path d="${curve(ring(142, -6, 12, 9, 10, .2, 30))}" fill="#9bd47e" opacity=".45"/>${[[136, 6], [160, 0], [148, -10], [170, 14]].map(([x, y], k) => `<path d="${curve(ring(x, y, 1.7, 1.4, 6, .25, 60 + k))}" fill="#fff3a0"/>`).join("")}` : "";
  const t = 8 + g * 10, shoot = sprout && !tree ? `<path d="${curve(ring(150, 40 - t, 13 + g * 8, 12 + g * 7, 10, .15, 70))}" fill="#9be08a" opacity=".18" filter="url(#${id}b)"><animate attributeName="opacity" values=".1;.26;.1" dur="3s" repeatCount="indefinite"/></path>
    ${shape(limb(150, 50, 148, 44 - t * .6, 151, 44 - t * 1.4, 1.4, .7), "#5f9a45", "#24451f", [-.5, .4])}
    ${shape(`M150 ${44 - t * .8} Q140 ${40 - t * .8} 138 ${44 - t * .8} Q144 ${48 - t * .8} 150 ${44 - t * .8} Z`, "#9be08a", "#3f6a2f", [-.5, .4])}${shape(`M151 ${44 - t * 1.3} Q162 ${38 - t * 1.3} 164 ${42 - t * 1.3} Q158 ${47 - t * 1.3} 151 ${44 - t * 1.3} Z`, "#9be08a", "#3f6a2f", [-.5, .4])}` : "";
  return `<svg class="stumpArt" width="${w}" height="${w * (tree ? .46 : .3)}" viewBox="0 ${tree ? -48 : 0} 300 ${tree ? 138 : 90}" aria-hidden="true">
    <path d="M0 80 Q150 70 300 80 V90 H0 Z" fill="#14241a"/>
    <defs><filter id="${id}b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
      <filter id="${id}s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.2"/></filter><clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
    <path d="${curve(ring(150, 86, 52, 4, 12, .2, 3))}" fill="#000" opacity=".35" filter="url(#${id}s)"/>
    ${rootSvg}
    ${shape(face, wood, "#4a2e1a", [-1, .9])}
    <g fill="none" stroke="#7a5638" stroke-width=".8" opacity=".7">${[22, 15, 8].map((rx, k) => `<path d="${curve(ring(151, 49.2, rx, rx * .2, 12, .06, 11 + k))}"/>`).join("")}</g>
    ${stroke(152, 49, -2.9, 14, .7, "#4a2e1a", .6, .05)}
    ${shape(body, bark, barkLine, O)}
    <g clip-path="url(#${id}c)">
      <path d="${curve(ring(122, 74, 22, 26, 10, .2, 13))}" fill="#2a2030" opacity=".55" filter="url(#${id}b)"/>
      <path d="${curve(ring(180, 62, 14, 22, 10, .2, 14))}" fill="#d08850" opacity=".35" filter="url(#${id}b)"/>
      ${[...Array(6)].map((_, k) => { const x = 122 + k * 11 + (r() - .5) * 3; return stroke(x, 60 + r() * 4, 1.57 + (x - 150) * .006, 16 + r() * 6, .8, barkLine, .25, .1); }).join("")}
    </g>
    <path d="${curve([[181, 50], [184, 62], [188, 74]], false)}" stroke="#ffc98a" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round" filter="url(#${id}s)"/>
    ${moss}${caps}${shoot}${oak}</svg>`;
}

// Granny Burr: Dibble's grandmother, keeper of the Lantern Moles. Built on Dibble so she reads as family:
// silver fur, a plum shawl, a bun with a knitting needle, round spectacles, her old lantern.
export function granny(size = 96) {
  const id = "gr" + uid++, glow = LANTERN_GLOW.granny, line = "#4a4038";
  // hat-hook coordinates (the old 100-box head): eyes sit at about (50, 37.5) and (63.3, 36.6)
  const over = `${shape(curve(ring(47, 19, 7.4, 5.6, 12, .06, 3)), "#d9d2c8", "#7a7066", [-.7, .7])}<path d="M43 17 Q47 14.4 51 16" stroke="#fff" stroke-width=".8" opacity=".5" fill="none"/>
    ${shape(limb(38.6, 13.4, 47, 18, 56, 23.4, .7, .6), "#8a5a32", "#3a2418", [-.4, .4])}${shape(curve(ring(38.4, 13.2, 1.4, 1.4, 8, .05, 5)), "#c8553d", "#5a1e14", [-.3, .3])}
    <g fill="#cfefff" fill-opacity=".14" stroke="#b8902e" stroke-width=".9"><path d="${curve(ring(50, 37.6, 4.8, 4.8, 12, .02, 7))}"/><path d="${curve(ring(63.3, 36.7, 4.8, 4.8, 12, .02, 9))}"/></g>
    <path d="M54.8 37.2 Q56.6 35.8 58.5 37" stroke="#b8902e" stroke-width=".8" fill="none"/><path d="M45.2 37 L41.4 35.4 M68.1 36.4 L71.6 34.6" stroke="#b8902e" stroke-width=".7"/>
    <path d="M47 34.6 q1.2 -.9 2.6 -.6 M60.4 33.8 q1.2 -.9 2.6 -.6" stroke="#fff" stroke-width=".5" opacity=".7" fill="none"/>
    <path d="M45.6 31.4 Q49.6 29.6 53.4 31 M59.4 30.4 Q63.2 28.8 66.8 30.4" stroke="${line}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  const D = dibbleBody(id, { fur: FUR.silver[0], scarf: "#8a5a8a", hat: over, lantern: lanternArt("granny", id + "L") });
  return svg(size, "0 0 100 100", `
    <defs><radialGradient id="${id}g"><stop offset="0" stop-color="${glow}" stop-opacity=".6"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>${D.defs}</defs>
    <circle cx="75" cy="77" r="20" fill="url(#${id}g)"><animate attributeName="r" values="18;21;18" dur="2.6s" repeatCount="indefinite"/></circle>
    ${bob(`<g transform="translate(2 2) scale(.37) translate(-34 -158)">${D.body}</g>`, 3.8, 1.2)}
  `, "granny");
}

// The Pale Bidder: an old moth, wings folded into a cloak, holding the heart-shard up like a candle.
export function bidder(size = 96, shard = true) {
  const id = "pb" + uid++, wing = "#eee6fb", fur = "#d8cdf2", wl = mix(wing, "#2a1a3a", .55), fl = mix(fur, "#2a1a3a", .6), O = [-.8, .7];
  const cloak = curve([[50, 44], [36, 50], [24, 68], [18, 96], [50, 98], [82, 96], [76, 68], [64, 50]]);
  return svg(size, "0 0 100 100", `
    <defs><radialGradient id="${id}g"><stop offset="0" stop-color="#ff9db5" stop-opacity=".75"/><stop offset="1" stop-color="#ff4f7a" stop-opacity="0"/></radialGradient>
      <filter id="${id}s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
      <filter id="${id}b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".8"/></filter><clipPath id="${id}c"><path d="${cloak}"/></clipPath></defs>
    <path d="${curve(ring(50, 97, 30, 2.8, 12, .2, 3))}" fill="#000" opacity=".28" filter="url(#${id}b)"/>
    ${bob(`
    ${shape(cloak, wing, wl, O)}
    <g clip-path="url(#${id}c)"><path d="${curve(ring(30, 84, 16, 22, 9, .2, 5))}" fill="#a897c8" opacity=".5" filter="url(#${id}s)"/>
      <path d="${curve(ring(70, 62, 9, 16, 9, .2, 7))}" fill="#ffffff" opacity=".6" filter="url(#${id}s)"/></g>
    ${[[50, 48, 1.92, 48], [50, 48, 1.2, 50], [50, 48, 1.57, 48]].map(([x, y, a, l]) => stroke(x, y, a, l, .45, "#a897c8", .6, .03)).join("")}
    ${[30, 70].map((x) => `<path d="${curve(ring(x, 86, 4, 4, 9, .1, x))}" fill="#b9a8d8" opacity=".55"/><path d="${curve(ring(x, 86, 1.6, 1.6, 7, .1, x + 1))}" fill="#fff6d8" opacity=".9"/>`).join("")}
    <path d="M22 92 Q50 98 78 92" stroke="#8f7cb8" stroke-width="1" fill="none" stroke-dasharray="2 2.5"/>
    ${shape(curve(ring(50, 52, 20, 9, 14, .12, 6)), "#fff8ea", mix("#fff8ea", "#3a2a1a", .45), O)}
    ${[...Array(7)].map((_, k) => stroke(34 + k * 5.4, 57 + (k % 2), 1.57 + (k - 3) * .12, 3.4, .9, "#e6dccb", .9, .1)).join("")}
    <path d="M41 23 Q34 8 22 7 M59 23 Q66 8 78 7" stroke="${fl}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <g stroke="${fl}" stroke-width=".8" stroke-linecap="round">${[.2, .4, .6, .8].map((t) => { const x = 41 - 19 * t, y = 23 - 16 * t + 10 * t * t;
      return `<path d="M${x} ${y} l-3 -3 M${100 - x} ${y} l3 -3"/>`; }).join("")}</g>
    ${shape(curve(ring(50, 34, 17, 15, 14, .08, 4)), fur, fl, O)}
    <path d="${curve(ring(42, 40, 9, 6, 9, .2, 8))}" fill="#a897c8" opacity=".5" filter="url(#${id}s)"/>
    ${pieEye(43, 34, 11, 6.5, 4.4, 5.4, fl, 1)}${pieEye(57, 34, 13, 6.9, 4.4, 5.4, fl, 1)}
    <path d="M38 29.4 Q43 27.4 48 29.4 M52 29.4 Q57 27.4 62 29.4" stroke="${fl}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M47 42 Q50 43.6 53 42" stroke="${fl}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="${curve(ring(36, 40, 4, 2.2, 8, .2, 9))}" fill="#ff8fa3" opacity=".28" filter="url(#${id}b)"/><path d="${curve(ring(64, 40, 4, 2.2, 8, .2, 10))}" fill="#ff8fa3" opacity=".28" filter="url(#${id}b)"/>
    ${shard ? `<circle cx="50" cy="66" r="16" fill="url(#${id}g)"><animate attributeName="r" values="14;18;14" dur="2.4s" repeatCount="indefinite"/></circle>
      ${shape("M50 56 L56 66 L50 76 L44 66 Z", "#ff6f8f", "#7a2a3a", [-.6, .5])}<path d="M50 58 L53 66 L50 66 Z" fill="#fff" opacity=".7"/>` : ""}
    ${shape(curve([[40, 70], [43, 65], [46, 68], [45, 72.6], [41, 72.4]]), fur, fl, [-.5, .5])}${shape(curve([[60, 70], [57, 65], [54, 68], [55, 72.6], [59, 72.4]]), fur, fl, [-.5, .5])}
    ${[...Array(5)].map((_, k) => `<circle cx="${26 + k * 12}" cy="${60 + (k % 2) * 8}" r=".9" fill="#fff"><animate attributeName="opacity" values="0;1;0" dur="${2 + k * .4}s" begin="${-k * .5}s" repeatCount="indefinite"/></circle>`).join("")}
    `, 3.8, 1.2)}`, "bidder");
}

// The one Wickway lantern nobody has lit yet: dark glass, a little toad print on the frame (the next Ring).
export function darkLantern(w = 160, h = 96) {
  return `<svg class="scene" width="${w}" height="${h}" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="160" height="96" fill="#14100c"/><path d="${curve(ring(80, 52, 40, 40, 12, .1, 3))}" fill="#f4f0ff" opacity=".04"/>
    <path d="M80 8 Q81 14 80 20" stroke="#4a3a2a" stroke-width="2" fill="none"/><path d="M70 22 Q80 14 90 22" stroke="#6b5a40" stroke-width="2" fill="none"/>
    ${shape(curve([[64, 24.6], [96, 24.4], [96.4, 31.6], [63.6, 31.8]]), "#5b4630", "#2a1d12", [-1, .9])}
    ${shape(curve([[67, 32], [93, 32], [94, 52], [93, 72], [67, 72], [66, 52]]), "#26201a", "#0e0a06", [-1.2, 1])}<path d="M73 33 V71 M87 33 V71" stroke="#3a3026" stroke-width="1.4"/>
    <path d="M70 38 V52" stroke="#fff" stroke-width="1.2" opacity=".12" stroke-linecap="round"/>
    ${shape(curve([[62, 72.4], [98, 72.2], [98.4, 79.6], [61.6, 79.8]]), "#5b4630", "#2a1d12", [-1, .9])}
    <g fill="#9fbf6a" opacity=".85" transform="translate(80 76)"><path d="${curve(ring(0, 1, 3, 2, 8, .1, 1))}"/>${[[-3.6, -2.4], [0, -3.4], [3.6, -2.4]].map(([x, y], k) => `<path d="${curve(ring(x, y, 1.1, 1.1, 6, .1, k + 2))}"/>`).join("")}</g>
  </svg>`;
}

// Ambient life: every 30–90s something passes far behind the board or the camp, different in every place, and once
// in a while another lantern-bearing mole peeks over the board. Purely visual: nothing here touches the game rules.
// One thing moves at a time, nothing at all under reduced motion (the peek then just fades in and out).
import { curve, ring, limb, mix } from "./paint.js";
import { dibble, FUR } from "./art.js";

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
const Q = new URLSearchParams(location.search), FORCE = Q.get("life"); // ?life=owl shows that one every few seconds, ?peek the other lantern at once
const ease = (t) => t * t * (3 - 2 * t), fade = (t, e = .12) => Math.min(1, t / e, (1 - t) / e);

// ---- shapes (paint.js curves, drawn around 0,0) and the sprites baked from them, once each ----
const D = {
  bird: curve([[-10, 1], [-6, -3], [-1, 0], [0, 1.5], [1, 0], [6, -3], [10, 1], [5, -1], [0, 2.6], [-5, -1]]),
  owl: curve([[-30, 3], [-20, -6], [-8, -5], [-4, -9], [4, -9], [8, -5], [20, -6], [30, 3], [17, 0], [7, 4], [3, 11], [-3, 11], [-7, 4], [-17, 0]]),
  bat: curve([[-15, 0], [-11, -6], [-5, -2], [-2, -5], [0, -3], [2, -5], [5, -2], [11, -6], [15, 0], [10, -1], [7, 2], [3, 0], [0, 3], [-3, 0], [-7, 2], [-10, -1]]),
  moth: curve(ring(-4, -1, 5, 3.4, 8, .2, 3, -.5)) + curve(ring(4, -1, 5, 3.4, 8, .2, 4, .5)) + curve(ring(0, 1, 1.4, 3.4, 6, .1, 5)),
  bigmoth: [1, -1].map((m) => curve([[1, -2], [10, -12], [22, -15], [27, -9], [19, -1], [4, 1]].map(([x, y]) => [x * m, y])) + curve([[2, 1], [14, 3], [19, 10], [11, 16], [3, 8]].map(([x, y]) => [x * m, y]))).join(" ")
    + curve(ring(0, 2, 1.8, 8, 8, .1, 7)) + limb(-1, -5, -4, -11, -8, -13, .5, .3) + limb(1, -5, 4, -11, 8, -13, .5, .3),
  deer: [curve(ring(0, 0, 15, 7.5, 10, .1, 21)), limb(10, -3, 15, -12, 17, -21, 4.2, 3), curve(ring(20, -22, 5.4, 3.2, 8, .1, 22, .3)),
    limb(16, -25, 15, -31, 12, -37, 1, .5), limb(18, -25, 20, -32, 24, -36, 1, .5), limb(14.5, -30, 11, -31, 9, -33, .7, .3), limb(19.5, -30, 23, -31, 25, -30, .7, .3),
    ...[-10, -6, 7, 11].map((x) => limb(x, 3, x + .5, 13, x - .5, 22, 2.2, 1.2)), limb(-14, -3, -17, -2, -18, 1, 1.6, 1)].join(" "),
  hare: [curve(ring(0, 0, 9, 6.5, 9, .1, 31)), curve(ring(8, -6, 4.4, 3.6, 8, .1, 32)), limb(7, -8, 6, -15, 3, -21, 1.6, .9), limb(9, -8, 10, -15, 9, -21, 1.6, .9),
    curve(ring(-9, -1, 2.6, 2.4, 6, .1, 33)), limb(-4, 4, -2, 7, 2, 7.5, 2.4, 1.6)].join(" "),
  beetle: [curve(ring(0, -4, 7, 4.6, 10, .06, 41)), curve(ring(7.6, -2.6, 2.4, 2, 6, .1, 42)),
    ...[-4, 0, 4].map((x) => limb(x, -1, x - 1.4, 1.5, x - 2.6, 3, .7, .4)), limb(9, -3.6, 12, -6, 13, -5, .4, .3)].join(" "),
  tail: limb(-110, 0, 0, -12, 110, 3, 12, .8),
  dot: curve(ring(0, 0, 2, 2, 8, .15, 51)),
  eye: curve(ring(0, 0, 3.2, 2.1, 8, .1, 61)),
};
const LIT = { spore: "#c9f5a0", lilac: "#d9ccff", ember: "#ffb15a", crumb: "#f4f0ff", lamp: "#ffd27a", flake: "#ffffff", eye: "#e8e0b0" };
const sprites = {}, urls = {};
function sprite(key) { // "bird" → dark with a faint rim of light up-left; "dot:ember" → a soft light of that colour
  if (sprites[key]) return sprites[key];
  const [name, lit] = key.split(":"), p = new Path2D(D[name]), S = 2, pad = lit ? 10 : 4;
  const m = document.createElementNS("http://www.w3.org/2000/svg", "path"); m.setAttribute("d", D[name]);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.append(m); svg.style.cssText = "position:absolute;visibility:hidden"; document.body.append(svg);
  const b = m.getBBox(); svg.remove();
  const c = document.createElement("canvas"); c.width = (b.width + pad * 2) * S; c.height = (b.height + pad * 2) * S;
  const g = c.getContext("2d"); g.scale(S, S); g.translate(pad - b.x, pad - b.y);
  const soft = (col, blur, dx = 0, dy = 0) => { g.save(); g.shadowColor = col; g.shadowBlur = blur * S; g.shadowOffsetX = (dx + 2000) * S; g.shadowOffsetY = dy * S; g.translate(-2000, 0); g.fillStyle = "#000"; g.fill(p); g.restore(); };
  if (lit) { soft(LIT[lit], 8); soft(LIT[lit], 1.2); soft(mix(LIT[lit], "#ffffff", .5), .5); }
  else { soft("rgba(220,232,240,.28)", 1.4, -1, -1); soft("rgba(6,8,10,.94)", 1.4); }
  return sprites[key] = { c, w: c.width / S, h: c.height / S, ox: b.x - pad, oy: b.y - pad };
}
const url = (key) => urls[key] ??= sprite(key).c.toDataURL();

// ---- what passes, and how: each kind returns its members at time t (0..1) as { x, y, s, sy, r, a, sp } ----
// B: the band it lives in { x0, x1, y0, y1, ledge (the line things walk along), far / dark: [[x, y], ...] (spots for a far lantern / eyes) }
const across = (e, B, t, m = 60) => e.dir > 0 ? B.x0 - m + (B.x1 - B.x0 + 2 * m) * t : B.x1 + m - (B.x1 - B.x0 + 2 * m) * t;
const flyer = (sp, n, dur, gap, flap, size = 1) => ({ n, dur, run: (e, t, k, B, now) => {
  const row = k - (n - 1) / 2, x = across(e, B, t, 80) - e.dir * Math.abs(row) * gap, y = e.y + Math.abs(row) * gap * .45 + row * 2 + Math.sin(now / 900 + k) * 3;
  return { x, y, s: size * e.dir, sy: flap ? .25 + .75 * Math.cos(now / flap + k * 1.7) : 1, a: .85 }; }, sp: () => sp });
const hauling = (n, dur, wob) => ({ n, dur, sp: (e, k) => k % 2 ? "dot:" + e.lit : "moth", run: (e, t, k, B, now) => { const i = k >> 1, x = across(e, B, t, 140) - e.dir * i * 28,
  y = e.y + Math.sin(now / (wob > 5 ? 230 : 400) + i * 1.3) * wob + i * 1.5, fl = .55 + .45 * Math.abs(Math.cos(now / 90 + i));
  return k % 2 ? { x, y: y + 7, s: .9, a: .9 } : { x, y, s: 1.2 * e.dir, sy: fl, a: .85 }; } });
const KINDS = {
  birds: flyer("bird", 7, 13, 14, 140, 1.3), // a loose flock crossing the sky
  owl: { n: 1, dur: 11, sp: () => "owl", run: (e, t, k, B, now) => ({ x: across(e, B, t, 50), y: B.y0 + 16 + t * 24 + Math.sin(t * 6) * 3, s: e.dir,
    sy: .82 + .18 * Math.cos(Math.max(0, Math.sin(now / 900)) ** 6 * 6), a: .9 }) },
  bat: { n: 1, dur: 4.5, sp: () => "bat", run: (e, t, k, B, now) => ({ x: across(e, B, t, 30), y: e.y + Math.sin(t * 9) * 14 + Math.sin(t * 23) * 4, s: .9 * e.dir, sy: .2 + .8 * Math.abs(Math.cos(now / 55)), a: .85 }) },
  deer: { n: 1, dur: 30, sp: () => "deer", run: (e, t, k, B, now) => { // walks, stops to look round, walks on
    const p = t < .4 ? t / .4 * .45 : t < .62 ? .45 : .45 + (t - .62) / .38 * .55, walk = p !== .45;
    return { x: across(e, B, p, 40), y: B.ledge - 22 - (walk ? Math.abs(Math.sin(now / 260)) * 1.2 : 0), s: .8 * e.dir, a: .9 * fade(t, .05) }; } },
  hare: { n: 1, dur: 9, sp: () => "hare", run: (e, t, k, B) => { const p = t < .45 ? t / .45 * .5 : t < .6 ? .5 : .5 + (t - .6) / .4 * .5, hop = p === .5 ? 0 : Math.abs(Math.sin(p * Math.PI * 12));
    return { x: across(e, B, p, 30), y: B.ledge - 8 - hop * 9, s: .9 * e.dir, r: hop * .2 * -e.dir, a: .9 }; } },
  beetle: { n: 1, dur: 26, sp: () => "beetle", run: (e, t, k, B, now) => ({ x: across(e, B, t, 20), y: B.ledge - 1 + Math.sin(now / 70) * .3, s: 2 * e.dir, a: .9 }) },
  spores: { n: 6, dur: 12, sp: (e) => "dot:" + e.lit, run: (e, t, k, B, now) => ({ x: across(e, B, t * .8 + k * .03, 20) + Math.sin(now / 1300 + k * 2) * 18, y: e.y + 20 - k * 7 - t * 30 + Math.sin(now / 1700 + k) * 6,
    s: 1.3 + (k % 3) * .4, a: .55 * fade(t, .2) * (.6 + .4 * Math.sin(now / 600 + k)) }) },
  gust: { n: 9, dur: 5, sp: () => "dot:flake", run: (e, t, k, B, now) => ({ x: across(e, B, Math.min(1, t * 1.3 - k * .03), 20), y: e.y + (k - 4) * 6 + Math.sin(t * 8 + k) * 9, s: 1 + (k % 3) * .35, a: .7 }) },
  // the Pale Bidder's kin, each hauling a crumb of light home (ember moths in the burnt mines carry sparks)
  haulers: hauling(10, 16, 3), embers: hauling(6, 12, 12),
  wing: { n: 1, dur: 9, sp: () => "bigmoth", run: (e, t, k, B, now) => ({ x: across(e, B, t, 90), y: e.y + 8 + Math.sin(t * 3) * 8, s: 3.2 * e.dir, sy: .75 + .25 * Math.cos(now / 380), r: Math.sin(t * 4) * .15, a: .5 * fade(t, .25) }) }, // a big moth, close by and out of focus
  tail: { n: 1, dur: 8, sp: () => "tail", run: (e, t, k, B) => ({ x: across(e, B, t, 130), y: B.ledge - 6, s: e.dir, r: Math.sin(t * 7) * .05, a: .9 }) },
  eyes: { n: 2, dur: 5, sp: () => "eye:eye", run: (e, t, k) => { const b = t > .48 && t < .54 ? .1 : 1; // two eyes in the dark; one slow blink
    return { x: e.spot[0] + (k ? 10 : -10), y: e.spot[1] + (k ? -1 : 0), s: 1, sy: b, a: .75 * fade(t, .2) }; } },
  lamp: { n: 1, dur: 7, sp: () => "dot:lamp", run: (e, t) => ({ x: e.spot[0] + t * 6 * e.dir, y: e.spot[1], s: 1.2, a: .9 * Math.sin(t * Math.PI * 3) ** 2 }) }, // a far lantern: three slow blinks
  skybird: { n: 1, dur: 12, sp: () => "bird", run: (e, t, k, B, now) => { const a = t * Math.PI * 3 * e.dir; // circling high up, in the shaft of light
    return { x: (B.x0 + B.x1) / 2 + Math.cos(a) * 34, y: (B.y0 + B.y1) / 2 - 10 + Math.sin(a) * 10, s: 1.2 * (Math.sin(a) > 0 ? 1 : -1), sy: .35 + .65 * Math.cos(now / 220), a: .85 * fade(t, .15) }; } },
};
// what each place has: camp sites and mine features
const POOLS = { stump: ["birds", "owl", "deer"], underroot: ["haulers", "tail", "eyes", "lamp"], skywell: ["haulers", "eyes", "lamp"], sky: ["skybird", "birds", "haulers"], // sky: the Skywell, opened
  moss: ["beetle", "spores", "lamp"], lava: ["embers", "bat"], caps: ["spores", "bat", "lamp"], snow: ["hare", "gust"], geode: ["bat", "lamp"],
  heart: ["eyes", "tail", "lamp"], scorch: ["haulers", "tail", "eyes"], scales: ["haulers", "wing"], loom: ["wing", "haulers", "lamp"],
  lanterns: ["lamp", "haulers"], shaft: ["skybird", "bat"] };
const LIGHT = { caps: "lilac", lava: "ember" }; // spores and carried crumbs take the mine's colour

// one scheduler for whichever place is showing: quiet for 30–90s, then one thing passes
function makeLife() {
  let ev = null, next = 0, place = "";
  return (where, B, now, extra) => {
    if (still) return null;
    if (where !== place) { place = where; ev = null; next = now + (FORCE ? 1500 : rnd(12e3, 35e3)); } // somewhere new: the first one comes a little sooner
    if (!ev && now > next) {
      const pool = [...POOLS[where] || [], ...extra || []], id = FORCE || pick(pool), kind = KINDS[id];
      if (!kind) { next = now + rnd(30e3, 90e3); return id; } // not a silhouette (Puddock's hum): the caller acts on it
      ev = { kind, at: now, dir: Math.random() < .5 ? 1 : -1, y: rnd(B.y0 + 14, Math.max(B.y0 + 16, B.y1 - 14)), lit: id === "embers" ? "ember" : LIGHT[where] || (id === "spores" ? "spore" : "crumb"),
        spot: pick(id === "eyes" ? B.dark : B.far) };
    }
    if (!ev) return null;
    const t = (now - ev.at) / (ev.kind.dur * 1e3); if (FORCE) window.lifeT = t; // for screenshots
    if (t >= 1) { ev = null; next = now + (FORCE ? 2500 : rnd(30e3, 90e3)); return null; }
    return [...Array(ev.kind.n)].map((_, k) => ({ sp: ev.kind.sp(ev, k), ...ev.kind.run(ev, t, k, B, now) }));
  };
}
const mine = makeLife();

// ---- the mine: drawn on the board canvas, between the painted cave and the board ----
// G: { W, bx, by, bw, top (of the HUD), low (top of the tray), feature, busy (a piece is in hand) }
// Flyers keep to the band above the board, walkers go along the Rootline at its top edge, eyes open in the dark below it.
export function drawLife(ctx, now, G) {
  const ledge = G.by - 16, y1 = ledge - 24, gap = G.low - (G.by + G.bw + 28) > 60, B = { x0: 0, x1: G.W, y0: G.top, y1, ledge,
    far: [[G.W * .36, G.top + 26], [G.W * .62, G.top + 18]], dark: gap ? [[22, G.by + G.bw + 36], [G.W - 22, G.by + G.bw + 30]] : [[G.W * .4, y1 - 10], [G.W * .6, y1 - 6]] };
  if (peek && (peek.at || !G.busy)) return drawPeek(ctx, now, G, ledge); // never pops up mid-drag: it waits for the piece to land
  const list = mine(G.feature, B, now);
  if (Array.isArray(list)) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, G.W, ledge + 2); ctx.clip(); for (const m of list) put(ctx, m); ctx.restore(); }
}
function put(ctx, m) {
  const S = sprite(m.sp); ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, m.a ?? 1)); ctx.translate(m.x, m.y); if (m.r) ctx.rotate(m.r);
  ctx.scale(m.s, Math.abs(m.s) * (m.sy ?? 1)); ctx.drawImage(S.c, S.ox, S.oy, S.w, S.h); ctx.restore();
}

// ---- another lantern: a mole with a random look peeks over the board's top edge, about once a session ----
let peek = null, peekDone = false, peekTimer = 0;
const PEEK_LINES = ["<i>Another lantern down here…</i>", "<i>A lantern waves back, then it's gone.</i>", "<i>Someone else is digging. Somewhere.</i>"];
// on a new dig: a 1-in-3 chance, once per session, 20–60s in (looks: [[part, [values]], ...] from the wardrobe)
export function lifeDig(looks, ok) {
  clearTimeout(peekTimer); peek = null;
  if (!Q.has("peek") && (peekDone || !ok || Math.random() > 1 / 3)) return;
  peekTimer = setTimeout(() => {
    const look = Object.fromEntries(looks.map(([part, vals]) => [part, pick(vals)])), img = new Image();
    img.onload = () => { // rasterised once: an svg image redrawn every frame would be re-rendered every frame
      const c = document.createElement("canvas"); c.width = c.height = 200; c.getContext("2d").drawImage(img, 0, 0, 200, 200);
      if (!peekDone || Q.has("peek")) peek = { img: c, look, at: 0, x: Math.random() }; };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(dibble(100, look).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'));
  }, Q.has("peek") ? 2500 : rnd(20e3, 60e3));
}
export const lifeStop = () => { clearTimeout(peekTimer); peek = null; };
function drawPeek(ctx, now, G, ledge) {
  const P = peek, sz = Math.min(96, G.bw * .25), T = 3.6e3; if (!P.at) { P.at = now; peekDone = true; }
  const t = (now - P.at) / T; if (t >= 1) return void (peek = null); if (Q.has("peek")) window.lifeT = t;
  const x = G.bx + sz * .2 + P.x * (G.bw - sz * 1.4), up = still ? 1 : ease(Math.min(1, t / .14, (1 - t) / .12)); // rise, look about, duck
  const lift = still ? 0 : P.waved ? Math.sin(Math.min(1, (now - P.waved) / 500) * Math.PI) * .25 : (t > .45 && t < .7 ? Math.sin((t - .45) / .25 * Math.PI) * .22 : 0); // holds the lantern up
  const y = ledge - sz * (.62 + lift) * up;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, G.W, ledge + 1); ctx.clip(); ctx.globalAlpha = still ? Math.min(1, t / .1, (1 - t) / .1) : 1;
  ctx.translate(x + sz / 2, y + sz); if (!still) ctx.rotate(Math.sin(t * 9) * .06); ctx.drawImage(P.img, -sz / 2, -sz, sz, sz);
  if ((t > .3 && t < .34) || (t > .62 && t < .66)) { ctx.fillStyle = mix(FUR_OF(P.look), "#000000", .1); // a blink: lids over both eyes
    for (const [ex, ey] of [[44.9, 30.1], [55.3, 29.4]]) { ctx.beginPath(); ctx.ellipse(-sz / 2 + ex / 100 * sz, -sz + ey / 100 * sz, sz * .026, sz * .034, 0, 0, 7); ctx.fill(); } }
  ctx.restore(); P.box = [x, y, sz, ledge - y];
}
const FUR_OF = (look) => (FUR[look.fur] || FUR.cocoa)[0];
// a tap on the mole while it's up: it lifts its lantern and slips away; returns the line to show (null if the tap missed)
export function lifeTap(x, y) {
  const b = peek?.box; if (!b || x < b[0] - 12 || x > b[0] + b[2] + 12 || y < b[1] - 12 || y > b[1] + b[3] + 12) return null;
  if (peek.waved) return null;
  peek.waved = performance.now(); peek.at = Math.min(peek.at, performance.now() - 3.6e3 * .6); // wave, then duck a moment later
  return pick(PEEK_LINES);
}

// ---- the camp: the same scheduler, drawn as <image>s in a layer of the camp svg, in front of the tall pines ----
const camp = makeLife();
let campRaf = 0, campWait = 0;
export function campLife(svg, site, hooks) {
  cancelAnimationFrame(campRaf); clearTimeout(campWait); if (still || !svg) return;
  const far = svg.querySelector('[data-depth=".15"] > g'), tall = svg.querySelector('[data-depth=".22"]'), mid = svg.querySelector('[data-depth=".3"] > g'), shelf = svg.querySelector('[data-tip="shelf"]');
  if (!far || !tall || !mid) return;
  const T = far.transform.baseVal[0].matrix.f + 24, yH = mid.transform.baseVal[0].matrix.f + 180, top = shelf ? shelf.getBBox().y - 8 : yH - 90; // T: under the top bar; yH: the far edge of the clearing
  const B = { x0: 0, x1: svg.viewBox.baseVal.width, y0: T - 40, y1: Math.max(T + 10, top), ledge: yH + 8, far: [[372, yH - 46], [374, yH - 84]] }; B.dark = B.far; // dark spots between the trees, right of the shelf
  const layer = document.createElementNS("http://www.w3.org/2000/svg", "g"); layer.setAttribute("class", "life"); layer.dataset.depth = ".25"; tall.after(layer); // drifts with the parallax too
  const imgs = [];
  const loop = (now) => {
    if (!layer.isConnected) return;
    const list = document.hidden || !hooks.visible() ? null : camp(site, B, now, hooks.extra);
    if (Array.isArray(list)) campRaf = requestAnimationFrame(loop); else campWait = setTimeout(() => loop(performance.now()), 1000); // idle: nothing to draw
    if (typeof list === "string") hooks[list]?.();
    if (!Array.isArray(list) && !imgs.length) return;
    (Array.isArray(list) ? list : []).forEach((m, k) => {
      const S = sprite(m.sp), im = imgs[k] ??= layer.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "image"));
      if (im.dataset.sp !== m.sp) { im.dataset.sp = m.sp; im.setAttribute("href", url(m.sp)); im.setAttribute("x", S.ox); im.setAttribute("y", S.oy); im.setAttribute("width", S.w); im.setAttribute("height", S.h); }
      im.setAttribute("transform", `translate(${m.x.toFixed(1)} ${m.y.toFixed(1)}) rotate(${((m.r || 0) * 57.3).toFixed(1)}) scale(${m.s} ${(Math.abs(m.s) * (m.sy ?? 1)).toFixed(2)})`);
      im.setAttribute("opacity", Math.max(0, Math.min(1, m.a ?? 1)).toFixed(2));
    });
    for (let k = Array.isArray(list) ? list.length : 0; k < imgs.length; k++) imgs[k].setAttribute("opacity", 0);
  };
  campRaf = requestAnimationFrame(loop);
}

// after a long time away: small mole prints lead out of the old stump and off towards the trees
export function campPrints(svg) {
  const ground = svg?.querySelector('[fill="url(#campGround)"]'), stump = svg?.querySelector('[data-tap="memories"] rect');
  if (!ground || !stump) return;
  const b = stump.getBBox(), x0 = b.x + b.width * .85, y0 = b.y + b.height + 4;
  let d = "";
  for (let k = 0; k < 9; k++) { const t = k / 8, x = x0 + t * 140, y = y0 + t * t * 30 + (k % 2 ? 3 : -3);
    d += curve(ring(x, y, 2.2, 1.5, 7, .2, k + 1)) + [-1.8, 0, 1.8].map((dy) => curve(ring(x + 3, y + dy, .8, .7, 5, .2, k * 3 + dy + 9))).join(" "); }
  ground.insertAdjacentHTML("afterend", `<path class="paws" d="${d}" fill="#0c1a10" opacity=".5"/>`);
}

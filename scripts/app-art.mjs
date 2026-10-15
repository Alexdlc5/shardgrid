// Regenerate the Android launcher icon and splash from proto/art.js (Dibble). Run: npm run assets
// Writes source SVG/PNG to assets/ and every density into android/app/src/main/res/.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { tmpdir } from "node:os";
import { Resvg } from "@resvg/resvg-js";
import { dibble } from "../proto/art.js";

// resvg reads TTF/OTF only; unpack the bundled Fredoka WOFF (zlib per table) into a plain TTF.
function woffToTtf(w) {
  const n = w.readUInt16BE(12), head = Buffer.alloc(12 + 16 * n), parts = [head];
  head.writeUInt32BE(w.readUInt32BE(4), 0); head.writeUInt16BE(n, 4);
  const es = Math.floor(Math.log2(n)); head.writeUInt16BE(16 << es, 6); head.writeUInt16BE(es, 8); head.writeUInt16BE(n * 16 - (16 << es), 10);
  let off = head.length;
  for (let i = 0; i < n; i++) {
    const e = 44 + 20 * i, at = w.readUInt32BE(e + 4), comp = w.readUInt32BE(e + 8), orig = w.readUInt32BE(e + 12);
    const data = comp < orig ? inflateSync(w.subarray(at, at + comp)) : w.subarray(at, at + orig);
    w.copy(head, 12 + 16 * i, e, e + 4); head.writeUInt32BE(w.readUInt32BE(e + 16), 16 + 16 * i);
    head.writeUInt32BE(off, 20 + 16 * i); head.writeUInt32BE(orig, 24 + 16 * i);
    const padded = Buffer.alloc((orig + 3) & ~3); data.copy(padded); parts.push(padded); off += padded.length;
  }
  return Buffer.concat(parts);
}
// resvg-js 2.6 ignores fontBuffers (and then fitTo), so hand it a file.
const font = `${tmpdir()}/glimmerwood-fredoka-700.ttf`;
writeFileSync(font, woffToTtf(readFileSync("node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff")));

const mole = dibble().replace(/^<svg[^>]*>|<\/svg>$/g, "");
// Dibble's drawing sits around (52, 52) of its 100-unit box; place it centred on (cx, cy) at width s.
const place = (cx, cy, s) => `<svg x="${cx - s * 0.52}" y="${cy - s * 0.52}" width="${s}" height="${s}" viewBox="0 0 100 100">${mole}</svg>`;
const backdrop = (w, h, gx, gy, gr) => `
  <defs><linearGradient id="bg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0f2219"/><stop offset="1" stop-color="#1d3b2a"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".35"/><stop offset=".5" stop-color="#f0b543" stop-opacity=".12"/><stop offset="1" stop-color="#f0b543" stop-opacity="0"/></radialGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/><circle cx="${gx}" cy="${gy}" r="${gr}" fill="url(#glow)"/>`;
const doc = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>\n`;

// Adaptive icon: 108-unit canvas, launcher shows the centre 72, the 66-unit circle is always safe.
const fg = place(54, 55, 66), bg = backdrop(108, 108, 62, 58, 46);
const svgs = {
  "icon-foreground": doc("0 0 108 108", fg),
  "icon-background": doc("0 0 108 108", bg),
  icon: doc("18 18 72 72", bg + fg), // full-bleed square for the store listing / legacy icons
  splash: (w, h) => {
    const m = Math.min(w, h), cy = h / 2 - m * 0.08;
    return doc(`0 0 ${w} ${h}`, backdrop(w, h, w / 2 + m * 0.1, cy, m * 0.55) + place(w / 2, cy, m * 0.5) +
      `<text x="${w / 2}" y="${cy + m * 0.4}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${m * 0.12}" fill="#ffd27a">Glimmerwood</text>`);
  },
};

const png = (svg, width, clip) => {
  if (clip) svg = svg.replace(/(<svg[^>]*>)([\s\S]*)<\/svg>/, `$1<clipPath id="c">${clip}</clipPath><g clip-path="url(#c)">$2</g></svg>`);
  return new Resvg(svg, { fitTo: { mode: "width", value: width }, font: { fontFiles: [font], loadSystemFonts: false, defaultFontFamily: "Fredoka" } }).render().asPng();
};
const put = (path, data) => { mkdirSync(path.replace(/\/[^/]+$/, ""), { recursive: true }); writeFileSync(path, data); };

for (const k of ["icon-foreground", "icon-background", "icon"]) put(`assets/${k}.svg`, svgs[k]);
put("assets/splash.svg", svgs.splash(1280, 1920));
put("assets/icon-512.png", png(svgs.icon, 512));
put("assets/splash.png", png(svgs.splash(1280, 1920), 1280));

const res = "android/app/src/main/res";
const densities = { mdpi: [1, 320, 480], hdpi: [1.5, 480, 800], xhdpi: [2, 720, 1280], xxhdpi: [3, 960, 1600], xxxhdpi: [4, 1280, 1920] };
for (const [d, [k, w, h]] of Object.entries(densities)) {
  put(`${res}/mipmap-${d}/ic_launcher_foreground.png`, png(svgs["icon-foreground"], 108 * k));
  put(`${res}/mipmap-${d}/ic_launcher_background.png`, png(svgs["icon-background"], 108 * k));
  put(`${res}/mipmap-${d}/ic_launcher.png`, png(svgs.icon, 48 * k, `<rect x="18" y="18" width="72" height="72" rx="14"/>`));
  put(`${res}/mipmap-${d}/ic_launcher_round.png`, png(svgs.icon, 48 * k, `<circle cx="54" cy="54" r="36"/>`));
  put(`${res}/drawable-port-${d}/splash.png`, png(svgs.splash(w, h), w));
  put(`${res}/drawable-land-${d}/splash.png`, png(svgs.splash(h, w), h));
}
put(`${res}/drawable/splash.png`, png(svgs.splash(480, 320), 480));
console.log("assets/ and android res/ regenerated");

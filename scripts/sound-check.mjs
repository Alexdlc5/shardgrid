// Sound check: renders the synth offline (headless Chromium, OfflineAudioContext) and prints numbers, since nobody can
// listen in CI. The phone speaker rolls off under ~200 Hz, so each sound reports its RMS in the 100-400 Hz band (what the
// speaker gets of the low end) next to its full-band RMS and peak, all in dBFS.
//   node scripts/sound-check.mjs [path/to/music.js]   (another music.js, e.g. from git show, to compare before/after)
//   - the Rootline heartbeat alone: 8 s of a tune with tension 1 minus the same 8 s with tension 0 (the graph is linear)
//   - 4 s of each sfx that plays in the UI and the scene transitions
//   - 12 s of every tune: its full-band RMS, so the arrangements stay at one gentle loudness
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const MUSIC = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, "proto/music.js");
const server = createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]), f = p === "/music.js" ? MUSIC : join(ROOT, p);
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": extname(f) === ".html" ? "text/html" : "text/javascript" }); res.end(readFileSync(f));
}).listen(0);
const PAGE = `<!doctype html><meta charset="utf-8"><script>
window.setInterval = () => 1; window.clearInterval = () => {}; // the scheduler is pumped by hand
</script><script type="module">
let k = 0;
// render dur seconds: play a tune (with a tension) or fire an sfx at t=0, pump the scheduler every .1 s. Each render imports
// its own copy of music.js (the synth keeps its nodes for the life of its module) with Math.random re-seeded, so two renders
// that differ only in tension are the same tune to the sample, and their difference is exactly the heartbeat.
const render = async (dur, what, arg, tension) => {
  let s = 20261016; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const { soundtrack, sfx, offline } = await import("/music.js?" + k++);
  const SR = 48000, c = new OfflineAudioContext(2, Math.ceil(dur * SR), SR), go = c.resume.bind(c);
  c.resume = () => Promise.resolve(); offline.use(c); soundtrack.songSlots = 4096;
  const pump = () => { offline.pump(); go(); };
  for (let t = .1; t < dur - .05; t += .1) c.suspend(Math.round(t * SR / 128) * 128 / SR).then(pump);
  if (what === "tune") { soundtrack.setTension(tension); soundtrack.play(arg); } else sfx[what](arg);
  offline.pump();
  return c.startRendering();
};
// dBFS of a buffer from \`from\` s on: full band, the 100-400 Hz band (2nd-order high-pass at 100, low-pass at 400), peak
const measure = async (buf, from = 0) => {
  const SR = buf.sampleRate, i0 = Math.floor(from * SR), n = buf.length - i0;
  const rms = (b) => { let e = 0; for (const ch of [0, 1]) { const d = b.getChannelData(ch); for (let i = i0; i < b.length; i++) e += d[i] * d[i]; } return 10 * Math.log10(e / n / 2 + 1e-12); };
  let peak = 0; for (const ch of [0, 1]) { const d = buf.getChannelData(ch); for (let i = i0; i < buf.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
  const bc = new OfflineAudioContext(2, buf.length, SR), src = bc.createBufferSource(), hp = bc.createBiquadFilter(), lp = bc.createBiquadFilter();
  src.buffer = buf; hp.type = "highpass"; hp.frequency.value = 100; lp.type = "lowpass"; lp.frequency.value = 400;
  src.connect(hp).connect(lp).connect(bc.destination); src.start();
  return { full: rms(buf), band: rms(await bc.startRendering()), peak: 20 * Math.log10(peak + 1e-12) };
};
window.render = async (dur, what, arg, tension, from) => measure(await render(dur, what, arg, tension), from);
window.heartbeat = async (dur, tune, from) => { // the heartbeat alone: (tune with tension 1) - (the same tune with tension 0)
  const a = await render(dur, "tune", tune, 0), b = await render(dur, "tune", tune, 1);
  for (const ch of [0, 1]) { const x = a.getChannelData(ch), y = b.getChannelData(ch); for (let i = 0; i < x.length; i++) y[i] -= x[i]; }
  return [await measure(a, from), await measure(b, from)];
};
</script>`;
const b = await chromium.launch(), page = await b.newPage();
page.on("pageerror", (e) => { console.error("page error:", e.message); process.exitCode = 1; });
await page.route("**/check.html", (r) => r.fulfill({ contentType: "text/html", body: PAGE }));
const row = (name, r) => console.log(`${name.padEnd(16)} band(100-400) ${r.band.toFixed(1).padStart(6)} dB   full ${r.full.toFixed(1).padStart(6)} dB   peak ${r.peak.toFixed(1).padStart(6)} dB`);
await page.goto(`http://localhost:${server.address().port}/check.html`); await page.waitForFunction(() => window.heartbeat);
const render = (...a) => page.evaluate((a) => window.render(...a), a);

console.log(`music.js: ${MUSIC}\n-- Rootline heartbeat (8 s of "hollow", measured after the 2.5 s fade-in)`);
const [tune, beat] = await page.evaluate(() => window.heartbeat(8, "hollow", 2.5));
row("tune, tension 0", tune); row("heartbeat alone", beat);

console.log("-- sfx (4 s each, alone)");
const SFX = [["tick"], ["tap"], ["descend"], ["ascend"], ["iris"], ["sheet open", "sheet", true], ["sheet close", "sheet", false], ["toggle on", "toggle", true], ["toggle off", "toggle", false]];
for (const [name, k = name, arg] of SFX) {
  try { row(name, await render(4, k, arg)); } catch (e) { console.log(`${name.padEnd(16)} (not in this music.js)`); }
}

console.log("-- tunes (12 s each, after the 2.5 s fade-in)");
for (const n of ["home", "camp", "hollow", "ember", "grotto", "frostpine", "gulch", "heartwood", "lantern", "hearth", "dewfall", "burrow", "glint", "brook", "cinder", "roost", "loom", "wickhold", "skywell"]) row(n, await render(12, "tune", n, 0, 2.5));
await b.close(); server.close();

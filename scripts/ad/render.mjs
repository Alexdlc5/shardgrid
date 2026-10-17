// Glimmerwood ads: node scripts/ad/render.mjs                 both cuts: ad-out/glimmerwood-<cut>-9x16.mp4, -16x9.mp4, -contact-sheet.jpg
//                  node scripts/ad/render.mjs --cut cozy      one cut ("onemore": quick, funny, a little mystery; "cozy": the camp, slow)
//                  node scripts/ad/render.mjs --stills 1,5.2  just those moments as PNGs in ad-out/stills-<cut> (no audio)
//                  node scripts/ad/render.mjs --live          serve it: http://127.0.0.1:8812/trailer.html?cut=cozy (tap to play)
// The trailer is the real game (www/, built first) with scripts/ad/trailer.js pasted into its module and scripts/ad/clock.js
// in front: time is virtual, so each frame is stepped and screenshot exactly. The sounds the timeline logged are then played
// through music.js in an OfflineAudioContext (same synth, seeded), and ffmpeg muxes the two. Needs Chrome and ffmpeg
// (CHROME / FFMPEG env vars, or the usual install paths, or imageio-ffmpeg's binary).
import puppeteer from "puppeteer-core";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { join, extname } from "node:path";

const arg = (k) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] ?? true : null;
const OUT = "ad-out", FPS = 30, W = 405, H = 720, DPR = 1080 / 405; // 405×720 CSS px (a phone), 1080×1920 pixels
const find = (list) => list.find((p) => p && existsSync(p));
const chrome = find([process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"]);
const pyFF = () => { try { return execFileSync("python", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim(); } catch { return null; } };
const ffmpeg = process.env.FFMPEG || (() => { try { execFileSync("ffmpeg", ["-version"]); return "ffmpeg"; } catch { return pyFF(); } })();
if (!chrome) throw new Error("no Chrome found; set CHROME=/path/to/chrome");
mkdirSync(OUT, { recursive: true });

execFileSync(process.execPath, ["scripts/build-web.mjs"], { stdio: "inherit" });
const clock = readFileSync("scripts/ad/clock.js", "utf8"), director = readFileSync("scripts/ad/trailer.js", "utf8");
const page = (live) => { let h = readFileSync("www/index.html", "utf8");
  if (!live) h = h.replace("<head>", `<head><script>${clock}</script>`);
  const i = h.lastIndexOf("</script>"); return h.slice(0, i) + "\n" + director + "\n" + h.slice(i); };
const AUDIO = `<!doctype html><meta charset="utf-8"><script>
let s = 20261016; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647); // seeded, like the picture
window.setInterval = () => 1; window.clearInterval = () => {}; // the music's scheduler is pumped by hand, on the render clock
</script><script type="module">
import { soundtrack, sfx, offline } from "./music.js";
window.renderAudio = async (log, dur) => {
  const SR = 48000, c = new OfflineAudioContext(2, Math.ceil(dur * SR), SR), go = c.resume.bind(c), q = (t) => Math.round(t * SR / 128) * 128 / SR;
  c.resume = () => Promise.resolve(); offline.use(c); soundtrack.songSlots = 4096;
  const at = new Map(), add = (t) => at.get(t) ?? at.set(t, []).get(t);
  for (const e of log) add(q(Math.max(0, e.t))).push(e);
  for (let t = 0; t < dur; t += .1) add(q(t));
  const run = (es) => { for (const e of es) e.k.startsWith("music.") ? soundtrack[e.k.slice(6)](...e.a) : sfx[e.k](...e.a); offline.pump(); };
  for (const [t, es] of at) if (t > 0 && t < dur) c.suspend(t).then(() => { run(es); go(); });
  run(at.get(0) || []);
  const buf = await c.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const wav = new DataView(new ArrayBuffer(44 + n * 4)), str = (o, s) => [...s].forEach((ch, k) => wav.setUint8(o + k, ch.charCodeAt(0)));
  str(0, "RIFF"); wav.setUint32(4, 36 + n * 4, true); str(8, "WAVEfmt "); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 2, true);
  wav.setUint32(24, SR, true); wav.setUint32(28, SR * 4, true); wav.setUint16(32, 4, true); wav.setUint16(34, 16, true); str(36, "data"); wav.setUint32(40, n * 4, true);
  const g = peak > .98 ? .98 / peak : 1; // never clips; loudness is set later by ffmpeg
  for (let i = 0; i < n; i++) { wav.setInt16(44 + i * 4, Math.round(L[i] * g * 32767), true); wav.setInt16(46 + i * 4, Math.round(R[i] * g * 32767), true); }
  const bytes = new Uint8Array(wav.buffer); let bin = ""; for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return { b64: btoa(bin), peak };
};
</script>`;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".woff2": "font/woff2" };
const live = !!arg("--live"), port = live ? 8812 : 0;
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname), send = (type, body) => { res.writeHead(200, { "content-type": type }); res.end(body); };
  if (p === "/trailer.html") return send("text/html", page(live));
  if (p === "/trailer-audio.html") return send("text/html", AUDIO);
  const f = join("www", p === "/" ? "index.html" : p);
  if (!existsSync(f) || statSync(f).isDirectory()) return res.writeHead(404).end();
  send(TYPES[extname(f)] || "application/octet-stream", readFileSync(f));
}).listen(port, "127.0.0.1");
await new Promise((ok) => server.on("listening", ok));
const base = `http://127.0.0.1:${server.address().port}`;
if (live) { console.log(`${base}/trailer.html  (tap to play; Ctrl+C to stop)`); await new Promise(() => {}); }

const CUTS = arg("--cut") && arg("--cut") !== true ? [arg("--cut")] : ["onemore", "cozy"];
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--force-color-profile=srgb"] });
const ff = (a) => execFileSync(ffmpeg, ["-y", "-hide_banner", ...a], { stdio: ["ignore", "pipe", "pipe"] });
const LN = "loudnorm=I=-16:TP=-1.5:LRA=11";
// the screenshots are full-range JPEG; video players and the stores expect BT.709, limited range, tagged as such
const TAGS = ["-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];
const BT709 = ["-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p", ...TAGS];
const made = [];
for (const cut of CUTS) {
  const tab = await browser.newPage();
  await tab.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  tab.on("pageerror", (e) => console.error("page:", e.message));
  tab.on("console", (m) => m.type() === "error" && !/AudioContext|404/.test(m.text()) && console.error("page:", m.text()));
  await tab.goto(`${base}/trailer.html?cut=${cut}`); await tab.evaluate(() => document.fonts.ready);
  await tab.evaluate(() => { for (let k = 0; k < 60; k++) __step(1000 / 60); }); // boot settles (a virtual second)
  await new Promise((r) => setTimeout(r, 400)); // let the painted images decode
  const { dur, beats } = await tab.evaluate(() => (AD.go(), { dur: AD.dur, beats: AD.beats })), frames = Math.round(dur * FPS);
  const toFrame = (f) => tab.evaluate((f, fps) => { const end = AD.start + f / fps * 1000; while (__now() < end - 1e-6) __step(Math.min(1000 / 60, end - __now())); }, f, FPS);

  const stills = arg("--stills");
  if (stills) {
    mkdirSync(`${OUT}/stills-${cut}`, { recursive: true });
    for (const t of String(stills).split(",").map(Number).sort((a, b) => a - b)) {
      await toFrame(Math.round(t * FPS)); await new Promise((r) => setTimeout(r, 60));
      await tab.screenshot({ path: `${OUT}/stills-${cut}/t${t.toFixed(2)}.png` });
    }
    console.log(`${cut}: stills in ${OUT}/stills-${cut}`); await tab.close(); continue;
  }
  if (!ffmpeg) throw new Error("no ffmpeg found; set FFMPEG=/path/to/ffmpeg");

  // picture: every frame, stepped and screenshot, straight into x264
  const silent = `${OUT}/${cut}-video.mp4`, wav = `${OUT}/${cut}-sound.wav`;
  const enc = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", FPS, "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
    "-maxrate", "4M", "-bufsize", "8M", ...BT709, "-profile:v", "high", "-movflags", "+faststart", silent], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await toFrame(f);
    const img = await tab.screenshot({ type: "jpeg", quality: 95, optimizeForSpeed: true });
    if (!enc.stdin.write(img)) await new Promise((r) => enc.stdin.once("drain", r));
    if (f % 150 === 0) console.log(`${cut}: frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  enc.stdin.end(); await new Promise((r) => enc.on("close", r));
  const log = await tab.evaluate(() => AD.log);
  writeFileSync(`${OUT}/${cut}-sound-log.json`, JSON.stringify(log));

  // sound: the logged cues, replayed through the game's synth offline
  await tab.goto(`${base}/trailer-audio.html`); await tab.waitForFunction(() => window.renderAudio);
  const { b64, peak } = await tab.evaluate((log, dur) => renderAudio(log, dur), log, dur);
  writeFileSync(wav, Buffer.from(b64, "base64")); await tab.close();
  // loudness: two-pass loudnorm to -16 LUFS / -1.5 dBTP (a calm ad, but not quiet next to others in a feed)
  const e = spawnSync(ffmpeg, ["-hide_banner", "-i", wav, "-af", `${LN}:print_format=json`, "-f", "null", "-"]).stderr.toString(), j = JSON.parse(e.slice(e.lastIndexOf("{"), e.lastIndexOf("}") + 1));
  const measured = `:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  console.log(`${cut}: ${log.length} sound cues, raw peak ${peak.toFixed(3)}, ${j.input_i} LUFS → -16`);

  const tall = `${OUT}/glimmerwood-${cut}-9x16.mp4`, wide = `${OUT}/glimmerwood-${cut}-16x9.mp4`;
  ff(["-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", `${LN}${measured},aresample=48000`,
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tall]);
  // 16:9: the same cut centred on a soft, darkened, blurred copy of itself
  ff(["-i", tall, "-filter_complex", "[0:v]split[a][b];[a]scale=1920:-2,crop=1920:1080,gblur=sigma=28,eq=brightness=-0.12:saturation=0.85[bg];[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "4M", "-bufsize", "8M", ...TAGS, "-profile:v", "high", "-c:a", "copy", "-movflags", "+faststart", wide]);
  // contact sheet: the cut's story beats
  ff(["-i", tall, "-vf", `select='${beats.map((t) => `eq(n\,${Math.round(t * FPS)})`).join("+")}',scale=270:480,tile=6x2:padding=6:color=0x0b140f`, "-frames:v", "1", "-q:v", "3", `${OUT}/glimmerwood-${cut}-contact-sheet.jpg`]);
  for (const f of [tall, wide]) made.push(`${f}  ${(statSync(f).size / 1e6).toFixed(1)} MB`);
  console.log(`${cut}: ${dur}s, ${frames} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close(); server.close();
if (made.length) console.log(made.join("\n"));

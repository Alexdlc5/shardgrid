// node fxshots.mjs <outDir> [perf] [only]   run from the worktree root after `npm run build`; serves nothing itself (python http.server 8806 -d www)
// Strips: www/fx-test.html (59/34 safe areas, a virtual clock + seeded Math.random in <head>, a scenario hook in the module), 402x874 @2x.
// Each scenario sets up a board, makes one placement that clears, then crops the board out of the canvas at fixed times.
// perf: real clock, 4x CPU throttle, a 4-line combo ×4; reports the rAF callback cost (frame script time) for the next 1.2s.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
const [out = "fxout", mode = "strips", only] = process.argv.slice(2), zoom = mode === "zoom";
mkdirSync(out, { recursive: true });
const perf = mode === "perf";
const clock = `(() => { let now = 0, seq = 0; const timers = new Map(), rafs = new Map();
  let s = 20261016; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  performance.now = () => now; const T0 = Date.UTC(2026, 9, 16, 21); Date.now = () => T0 + now;
  window.setTimeout = (fn, ms = 0, ...a) => { const id = ++seq; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, a, seq: id }); return id; };
  window.setInterval = (fn, ms = 0, ...a) => { const id = ++seq; timers.set(id, { at: now + Math.max(1, +ms || 0), fn, a, every: Math.max(1, +ms || 0), seq: id }); return id; };
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);
  window.requestAnimationFrame = (fn) => { const id = ++seq; rafs.set(id, fn); return id; };
  window.__step = (ms) => { const end = now + ms;
    for (;;) { let next = null, nid; for (const [id, t] of timers) if (t.at <= end && (!next || t.at < next.at)) { next = t; nid = id; }
      if (!next) break; now = Math.max(now, next.at); if (next.every) next.at += next.every; else timers.delete(nid); try { next.fn(...next.a); } catch (e) { console.error(e); } }
    now = end; const due = [...rafs.values()]; rafs.clear(); for (const fn of due) try { fn(now); } catch (e) { console.error(e); } };
})();`;
const hook = `
const FX_SCEN = { single: { rows: [5], type: "moss" }, double: { rows: [5, 6], type: "jade", combo: 1 }, big: { rows: [3, 4, 5, 6], type: "sapphire", combo: 3 },
  ember: { rows: [5], type: "ember", mixed: true }, frost: { rows: [5], type: "frost", mixed: true }, geode: { rows: [5], type: "geode", mixed: true },
  heart: { rows: [5], type: "heart", mixed: true }, glowcap: { rows: [5], type: "glowcap", mixed: true }, pet: { rows: [5], type: "moonstone", pet: true } };
window.__fx = async (name, real) => {
  const S = FX_SCEN[name], tick = (ms) => real ? new Promise((r) => setTimeout(r, ms)) : window.__step(ms);
  Object.assign(save.story, { prologue: true }); save.seen = Object.keys(TIPS); save.opt.sound = false; save.mode = "expedition";
  startDig(false); for (let k = 0; k < 40; k++) await tick(50);
  started = false; // the Rootline waits: no drain, no ticking
  const fill = (r, c, type) => { const id = uid++; meta[id] = { type, r, c, h: 1, w: 1, at: -1e6 }; board[r * N + c] = id; return id; };
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (S.rows.includes(r) ? c < N - 1 : r === S.rows[0] - 1 || r === S.rows.at(-1) + 1 ? c % 2 === 0 : false)
    fill(r, c, S.rows.includes(r) ? (S.mixed ? (c % 2 ? S.type : "moss") : S.type) : "garnet");
  if (S.pet) { const k = S.rows[0] * N + 3; Object.assign(meta[board[k]], { pet: PET_KINDS[0], petAt: k }); petImg(PET_KINDS[0]); }
  combo = S.combo || 0; for (let k = 0; k < 10; k++) await tick(50);
  tray[0] = { piece: { cells: S.rows.map((r, j) => [j, 0]), w: 1, h: S.rows.length }, type: S.mixed ? "moss" : S.type };
  return { bx, by, cell, N };
};
window.__strip = async (name, zoom) => {
  const g = await window.__fx(name), dpr = devicePixelRatio, pad = 26, sx = g.bx - pad, sy = g.by - g.cell * 1.6, sw = g.cell * N + pad * 2, sh = g.cell * N + g.cell * 1.6 + pad;
  const at = zoom ? [80, 160, 300] : [0, 50, 100, 150, 250, 350, 500, 700, 900], z = zoom ? 1 : .62, fw = Math.round(sw * z), fh = Math.round(sh * z), lab = 22;
  const st = document.createElement("canvas"); st.width = fw * at.length; st.height = fh + lab; const sc = st.getContext("2d");
  sc.fillStyle = "#14100c"; sc.fillRect(0, 0, st.width, st.height); sc.font = "600 15px Fredoka, sans-serif"; sc.fillStyle = "#efe6cf";
  const S = FX_SCEN[name]; commit(0, S.rows[0], N - 1, null); let t = 0;
  for (let k = 0; k < at.length; k++) { while (t < at[k]) { window.__step(1000 / 60); t += 1000 / 60; } if (k === 0) window.__step(1);
    sc.drawImage(cv, sx * dpr, sy * dpr, sw * dpr, sh * dpr, k * fw, lab, fw, fh); sc.fillText(at[k] + " ms", k * fw + 8, 16); }
  return st.toDataURL("image/jpeg", .86);
};
window.__perf = async () => {
  const cost = []; let on = false, peak = 0; const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (fn) => raf((t) => { const a = performance.now(); fn(t); if (on) { cost.push(performance.now() - a); peak = Math.max(peak, parts.length + fx.length); } });
  await window.__fx("big", true); const S = FX_SCEN.big; on = true; const t0 = performance.now(); commit(0, S.rows[0], N - 1, null);
  await new Promise((r) => setTimeout(r, 1200)); on = false; const el = performance.now() - t0;
  const s = [...cost].sort((a, b) => a - b), q = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2);
  return { frames: cost.length, fps: +(cost.length / el * 1000).toFixed(1), p50: q(.5), p95: q(.95), max: q(1), peakParticles: peak };
};
`;
let html = readFileSync("www/index.html", "utf8")
  .replaceAll("max(14px, env(safe-area-inset-bottom))", "34px")
  .replaceAll("env(safe-area-inset-top, 0px)", "59px").replaceAll("env(safe-area-inset-bottom, 0px)", "34px");
if (!perf) html = html.replace("<head>", `<head><script>${clock}</script>`);
html = html.replace(/\n<\/script>\s*<\/body>/, hook + "\n</script>\n</body>");
if (!html.includes("window.__fx")) throw new Error("hook not inserted");
writeFileSync("www/fx-test.html", html);

const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const proc = spawn(chrome, ["--headless=new", "--hide-scrollbars", "--mute-audio", "--remote-debugging-port=9336", `--user-data-dir=${tmpdir()}/gwfx`, "about:blank"], { stdio: "ignore" });
let list; for (let k = 0; k < 50 && !list; k++) { await new Promise((r) => setTimeout(r, 200)); try { list = await (await fetch("http://localhost:9336/json/list")).json(); } catch {} }
const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let mid = 0; const waiting = {}; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waiting[m.id]) { waiting[m.id](m); delete waiting[m.id]; } };
const send = (method, params = {}) => new Promise((r) => { const id = ++mid; waiting[id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => { const m = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 600)); return m.result.result.value; };
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 402, height: 874, deviceScaleFactor: perf ? 3 : 2, mobile: true });
await send("Page.enable");
if (mode === "calm") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const load = async () => { await send("Page.navigate", { url: "http://localhost:8806/fx-test.html?debug" });
  for (let k = 0; k < 100; k++) { await new Promise((r) => setTimeout(r, 150)); try { if (await ev("typeof window.__fx === 'function' && document.fonts.status === 'loaded'")) break; } catch {} }
  if (!perf) for (let k = 0; k < 20; k++) await ev("window.__step(100)"); };
if (perf) {
  const res = {};
  for (const rate of [1, 4]) { await load(); await send("Emulation.setCPUThrottlingRate", { rate }); await new Promise((r) => setTimeout(r, 500));
    res[`cpu x${rate}`] = await ev("window.__perf()"); await send("Emulation.setCPUThrottlingRate", { rate: 1 }); }
  console.log(JSON.stringify(res, null, 1)); writeFileSync(`${out}/perf.json`, JSON.stringify(res, null, 1));
} else {
  for (const name of (only ? only.split(",") : ["single", "double", "big", "ember", "frost", "geode", "heart", "glowcap", "pet"])) {
    await load(); const url = await ev(`window.__strip(${JSON.stringify(name)}, ${zoom})`);
    writeFileSync(`${out}/${name}${mode === "calm" ? "-reduced-motion" : ""}.jpg`, Buffer.from(url.split(",")[1], "base64")); console.log("wrote", name);
  }
}
proc.kill(); process.exit(0);

// Glimmerwood soundtrack: composed in code (Web Audio), so it's original and costs no files.
// Each tune: a pentatonic melody phrased A A' B A over a 4-chord loop, played on a kalimba / music-box / marimba voice,
// with a warm pad, soft bass, a whisper shaker, and place ambience. Each place opens with its own tune, then a random
// playlist of tunes that suit it carries on, crossfading so you can't hear the seams (see crossfade() below).
let ctx, master, music, musicRev, musicEcho, reverb, echo, tension = 0, tensionGain;
let enabled = true, volume = 1, place = null, playing = null, decks = [], live = 0; // place: where we are; playing: whose playlist runs

const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);               // MIDI → Hz
const PENTA = [0, 2, 4, 7, 9], MINPENTA = [0, 3, 5, 7, 10];   // degrees of the scale

// chords as scale-relative semitone stacks above the track's root
const TRACKS = {
  home:      { root: 53, bpm: 72, scale: PENTA,    chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 7]], seed: 11, voice: "kalimba", amb: "crickets", bright: 1 },
  camp:      { root: 51, bpm: 64, scale: PENTA,    chords: [[0, 4, 7, 14], [5, 9, 12, 16], [-3, 0, 4, 7], [-5, 2, 7, 11]], seed: 23, voice: "musicbox", amb: "fire", bright: .8 },
  hollow:    { root: 55, bpm: 76, scale: PENTA,    chords: [[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 7], [2, 5, 9, 12]], seed: 31, voice: "kalimba", amb: "drips", bright: 1 },
  ember:     { root: 50, bpm: 70, scale: MINPENTA, chords: [[0, 3, 7, 10], [-2, 2, 5, 9], [-4, 0, 3, 7], [-5, -2, 2, 5]], seed: 47, voice: "kalimba", amb: "drips", bright: .7 },
  grotto:    { root: 57, bpm: 66, scale: PENTA,    chords: [[0, 4, 7, 14], [2, 7, 9, 14], [-3, 2, 4, 9], [-5, 2, 4, 7]], seed: 59, voice: "musicbox", amb: "drips", bright: .9 },
  frostpine: { root: 57, bpm: 60, scale: PENTA,    chords: [[0, 7, 11, 16], [-3, 4, 7, 12], [5, 9, 12, 19], [-5, 2, 7, 11]], seed: 67, voice: "musicbox", amb: "wind", bright: 1.2 },
  gulch:     { root: 48, bpm: 80, scale: PENTA,    chords: [[0, 4, 7, 9], [-3, 0, 4, 7], [5, 9, 12, 14], [7, 11, 14, 17]], seed: 79, voice: "marimba", amb: "drips", bright: .85 },
  heartwood: { root: 52, bpm: 68, scale: MINPENTA, chords: [[0, 3, 7, 10], [-4, 0, 3, 8], [-7, -3, 0, 5], [-2, 2, 5, 10]], seed: 97, voice: "kalimba", amb: "drips", bright: .9 },
  // the playlist: more tunes in the same voices, for the camp (calm), the digs (gentle) and one a little brighter
  lantern:   { root: 50, bpm: 62, scale: PENTA,    chords: [[0, 4, 7, 14], [-3, 0, 4, 9], [5, 9, 12, 16], [-5, 2, 7, 11]], seed: 151, voice: "musicbox", amb: "fire", bright: .8 },
  hearth:    { root: 52, bpm: 66, scale: PENTA,    chords: [[0, 4, 7, 11], [5, 9, 12, 14], [2, 5, 9, 12], [-5, -1, 2, 7]], seed: 163, voice: "kalimba", amb: "crickets", bright: .85 },
  dewfall:   { root: 55, bpm: 68, scale: PENTA,    chords: [[0, 7, 11, 16], [-3, 4, 7, 12], [-7, 0, 4, 9], [-5, 2, 7, 11]], seed: 173, voice: "marimba", amb: "crickets", bright: 1 },
  burrow:    { root: 48, bpm: 70, scale: PENTA,    chords: [[-3, 0, 4, 9], [-7, -3, 0, 4], [0, 4, 7, 11], [-5, -1, 2, 7]], seed: 181, voice: "kalimba", amb: "drips", bright: .85 },
  glint:     { root: 53, bpm: 72, scale: PENTA,    chords: [[0, 4, 7, 14], [2, 5, 9, 12], [-3, 0, 4, 7], [5, 9, 12, 16]], seed: 191, voice: "musicbox", amb: "drips", bright: 1.05 },
  brook:     { root: 57, bpm: 78, scale: PENTA,    chords: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [-3, 0, 4, 7]], seed: 199, voice: "marimba", amb: "drips", bright: 1.15 },
};
// the Underroot and the Skywell reuse a mine's voice in a new key and tempo
Object.assign(TRACKS, { cinder: { ...TRACKS.ember, root: 48, bpm: 64, seed: 113 }, roost: { ...TRACKS.grotto, root: 59, bpm: 62, seed: 127 },
  loom: { ...TRACKS.frostpine, root: 55, bpm: 58, seed: 131 }, wickhold: { ...TRACKS.hollow, root: 53, bpm: 70, seed: 137 }, skywell: { ...TRACKS.frostpine, root: 60, bpm: 66, seed: 139 } });
// what can follow in each place: its own tune first, then any of these (a mine: its tune plus the digging set)
const POOL = { home: ["home", "dewfall", "lantern", "hearth"], camp: ["camp", "lantern", "hearth", "dewfall", "brook"] };
const pool = (p) => POOL[p] || [p, "burrow", "glint", "brook"];

function rng(seed) { let a = seed; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; }

// A melody is 4 phrases × 8 eighth-note slots, scale steps (null = rest). Mostly stepwise, phrases end on chord tones.
function compose(t) {
  const r = rng(t.seed), phrase = () => {
    const out = []; let step = 2 + Math.floor(r() * 3);
    for (let k = 0; k < 8; k++) {
      if (k % 2 === 1 && r() < .45) { out.push(null); continue; }
      step += [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)];
      step = Math.max(0, Math.min(9, step)); out.push(step);
    }
    out[7] = null; out[6] = [0, 2, 4][Math.floor(r() * 3)];
    return out;
  };
  const A = phrase(), B = phrase(), A2 = A.map((s, k) => (s !== null && k > 3 && r() < .5 ? Math.min(9, s + 1) : s));
  return [A, A2, B, A];
}
for (const t of Object.values(TRACKS)) t.melody = compose(t);
const scaleNote = (t, step) => t.root + 12 + Math.floor(step / 5) * 12 + t.scale[step % 5];

// Routing: notes play into a "bus" { out, rev, ech } (dry, reverb send, echo send). There are two decks, A and B, made once
// and reused: each has its own bus with a fade gain on all three paths, so a deck fades out with its reverb tail.
// Everything musical then goes through `music` (+ its reverb/echo sends), which is the volume and the on/off switch.
function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination);
  // generated reverb: decaying stereo noise
  reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
  reverb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = .32; reverb.connect(wet).connect(master);
  // soft echo for plucks
  echo = ctx.createDelay(1); const fb = ctx.createGain(), ew = ctx.createGain(); fb.gain.value = .28; ew.gain.value = .22;
  echo.connect(fb).connect(echo); echo.connect(ew).connect(master);
  music = ctx.createGain(); music.connect(master); musicRev = ctx.createGain(); musicRev.connect(reverb); musicEcho = ctx.createGain(); musicEcho.connect(echo);
  tensionGain = ctx.createGain(); tensionGain.gain.value = 0; tensionGain.connect(music);
  const bus = (to) => { const g = ctx.createGain(); g.connect(to); return g; };
  decks = [0, 1].map(() => { const d = { out: bus(music), rev: bus(musicRev), ech: bus(musicEcho), timer: null };
    d.amb = bus(d.out); d.amb.gain.value = .5; for (const g of [d.out, d.rev, d.ech]) g.gain.value = 0; return d; });
  setLevel(enabled ? volume : 0, 0);
}
const ramp = (p, to, at, dur) => { p.cancelScheduledValues(at); p.setValueAtTime(p.value, at); p.linearRampToValueAtTime(to, at + dur); };
function setLevel(v, dur) { const now = ctx.currentTime; for (const g of [music, musicRev, musicEcho]) ramp(g.gain, Math.max(.0001, v), now, dur); }
// equal-power fade of a deck: a few linear segments along sin/cos, so the sum stays level while one deck hands to the other
function fade(d, up, at, dur) {
  for (const g of [d.out, d.rev, d.ech]) {
    const p = g.gain, from = p.value; p.cancelScheduledValues(at); p.setValueAtTime(from, at);
    for (let k = 1; k <= 8; k++) { const x = k / 8; p.linearRampToValueAtTime(up ? from + (1 - from) * Math.sin(x * Math.PI / 2) : from * Math.cos(x * Math.PI / 2), at + dur * x); }
  }
}

function pluck(b, freq, when, vol, voice, bright = 1) {
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  const dec = voice === "musicbox" ? 1.9 : voice === "marimba" ? .7 : 1.3;
  o.type = voice === "marimba" ? "sine" : "triangle"; o.frequency.value = freq;
  o2.type = "sine"; o2.frequency.value = freq * (voice === "musicbox" ? 4 : 3.01);   // bell / tine overtone
  const g2 = ctx.createGain(); g2.gain.setValueAtTime(vol * .25 * bright, when); g2.gain.exponentialRampToValueAtTime(.0001, when + dec * .35);
  f.type = "lowpass"; f.frequency.value = 2600 * bright;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + dec);
  o.connect(g); o2.connect(g2).connect(g); g.connect(f).connect(b.out); f.connect(b.rev); f.connect(b.ech);
  o.start(when); o2.start(when); o.stop(when + dec + .05); o2.stop(when + dec + .05);
}
// a pad chord: swells in and out over `dur`; a held pad (the bridge between songs) starts full and only dies away
function pad(b, freqs, when, dur, vol, held = false) {
  const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = .4;
  g.gain.setValueAtTime(.0001, when); g.gain.linearRampToValueAtTime(vol, when + (held ? .4 : dur * .35)); g.gain.linearRampToValueAtTime(.0001, when + dur);
  g.connect(f).connect(b.out); f.connect(b.rev);
  for (const fr of freqs) for (const det of [-6, 6]) {
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.detune.value = det;
    o.connect(g); o.start(when); o.stop(when + dur + .05);
  }
}
function bass(b, freq, when, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .02); g.gain.exponentialRampToValueAtTime(.0001, when + 1.2);
  o.connect(g).connect(b.out); o.start(when); o.stop(when + 1.3);
}
let noiseBuf;
function noise(when, dur, vol, freq, q, out) {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .005); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
  s.connect(f).connect(g).connect(out); s.start(when, Math.random() * .5); s.stop(when + dur + .02);
}
function ambience(d, kind, when, span) {
  const r = Math.random;
  if (kind === "crickets") for (let k = 0; k < 3; k++) if (r() < .55) { const t0 = when + r() * span; for (let c = 0; c < 3; c++) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 4200 + r() * 600;
    g.gain.setValueAtTime(.0001, t0 + c * .07); g.gain.exponentialRampToValueAtTime(.012, t0 + c * .07 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + c * .07 + .05);
    o.connect(g).connect(d.amb); o.start(t0 + c * .07); o.stop(t0 + c * .07 + .06); } }
  if (kind === "fire") for (let k = 0; k < 6; k++) if (r() < .7) noise(when + r() * span, .03 + r() * .05, .05 + r() * .06, 1800 + r() * 2500, 2, d.amb);
  if (kind === "drips" && r() < .35) { const t0 = when + r() * span, o = ctx.createOscillator(), g = ctx.createGain(), fr = 900 + r() * 700;
    o.frequency.setValueAtTime(fr, t0); o.frequency.exponentialRampToValueAtTime(fr * 1.9, t0 + .09);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.05, t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + .18);
    o.connect(g).connect(d.amb); g.connect(d.rev); o.start(t0); o.stop(t0 + .2); }
  if (kind === "wind" && r() < .4) noise(when + r() * span, 2.5, .025, 500 + r() * 300, .7, d.amb);
}

// lookahead scheduler: one eighth-note slot at a time, a little ahead of the clock, on deck d
function schedule(d) {
  const t = d.t, st = d.st, eighth = 60 / t.bpm / 2, ahead = .35;
  while (st.next < ctx.currentTime + ahead) {
    const s = st.slot, bar = Math.floor(s / 8), phrase = Math.floor(s / 16) % 4, pos = s % 16, chord = t.chords[bar % 4];
    const when = st.next, intro = s < st.intro; // intro bars: pad and bass on the one only, so the tempo arrives softly
    if (s === st.len) return next(when);          // the song is over: hand over to a random next one
    if (s % 8 === 0) {
      pad(d, chord.map((c) => NOTE(t.root + c)), when, eighth * 8.2, .028);
      bass(d, NOTE(t.root - 24 + chord[0]), when, intro ? .1 : .14);
    }
    if (!intro) {
      if (s % 8 === 4) bass(d, NOTE(t.root - 24 + chord[0] + 7), when, .07);
      const m = t.melody[phrase][pos % 8]; // each phrase: stated in bar 1, echoed sparser in bar 2
      if (m !== null && (pos < 8 || s % 2 === 0)) pluck(d, NOTE(scaleNote(t, m)), when + (s % 2 ? eighth * .06 : 0), .11, t.voice, t.bright);
      if (s % 4 === 2) noise(when, .05, .018, 7000, 1.2, d.out);                      // whisper shaker
      if (s % 32 === 30) pluck(d, NOTE(scaleNote(t, 7) + 12), when, .05, "musicbox", t.bright); // sparkle at the turnaround
    }
    if (tension > 0 && s % 2 === 0 && d === decks[live]) { // low Rootline: soft heartbeat under the music
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 58;
      g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(.2 * tension, when + .01); g.gain.exponentialRampToValueAtTime(.0001, when + .16);
      o.connect(g).connect(tensionGain); o.start(when); o.stop(when + .2);
    }
    if (s % 8 === 0) ambience(d, t.amb, when, eighth * 8);
    st.slot++; st.next += eighth;
  }
}

// Crossfade to `name` at audio time `at` over `dur` seconds. The playing deck stops its melody and leaves one held pad (the
// bridge) made of the notes its home chord shares with the new tune's first chord, fading out with its reverb; the other deck
// starts the new tune with pad-and-bass intro bars while fading in, so the two never play melodies or beats against each
// other, and what overlaps is in tune. Song length: 3–5 times through its form.
function crossfade(name, at, dur, introBars) {
  const out = decks[live], d = decks[live ^= 1], t = TRACKS[name];
  if (out.timer) { clearInterval(out.timer); out.timer = null; const shared = common(out.t, t);
    if (shared.length) pad(out, shared.map(NOTE), at, dur + 1.5, .045, true); // nothing in common: the reverb tail and the new intro carry it
    fade(out, false, at, dur); }
  clearInterval(d.timer);
  d.t = t; d.name = name;
  d.st = { next: at + .05, slot: 0, intro: introBars * 8, len: soundtrack.songSlots || 64 * (3 + Math.floor(Math.random() * 3)) };
  fade(d, true, at, dur);
  d.timer = setInterval(() => schedule(d), 90); schedule(d);
}
// notes of a's home chord whose pitch class is in b's first chord
const common = (a, b) => { const pcs = b.chords[0].map((c) => (b.root + c) % 12); return a.chords[0].map((c) => a.root + c).filter((n) => pcs.includes(n % 12)); };
// a random next tune for this place, never the same one twice; nearby keys and tempos are likelier, so the bridge is smooth
function next(at) {
  const cur = decks[live].name, t0 = TRACKS[cur], opts = pool(place).filter((n) => n !== cur);
  const w = opts.map((n) => { const t = TRACKS[n], k = ((t.root - t0.root) % 12 + 12) % 12;
    return ([0, 5, 7].includes(k) ? 3 : [2, 10, 3, 9].includes(k) ? 1.6 : [1, 11, 6].includes(k) ? .4 : 1) * (Math.abs(t.bpm - t0.bpm) <= 8 ? 2 : 1) * (common(t0, t).length ? 1 : .3); });
  let x = Math.random() * w.reduce((a, b) => a + b, 0), pick = opts[0];
  for (let k = 0; k < opts.length; k++) if ((x -= w[k]) < 0) { pick = opts[k]; break; }
  crossfade(pick, at, 6, 2);
}

export const soundtrack = {
  get enabled() { return enabled; },
  get song() { return decks[live]?.timer ? decks[live].name : null; },
  get output() { return master; }, // for recording the mix in tests
  songSlots: 0, // tests: force short songs (eighth-note slots); 0 = 3–5 times through the form
  // name: "home" | "camp" | a mine id: the place. Its own tune comes in over a short crossfade; a playlist follows.
  play(name) {
    place = name;
    if (!enabled) return;
    init(); if (ctx.state === "suspended") ctx.resume();
    if (playing === name && decks[live].timer) return; // already here (sheets call this on every open)
    playing = name; crossfade(TRACKS[name] ? name : "home", ctx.currentTime + .05, 2.5, 1);
  },
  setTension(x) { tension = Math.max(0, Math.min(1, x)); if (ctx) tensionGain.gain.setTargetAtTime(tension ? 1 : 0, ctx.currentTime, .4); },
  // music volume 0–1 (the Options sheet can drive this); the music on/off option uses setEnabled
  setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (ctx && enabled) setLevel(volume, .3); },
  setEnabled(on) {
    enabled = on;
    if (!ctx) { if (on && place) this.play(place); return; }
    if (!on) { setLevel(0, .5); for (const d of decks) { clearInterval(d.timer); d.timer = null; } return; }
    setLevel(volume, .5); playing = null; if (place) this.play(place);
  },
  // a single gem "note" for the camp shelf: each gem type sings its own pitch
  chime(i) { if (!enabled && !ctx) return; init(); pluck({ out: music, rev: musicRev, ech: musicEcho }, NOTE(scaleNote(TRACKS.camp, i % 10) + 12), ctx.currentTime + .01, .14, "musicbox", 1); },
  pause() { if (ctx && ctx.state === "running") ctx.suspend(); },
  resume() { if (ctx && enabled) ctx.resume(); },
};
document.addEventListener("visibilitychange", () => (document.hidden ? soundtrack.pause() : soundtrack.resume()));

// ---------- sound effects: one soft set of woody knocks and crystal tines, in the same room (reverb) as the music ----------
// Everything goes through a compressor under the music's level, so no effect is louder than the soundtrack.
let sfxBus;
const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02]; // C major pentatonic
function bus() {
  init(); if (ctx.state === "suspended") ctx.resume();
  if (!sfxBus) {
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = .002; comp.release.value = .15;
    sfxBus = ctx.createGain(); sfxBus.gain.value = .9; sfxBus.connect(comp).connect(master);
  }
  return ctx.currentTime;
}
function knock(freq, when, vol, dec = .09) { // wood: a sine that drops in pitch, plus a short filtered click
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(freq * 1.6, when); o.frequency.exponentialRampToValueAtTime(freq, when + .018);
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .003); g.gain.exponentialRampToValueAtTime(.0001, when + dec);
  o.connect(g).connect(sfxBus); o.start(when); o.stop(when + dec + .02);
  noise(when, .018, vol * .35, freq * 5, 1.4, sfxBus);
}
function tine(freq, when, vol, dec = .5, wet = .5) { // crystal: a sine with a bell-like inharmonic partial, ringing into the reverb
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(), send = ctx.createGain();
  o.frequency.value = freq; o2.frequency.value = freq * 2.76;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .004); g.gain.exponentialRampToValueAtTime(.0001, when + dec);
  g2.gain.setValueAtTime(vol * .3, when); g2.gain.exponentialRampToValueAtTime(.0001, when + dec * .3);
  send.gain.value = wet; o.connect(g); o2.connect(g2).connect(g); g.connect(sfxBus); g.connect(send).connect(reverb);
  o.start(when); o2.start(when); o.stop(when + dec + .05); o2.stop(when + dec + .05);
}
function air(when, dur, vol, from, to) { // a soft breath of filtered noise (sheets, shatter dust)
  noise(when, dur, vol, from, .8, sfxBus);
  if (to) noise(when + dur * .3, dur * .7, vol * .7, to, .8, sfxBus);
}
const on = () => sfx.isOn();
export const sfx = {
  isOn: () => true, // index.html points this at the Sound option
  // the old one-line synth calls, softened into the same set: square/saw become a woody knock, the rest a tine
  tone(freq, dur = .12, type = "sine", vol = .14, when = 0) {
    if (!on()) return; const t = bus() + when, v = Math.min(.12, vol * .8);
    type === "square" || type === "sawtooth" || freq < 300 ? knock(Math.max(70, freq), t, v, Math.max(.06, Math.min(.3, dur))) : tine(freq, t, v, Math.max(.08, dur * 1.4), .35);
  },
  tap() { if (!on()) return; const t = bus(); knock(540, t, .07, .05); tine(1760, t + .01, .018, .08, .2); },
  pick() { if (!on()) return; const t = bus(); knock(420, t, .06, .05); tine(1318.5, t, .025, .12, .2); },
  place() { if (!on()) return; const t = bus(); knock(170, t, .13, .12); knock(330, t + .012, .05, .05); tine(1568, t + .015, .035, .18, .3); },
  drop() { if (!on()) return; const t = bus(); knock(240, t, .06, .07); }, // a piece that didn't fit slides home
  // a clear: one rising tine per line, higher with the combo; bigger clears add a low wooden thump and a shimmer
  clear(lines, combo, power) {
    if (!on()) return; const t = bus(), up = Math.min(6, Math.max(0, combo - 1));
    for (let k = 0; k <= lines; k++) tine(PENT[Math.min(PENT.length - 1, up + k * 2)], t + k * .055, .085, .7 + power * .08);
    air(t, .35 + power * .05, .02 + power * .006, 5200, 8000);
    if (power >= 2) knock(95, t, .14, .22);
    if (power >= 3) for (let k = 0; k < 4; k++) tine(PENT[8 + k] * 1.0, t + .16 + k * .04, .03, .5, .7);
  },
  coin(k = 0) { if (!on()) return; const t = bus(); tine(PENT[9 + (k % 4)], t, .04, .14, .25); },
  ember() { if (!on()) return; const t = bus(); knock(70, t, .16, .35); for (let k = 0; k < 6; k++) noise(t + k * .03 + Math.random() * .02, .03, .05, 1800 + Math.random() * 2400, 2, sfxBus); },
  freeze() { if (!on()) return; const t = bus(); [2093, 2637, 3136].forEach((f, k) => tine(f, t + k * .06, .035, 1.1, .8)); },
  bloom() { if (!on()) return; const t = bus(); [880, 1174.66].forEach((f, k) => tine(f, t + k * .06, .04, .5)); },
  pure() { if (!on()) return; const t = bus() + .14; [1046.5, 1318.51, 1567.98].forEach((f, k) => tine(f, t + k * .05, .05, .6, .6)); },
  crack() { if (!on()) return; const t = bus(); knock(110, t, .12, .16); noise(t, .06, .06, 2400, 1.5, sfxBus); },
  tick() { if (!on()) return; const t = bus(); knock(98, t, .1, .14); }, // the Rootline running low: a soft heartbeat knock
  thud() { if (!on()) return; const t = bus(); knock(130, t, .12, .2); knock(98, t + .14, .1, .26); }, // no room / roots closed
  rescue() { if (!on()) return; const t = bus(); [783.99, 1046.5, 1318.51, 1567.98].forEach((f, k) => tine(f, t + k * .07, .05, .6)); },
  moth() { if (!on()) return; const t = bus(); for (let k = 0; k < 3; k++) noise(t + k * .05, .04, .03, 1300 + k * 200, 1.2, sfxBus); tine(1567.98, t + .1, .025, .2); },
  nibble() { if (!on()) return; const t = bus(); knock(260, t, .05, .05); knock(210, t + .07, .05, .05); },
  buy() { if (!on()) return; const t = bus(); [1318.51, 1760, 2093].forEach((f, k) => tine(f, t + k * .05, .045, .3, .35)); knock(300, t, .05, .05); },
  whoosh() { if (!on()) return; air(bus(), .22, .025, 900, 1600); },
  chirp() { if (!on()) return; const t = bus(); tine(1567.98, t, .04, .12, .2); tine(2093, t + .08, .035, .16, .2); },
  chime() { if (!on()) return; const t = bus(); [1046.5, 1318.51, 1567.98, 2093].forEach((f, k) => tine(f, t + k * .12, .045, .9, .7)); },
};

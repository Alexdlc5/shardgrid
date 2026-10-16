// Glimmerwood soundtrack: composed in code (Web Audio), so it's original and costs no files.
// Each place has a fixed tune: a pentatonic melody phrased A A' B A over a 4-chord loop, played on a
// kalimba / music-box voice, with a warm pad, soft bass, a whisper shaker, and place ambience.
let ctx, master, music, ambBus, reverb, echo, current = null, timer = null, tension = 0, tensionGain;
let enabled = true;

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
};
// the Underroot and the Skywell reuse a mine's voice in a new key and tempo
Object.assign(TRACKS, { cinder: { ...TRACKS.ember, root: 48, bpm: 64, seed: 113 }, roost: { ...TRACKS.grotto, root: 59, bpm: 62, seed: 127 },
  loom: { ...TRACKS.frostpine, root: 55, bpm: 58, seed: 131 }, wickhold: { ...TRACKS.hollow, root: 53, bpm: 70, seed: 137 }, skywell: { ...TRACKS.frostpine, root: 60, bpm: 66, seed: 139 } });

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
const scaleNote = (t, step) => t.root + 12 + Math.floor(step / 5) * 12 + t.scale[step % 5];

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination);
  music = ctx.createGain(); music.connect(master); ambBus = ctx.createGain(); ambBus.gain.value = .5; ambBus.connect(master);
  // generated reverb: decaying stereo noise
  reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.8, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
  reverb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = .32; reverb.connect(wet).connect(master);
  // soft echo for plucks
  echo = ctx.createDelay(1); const fb = ctx.createGain(), ew = ctx.createGain(); fb.gain.value = .28; ew.gain.value = .22;
  echo.connect(fb).connect(echo); echo.connect(ew).connect(master);
  tensionGain = ctx.createGain(); tensionGain.gain.value = 0; tensionGain.connect(master);
}

function pluck(freq, when, vol, voice, bright = 1) {
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  const dec = voice === "musicbox" ? 1.9 : voice === "marimba" ? .7 : 1.3;
  o.type = voice === "marimba" ? "sine" : "triangle"; o.frequency.value = freq;
  o2.type = "sine"; o2.frequency.value = freq * (voice === "musicbox" ? 4 : 3.01);   // bell / tine overtone
  const g2 = ctx.createGain(); g2.gain.setValueAtTime(vol * .25 * bright, when); g2.gain.exponentialRampToValueAtTime(.0001, when + dec * .35);
  f.type = "lowpass"; f.frequency.value = 2600 * bright;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + dec);
  o.connect(g); o2.connect(g2).connect(g); g.connect(f).connect(music); f.connect(reverb); f.connect(echo);
  o.start(when); o2.start(when); o.stop(when + dec + .05); o2.stop(when + dec + .05);
}
function pad(freqs, when, dur, vol) {
  const f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = .4;
  g.gain.setValueAtTime(.0001, when); g.gain.linearRampToValueAtTime(vol, when + dur * .35); g.gain.linearRampToValueAtTime(.0001, when + dur);
  g.connect(f).connect(music); f.connect(reverb);
  for (const fr of freqs) for (const det of [-6, 6]) {
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr; o.detune.value = det;
    o.connect(g); o.start(when); o.stop(when + dur + .05);
  }
}
function bass(freq, when, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .02); g.gain.exponentialRampToValueAtTime(.0001, when + 1.2);
  o.connect(g).connect(music); o.start(when); o.stop(when + 1.3);
}
let noiseBuf;
function noise(when, dur, vol, freq, q = 1, bus = music) {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + .005); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
  s.connect(f).connect(g).connect(bus); s.start(when, Math.random() * .5); s.stop(when + dur + .02);
}
function ambience(kind, when, span) {
  const r = Math.random;
  if (kind === "crickets") for (let k = 0; k < 3; k++) if (r() < .55) { const t0 = when + r() * span; for (let c = 0; c < 3; c++) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 4200 + r() * 600;
    g.gain.setValueAtTime(.0001, t0 + c * .07); g.gain.exponentialRampToValueAtTime(.012, t0 + c * .07 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + c * .07 + .05);
    o.connect(g).connect(ambBus); o.start(t0 + c * .07); o.stop(t0 + c * .07 + .06); } }
  if (kind === "fire") for (let k = 0; k < 6; k++) if (r() < .7) noise(when + r() * span, .03 + r() * .05, .05 + r() * .06, 1800 + r() * 2500, 2, ambBus);
  if (kind === "drips" && r() < .35) { const t0 = when + r() * span, o = ctx.createOscillator(), g = ctx.createGain(), fr = 900 + r() * 700;
    o.frequency.setValueAtTime(fr, t0); o.frequency.exponentialRampToValueAtTime(fr * 1.9, t0 + .09);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.05, t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + .18);
    o.connect(g).connect(ambBus); g.connect(reverb); o.start(t0); o.stop(t0 + .2); }
  if (kind === "wind" && r() < .4) noise(when + r() * span, 2.5, .025, 500 + r() * 300, .7, ambBus);
}

// lookahead scheduler: one eighth-note slot at a time, a little ahead of the clock
function schedule(t, state) {
  const eighth = 60 / t.bpm / 2, ahead = .35;
  while (state.next < ctx.currentTime + ahead) {
    const s = state.slot, bar = Math.floor(s / 8), phrase = Math.floor(s / 16) % 4, pos = s % 16, chord = t.chords[bar % 4];
    const when = state.next;
    if (s % 8 === 0) {
      pad(chord.map((c) => NOTE(t.root - 12 + c + 12)), when, eighth * 8.2, .028);
      bass(NOTE(t.root - 24 + chord[0]), when, .14);
    }
    if (s % 8 === 4) bass(NOTE(t.root - 24 + chord[0] + 7), when, .07);
    const st = t.melody[phrase][pos % 8]; // each phrase: stated in bar 1, echoed sparser in bar 2
    if (st !== null && (pos < 8 || s % 2 === 0)) pluck(NOTE(scaleNote(t, st)), when + (s % 2 ? eighth * .06 : 0), .11, t.voice, t.bright);
    if (s % 4 === 2) noise(when, .05, .018, 7000, 1.2);                      // whisper shaker
    if (s % 32 === 30) pluck(NOTE(scaleNote(t, 7) + 12), when, .05, "musicbox", t.bright); // sparkle at the turnaround
    if (tension > 0 && s % 2 === 0) { // low Rootline: soft heartbeat under the music
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 58;
      g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(.2 * tension, when + .01); g.gain.exponentialRampToValueAtTime(.0001, when + .16);
      o.connect(g).connect(tensionGain); o.start(when); o.stop(when + .2);
    }
    if (s % 8 === 0) ambience(t.amb, when, eighth * 8);
    state.slot++; state.next += eighth;
  }
}

export const soundtrack = {
  get enabled() { return enabled; },
  // name: "home" | "camp" | a mine id. Crossfades from whatever is playing.
  play(name) {
    if (!enabled) { current = name; return; }
    init(); if (ctx.state === "suspended") ctx.resume();
    if (current === name && timer) return;
    current = name;
    const t = { ...(TRACKS[name] || TRACKS.home) }; t.melody = compose(t);
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setValueAtTime(music.gain.value, ctx.currentTime); music.gain.linearRampToValueAtTime(.0001, ctx.currentTime + .8);
    clearInterval(timer);
    const state = { next: ctx.currentTime + .9, slot: 0 };
    music.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.6);
    timer = setInterval(() => schedule(t, state), 90);
  },
  setTension(x) { tension = Math.max(0, Math.min(1, x)); if (ctx) tensionGain.gain.setTargetAtTime(tension ? 1 : 0, ctx.currentTime, .4); },
  setEnabled(on) {
    enabled = on;
    if (!on) { clearInterval(timer); timer = null; if (music) music.gain.setTargetAtTime(.0001, ctx.currentTime, .3); }
    else if (current) { const c = current; current = null; this.play(c); }
  },
  // a single gem "note" for the camp shelf: each gem type sings its own pitch
  chime(i) { if (!enabled && !ctx) return; init(); pluck(NOTE(scaleNote(TRACKS.camp, i % 10) + 12), ctx.currentTime + .01, .14, "musicbox", 1); },
  pause() { if (ctx && ctx.state === "running") ctx.suspend(); },
  resume() { if (ctx && enabled) ctx.resume(); },
};
document.addEventListener("visibilitychange", () => (document.hidden ? soundtrack.pause() : soundtrack.resume()));

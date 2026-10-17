// Virtual time for the trailer capture: injected first in <head>, before the game's own scripts.
// Timers, requestAnimationFrame, performance.now/Date.now, CSS animations and SVG <animate> all run on one clock that only
// moves when the capture script calls __step(ms), so every frame is exactly where the timeline says, however slow the
// screenshot. Math.random is seeded, so particles, twinkles and blip pitches come out the same on every render.
(() => {
  let now = 0, seq = 0, frameNo = 0;
  const T0 = Date.UTC(2026, 9, 16, 21), timers = new Map(), rafs = new Map();
  let s = 20261016; Math.random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  performance.now = () => now;
  Date.now = () => T0 + now;
  window.setTimeout = (fn, ms = 0, ...a) => { const id = ++seq; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, a, seq: id }); return id; };
  window.setInterval = (fn, ms = 0, ...a) => { const id = ++seq; timers.set(id, { at: now + Math.max(1, +ms || 0), fn, a, every: Math.max(1, +ms || 0), seq: id }); return id; };
  window.clearTimeout = window.clearInterval = (id) => timers.delete(id);
  window.requestAnimationFrame = (fn) => { const id = ++seq; rafs.set(id, fn); return id; };
  window.cancelAnimationFrame = (id) => rafs.delete(id);

  // CSS animations/transitions and SMIL: paused, and set to (clock - when we first saw them)
  const born = new WeakMap();
  const syncAnims = () => {
    for (const a of document.getAnimations()) {
      if (!born.has(a)) { born.set(a, now); a.pause(); }
      a.currentTime = now - born.get(a);
    }
    for (const el of document.querySelectorAll("animate, animateTransform, animateMotion, set")) {
      let svg = el.ownerSVGElement; while (svg?.ownerSVGElement) svg = svg.ownerSVGElement;
      if (!svg || svg.__done === frameNo) continue;
      if (!born.has(svg)) born.set(svg, now);
      svg.pauseAnimations(); svg.setCurrentTime((now - born.get(svg)) / 1000); svg.__done = frameNo;
    }
  };
  const run = (fn, a) => { try { fn(...a); } catch (e) { console.error(e.stack || e); } };
  // advance by ms: fire every timer due on the way, at its own time; then one animation frame at the new time
  window.__step = (ms) => {
    const end = now + ms;
    for (;;) {
      let next = null;
      for (const t of timers.values()) if (t.at <= end && (!next || t.at < next.at || (t.at === next.at && t.seq < next.seq))) next = t;
      if (!next) break;
      now = Math.max(now, next.at);
      const id = [...timers].find(([, t]) => t === next)[0];
      if (next.every) { next.at += next.every; next.seq = ++seq; } else timers.delete(id);
      run(next.fn, next.a);
    }
    now = end; frameNo++;
    const due = [...rafs]; rafs.clear();
    for (const [, fn] of due) run(fn, [now]);
    syncAnims();
    return now;
  };
  window.__now = () => now;
})();

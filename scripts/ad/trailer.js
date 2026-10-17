// ===== Glimmerwood trailer director =====
// scripts/ad/render.mjs pastes this at the end of the game's own module (proto/index.html), so it drives the real game:
// startDig, the board and its clears, pets waking, the camp, the title, and say() typing with voice blips. It plays a fixed
// script on the page clock. Under capture (scripts/ad/clock.js) that clock is virtual and every sound is logged instead of
// played; render.mjs replays the log through music.js offline, so picture and sound come from the same timeline.
{
  const capture = !!window.__step, AD = window.AD = { log: [], dur: 27.6, start: 0, on: false };
  const T = () => (performance.now() - AD.start) / 1000;
  // sound: the game's own sfx calls are logged under capture (they play live in the preview); the music is the trailer's,
  // so the game's soundtrack switching (title, camp, mine) is muted and the trailer cues its own
  const live = Object.fromEntries(["play", "setTension", "setVolume"].map((k) => [k, soundtrack[k].bind(soundtrack)]));
  for (const k of ["play", "setTension", "setVolume", "setEnabled"]) soundtrack[k] = () => {};
  if (capture) for (const k of Object.keys(sfx)) if (k !== "isOn" && typeof sfx[k] === "function") sfx[k] = (...a) => { if (AD.on && sfx.isOn()) AD.log.push({ t: T(), k, a }); return false; };
  const music = (k, ...a) => (capture ? AD.log.push({ t: T(), k: "music." + k, a }) : live[k](...a));
  Object.assign(save, { metPuddock: true, biomes: ["hollow", "frostpine", "grotto"], mode: "exp", gold: 1240 });
  Object.assign(save.story, { prologue: true }); save.opt.glyph = false; save.seen.push(...Object.keys(TIPS)); // no first-time tips over the shots
  for (const o of [{ sleep: true }, {}, { head: "bow" }]) petImg("glowcap", o); // painted ahead, so they're ready the frame they're needed

  // ---------- overlay: dialogue box, finger, fades, and a few props drawn over the real screens ----------
  document.head.insertAdjacentHTML("beforeend", `<style>
    #ad { position: fixed; inset: 0; z-index: 43; pointer-events: none; }
    #ad > * { position: absolute; }
    .adBox { left: 12px; right: 12px; display: none; gap: 10px; align-items: stretch; padding: 9px; border: 3px solid #2b1a0e; border-radius: 16px;
      background: repeating-linear-gradient(178deg, rgba(0,0,0,.05) 0 2px, transparent 2px 9px), linear-gradient(180deg, #74502f, #4f331d);
      box-shadow: 0 8px 24px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,220,170,.18); }
    .adBox.on { display: flex; animation: adIn .22s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes adIn { from { transform: translateY(10px) scale(.96); opacity: 0; } }
    .adFace { flex: none; width: 96px; border-radius: 10px; overflow: hidden; position: relative; background: radial-gradient(circle at 50% 40%, #3a5a3a, #142218); box-shadow: inset 0 2px 8px rgba(0,0,0,.6); }
    .adFace svg { position: absolute; left: calc(50% - var(--s) / 2); top: var(--y); width: var(--s); height: auto; }
    .adFace.talking svg { animation: chat .32s ease-in-out infinite; }
    .adText { flex: 1; min-height: 78px; background: #f1e2bd; border-radius: 10px; padding: 7px 12px 9px; color: #3a2418;
      font: 600 22px/1.25 var(--font-body); box-shadow: inset 0 -2px 0 #c9ad78; }
    .adText b.who { display: block; font: 700 14px/1.2 var(--font-display); letter-spacing: .8px; text-transform: uppercase; color: #8a5a32; margin-bottom: 2px; }
    .adText.narr { font-style: italic; text-align: center; display: grid; align-content: center; background: #e9dcc0; }
    .adBox.narr { background: rgba(10,8,6,.88); border-color: #3a2c20; }
    #adTouch { width: 34px; height: 34px; margin: -17px; border-radius: 50%; background: rgba(255,250,235,.32); border: 2px solid rgba(255,250,235,.7); display: none; }
    #adFade { inset: 0; background: #050806; opacity: 0; }
    #adDark { inset: 0; opacity: 0; background: radial-gradient(ellipse 60% 34% at 50% 40%, rgba(4,6,5,.55), rgba(2,3,2,.96) 70%); }
    #adChalk { left: 0; top: 0; opacity: 0; transform-origin: var(--cx) var(--cy); transform: scale(1.6); filter: drop-shadow(0 0 6px rgba(255,236,170,.9)) drop-shadow(0 0 18px rgba(255,214,122,.6)); }
    #adPale { opacity: 0; filter: brightness(0) invert(.9) blur(1.2px); }
    .adPet { display: none; transform-origin: 50% 92%; } .adPet svg { display: block; filter: drop-shadow(0 4px 6px rgba(0,0,0,.45)); }
    #adWalk { display: none; } #adWalk svg { display: block; }
    #adCta { display: none; }
    .adCard { display: none; left: 24px; right: 24px; top: 128px; text-align: center; animation: adIn .5s ease-out both; }
    .adCard .logoSwash { width: 58%; margin: 0 auto 6px; } .adCard .tagline { font-size: 17px; margin: 4px 8px 4px; }
    .adCta { margin: 14px auto 0; width: 86%; padding: 12px; border: 3px solid transparent; border-image: var(--p-amber) 18 fill / 15px stretch; color: #3a2208;
      font: 700 22px var(--font-display); text-align: center; }
    .adSub { margin-top: 10px; font: 600 15px var(--font-body); color: rgba(246,234,208,.75); text-align: center; }
    body.adShot #campHint, body.adShot .hubBar { visibility: hidden; }
    body.adEnd #tPlay, body.adEnd #tOpts, body.adEnd #tMem, body.adEnd #titleNote { display: none; }
    body.adForest .titleWrap { visibility: hidden; }
    body.adForest .titleScene { top: -200px; bottom: 200px; }
    body.adForest #title::after { content: ""; position: fixed; left: 0; right: 0; bottom: 0; height: 202px; background: #0a1710; z-index: 0; }
  </style>`);
  const ad = Object.assign(document.createElement("div"), { id: "ad" });
  ad.innerHTML = `<div id="adDark"></div><div id="adPale">${bidder(180, false)}</div><canvas id="adChalk"></canvas>
    <div id="adWalk">${dibble(150, save.look)}</div><div class="adPet" id="adPet"></div><div id="adTouch"></div>
    <div class="adBox" id="adBox"><div class="adFace" id="adFace"></div><div class="adText" id="adText"></div></div><div id="adFade"></div>`;
  document.body.appendChild(ad);
  const el = (id) => document.getElementById(id), css = (e, s) => Object.assign(e.style, s);
  const ease = (k) => (k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2), clamp = (k) => Math.max(0, Math.min(1, k));
  // the speaker's portrait: their own art, framed on the face
  const FACE = { dibble: () => [dibble(190, save.look), "-6px", "190px"], puddock: () => [puddock(170), "-2px", "170px"] };
  const NAME = { dibble: "Dibble", puddock: "Old Puddock" };
  let sayEnd = 0;
  // a line in the box: who (null = narration), at `top` px; resolves when typed
  function line(who, text, top) {
    const box = el("adBox"), face = el("adFace"), txt = el("adText");
    box.classList.toggle("narr", !who); txt.classList.toggle("narr", !who); face.style.display = who ? "" : "none";
    if (who) { const [svg, y, s] = FACE[who](); face.innerHTML = svg; face.style.setProperty("--y", y); face.style.setProperty("--s", s); }
    css(box, { top: top + "px" }); box.classList.remove("on"); void box.offsetWidth; box.classList.add("on");
    txt.innerHTML = (who ? `<b class="who">${NAME[who]}</b>` : "") + `<span id="adLine"></span>`;
    face.classList.add("talking");
    return say(el("adLine"), text, who).then(() => { face.classList.remove("talking"); sayEnd = T(); });
  }
  const hideBox = () => el("adBox").classList.remove("on");

  // ---------- board helpers: fill a dig with real pieces, and drag a tray piece in like a finger would ----------
  const shapeKey = (cells) => cells.map(([r, c]) => r + "," + c).sort().join(" ");
  const shapeOf = (art) => { const cells = []; art.split("/").forEach((row, r) => [...row].forEach((ch, c) => ch === "X" && cells.push([r, c])));
    const p = cat.find((q) => shapeKey(q.cells) === shapeKey(cells)); if (!p) throw new Error("no piece " + art); return p; };
  function dig(id, fill, trayDef, kind = "glowcap") {
    save.sel = id; startDig();
    for (const [art, r, c, type, petCell] of fill) { const p = shapeOf(art), u = uid++; board = place(board, p, r, c, u);
      meta[u] = { type, r, c, h: p.h, w: p.w, at: -1e6, petAt: -1, ...(petCell != null && { pet: kind, petAt: (r + p.cells[petCell][0]) * N + c + p.cells[petCell][1] }) }; }
    if (fullLines(board).rows.length + fullLines(board).cols.length) throw new Error(id + ": a line is full before the drag");
    tray = trayDef.map(([art, type]) => ({ piece: shapeOf(art), type })); dealtAt = performance.now() - 2000; started = true; time = maxTime;
  }
  let path = null; // the finger: { from, to, t0, dur }
  function slide(i, r, c, at, dur = .42) {
    cue(at, () => { const q = tray[i], f = trayRect(i), p = q.piece;
      path = { x0: f.x + p.w * ts / 2, y0: f.y + p.h * ts / 2, x1: bx + c * cell + p.w * cell / 2, y1: by + r * cell + cell * .8 + p.h * cell, t0: T(), dur };
      drag = { i, ...q, x: path.x0, y: path.y0, touch: true, at: performance.now(), from: f }; back[i] = null; sfx.pick(); });
    cue(at + dur, () => { drop(); path = null; shakeAmp *= .5; });
  }

  // ---------- the timeline ----------
  const cues = [];
  const cue = (t, fn) => cues.push([t, fn]);
  const walk = { on: false };
  let freed = null, pale = null, chalk = null; // per-frame props

  const CUTS = {
    // "Just one more crystal": quick, funny, a little mystery (the first ad)
    onemore() {
      AD.dur = 27.6; AD.beats = [2.4, 4.3, 5.6, 7.1, 9.1, 10.4, 11.6, 16.0, 18.6, 21.0, 22.6, 25.6];
      // 1. A dark forest. A lantern bobs in.
      cue(0, () => { document.body.classList.add("adForest"); show("title"); music("play", "home"); walk.on = true; });
      cue(.75, () => line("dibble", "Okay. Just one more crystal.", 96));
      cue(3.35, hideBox);
      // 2. Quick clears: Mossy Hollow, then a big one in Frostpine
      cue(3.6, () => { walk.on = false; document.body.classList.remove("adForest");
        dig("hollow", [["XX/XX", 5, 0, "jade"], ["XXXX", 6, 2, "moss"], ["XX", 5, 2, "amber"], ["XX", 5, 4, "moss"], ["XX", 7, 0, "moss"], ["XX", 7, 6, "jade"],
          ["XX/X.", 3, 0, "jade"], ["XXX", 2, 4, "moss"], ["X/X", 3, 6, "amber"], ["XX", 0, 1, "moss"], [".X/XX", 3, 3, "amber"], ["X", 1, 6, "jade"]],
        [["XXXX", "moss"], ["XX/XX", "amber"], ["X", "jade"]]); });
      slide(0, 7, 2, 3.85);
      slide(1, 5, 6, 4.95);
      cue(6.25, () => dig("frostpine", [["XXX/XXX", 2, 0, "sapphire"], ["XX/XX", 2, 3, "jade"], ["XX", 4, 3, "moonstone"], ["XX/XX", 2, 6, "sapphire"], ["XX", 4, 6, "jade"],
          ["XXX", 4, 0, "moonstone"], ["X/X", 0, 5, "sapphire"], ["X/X", 5, 5, "moonstone"], ["X", 7, 5, "jade"], ["XX", 0, 1, "jade"], ["XXX", 6, 1, "sapphire"], ["X", 1, 7, "moonstone"]],
        [["X/X/X", "moonstone"], ["XX", "sapphire"], ["X", "jade"]]));
      slide(0, 2, 5, 6.5);
      // 3. A crystal cracks and a tiny round pet tumbles out
      cue(8.45, () => dig("grotto", [["XXX", 3, 0, "glowcap"], ["XX", 3, 5, "moss", 1], ["X", 3, 7, "moonstone"], ["XX/XX", 4, 1, "moonstone"], ["XXX", 5, 4, "jade"],
          ["X/X", 1, 2, "jade"], ["XX", 6, 5, "glowcap"], ["X", 0, 6, "moss"], [".X/XX", 1, 5, "moonstone"], ["X", 6, 0, "glowcap"]],
        [["XX", "glowcap"], ["X/X", "jade"], ["X", "moss"]]));
      slide(0, 3, 3, 9.2);
      cue(11.02, () => { const f = frees[0]; if (!f) return; frees = []; save.pets.active = []; freed = { x: f.x, y: f.y + cell * .45, s: cell * 1.35, t0: T() }; });
      cue(10.25, () => line("dibble", "…you were <b>IN</b> there?", 470));
      cue(11.75, () => { sfx.chirp(); freed.hop = T(); });
      cue(12.85, hideBox);
      // 4. Puddock at his stall, drowsy. The pet comes back in a tiny bow.
      cue(13.1, () => { freed = null; el("adPet").style.display = "none"; document.body.classList.add("adShot"); show("home"); renderHome(); frameCamp(["market", "dibble"]); });
      cue(13.35, () => line("puddock", "Shiny rocks, shiny coins. Fair trade, little mole.", 80));
      cue(16.25, () => { sfx.buy(); petBow(); });
      cue(16.55, () => sfx.chirp());
      cue(16.85, () => line("puddock", "Everything fits. They're all round.", 80));
      cue(19.05, () => { hideBox(); fadeTo(1, .3); music("setVolume", .14); });
      // 5. The music drops. Granny's chalk glows on the tunnel floor; something pale passes in the dark.
      cue(19.35, () => { el("adPet").style.display = "none"; camT = null; applyCam(); document.body.classList.remove("adShot"); dig("hollow", [], [["X", "moss"], ["X", "moss"], ["X", "moss"]]); tray = [null, null, null];
        $("hud").style.visibility = "hidden"; drawGlowChalk(); chalk = T(); fadeTo(0, .45); music("setTension", .55); });
      cue(19.95, () => { pale = T(); sfx.moth(); });
      cue(21.1, () => line(null, "Something down here is still glowing.", 492));
      cue(21.6, () => sfx.moth());
      cue(23.35, () => { hideBox(); fadeTo(1, .35); });
      // 6. End card: the logo, the tagline, where to get it
      cue(23.75, () => { chalk = pale = null; css(el("adChalk"), { opacity: 0 }); css(el("adPale"), { opacity: 0 }); css(el("adDark"), { opacity: 0 });
        document.body.classList.add("adEnd"); renderHome(); show("title"); endCard(); fadeTo(0, .4); music("setTension", 0); music("setVolume", 1); sfx.chime(); });
      cue(25.4, () => { sfx.chirp(); el("adPet").dataset.hop = T(); });
    },
    // the cozy one: the camp, a calm dig with no timer, a new friend, dressing up, the lanterns coming on
    cozy() {
      AD.dur = 28.4; AD.beats = [2.8, 4.0, 5.9, 7.6, 10.2, 13.7, 15.5, 16.9, 19.2, 21.0, 22.6, 26.0];
      Object.assign(save, { owned: [...save.owned, "tent:patchwork", "decor:mushrooms", "decor:jars", "decor:hammock"], found: ["moss", "jade", "amber", "garnet", "moonstone"] });
      Object.assign(save.camp, { tent: "patchwork" }); save.up.lantern = 9; save.pets = { owned: [], active: [], wear: {} };
      save.campSeen = { lanterns: 99, shelf: 99, sapling: 99, memories: 99, told: Object.keys(CAMP_TIPS) }; // no "another lantern lit!" tip over the shots
      // 1. The camp at night, the fire going
      cue(0, () => { document.body.classList.add("adShot"); show("home"); renderHome(); lanterns(3); music("play", "camp"); fadeTo(0, 1.2, 1); });
      cue(.7, () => line(null, "At the edge of the Glimmerwood, the fire's always lit.", 238));
      cue(3.25, () => line("dibble", "Mm. Cozy.", 238));
      cue(4.35, () => { hideBox(); fadeTo(.9, .45); });
      // 2. A calm dig: Calm Grove has no timer. Slow, satisfying clears.
      cue(4.8, () => { save.mode = "calm"; document.body.classList.remove("adShot");
        dig("hollow", [["XX/XX", 6, 0, "jade"], ["XX", 7, 2, "moss"], ["X", 6, 2, "amber"], ["XX", 6, 6, "moss"], ["XX", 7, 6, "amber"], ["X", 6, 5, "jade"],
          ["XX", 3, 0, "moss"], ["X/X", 2, 3, "amber"], ["XXX", 3, 5, "jade", 1], ["X", 3, 2, "jade"], ["XX", 0, 5, "moss"], [".X/XX", 4, 1, "amber"], ["X", 1, 7, "moss"]],
        [["XX", "amber"], ["XX", "moss"], ["X/X", "amber"]], "moss"); fadeTo(0, .5); });
      slide(0, 6, 3, 5.4, .7);
      cue(6.2, () => line("dibble", "No timer. No rush. Just crystals.", 470));
      slide(1, 7, 4, 7.55, .7);
      cue(8.75, hideBox);
      slide(2, 2, 4, 9.05, .7); // finishes row 3, where the Moss Puff sleeps
      cue(11.15, () => { const f = frees[0]; if (!f) return; frees = []; save.pets.active = []; freed = { x: f.x, y: f.y + cell * .45, s: cell * 1.35, t0: T(), kind: "moss" }; });
      cue(10.55, () => line("puddock", "Crystals keep things, little mole. Sometimes they keep someone.", 470));
      cue(13.2, () => { sfx.chirp(); freed.hop = T(); });
      cue(14.1, () => { hideBox(); fadeTo(.9, .45); });
      // 3. Back at camp, dressing up. Then the pet gets a cap to match.
      cue(14.55, () => { freed = null; el("adPet").style.display = "none"; document.body.classList.add("adShot"); save.mode = "exp";
        Object.assign(save.pets, { owned: ["moss"], active: ["moss"] }); show("home"); renderHome(); lanterns(3); pinPet("moss"); frameCamp(["dibble", "pet", "fire"], 2.1, .6); fadeTo(0, .45); });
      const outfits = [{ hat: "beanie", scarf: "#c8553d" }, { hat: "mushroom", scarf: "#ef8fb0" }, { hat: "flowers", scarf: "none", cloak: "shawl" }, { hat: "leaf", cloak: "none" }];
      outfits.forEach((o, k) => cue(15.2 + k * .62, () => { Object.assign(save.look, o); redrawFramed(); sfx.chirp(); sparkle("dibble"); }));
      cue(17.75, () => { save.pets.wear.moss = { head: "leaf" }; redrawFramed(); sfx.buy(); sparkle("pet"); });
      cue(18.15, () => line("dibble", "Matching is the whole point.", 96));
      cue(19.55, () => { hideBox(); fadeTo(.9, .45); });
      // 4. The whole camp; the lanterns come on one by one
      cue(20.0, () => { camT = null; applyCam(); renderHome(); lanterns(3); unpinPet("moss"); fadeTo(0, .45); });
      [3, 4, 5, 6, 7, 8].forEach((n, k) => cue(20.5 + k * .3, () => { lanterns(n + 1); sfx.tone([1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093][k], .3, "sine", .06); }));
      cue(20.9, () => line(null, "Every crystal brings a little light home.", 238));
      cue(23.3, () => { hideBox(); });
      // 5. End card over the camp
      cue(23.6, () => { cozyCard(); sfx.chime(); });
      cue(25.6, () => { sfx.chirp(); });
    },
  };
  (CUTS[qs.get("cut")] || CUTS.onemore)();

  let fade = null;
  function fadeTo(to, dur, from = +el("adFade").style.opacity || 0) { fade = { from, to, t0: T(), dur }; el("adFade").style.opacity = from; }
  // the camp, framed on Puddock's stall with Dibble by the fire (a fixed frame, no zoom move)
  function frameCamp(keys, maxK = 1.75, yAt = .62) {
    const st = $("campStage"), s0 = st.getBoundingClientRect(), rs = keys.map((k) => st.querySelector(`[data-tap="${k}"]`).getBoundingClientRect());
    const x0 = Math.min(...rs.map((r) => r.left)), x1 = Math.max(...rs.map((r) => r.right)), y0 = Math.min(...rs.map((r) => r.top)), y1 = Math.max(...rs.map((r) => r.bottom));
    const k = Math.min(maxK, innerWidth / ((x1 - x0) * 1.12)), cx = (x0 + x1) / 2 - s0.left, cy = (y0 + y1) / 2 - s0.top;
    const tx = innerWidth / 2 - s0.left - cx * k, ty = innerHeight * yAt - s0.top - cy * k;
    camT = `translate(${tx}px, ${ty}px) scale(${k})`; // on the art and the pets, not the stage: the stage's size and rect stay put (tick applies it)
    applyCam();
    const a = rs[0]; AD.stall = { x: s0.left + tx + ((a.left + a.right) / 2 - s0.left) * k, y: s0.top + ty + (a.bottom - s0.top) * k, k };
  }
  function petBow() { // hops up onto the counter, in a bow
    const p = el("adPet"), { x, y, k } = AD.stall, sz = 46 * k;
    p.innerHTML = pet("glowcap", sz, { head: "bow" }); p.dataset.hop = T();
    css(p, { display: "block", left: x - 52 * k - sz / 2 + "px", top: y - 44 * k - sz + "px" });
  }
  function endCard() {
    const tag = $("tagline"); if (!el("adCta")) tag.insertAdjacentHTML("afterend", `<div id="adCta" class="adCta">Free on the App Store</div>`);
    el("adCta").style.display = "block";
    const p = el("adPet"), h = $("dibbleArt").getBoundingClientRect(), s = 58;
    p.innerHTML = pet("glowcap", s, { head: "bow" }); p.dataset.hop = T();
    css(p, { display: "block", left: h.left + h.width / 2 + 52 + "px", top: h.bottom - s - 4 + "px" });
  }
  // a camp pet held just right of Dibble for the close shot, every frame (the game puts pets back on their walkable patch
  // whenever the camp redraws), then let go to hop about again
  let pin = null;
  function pinPet(k) { // measured before the close-up's transform, in the stage's own coordinates
    const p = campPet[k], st = $("campStage").getBoundingClientRect(), d = $("campArt").querySelector('[data-tap="dibble"]').getBoundingClientRect();
    clearTimeout(p.t); clearTimeout(p.t2); p.t = -1; p.el.classList.remove("doze"); petFace(p, -1);
    pin = { k, x: d.right - st.left + petGround.w * .2, y: d.bottom - st.top - 3 }; holdPet();
  }
  function holdPet() { const p = campPet[pin.k]; if (!p) return; [p.x, p.y] = [pin.x, pin.y]; p.el.style.transform = petAt(p.x, p.y); p.el.style.zIndex = Math.round(p.y); }
  function unpinPet(k) { pin = null; const p = campPet[k]; if (p) { p.t = null; petRest(p); } }
  // the camp redrawn under a close-up: measured unscaled (the pets size themselves from the camp's on-screen scale), then framed again
  function redrawFramed() { const keep = camT; camT = null; applyCam(); renderHome(); camT = keep; applyCam(); if (pin) holdPet(); }
  let camT = null; // the camp close-up's frame, kept on every frame (the pets layer resets its transform when the camp redraws)
  const applyCam = () => { for (const id of ["campArt", "campPets"]) { const e = $(id); if (camT) { e.style.transformOrigin = "0 0"; e.style.transform = camT; } else if (e.style.transformOrigin) e.style.transform = e.style.transformOrigin = ""; } };
  // the camp's lantern string with only the first n lit: the camp is drawn with them all lit, and tick dims the rest every
  // frame (the camp redraws itself when it first shows)
  let litN = null;
  const lanterns = (n) => { litN = n; };
  function dimLanterns() { // unlit: the camp's own unlit colours, no glow (CSS filters don't reach inside SVG)
    [...$("campArt").querySelectorAll('[data-tap="lanterns"] circle[fill="url(#lanternGlow)"]')].forEach((c, k) => { const off = k >= litN, g = c.parentNode;
      c.style.display = off ? "none" : "";
      for (const e of g.querySelectorAll("path")) { const f = e.getAttribute("fill"), st = e.getAttribute("stroke");
        if (f === "#f7d77a") e.style.fill = off ? "#3a3328" : ""; if (f === "#8a5a24" || st === "#8a5a24") e.style[f ? "fill" : "stroke"] = off ? "#1a1610" : "";
        if (st === "#c08a3a") e.style.display = off ? "none" : ""; } });
  }
  // a little burst of stars over a camp prop (drawn on the overlay, moved by tick)
  let sparks = [];
  function sparkle(key) {
    const r = $("campStage").querySelector(`[data-tap="${key}"]`).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height * .4;
    for (let k = 0; k < 9; k++) { const d = document.createElement("i"); d.className = "spark"; d.style.zIndex = 1; ad.appendChild(d);
      sparks.push({ d, x, y, a: k / 9 * Math.PI * 2 + .3, r: 34 + (k % 3) * 12, t0: T() }); }
  }
  // the cozy end card: the logo and its line over the camp, dimmed a little
  function cozyCard() {
    if (!el("adCard")) ad.insertAdjacentHTML("beforeend", `<div id="adCard" class="adCard"><h1 class="logo" aria-label="Glimmerwood">${logoLetters()}</h1>${logoSwash()}
      <div class="tag tagline">Glowing crystals, tiny friends, and a fire that's always lit.</div><div class="adCta">Free on the App Store</div></div>`);
    el("adCard").style.display = "block"; $("campFx").style.visibility = "hidden"; // Puddock's hum bubble would sit clipped at the edge under the card css(el("adDark"), { opacity: .92, background: "radial-gradient(ellipse 80% 40% at 50% 34%, rgba(6,10,7,.82), rgba(6,10,7,.35) 80%)" });
  }
  // Granny's chalk, re-drawn bright on its own layer: the game's drawChalk on a borrowed context, a few passes added up
  function drawGlowChalk() {
    const c = el("adChalk"), dpr = devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr; css(c, { width: innerWidth + "px", height: innerHeight + "px" });
    const g = c.getContext("2d"), keep = ctx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.globalCompositeOperation = "lighter";
    ctx = g; try { for (let k = 0; k < 4; k++) drawChalk(); } finally { ctx = keep; }
    c.style.setProperty("--cx", bx + cell * N / 2 + "px"); c.style.setProperty("--cy", by + cell * N / 2 + "px");
  }

  // per frame: the walk, the finger, the pets' hops, the fades, the mystery props
  function tick() {
    const t = T(), W = innerWidth, H = innerHeight;
    const w = el("adWalk"); w.style.display = walk.on ? "block" : "none";
    if (walk.on) { // in from the left, a bob on every step; then into the mine mouth, dimming into the dark
      const k = clamp(t / 2.2), x = -110 + (W / 2 - 100 + 110) * ease(k), step = walk.on && k < 1 ? Math.abs(Math.sin(t * Math.PI * 2.4)) : 0;
      const k2 = clamp((t - 2.45) / .85), x2 = x + 36 * ease(k2), sc = 1 - .3 * ease(k2);
      css(w, { left: x2 + "px", top: H - 202 - 150 - step * 6 + 18 * ease(k2) + "px", opacity: 1 - ease(clamp((t - 2.75) / .55)),
        transform: `scale(${sc}) rotate(${(step - .5) * 3 * (k < 1)}deg)`, transformOrigin: "50% 100%" });
    }
    const touch = el("adTouch");
    if (path) { const k = ease(clamp((t - path.t0) / path.dur)); drag.x = path.x0 + (path.x1 - path.x0) * k; drag.y = path.y0 + (path.y1 - path.y0) * k;
      css(touch, { display: "block", left: drag.x + "px", top: drag.y + "px" }); } else touch.style.display = "none";
    const p = el("adPet");
    if (freed) { // the freed pet, after the game's pop-out: lands, idles, hops once when it squeaks
      if (!p.firstChild || p.dataset.k !== "free") { p.innerHTML = pet(freed.kind || "glowcap", freed.s); p.dataset.k = "free"; }
      const u = t - freed.t0, land = Math.max(0, 1 - u / .25), hop = freed.hop ? Math.max(0, Math.sin(clamp((t - freed.hop) / .4) * Math.PI)) * cell * .6 : 0;
      css(p, { display: "block", left: freed.x - freed.s / 2 + "px", top: freed.y - freed.s * .92 - hop + "px", transform: `scale(${1 + .066 * land}, ${1 - .06 * land})` });
    } else if (p.style.display === "block" && p.dataset.hop) { // the bow: pop in, then a hop on the squeak
      const u = t - +p.dataset.hop, sc = u < .3 ? .3 + .7 * Math.sin(clamp(u / .3) * Math.PI / 2) * 1.08 : 1, hop = Math.max(0, Math.sin(clamp(u / .45) * Math.PI)) * 22;
      css(p, { transform: `translateY(${-hop}px) scale(${Math.min(1.08, sc)})` }); p.dataset.k = "";
    }
    sparks = sparks.filter((s) => { const u = (t - s.t0) / .6; if (u >= 1) { s.d.remove(); return false; }
      const e = 1 - (1 - u) ** 3; css(s.d, { transform: `translate(${s.x + Math.cos(s.a) * s.r * e}px, ${s.y + Math.sin(s.a) * s.r * e}px) scale(${.4 + .7 * e}) rotate(${u * 90}deg)`, opacity: 1 - u }); return true; });
    applyCam(); if (pin) holdPet();
    if (litN != null) dimLanterns();
    if (fade) { const k = clamp((t - fade.t0) / fade.dur); el("adFade").style.opacity = fade.from + (fade.to - fade.from) * ease(k); if (k >= 1) fade = null; }
    if (chalk != null) { const u = t - chalk; css(el("adDark"), { opacity: clamp(u / .6) });
      css(el("adChalk"), { opacity: ease(clamp((u - .35) / 1.1)) * (.85 + .15 * Math.sin(u * 2.2)) }); }
    if (pale != null) { const u = (t - pale) / 3.4, pl = el("adPale"); // drifts across the dark above the board, slow, and gone
      css(pl, { left: W * (1.05 - 1.6 * u) + "px", top: by - 165 + Math.sin(u * 5) * 6 + "px", opacity: .13 * Math.sin(clamp(u) * Math.PI) }); }
    requestAnimationFrame(tick);
  }

  AD.go = () => {
    AD.start = performance.now(); AD.on = true; cues.sort((a, b) => a[0] - b[0]);
    for (const [t, fn] of cues) setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, t * 1000);
    requestAnimationFrame(tick);
  };
  if (!capture) { // the live preview: tap to start (browsers need a tap before sound)
    show("title"); addEventListener("pointerdown", () => { soundtrack.setEnabled = () => {}; AD.go(); }, { once: true });
  }
}
// ===== end of trailer director =====

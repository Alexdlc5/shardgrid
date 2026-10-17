// Translations (proto/i18n.js, proto/lang/*.json).
//   node scripts/i18n.mjs extract   rebuild proto/lang/en.json, the list of every English string the game can show:
//                                   what the game shows on a walk through every screen and story scene (?i18n=collect),
//                                   plus each literal in the source split at HTML tags (states the walk can't reach)
//   node scripts/i18n.mjs check     every language has every key with the same {0} gaps, and a walk in each language
//                                   leaves no English on screen. Exit 1 on any problem.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const ts = createRequire(import.meta.url)("typescript");
const KEYS = join(ROOT, "proto/lang/en.json");
// shown as-is in every language: the brand, and strings that are only numbers, symbols or names of fonts/people
const KEEP = new Set(["Glimmerwood", "Alex de la Chica", "Tyler Finck", "Milena Brandão", "Hafontia", "SIL Open Font License", "Grandstander", "Fredoka", "Game Center", "App Store", "Apple Account"]);
// developer-only text (the fit report, the density readout, test notes) and CSS class lists aren't for players
const DEV = /safe area|px tall|minimum\)|card (body )?scrolls|clipped by the card|cut off at the side|^dpr |!important|^gw\.|^\{"|Glimmerwood (dev|Prototype)|^Old$|sans-serif|:not\(|\[data-|^position:|^transform:|dpr \{0\}|real game; free here/;
const classy = (s) => /^[a-zA-Z]+( [a-zA-Z]+)*$/.test(s) && /[a-z][A-Z]/.test(s);
const keepable = (s) => KEEP.has(s) || !/[A-Za-z]{2}/.test(s) || DEV.test(s) || classy(s);

// ---------- source literals ----------
const CODE = /^[#.[(@]|^\w+:[\w:-]+$|rgba?\(|\d+px|translate|scale\(|cubic-bezier|font-family|var\(--|https?:|data:image|\.(js|json|png|css)$|^[a-z][\w-]*$|^[A-Z_]+$|=|;$|^\s*\{\d\}\s*$|^[\d\s.,%×+:/-]+$/;
function literals(file) {
  const src = readFileSync(join(ROOT, file), "utf8"), sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true), out = [];
  (function walk(n) {
    let v = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) v = n.text;
    else if (ts.isTemplateExpression(n)) v = n.head.text + n.templateSpans.map((s, i) => `{${i}}` + s.literal.text).join("");
    // skip import paths, property keys and other code positions
    const p = n.parent;
    if (v != null && !(p && (ts.isImportDeclaration(p) || ts.isPropertyAssignment(p) && p.name === n || ts.isElementAccessExpression(p) || ts.isCaseClause(p) || ts.isBinaryExpression(p) && /^[=!]==?$/.test(p.operatorToken.getText())))) {
      const norm = (x) => { let k = 0; return x.replace(/\s+/g, " ").trim().replace(/\{\d\}/g, () => `{${k++}}`); };
      const add = (seg, edge) => {
        if (!seg || CODE.test(seg) || keepable(seg)) return;
        const words = seg.match(/\p{L}[\p{L}'’-]*/gu) || [];
        if (words.length >= 2 || /^\p{Lu}\p{Ll}+ ?[!.…?✦]*$/u.test(seg)) out.push({ seg, edge });
      };
      // dialogue and captions with only <b>/<i>/<br>/<small>/<em>: translated whole (say() and the like)
      if (/<(b|i|br|small|em)>/.test(v) && !/<(?!\/?(b|i|br|small|em)>)[^>]*>/.test(v)) add(norm(v), null);
      for (const raw of v.split(/<[^>]*>/)) {
        const seg = norm(raw), cut = seg.replace(/^\{0\}\s*/, "").replace(/\s*\{\d\}$/, "");
        // a sentence piece from inside a formatted line ("…, worn thin as a leaf") is only ever shown whole
        if (/<(b|i)>/.test(v) && !/^[\p{Lu}"“…♪{+]/u.test(cut)) continue;
        if (cut !== seg) add(norm(cut), seg); else add(seg, null);
      }
    }
    ts.forEachChild(n, walk);
  })(sf);
  return out;
}

// ---------- the walk ----------
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };
const server = createServer((req, res) => {
  const f = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(readFileSync(f));
}).listen(0);
const url = (q) => `http://localhost:${server.address().port}/proto/index.html?debug&i18n=collect&${q}`;

async function walk(lang) {
  const b = await chromium.launch(), seen = new Set(), errors = [];
  const page = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(e.message));
  const grab = async () => { for (const s of await page.evaluate(() => [...(window.i18nMissing || [])])) seen.add(s); };
  const L = lang ? `lang=${lang}&` : "";
  // every story scene, laid out at once (the scene-check mode)
  await page.goto(url(L + "scene=all")); await page.waitForSelector("#fitReport", { state: "attached", timeout: 30000 }); await grab();
  // every screen, every market and wardrobe tab, a dig with its tips, the end of a dig
  await page.goto(url(L)); await page.waitForFunction(() => window.gw, null, { timeout: 15000 });
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), tabs = async (sel) => { for (const b of document.querySelectorAll(sel)) { b.click(); await sleep(250); } };
    for (const id of ["title", "home", "mineSheet", "dailySheet", "wardrobe", "optsSheet", "market", "purseSheet", "memSheet", "talk"]) {
      gw.screen(id); await sleep(400);
      if (id === "market") await tabs("#mktTabs button");
      if (id === "wardrobe") await tabs("#wardrobe [data-grp], #wardrobe .tabs button, #wardrobe .seg button");
      if (id === "optsSheet") document.getElementById("oCredits").open = true;
    }
    gw.dig("hollow"); await sleep(1500); gw.end("time"); await sleep(1800); document.getElementById("rescueNo").click(); await sleep(1200);
  });
  await page.waitForTimeout(300); await grab();
  await b.close();
  return { seen, errors };
}

const mode = process.argv[2];
if (mode === "extract") {
  const keys = new Set(['"{0}"', "{0} · Calm"]), edges = []; // quoted speech: each language uses its own quote marks
  for (const f of ["proto/main.js", "proto/story.js", "proto/platform.js", "proto/art.js", "proto/ambient.js"])
    for (const { seg, edge } of literals(f)) edge ? edges.push([seg, edge]) : keys.add(seg);
  // the page itself: text between tags and the labels
  const html = readFileSync(join(ROOT, "proto/index.html"), "utf8").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
  for (const m of html.matchAll(/>([^<>]+)</g)) { const s = m[1].replace(/\s+/g, " ").trim(); if (/\p{L}{2}/u.test(s) && !keepable(s)) keys.add(s); }
  for (const m of html.matchAll(/(?:aria-label|alt|title|placeholder)="([^"]+)"/g)) if (!keepable(m[1])) keys.add(m[1]);
  const { seen, errors } = await walk(null);
  const asRe = (k) => new RegExp("^" + k.split(/\{\d\}/).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".+?") + "$", "s");
  // a gap at the edge of a literal: the walk shows whether it held text ("Map to {0}") or markup ("{0}Take the map"); unseen, keep both
  for (const [cut, whole] of edges) {
    const re = asRe(whole), full = [...seen].some((x) => re.test(x)), bare = seen.has(cut);
    if (full || !bare) keys.add(whole); if (bare || !full) keys.add(cut);
  }
  const pats = [...keys].filter((k) => /\{\d\}/.test(k)).map(asRe);
  for (const x of seen) {
    if (keepable(x) || keys.has(x) || pats.some((re) => re.test(x))) continue;
    let k = 0; const g = x.replace(/\d+(?:[.,]\d+)*[kM]?/g, () => `{${k++}}`); // numbers the game filled in
    keys.add(g);
  }
  for (const k of [...keys]) if (!/\{\d\}/.test(k) && pats.some((re) => re.test(k)) && /\d/.test(k)) keys.delete(k); // instances of a pattern
  const old = existsSync(KEYS) ? JSON.parse(readFileSync(KEYS, "utf8")) : [];
  const list = [...keys].sort((a, b) => a.localeCompare(b));
  writeFileSync(KEYS, JSON.stringify(list, null, 1) + "\n");
  console.log(`${list.length} strings (${list.filter((k) => !old.includes(k)).length} new, ${old.filter((k) => !keys.has(k)).length} gone); walk saw ${seen.size}${errors.length ? "; page errors: " + errors.join(" | ") : ""}`);
} else if (mode === "check") {
  const keys = JSON.parse(readFileSync(KEYS, "utf8")), gaps = (s) => (s.match(/\{\d\}/g) || []).sort().join("");
  let bad = 0;
  for (const f of readdirSync(join(ROOT, "proto/lang")).filter((f) => f !== "en.json")) {
    const lang = f.replace(".json", ""), d = JSON.parse(readFileSync(join(ROOT, "proto/lang", f), "utf8"));
    const missing = keys.filter((k) => !d[k]), wrong = keys.filter((k) => d[k] && gaps(k) !== gaps(d[k]));
    const { seen, errors } = await walk(lang);
    const shown = [...seen].filter((s) => !keepable(s));
    const problems = [missing.length && `${missing.length} untranslated: ${missing.slice(0, 6).map((s) => JSON.stringify(s)).join(", ")}`,
      wrong.length && `${wrong.length} with different {0} gaps: ${wrong.slice(0, 4).map((s) => JSON.stringify(s)).join(", ")}`,
      shown.length && `${shown.length} English strings on screen: ${shown.slice(0, 8).map((s) => JSON.stringify(s)).join(", ")}`,
      errors.length && `page errors: ${errors.join(" | ")}`].filter(Boolean);
    console.log(`${lang.padEnd(8)} ${problems.length ? "FAIL\n  " + problems.join("\n  ") : `ok (${keys.length} strings)`}`);
    if (problems.length) bad++;
  }
  if (bad) process.exitCode = 1;
} else console.log("usage: node scripts/i18n.mjs extract|check");
server.close();

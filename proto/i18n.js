// Languages. English is both the source and the key: each lang-xx.js maps English text to its translation, so anything
// not yet translated simply stays English. tx() is for text drawn on the canvas, typed out in dialogue or measured
// (camp signs); every other text node and label on screen is translated as it appears (watch()).
import es from "./lang-es.js";
import fr from "./lang-fr.js";
import de from "./lang-de.js";
import pt from "./lang-pt.js";

export const LANGS = { en: "English", es: "Español", fr: "Français", de: "Deutsch", pt: "Português" };
const DICTS = { es, fr, de, pt };
const pick = () => {
  let s; try { s = localStorage.getItem("gw.lang"); } catch {}
  if (s && LANGS[s]) return s;
  const n = (navigator.languages?.[0] || navigator.language || "en").slice(0, 2).toLowerCase(); // the phone's language, if we have it
  return LANGS[n] ? n : "en";
};
export const lang = pick();
export function setLang(l) { try { localStorage.setItem("gw.lang", l); } catch {} location.reload(); } // the save is untouched

const D = DICTS[lang] || {};
// keys with {0}, {1}… match text with anything in those places ("Amber Memories · {0}"); the parts are translated too
const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
const PATS = Object.keys(D).filter((k) => /\{\d\}/.test(k)).map((k) => [new RegExp("^" + esc(k).replace(/\{(\d)\}/g, "(.+?)") + "$"), D[k]]);
const memo = new Map();
function one(s) {
  if (D[s] != null) return D[s];
  for (const [re, to] of PATS) { const m = s.match(re); if (m) return to.replace(/\{(\d)\}/g, (_, i) => one(m[+i + 1])); }
  return s;
}
// translate a string that may hold tags: the whole thing if it's a known line, else each run of text between tags
export function tx(s) {
  if (lang === "en" || typeof s !== "string" || !/[A-Za-z]/.test(s)) return s;
  let out = memo.get(s); if (out != null) return out;
  const core = (p) => p.replace(/^(\s*)([\s\S]*?)(\s*)$/, (m, a, b, c) => (b ? a + one(b) : m));
  out = D[s.trim()] != null ? core(s) : s.split(/(<[^>]*>)/).map((p) => (p.startsWith("<") ? p : core(p))).join("");
  if (memo.size > 4000) memo.clear(); memo.set(s, out); return out;
}

// translate everything already in root, then whatever is added or changed later; [data-noi18n] opts out (typed dialogue)
const ATTRS = ["aria-label", "title", "placeholder"];
export function watch(root = document.body) {
  document.documentElement.lang = lang;
  if (lang === "en") return;
  const skip = (el) => !el || el.closest("[data-noi18n], script, style");
  const attrs = (el) => { for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const w = tx(v); if (w !== v) el.setAttribute(a, w); } } };
  const fix = (n) => {
    if (n.nodeType === 3) { if (!skip(n.parentElement)) { const v = n.nodeValue, w = tx(v); if (w !== v) n.nodeValue = w; } return; }
    if (n.nodeType !== 1 || skip(n)) return;
    attrs(n); for (const c of n.childNodes) fix(c);
  };
  fix(root);
  new MutationObserver((ms) => { for (const m of ms) {
    if (m.type === "attributes") { if (!skip(m.target)) attrs(m.target); }
    else if (m.type === "characterData") fix(m.target);
    else m.addedNodes.forEach(fix);
  } }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

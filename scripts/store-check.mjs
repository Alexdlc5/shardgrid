// App Store listing gate: every docs/store/listing.<locale>.json fits Apple's limits and the set is complete.
//   node scripts/store-check.mjs        exit 1 on any problem
// Limits from App Store Connect help (platform-version-information, app-information), read 2026-10-18:
// name 30, subtitle 30, promotional_text 170, keywords 100 BYTES (UTF-8), description 4000, whats_new 4000.
import { readdirSync, readFileSync, existsSync } from "node:fs";
const DIR = "docs/store", LIMITS = { name: 30, subtitle: 30, promotional_text: 170, description: 4000, whats_new: 4000 };
const LOCALES = ["en-US", "de-DE", "es-ES", "pt-BR", "ja", "ko", "zh-Hans", "hi"];
let bad = 0;
const say = (s) => { console.log(s); bad++; };
const files = readdirSync(DIR).filter((f) => /^listing\..+\.json$/.test(f));
const seen = new Set();
for (const f of files) {
  const d = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")); seen.add(d.locale);
  for (const [k, max] of Object.entries(LIMITS)) { const v = d[k] ?? ""; if ([...v].length > max) say(`${f}: ${k} is ${[...v].length} chars (max ${max})`); if (!v && k !== "whats_new") say(`${f}: ${k} is empty`); }
  const kb = Buffer.byteLength(d.keywords || "", "utf8"); if (kb > 100) say(`${f}: keywords are ${kb} bytes (max 100)`);
  // Apple's "each greater than two characters" is about Latin words; a 2-character Chinese/Japanese/Korean keyword (方块, 拼图) is a whole word
  for (const w of (d.keywords || "").split(",")) { const t = w.trim(); if (t.length && t.length <= 2 && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(t)) say(`${f}: keyword "${w}" is 2 chars or fewer`); }
  if (/glimmerwood/i.test(d.keywords || "")) say(`${f}: keywords repeat the app name`);
  if (/<[a-z]/i.test(d.description || "")) say(`${f}: description contains HTML`);
  for (const k of ["support_url", "privacy_policy_url"]) if (!/^https?:\/\//.test(d[k] || "")) say(`${f}: ${k} must be a full URL`);
}
for (const l of LOCALES) if (!seen.has(l)) say(`missing listing for ${l}`);
const shots = existsSync(`${DIR}/shots`) ? readdirSync(`${DIR}/shots`).filter((f) => f.endsWith(".png")).length : 0;
if (shots < 1 || shots > 10) say(`${shots} screenshots (Apple: 1 to 10)`);
console.log(bad ? `${bad} problem(s)` : `ok: ${files.length} listings, ${shots} screenshots`);
process.exit(bad ? 1 : 0);

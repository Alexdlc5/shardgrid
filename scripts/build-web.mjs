// Assemble www/ (the app's web bundle) from proto/ and the shared config. Offline-ready: fonts are bundled.
import { mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

const out = "www";
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/fonts`, { recursive: true });
for (const f of readdirSync("proto").filter((f) => f.endsWith(".js"))) copyFileSync(`proto/${f}`, `${out}/${f}`);
copyFileSync("sim/generator.json", `${out}/generator.json`);
const weights = [400, 600, 700];
for (const w of weights) copyFileSync(`node_modules/@fontsource/fredoka/files/fredoka-latin-${w}-normal.woff2`, `${out}/fonts/fredoka-${w}.woff2`);

let html = readFileSync("proto/index.html", "utf8");
const font = weights.map((w) => `@font-face { font-family: Fredoka; font-weight: ${w}; font-display: swap; src: url(fonts/fredoka-${w}.woff2) format("woff2"); }`).join("\n");
html = html.replace(/<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, `<style>${font}</style>`);
if (html.includes("fonts.googleapis.com")) throw new Error("Google Fonts link not replaced");
if (!html.includes('"../sim/generator.json"')) throw new Error("config path not found");
html = html.replace('"../sim/generator.json"', '"./generator.json"');
writeFileSync(`${out}/index.html`, html);
// every relative import in the bundle must resolve, or the app boots to a blank screen on the phone
for (const f of readdirSync(out).filter((f) => /\.(js|html)$/.test(f)))
  for (const [, dep] of readFileSync(`${out}/${f}`, "utf8").matchAll(/from\s+"\.\/([^"]+)"/g))
    if (!existsSync(`${out}/${dep}`)) throw new Error(`${f} imports ./${dep}, which is not in ${out}/`);
console.log("www/ ready");

// Assemble www/ (the app's web bundle) from proto/ and the shared config. Offline-ready: fonts are bundled.
import { mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";

const out = "www";
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/fonts`, { recursive: true });
for (const f of readdirSync("proto").filter((f) => /\.(js|css)$/.test(f))) copyFileSync(`proto/${f}`, `${out}/${f}`);
copyFileSync("sim/generator.json", `${out}/generator.json`);
const weights = [400, 600, 700];
for (const w of weights) copyFileSync(`node_modules/@fontsource/fredoka/files/fredoka-latin-${w}-normal.woff2`, `${out}/fonts/fredoka-${w}.woff2`);

let html = readFileSync("proto/index.html", "utf8");
copyFileSync("node_modules/@fontsource/grandstander/files/grandstander-latin-700-normal.woff2", `${out}/fonts/grandstander-700.woff2`); // the hand-lettered display face
const font = weights.map((w) => `@font-face { font-family: Fredoka; font-weight: ${w}; font-display: swap; src: url(fonts/fredoka-${w}.woff2) format("woff2"); }`).join("\n") +
  `\n@font-face { font-family: Grandstander; font-weight: 700; font-display: swap; src: url(fonts/grandstander-700.woff2) format("woff2"); }`;
html = html.replace(/<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, `<style>${font}</style>`);
if (html.includes("fonts.googleapis.com")) throw new Error("Google Fonts link not replaced");
writeFileSync(`${out}/index.html`, html);
const main = readFileSync(`${out}/main.js`, "utf8");
if (!main.includes('"../sim/generator.json"')) throw new Error("config path not found");
writeFileSync(`${out}/main.js`, main.replace('"../sim/generator.json"', '"./generator.json"'));
// version shown in Options: MARKETING_VERSION from the Xcode project plus the CI build number (GW_BUILD)
// GW_APPSTORE=1 (the ios workflow's "appstore" input) turns test ads off; every other build keeps them
const appstore = process.env.GW_APPSTORE === "1";
const ver = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8").match(/MARKETING_VERSION = ([\d.]+);/)?.[1] || "0";
let plat = readFileSync(`${out}/platform.js`, "utf8");
const swap = (a, b) => { if (!plat.includes(a)) throw new Error(`platform.js: "${a}" not found`); plat = plat.replace(a, b); };
swap('export const VERSION = "dev";', `export const VERSION = ${JSON.stringify(`${ver} (${process.env.GW_BUILD || "dev"})${appstore ? "" : " · test ads"}`)};`);
if (appstore) swap("testAds: true,", "testAds: false,");
writeFileSync(`${out}/platform.js`, plat);
// every relative import in the bundle must resolve, or the app boots to a blank screen on the phone
for (const f of readdirSync(out).filter((f) => /\.(js|html)$/.test(f)))
  for (const [, dep] of readFileSync(`${out}/${f}`, "utf8").matchAll(/(?:from\s+|src=|href=)"(?:\.\/)?([\w.-]+\.(?:js|css))"/g))
    if (!existsSync(`${out}/${dep}`)) throw new Error(`${f} imports ./${dep}, which is not in ${out}/`);
console.log("www/ ready");

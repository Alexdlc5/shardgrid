// Render sheet of every pet, plain and in each clothing item: node scripts/render-pets.mjs out.png
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pet, PET_KINDS, PET_WEAR_SLOT } from "../proto/art.js";
const S = 120, cols = [null, ...Object.keys(PET_WEAR_SLOT)], rows = [...PET_KINDS, "sleep"];
const cells = rows.flatMap((k, y) => cols.map((w, x) => (k === "sleep" ? pet(PET_KINDS[x % PET_KINDS.length], S, { sleep: true }) : pet(k, S, w ? { [PET_WEAR_SLOT[w]]: w } : {}))
  .replace(/^<svg /, `<svg x="${x * S}" y="${y * S + 24}" `)));
const head = cols.map((w, x) => `<text x="${x * S + S / 2}" y="17" font-size="14" text-anchor="middle" fill="#e8d6aa" font-family="sans-serif">${w || "plain"}</text>`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols.length * S}" height="${rows.length * S + 24}"><rect width="100%" height="100%" fill="#2a3029"/>${head}${cells.join("")}</svg>`;
writeFileSync(process.argv[2] || "pets.png", new Resvg(svg).render().asPng()); console.log("ok");

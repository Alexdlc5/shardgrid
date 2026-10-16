// Render the characters for visual review: node scripts/render-art.mjs out.png
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { dibble, puddock, granny, bidder } from "../proto/art.js";
const cells = [dibble(200), dibble(200, { fur: "snow", hat: "mushroom", scarf: "#c8553d", lantern: "crystal" }), granny(200), puddock(200), bidder(200)];
const body = cells.map((c, k) => c.replace(/^<svg /, `<svg x="${k * 200}" y="0" `)).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cells.length * 200}" height="200"><rect width="100%" height="100%" fill="#2a3029"/>${body}</svg>`;
writeFileSync(process.argv[2] || "art.png", new Resvg(svg).render().asPng()); console.log("ok");

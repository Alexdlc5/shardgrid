// Render proto/paint.js's style sample to a PNG for review: node scripts/render-sample.mjs out.png
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { sampleScene } from "../proto/paint.js";
const svg = sampleScene().replace('<svg viewBox="0 0 400 500" width="100%"', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500"');
writeFileSync(process.argv[2] || "assets/style-sample.png", new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng());
console.log("ok");

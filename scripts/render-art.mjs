// Render a strip of characters for visual review: node scripts/render-art.mjs out.png
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { dibble, puddock, lookItem } from "../proto/art.js";
const looks = [{}, { fur: "snow", hat: "mushroom", scarf: "#c8553d", lantern: "crystal" }, { fur: "slate", hat: "miner", lantern: "jar" }, { fur: "sand", hat: "beanie", scarf: "#5f8fd0", lantern: "paper" }, { fur: "rosewood", hat: "flowers" }];
const cells = [...looks.map((l) => dibble(200, l)), puddock(200)];
const inner = (s) => s.replace(/^<svg[^>]*viewBox="([^"]*)"[^>]*>/, '<svg viewBox="$1" ').replace(/^<svg viewBox="([^"]*)" /, (m, vb) => `<svg viewBox="${vb}" `);
const body = cells.map((c, k) => c.replace(/^<svg /, `<svg x="${k * 200}" y="0" `)).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cells.length * 200}" height="200"><rect width="100%" height="100%" fill="#2a3029"/>${body}</svg>`;
writeFileSync(process.argv[2] || "art.png", new Resvg(svg).render().asPng()); console.log("ok");

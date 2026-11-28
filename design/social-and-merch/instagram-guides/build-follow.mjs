// "Who should we follow?" (Steve, 15th November 2026): an eye chart that reads WHO SHOULD WE FOLLOW?, with the 20/20 line asking people to tag
// accounts below. The goal is 2,020 eye care accounts followed, a play on 20/20. Builds the feed post (1080 x 1350) and a story (1080 x 1920),
// both at 2x. Run from the repo root: node design/social-and-merch/instagram-guides/build-follow.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", buff: "#D8B48A", mist: "#DCE3E6", slate: "#5A6672", paper: "#FBF8F2", line: "#C9D3D8" };
// Pale blue background (Steve, 15th November 2026, in place of navy).

const LINES = [
  ["WHO", 168, "20/200"],
  ["SHOULD", 118, "20/100"],
  ["WE", 92, "20/70"],
  ["FOLLOW?", 76, "20/50"],
  ["TAG THEM BELOW", 44, "20/20"],
];

function html(height) {
  const story = height > 1350;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Who should we follow?</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}</style></head><body>
<div style="width:1080px;height:${height}px;box-sizing:border-box;padding:${story ? "150px 80px 170px" : "80px"};background:${C.mist};display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;justify-content:space-between;align-items:center">
<p style="margin:0;font-family:Poppins;font-weight:600;font-size:24px;letter-spacing:0.24em;color:${C.navy}">EYE CARE JOBS</p>
<p style="margin:0;font-family:'DM Serif Display';font-size:34px;color:${C.chestnut}">Help us see 20/20</p>
</div>
<div style="background:${C.paper};border:2px solid ${C.line};border-radius:22px;padding:56px 48px 44px;display:flex;flex-direction:column;gap:${story ? 34 : 22}px">
${(story ? LINES.map((l, i) => (i === LINES.length - 1 ? ["REPLY WITH NAMES", l[1], l[2]] : l)) : LINES).map(([t, s, n], i) => `<div style="display:flex;align-items:center;gap:24px">
<span style="flex:1;text-align:center;font-family:Poppins;font-weight:600;font-size:${s}px;line-height:1;letter-spacing:${i === LINES.length - 1 ? "0.18em" : "0.12em"};color:${i === LINES.length - 1 ? C.chestnut : C.navy}">${t}</span>
<span style="width:96px;text-align:right;font-family:Poppins;font-size:22px;color:${i === LINES.length - 1 ? C.chestnut : C.slate}">${n}</span></div>`).join("")}
<div style="height:3px;background:${C.chestnut};margin:4px 120px 0;border-radius:2px"></div>
</div>
<p style="margin:0;font-family:Poppins;font-size:36px;line-height:1.35;color:${C.navy}">Clinics, opticians, optometrists, labs and suppliers. We want to follow 2,020 eye care accounts across Canada. ${story ? "Reply to this story with who we should follow." : "Tag them below."}</p>
<div style="display:flex;align-items:center;gap:16px">
<img src="${brand("kestrel-k-mark.svg")}" alt="" style="width:56px;height:56px;display:block">
<p style="margin:0;font-family:Poppins;font-size:24px;letter-spacing:0.06em;color:${C.navy}">eyecarejobs.ca</p>
</div></div></body></html>`;
}

const browser = await chromium.launch();
for (const [name, height] of [["x01-who-should-we-follow", 1350], ["x01-who-should-we-follow-story", 1920]]) {
  const page = await browser.newPage({ viewport: { width: 1080, height }, deviceScaleFactor: 2 });
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, html(height));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  await page.close();
}
await browser.close();
console.log("Built the follow post and story");

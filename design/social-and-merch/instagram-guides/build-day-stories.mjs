// Stories for Small Business Saturday (28th November 2026) and Maple Monday (30th November 2026), Steve, 28th November 2026.
// 5 still images, 1080 x 1920, in the same style as the Story polls. Stickers (question, poll, link) are added in Instagram, so each
// image leaves clear space for them. Words stay out of the top 250 and bottom 340 pixels, where Instagram puts its own buttons.
// No clinic is named. Independent clinics are celebrated without knocking corporate groups, which post on Kestrel too.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-day-stories.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672", buff: "#D8B48A", mist: "#DCE3E6" };
const THEME = {
  cream: { bg: C.cream, fg: C.navy, accent: C.chestnut, soft: C.slate, art: C.navy, tile: C.paper, edge: C.line, k: "kestrel-k-mark.svg" },
  navy: { bg: C.navy, fg: C.cream, accent: C.buff, soft: C.mist, art: C.cream, tile: "#24365A", edge: "#34456A", k: "kestrel-k-mark-reversed.svg" },
  chestnut: { bg: C.chestnut, fg: C.cream, accent: C.navy, soft: C.cream, art: C.cream, tile: "#B05E39", edge: "#BE7150", k: "kestrel-k-mark-reversed.svg" },
};
const ICON = {
  shop: `<path d="M3.5 9.5V20h17V9.5"/><path d="M2.5 9.5 4.5 4h15l2 5.5"/><path d="M2.5 9.5q1.6 2 3.2 0 1.6 2 3.2 0 1.6 2 3.1 0 1.6 2 3.2 0 1.6 2 3.2 0 1.6 2 3.1 0"/><path d="M10 20v-5.5h4V20"/>`,
  eye: `<path d="M2 12Q12 3 22 12Q12 21 2 12Z"/><circle cx="12" cy="12" r="3.2"/>`,
};
const svg = (k, size, stroke) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

const STORIES = [
  { file: "story-sbs-1-small-businesses", theme: "cream", kicker: "SMALL BUSINESS SATURDAY", head: ["Most independent eye clinics", "are small businesses."],
    line: "A few people, and patients who know them by name.", art: ["shop", "eye"] },
  { file: "story-sbs-2-question", theme: "navy", kicker: "SMALL BUSINESS SATURDAY", head: ["What makes your", "local eye clinic great?"],
    line: "Tell us below. We&apos;ll share the best answers, without clinic names.", sticker: "Question sticker" },
  { file: "story-sbs-3-pay", theme: "chestnut", kicker: "SMALL BUSINESS SATURDAY", head: ["Small clinics want", "the same great people."],
    line: "Showing the pay up front helps them stand out. Pre launch is open for clinics.", pay: true, sticker: "Link sticker" },
  { file: "story-maple-1-made-for-canada", theme: "cream", kicker: "MAPLE MONDAY", head: ["A job board made for", "eye care in Canada."],
    line: "Every job on Kestrel is in Canada, and your profile is stored in Canada.", logo: true, sticker: "Link sticker" },
  { file: "story-maple-2-poll", theme: "navy", kicker: "MAPLE MONDAY", head: ["Shopping Canadian", "this Maple Monday?"],
    line: "Your local eye clinic is a good place to start: glasses, contacts and eye exams, from people in your community.", sticker: "Poll sticker" },
];

function page(p) {
  const th = THEME[p.theme];
  let art = "";
  if (p.art) art = `<div class="pair">${p.art.map((a) => `<div class="tile" style="background:${th.tile};border-color:${th.edge}">${svg(a, 240, th.art)}</div>`).join("")}</div>`;
  else if (p.pay) art = `<div class="paycard"><p class="pt">Optician</p><p class="pp">$27 to $33 an hour</p></div>`;
  else if (p.logo) art = `<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:760px;display:block;margin:0 auto">`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Story</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${th.bg}}
.abs{position:absolute}
.pair{display:flex;gap:40px;justify-content:center}
.tile{width:360px;height:360px;border-radius:30px;border:3px solid;display:flex;align-items:center;justify-content:center}
.paycard{width:760px;margin:0 auto;padding:50px 56px;border-radius:24px;background:${C.paper};border:3px solid ${C.line};box-sizing:border-box}
.pt{font-family:'DM Serif Display';font-size:76px;color:${C.navy}}
.pp{display:inline-block;margin-top:26px;padding:14px 34px;border-radius:999px;background:${C.navy};font-family:Poppins;font-weight:600;font-size:44px;color:${C.cream}}
</style></head><body><div id="f">
<div class="abs" style="left:80px;right:80px;top:290px">
<p style="font-family:Poppins;font-weight:600;font-size:30px;letter-spacing:.24em;color:${th.accent}">${p.kicker}</p>
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1.04;color:${th.fg};margin-top:30px">${p.head[0]}<br><span style="color:${th.accent}">${p.head[1]}</span></p>
<p style="font-family:Poppins;font-size:40px;line-height:1.4;color:${th.soft};margin-top:36px">${p.line}</p>
</div>
<div class="abs" style="left:80px;right:80px;top:${p.art ? 940 : 1000}px">${art}</div>
<div class="abs" style="left:80px;bottom:350px;display:flex;align-items:center;gap:22px"><img src="${brand(th.k)}" alt="" style="height:52px"><span style="font-family:Poppins;font-size:32px;letter-spacing:.06em;color:${th.soft}">eyecarejobs.ca</span></div>
</div></body></html>`;
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const p of STORIES) {
  const file = join(OUT, `${p.file}.html`);
  writeFileSync(file, page(p));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForTimeout(200);
  await tab.locator("#f").screenshot({ path: join(OUT, `${p.file}.png`) });
  console.log(`Built ${p.file}.png`);
}
await browser.close();

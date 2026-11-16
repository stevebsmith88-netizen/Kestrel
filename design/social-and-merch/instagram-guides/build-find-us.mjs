// "Find us" post (Steve, 16th November 2026): the 4 places Kestrel is online, as tilted icon tiles on Cream.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-find-us.mjs
// The icons are the platforms' own marks redrawn as line icons in the website footer's style (components/Icon.tsx:
// 24 pixel grid, round ends, 1.9 stroke), so the post matches the site. Laid out in the same frame as the guide cards.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", line: "#E3D9C8", slate: "#5A6672" };

// Same drawing rules as components/Icon.tsx. Instagram and LinkedIn are copied from it; Facebook and Reddit are new, drawn to match.
const ICONS = {
  linkedin: `<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16.5M8 7.6v.1"/><path d="M11.5 16.5v-6M11.5 13a2.5 2.5 0 0 1 5 0v3.5"/>`,
  facebook: `<circle cx="12" cy="12" r="8.5"/><path d="M13 20.4V11a2.6 2.6 0 0 1 2.6-2.6h1.2"/><path d="M10 13.4h6"/>`,
  instagram: `<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.3 6.7v.1"/>`,
  reddit: `<ellipse cx="12" cy="14.2" rx="8" ry="5.6"/><path d="M9.2 13.6v.1M14.8 13.6v.1"/><path d="M9.4 16.6c1.6 1 3.6 1 5.2 0"/><path d="M12 8.6 13.1 4.2l3.6.9"/><circle cx="18.2" cy="5.4" r="1.4"/><circle cx="4.9" cy="10.4" r="1.6"/><circle cx="19.1" cy="10.4" r="1.6"/>`,
};

// Tile colours for a Cream post, and each tile's tilt (5 to 9 degrees either way, no 2 neighbours the same way).
const TILES = [
  { key: "linkedin", name: "LinkedIn", handle: "Our company page", bg: C.navy, fg: C.cream, edge: "none", tilt: -7 },
  { key: "facebook", name: "Facebook", handle: "kestreleye26", bg: C.chestnut, fg: C.cream, edge: "none", tilt: 6 },
  { key: "instagram", name: "Instagram", handle: "@kestreleye26", bg: C.paper, fg: C.navy, edge: `inset 0 0 0 3px ${C.line}`, tilt: 8 },
  { key: "reddit", name: "Reddit", handle: "r/EyeCareJobsCanada", bg: C.buff, fg: C.navy, edge: "none", tilt: -5 },
];

const tile = (t, size) => `
<div style="width:${size}px;height:${size}px;flex:none;border-radius:${Math.round(size * 0.2)}px;background:${t.bg};transform:rotate(${t.tilt}deg);display:flex;align-items:center;justify-content:center;box-shadow:${t.edge === "none" ? "" : t.edge + ","} 0 14px 28px rgba(27,43,75,.18), 0 3px 8px rgba(27,43,75,.10)">
  <svg viewBox="0 0 24 24" width="${Math.round(size * 0.5)}" height="${Math.round(size * 0.5)}" fill="none" stroke="${t.fg}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.key]}</svg>
</div>`;

// The same frame as the guide cards (build.mjs): label top left, serif tag top right, headline, line, K mark and address bottom left.
const page = (middle) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Find us here</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}</style></head><body>
<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;background:${C.cream};display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;justify-content:space-between;align-items:center">
<p style="margin:0;font-family:Poppins;font-weight:600;font-size:24px;letter-spacing:0.24em;color:${C.chestnut}">EYE CARE JOBS</p>
<p style="margin:0;font-family:'DM Serif Display';font-size:34px;color:${C.chestnut}">Find us</p>
</div>
${middle}
<div style="display:flex;align-items:center;gap:16px">
<img src="${brand("kestrel-k-mark.svg")}" alt="" style="width:56px;height:56px;display:block">
<p style="margin:0;font-family:Poppins;font-size:24px;letter-spacing:0.06em;color:${C.slate}">eyecarejobs.ca</p>
</div></div></body></html>`;

const headline = `<p style="margin:0;font-family:'DM Serif Display';font-size:112px;line-height:1;color:${C.navy}">Find us here.<br><span style="color:${C.chestnut}">Before we open.</span></p>`;

// Version A: a row of tilted tiles where the guide cards have their line drawing, then the handles listed like the checklist card.
const listA = `<ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:18px">${TILES.map((t) => `<li style="display:flex;gap:24px;align-items:baseline;font-family:Poppins;font-size:36px;line-height:1.3;color:${C.navy}"><span style="font-family:'DM Serif Display';font-size:40px;color:${C.chestnut};min-width:190px">${t.name}</span>${t.handle}</li>`).join("")}</ol>`;
const versionA = `<div style="display:flex;flex-direction:column;gap:56px">
<div style="display:flex;gap:34px;padding-left:6px">${TILES.map((t) => tile(t, 130)).join("")}</div>
${headline}</div>
${listA}`;

// Version B: the tiles larger, as the centrepiece, and the handles in 1 short line under the headline.
const versionB = `<div style="display:flex;flex-direction:column;gap:44px">${headline}
<p style="margin:0;font-family:Poppins;font-size:34px;line-height:1.4;color:${C.slate}">Facebook and Instagram as kestreleye26, our LinkedIn company page, and our community on Reddit, r/EyeCareJobsCanada.</p></div>
<div style="display:flex;gap:44px;justify-content:center">${TILES.map((t) => tile(t, 185)).join("")}</div>`;

const VERSIONS = [
  { file: "find-us-a-grid", body: versionA },
  { file: "find-us-b-row", body: versionB },
];

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
for (const v of VERSIONS) {
  const file = join(OUT, `${v.file}.html`);
  writeFileSync(file, page(v.body));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: join(OUT, `${v.file}.png`) });
}
await browser.close();
console.log(`Built ${VERSIONS.length} find us posts in ${OUT}`);

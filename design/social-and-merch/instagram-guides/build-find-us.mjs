// "Find us" post (Steve, 16th November 2026): the 4 places Kestrel is online, as tilted icon tiles on Cream.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-find-us.mjs
// The icons are the platforms' own marks redrawn as line icons in the website footer's style (components/Icon.tsx:
// 24 pixel grid, round ends, 1.9 stroke), so the post matches the site. The wordmark and skyline are used as they are.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const skyline = pathToFileURL(join(ROOT, "public/skyline.png")).href;
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
  { key: "linkedin", name: "LinkedIn", handle: "Company page", bg: C.navy, fg: C.cream, edge: "none", tilt: -7 },
  { key: "facebook", name: "Facebook", handle: "kestreleye26", bg: C.chestnut, fg: C.cream, edge: "none", tilt: 6 },
  { key: "instagram", name: "Instagram", handle: "@kestreleye26", bg: C.paper, fg: C.navy, edge: `inset 0 0 0 3px ${C.line}`, tilt: 8 },
  { key: "reddit", name: "Reddit", handle: "r/EyeCareJobsCanada", bg: C.buff, fg: C.navy, edge: "none", tilt: -5 },
];

const tile = (t, size, x, y, labels = true) => `
<div style="position:absolute;left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;text-align:center">
  <div style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.2)}px;background:${t.bg};transform:rotate(${t.tilt}deg);display:flex;align-items:center;justify-content:center;box-shadow:${t.edge === "none" ? "" : t.edge + ","} 0 18px 34px rgba(27,43,75,.20), 0 4px 10px rgba(27,43,75,.12)">
    <svg viewBox="0 0 24 24" width="${Math.round(size * 0.5)}" height="${Math.round(size * 0.5)}" fill="none" stroke="${t.fg}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.key]}</svg>
  </div>
  ${labels ? `<p style="margin:30px -60px 0;font-family:Poppins;font-weight:600;font-size:30px;color:${C.navy}">${t.name}</p>
  <p style="margin:4px -80px 0;font-family:Poppins;font-size:26px;color:${C.slate}">${t.handle}</p>` : ""}
</div>`;

const head = `
<div style="position:absolute;left:80px;top:96px;width:90px;height:8px;background:${C.chestnut}"></div>
<p style="position:absolute;left:80px;top:128px;margin:0;font-family:'DM Serif Display';font-size:100px;line-height:1;color:${C.navy}">Find us here.</p>
<p style="position:absolute;left:80px;top:250px;width:880px;margin:0;font-family:Poppins;font-size:32px;line-height:1.4;color:${C.slate}">Follow along before the job board opens in early 2027.</p>`;

const foot = `
<img src="${skyline}" alt="" style="position:absolute;left:0;bottom:0;width:1080px;display:block">
<img src="${brand("kestrel-wordmark.svg")}" alt="" style="position:absolute;left:80px;top:1018px;width:300px;display:block">
<p style="position:absolute;right:80px;top:1040px;margin:0;font-family:Poppins;font-weight:600;font-size:30px;letter-spacing:0.04em;color:${C.chestnut}">eyecarejobs.ca</p>`;

const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
html,body{margin:0}</style></head><body>
<div style="width:1080px;height:1350px;position:relative;overflow:hidden;background:${C.cream}">${head}${body}${foot}</div></body></html>`;

// Version A: a 2 by 2 grid of 180 pixel tiles, centres at x 350 and 730, y 450 and 775.
const gridA = TILES.map((t, i) => tile(t, 180, i % 2 ? 730 : 350, i < 2 ? 450 : 775)).join("");

// Version B: the 4 tiles in a loose row, staggered up and down like cards dropped on a counter, names in 1 line underneath.
const rowB = TILES.map((t, i) => tile(t, 190, 180 + i * 240, i % 2 ? 640 : 560, false)).join("") + `
<div style="position:absolute;left:80px;right:80px;top:790px;display:grid;grid-template-columns:repeat(2,1fr);gap:18px 40px;font-family:Poppins;font-size:28px;color:${C.slate}">
${TILES.map((t) => `<p style="margin:0"><b style="font-weight:600;color:${C.navy}">${t.name}</b>&nbsp; ${t.handle}</p>`).join("")}
</div>`;

const VERSIONS = [
  { file: "find-us-a-grid", body: gridA },
  { file: "find-us-b-row", body: rowB },
];

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
for (const v of VERSIONS) {
  const file = join(OUT, `${v.file}.html`);
  writeFileSync(file, page("Find us here", v.body));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: join(OUT, `${v.file}.png`) });
}
await browser.close();
console.log(`Built ${VERSIONS.length} find us posts in ${OUT}`);

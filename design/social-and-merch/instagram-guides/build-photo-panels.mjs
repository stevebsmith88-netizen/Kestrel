// Photo posts in the same family (Steve, 13th November 2026: "the odd stock photo to break it up").
// Run from the repo root: node design/social-and-merch/instagram-guides/build-photo-panels.mjs
// Each PNG is a full 1080 x 1350 post (at 2x) that is see-through at the top. In Canva the stock photo sits underneath and fills
// the top 780 pixels, so the words are the brand's own fonts while the photo stays a real, swappable Canva image.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", chestnutD: "#8C4024", cream: "#F7F1E6", buff: "#D8B48A", mist: "#DCE3E6", slate: "#5A6672" };
export const PHOTO_HEIGHT = 780;

const PANELS = [
  { file: "p01-every-job-shows-its-pay", bg: C.navy, fg: C.cream, accent: C.buff, line: C.mist, label: C.buff, k: "kestrel-k-mark-reversed.svg",
    head: "Every job", head2: "shows its pay.", sub: "No guessing and no \"competitive salary\". The range is on every post." },
  { file: "p02-built-for-eye-care", bg: C.chestnut, fg: C.cream, accent: C.buff, line: C.cream, label: C.cream, k: "kestrel-k-mark-reversed.svg",
    head: "Built for eye care.", head2: "Only eye care.", sub: "Optometrists, opticians, assistants, technicians, managers and front desk teams." },
  { file: "p03-opening-soon", bg: C.cream, fg: C.navy, accent: C.chestnut, line: C.slate, label: C.chestnut, k: "kestrel-k-mark.svg",
    head: "Opening soon.", head2: "Join the waitlist.", sub: "Link in bio. Be first to see eye care jobs across Canada." },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");

const html = (p) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(p.head)}</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
html,body{margin:0;background:transparent}</style></head><body>
<div style="width:1080px;height:1350px;position:relative">
<div style="position:absolute;left:0;right:0;bottom:0;height:${1350 - PHOTO_HEIGHT}px;box-sizing:border-box;padding:56px 80px 64px;background:${p.bg};display:flex;flex-direction:column;justify-content:space-between">
<div>
<p style="margin:0 0 22px;font-family:Poppins;font-weight:600;font-size:24px;letter-spacing:0.24em;color:${p.label}">EYE CARE JOBS</p>
<p style="margin:0;font-family:'DM Serif Display';font-size:96px;line-height:1;color:${p.fg}">${esc(p.head)}${p.head2 ? `<br><span style="color:${p.accent}">${esc(p.head2)}</span>` : ""}</p>
</div>
<p style="margin:0;font-family:Poppins;font-size:32px;line-height:1.35;color:${p.line}">${esc(p.sub)}</p>
<div style="display:flex;align-items:center;gap:16px">
<img src="${brand(p.k)}" alt="" style="width:56px;height:56px;display:block">
<p style="margin:0;font-family:Poppins;font-size:24px;letter-spacing:0.06em;color:${p.line}">eyecarejobs.ca</p>
</div></div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
for (const p of PANELS) {
  const file = join(OUT, `${p.file}.html`);
  writeFileSync(file, html(p));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${p.file}.png`), omitBackground: true });
}
await browser.close();
console.log(`Built ${PANELS.length} photo panels in ${OUT}`);

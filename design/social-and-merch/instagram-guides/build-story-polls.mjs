// "Quick poll" Instagram Stories (Steve, 22nd November 2026): 6 still images, 1080 x 1920, with clear space for Instagram's poll sticker,
// which has to be added in the app. 3 colours (Cream, Navy, Chestnut) so a run of Stories doesn't look the same. Line drawings in the
// website's icon style. Words stay out of the top 250 and bottom 340 pixels, where Instagram puts its own buttons.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-story-polls.mjs
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
  round: `<circle cx="6.5" cy="13" r="4"/><circle cx="17.5" cy="13" r="4"/><path d="M10.5 12.5q1.5-1.2 3 0M2.5 12 1.5 9M21.5 12l1-3"/>`,
  square: `<rect x="2.5" y="9.5" width="8" height="7" rx="1.2"/><rect x="13.5" y="9.5" width="8" height="7" rx="1.2"/><path d="M10.5 12q1.5-1.2 3 0M2.5 11 1.5 8.5M21.5 11l1-2.5"/>`,
  puff: `<path d="M1.5 9.5h5.5l2 1.6v1.8l-2 1.6H1.5"/><path d="M10.6 10.4q.8 1.6 0 3.2M12.6 9.4q1.3 2.6 0 5.2"/><path d="M14.8 12Q18.6 6.8 22.4 12Q18.6 17.2 14.8 12Z"/><circle cx="18.6" cy="12" r="1.5"/>`,
  drops: `<path d="M9 3.5h6M10 3.5v3h4v-3"/><path d="M10.5 6.5h3v6.5a1.5 1.5 0 0 1-3 0Z"/><path d="M12 16.5c-1.3 1.6-2 2.7-2 3.5a2 2 0 0 0 4 0c0-.8-.7-1.9-2-3.5Z"/>`,
  people: `<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M15 14.5c3 0 5.5 1.6 5.5 4.5"/>`,
  laptop: `<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/><path d="M7.5 9h9M7.5 12h6"/>`,
  glasses: `<circle cx="6.5" cy="13" r="4"/><circle cx="17.5" cy="13" r="4"/><path d="M10.5 12.5q1.5-1.2 3 0M2.5 12 4 8.5M21.5 12 20 8.5"/>`,
  lens: `<path d="M3.5 15Q12 2.5 20.5 15"/><path d="M3.5 15q8.5 3 17 0"/><path d="M8 10.5q1.6-2.4 4-3"/>`,
};
const POLLS = [
  { file: "story-poll-1-better-1-or-2", theme: "cream", head: ["Better 1...", "or 2?"], line: "You know the question. Now it&apos;s your turn.", lenses: true, opts: ["1", "2"] },
  { file: "story-poll-2-round-or-square", theme: "navy", head: ["Round", "or square?"], line: "Your favourite frame shape to wear, or to fit.", art: ["round", "square"], opts: ["Round", "Square"] },
  { file: "story-poll-3-puff-or-drops", theme: "chestnut", head: ["Which is worse:", "the puff or the drops?"], line: "Asking for every patient, ever.", art: ["puff", "drops"], opts: ["The puff", "The drops"] },
  { file: "story-poll-4-apply-without-pay", theme: "cream", head: ["Would you apply", "if the pay wasn&apos;t shown?"], line: "Be honest.", pay: true, opts: ["Yes", "No"] },
  { file: "story-poll-5-where-staff-come-from", theme: "navy", head: ["Clinic owners:", "where do your best hires come from?"], line: "Tell us how your team found you.", art: ["people", "laptop"], opts: ["Word of mouth", "Job sites"] },
  { file: "story-poll-6-glasses-or-contacts", theme: "chestnut", head: ["Glasses", "or contacts?"], line: "What do you wear on a normal day?", art: ["glasses", "lens"], opts: ["Glasses", "Contacts"] },
];

const svg = (k, size, stroke) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

function page(p) {
  const th = THEME[p.theme];
  let art = "";
  if (p.lenses) art = `<div class="pair">${[1, 2].map((n) => `<div class="lensbox" style="border-color:${th.art}"><span>${n}</span></div>`).join("")}</div>`;
  else if (p.pay) art = `<div class="paycard" style="background:${C.paper};border-color:${C.line}"><p class="pt">Optician</p><p class="pp"><s>Pay: competitive</s></p><p class="pq" style="color:${C.chestnut}">?</p></div>`;
  else art = `<div class="pair">${p.art.map((a) => `<div class="tile" style="background:${th.tile};border-color:${th.edge}">${svg(a, 260, th.art)}</div>`).join("")}</div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Poll</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${th.bg}}
.abs{position:absolute}
.pair{display:flex;gap:40px;justify-content:center}
.tile{width:380px;height:380px;border-radius:30px;border:3px solid;display:flex;align-items:center;justify-content:center}
.lensbox{width:380px;height:380px;border-radius:50%;border:14px solid;display:flex;align-items:center;justify-content:center;background:${th.tile}}
.lensbox span{font-family:'DM Serif Display';font-size:200px;color:${th.fg}}
.paycard{width:760px;margin:0 auto;padding:50px 56px;border-radius:24px;border:3px solid;box-sizing:border-box}
.pt{font-family:'DM Serif Display';font-size:80px;color:${C.navy}}.pp{font-family:Arial,Helvetica,sans-serif;font-size:54px;color:#8A9099;margin-top:16px}
.pq{font-family:'DM Serif Display';font-size:140px;line-height:1;margin-top:10px}
</style></head><body><div id="f">
<div class="abs" style="left:80px;right:80px;top:290px">
<p style="font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:0.24em;color:${th.accent}">QUICK POLL</p>
<p style="margin-top:24px;font-family:'DM Serif Display';font-size:${(p.head[0] + p.head[1]).length > 28 ? 92 : 120}px;line-height:1.04;color:${th.fg}">${p.head[0]}<br><span style="color:${th.accent}">${p.head[1]}</span></p>
<p style="margin-top:26px;font-family:Poppins;font-size:40px;line-height:1.4;color:${th.soft}">${p.line}</p>
</div>
<div class="abs" style="left:0;right:0;top:${(p.head[0] + p.head[1]).length > 28 ? 860 : 800}px">${art}</div>
<div class="abs" style="left:80px;top:1500px;display:flex;align-items:center;gap:16px"><img src="${brand(th.k)}" alt="" style="width:56px;height:56px"><p style="font-family:Poppins;font-size:26px;letter-spacing:0.06em;color:${th.soft}">eyecarejobs.ca</p></div>
</div></body></html>`;
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const guide = [];
for (const p of POLLS) {
  const file = join(OUT, `${p.file}.html`);
  writeFileSync(file, page(p));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.locator("#f").screenshot({ path: join(OUT, `${p.file}.png`) });
  guide.push(`${p.file}.png: poll options "${p.opts.join('" and "')}"`);
}
await browser.close();
console.log(guide.join("\n"));

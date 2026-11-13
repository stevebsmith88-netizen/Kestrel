// Builds the Instagram posts for the blog guides in the "Things heard in clinic" style (Steve, 13th November 2026).
// Run from the repo root: node design/social-and-merch/instagram-guides/build.mjs
// Writes 1 HTML file and 1 PNG (2160 x 2700, a 1080 x 1350 post at 2x, like the Things heard set) per post into this folder.
// Fonts are the brand's own @fontsource files and the K is public/brand, used as it is. Nothing here is used by the website.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine, not a project dependency
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;

const C = { navy: "#1B2B4B", soft: "#2B3F5F", chestnut: "#A4502C", chestnutD: "#8C4024", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", mist: "#DCE3E6", slate: "#5A6672" };

// Simple line drawings, in the same hand as the Things heard set.
const ICON = {
  eye: (c, a) => `<svg viewBox="0 0 90 44" width="270" height="132" aria-hidden="true"><path d="M4 22 C24 2 66 2 86 22 C66 42 24 42 4 22 Z" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="45" cy="22" r="10" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="45" cy="22" r="3.5" fill="${a}"/></svg>`,
  question: (c, a) => `<svg viewBox="0 0 90 44" width="270" height="132" aria-hidden="true"><path d="M8 8 H62 a6 6 0 0 1 6 6 V28 a6 6 0 0 1 -6 6 H30 L18 42 V34 H8 a6 6 0 0 1 -6 -6 V14 a6 6 0 0 1 6 -6 Z" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/><text x="35" y="28" text-anchor="middle" font-family="DM Serif Display" font-size="18" fill="${a}">?</text></svg>`,
  screwdriver: (c, a) => `<svg viewBox="0 0 90 44" width="270" height="132" aria-hidden="true"><rect x="4" y="16" width="30" height="12" rx="6" fill="${a}"/><path d="M34 22 H78" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/><path d="M78 19 L86 22 L78 25" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
  people: (c, a) => `<svg viewBox="0 0 90 44" width="270" height="132" aria-hidden="true"><circle cx="18" cy="14" r="7" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M6 40 C6 28 30 28 30 40" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="45" cy="12" r="7" fill="none" stroke="${a}" stroke-width="2.5"/><path d="M33 38 C33 26 57 26 57 38" fill="none" stroke="${a}" stroke-width="2.5"/><circle cx="72" cy="14" r="7" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M60 40 C60 28 84 28 84 40" fill="none" stroke="${c}" stroke-width="2.5"/></svg>`,
  page: (c, a) => `<svg viewBox="0 0 90 44" width="270" height="132" aria-hidden="true"><path d="M30 2 H54 L62 10 V42 H30 Z" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/><path d="M36 16 H56 M36 23 H56 M36 30 H50" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  door: (c, a) => `<svg viewBox="0 0 90 44" width="270" height="132" aria-hidden="true"><path d="M30 42 V4 H60 V42" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 4 L48 8 V42 L30 42" fill="${a}" fill-opacity=".35" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="44" cy="25" r="1.8" fill="${c}"/><path d="M20 42 H70" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
};

// Each post: background, colours, icon, headline (with an optional second headline line in the accent colour), and a line under it.
// List posts show numbered items instead of an icon.
const POSTS = [
  { file: "g04-optometric-assistant-jobs", bg: C.navy, fg: C.cream, label: C.buff, accent: C.buff, line: C.mist, k: "kestrel-k-mark-reversed.svg", icon: "eye", size: 112,
    head: "Optometric assistant jobs.", head2: "The work and pay.", sub: "What the job involves day to day, how pay varies across Canada, and how to start or move up.",
    alt: "Kestrel guide: Optometric assistant jobs. The work and pay. What the job involves day to day, how pay varies across Canada, and how to start or move up." },
  { file: "g05-questions-before-you-say-yes", bg: C.soft, fg: C.cream, label: C.buff, accent: C.buff, line: C.mist, k: "kestrel-k-mark-reversed.svg", icon: "question",
    head: "Questions to ask", head2: "before you say yes.", sub: "The patients, the lab, the hours, the pay, the training and the team.",
    alt: "Kestrel guide: Questions to ask before you say yes. The patients, the lab, the hours, the pay, the training and the team." },
  { file: "g06-hire-for-attitude", bg: C.cream, fg: C.navy, label: C.chestnut, accent: C.chestnut, line: C.chestnutD, k: "kestrel-k-mark.svg", icon: "screwdriver", size: 130,
    head: "Hire for attitude.", head2: "Train for skills.", sub: "Many good eye care staff start out in retail, hospitality or other health jobs.",
    alt: "Kestrel guide: Hire for attitude. Train for skills. Many good eye care staff start out in retail, hospitality or other health jobs." },
  { file: "g07-who-does-what", bg: C.chestnut, fg: C.cream, label: C.cream, accent: C.buff, line: C.cream, k: "kestrel-k-mark-reversed.svg", icon: "people", size: 124,
    head: "Who does what in an eye care clinic?", sub: "More roles than most people expect, and many need no university degree.",
    alt: "Kestrel guide: Who does what in an eye care clinic? More roles than most people expect, and many need no university degree." },
  { file: "g08-resume-tips", bg: C.chestnut, fg: C.cream, label: C.cream, accent: C.buff, line: C.cream, k: "kestrel-k-mark-reversed.svg",
    head: "4 tips for an eye care resume.", list: ["Your registration status, if the job needs it", "2 or 3 lines on who you are", "The tests, lenses and systems you know", "Leave off your photo and date of birth"],
    alt: "Kestrel guide: 4 tips for an eye care resume. 1, your registration status, if the job needs it. 2, 2 or 3 lines on who you are. 3, the tests, lenses and systems you know. 4, leave off your photo and date of birth." },
  { file: "g09-attract-the-right-people", bg: C.navy, fg: C.cream, label: C.buff, accent: C.buff, line: C.mist, k: "kestrel-k-mark-reversed.svg", icon: "door",
    head: "How to attract the right people", head2: "to your clinic.", sub: "Show the pay. Describe the real week. Reply to everyone.",
    alt: "Kestrel guide: How to attract the right people to your clinic. Show the pay. Describe the real week. Reply to everyone." },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");

function html(p) {
  const size = p.size ?? (p.list ? 120 : 104);
  const middle = p.list
    ? `<ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:22px">${p.list.map((t, i) => `<li style="display:flex;gap:28px;align-items:baseline;font-family:Poppins;font-size:38px;line-height:1.3;color:${p.fg}"><span style="font-family:'DM Serif Display';font-size:48px;color:${p.accent};min-width:36px">${i + 1}</span>${esc(t)}</li>`).join("")}</ol>`
    : `<p style="margin:0;font-family:Poppins;font-size:36px;line-height:1.35;color:${p.line}">${esc(p.sub)}</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(p.head)}</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}</style></head><body>
<div style="width:1080px;height:1350px;box-sizing:border-box;padding:80px;background:${p.bg};display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;justify-content:space-between;align-items:center">
<p style="margin:0;font-family:Poppins;font-weight:600;font-size:24px;letter-spacing:0.24em;color:${p.label}">KESTREL GUIDES</p>
<p style="margin:0;font-family:'DM Serif Display';font-size:34px;color:${p.label}">New guide</p>
</div>
<div style="display:flex;flex-direction:column;gap:48px">
${p.icon ? ICON[p.icon](p.fg, p.accent) : ""}
<p style="margin:0;font-family:'DM Serif Display';font-size:${size}px;line-height:1;color:${p.fg}">${esc(p.head)}${p.head2 ? `<br><span style="color:${p.accent}">${esc(p.head2)}</span>` : ""}</p>
</div>
${middle}
<div style="display:flex;align-items:center;gap:16px">
<img src="${brand(p.k)}" alt="" style="width:56px;height:56px;display:block">
<p style="margin:0;font-family:Poppins;font-size:24px;letter-spacing:0.06em;color:${p.line}">eyecarejobs.ca</p>
</div></div></body></html>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
for (const p of POSTS) {
  const file = join(OUT, `${p.file}.html`);
  writeFileSync(file, html(p));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${p.file}.png`) });
}
writeFileSync(join(OUT, "alt-text.json"), JSON.stringify(Object.fromEntries(POSTS.map((p) => [p.file, p.alt])), null, 2) + "\n");
await browser.close();
console.log(`Built ${POSTS.length} posts in ${OUT}`);

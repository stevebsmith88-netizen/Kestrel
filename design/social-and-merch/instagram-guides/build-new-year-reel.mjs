// "New year, new job in eye care" Reel (Steve, 28th November 2026): a 3, 2, 1 countdown on a night sky, fireworks in the brand colours,
// and the kestrel illustration (not the logo) in a party hat blowing a party blower, then "Happy new year from the Kestrel team".
// It says "Opening early 2027" until a launch date is confirmed. Music (Auld Lang Syne or similar) is added in Instagram.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-new-year-reel.mjs
// 1080 x 1920, 30 frames a second, 15 seconds, no sound. Needs ffmpeg. The cover is its own simple design, built at the end.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PERCH } from "./kestrel-bird-side.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", deep: "#8C4024", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 15;
const T = { n3: 0.7, n2: 1.7, n1: 2.7, blow: 3.7, line: 5.0, end: 10.0 };

// The head in PERCH is centred at (16, -186). The beak is redrawn in a kestrel's colours so it shows on the navy sky.
const HX = 16, HY = -186;
const BEAK = `<path d="M${HX + 30} ${HY - 8} C ${HX + 52} ${HY - 8}, ${HX + 56} ${HY + 8}, ${HX + 48} ${HY + 18} C ${HX + 44} ${HY + 10}, ${HX + 38} ${HY + 8}, ${HX + 32} ${HY + 8} Z" fill="#9FB0C6" stroke="${C.cream}" stroke-width="2"/>
  <ellipse cx="${HX + 33}" cy="${HY - 1}" rx="7" ry="8" fill="${C.buff}"/>`;
// A party hat: a buff cone with chestnut stripes and a cream bobble, tilted back.
const PARTY_HAT = `<g transform="rotate(-14 ${HX} ${HY - 30})">
  <path d="M${HX - 26} ${HY - 28} L${HX + 2} ${HY - 116} L${HX + 28} ${HY - 28} Z" fill="${C.buff}"/>
  <path d="M${HX - 16} ${HY - 58} L${HX + 19} ${HY - 58} M${HX - 7} ${HY - 88} L${HX + 10} ${HY - 88}" stroke="${C.chestnut}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="${HX + 2}" cy="${HY - 120}" r="11" fill="${C.cream}"/></g>`;
// The party blower, held in the beak: a mouthpiece, then a striped strip that unrolls (its length is set while animating).
const BLOWER = `<g transform="translate(${HX + 50} ${HY + 6})">
  <rect x="-6" y="-6" width="22" height="12" rx="4" fill="${C.cream}"/>
  <g id="strip"><rect x="14" y="-9" width="240" height="18" rx="4" fill="${C.chestnut}"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${30 + i * 38}" y="-9" width="14" height="18" fill="${C.cream}"/>`).join("")}
  <circle cx="254" cy="-6" r="13" fill="none" stroke="${C.chestnut}" stroke-width="7"/></g>
  <g id="coil"><circle cx="26" cy="-2" r="16" fill="none" stroke="${C.chestnut}" stroke-width="8"/><circle cx="26" cy="-2" r="7" fill="none" stroke="${C.cream}" stroke-width="4"/></g></g>`;
const BRANCH = `<path d="M-200 6 Q-20 -8 190 14" fill="none" stroke="${C.deep}" stroke-width="14" stroke-linecap="round"/><path d="M-170 -2 Q-40 -20 80 -8 Q-40 -2 -170 -2 Z" fill="${C.cream}"/>`;
const BIRD = (id) => `<g id="${id}">${BRANCH}${PERCH.replace('id="perch"', `id="${id}p"`)}${BEAK}${PARTY_HAT}${BLOWER.replace('id="strip"', `id="${id}s"`).replace('id="coil"', `id="${id}c"`)}</g>`;
// Fireworks: rings of short rays that burst out and fade, in chestnut, buff and cream.
const FW = [{ x: 260, y: 560, c: C.buff, a: T.blow - 0.1 }, { x: 820, y: 470, c: C.chestnut, a: T.blow + 0.25 }, { x: 560, y: 330, c: C.cream, a: T.blow + 0.55 },
  { x: 160, y: 930, c: C.chestnut, a: T.blow + 0.9 }, { x: 900, y: 880, c: C.buff, a: 5.3 }, { x: 380, y: 260, c: C.chestnut, a: 5.9 },
  { x: 760, y: 1000, c: C.cream, a: 6.5 }, { x: 220, y: 1120, c: C.buff, a: 7.1 }, { x: 860, y: 300, c: C.cream, a: 7.6 },
  { x: 520, y: 820, c: C.chestnut, a: 8.2 }, { x: 140, y: 420, c: C.cream, a: 8.8 }, { x: 940, y: 640, c: C.chestnut, a: 9.2 }];
const STARS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1920, r: 1.5 + (i % 3), w: (i * 1.3) % 6.28 }));

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>New year</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
.num{position:absolute;left:0;right:0;top:420px;text-align:center;font-family:'DM Serif Display';font-size:420px;line-height:1;color:${C.buff};opacity:0}
#head{left:90px;right:90px;top:380px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
#cov{position:absolute;inset:0;background:${C.navy};display:none}
</style></head><body><div id="f">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${STARS.map((s, i) => `<circle id="st${i}" cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.cream}"/>`).join("")}
${FW.map((w, i) => `<g id="fw${i}" transform="translate(${w.x} ${w.y})" opacity="0">${Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return `<line class="ray" x1="${Math.cos(a) * 20}" y1="${Math.sin(a) * 20}" x2="${Math.cos(a) * 60}" y2="${Math.sin(a) * 60}" stroke="${w.c}" stroke-width="7" stroke-linecap="round"/>`; }).join("")}</g>`).join("")}</svg>
${["3", "2", "1"].map((n, i) => `<p class="num" id="n${i}">${n}</p>`).join("")}
<div class="abs" id="head">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.cream}">New year,</p>
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.buff};margin-top:6px">new job in eye care.</p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920">${BIRD("bird")}</svg>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:72px;color:${C.navy};margin-top:80px">Happy new year</p>
<p id="e1b" style="font-family:'DM Serif Display';font-size:56px;color:${C.chestnut};margin-top:10px">from the Kestrel team</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.5;color:${C.slate};margin-top:60px">Opening early 2027.<br>Pre launch is open: link in bio</p>
</div>
<div id="cov">
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920">${STARS.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.cream}" opacity=".6"/>`).join("")}
${[{ x: 220, y: 430, c: C.buff }, { x: 560, y: 340, c: C.cream }, { x: 880, y: 450, c: C.chestnut }].map((w) => `<g transform="translate(${w.x} ${w.y})">${Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return `<line x1="${Math.cos(a) * 40}" y1="${Math.sin(a) * 40}" x2="${Math.cos(a) * 100}" y2="${Math.sin(a) * 100}" stroke="${w.c}" stroke-width="8" stroke-linecap="round"/>`; }).join("")}</g>`).join("")}
<g transform="translate(400 1500) scale(1.5)">${BIRD("cb")}</g></svg>
<div class="abs" style="left:90px;right:90px;top:650px">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.cream}">New year,</p>
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.buff};margin-top:6px">new job in eye care.</p>
</div>
</div>
</div>
<script>
const FW = ${JSON.stringify(FW)}, STARS = ${JSON.stringify(STARS)}, T = ${JSON.stringify(T)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const show = (id, t, a, d = 24) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + d * (1 - v) + "px)"; };
// The blower: 0 rolled up, 1 fully out.
const blow = (pre, v) => { el(pre + "s").setAttribute("transform", "scale(" + Math.max(0.001, v) + " 1)"); el(pre + "c").setAttribute("opacity", 1 - Math.min(1, v * 3)); };
window.render = (t) => {
  STARS.forEach((s, i) => el("st" + i).setAttribute("opacity", 0.35 + 0.35 * Math.sin(t * 2 + s.w)));
  // 3, 2, 1: each number pops in on the count and fades as the next arrives.
  [T.n3, T.n2, T.n1].forEach((a, i) => { const v = span(t, a, a + 0.35), o = span(t, a + 0.75, a + 0.95), e = el("n" + i); e.style.opacity = clamp(v * 2) * (1 - o); e.style.transform = "scale(" + (0.6 + 0.4 * back(v)) + ")"; });
  // The bird: on its branch from the start, bobbing a little; on the count of zero it blows the party blower, twice.
  const bob = 4 * Math.sin(t * 2.4);
  el("bird").setAttribute("transform", "translate(560 " + (1480 + bob) + ") scale(1.5)");
  const b1 = Math.sin(Math.PI * span(t, T.blow, T.blow + 0.9)), b2 = Math.sin(Math.PI * span(t, 6.2, 7.0));
  blow("bird", Math.max(b1, b2));
  // Fireworks.
  FW.forEach((w, i) => { const v = span(t, w.a, w.a + 1.1), g = el("fw" + i); g.setAttribute("opacity", v > 0 && v < 1 ? 1 - v * v : 0); g.setAttribute("transform", "translate(" + w.x + " " + w.y + ") scale(" + (0.5 + 2.8 * out(v)) + ")"); });
  show("head", t, T.line, 30); el("head").style.opacity = parseFloat(el("head").style.opacity) * (1 - span(t, T.end - 0.4, T.end));
  el("end").style.opacity = span(t, T.end - 0.2, T.end + 0.3);
  show("e1", t, T.end + 0.4, 20); show("e1b", t, T.end + 0.8, 20); show("e2", t, T.end + 1.6, 16);
};
window.cover = () => { window.render(0); el("cov").style.display = "block"; blow("cb", 1); };
</script></body></html>`;

const file = join(OUT, "new-year-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.0, 2.9, 4.1, 5.8, 7.3, 13.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `ny-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  await tab.evaluate(() => window.cover());
  await frame.screenshot({ path: join(process.env.STILLS, `ny-cover.jpg`), type: "jpeg", quality: 80 });
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
  await tab.goto(pathToFileURL(file).href); await tab.evaluate(() => document.fonts.ready);
}
const mp4 = join(OUT, "new-year-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let i = 0; i < FPS * SECONDS; i++) {
  await tab.evaluate((t) => window.render(t), i / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
await tab.evaluate(() => window.cover());
await frame.screenshot({ path: join(OUT, "new-year-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

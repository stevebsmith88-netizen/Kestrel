// "Your job / Our job" Reel (Steve, 28th November 2026): for the public, a quick look at why eye care matters (an eye exam is more than
// a glasses check); for eye care teams, a thank you; then what Kestrel does. Every role gets a line, not only optometrists. Health
// claims are worded carefully: an exam can spot signs of diabetes, it does not diagnose it, and glaucoma often has no early symptoms.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-your-job-reel.mjs
// 1080 x 1920, 30 frames a second, 16 seconds, no sound. Needs ffmpeg. The cover is built at the end.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", buff: "#D8B48A", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 16;

// Line icons in the website's style (24 x 24, round ends).
const ICON = {
  glasses: `<circle cx="6.5" cy="13" r="4"/><circle cx="17.5" cy="13" r="4"/><path d="M10.5 12.5q1.5-1.2 3 0M2.5 12 4 8.5M21.5 12 20 8.5"/>`,
  eye: `<path d="M2 12Q12 3 22 12Q12 21 2 12Z"/><circle cx="12" cy="12" r="3.2"/>`,
  retina: `<circle cx="12" cy="12" r="9"/><circle cx="9" cy="12" r="1.8"/><path d="M10.6 11 15 7.5M10.6 13 15.5 16.5M10.8 12h7"/>`,
  test: `<rect x="4" y="9" width="16" height="9" rx="2"/><circle cx="12" cy="13.5" r="2.6"/><path d="M8 9V6.5h8V9M7 21h10"/>`,
  people: `<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M15 14.5c3 0 5.5 1.6 5.5 4.5"/>`,
  menu: `<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"/>`,
};
const LINES = [
  { i: "glasses", t: "Fitting a child&apos;s first pair of glasses" },
  { i: "eye", t: "Catching glaucoma before the patient notices anything" },
  { i: "retina", t: "Spotting signs of diabetes in the back of an eye" },
  { i: "test", t: "Running the tests that start every exam" },
  { i: "people", t: "Putting a nervous first time patient at ease" },
  { i: "menu", t: "Helping someone read the menu again" },
];
const svg = (k, stroke) => `<svg viewBox="0 0 24 24" width="74" height="74" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Your job</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
.row{display:flex;align-items:center;gap:36px;margin-bottom:34px;opacity:0}
.tile{width:124px;height:124px;flex:none;border-radius:22px;background:${C.paper};border:3px solid ${C.line};display:flex;align-items:center;justify-content:center}
.lt{font-family:'DM Serif Display';font-size:54px;line-height:1.1;color:${C.navy}}
#our{position:absolute;inset:0;background:${C.chestnut};transform:translateY(100%)}
#cov{position:absolute;inset:0;background:${C.cream};display:none;flex-direction:column;justify-content:center;padding:0 90px}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
</style></head><body><div id="f">
<p class="abs" id="yj" style="left:80px;top:290px;font-family:'DM Serif Display';font-size:120px;color:${C.navy};opacity:0">Your job:</p>
<div class="abs" style="left:80px;right:80px;top:500px">${LINES.map((l, i) => `<div class="row" id="l${i}"><div class="tile">${svg(l.i, C.chestnut)}</div><p class="lt">${l.t}</p></div>`).join("")}</div>
<div id="our">
<div class="abs" style="left:80px;right:80px;top:560px">
<p id="o1" style="font-family:'DM Serif Display';font-size:120px;color:${C.cream};opacity:0">Our job:</p>
<p id="o2" style="font-family:'DM Serif Display';font-size:92px;line-height:1.06;color:${C.cream};margin-top:40px;opacity:0">Finding you the clinic where you can do that.</p>
<p id="o3" style="font-family:'DM Serif Display';font-size:92px;line-height:1.06;color:${C.navy};margin-top:30px;opacity:0">With the pay shown up front.</p>
</div>
</div>
<div id="cov">
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.navy}">Your job:<br>looking after Canada&apos;s eyes.</p>
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.chestnut};margin-top:60px">Our job:<br>finding you the place to do it.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Pre launch is open.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:42px;color:${C.chestnut};margin-top:40px">Link in bio</p>
</div>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
const show = (id, t, a, d = 24) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + d * (1 - v) + "px)"; };
window.render = (t, cover = false) => {
  const T = cover ? 99 : t;
  show("yj", T, 0.1);
  // Each part of the job arrives in turn, sliding in from the left.
  for (let i = 0; i < ${LINES.length}; i++) { const a = 1.0 + i * 1.15, v = out(span(T, a, a + 0.5)), e = el("l" + i); e.style.opacity = v; e.style.transform = "translateX(" + -40 * (1 - v) + "px)"; }
  // Our job: the chestnut card rises over it.
  const c = cover ? 0 : io(span(t, 9.0, 9.6)); el("our").style.transform = "translateY(" + 100 * (1 - c) + "%)";
  show("o1", t, 9.7); show("o2", t, 10.3); show("o3", t, 11.2);
  el("end").style.opacity = cover ? 0 : span(t, 13.6, 14.0);
  show("e1", t, 14.2, 20); show("e2", t, 14.7, 20);
};
// A simple cover of its own, inside the 4:5 grid crop (Steve prefers covers that are not busy).
window.cover = () => { window.render(0, true); el("cov").style.display = "flex"; };
</script></body></html>`;

const file = join(OUT, "your-job-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [2.5, 5.0, 8.5, 9.4, 12.0, 15.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `yj-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "your-job-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "your-job-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

// "Rewriting the rules" Reel (Steve, 21st November 2026): 5 old habits of eye care hiring are scribbled out, 1 at a time, by the
// feather from the logo, and Kestrel's way is written in underneath. Ends on the logo and /compare.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-rules-reel.mjs
// 1080 x 1920, 30 frames a second, 24 seconds, no sound. Needs ffmpeg. The cover (all 5 rewritten) is built at the end.
// Decided with Steve: generic (no other job board is named; /compare does the naming), no prices, the strongest 5, pre launch wording.
// Every claim is true today (app/compare/page.tsx): pay range on every post, the existing vacancy and AI screening questions on every
// post, agencies cannot post, and a person reads every post before it goes live.
// The feather is the logo's own 3 feather paths from public/brand/kestrel-lockup-full.svg, moved as they are, never redrawn.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 24;

const RULES = [
  ["Salary: competitive", "The actual pay range, on every post."],
  ["Is this job even real?", "Every post says if it&apos;s an existing vacancy."],
  ["Is a bot reading my application?", "Every post says if AI screens candidates."],
  ["Recruiters reposting clinic jobs", "No agencies. Jobs come from the clinics."],
  ["Posts go live unchecked", "A person reads every post first."],
];
const FIRST = 3.4, EACH = 3.1, END = FIRST + EACH * RULES.length + 0.6;

// Only the feather from the lockup: the 2nd to 4th paths in its first group.
const lock = readFileSync(join(ROOT, "public/brand/kestrel-lockup-full.svg"), "utf8");
const groupEnd = lock.indexOf("</g>");
let n = 0;
const featherSvg = lock.replace(/<(path|rect)\b/g, (m, tag, off) => { const i = n++; const keep = off < groupEnd && i >= 2; return `<${tag}${keep ? ' class="fp"' : ' style="display:none"'}`; })
  .replace("<svg ", '<svg id="fsvg" ');

const rows = RULES.map(([old, now], i) => `
<div class="r" id="row${i}">
  <p class="old"><span class="ot" id="ot${i}">${old}</span><svg class="scrib" id="sc${i}"><path id="sp${i}" fill="none" stroke="${C.chestnut}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></p>
  <p class="new" id="nw${i}">${now}</p>
</div>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Rewriting the rules</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:640px;font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.navy}}
#title{left:80px;right:80px;top:320px;font-family:'DM Serif Display';font-size:76px;line-height:1.04;color:${C.navy};opacity:0}
#rows{position:absolute;left:80px;right:80px;top:560px}
.r{height:226px;opacity:0}
.old{position:relative;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:44px;color:#8A9099}
.scrib{position:absolute;left:-14px;top:-6px;overflow:visible}
.new{font-family:'DM Serif Display';font-size:58px;line-height:1.1;color:${C.navy};margin-top:16px;opacity:0}
#feather{position:absolute;left:0;top:0;width:900px;pointer-events:none;opacity:0;transform-origin:0 0}
#feather svg{width:100%;height:auto;display:block}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">EYE CARE JOBS</p>
<p class="abs" id="hook">Eye care hiring has worked the same way for years.<br><span style="color:${C.chestnut}">We&apos;re changing it.</span></p>
<p class="abs" id="title">Eye care hiring,<br><span style="color:${C.chestnut}">rewritten.</span></p>
<div id="rows">${rows}</div>
<div id="feather">${featherSvg}</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">See how we compare:</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:46px;color:${C.chestnut};margin-top:16px">eyecarejobs.ca/compare</p>
<p id="e3" style="font-family:Poppins;font-size:34px;line-height:1.45;color:${C.slate};margin-top:56px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const FIRST = ${FIRST}, EACH = ${EACH}, END = ${END}, N = ${RULES.length};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
let FB = null; // the feather's box inside its 900 pixel wide lockup, measured once
const SCALE = 0.62; // the feather at this size is about the height of a line of text
window.render = (t) => {
  if (!FB) { const f = el("feather").getBoundingClientRect(); const g = Array.from(document.querySelectorAll("#fsvg .fp")).map((e) => e.getBoundingClientRect());
    FB = { x: Math.min(...g.map((b) => b.left)) - f.left, y: Math.min(...g.map((b) => b.top)) - f.top, w: Math.max(...g.map((b) => b.right)) - Math.min(...g.map((b) => b.left)), h: Math.max(...g.map((b) => b.bottom)) - Math.min(...g.map((b) => b.top)) }; }
  el("label").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, END - 0.3, END));
  // The hook, then it gives way to the title above the list.
  const h = out(span(t, 0.2, 0.9)) * (1 - span(t, FIRST - 0.6, FIRST - 0.2)); el("hook").style.opacity = h; el("hook").style.transform = "translateY(" + 30 * (1 - out(span(t, 0.2, 0.9))) + "px)";
  const ti = out(span(t, FIRST - 0.3, FIRST + 0.3)); el("title").style.opacity = ti * (1 - span(t, END - 0.3, END));
  let fOn = 0, fx = 0, fy = 0, fr = 0;
  const rowsBox = el("rows").getBoundingClientRect(), fBox = el("f").getBoundingClientRect();
  for (let i = 0; i < N; i++) {
    const s = FIRST + i * EACH;
    const r = el("row" + i); const a = out(span(t, s, s + 0.4)); r.style.opacity = a * (1 - span(t, END - 0.3, END)); r.style.transform = "translateY(" + 24 * (1 - a) + "px)";
    // The feather scribbles the old line out: a quick back and forth zigzag across it, drawn behind the feather's tip.
    const k = span(t, s + 0.7, s + 1.6);
    const ot = el("ot" + i).getBoundingClientRect(), p = el("sp" + i);
    if (!p.dataset.len) { // built once, from the line's own width, with a fixed wobble so every build matches
      const W = ot.width + 28, H = ot.height + 12, sc = el("sc" + i); sc.setAttribute("width", W); sc.setAttribute("height", H);
      // 2 passes, left to right and back, of tight slanted strokes that run past the top and bottom of the letters, like a pen.
      const pts = []; let j = 0;
      for (let x = 2; x < W - 4; x += 9 + ((j * 7) % 6), j++) pts.push([x + (j % 2 ? -6 : 6), j % 2 ? H * (0.08 + ((j * 13) % 5) / 50) : H * (0.92 - ((j * 11) % 5) / 50)]);
      for (let x = W - 6; x > 2; x -= 11 + ((j * 5) % 6), j++) pts.push([x + (j % 2 ? 5 : -5), j % 2 ? H * (0.18 + ((j * 7) % 5) / 40) : H * (0.8 - ((j * 3) % 5) / 40)]);
      let d = "M " + pts[0][0] + " " + pts[0][1];
      for (let q = 1; q < pts.length; q++) d += " L " + pts[q][0].toFixed(1) + " " + pts[q][1].toFixed(1);
      p.setAttribute("d", d); p.dataset.len = p.getTotalLength(); }
    const L = +p.dataset.len; p.style.strokeDasharray = L; p.style.strokeDashoffset = L * (1 - k);
    el("ot" + i).style.opacity = 1 - 0.45 * span(t, s + 1.6, s + 2.0);
    if (t >= s + 0.55 && t <= s + 1.85) { fOn = span(t, s + 0.55, s + 0.7) * (1 - span(t, s + 1.6, s + 1.85));
      const pt = p.getPointAtLength(L * k), sb = el("sc" + i).getBoundingClientRect();
      fx = sb.left - fBox.left + pt.x; fy = sb.top - fBox.top + pt.y; fr = 10 * Math.sin(k * 40); }
    const nw = out(span(t, s + 1.7, s + 2.3)); el("nw" + i).style.opacity = nw; el("nw" + i).style.transform = "translateX(" + 30 * (1 - nw) + "px)";
  }
  // Place the feather so its tip (the bottom right of its box) rides the end of the scribble.
  const fe = el("feather"); fe.style.opacity = fOn;
  // The origin is the tip, so the tip stays where it is placed while the feather shrinks and tilts round it.
  fe.style.transform = "translate(" + (fx - (FB.x + FB.w)) + "px," + (fy - (FB.y + FB.h)) + "px) scale(" + SCALE + ")";
  fe.style.transformOrigin = ((FB.x + FB.w)) + "px " + ((FB.y + FB.h)) + "px";
  fe.style.rotate = fr + "deg";
  // The end: the logo, then /compare and the sign up line.
  el("end").style.opacity = span(t, END - 0.3, END + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", END + 0.9); show("e2", END + 1.3); show("e3", END + 1.9);
};
// The cover: the title and all 5 lines rewritten, nothing mid move.
window.cover = () => { window.render(END - 0.5); el("feather").style.opacity = 0; };
</script></body></html>`;

const file = join(OUT, "rules-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 4.3, 5.2, 10.5, 19.5, 22.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `rules-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "rules-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "rules-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

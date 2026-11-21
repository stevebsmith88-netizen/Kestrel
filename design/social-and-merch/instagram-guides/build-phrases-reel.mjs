// "Job ad phrases, translated" Reel for candidates (Steve, 21st November 2026). Softer than "red flags", since most followers are clinics:
// each common phrase is circled by the logo's feather (a scribble made it unreadable), then a light translation and a question to ask.
// Ends on "you won't need to ask the first one" and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-phrases-reel.mjs
// 1080 x 1920, 30 frames a second, 25 seconds, no sound. Needs ffmpeg. The cover (all 5 translated) is built at the end.
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
const SECONDS = 25.5;

const RULES = [
  ["Competitive salary", "We&apos;d rather not say yet.", "What&apos;s the pay range?"],
  ["Fast paced environment", "It&apos;s busy. How busy?", "How many patients a day?"],
  ["We&apos;re like a family", "Lovely, but hours matter too.", "What are the usual hours? Evenings or Saturdays?"],
  ["Wear many hats", "You might do a bit of everything.", "What does a typical day look like?"],
  ["Must be flexible", "The schedule may change.", "How far ahead is the schedule set?"],
];
const FIRST = 3.4, EACH = 3.4, END = FIRST + EACH * RULES.length + 0.6;

// Only the feather from the lockup: the 2nd to 4th paths in its first group.
const lock = readFileSync(join(ROOT, "public/brand/kestrel-lockup-full.svg"), "utf8");
const groupEnd = lock.indexOf("</g>");
let n = 0;
const featherSvg = lock.replace(/<(path|rect)\b/g, (m, tag, off) => { const i = n++; const keep = off < groupEnd && i >= 2; return `<${tag}${keep ? ' class="fp"' : ' style="display:none"'}`; })
  .replace("<svg ", '<svg id="fsvg" ');

const rows = RULES.map(([old, tr, ask], i) => `
<div class="r" id="row${i}">
  <p class="old"><span class="ot" id="ot${i}">&quot;${old}&quot;</span><svg class="scrib" id="sc${i}"><path id="sp${i}" fill="none" stroke="${C.chestnut}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></p>
  <div class="new" id="nw${i}"><p class="tr">${tr}</p><p class="ask">Ask: ${ask}</p></div>
</div>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Job ad phrases, translated</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:640px;font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.navy}}
#title{left:80px;right:80px;top:320px;font-family:'DM Serif Display';font-size:76px;line-height:1.04;color:${C.navy};opacity:0}
#rows{position:absolute;left:80px;right:80px;top:540px}
.r{height:236px;opacity:0}
.old{position:relative;display:inline-block;margin-left:14px;font-family:Arial,Helvetica,sans-serif;font-size:44px;color:#5F6670}
.scrib{position:absolute;left:-14px;top:-6px;overflow:visible}
.new{margin-top:12px;opacity:0}
.tr{font-family:'DM Serif Display';font-size:54px;line-height:1.1;color:${C.navy}}
.ask{font-family:Poppins;font-weight:600;font-size:32px;line-height:1.35;color:${C.chestnut};margin-top:8px}
#feather{position:absolute;left:0;top:0;width:900px;pointer-events:none;opacity:0;transform-origin:0 0}
#feather svg{width:100%;height:auto;display:block}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">EYE CARE JOBS</p>
<p class="abs" id="hook">Job ads have their own language.<br><span style="color:${C.chestnut}">Here&apos;s the translation.</span></p>
<p class="abs" id="title">Job ad phrases,<br><span style="color:${C.chestnut}">translated.</span></p>
<div id="rows">${rows}</div>
<div id="feather">${featherSvg}</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;line-height:1.15;color:${C.navy};margin-top:80px;padding:0 80px">On Kestrel, you won&apos;t need to ask the first one.</p>
<p id="e2" style="font-family:'DM Serif Display';font-size:64px;color:${C.chestnut};margin-top:20px">Every job shows its pay.</p>
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
    const k = io(span(t, s + 0.6, s + 1.7)); // eased in and out, like a hand
    const ot = el("ot" + i).getBoundingClientRect(), p = el("sp" + i);
    if (!p.dataset.len) { // built once, from the line's own width, with a fixed wobble so every build matches
      const W = ot.width + 28, H = ot.height + 12, sc = el("sc" + i); sc.setAttribute("width", W); sc.setAttribute("height", H);
      // A hand drawn ring round the phrase, a little more than once round with a wobble, so the phrase stays readable.
      const pts = [], cx = W / 2, cy = H / 2;
      // A smooth oval, fine steps and no wobble, that grows very slightly as it goes so the end overlaps the start like a pen loop.
      for (let a = 215; a <= 615; a += 1.5) { const r = a * Math.PI / 180, g = 1 + 0.05 * (a - 215) / 400;
        pts.push([cx + (W / 2 + 18) * g * Math.cos(r), cy + (H / 2 + 14) * g * Math.sin(r)]); }
      let d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
      for (let q = 1; q < pts.length; q++) d += " L " + pts[q][0].toFixed(1) + " " + pts[q][1].toFixed(1);
      p.setAttribute("d", d); p.dataset.len = p.getTotalLength(); }
    const L = +p.dataset.len; p.style.strokeDasharray = L; p.style.strokeDashoffset = L * (1 - k);
    // The phrase stays fully readable: the translation underneath needs it.
    if (t >= s + 0.55 && t <= s + 1.85) { fOn = span(t, s + 0.55, s + 0.7) * (1 - span(t, s + 1.6, s + 1.85));
      const pt = p.getPointAtLength(L * k), sb = el("sc" + i).getBoundingClientRect();
      fx = sb.left - fBox.left + pt.x; fy = sb.top - fBox.top + pt.y; fr = -4 + 8 * k; } // a steady, gentle turn rather than a twitch
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

const file = join(OUT, "phrases-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 4.6, 6.0, 12.5, 20.5, 24]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `phrases-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "phrases-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "phrases-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

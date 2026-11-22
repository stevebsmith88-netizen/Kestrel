// "100 followers, thank you" Reel (Steve, 22nd November 2026), the follow up to "Nearly 100": the counter lands on 100, a few feathers
// fall, the kestrel swoops, a grid of what has been posted so far, a nudge to send it to someone in eye care, then pre launch is open.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-100-thanks-reel.mjs
// 1080 x 1920, 30 frames a second, 14 seconds, no sound. Needs ffmpeg. The cover is built at the end.
// Post it once the account has passed 100 followers; it claims 100 and nothing more specific.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY } from "./kestrel-bird-side.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const here = (f) => pathToFileURL(join(OUT, f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", buff: "#D8B48A", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 14;

// Things already posted on the account, shown as a small grid of thumbnails.
const THUMBS = ["g00-hello-were-kestrel.png", "g02-job-ad-checklist.png", "kestrel-hover-reel-cover.jpg", "g04-optometric-assistant-jobs.png", "noise-reel-clinics-cover.jpg", "g01-how-people-fall-into-optics.png"];
const TILT = [-4, 3, -2, 4, -3, 2];
// A simple feather shape for the confetti (not the logo's feather, which is never redrawn).
const FEATHER = '<path d="M0 -30 C 12 -18 12 14 0 30 C -12 14 -12 -18 0 -30 Z M0 -26 L0 34" stroke-width="2"/>';
const FALL = Array.from({ length: 14 }, (_, i) => ({ x: 80 + ((i * 457) % 920), d: 0.15 * (i % 5), s: 0.7 + ((i * 37) % 10) / 20, r: (i * 53) % 360, c: i % 3 === 0 ? C.buff : C.chestnut }));

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>100 followers</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#a{left:80px;right:80px;top:420px}
#num{font-family:'DM Serif Display';font-size:420px;line-height:.9;color:${C.navy};transform-origin:0 70%}
#b{left:80px;right:80px;top:300px;opacity:0}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:80px}
.th{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:8px;box-shadow:0 14px 30px rgba(27,43,75,.18);opacity:0}
#c{left:80px;right:80px;top:560px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
</style></head><body><div id="f">
<p class="abs" id="label">THANK YOU</p>
<div class="abs" id="a">
<p id="num">0</p>
<p id="h1" style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy};margin-top:40px;opacity:0">followers.<br><span style="color:${C.chestnut}">Thank you.</span></p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920">${FALL.map((p, i) => `<g id="fe${i}" fill="${p.c}" stroke="${C.cream}" opacity="0">${FEATHER}</g>`).join("")}</svg>
<div class="abs" id="b">
<p style="font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.navy}">You followed along<br><span style="color:${C.chestnut}">before a single job was posted.</span></p>
<div class="grid">${THUMBS.map((t, i) => `<img class="th" id="t${i}" src="${here(t)}" alt="">`).join("")}</div>
</div>
<div class="abs" id="c">
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1.06;color:${C.navy}">Know someone in eye care who should be here?</p>
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1.06;color:${C.chestnut};margin-top:40px">Send them this.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:60px;line-height:1.15;color:${C.navy};margin-top:80px">Pre launch is open for candidates, clinics and suppliers.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:42px;color:${C.chestnut};margin-top:40px">Link in bio</p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}</g></svg>
</div>
<script>
const FALL = ${JSON.stringify(FALL)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const io = (id, a, b, d = 30) => (t) => { const i = out(span(t, a, a + 0.5)), o = span(t, b - 0.35, b), e = el(id); e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + d * (1 - i) + "px)"; };
window.render = (t, cover = false) => {
  el("label").style.opacity = out(span(t, 0, 0.4)) * (1 - span(t, 3.0, 3.3));
  io("a", 0, 3.3, 20)(t);
  // The counter climbs, slows, and lands on exactly 100 with a small pop.
  const k = out(span(t, 0.2, 2.1));
  el("num").textContent = cover ? "100" : String(Math.round(100 * k));
  const pop = span(t, 2.1, 2.45); el("num").style.transform = "scale(" + (1 + 0.08 * Math.sin(Math.PI * pop)) + ")";
  el("h1").style.opacity = cover ? 1 : out(span(t, 2.2, 2.6));
  // Feathers drift down once it lands.
  FALL.forEach((p, i) => {
    const f = span(t, 2.15 + p.d, 3.6 + p.d), g = el("fe" + i);
    g.style.opacity = cover ? 0 : (f > 0 && f < 1 ? Math.min(1, f * 6) * (1 - span(f, 0.75, 1)) : 0);
    g.setAttribute("transform", "translate(" + (p.x + 40 * Math.sin(f * 6 + i)) + " " + (-60 + 1500 * f) + ") rotate(" + (p.r + 220 * f) + ") scale(" + p.s + ")");
  });
  // The kestrel swoops across between the 2 halves.
  const s = span(t, 3.0, 4.0), flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  el("bird").setAttribute("transform", "translate(" + (-400 + 1900 * s) + " " + (1050 - 160 * Math.sin(Math.PI * s)) + ") scale(2.4) rotate(" + (-8 + 16 * s) + ")");
  el("bird").style.opacity = t > 2.95 && t < 4.05 && !cover ? 1 : 0;
  // What has been posted so far: the thumbnails pop in 1 at a time, each slightly tilted.
  io("b", 3.6, 8.4)(t);
  for (let i = 0; i < 6; i++) { const v = span(t, 4.3 + i * 0.28, 4.75 + i * 0.28), e = el("t" + i); e.style.opacity = clamp(v * 2); e.style.transform = "rotate(" + ${JSON.stringify(TILT)}[i] + "deg) scale(" + (0.6 + 0.4 * back(v)) + ")"; }
  io("c", 8.4, 10.9)(t);
  el("end").style.opacity = span(t, 10.7, 11.1);
  const show = (id, a) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 20 * (1 - v) + "px)"; };
  show("e1", 11.3); show("e2", 11.8);
};
window.cover = () => window.render(2.8, true);
</script></body></html>`;

const file = join(OUT, "100-thanks-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.2, 2.7, 3.5, 6.5, 9.6, 12.8]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `t100-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "100-thanks-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "100-thanks-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

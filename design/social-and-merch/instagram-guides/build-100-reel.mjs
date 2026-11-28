// "Nearly 100 followers" Reel (Steve, 21st November 2026, to post the same day): thank you, help us reach 100, send this to someone who
// should follow us (a rolling list of eye care people), then pre launch is open for candidates, clinics and suppliers.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-100-reel.mjs
// 1080 x 1920, 30 frames a second, 14 seconds, no sound. Needs ffmpeg. The cover is built at the end.
// The counter never claims an exact number: it climbs and stops at "100?", since the account is nearly there.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 14;

const WHO = ["the optician who knows every frame", "the clinic owner who&apos;s hiring", "the new OD deciding what&apos;s next", "the rep who visits every clinic", "the assistant who runs pre testing"];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Nearly 100</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#a{left:80px;right:80px;top:420px}
#num{font-family:'DM Serif Display';font-size:420px;line-height:.9;color:${C.navy}}
#num span{color:${C.chestnut}}
#b{left:80px;right:80px;top:420px;opacity:0}
.who{position:absolute;left:0;right:0;font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.chestnut};opacity:0}
#c{left:80px;right:80px;top:420px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">THANK YOU</p>
<div class="abs" id="a">
<p id="num">0</p>
<p style="font-family:'DM Serif Display';font-size:92px;line-height:1.06;color:${C.navy};margin-top:40px">Nearly 100 followers<br><span style="color:${C.chestnut}">in our first week.</span></p>
<p style="font-family:Poppins;font-size:42px;color:${C.slate};margin-top:36px">Thank you. Help us get there?</p>
</div>
<div class="abs" id="b">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}">Send this to someone who should follow us:</p>
<div style="position:relative;height:300px;margin-top:70px">${WHO.map((w, i) => `<p class="who" id="w${i}">${w}</p>`).join("")}</div>
</div>
<div class="abs" id="c">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}">Pre launch is open</p>
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.chestnut}">for candidates, clinics and suppliers.</p>
<p style="font-family:Poppins;font-size:46px;line-height:1.4;color:${C.slate};margin-top:50px">Come and take a look around.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:42px;color:${C.chestnut};margin-top:40px">Link in bio</p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}</g></svg>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const el = (id) => document.getElementById(id);
const io = (id, a, b, d = 30) => (t) => { const i = out(span(t, a, a + 0.5)), o = span(t, b - 0.35, b), e = el(id); e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + d * (1 - i) + "px)"; };
window.render = (t, cover = false) => {
  el("label").style.opacity = out(span(t, 0, 0.4)) * (1 - span(t, 3.0, 3.3));
  io("a", 0, 3.3, 20)(t);
  // The counter climbs quickly, slows near the top, and lands on "100?": nearly there.
  const k = out(span(t, 0.2, 2.0)), n = Math.round(96 * k);
  el("num").innerHTML = cover || k >= 1 ? '100<span>?</span>' : String(n);
  // The kestrel swoops across between the 2 halves.
  const s = span(t, 3.0, 4.0), flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  el("bird").setAttribute("transform", "translate(" + (-400 + 1900 * s) + " " + (1050 - 160 * Math.sin(Math.PI * s)) + ") scale(2.4) rotate(" + (-8 + 16 * s) + ")");
  el("bird").style.opacity = t > 2.95 && t < 4.05 && !cover ? 1 : 0;
  io("b", 3.6, 10.1)(t);
  for (let i = 0; i < 5; i++) { const a = 4.6 + i * 1.05, v = out(span(t, a, a + 0.3)) * (1 - span(t, a + 0.85, a + 1.05)); const e = el("w" + i); e.style.opacity = i === 4 ? out(span(t, a, a + 0.3)) * (1 - span(t, 9.8, 10.1)) : v; e.style.transform = "translateY(" + 40 * (1 - out(span(t, a, a + 0.3))) + "px)"; }
  io("c", 10.1, 12.4)(t);
  el("end").style.opacity = span(t, 12.2, 12.6);
  const show = (id, a) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 20 * (1 - v) + "px)"; };
  show("e1", 12.7); show("e2", 13.1);
};
window.cover = () => window.render(2.4, true);
</script></body></html>`;

const file = join(OUT, "100-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.2, 2.6, 3.5, 6.0, 11.0, 13.6]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `h-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "100-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "100-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

// The first clip for the "pov: giving out my personal number" Edits template (Steve, 28th November 2026). Steve keeps the template's own
// second clip and music and changes its caption, so only this clip is made here: a job ad with "Salary: competitive" being posted.
// The template's first slot lasts about 2.9 seconds; this clip runs 3.4 so Edits can trim it. The top of the frame is left clear for
// the template's "pov:" caption, which Steve types in Edits. No music, no other people's footage.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-pov-clip.mjs
// 1080 x 1920, 30 frames a second, 3.4 seconds. Needs ffmpeg.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", buff: "#D8B48A", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 3.4;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>pov clip</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
#card{left:110px;right:110px;top:760px;padding:64px 64px 56px;border-radius:24px;background:${C.paper};border:3px solid ${C.line};box-shadow:0 30px 60px rgba(0,0,0,.35)}
.old{font-family:Arial,Helvetica,sans-serif;font-size:46px;color:#5F6670;margin-top:22px}
#sal{position:relative;display:inline-block;font-weight:700;color:#3E4550;isolation:isolate;font-size:54px}
#hl{position:absolute;left:-10px;top:8px;height:52px;width:0;background:${C.buff};opacity:.55;border-radius:6px;z-index:-1}
#btn{margin-top:56px;display:inline-flex;align-items:center;gap:16px;padding:26px 54px;border-radius:8px;background:${C.chestnut};font-family:Poppins;font-weight:600;font-size:44px;color:${C.cream}}
#posted{left:0;right:0;top:1560px;text-align:center;opacity:0}
</style></head><body><div id="f">
<div class="abs" id="card">
<p style="font-family:'DM Serif Display';font-size:84px;line-height:1.05;color:${C.navy}">Optician wanted</p>
<p class="old">Busy, fast paced clinic</p>
<p class="old"><span id="sal"><span id="hl"></span>Salary: competitive</span></p>
<p class="old">Apply with your resume</p>
<div id="btn"><span id="btxt">Post job</span></div>
</div>
<div class="abs" id="posted"><span style="display:inline-flex;align-items:center;gap:18px;padding:20px 40px;border-radius:999px;background:${C.cream};font-family:Poppins;font-weight:600;font-size:42px;color:${C.navy}">
<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="${C.chestnut}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Posted</span></div>
<svg class="abs" id="cur" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="arrow"><path d="M0 0 L0 64 L16 49 L28 76 L40 70 L28 44 L50 44 Z" fill="${C.cream}" stroke="${C.navy}" stroke-width="4" stroke-linejoin="round"/></g></svg>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
window.render = (t) => {
  // The highlighter runs across "Salary: competitive" so it reads at a glance.
  el("hl").style.width = (io(span(t, 0.15, 0.75)) * 560) + "px";
  // The pointer glides to the button and clicks it, confidently.
  const b = el("btn").getBoundingClientRect(), tx = b.left + b.width * 0.6, ty = b.top + b.height * 0.55;
  const m = io(span(t, 0.5, 1.35)), x = 980 + (tx - 980) * m, y = 1780 + (ty - 1780) * m;
  const press = Math.sin(Math.PI * span(t, 1.4, 1.62));
  el("arrow").setAttribute("transform", "translate(" + x + " " + y + ") scale(" + (1 - 0.15 * press) + ")");
  el("btn").style.transform = "scale(" + (1 - 0.06 * press) + ")";
  el("btxt").textContent = t > 1.55 ? "Posted" : "Post job";
  // A small, satisfied "Posted".
  const p = span(t, 1.65, 2.0); el("posted").style.opacity = clamp(p * 2); el("posted").style.transform = "scale(" + (0.7 + 0.3 * back(p)) + ")";
};
</script></body></html>`;

const file = join(OUT, "pov-clip.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [0.4, 1.2, 1.5, 2.4]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `pov-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "pov-clip.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let i = 0; i < Math.round(FPS * SECONDS); i++) {
  await tab.evaluate((t) => window.render(t), i / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
// The cover (Steve, 28th November 2026): the ad with the highlight drawn and the "pov" line above it, inside the 4:5 grid crop.
await tab.evaluate(() => {
  window.render(1.0);
  document.getElementById("cur").style.display = "none";
  document.getElementById("card").style.top = "820px";
  const p = document.createElement("p");
  p.style.cssText = "position:absolute;left:90px;right:90px;top:420px;font-family:'DM Serif Display';font-size:92px;line-height:1.06;color:#F7F1E6";
  p.innerHTML = 'pov: posting your job ad with <span style="color:#D8B48A">&quot;salary: competitive&quot;</span>';
  document.getElementById("f").appendChild(p);
});
await frame.screenshot({ path: join(OUT, "pov-clip-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

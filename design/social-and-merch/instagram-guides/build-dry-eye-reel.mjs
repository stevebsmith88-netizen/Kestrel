// "I'm not crying" Reel (Steve, 28th November 2026): a winter "Things heard in clinic" card that comes to life. A patient's line, a line
// drawn eye that blinks and sheds 1 tear, snow drifting, then the twist: watery eyes can be a sign of dry eye. Light and funny, with no
// medical advice beyond "book in with your optometrist" and no products or brands.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-dry-eye-reel.mjs
// 1080 x 1920, 30 frames a second, 16.5 seconds, no sound. Needs ffmpeg. The cover is built at the end.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", buff: "#D8B48A", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 16.5;
const SNOW = Array.from({ length: 26 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1920, r: 4 + (i % 4) * 2, v: 60 + (i % 5) * 22, w: (i * 1.7) % 6.28 }));

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Not crying</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
.kick{font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:.26em}
#c2{position:absolute;inset:0;background:${C.cream};transform:translateY(100%)}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
</style></head><body><div id="f">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s, i) => `<circle id="sn${i}" r="${s.r}" fill="${C.cream}" opacity=".5"/>`).join("")}</svg>
<p class="abs kick" style="left:90px;top:300px;color:${C.buff}">THINGS HEARD IN CLINIC</p>
<p class="abs" style="right:90px;top:290px;font-family:'DM Serif Display';font-size:40px;color:${C.buff}">Winter edition</p>
<svg class="abs" style="left:90px;top:400px;overflow:visible" width="420" height="280" viewBox="0 0 300 200">
<g id="eye" style="transform-origin:150px 100px"><path d="M10 100 Q150 -20 290 100 Q150 220 10 100 Z" fill="none" stroke="${C.buff}" stroke-width="12" stroke-linejoin="round"/>
<circle cx="150" cy="100" r="44" fill="none" stroke="${C.buff}" stroke-width="12"/><circle cx="150" cy="100" r="14" fill="${C.buff}"/></g>
${[0, 1, 2].map((i) => `<path id="tear${i}" d="M0 -26 C 10 -8 18 4 18 14 A 18 18 0 0 1 -18 14 C -18 4 -10 -8 0 -26 Z" fill="${C.mist}" opacity="0"/>`).join("")}
</svg>
<div class="abs" style="left:90px;right:90px;top:800px">
<p id="q1" style="font-family:'DM Serif Display';font-size:124px;line-height:1.02;color:${C.cream};opacity:0">&quot;I&apos;m not crying.</p>
<p id="q2" style="font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.buff};margin-top:20px;opacity:0">My eyes just water when I go outside.&quot;</p>
<p id="q3" style="font-family:Poppins;font-size:36px;color:${C.mist};margin-top:60px;opacity:0">Said every winter. Meant every time.</p>
</div>
<div class="abs" style="left:90px;top:1560px;display:flex;align-items:center;gap:22px"><img src="${brand("kestrel-k-mark-reversed.svg")}" alt="" style="height:50px"><span style="font-family:Poppins;font-size:30px;letter-spacing:.06em;color:${C.mist}">eyecarejobs.ca</span></div>
<div id="c2">
<p class="abs kick" style="left:90px;top:300px;color:${C.chestnut}">THINGS HEARD IN CLINIC</p>
<div class="abs" style="left:90px;right:90px;top:600px">
<p id="p1" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.chestnut};opacity:0">Plot twist:</p>
<p id="p2" style="font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.navy};margin-top:30px;opacity:0">Watery eyes can be a sign of <span style="color:${C.chestnut}">dry eye.</span></p>
<p id="p3" style="font-family:Poppins;font-size:40px;line-height:1.45;color:${C.slate};margin-top:60px;opacity:0">Cold wind out, heating on. Gritty, watery or tired eyes? Book in with your optometrist.</p>
</div>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every eye care job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:42px;color:${C.chestnut};margin-top:40px">Link in bio</p>
</div>
</div>
<script>
const SNOW = ${JSON.stringify(SNOW)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
const show = (id, t, a, d = 24) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + d * (1 - v) + "px)"; };
window.render = (t, cover = false) => {
  // Snow drifts down and sways gently.
  SNOW.forEach((s, i) => { const y = (s.y + s.v * t) % 1960 - 20; const c = el("sn" + i); c.setAttribute("cx", s.x + 18 * Math.sin(t * 0.8 + s.w)); c.setAttribute("cy", y); });
  // The eye blinks twice, quickly, the way a dry eye does.
  const blink = (a) => { const b = span(t, a, a + 0.22); return 1 - 0.9 * Math.sin(Math.PI * b); };
  el("eye").style.transform = "scaleY(" + (cover ? 1 : Math.min(blink(1.3), blink(4.7), blink(6.9))) + ")";
  // 3 tears form at the outer corner, 1 after another, and roll down (Steve: a couple of tear drops, and hold each part longer).
  [1.8, 3.9, 5.9].forEach((a, i) => {
    const tf = span(t, a, a + 0.5), tr = io(span(t, a + 0.5, a + 1.9)), e = el("tear" + i);
    const show = cover ? (i === 0 ? 0.95 : 0) : 0.95 * out(tf) * (1 - span(t, a + 1.7, a + 2.0));
    e.setAttribute("opacity", show);
    e.setAttribute("transform", "translate(" + (282 - 8 * i + 6 * tr) + " " + (cover ? 150 : 118 + 120 * tr) + ") scale(" + (0.4 + 0.6 * out(tf)) * (1 - 0.12 * i) + ")");
  });
  show("q1", t, 0.5); show("q2", t, 2.4); show("q3", t, 3.9, 16);
  if (cover) { ["q1", "q2", "q3"].forEach((id) => { el(id).style.opacity = 1; el(id).style.transform = "none"; }); }
  // The cream card slides up for the twist.
  const c = cover ? 0 : io(span(t, 8.0, 8.6)); el("c2").style.transform = "translateY(" + 100 * (1 - c) + "%)";
  show("p1", t, 8.7); show("p2", t, 9.2); show("p3", t, 10.6, 16);
  el("end").style.opacity = cover ? 0 : span(t, 13.9, 14.3);
  show("e1", t, 14.5, 20); show("e2", t, 15.0, 20);
};
window.cover = () => window.render(4.4, true);
</script></body></html>`;

const file = join(OUT, "dry-eye-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [2.6, 4.7, 6.7, 8.3, 12.0, 15.8]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `dry-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "dry-eye-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "dry-eye-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

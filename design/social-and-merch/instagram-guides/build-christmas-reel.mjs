// "All I want for Christmas is a job in eye care" Reel (Steve, 28th November 2026). Timed to All I Want for Christmas Is You from
// about 0:38.6 (the last "All I want for Christmas is youuu" of the intro) to about 0:55.5 (after the drum fill, before the verse),
// measured from Steve's screen recording: the long "you" is held to 9.95 seconds, a hush to 10.9, the bells come in at 10.95, the bass at
// 15.05 and the drum fill at 15.85. Steve adds the song in Instagram; it is not in this file.
// The bird is the shared illustration (not the logo) wearing a hat in the brand colours. The sign off says "Happy holidays" so it
// includes everyone.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-christmas-reel.mjs
// 1080 x 1920, 30 frames a second, 16.9 seconds, no sound. Needs ffmpeg. The cover is its own simple design, built at the end.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY, PERCH } from "./kestrel-bird-side.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", deep: "#8C4024", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", buff: "#D8B48A", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 16.9;
const T = { you: 2.75, hush: 9.95, bells: 10.95, bass: 15.05, drum: 15.85 };

// A hat in the brand colours, sat on a head centred at (x, y) (the bird's HEAD() in kestrel-bird-side.mjs), its tip trailing back.
const HAT = (x, y) => `<g>
  <path d="M${x - 30} ${y - 26} C ${x - 24} ${y - 70}, ${x - 40} ${y - 92}, ${x - 72} ${y - 98} C ${x - 44} ${y - 80}, ${x + 10} ${y - 70}, ${x + 30} ${y - 30} Z" fill="${C.chestnut}"/>
  <path d="M${x - 30} ${y - 26} C ${x - 24} ${y - 60}, ${x - 34} ${y - 80}, ${x - 56} ${y - 92}" fill="none" stroke="${C.deep}" stroke-width="5" opacity=".6"/>
  <rect x="${x - 38}" y="${y - 38}" width="74" height="18" rx="9" fill="${C.cream}" transform="rotate(-6 ${x} ${y - 30})"/>
  <circle cx="${x - 74}" cy="${y - 98}" r="12" fill="${C.cream}"/></g>`;
const SNOW = Array.from({ length: 30 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1920, r: 4 + (i % 4) * 2, v: 50 + (i % 5) * 20, w: (i * 1.7) % 6.28 }));
const LINES = [{ t: "A job I actually love", a: T.you }, { t: "A team that has my back", a: 4.9 }, { t: "The pay, shown up front", a: 7.0, tick: true }];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>All I want</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
#card{left:80px;right:80px;top:900px;padding:64px 60px 56px;border-radius:24px;background:${C.paper};border:3px solid ${C.line};opacity:0}
.ln{display:flex;align-items:center;gap:26px;margin-top:40px;opacity:0}
.dot{width:16px;height:16px;border-radius:50%;background:${C.buff};flex:none}
.lt{font-family:'DM Serif Display';font-size:56px;line-height:1.1;color:${C.navy}}
#head{left:90px;right:90px;top:700px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
#cov{position:absolute;inset:0;background:${C.navy};display:none}
</style></head><body><div id="f">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s, i) => `<circle id="sn${i}" r="${s.r}" fill="${C.cream}" opacity=".5"/>`).join("")}</svg>
<div class="abs" id="card">
<p style="font-family:'DM Serif Display';font-size:78px;color:${C.chestnut}">Dear Santa,</p>
${LINES.map((l, i) => `<div class="ln" id="l${i}"><span class="dot"></span><p class="lt">${l.t}</p>${l.tick ? `<svg id="tick" viewBox="0 0 24 24" width="70" height="70" fill="none" stroke="${C.chestnut}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path id="tp" d="M5 12.5l4.5 4.5L19 7.5" stroke-dasharray="24" stroke-dashoffset="24"/></svg>` : ""}</div>`).join("")}
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="perchbird">${PERCH.replace('id="perch"', 'id="pb"')}${HAT(16, -186)}</g></svg>
<div class="abs" id="head">
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.cream}">All I want for Christmas is</p>
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.buff};margin-top:10px">a job in eye care.</p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}${HAT(96, -14)}</g></svg>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:72px;color:${C.navy};margin-top:80px">Happy holidays</p>
<p id="e1b" style="font-family:'DM Serif Display';font-size:56px;color:${C.chestnut};margin-top:10px">from the Kestrel team</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.slate};margin-top:60px">Pre launch is open: link in bio</p>
</div>
<div id="cov">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.cream}" opacity=".45"/>`).join("")}</svg>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g transform="translate(760 1000) scale(1.6)"><path d="M-170 6 Q-20 -8 150 14" fill="none" stroke="${C.deep}" stroke-width="14" stroke-linecap="round"/><path d="M-150 -2 Q-40 -20 60 -8 Q-40 -2 -150 -2 Z" fill="${C.cream}"/>${PERCH.replace('id="perch"', 'id="cpb"')}${HAT(16, -186)}</g></svg>
<div class="abs" style="left:90px;right:90px;top:1120px">
<p style="font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.cream}">All I want for Christmas is</p>
<p style="font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.buff};margin-top:10px">a job in eye care.</p>
</div>
</div>
</div>
<script>
const SNOW = ${JSON.stringify(SNOW)}, LINES = ${JSON.stringify(LINES)}, T = ${JSON.stringify(T)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
const show = (id, t, a, d = 24) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + d * (1 - v) + "px)"; };
window.render = (t) => {
  SNOW.forEach((s, i) => { const c = el("sn" + i); c.setAttribute("cx", s.x + 18 * Math.sin(t * 0.8 + s.w)); c.setAttribute("cy", (s.y + s.v * t) % 1960 - 20); });
  // The slow intro: the wish list and the perched bird, 1 wish per phrase, the tick on the long "you".
  const cardIn = out(span(t, 0, 0.7)), away = io(span(t, T.bells, T.bells + 0.45));
  el("card").style.opacity = cardIn * (1 - away); el("card").style.transform = "translateY(" + (40 * (1 - cardIn) + 60 * away) + "px)";
  LINES.forEach((l, i) => { const v = out(span(t, l.a, l.a + 0.6)), e = el("l" + i); e.style.opacity = v; e.style.transform = "translateX(" + -30 * (1 - v) + "px)"; });
  el("tp").setAttribute("stroke-dashoffset", 24 * (1 - out(span(t, 8.2, 8.8))));
  // The bird sits on the top corner of the list, bobs gently, and during the hush gives a small hop of anticipation.
  const bob = 4 * Math.sin(t * 2.2), hop = 26 * Math.sin(Math.PI * span(t, T.hush + 0.35, T.hush + 0.75));
  el("perchbird").setAttribute("transform", "translate(850 " + (912 + bob - hop) + ") scale(1.4)");
  el("perchbird").style.opacity = cardIn * (t < T.bells ? 1 : 0);
  // The bells: the bird takes off and swoops across, hat on, as the line lands.
  const s = span(t, T.bells, T.bells + 1.6), flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  // 1 clean swoop: off the perch, up and over the line, away to the left, facing the way it flies.
  const x = 850 - 1250 * io(s), y = 760 - 300 * Math.sin(Math.PI * Math.min(1, s * 1.1));
  el("bird").setAttribute("transform", "translate(" + x + " " + y + ") scale(-1.35 1.35) rotate(" + (-10 + 16 * s) + ")");
  el("bird").style.opacity = t >= T.bells && s < 1 ? 1 : 0;
  show("head", t, T.bells + 0.5, 30); el("head").style.opacity = parseFloat(el("head").style.opacity) * (1 - span(t, 13.9, 14.25));
  el("end").style.opacity = span(t, 14.0, 14.45);
  show("e1", t, 14.3, 20); show("e1b", t, 14.7, 20); show("e2", t, T.drum, 16);
};
window.cover = () => { window.render(0); el("cov").style.display = "block"; };
</script></body></html>`;

const file = join(OUT, "christmas-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.0, 5.5, 9.0, 10.3, 11.4, 12.0, 13.2, 16.3]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `xm-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  await tab.evaluate(() => window.cover());
  await frame.screenshot({ path: join(process.env.STILLS, `xm-cover.jpg`), type: "jpeg", quality: 80 });
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
  await tab.goto(pathToFileURL(file).href); await tab.evaluate(() => document.fonts.ready);
}
const mp4 = join(OUT, "christmas-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let i = 0; i < Math.round(FPS * SECONDS); i++) {
  await tab.evaluate((t) => window.render(t), i / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
await tab.evaluate(() => window.cover());
await frame.screenshot({ path: join(OUT, "christmas-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

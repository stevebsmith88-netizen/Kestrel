// "It's the most wonderful time of the year… to sign up to Kestrel" Reel (Steve, 28th November 2026), for candidates and clinics.
// Timed to It's the Most Wonderful Time of the Year (Andy Williams) from where Instagram's picker starts it (Steve's screen recording
// and timings): a waltz with a bar every 0.875 seconds; "It's the most wonderful time" at bar 0 (1.0 s), "With the kids jingle belling"
// at bar 8, "And everyone telling you" at bar 10, the second "most wonderful time" at bar 16. Steve adds the song in Instagram.
// Claims are only what Kestrel does or has said it will do: pay on every job, job alerts, clinic profiles, and no card to post during
// the free launch.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-wonderful-reel.mjs
// 1080 x 1920, 30 frames a second, 21 seconds, no sound. Needs ffmpeg. The cover is its own simple design.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY, PERCH } from "./kestrel-bird-side.mjs";
import { HAT, BEAK, TREE } from "./kestrel-christmas.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", buff: "#D8B48A", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 21;
const BAR = 0.875, BR = (n) => 1.0 + n * BAR;
const SNOW = Array.from({ length: 30 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1920, r: 4 + (i % 4) * 2, v: 50 + (i % 5) * 20, w: (i * 1.7) % 6.28 }));
const CARDS = [
  { id: "cand", label: "CANDIDATES", top: 830, at: 8, items: ["Set your role and province", "Job alerts for jobs that fit", "Every job shows its pay"] },
  { id: "clin", label: "CLINICS", top: 1230, at: 10, items: ["Set up your clinic profile", "Post with the pay up front", "Free to post during the launch"] },
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Most wonderful</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
.big{font-family:'DM Serif Display';font-size:96px;line-height:1.05}
.card{position:absolute;left:80px;width:720px;border-radius:22px;background:${C.paper};border:3px solid ${C.line};padding:34px 34px 28px;box-sizing:border-box;opacity:0}
.lab{font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:.22em;color:${C.chestnut}}
.it{display:flex;align-items:center;gap:16px;margin-top:18px;font-family:'DM Serif Display';font-size:41px;line-height:1.15;color:${C.navy};opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
#cov{position:absolute;inset:0;background:${C.navy};display:none}
</style></head><body><div id="f">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s, i) => `<circle id="sn${i}" r="${s.r}" fill="${C.cream}" opacity=".5"/>`).join("")}</svg>
<div class="abs" id="h1" style="left:80px;right:80px;top:300px;opacity:0"><p class="big" style="color:${C.cream};font-size:88px">It&apos;s the most wonderful time of the year&hellip;</p>
<p class="big" id="h1b" style="color:${C.buff};margin-top:16px;opacity:0;font-size:88px">to sign up to Kestrel.</p></div>
${CARDS.map((c) => `<div class="card" id="${c.id}" style="top:${c.top}px"><p class="lab">${c.label}</p>${c.items.map((t, i) => `<div class="it" id="${c.id}${i}"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="${C.chestnut}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${t}</div>`).join("")}</div>`).join("")}
<div class="abs" id="h2" style="left:80px;right:80px;top:440px;opacity:0"><p class="big" style="color:${C.cream}">Pre launch is open</p>
<p class="big" style="color:${C.buff};margin-top:10px">for candidates, clinics and suppliers.</p></div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="hero">${TREE}<g id="perch">${PERCH.replace('id="perch"', 'id="pb"')}${BEAK(16, -186)}${HAT(16, -186)}</g></g></svg>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}${BEAK(96, -14)}${HAT(96, -14)}</g></svg>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Happy holidays</p>
<p id="e1b" style="font-family:'DM Serif Display';font-size:52px;color:${C.chestnut};margin-top:10px">from the Kestrel team</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.slate};margin-top:50px">Link in bio</p>
</div>
<div id="cov">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.cream}" opacity=".45"/>`).join("")}</svg>
<div class="abs" style="left:90px;right:90px;top:300px"><p class="big" style="color:${C.cream};font-size:88px">It&apos;s the most wonderful time of the year&hellip;</p>
<p class="big" style="color:${C.buff};margin-top:16px;font-size:88px">to sign up to Kestrel.</p></div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g transform="translate(540 1000) scale(0.85)">${TREE}${PERCH.replace('id="perch"', 'id="cpb"')}${BEAK(16, -186)}${HAT(16, -186)}</g></svg>
</div>
</div>
<script>
const SNOW = ${JSON.stringify(SNOW)}, CARDS = ${JSON.stringify(CARDS)};
const BAR = ${BAR}, BR = (n) => 1.0 + n * BAR;
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
window.render = (t) => {
  SNOW.forEach((s, i) => { const c = el("sn" + i); c.setAttribute("cx", s.x + 18 * Math.sin(t * 0.8 + s.w)); c.setAttribute("cy", (s.y + s.v * t) % 1960 - 20); });
  // The opening line, then the twist half a phrase later.
  const h = out(span(t, BR(0), BR(0) + 0.5)) * (1 - span(t, BR(15.5), BR(16))); el("h1").style.opacity = h; el("h1").style.transform = "translateY(" + 26 * (1 - out(span(t, BR(0), BR(0) + 0.5))) + "px)";
  el("h1b").style.opacity = out(span(t, BR(4), BR(4) + 0.5));
  // The 2 cards bounce in on their lines; each tick arrives on the next beat of the waltz (a third of a bar).
  CARDS.forEach((c) => {
    const v = span(t, BR(c.at), BR(c.at) + 0.45), e = el(c.id);
    e.style.opacity = clamp(v * 2) * (1 - span(t, BR(15.5), BR(16))); e.style.transform = "scale(" + (0.85 + 0.15 * back(v)) + ")";
    c.items.forEach((_, i) => { const a = BR(c.at) + 0.35 + i * (BAR * 2 / 3), w = out(span(t, a, a + 0.3)), it = el(c.id + i); it.style.opacity = w; it.style.transform = "translateX(" + -20 * (1 - w) + "px)"; });
  });
  // The hero: the tree, centre stage, with the bird on top like the star. As the cards arrive it moves down into the corner.
  const mv = io(span(t, BR(7.5), BR(8.3)));
  const hx = 540 + (940 - 540) * mv, hy = 1000 + (1250 - 1000) * mv, hs = 0.85 + (0.55 - 0.85) * mv;
  el("hero").setAttribute("transform", "translate(" + hx + " " + hy + ") scale(" + hs + ")");
  const sway = 4 * Math.sin((t - 1.0) * 2 * Math.PI / BAR);
  el("perch").setAttribute("transform", "rotate(" + sway + " 0 -100)");
  el("perch").style.opacity = t < BR(16) ? 1 : 0;
  const s = span(t, BR(16), BR(16) + 1.8), flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  el("bird").setAttribute("transform", "translate(" + (940 - 1350 * io(s)) + " " + (1150 - 120 * Math.sin(Math.PI * 0.5 * Math.min(1, s * 1.3)) + 40 * s) + ") scale(-1.3 1.3) rotate(" + (-14 + 10 * s) + ")");
  el("bird").style.opacity = t >= BR(16) && s < 1 ? 1 : 0;
  const h2 = out(span(t, BR(16) + 0.4, BR(16) + 0.9)) * (1 - span(t, BR(19.5), BR(20))); el("h2").style.opacity = h2; el("h2").style.transform = "translateY(" + 26 * (1 - h2) + "px)";
  el("end").style.opacity = span(t, BR(20), BR(20) + 0.4);
  const show = (id, a) => { const v = out(span(t, a, a + 0.45)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 18 * (1 - v) + "px)"; };
  show("e1", BR(20.6)); show("e1b", BR(21.2)); show("e2", BR(22));
};
window.cover = () => { window.render(0); el("cov").style.display = "block"; };
</script></body></html>`;

const file = join(OUT, "wonderful-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [2.0, 6.0, 9.5, 13.0, 15.8, 17.5, 20.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `wd-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  await tab.evaluate(() => window.cover());
  await frame.screenshot({ path: join(process.env.STILLS, `wd-cover.jpg`), type: "jpeg", quality: 80 });
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
  await tab.goto(pathToFileURL(file).href); await tab.evaluate(() => document.fonts.ready);
}
const mp4 = join(OUT, "wonderful-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "wonderful-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

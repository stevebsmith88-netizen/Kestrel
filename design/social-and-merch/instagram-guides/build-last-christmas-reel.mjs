// "Last Christmas" Reel (Steve, 28th November 2026), for candidates: last Christmas the resume went out and nothing came back; this year
// Kestrel. Timed to Last Christmas from where Steve's screen recording starts (about 107 beats a minute): "Last Christmas" at 2.24
// seconds, "the very next day" at 6.73, "this year" at 11.22, "someone special" at 15.71, each 8 beats apart. Steve adds the song in
// Instagram. Claims are only what Kestrel does: every job shows its pay, candidates apply only for roles that fit their profession, and
// the tracker keeps every application in 1 place.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-last-christmas-reel.mjs
// 1080 x 1920, 30 frames a second, 20 seconds, no sound. Needs ffmpeg. The cover is its own simple design.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY, PERCH } from "./kestrel-bird-side.mjs";
import { HAT, BEAK, BRANCH } from "./kestrel-christmas.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", buff: "#D8B48A", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 20;
const BEAT = 0.561, B = (n) => 0.56 + n * BEAT; // beat 3 is "Last Christmas"
const T = { l1: B(3), l2: B(11), l3: B(19), l4: B(27) };
const SNOW = Array.from({ length: 30 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1920, r: 4 + (i % 4) * 2, v: 50 + (i % 5) * 20, w: (i * 1.7) % 6.28 }));
const PERKS = [{ t: "Every job shows its pay.", n: 22 }, { t: "Apply for the roles that fit you.", n: 23.5 }, { t: "Track every application in 1 place.", n: 25 }];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Last Christmas</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
.big{font-family:'DM Serif Display';font-size:96px;line-height:1.05}
.say{left:90px;right:90px;top:300px;opacity:0}
.card{position:absolute;left:110px;width:560px;border-radius:22px;background:${C.paper};border:3px solid ${C.line};padding:44px 44px 40px;box-sizing:border-box;opacity:0}
.bar{height:16px;border-radius:8px;background:${C.line};margin-top:18px}
.perk{display:flex;align-items:center;gap:22px;margin-top:40px;opacity:0;font-family:'DM Serif Display';font-size:54px;line-height:1.1;color:${C.cream}}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
#cov{position:absolute;inset:0;background:${C.navy};display:none}
</style></head><body><div id="f">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s, i) => `<circle id="sn${i}" r="${s.r}" fill="${C.cream}" opacity=".5"/>`).join("")}</svg>
<p class="abs say big" id="s0" style="color:${C.cream}">Candidates,<br><span style="color:${C.buff}">this one&apos;s for you.</span></p>
<p class="abs say big" id="s1" style="color:${C.cream}">Last Christmas, I sent off my resume&hellip;</p>
<p class="abs say big" id="s2" style="color:${C.cream}">&hellip;but the very next day: <span style="color:${C.buff}">no reply.</span></p>
<p class="abs" id="s2b" style="left:90px;right:90px;top:640px;font-family:Poppins;font-size:42px;color:${C.mist};opacity:0">And no idea what it paid, either.</p>
<p class="abs say big" id="s3" style="color:${C.cream}">This year, to save me from tears&hellip;</p>
<div class="abs" id="perks" style="left:90px;right:60px;top:700px">${PERKS.map((p, i) => `<div class="perk" id="p${i}"><svg viewBox="0 0 24 24" width="62" height="62" fill="none" stroke="${C.buff}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>${p.t}</div>`).join("")}</div>
<div class="card" id="resume" style="top:860px">
<p style="font-family:'DM Serif Display';font-size:52px;color:${C.navy}">My resume</p>
<div class="bar" style="width:80%"></div><div class="bar" style="width:62%"></div><div class="bar" style="width:72%"></div><div class="bar" style="width:48%"></div>
<p id="sent" style="margin-top:30px;font-family:Poppins;font-weight:600;font-size:36px;color:${C.chestnut};opacity:0">Sent</p>
</div>
<div class="card" id="inbox" style="top:860px">
<p style="font-family:'DM Serif Display';font-size:52px;color:${C.navy}">Inbox</p>
<p style="margin-top:24px;font-family:Poppins;font-size:36px;color:${C.slate}">0 new messages</p>
<p id="later" style="margin-top:14px;font-family:Poppins;font-size:30px;color:${C.slate};opacity:0">1 day later&hellip; 1 week later&hellip;</p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="perch">${BRANCH}${PERCH.replace('id="perch"', 'id="pb"')}${BEAK(16, -186)}${HAT(16, -186)}</g></svg>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}${BEAK(96, -14)}${HAT(96, -14)}</g></svg>
<div id="end">
<p id="e0" style="font-family:'DM Serif Display';font-size:58px;color:${C.chestnut}">&hellip;I&apos;ll give it to someone special:</p>
<img id="e1" src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block;margin-top:70px">
<p id="e2" style="font-family:'DM Serif Display';font-size:60px;color:${C.navy};margin-top:70px">Pre launch is open.</p>
<p id="e3" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.slate};margin-top:24px">Create your account: link in bio</p>
</div>
<div id="cov">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.cream}" opacity=".45"/>`).join("")}</svg>
<div class="abs" style="left:90px;right:90px;top:430px"><p class="big" style="color:${C.cream}">Last Christmas, I sent off my resume&hellip;</p>
<p class="big" style="color:${C.buff};margin-top:30px">The very next day: no reply.</p></div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g transform="translate(780 1560) scale(1.4)">${BRANCH}${PERCH.replace('id="perch"', 'id="cpb"')}${BEAK(16, -186)}${HAT(16, -186)}</g></svg>
</div>
</div>
<script>
const SNOW = ${JSON.stringify(SNOW)}, T = ${JSON.stringify(T)}, PERKS = ${JSON.stringify(PERKS)};
const BEAT = ${BEAT}, B = (n) => 0.56 + n * BEAT;
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
const phase = (id, t, a, b, d = 26) => { const i = out(span(t, a, a + 0.45)), o = span(t, b - 0.3, b), e = el(id); e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + d * (1 - i) + "px)"; };
window.render = (t) => {
  SNOW.forEach((s, i) => { const c = el("sn" + i); c.setAttribute("cx", s.x + 18 * Math.sin(t * 0.8 + s.w)); c.setAttribute("cy", (s.y + s.v * t) % 1960 - 20); });
  phase("s0", t, 0.2, T.l1);
  phase("s1", t, T.l1, T.l2);
  // The resume goes off with high hopes.
  phase("resume", t, T.l1 + 0.3, T.l2 - 0.1, 40);
  el("sent").style.opacity = out(span(t, B(8), B(8) + 0.3));
  phase("s2", t, T.l2, T.l3); phase("s2b", t, B(15), T.l3, 16);
  // Then nothing: an empty inbox, and the days going by.
  phase("inbox", t, T.l2 + 0.2, T.l3, 40);
  el("later").style.opacity = out(span(t, B(13), B(13) + 0.4));
  phase("s3", t, T.l3, T.l4);
  PERKS.forEach((p, i) => { const v = out(span(t, B(p.n), B(p.n) + 0.4)), e = el("p" + i); e.style.opacity = v * (1 - span(t, T.l4 - 0.3, T.l4)); e.style.transform = "translateX(" + -30 * (1 - v) + "px)"; });
  // The bird sits on its branch, droops a little at "no reply", and takes off on "this year".
  const droop = 8 * span(t, T.l2, T.l2 + 0.6) * (1 - span(t, T.l3 - 0.4, T.l3)), bob = 4 * Math.sin(t * 2.2);
  el("perch").setAttribute("transform", "translate(820 " + (1600 + bob) + ") scale(1.3) rotate(" + droop + " 0 -100)");
  el("perch").style.opacity = t < T.l3 ? 1 : 0;
  const s = span(t, T.l3, T.l3 + 1.8), flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  const x = 820 - 1300 * io(s), y = 1380 - 700 * Math.sin(Math.PI * 0.5 * Math.min(1, s * 1.3)) + 200 * s;
  el("bird").setAttribute("transform", "translate(" + x + " " + y + ") scale(-1.3 1.3) rotate(" + (-14 + 10 * s) + ")");
  el("bird").style.opacity = t >= T.l3 && s < 1 ? 1 : 0;
  // Someone special: Kestrel.
  el("end").style.opacity = span(t, T.l4 - 0.1, T.l4 + 0.3);
  const show = (id, a) => { const v = out(span(t, a, a + 0.45)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 18 * (1 - v) + "px)"; };
  show("e0", T.l4 + 0.1); show("e1", B(28.5)); show("e2", B(30)); show("e3", B(31));
};
window.cover = () => { window.render(0); el("cov").style.display = "block"; };
</script></body></html>`;

const file = join(OUT, "last-christmas-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.2, 5.6, 9.5, 11.8, 14.8, 18.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `lc-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  await tab.evaluate(() => window.cover());
  await frame.screenshot({ path: join(process.env.STILLS, `lc-cover.jpg`), type: "jpeg", quality: 80 });
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
  await tab.goto(pathToFileURL(file).href); await tab.evaluate(() => document.fonts.ready);
}
const mp4 = join(OUT, "last-christmas-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "last-christmas-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

// "Which comes first?" Reel (Steve, 21st November 2026): the chicken and egg of a new job board. Clinics wait for candidates, candidates
// wait for jobs; on Kestrel, both start now, so when the jobs arrive the people are already here. Honest about pre launch.
// The egg is a kestrel egg (cream with reddish brown speckles, as real kestrel eggs are). It cracks; no chick, to keep the stylized kestrel.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-chicken-egg-reel.mjs
// 1080 x 1920, 30 frames a second, 16.5 seconds, no sound. Needs ffmpeg. The cover is built at the end.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672", shell: "#F1E2CC" };
const FPS = 30;
const SECONDS = 16.5;

// Speckles at fixed places so every build matches.
const SPECKS = [[-40, -90, 9], [25, -60, 6], [-10, -20, 11], [45, 5, 7], [-55, 30, 6], [15, 55, 9], [-25, 95, 7], [50, 80, 5], [5, -120, 5], [-60, -40, 5], [35, 120, 6]];
const OUTLINE = "M0 -170 C -95 -170 -130 -40 -130 40 C -130 120 -70 175 0 175 C 70 175 130 120 130 40 C 130 -40 95 -170 0 -170 Z";
const CRACK = [[-140, 10], [-90, -15], [-60, 15], [-25, -20], [5, 12], [40, -18], [72, 14], [100, -12], [140, 8]];
const crackPts = CRACK.map((p) => p.join(" ")).join(" L ");
// The egg cracks along the zigzag: the top piece and the bottom piece are the same egg, each clipped to its side of the crack.
const eggBody = `<path d="${OUTLINE}" fill="${C.shell}"/>${SPECKS.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.75}" fill="${C.chestnut}" opacity=".8"/>`).join("")}<path d="${OUTLINE}" fill="none" stroke="${C.navy}" stroke-width="6"/>`;
const EGG = `<defs>
  <clipPath id="topClip"><path d="M -200 -300 L 200 -300 L ${CRACK.slice().reverse().map((p) => p.join(" ")).join(" L ")} Z"/></clipPath>
  <clipPath id="botClip"><path d="M ${crackPts} L 200 300 L -200 300 Z"/></clipPath>
</defs>
<g id="egg">
  <g id="bot" clip-path="url(#botClip)">${eggBody}</g>
  <g id="top" clip-path="url(#topClip)">${eggBody}</g>
  <path id="crack" d="M ${crackPts}" fill="none" stroke="${C.navy}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</g>`;

// The twins (Steve, 21st November 2026): 2 small kestrels hatch and fly out, 1 for candidates in the usual colours and 1 for clinics in
// inverted colours (navy body, buff wings, chestnut markings). Each copy of the bird gets its own ids so its wings can beat on their own.
const twin = (n, inverted) => {
  let b = FLY.replace(/id="(fly|nearwing|farwing|tail)"/g, (m, id) => `id="${id}${n}"`);
  if (inverted) b = b.replaceAll("#A4502C", "@NAVY").replaceAll("#1B2B4B", "@CHESTNUT").replaceAll("#7F93AE", "#D8B48A").replaceAll("#6B7F9B", "#C49A6C")
    .replaceAll("@NAVY", "#1B2B4B").replaceAll("@CHESTNUT", "#A4502C");
  return b;
};
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Which comes first?</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#hook{left:80px;right:80px;top:330px;font-family:'DM Serif Display';font-size:130px;line-height:1;color:${C.navy}}
#loop{left:0;right:0;top:1180px;height:520px;opacity:0}
.card{position:absolute;top:150px;width:370px;padding:34px 0;border-radius:18px;background:${C.paper};border:3px solid ${C.line};text-align:center;font-family:'DM Serif Display';font-size:54px;color:${C.navy};box-shadow:0 14px 30px rgba(27,43,75,.1)}
.say{position:absolute;left:80px;right:80px;font-family:Poppins;font-weight:600;font-size:46px;line-height:1.35;color:${C.slate};opacity:0}
#msg{left:80px;right:80px;top:330px;opacity:0}
#two{left:80px;right:80px;top:1240px;display:grid;grid-template-columns:1fr 1fr;gap:30px;opacity:0}
.half{padding:36px;border-radius:18px;background:${C.paper};border:3px solid ${C.line}}
.half b{display:block;font-family:'DM Serif Display';font-weight:400;font-size:56px;color:${C.chestnut};margin-bottom:12px}
.half p{font-family:Poppins;font-size:34px;line-height:1.4;color:${C.navy}}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="hook">Which comes<br><span style="color:${C.chestnut}">first?</span></p>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="eggAt">${EGG}</g><g id="tw1" opacity="0">${twin(1, false)}</g><g id="tw2" opacity="0">${twin(2, true)}</g></svg>
<div class="abs" id="loop">
<div class="card" style="left:50px">Clinics</div><div class="card" style="right:50px">Candidates</div>
<svg class="abs" style="left:0;top:0" width="1080" height="520"><g id="spin" transform="translate(540 230)">
<path d="M-110 -60 A 125 125 0 0 1 110 -60" fill="none" stroke="${C.chestnut}" stroke-width="10" stroke-linecap="round"/><path d="M110 -60 l-6 -42 M110 -60 l-40 -12" stroke="${C.chestnut}" stroke-width="10" stroke-linecap="round"/>
<path d="M110 60 A 125 125 0 0 1 -110 60" fill="none" stroke="${C.chestnut}" stroke-width="10" stroke-linecap="round"/><path d="M-110 60 l6 42 M-110 60 l40 12" stroke="${C.chestnut}" stroke-width="10" stroke-linecap="round"/>
</g></svg>
</div>
<p class="abs say" id="s1" style="top:1740px">Clinics wait for candidates.</p>
<p class="abs say" id="s2" style="top:1740px">Candidates wait for jobs.</p>
<p class="abs" id="dm" style="left:80px;right:80px;top:1250px;text-align:center;font-family:'DM Serif Display';font-size:110px;color:${C.chestnut};opacity:0">Doesn&apos;t matter.</p>
<div class="abs" id="msg">
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.navy}">On Kestrel,<br><span style="color:${C.chestnut}">you both start now.</span></p>
</div>
<div class="abs" id="two">
<div class="half"><b>Candidates</b><p>Create your account and set your alerts.</p></div>
<div class="half"><b>Clinics</b><p>Set up your clinic, ready to post.</p></div>
</div>
<p class="abs" id="after" style="left:80px;right:80px;top:1640px;font-family:Poppins;font-size:40px;line-height:1.4;color:${C.slate};opacity:0">So when the jobs arrive, the people are already here.</p>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.chestnut};margin-top:40px">Pre launch is open: link in bio</p>
</div>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const el = (id) => document.getElementById(id);
const io = (id, a, b, d = 30) => (t) => { const i = out(span(t, a, a + 0.5)), o = span(t, b - 0.35, b), e = el(id); e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + d * (1 - i) + "px)"; };
window.render = (t) => {
  io("hook", 0.1, 8.0)(t);
  // The egg: rocks while we wait (the loop), shrinks up out of the way, then cracks and splits.
  const rock = Math.sin(t * 3.2) * (6 + 6 * span(t, 3, 7.5)) * (1 - span(t, 8.0, 8.3));
  const crack = span(t, 8.2, 8.7), split = out(span(t, 8.8, 9.6));
  const sc = 1.25 - 0.35 * out(span(t, 2.6, 3.2));
  const y = 860 - 0 * span(t, 2.6, 3.2);
  el("eggAt").setAttribute("transform", "translate(540 " + y + ") rotate(" + rock + ") scale(" + sc + ")");
  // The egg stays in the middle after it hatches.
  el("eggAt").style.opacity = 1;
  // The twins hatch at 9.0, rise out of the egg, then swoop down to hover over their own card: candidates on the left, clinics on the right.
  const EGGY = y, ex = 540;
  for (const [n, side, inv] of [[1, -1, false], [2, 1, true]]) {
    const g = el("tw" + n), up = out(span(t, 9.0, 9.6)), go = (k => k * k * (3 - 2 * k))(span(t, 9.6, 10.6));
    const hx = ex + side * 250, hy = 1130;
    const x = ex + side * 40 * up + (hx - ex - side * 40) * go;
    const yy = EGGY - 60 - 260 * up + (hy - (EGGY - 60 - 260)) * go + 10 * Math.sin(t * 3 + n) * span(t, 10.6, 11.0);
    const flap = Math.sin(t * 2 * Math.PI * (2.6 + 0.3 * n) + n), kk = 0.1 + 0.9 * flap;
    const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
    el("nearwing" + n).setAttribute("transform", wing(0, 0, 1)); el("farwing" + n).setAttribute("transform", wing(16, -6, 0.9));
    const s = 0.25 + 0.65 * up;
    g.setAttribute("transform", "translate(" + x + " " + yy + ") scale(" + (side * s) + " " + s + ") rotate(" + (-10 * (1 - go)) + ")");
    g.setAttribute("opacity", t >= 9.0 ? Math.min(1, up * 3) * (1 - span(t, 13.6, 13.9)) : 0);
  }
  const c = el("crack"), L = c.getTotalLength(); c.style.strokeDasharray = L; c.style.strokeDashoffset = L * (1 - crack);
  // The top of the shell lifts off and tips over; the crack line goes with it.
  el("top").setAttribute("transform", "translate(" + (40 * split) + " " + (-120 * split) + ") rotate(" + (24 * split) + ")");
  c.style.opacity = crack > 0 && split < 0.05 ? 1 : 0;
  // The loop: clinics and candidates with arrows chasing each other round, faster and faster, going nowhere.
  const lo = out(span(t, 3.0, 3.5)) * (1 - span(t, 7.8, 8.1)); el("loop").style.opacity = lo;
  el("spin").setAttribute("transform", "translate(540 230) rotate(" + (40 * Math.pow(Math.max(0, t - 3), 2)) + ")");
  io("s1", 3.6, 5.7, 20)(t); io("s2", 5.7, 8.0, 20)(t);
  io("dm", 8.1, 9.9, 20)(t); io("msg", 9.8, 14.0)(t); io("two", 10.6, 14.0)(t); io("after", 11.6, 14.0, 20)(t);
  el("end").style.opacity = span(t, 13.9, 14.3);
  const show = (id, a) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 20 * (1 - v) + "px)"; };
  show("e1", 14.5); show("e2", 15.0);
};
window.cover = () => window.render(6.2);
</script></body></html>`;

const file = join(OUT, "chicken-egg-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 4.5, 6.5, 8.6, 9.4, 12.5, 15.8]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `egg-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "chicken-egg-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "chicken-egg-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

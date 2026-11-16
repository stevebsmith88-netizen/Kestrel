// "Did you know" Reel about the kestrel (Steve, 16th November 2026), built around a stylized kestrel: the camera zooms into its eye
// for the ultraviolet fact, pulls back for the rest, and ends by diving into the pupil, which opens into the navy end card.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-kestrel-reel.mjs
// 1080 x 1920, 30 frames a second, 22 seconds, no sound. Every frame is drawn by render(t), so it comes out the same each time. Needs ffmpeg.
// The bird is a new flat illustration in the brand palette (an American kestrel, Canada's species: slate crown, chestnut cap and back,
// 2 dark face stripes, hooked beak). It is not the logo; the K mark and wordmark are used as they are, never redrawn.
// Facts are kept to what is well established. The ultraviolet fact comes from studies of kestrels in Europe, so it says so.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", chestnutD: "#8C4024", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", mist: "#DCE3E6", slate: "#5A6672", slateBlue: "#7F93AE" };
const FPS = 30;
const SECONDS = 22;

// Scenes (seconds). Text sits in the top band; the bird lives in the window below it.
const S = { intro: [0, 2.6], uv: [2.6, 6.6], hover: [6.6, 10.4], small: [10.4, 14.2], wings: [14.2, 18], end: [18, 22] };
const TEXT = {
  intro: { tag: "The kestrel", head: "Did you know?", line: "4 things about the bird we're named after.", big: true },
  uv: { tag: "1 of 4", head: "Kestrels may see ultraviolet light.", line: "Studies of kestrels in Europe found they can spot the trails voles leave, which reflect ultraviolet light." },
  hover: { tag: "2 of 4", head: "It can hover in 1 spot.", line: "Facing into the wind, it holds still in the air while it watches the grass below." },
  small: { tag: "3 of 4", head: "The smallest falcon in North America.", line: "Canada's kestrel is 22 to 31 cm long, smaller than a pigeon, and nests across most of Canada in summer." },
  wings: { tag: "4 of 4", head: "You can tell males and females apart.", line: "Males have slate blue wings. Females have chestnut wings with dark bars." },
};

// The bird, in its own 600 x 760 drawing space, facing right. Eye centre at (340, 290).
const EYE = [340, 290];
const BIRD = `
<g id="bird">
  <path d="M150 330 C 120 470, 110 600, 90 900 L 560 900 C 515 600, 480 500, 425 420 Z" fill="${C.paper}"/>
  ${[[300, 520], [360, 560], [250, 600], [330, 640], [400, 610], [280, 690], [370, 700]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="13" fill="${C.navy}" opacity=".85"/>`).join("")}
  <path d="M152 320 C 108 470, 86 600, 40 900 L 290 900 C 236 620, 205 500, 196 380 Z" fill="${C.chestnut}"/>
  ${[[150, 470], [130, 560], [160, 620], [118, 670]].map(([x, y]) => `<path d="M${x - 22} ${y} l44 -6" stroke="${C.navy}" stroke-width="9" stroke-linecap="round" opacity=".7"/>`).join("")}
  <path id="wing" d="M104 500 C 150 560, 205 640, 330 900 L 30 900 C 66 670, 80 580, 104 500 Z" fill="${C.slateBlue}"/>
  <g id="bars" opacity="0">${[0, 1, 2, 3].map((i) => `<path d="M${84 + i * 12} ${600 + i * 42} l${70 + i * 18} 22" stroke="${C.navy}" stroke-width="10" stroke-linecap="round"/>`).join("")}</g>
  <ellipse cx="300" cy="300" rx="152" ry="146" fill="${C.paper}"/>
  <path d="M150 300 C 160 150, 430 132, 450 282 C 405 236, 222 232, 150 300 Z" fill="${C.slateBlue}"/>
  <ellipse cx="292" cy="188" rx="48" ry="27" fill="${C.chestnut}"/>
  <path d="M150 300 C 140 330, 146 360, 160 380 C 176 350, 182 322, 176 296 Z" fill="${C.chestnut}"/>
  <circle cx="190" cy="318" r="11" fill="${C.navy}"/>
  <path d="M325 322 C 322 360, 316 392, 308 426 L 332 426 C 338 392, 343 358, 346 324 Z" fill="${C.navy}"/>
  <path d="M232 306 C 224 344, 216 384, 208 418 L 230 418 C 238 384, 244 344, 252 308 Z" fill="${C.navy}"/>
  <path d="M410 280 Q 432 272 444 292 Q 430 304 412 302 Z" fill="${C.buff}"/>
  <path d="M424 282 C 462 276, 492 300, 484 344 C 474 326, 458 320, 438 322 C 432 310, 428 296, 424 282 Z" fill="${C.navy}"/>
  <g id="rings" fill="none"></g>
  <g id="eye">
    <circle cx="${EYE[0]}" cy="${EYE[1]}" r="31" fill="${C.buff}"/>
    <circle id="pupil" cx="${EYE[0]}" cy="${EYE[1]}" r="24" fill="${C.navy}"/>
    <circle id="shine" cx="${EYE[0] + 8}" cy="${EYE[1] - 8}" r="7" fill="${C.cream}"/>
  </g>
</g>`;

const textBlocks = Object.entries(TEXT).map(([k, b]) => `
<div class="tb" id="x-${k}">
<p class="h${b.big ? " big" : ""}">${b.head.replace(/'/g, "&apos;")}</p>
<p class="l${b.big ? " lbig" : ""}">${b.line.replace(/'/g, "&apos;")}</p></div>
<p class="tag" id="g-${k}">${b.tag}</p>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kestrel reel</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
.tb{position:absolute;left:80px;right:80px;top:370px;opacity:0}
.h{font-family:'DM Serif Display';font-size:86px;line-height:1.04;color:${C.navy}}
.big{font-size:140px}
.l{font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:28px}
.lbig{font-family:'DM Serif Display';font-size:68px;line-height:1.1;color:${C.chestnut};margin-top:24px}
.tag{position:absolute;right:80px;top:268px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut};opacity:0}
#win{position:absolute;left:0;top:860px;width:1080px;height:1060px;overflow:hidden}
.chip{position:absolute;padding:14px 26px;border-radius:999px;font-family:Poppins;font-weight:600;font-size:32px;color:${C.cream};opacity:0}
</style></head><body><div id="f">
<p class="abs" id="tl" style="left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">DID YOU KNOW</p>
${textBlocks}
<div id="win">
<svg width="1080" height="1060" viewBox="0 0 1080 1060">
  <g id="wind" fill="none" stroke="${C.navy}" stroke-width="6" stroke-linecap="round" opacity="0">
    <path class="gust" d="M1120 150H860a40 40 0 1 1 40-40"/><path class="gust" d="M1120 260H800"/><path class="gust" d="M1120 380H880a40 40 0 1 0 40 40"/><path class="gust" d="M1120 520H780"/></g>
  <g id="ruler" stroke="${C.chestnut}" stroke-width="6" stroke-linecap="round" opacity="0">
    <path id="rline" d="M960 120V960"/>${Array.from({ length: 9 }, (_, i) => `<path class="rt" data-i="${i}" d="M960 ${120 + i * 105}h${i % 2 ? -22 : -40}"/>`).join("")}</g>
  <g id="cam">${BIRD}</g>
</svg>
<p class="chip" id="cm" style="left:96px;top:930px;background:${C.slateBlue}">Male</p>
<p class="chip" id="cf" style="left:96px;top:930px;background:${C.chestnut}">Female</p>
</div>
<div class="abs" id="end" style="inset:0;background:${C.navy};opacity:0">
<p class="abs" style="left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.buff}">EYE CARE JOBS</p>
<div class="abs" id="endtext" style="left:80px;right:80px;top:600px">
<p style="font-family:'DM Serif Display';font-size:84px;color:${C.cream}">Hello, we&apos;re</p>
<img src="${brand("kestrel-wordmark-reversed.svg")}" alt="" style="display:block;width:760px;margin-top:30px">
<p style="font-family:Poppins;font-size:40px;line-height:1.4;color:${C.mist};margin-top:70px">A Canada-wide eye care job board, opening in early 2027. Every job shows its pay.</p>
<p style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.buff};margin-top:56px">Join the waitlist: link in bio</p></div>
<div class="abs" style="left:80px;top:1560px;display:flex;align-items:center;gap:18px">
<img id="k" src="${brand("kestrel-k-mark-reversed.svg")}" alt="" style="width:64px;height:64px;display:block">
<p style="font-family:Poppins;font-size:28px;letter-spacing:0.06em;color:${C.mist}">eyecarejobs.ca</p></div>
</div>
</div>
<script>
const S = ${JSON.stringify(S)};
const EYE = ${JSON.stringify(EYE)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
const lerp = (a, b, x) => a + (b - a) * x;
// Camera shots: which point of the bird sits where in the window, and how big.
const WIDE = { x: 300, y: 430, s: 1.25, fx: 540, fy: 560 };
const SMALL = { x: 300, y: 430, s: 0.95, fx: 470, fy: 600 };
const EYESHOT = { x: EYE[0], y: EYE[1], s: 12, fx: 540, fy: 520 };
const PUPIL = { x: EYE[0], y: EYE[1], s: 160, fx: 540, fy: 520 };
// Zoom in log scale, so it feels like a steady push in rather than a lurch.
const mix = (A, B, k) => { const s = Math.exp(lerp(Math.log(A.s), Math.log(B.s), k)); const w = (s - A.s) / ((B.s - A.s) || 1); const q = B.s === A.s ? k : clamp(w);
  return { x: lerp(A.x, B.x, q), y: lerp(A.y, B.y, q), s, fx: lerp(A.fx, B.fx, k), fy: lerp(A.fy, B.fy, k) }; };
function shot(t) {
  if (t < S.uv[0]) return WIDE;
  if (t < S.hover[0]) return mix(WIDE, EYESHOT, io(span(t, S.uv[0], S.uv[0] + 1.1)));
  if (t < S.small[0]) return mix(EYESHOT, WIDE, io(span(t, S.hover[0], S.hover[0] + 1.0)));
  if (t < S.wings[0]) return mix(WIDE, SMALL, io(span(t, S.small[0], S.small[0] + 0.8)));
  if (t < S.end[0] - 1.2) return mix(SMALL, WIDE, io(span(t, S.wings[0], S.wings[0] + 0.8)));
  const a = S.end[0] - 1.2;
  if (t < S.end[0]) return mix(WIDE, EYESHOT, io(span(t, a, S.end[0])));
  return mix(EYESHOT, PUPIL, Math.pow(span(t, S.end[0], S.end[0] + 1.0), 2));
}
const showText = (k, t, a, b) => { const i = out(span(t, a + 0.15, a + 0.7)), o = out(span(t, b - 0.45, b)); const e = el("x-" + k);
  e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + (40 * (1 - i) - 40 * o) + "px)"; el("g-" + k).style.opacity = i * (1 - o); };
window.render = (t) => {
  el("tl").style.opacity = out(span(t, 0, 0.5));
  showText("intro", t, -0.15, S.intro[1]);
  for (const k of ["uv", "hover", "small", "wings"]) showText(k, t, S[k][0], S[k][1]);
  // The bird rises in, then hovers: a gentle bob all the way, bigger while the hover fact is on screen.
  const rise = 700 * (1 - out(span(t, 0.2, 1.4)));
  const hov = span(t, S.hover[0] + 0.6, S.hover[0] + 1.2) * (1 - span(t, S.hover[1] - 0.6, S.hover[1]));
  const bob = Math.sin(t * 2.6) * (5 + 16 * hov) / 1;
  const c = shot(t);
  el("cam").setAttribute("transform", "translate(" + c.fx + " " + (c.fy + rise + bob * Math.min(1, 1.25 / c.s)) + ") scale(" + c.s + ") translate(" + (-c.x) + " " + (-c.y) + ")");
  // Blinks: a quick squash of the eye now and then.
  const blink = (a) => { const x = span(t, a, a + 0.22); return 1 - 0.92 * Math.sin(Math.PI * x); };
  const k = Math.min(blink(1.9), blink(5.3), blink(9.2), blink(16.4));
  el("eye").setAttribute("transform", "translate(" + EYE[0] + " " + EYE[1] + ") scale(1 " + k + ") translate(" + (-EYE[0]) + " " + (-EYE[1]) + ")");
  // Ultraviolet: rings ripple out of the eye while we are in close.
  const uv = span(t, S.uv[0] + 1.0, S.uv[0] + 1.4) * (1 - span(t, S.hover[0], S.hover[0] + 0.4));
  let rings = "";
  if (uv > 0) for (let n = 0; n < 4; n++) { const g = ((t - S.uv[0]) * 0.55 + n / 4) % 1;
    rings += '<circle cx="' + EYE[0] + '" cy="' + EYE[1] + '" r="' + (33 + 46 * g) + '" stroke="' + (n % 2 ? "${C.chestnut}" : "${C.slateBlue}") + '" stroke-width="' + (2.2 * (1 - g) + 0.4) + '" opacity="' + (uv * (1 - g)) + '"/>'; }
  el("rings").innerHTML = rings;
  // Wind gusts blow past while it hovers.
  el("wind").style.opacity = hov;
  // Each gust is a short dash travelling along its path from the right edge, into the face of the hovering bird.
  document.querySelectorAll(".gust").forEach((g, n) => { const L = g.getTotalLength(), d = Math.min(180, L * 0.6); const p = (((t - S.hover[0]) * 0.8 + n * 0.27) % 1);
    g.style.strokeDasharray = d + " " + (L + d); g.style.strokeDashoffset = d - p * (L + d); });
  // Size: a ruler draws itself down the side.
  const r = span(t, S.small[0] + 0.6, S.small[0] + 1.6) * (1 - out(span(t, S.small[1] - 0.45, S.small[1])));
  el("ruler").style.opacity = r > 0 ? 1 - out(span(t, S.small[1] - 0.45, S.small[1])) : 0;
  el("rline").style.strokeDasharray = 840; el("rline").style.strokeDashoffset = 840 * (1 - out(span(t, S.small[0] + 0.6, S.small[0] + 1.4)));
  document.querySelectorAll(".rt").forEach((e) => { e.style.opacity = span(t, S.small[0] + 0.7 + e.dataset.i * 0.08, S.small[0] + 0.8 + e.dataset.i * 0.08); });
  // Wings: slate blue (male), then chestnut with dark bars (female), then back.
  const fem = span(t, S.wings[0] + 1.6, S.wings[0] + 2.0) * (1 - span(t, S.wings[1] - 0.3, S.wings[1]));
  const blend = (a, b, x) => "rgb(" + [0, 2, 4].map((i) => Math.round(lerp(parseInt(a.slice(1 + i, 3 + i), 16), parseInt(b.slice(1 + i, 3 + i), 16), x))).join(",") + ")";
  el("wing").setAttribute("fill", blend("${C.slateBlue}", "${C.chestnutD}", fem));
  el("bars").setAttribute("opacity", fem * 0.8);
  const w = span(t, S.wings[0] + 0.5, S.wings[0] + 0.9) * (1 - span(t, S.wings[1] - 0.45, S.wings[1]));
  el("cm").style.opacity = w * (1 - fem); el("cf").style.opacity = w * fem;
  // The end: we dive into the pupil, which opens into the navy end card.
  el("shine").style.opacity = 1 - span(t, S.end[0] - 0.2, S.end[0] + 0.4);
  const e = span(t, S.end[0] + 0.75, S.end[0] + 1.0); el("end").style.opacity = e;
  const et = out(span(t, S.end[0] + 0.9, S.end[0] + 1.6)); el("endtext").style.opacity = et; el("endtext").style.transform = "translateY(" + 50 * (1 - et) + "px)";
  el("k").style.transform = "translateY(" + (-6 * Math.sin(t * 2.4)) + "px)";
};
</script></body></html>`;

const file = join(OUT, "kestrel-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(file).href);
await page.evaluate(() => document.fonts.ready);
const frame = page.locator("#f");
const STILLS = process.env.STILLS;
if (STILLS) {
  for (const t of [1.6, 4.6, 8.6, 12.6, 15.4, 17.0, 18.6, 21]) {
    await page.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(STILLS, `kestrel-still-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "kestrel-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let n = 0; n < FPS * SECONDS; n++) {
  await page.evaluate((t) => window.render(t), n / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
// The cover: the bird with "Did you know?", so the grid shows the illustration.
await page.evaluate(() => window.render(1.8));
await frame.screenshot({ path: join(OUT, "kestrel-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

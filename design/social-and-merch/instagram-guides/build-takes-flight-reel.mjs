// "We're open" launch Reel, "Takes flight" (Steve, 19th November 2026). Post only on launch day, when sign up and posting are fully live.
// A stylized kestrel perches on a treetop in Steve's skyline artwork, takes off, makes 2 passes across the screen, and on the third a
// chestnut tail feather comes loose. The camera follows it down past the skyline to the wordmark, where it settles into its place as the
// leg of the K, completing the logo. The rest of the lockup, "Now open." and the sign up line follow.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-takes-flight-reel.mjs
// 1080 x 1920, 30 frames a second, 22 seconds, no sound (add music from Instagram's library that lifts as the feather lands). Needs ffmpeg.
// Brand rules: the falling feather is the logo's own 3 feather paths, taken from public/brand/kestrel-lockup-full.svg and never redrawn.
// The wordmark shows without its feather only until the feather lands (agreed by Steve); the last frame is the untouched lockup.
// The skyline is public/skyline.png, used as it is. The bird is a new illustration, not the logo.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const skyline = pathToFileURL(join(ROOT, "public/skyline.png")).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", slate: "#5A6672", slateBlue: "#7F93AE", farWing: "#6B7F9B" };
const FPS = 30;
const SECONDS = 22;

// The lockup, split into its parts by position in the file: the K's 3 feather paths (2nd to 4th path inside the first group),
// the wordmark letters (baseline 320), EYE CARE JOBS (477) with its 2 rules, the maple leaf, and the tagline (710).
const lockupSrc = readFileSync(join(ROOT, "public/brand/kestrel-lockup-full.svg"), "utf8");
function lockup(mode) {
  let n = 0;
  const firstGroupEnd = lockupSrc.indexOf("</g>");
  return lockupSrc.replace(/<(path|rect)\b/g, (m, tag, offset) => {
    const i = n++;
    let part;
    if (offset < firstGroupEnd) part = i >= 2 ? "feather" : "letters";
    else {
      const el = lockupSrc.slice(offset, offset + 120);
      part = tag === "rect" || /,477\)/.test(el) ? "ecj" : /,320\)/.test(el) ? "letters" : /,710\)/.test(el) ? "tag" : "leaf";
    }
    const hide = mode === "feather" ? part !== "feather" : part === "feather";
    return `<${tag} class="lp-${part}"${hide ? ' style="display:none"' : ""}`;
  }).replace("<svg ", `<svg id="${mode === "feather" ? "fsvg" : "lsvg"}" `);
}

// The bird, side on, facing right, drawn round its body centre (0, 0). Flat shapes in the brand palette, like the other kestrel Reels.
const wingPath = `M10 -18 C -20 -90, -80 -150, -160 -172 C -110 -112, -66 -62, -44 -16 Z`;
const wingTip = `M-160 -172 C -128 -150, -104 -128, -86 -108 L -100 -98 C -118 -118, -138 -142, -160 -172 Z`;
const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 1.3}" fill="${C.buff}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${C.navy}"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="${C.cream}"/>`;
const HEAD = (x, y) => `
  <circle cx="${x}" cy="${y}" r="36" fill="${C.paper}"/>
  <path d="M${x - 34} ${y - 2} C ${x - 30} ${y - 44}, ${x + 26} ${y - 48}, ${x + 36} ${y - 6} C ${x + 14} ${y - 22}, ${x - 16} ${y - 22}, ${x - 34} ${y - 2} Z" fill="${C.slateBlue}"/>
  <ellipse cx="${x - 2}" cy="${y - 30}" rx="13" ry="7" fill="${C.chestnut}"/>
  <path d="M${x + 6} ${y + 8} l-4 26 h9 l4 -25 Z" fill="${C.navy}"/>
  <path d="M${x - 18} ${y + 2} l-4 24 h8 l4 -23 Z" fill="${C.navy}"/>
  <path d="M${x + 30} ${y - 8} C ${x + 52} ${y - 8}, ${x + 56} ${y + 8}, ${x + 48} ${y + 18} C ${x + 44} ${y + 10}, ${x + 38} ${y + 8}, ${x + 32} ${y + 8} Z" fill="${C.navy}"/>
  ${eye(x + 12, y - 6, 7)}`;
const FLY = `<g id="fly">
  <g id="farwing"><path d="${wingPath}" fill="${C.farWing}"/><path d="${wingTip}" fill="${C.navy}"/></g>
  <path id="tail" d="M-62 -12 L-176 -28 Q-190 0 -176 28 L-62 12 Z" fill="${C.chestnut}"/>
  <path d="M-154 -25 Q-166 0 -154 25 L-166 27 Q-180 0 -166 -27 Z" fill="${C.navy}"/>
  <ellipse cx="0" cy="0" rx="86" ry="34" fill="${C.chestnut}"/>
  <ellipse cx="8" cy="10" rx="74" ry="22" fill="${C.paper}"/>
  ${[[-30, 10], [0, 16], [30, 8], [-10, 4]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${C.navy}" opacity=".8"/>`).join("")}
  ${HEAD(96, -14)}
  <g id="nearwing"><path d="${wingPath}" fill="${C.slateBlue}"/><path d="${wingTip}" fill="${C.navy}"/>
  ${[0, 1, 2].map((i) => `<path d="M${-30 - i * 30} ${-60 - i * 28} l-16 22" stroke="${C.paper}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`).join("")}</g>
</g>`;
// Perched: upright on a treetop, feet at (0, 0).
const PERCH = `<g id="perch">
  <path d="M-22 -64 L-44 34 Q-28 46 -10 40 L 8 -56 Z" fill="${C.chestnut}"/>
  <path d="M-42 22 Q-27 32 -12 28 L-10 40 Q-28 46 -44 34 Z" fill="${C.navy}"/>
  <ellipse cx="0" cy="-104" rx="46" ry="74" fill="${C.paper}" transform="rotate(-12 0 -104)"/>
  ${[[8, -120], [20, -96], [2, -80], [16, -64]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${C.navy}" opacity=".8"/>`).join("")}
  <path d="M-34 -160 C -60 -110, -56 -50, -26 -4 C -10 -50, -6 -112, -14 -164 Z" fill="${C.chestnut}"/>
  <path d="M-30 -150 C -52 -108, -48 -56, -24 -16 C -12 -56, -10 -110, -16 -152 Z" fill="${C.slateBlue}"/>
  <path d="M-6 -36 v36 M12 -38 v38" stroke="${C.buff}" stroke-width="7" stroke-linecap="round"/>
  ${HEAD(16, -186)}
</g>`;

const PERCH_AT = [736, 1756]; // a treetop in the skyline, where the skyline sits at its own size along the bottom of the first frame
const LOCK = { left: 90, top: 2130, width: 900 }; // the lockup's place in the world, below the first frame
const CAM_END = 1700;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Takes flight</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
#world{position:absolute;left:0;top:0;width:1080px;height:4000px}
.lk{position:absolute;left:${LOCK.left}px;top:${LOCK.top}px;width:${LOCK.width}px;display:block}
.lk svg{width:100%;height:auto;display:block}
</style></head><body><div id="f"><div id="world">
<img id="sky" src="${skyline}" alt="" style="position:absolute;left:0;top:${1920 - 462}px;width:2000px;height:462px">
<div class="lk" id="lock">${lockup("main")}</div>
<div class="abs" id="endtext" style="position:absolute;left:80px;right:80px;top:${CAM_END + 1100}px;text-align:center;opacity:0">
<p id="open" style="font-family:'DM Serif Display';font-size:120px;line-height:1;color:${C.navy}">Now open.</p>
<p id="pay" style="font-family:'DM Serif Display';font-size:64px;line-height:1.1;color:${C.chestnut};margin-top:40px;opacity:0">Every job shows its pay.</p>
<p id="cta" style="font-family:Poppins;font-weight:600;font-size:38px;line-height:1.45;color:${C.navy};margin-top:56px;opacity:0">Find your next role or post a job:<br>link in bio</p>
<p id="web" style="font-family:Poppins;font-size:30px;letter-spacing:0.06em;color:${C.slate};margin-top:40px;opacity:0">eyecarejobs.ca</p></div>
<svg id="birds" style="position:absolute;left:0;top:0;overflow:visible" width="1080" height="1920" viewBox="0 0 1080 1920">
  <g id="perchAt" transform="translate(${PERCH_AT[0]} ${PERCH_AT[1]}) scale(1.5)">${PERCH}</g>
  <g id="flyAt" opacity="0">${FLY}</g>
</svg>
<div class="lk" id="feather" style="pointer-events:none">${lockup("feather")}</div>
</div></div>
<script>
const PERCH_AT = ${JSON.stringify(PERCH_AT)}, CAM_END = ${CAM_END};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;
const el = (id) => document.getElementById(id);
const bez = (p, q) => { const u = 1 - q; return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * q * p[1][k] + 3 * u * q * q * p[2][k] + q * q * q * p[3][k]); };
// The 3 passes: takeoff and up out to the right; back from the right, lower and closer; then across again, when the feather comes loose.
const PASSES = [
  { a: 3.0, b: 5.7, s: 1.25, p: [PERCH_AT.map((v, i) => v - (i ? 170 : 0)), [600, 1500], [820, 620], [1320, 260]] },
  { a: 6.0, b: 8.6, s: 2.0, p: [[1380, 520], [900, 1250], [320, 1150], [-320, 640]] },
  { a: 9.0, b: 11.9, s: 1.55, p: [[-320, 420], [180, 640], [640, 560], [1400, 380]] },
];
const DROP = 10.9; // the moment the feather comes loose
function birdAt(t) {
  for (const P of PASSES) if (t >= P.a && t <= P.b) {
    const q = io(span(t, P.a, P.b));
    const [x, y] = bez(P.p, q); const [x2, y2] = bez(P.p, Math.min(1, q + 0.01));
    const dir = x2 >= x ? 1 : -1;
    const ang = Math.max(-32, Math.min(32, Math.atan2(y2 - y, Math.abs(x2 - x) + 1e-6) * 180 / Math.PI));
    return { x, y, s: P.s, dir, ang, on: true };
  }
  return { on: false };
}
let FEATHER = null; // the feather's centre in the world when it sits in the logo, measured once
window.render = (t) => {
  if (!FEATHER) { const w = el("world").getBoundingClientRect(), r = el("fsvg").querySelector(".lp-feather").getBoundingClientRect();
    const g = Array.from(el("fsvg").querySelectorAll(".lp-feather")).map((e) => e.getBoundingClientRect());
    const x1 = Math.min(...g.map((b) => b.left)), x2 = Math.max(...g.map((b) => b.right)), y1 = Math.min(...g.map((b) => b.top)), y2 = Math.max(...g.map((b) => b.bottom));
    FEATHER = { x: (x1 + x2) / 2 - w.left, y: (y1 + y2) / 2 - w.top }; }
  // Perched: a couple of looks around, a crouch, then away.
  const crouch = Math.sin(Math.PI * span(t, 2.4, 3.0));
  const look = Math.sin(t * 2.2) * 2 * (1 - span(t, 2.2, 2.5));
  el("perchAt").setAttribute("transform", "translate(" + PERCH_AT[0] + " " + PERCH_AT[1] + ") rotate(" + look + ") scale(" + 1.5 * (1 + 0.04 * crouch) + " " + 1.5 * (1 - 0.1 * crouch) + ")");
  el("perchAt").setAttribute("opacity", t < 3.0 ? 1 : 0);
  // Flying: wings beat, with a glide in the middle of each pass.
  const b = birdAt(t);
  el("flyAt").setAttribute("opacity", b.on ? 1 : 0);
  if (b.on) {
    const P = PASSES.find((P) => t >= P.a && t <= P.b); const k = span(t, P.a, P.b);
    const glide = Math.sin(Math.PI * clamp((k - 0.4) / 0.25)) * (k > 0.4 && k < 0.65 ? 1 : 0);
    const flap = Math.sin(t * 2 * Math.PI * 2.6);
    // Seen side on, a wingbeat is the wing swinging from above the body to below it, foreshortened as it passes the body line.
    const kw = lerp(0.1 + 0.9 * flap, 0.28, glide);
    const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kw * m + ") rotate(28) translate(-10 18)";
    el("nearwing").setAttribute("transform", wing(0, 0, 1));
    el("farwing").setAttribute("transform", wing(16, -6, 0.9));
    el("flyAt").setAttribute("transform", "translate(" + b.x + " " + b.y + ") scale(" + b.s * b.dir + " " + b.s + ") rotate(" + b.ang + ")");
  }
  // The feather: comes loose from the tail on the third pass, then falls the way a real one does, rocking from side to side
  // and slowing, while the camera follows it down to the wordmark. It lands at exactly its place in the logo.
  const fe = el("feather");
  let fx = FEATHER.x, fy = FEATHER.y, fr = 0, fo = 0;
  if (t >= DROP) {
    const b0 = birdAt(DROP); const tailX = b0.x - 170 * b0.s, tailY = b0.y + 4 * b0.s;
    const p = span(t, DROP, 15.6), e = io(p);
    const sway = Math.sin((t - DROP) * 2 * Math.PI * 0.55);
    fx = lerp(tailX, FEATHER.x, e) + 150 * sway * (1 - e) * Math.min(1, p * 4);
    fy = lerp(tailY, FEATHER.y, e) - 26 * Math.abs(sway) * (1 - e);
    fr = lerp(-70, 0, e) + 38 * Math.cos((t - DROP) * 2 * Math.PI * 0.55) * (1 - e);
    // A small settle as it lands.
    const land = span(t, 15.6, 16.2); fr += 4 * Math.sin(land * Math.PI * 2) * (1 - land);
    fo = 1;
  }
  fe.style.opacity = fo;
  fe.style.transformOrigin = (FEATHER.x - ${LOCK.left}) + "px " + (FEATHER.y - ${LOCK.top}) + "px";
  fe.style.transform = "translate(" + (fx - FEATHER.x) + "px," + (fy - FEATHER.y) + "px) rotate(" + fr + "deg)";
  // Camera: still while the bird flies, then follows the feather down and comes to rest on the logo.
  const follow = t < DROP ? 0 : Math.max(0, Math.min(CAM_END, fy - 760));
  const cam = lerp(follow, CAM_END, out(span(t, 15.0, 16.4)) * (t > 15 ? 1 : 0));
  el("world").style.transform = "translateY(" + (-cam) + "px)";
  el("sky").style.opacity = 1 - span(cam, 500, 1500); // the landscape fades as we drop below it, so the logo ends on clean Cream
  // Once the feather is home, the rest of the lockup and the words arrive.
  const rest = out(span(t, 16.3, 17.2));
  el("lsvg").querySelectorAll(".lp-ecj, .lp-leaf, .lp-tag").forEach((e) => (e.style.opacity = rest));
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 30 * (1 - v) + "px)"; };
  el("endtext").style.opacity = 1; show("open", 17.4); show("pay", 18.2); show("cta", 18.9); show("web", 19.4);
};
</script></body></html>`;

const file = join(OUT, "takes-flight-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(file).href);
await page.evaluate(() => document.fonts.ready);
const frame = page.locator("#f");
const STILLS = process.env.STILLS;
if (STILLS) {
  for (const t of [1.0, 2.8, 4.2, 7.2, 9.8, 10.6, 12.4, 14.4, 15.8, 21]) {
    await page.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(STILLS, `flight-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "takes-flight-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let n = 0; n < FPS * SECONDS; n++) {
  await page.evaluate((t) => window.render(t), n / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
// The cover is the last frame: the finished logo with "Now open."
await page.evaluate(() => window.render(21.5));
await frame.screenshot({ path: join(OUT, "takes-flight-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

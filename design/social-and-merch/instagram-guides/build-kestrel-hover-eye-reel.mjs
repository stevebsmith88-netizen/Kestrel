// Hover plus eye zoom Reel (Steve, 16th November 2026): the hovering kestrel holds its head still, so the camera pushes into its eye
// for the ultraviolet fact, pulls back as the vole's trail lights up in the grass, and the bird dives to the navy end card.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-kestrel-hover-eye-reel.mjs
// Ending (Steve, 16th November 2026): it swoops on the vole, flies back across with it, the camera zooms into its eye and through the pupil,
// and the full logo is revealed on navy.
// Opens with the name: "Why" and the wordmark (Steve: start with the reason behind the name). Slower pacing at his request.
// 1080 x 1920, 30 frames a second, 25 seconds, no sound. Every frame is drawn by render(t). Needs ffmpeg.
// The ultraviolet fact comes from studies of kestrels in Europe, so it says so.
// Facts: kestrels hover facing into the wind and hold their head almost perfectly still while they hunt (well documented).
// The bird is a new illustration, not the logo; the K mark and wordmark are used as they are.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", mist: "#DCE3E6", slate: "#5A6672", slateBlue: "#7F93AE" };
const FPS = 30;
const SECONDS = 30;
const END = 24.3;

const eye = (x, y, k) => `<circle cx="${x}" cy="${y}" r="${31 * k}" fill="${C.buff}"/><circle cx="${x}" cy="${y}" r="${24 * k}" fill="${C.navy}"/><circle class="shine" cx="${x + 8 * k}" cy="${y - 8 * k}" r="${7 * k}" fill="${C.cream}"/>`;
const wing = `<path d="M262 330 C 200 300, 110 228, 22 150 C 70 240, 120 300, 160 362 C 196 386, 236 384, 266 372 Z" fill="${C.slateBlue}"/>
  <path d="M22 150 C 74 198, 116 236, 146 262 L 118 282 C 86 246, 56 206, 22 150 Z" fill="${C.navy}"/>
  ${[0, 1, 2].map((i) => `<path d="M${190 - i * 34} ${330 - i * 26} l-18 34" stroke="${C.paper}" stroke-width="6" stroke-linecap="round" opacity=".7"/>`).join("")}`;
// The body (with wings and tail) moves; the head is drawn separately and stays put.
const BODY = `
  <g id="tail"><path d="M262 520 L 214 700 Q 300 736 386 700 L 338 520 Z" fill="${C.chestnut}"/>
  <path d="M222 668 Q 300 694 378 668 L 384 690 Q 300 718 216 690 Z" fill="${C.navy}"/></g>
  <g id="wl">${wing}</g><g transform="translate(600 0) scale(-1 1)"><g id="wr">${wing}</g></g>
  <g id="catch" opacity="0"><ellipse cx="300" cy="752" rx="30" ry="18" fill="${C.navy}"/><circle cx="324" cy="740" r="8" fill="${C.navy}"/>
    <path d="M272 756 q -22 6 -30 -6" stroke="${C.navy}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M286 712 v26 M314 712 v26" stroke="${C.buff}" stroke-width="7" stroke-linecap="round"/></g>
  <ellipse cx="300" cy="420" rx="70" ry="128" fill="${C.paper}"/>
  ${[[280, 380], [318, 400], [292, 440], [326, 460], [276, 480], [306, 510]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="10" fill="${C.navy}" opacity=".85"/>`).join("")}`;
const HEAD = `
  <circle cx="300" cy="270" r="62" fill="${C.paper}"/>
  <path d="M238 262 C 240 196, 360 196, 362 262 C 334 240, 266 240, 238 262 Z" fill="${C.slateBlue}"/>
  <ellipse cx="300" cy="222" rx="24" ry="14" fill="${C.chestnut}"/>
  <path d="M268 282 l-6 52 h12 l7 -50 Z M332 282 l6 52 h-12 l-7 -50 Z" fill="${C.navy}"/>
  <path d="M243 276 l-4 40 h10 l5 -38 Z M357 276 l4 40 h-10 l-5 -38 Z" fill="${C.navy}"/>
  <path d="M292 286 L 308 286 L 300 306 Z" fill="${C.navy}"/>
  ${eye(274, 262, 0.5)}${eye(326, 262, 0.5)}
  <g id="rings" fill="none"></g>`;

const CAM = { x: 300, y: 420, s: 1.5, fx: 540, fy: 430 };
const VOLE = [790, 975];
const tufts = Array.from({ length: 22 }, (_, i) => { const x = 20 + i * 50 + (i % 3) * 7; return `<path d="M${x} 1000 q 6 -26 ${i % 2 ? 14 : -10} -38 M${x + 12} 1000 q 2 -20 10 -28" />`; }).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kestrel hover reel</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
</style></head><body><div id="f">
<p class="abs" id="tl" style="left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">DID YOU KNOW</p>
<p class="abs" id="tr" style="right:80px;top:268px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut}">The kestrel</p>
<div class="abs" id="t0" style="left:80px;right:80px;top:370px">
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1;color:${C.navy}">Why</p>
<img src="${brand("kestrel-wordmark.svg")}" alt="" style="display:block;width:560px;margin-top:18px">
<p style="font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:30px">A job board for eye care, named after a bird with remarkable eyes.</p></div>
<div class="abs" id="t1" style="left:80px;right:80px;top:370px;opacity:0">
<p style="font-family:'DM Serif Display';font-size:88px;line-height:1.04;color:${C.navy}">It can hover in 1 spot.</p>
<p style="font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:28px">Facing into the wind, it beats its wings fast and holds its head almost perfectly still.</p></div>
<div class="abs" id="t2" style="left:80px;right:80px;top:370px;opacity:0">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}">Steady head.<br><span style="color:${C.chestnut}">Sharp eyes.</span></p>
<p style="font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:28px">So it can follow the trail to 1 spot in the grass below.</p></div>
<div class="abs" id="t4" style="left:80px;right:80px;top:370px;opacity:0">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}">Sharp eyes find<br><span style="color:${C.chestnut}">the right fit.</span></p>
<p style="font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:28px">That&apos;s the idea behind our name.</p></div>
<div class="abs" id="t3" style="left:80px;right:80px;top:370px;opacity:0">
<p style="font-family:'DM Serif Display';font-size:88px;line-height:1.04;color:${C.navy}">Kestrels may see ultraviolet light.</p>
<p style="font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:28px">Studies of kestrels in Europe found they can spot the trails voles leave, which reflect ultraviolet light.</p></div>
<svg class="abs" style="left:0;top:860px" width="1080" height="1060" viewBox="0 0 1080 1060">
  <g fill="none" stroke="${C.navy}" stroke-width="6" stroke-linecap="round" id="wind">
    <path class="gust" d="M1120 560H860a36 36 0 1 1 36-36"/><path class="gust" d="M1120 650H800"/><path class="gust" d="M1120 750H880a36 36 0 1 0 36 36"/></g>
  <g id="ground"><g fill="none" stroke="${C.chestnut}" stroke-width="5" stroke-linecap="round" opacity=".55">${tufts}</g>
  <path d="M0 1001H1080" stroke="${C.chestnut}" stroke-width="4" opacity=".5"/>
  <path id="trail" d="M-20 988 C 160 960, 300 1000, 440 978 S 660 960, ${VOLE[0] - 30} ${VOLE[1]}" fill="none" stroke="${C.slateBlue}" stroke-width="12" stroke-linecap="round" stroke-dasharray="1 26" opacity="0"/></g>
  <path id="sight" fill="none" stroke="${C.chestnut}" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 16" opacity="0"/>
  <g id="vole" opacity="0"><ellipse cx="${VOLE[0]}" cy="${VOLE[1]}" rx="26" ry="16" fill="${C.navy}"/><circle cx="${VOLE[0] + 20}" cy="${VOLE[1] - 12}" r="7" fill="${C.navy}"/>
    <path d="M${VOLE[0] - 24} ${VOLE[1] + 4} q -20 4 -26 -6" stroke="${C.navy}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle id="ping" cx="${VOLE[0]}" cy="${VOLE[1]}" r="30" fill="none" stroke="${C.chestnut}" stroke-width="4"/></g>
  <g id="cam">
    <g id="all"><g id="body">${BODY}</g><g id="head">${HEAD}</g></g>
  </g>
</svg>
<div class="abs" id="end" style="inset:0;background:${C.navy};opacity:0">
<img id="logo" src="${brand("kestrel-lockup-full-reversed.svg")}" alt="" style="position:absolute;left:90px;width:900px;top:430px;display:block;opacity:0">
<div class="abs" id="endtext" style="left:80px;right:80px;top:1080px;text-align:center;opacity:0">
<p style="font-family:'DM Serif Display';font-size:72px;line-height:1.1;color:${C.cream}">Every job shows its pay.</p>
<p style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.4;color:${C.buff};margin-top:56px">Pre launch is open.<br>Create your account: link in bio</p>
<p style="font-family:Poppins;font-size:30px;letter-spacing:0.06em;color:${C.mist};margin-top:48px">eyecarejobs.ca</p></div>
</div>
</div>
<script>
const CAM = ${JSON.stringify(CAM)}, VOLE = ${JSON.stringify(VOLE)}, END = ${END};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const inn = (x) => x * x * x;
const el = (id) => document.getElementById(id);
const fade = (id, a, b, t) => { const i = out(span(t, a, a + 0.6)), o = out(span(t, b - 0.45, b)); el(id).style.opacity = i * (1 - o); el(id).style.transform = "translateY(" + (40 * (1 - i) - 40 * o) + "px)"; };
// From the bird's drawing space to the window.
const toWin = (x, y, dy) => [CAM.fx + CAM.s * (x - CAM.x), CAM.fy + CAM.s * (y - CAM.y + dy)];
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;
const EYESHOT = { x: 326, y: 262, s: 26, fx: 540, fy: 560 };
const PUPIL = { x: 326, y: 262, s: 600, fx: 540, fy: 560 };
// Zoom in log scale so the push in feels steady; the point under the camera moves in step with the zoom.
const mix = (A, B, k) => { const s = Math.exp(lerp(Math.log(A.s), Math.log(B.s), k)), q = (s - A.s) / (B.s - A.s);
  return { x: lerp(A.x, B.x, q), y: lerp(A.y, B.y, q), s, fx: lerp(A.fx, B.fx, k), fy: lerp(A.fy, B.fy, k) }; };
const shot = (t) => t < 8.5 ? CAM : t < 13.6 ? mix(CAM, EYESHOT, io(span(t, 8.5, 9.9))) : t < 22.4 ? mix(EYESHOT, CAM, io(span(t, 13.6, 14.8)))
  : t < 23.6 ? mix(CAM, EYESHOT, io(span(t, 22.4, 23.6))) : mix(EYESHOT, PUPIL, Math.pow(span(t, 23.6, 24.4), 2));
window.render = (t) => {
  el("tl").style.opacity = el("tr").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, END - 0.2, END));
  fade("t0", 0.1, 4.2, t); fade("t1", 4.2, 8.5, t); fade("t3", 8.5, 14.0, t); fade("t2", 14.0, 19.2, t); fade("t4", 20.2, 23.4, t);
  const c = shot(t); el("cam").setAttribute("transform", "translate(" + c.fx + " " + c.fy + ") scale(" + c.s + ") translate(" + (-c.x) + " " + (-c.y) + ")");
  const near = Math.max(span(t, 8.6, 9.4) * (1 - span(t, 13.7, 14.4)), span(t, 22.5, 23.2)); el("ground").style.opacity = 1 - near;
  // Flight: rises in, hovers, then folds its wings and drops out of frame after the vole.
  const rise = 900 * (1 - out(span(t, 0.8, 2.2)));
  const dive = inn(span(t, 19.0, 19.9));
  const drift = 7 * Math.sin(t * 1.4) + 3 * Math.sin(t * 2 * Math.PI * 3.2 + 1);
  // Wings beat fast (about 3 times a second here), smaller and quicker as it tucks in to dive.
  const beat = Math.sin(t * 2 * Math.PI * 3.2);
  const back = t >= 20.0; const tuck = back ? 0 : dive;
  const a = (1 - tuck) * 18 * beat + 34 * tuck;
  el("wl").setAttribute("transform", "rotate(" + (-a) + " 262 350)");
  el("wr").setAttribute("transform", "rotate(" + (-a) + " 262 350)");
  el("tail").setAttribute("transform", "translate(300 520) scale(" + (1 + 0.04 * beat * (1 - tuck)) + " 1) translate(-300 -520)");
  // The head stays still while the body bobs under it: that is the fact on screen.
  el("body").setAttribute("transform", "translate(0 " + drift + ")");
  const fall = rise / CAM.s + dive * 900;
  if (!back) el("all").setAttribute("transform", "translate(" + (dive * 140) + " " + fall + ") rotate(" + (dive * 28) + " 300 420)");
  else { // Flies back in from the left with the vole, levels out and hovers in the middle again.
    const f = out(span(t, 20.0, 22.3));
    el("all").setAttribute("transform", "translate(" + lerp(-950, 0, f) + " " + lerp(320, 0, f) + ") rotate(" + lerp(16, 0, f) + " 300 420)"); }
  el("catch").setAttribute("opacity", back ? 1 : 0);
  document.querySelectorAll(".shine").forEach((e) => (e.style.opacity = 1 - span(t, 23.3, 23.7)));
  // It spots the vole: a dotted line of sight from its eye down to the grass, and a ping.
  // Ultraviolet: rings ripple out of the eye while we are in close.
  const uv = span(t, 9.8, 10.2) * (1 - span(t, 13.4, 13.7)); let rings = "";
  if (uv > 0) for (let n = 0; n < 4; n++) { const g = ((t - 9.8) * 0.45 + n / 4) % 1;
    rings += '<circle cx="326" cy="262" r="' + (17 + 22 * g) + '" stroke="' + (n % 2 ? "${C.chestnut}" : "${C.slateBlue}") + '" stroke-width="' + (1.1 * (1 - g) + 0.2) + '" opacity="' + uv * (1 - g) + '"/>'; }
  el("rings").innerHTML = rings;
  // Back out wide, the vole's trail lights up in the grass, and the bird looks along it.
  const tr = el("trail"); const tp = out(span(t, 14.8, 16.2));
  tr.style.opacity = span(t, 14.8, 15.0) * (1 - span(t, 19.0, 19.4));
  tr.style.clipPath = "inset(0 " + (100 - 100 * tp) + "% 0 0)"; // the trail lights up from left to right
  const sight = span(t, 15.9, 16.8) * (1 - span(t, 18.9, 19.1));
  const [ex, ey] = toWin(326, 262, rise / CAM.s);
  el("sight").setAttribute("d", "M" + ex + " " + (ey + 14) + " L" + (ex + (VOLE[0] - ex) * out(span(t, 15.9, 16.8))) + " " + (ey + 14 + (VOLE[1] - 30 - ey - 14) * out(span(t, 15.9, 16.8))));
  el("sight").style.opacity = sight;
  el("vole").style.opacity = span(t, 15.4, 15.8) * (1 - span(t, 19.6, 19.9));
  const g = ((t - 16.8) * 1.1) % 1; el("ping").setAttribute("r", 30 + 50 * g); el("ping").style.opacity = t > 16.8 ? (1 - g) * (1 - span(t, 18.9, 19.3)) : 0;
  // Wind gusts blow in from the right the whole time it hovers.
  el("wind").style.opacity = span(t, 0.8, 1.3) * (1 - near) * (1 - span(t, 18.8, 19.2));
  document.querySelectorAll(".gust").forEach((p, n) => { const L = p.getTotalLength(), d = Math.min(170, L * 0.6), q = ((t * 0.8 + n * 0.3) % 1);
    p.style.strokeDasharray = d + " " + (L + d); p.style.strokeDashoffset = d - q * (L + d); });
  const e = out(span(t, END, END + 0.4)); el("end").style.opacity = e;
  // The logo grows out of the dark of the pupil, then the line and the sign up.
  const lg = out(span(t, END + 0.3, END + 1.4)); el("logo").style.opacity = lg; el("logo").style.transform = "scale(" + (0.82 + 0.18 * lg) + ")";
  const et = out(span(t, END + 1.6, END + 2.3)); el("endtext").style.opacity = et; el("endtext").style.transform = "translateY(" + 40 * (1 - et) + "px)";
};
</script></body></html>`;

const file = join(OUT, "kestrel-hover-eye-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(file).href);
await page.evaluate(() => document.fonts.ready);
const frame = page.locator("#f");
const STILLS = process.env.STILLS;
if (STILLS) {
  for (const t of [19.6, 20.8, 21.8, 23.0, 24.0, 25.2, 28]) {
    await page.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(STILLS, `hovereye-still-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "kestrel-hover-eye-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let n = 0; n < FPS * SECONDS; n++) {
  await page.evaluate((t) => window.render(t), n / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
// The cover is the logo design, built by build-kestrel-hello-covers.mjs.
await browser.close();
console.log(`Built ${mp4}`);

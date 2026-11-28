// "Find the right fit" Reel (Steve, 22nd November 2026): "Better 1... or 2?" Trial lenses 1 and 2 swap in and the Kestrel logo behind them is
// still blurry; "Try 3." and the logo snaps into focus, first only through the lens, then everywhere. A single trial lens (round metal rim,
// flat tab handle with the power on it) replaced the pair of glasses at Steve's request; lens 3 has a chestnut tab. 2 versions:
// "simple" (the logo only) and "messages" (lens 1 shows "Competitive salary", lens 2 "Pay: DOE", lens 3 the logo and a pay range).
// Run from the repo root: node design/social-and-merch/instagram-guides/build-focus-reel.mjs   (VERSION=simple or messages, default both)
// 1080 x 1920, 30 frames a second, 15 seconds, no sound. Needs ffmpeg. The wordmark is the real file, used as it is (only blurred), centred behind
// the lenses so "Kestrel" is what comes into focus.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 15;
const CY = 900; // the lens centre
const R = 340; // the lens radius

const content = (v) => v === "messages" ? `
  <div class="msg" data-k="0"><p class="old">Competitive<br>salary</p></div>
  <div class="msg" data-k="1"><p class="old">Pay:<br>DOE</p></div>
  <div class="msg" data-k="2"><img src="${brand("kestrel-wordmark.svg")}" alt="" style="width:620px;display:block;margin:0 auto"><p class="pay">$27 to $33 an hour</p></div>`
  : `<div class="msg" data-k="2" style="opacity:1"><img src="${brand("kestrel-wordmark.svg")}" alt="" style="width:620px;display:block;margin:0 auto"></div>`;

const page = (v) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Find the right fit</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
.layer{position:absolute;inset:0}
.scene{position:absolute;left:0;right:0;top:${CY - 60}px;transform:translateY(-50%)}
.msg{position:absolute;left:0;right:0;top:0;transform:translateY(-50%);text-align:center;opacity:0}
.old{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:84px;line-height:1.1;color:#5F6670}
.pay{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;margin-top:60px;display:inline-block;padding:16px 36px;border-radius:999px;background:${C.navy};font-family:Poppins;font-weight:600;font-size:46px;color:${C.cream}}
#tint{position:absolute;inset:0;background:rgba(220,227,230,.18)}
#top{left:80px;right:80px;top:230px;text-align:center;font-family:'DM Serif Display';font-size:120px;line-height:1.04;color:${C.navy}}
#num{left:0;right:0;top:320px;text-align:center;font-family:'DM Serif Display';font-size:150px;line-height:1;color:${C.chestnut};opacity:0}
#fit{left:80px;right:80px;top:1290px;text-align:center;font-family:'DM Serif Display';font-size:100px;color:${C.navy};opacity:0}
#cta{left:80px;right:80px;top:1450px;text-align:center;opacity:0}
</style></head><body><div id="f">
<div class="layer" id="outside"><div class="scene">${content(v)}</div></div>
<div class="layer" id="inside"><div class="scene">${content(v)}</div><div id="tint"></div></div>
<svg class="abs" id="frames" style="left:0;top:0;overflow:visible" width="1080" height="1920"></svg>
<p class="abs" id="top">Better 1&hellip;<br><span style="color:${C.chestnut}">or 2?</span></p>
<p class="abs" id="num"></p>
<p class="abs" id="fit">Find the right fit.</p>
<div class="abs" id="cta"><p style="font-family:'DM Serif Display';font-size:60px;color:${C.navy}">Every job shows its pay.</p>
<p style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.chestnut};margin-top:26px">Pre launch is open: link in bio</p></div>
</div>
<script>
const CY = ${CY}, VERSION = "${v}";
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
// A trial lens: round metal rim, a thin inner ring, a glint, and a flat tab handle angled down to the right with the power on it.
const LENSES = [
  { label: "+1.00", tab: "${C.slate}" },
  { label: "+0.50", tab: "${C.slate}" },
  { label: "Kestrel", tab: "${C.chestnut}" },
];
const R = ${R};
const circle = (cx, cy, r) => "M " + (cx - r) + " " + cy + " A " + r + " " + r + " 0 1 0 " + (cx + r) + " " + cy + " A " + r + " " + r + " 0 1 0 " + (cx - r) + " " + cy + " Z";
const lensPath = (dx, dy) => circle(540 + dx, CY + dy, R);
function lensSvg(L, dx, dy, op) {
  const cx = 540 + dx, cy = CY + dy;
  const tab = '<g transform="translate(' + cx + " " + cy + ') rotate(-45)"><rect x="-36" y="' + (R + 2) + '" width="72" height="190" rx="10" fill="' + L.tab + '"/>' +
    '<text x="0" y="' + (R + 104) + '" transform="rotate(90 0 ' + (R + 104) + ')" text-anchor="middle" dominant-baseline="central" font-family="Poppins" font-weight="600" font-size="30" fill="${C.cream}">' + L.label + "</text></g>";
  const glint = '<path d="M ' + (cx - R * 0.62) + " " + (cy - R * 0.42) + " A " + R * 0.75 + " " + R * 0.75 + " 0 0 1 " + (cx - R * 0.2) + " " + (cy - R * 0.72) + '" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".55"/>';
  return '<g opacity="' + op + '">' + tab + '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="${C.slate}" stroke-width="14"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 5) + '" fill="none" stroke="${C.mist}" stroke-width="3"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R - 26) + '" fill="none" stroke="${C.slate}" stroke-width="2" opacity=".35"/>' + glint + "</g>";
}
// Swaps at 5 and 8 seconds: the old lens slides out to the left as the new one slides in from the right.
const SW = [5.0, 8.0];
function frameState(t) {
  const list = [];
  for (let i = 0; i < 3; i++) {
    const inT = i === 0 ? 0.3 : SW[i - 1], outT = i < 2 ? SW[i] : 11.0;
    const k = io(span(t, inT, inT + 0.6)), o = i < 2 ? io(span(t, outT, outT + 0.5)) : 0;
    const lift = i === 2 ? io(span(t, 11.0, 11.8)) : 0;
    if (k <= 0 || o >= 1 || lift >= 1) continue;
    list.push({ L: LENSES[i], dx: i === 0 && t < 1 ? 0 : 1200 * (1 - k) - 1200 * o, dy: (i === 0 ? 400 * (1 - k) : 0) - 1300 * lift, op: (i === 0 ? k : 1) });
  }
  return list;
}
window.render = (t) => {
  const st = frameState(t);
  el("frames").innerHTML = st.map((s) => lensSvg(s.L, s.dx, s.dy, s.op)).join("");
  // Through the lens: very blurry, then less, then sharp. Around them: blurry until the lens lifts away.
  const step = t < SW[0] ? 0 : t < SW[1] ? 1 : 2;
  const inBlur = [15, 7, 0][step], outBlur = 15 * (1 - io(span(t, 11.0, 11.8)));
  el("outside").style.filter = "blur(" + outBlur + "px)";
  el("inside").style.filter = "blur(" + inBlur + "px)";
  const paths = st.map((s) => lensPath(s.dx, s.dy)).join(" ");
  el("inside").style.clipPath = paths ? "path('" + paths + "')" : "inset(100%)";
  el("tint").style.opacity = 1 - span(t, 11.0, 11.6);
  // The messages version shows something different behind each pair.
  document.querySelectorAll(".msg").forEach((m) => { if (VERSION === "messages") m.style.opacity = +m.dataset.k === step ? 1 : 0; });
  el("top").style.opacity = out(span(t, 0.1, 0.6)) * (1 - span(t, 1.8, 2.2));
  const n = el("num"); n.textContent = ["1", "2", "Try 3."][step];
  const ns = [2.1, SW[0] + 0.3, SW[1] + 0.3][step]; const nv = out(span(t, ns, ns + 0.4)) * (1 - span(t, 10.7, 11.0));
  n.style.opacity = nv; n.style.transform = "scale(" + (0.85 + 0.15 * nv) + ")";
  const f = out(span(t, 11.8, 12.4)); el("fit").style.opacity = f; el("fit").style.transform = "translateY(" + 24 * (1 - f) + "px)";
  const c = out(span(t, 12.8, 13.4)); el("cta").style.opacity = c; el("cta").style.transform = "translateY(" + 24 * (1 - c) + "px)";
};
// The cover: the first trial lens over a blurred logo, with "Better 1... or 2?".
window.cover = () => window.render(1.4);
</script></body></html>`;

const versions = process.env.VERSION ? [process.env.VERSION] : ["simple", "messages"];
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const v of versions) {
  const file = join(OUT, `focus-reel-${v}.html`);
  writeFileSync(file, page(v));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForTimeout(300);
  const frame = tab.locator("#f");
  if (process.env.STILLS) {
    for (const t of [1.4, 3.5, 5.3, 6.5, 9.5, 11.4, 14]) {
      await tab.evaluate((x) => window.render(x), t);
      await frame.screenshot({ path: join(process.env.STILLS, `focus-${v}-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
    }
    if (process.env.STILLS_ONLY) continue;
  }
  const mp4 = join(OUT, `focus-reel-${v}.mp4`);
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
  await frame.screenshot({ path: join(OUT, `focus-reel-${v}-cover.jpg`), type: "jpeg", quality: 92 });
  console.log(`Built ${mp4}`);
}
await browser.close();

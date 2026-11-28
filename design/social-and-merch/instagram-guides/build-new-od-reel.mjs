// "Just finished optometry school? Here's what's next." Reel for new ODs (Steve, 21st November 2026).
// Get licensed (2 ticks), 4 paths most new ODs consider, how you'll be paid, and Kestrel's rule that a job paid by percentage must also
// show the expected earnings in dollars (live since 13th November 2026; the clinic enters a daily or hourly figure). Then the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-new-od-reel.mjs
// 1080 x 1920, 30 frames a second, 25 seconds, no sound. Needs ffmpeg. The cover (the 4 paths) is built at the end.
// Kept general and true: no pay figures (Job Bank's optometrist figures are from 2021), no company names, "board exam" and "the college
// in the province you'll practise in" rather than naming bodies, and nothing about Quebec.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 25;

const ICON = {
  people: `<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M15 14.5c3 0 5.5 1.6 5.5 4.5"/>`,
  store: `<path d="M4.5 10.5V19h15v-8.5"/><path d="M3.5 10.5 5.5 5h13l2 5.5Z"/><path d="M10 19v-5h4v5"/>`,
  pin: `<path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/>`,
  key: `<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20.5M17.5 12v3M20.5 12v2.5"/>`,
  check: `<path d="M5 12.5l4.5 4.5L19 7.5"/>`,
};
const PATHS = [
  { icon: "people", t: "Associate in an independent practice", l: "Learn alongside an established OD and their patients." },
  { icon: "store", t: "Corporate or retail optical", l: "Set hours, and often a quicker start." },
  { icon: "pin", t: "Locum work", l: "Cover other clinics and try different settings." },
  { icon: "key", t: "Your own practice, later", l: "Many start as an associate, then buy in or open their own." },
];
const T = { lic: 3.2, paths: 8.0, each: 1.5, pay: 15.6, end: 21.0 };

const svg = (k, size, stroke) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>New ODs</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:620px;font-family:'DM Serif Display';font-size:98px;line-height:1.04;color:${C.navy}}
.h2{left:80px;right:80px;top:320px;font-family:'DM Serif Display';font-size:86px;line-height:1.04;color:${C.navy};opacity:0}
.sec{position:absolute;left:80px;right:80px;opacity:0}
.tick{display:flex;align-items:center;gap:34px;padding:44px 40px;border-radius:14px;background:${C.paper};border:2px solid ${C.line};margin-bottom:26px;box-shadow:0 10px 24px rgba(27,43,75,.08)}
.box{width:76px;height:76px;border-radius:12px;border:4px solid ${C.navy};display:flex;align-items:center;justify-content:center;flex:none}
.tt{font-family:Poppins;font-weight:600;font-size:46px;line-height:1.3;color:${C.navy}}
.card{display:flex;align-items:center;gap:30px;padding:28px 32px;border-radius:14px;background:${C.paper};border:2px solid ${C.line};margin-bottom:24px;box-shadow:0 10px 24px rgba(27,43,75,.08);opacity:0}
.ic{width:112px;height:112px;border-radius:50%;background:${C.chestnut};display:flex;align-items:center;justify-content:center;flex:none}
.ct{font-family:'DM Serif Display';font-size:48px;line-height:1.1;color:${C.navy}}.cl{font-family:Poppins;font-size:30px;line-height:1.4;color:${C.slate};margin-top:6px}
.pills{display:flex;flex-wrap:wrap;gap:18px}
.pill{padding:20px 32px;border-radius:999px;background:${C.mist};font-family:Poppins;font-weight:600;font-size:38px;color:${C.navy};opacity:0}
.pill.hot{background:${C.navy};color:${C.cream}}
#rule{margin-top:60px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
</style></head><body><div id="f">
<p class="abs" id="label">FOR NEW ODS</p>
<p class="abs" id="hook">Just finished optometry school?<br><span style="color:${C.chestnut}">Here&apos;s what&apos;s next.</span></p>

<p class="abs h2" id="h-lic">First, get<br><span style="color:${C.chestnut}">licensed.</span></p>
<div class="sec" id="lic" style="top:620px">
${["Pass your board exam", "Register with the college in the province you&apos;ll practise in"].map((x, i) => `<div class="tick"><div class="box" id="bx${i}"><span id="tk${i}" style="opacity:0">${svg("check", 60, C.chestnut)}</span></div><p class="tt">${x}</p></div>`).join("")}
</div>

<p class="abs h2" id="h-paths">4 paths most<br><span style="color:${C.chestnut}">new ODs consider.</span></p>
<div class="sec" id="paths" style="top:600px">
${PATHS.map((p, i) => `<div class="card" id="p${i}"><div class="ic">${svg(p.icon, 60, C.cream)}</div><div><p class="ct">${p.t}</p><p class="cl">${p.l}</p></div></div>`).join("")}
</div>

<p class="abs h2" id="h-pay">How you&apos;ll<br><span style="color:${C.chestnut}">be paid.</span></p>
<div class="sec" id="pay" style="top:640px">
<div class="pills"><span class="pill" id="q0">A day rate</span><span class="pill" id="q1">A salary</span><span class="pill" id="q2">A percentage of billings</span></div>
<div id="rule"><p style="font-family:'DM Serif Display';font-size:76px;line-height:1.08;color:${C.navy}">On Kestrel, a job paid by percentage must also show the <span style="color:${C.chestnut}">expected earnings in dollars.</span></p>
<p style="font-family:Poppins;font-size:36px;line-height:1.45;color:${C.slate};margin-top:30px">So you can compare offers before you apply.</p></div>
</div>

<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:Poppins;font-size:40px;line-height:1.45;color:${C.navy};margin-top:70px">Create your account, pick Optometrist and your province, and we&apos;ll email you when jobs that fit are posted.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open: link in bio</p>
</div>
</div>
<script>
const T = ${JSON.stringify(T)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const io = (id, a, b, d = 30) => (t) => { const i = out(span(t, a, a + 0.5)), o = span(t, b - 0.4, b), e = el(id); e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + d * (1 - i) + "px)"; };
window.render = (t) => {
  el("label").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, T.end - 0.3, T.end));
  io("hook", 0.2, T.lic, 40)(t);
  io("h-lic", T.lic, T.paths)(t); io("lic", T.lic + 0.3, T.paths)(t);
  for (let i = 0; i < 2; i++) { const k = span(t, T.lic + 1.4 + i * 1.3, T.lic + 1.8 + i * 1.3); el("tk" + i).style.opacity = k; el("tk" + i).style.display = "inline-block"; el("tk" + i).style.transform = "scale(" + back(k) + ")"; }
  io("h-paths", T.paths, T.pay)(t); io("paths", T.paths, T.pay, 0)(t);
  for (let i = 0; i < 4; i++) { const k = out(span(t, T.paths + 0.4 + i * T.each, T.paths + 0.9 + i * T.each)); const e = el("p" + i); e.style.opacity = k; e.style.transform = "translateX(" + 40 * (1 - k) + "px)"; }
  io("h-pay", T.pay, T.end)(t); io("pay", T.pay, T.end, 0)(t);
  for (let i = 0; i < 3; i++) { const k = span(t, T.pay + 0.4 + i * 0.45, T.pay + 0.75 + i * 0.45); const e = el("q" + i); e.style.opacity = k; e.style.transform = "scale(" + (0.8 + 0.2 * back(k)) + ")"; }
  el("q2").classList.toggle("hot", t >= T.pay + 2.2);
  const r = out(span(t, T.pay + 2.4, T.pay + 3.0)); el("rule").style.opacity = r; el("rule").style.transform = "translateY(" + 30 * (1 - r) + "px)";
  el("end").style.opacity = span(t, T.end - 0.3, T.end + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.3);
};
// The cover: the 4 paths.
window.cover = () => window.render(T.pay - 0.6);
</script></body></html>`;

const file = join(OUT, "new-od-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 7.0, 14.5, 19.5, 23.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `od-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "new-od-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "new-od-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

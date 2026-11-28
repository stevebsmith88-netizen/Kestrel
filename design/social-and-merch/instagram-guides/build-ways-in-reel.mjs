// "4 ways into eye care" Reel (Steve, 21st November 2026): for people interested in optics who don't know where to start.
// A dotted chestnut path draws down the screen past 4 stops (front desk, optometric assistant, optician, optical lab technician),
// each with a line icon in the website's style and 1 plain line. Then the pre launch call to action and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-ways-in-reel.mjs
// 1080 x 1920, 30 frames a second, 22 seconds, no sound. Needs ffmpeg. The cover (the finished list) is built at the end.
// Facts are kept general and true across Canada: these roles are often trained on the job, and opticians need a college programme
// and a licence in most provinces. Pre launch wording: no jobs are live yet, so the promise is the job alert, which works today.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 22;

// Line icons on the website's 24 pixel grid (components/Icon.tsx style).
const ICON = {
  desk: `<path d="M3.5 17.5h17"/><path d="M5.5 17.5a6.5 6.5 0 0 1 13 0"/><path d="M12 8.5V11"/><path d="M10 8.5h4"/>`,
  eye: `<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>`,
  glasses: `<circle cx="6.5" cy="13" r="4"/><circle cx="17.5" cy="13" r="4"/><path d="M10.5 12.5q1.5-1.2 3 0"/><path d="M2.5 12 4 8.5M21.5 12 20 8.5"/>`,
  lens: `<path d="M12 3c3.2 3.2 3.2 14.8 0 18c-3.2-3.2-3.2-14.8 0-18Z"/><path d="M3.5 12H7M17 12h3.5"/><path d="M18.5 5.5l1-1M18.5 18.5l1 1"/>`,
};
const STOPS = [
  { icon: "desk", role: "Front desk and patient care", line: "Booking, greeting and helping patients. Many clinics train you on the job." },
  { icon: "eye", role: "Optometric assistant", line: "Pre testing and helping with eye exams. Often trained in the clinic." },
  { icon: "glasses", role: "Optician", line: "Fitting glasses and contact lenses. A college programme and a licence in most provinces." },
  { icon: "lens", role: "Optical lab technician", line: "Making the lenses. Often trained in the lab." },
];
const FIRST = 3.6, EACH = 2.5, Y0 = 640, GAP = 290, CX = 150;
const LIST_END = FIRST + EACH * STOPS.length + 1.2; // about 14.8
const END = LIST_END + 3.6;

const stops = STOPS.map((s, i) => `
<div class="stop" id="s${i}" style="top:${Y0 + i * GAP}px">
  <div class="dot"><svg viewBox="0 0 24 24" width="62" height="62" fill="none" stroke="${C.cream}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[s.icon]}</svg></div>
  <div class="card"><p class="role">${s.role}</p><p class="ln">${s.line}</p></div>
</div>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>4 ways into eye care</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:640px;font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}}
#title{left:80px;right:80px;top:330px;font-family:'DM Serif Display';font-size:92px;line-height:1.04;color:${C.navy};opacity:0}
#path{position:absolute;left:0;top:0;overflow:visible}
.stop{position:absolute;left:${CX - 66}px;right:60px;height:230px;display:flex;align-items:center;gap:34px;opacity:0}
.dot{width:132px;height:132px;border-radius:50%;background:${C.chestnut};display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 10px 22px rgba(164,80,44,.25)}
.card{flex:1;padding:30px 34px;border-radius:14px;background:${C.paper};border:2px solid ${C.line};box-shadow:0 10px 24px rgba(27,43,75,.08)}
.role{font-family:'DM Serif Display';font-size:54px;line-height:1.1;color:${C.navy}}
.ln{font-family:Poppins;font-size:32px;line-height:1.4;color:${C.slate};margin-top:8px}
#cta{left:80px;right:80px;top:640px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">EYE CARE JOBS</p>
<p class="abs" id="hook">Want to work in optics?<br><span style="color:${C.chestnut}">Not sure where to start?</span></p>
<p class="abs" id="title">4 ways into<br><span style="color:${C.chestnut}">eye care.</span></p>
<svg id="path" width="1080" height="1920"><path id="p" d="M ${CX} ${Y0 - 40} L ${CX} ${Y0 + 3 * GAP + 100}" fill="none" stroke="${C.chestnut}" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 22"/></svg>
${stops}
<div class="abs" id="cta">
<p style="font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.navy}">Find your<br><span style="color:${C.chestnut}">way in.</span></p>
<p style="font-family:Poppins;font-size:42px;line-height:1.45;color:${C.slate};margin-top:60px">Create your account, pick the role you&apos;re interested in and your province, and we&apos;ll email you when jobs that fit are posted.</p>
<p style="font-family:Poppins;font-size:42px;line-height:1.45;color:${C.navy};margin-top:40px">Every job shows its pay.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const FIRST = ${FIRST}, EACH = ${EACH}, N = ${STOPS.length}, LIST_END = ${LIST_END}, END = ${END}, Y0 = ${Y0}, GAP = ${GAP};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
window.render = (t) => {
  el("label").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, END - 0.3, END));
  const h = out(span(t, 0.2, 0.9)); el("hook").style.opacity = h * (1 - span(t, FIRST - 0.8, FIRST - 0.3)); el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  const listOut = span(t, LIST_END - 0.4, LIST_END);
  el("title").style.opacity = out(span(t, FIRST - 0.4, FIRST + 0.2)) * (1 - listOut);
  // The dotted path draws down to each stop in turn.
  const p = el("p"), L = p.getTotalLength();
  let reach = 0; for (let i = 0; i < N; i++) reach = Math.max(reach, out(span(t, FIRST + i * EACH - 0.5, FIRST + i * EACH)) * (40 + i * GAP + 100) / (3 * GAP + 140));
  p.style.strokeDasharray = "2 22"; p.style.clipPath = "inset(0 0 " + (100 - 100 * reach) + "% 0)";
  el("path").style.opacity = 1 - listOut;
  for (let i = 0; i < N; i++) { const s = FIRST + i * EACH, k = span(t, s, s + 0.45), e = el("s" + i);
    e.style.opacity = (k > 0 ? 1 : 0) * (1 - listOut);
    e.querySelector(".dot").style.transform = "scale(" + back(k) + ")";
    const c = out(span(t, s + 0.2, s + 0.7)); e.querySelector(".card").style.opacity = c; e.querySelector(".card").style.transform = "translateX(" + 40 * (1 - c) + "px)"; }
  // The call to action, then the logo.
  const c = out(span(t, LIST_END, LIST_END + 0.6)); el("cta").style.opacity = c * (1 - span(t, END - 0.4, END)); el("cta").style.transform = "translateY(" + 30 * (1 - c) + "px)";
  el("end").style.opacity = span(t, END - 0.3, END + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", END + 0.6); show("e2", END + 1.2);
};
// The cover: the finished list under its title.
window.cover = () => window.render(LIST_END - 0.6);
</script></body></html>`;

const file = join(OUT, "ways-in-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 4.4, 9.2, 14.0, 16.5, 20.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `ways-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "ways-in-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "ways-in-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

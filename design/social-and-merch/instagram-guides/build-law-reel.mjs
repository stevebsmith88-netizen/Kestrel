// "Your job ad and the law" Reel for clinics (Steve, 22nd November 2026). A checklist that ticks itself off: Ontario's job posting rules
// since 1st January 2026 (employers with 25 or more employees) and British Columbia's pay range rule (all employers), then
// "on Kestrel, every post covers all of this, whatever the size of your clinic", "a plain summary, not legal advice", and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-law-reel.mjs
// 1080 x 1920, 30 frames a second, 22.5 seconds, no sound. Needs ffmpeg. The cover (the finished checklist) is built at the end.
// Agreed with Steve: the 25 employee threshold is stated, the 45 day reply rule is left out, and the "not legal advice" line stays
// (Kestrel has no lawyer yet). The Kestrel form asks for each item for every clinic (lib/job-pay.ts).
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
const SECONDS = 22.5;

const ON = ["The pay range, no more than $50,000 wide", "Whether it&apos;s an existing vacancy", "Whether AI is used to screen applicants", "No &quot;Canadian experience&quot; requirement"];
const BC = ["The pay range, in every public job posting"];
const T = { list: 3.0, each: 1.15 };
T.bc = T.list + 0.8 + T.each * ON.length + 0.3;
T.msg = T.bc + 0.6 + T.each * BC.length + 1.6;
T.end = T.msg + 3.4;
const tick = `<svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="${C.cream}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const row = (txt, id) => `<div class="row" id="${id}"><div class="box"><span class="tk" id="${id}t">${tick}</span></div><p class="rt">${txt}</p></div>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Your job ad and the law</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:640px;font-family:'DM Serif Display';font-size:108px;line-height:1.04;color:${C.navy}}
#title{left:80px;right:80px;top:330px;font-family:'DM Serif Display';font-size:84px;line-height:1.04;color:${C.navy};opacity:0}
#list{position:absolute;left:80px;right:80px;top:560px}
.sec{opacity:0;margin-bottom:44px}
.sh{font-family:'DM Serif Display';font-size:60px;color:${C.navy}}
.ss{font-family:Poppins;font-size:30px;color:${C.chestnut};margin-top:4px;margin-bottom:24px}
.row{display:flex;align-items:center;gap:30px;padding:22px 0;border-bottom:2px solid ${C.line};opacity:0}
.box{width:78px;height:78px;border-radius:10px;border:4px solid ${C.navy};display:flex;align-items:center;justify-content:center;flex:none;background:${C.paper}}
.box.on{background:${C.chestnut};border-color:${C.chestnut}}
.tk{opacity:0;display:inline-block}
.rt{font-family:Poppins;font-weight:600;font-size:40px;line-height:1.3;color:${C.navy}}
#msg{left:80px;right:80px;top:600px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">FOR CLINICS</p>
<p class="abs" id="hook">Hiring in Ontario or BC?<br><span style="color:${C.chestnut}">Your job ad has rules.</span></p>
<p class="abs" id="title">What your<br><span style="color:${C.chestnut}">job ad needs.</span></p>
<div id="list">
<div class="sec" id="secON"><p class="sh">Ontario</p><p class="ss">Employers with 25 or more employees, since 1st January 2026</p>${ON.map((x, i) => row(x, "on" + i)).join("")}</div>
<div class="sec" id="secBC"><p class="sh">British Columbia</p><p class="ss">All employers</p>${BC.map((x, i) => row(x, "bc" + i)).join("")}</div>
</div>
<div class="abs" id="msg">
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1.06;color:${C.navy}">On Kestrel, every post covers all of this,<br><span style="color:${C.chestnut}">whatever the size of your clinic.</span></p>
<p style="font-family:Poppins;font-size:42px;line-height:1.45;color:${C.slate};margin-top:50px">The form asks for each one, so even a small clinic&apos;s ad meets the strictest rules.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:80px">Pre launch is open.<br>Set up your clinic: link in bio</p>
<p id="e2" style="font-family:Poppins;font-size:28px;color:${C.slate};margin-top:60px">A plain summary, not legal advice.</p>
</div>
</div>
<script>
const T = ${JSON.stringify(T)}, NON = ${ON.length}, NBC = ${BC.length};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.8; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const tickRow = (id, a, t) => { const r = el(id), k = out(span(t, a, a + 0.35)); r.style.opacity = k; r.style.transform = "translateX(" + 30 * (1 - k) + "px)";
  const c = span(t, a + 0.45, a + 0.75); el(id + "t").style.opacity = c; el(id + "t").style.transform = "scale(" + back(c) + ")"; r.querySelector(".box").classList.toggle("on", c > 0.3); };
window.render = (t) => {
  el("label").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, T.end - 0.3, T.end));
  const h = out(span(t, 0.2, 0.9)); el("hook").style.opacity = h * (1 - span(t, T.list - 0.5, T.list - 0.1)); el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  const gone = span(t, T.msg - 0.4, T.msg);
  el("title").style.opacity = out(span(t, T.list - 0.2, T.list + 0.4)) * (1 - gone);
  el("list").style.opacity = 1 - gone;
  el("secON").style.opacity = out(span(t, T.list + 0.2, T.list + 0.7));
  for (let i = 0; i < NON; i++) tickRow("on" + i, T.list + 0.8 + i * T.each, t);
  el("secBC").style.opacity = out(span(t, T.bc, T.bc + 0.5));
  for (let i = 0; i < NBC; i++) tickRow("bc" + i, T.bc + 0.6 + i * T.each, t);
  const m = out(span(t, T.msg, T.msg + 0.6)); el("msg").style.opacity = m * (1 - span(t, T.end - 0.4, T.end)); el("msg").style.transform = "translateY(" + 30 * (1 - m) + "px)";
  el("end").style.opacity = span(t, T.end - 0.3, T.end + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.1);
};
// The cover: the finished checklist.
window.cover = () => window.render(T.msg - 0.6);
</script></body></html>`;

const file = join(OUT, "law-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 6.0, 11.5, 15.0, 21.0]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `law-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "law-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "law-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

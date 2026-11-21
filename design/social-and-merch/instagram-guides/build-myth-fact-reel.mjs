// "Myth or fact?" Reel, eye care careers edition (Steve, 22nd November 2026). A statement, a beat to guess, then a MYTH or FACT stamp
// thuds onto it with a 1 line explanation. 4 statements Steve approved, then a final fact: there's a new job board just for eye care in Canada.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-myth-fact-reel.mjs
// 1080 x 1920, 30 frames a second, 24.5 seconds, no sound. Needs ffmpeg. The cover (the first statement, unanswered) is built at the end.
// Kept general and true: "many roles", "usually", "many people do".
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
const SECONDS = 24.5;

const CARDS = [
  { s: "You need a university degree to work in optics.", myth: true, e: "Many roles train you on the job. Opticians usually need a college programme and a licence." },
  { s: "Opticians and optometrists do the same job.", myth: true, e: "Optometrists examine eyes and diagnose. Opticians fit and dispense glasses and contact lenses." },
  { s: "Eye care is just retail.", myth: true, e: "It&apos;s health care: patient care, eye tests, and lenses made to a prescription." },
  { s: "You can start at the front desk and grow from there.", myth: false, e: "Many people do, into assistant, optician or practice manager roles." },
  { s: "There&apos;s a new job board just for eye care in Canada.", myth: false, e: "Kestrel Eye Care Jobs. Every job shows its pay.", kestrel: true },
];
const T = { first: 2.8, each: 3.6 };
T.end = T.first + T.each * CARDS.length;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Myth or fact?</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut};opacity:0}
#count{right:80px;top:268px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut};opacity:0}
#hook{left:80px;right:80px;top:700px;font-family:'DM Serif Display';font-size:150px;line-height:1;color:${C.navy}}
.card{position:absolute;left:70px;right:70px;top:520px;opacity:0}
.box{position:relative;padding:70px 60px 90px;border-radius:22px;background:${C.paper};border:3px solid ${C.line};box-shadow:0 18px 40px rgba(27,43,75,.10)}
.st{font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.navy}}
.ask{font-family:Poppins;font-weight:600;font-size:38px;color:${C.chestnut};margin-top:40px}
.stamp{position:absolute;right:40px;bottom:-60px;padding:14px 40px;border-radius:14px;border:8px solid;font-family:Poppins;font-weight:600;font-size:76px;letter-spacing:0.08em;background:${C.cream};opacity:0}
.stamp.m{color:${C.chestnut};border-color:${C.chestnut}}.stamp.f{color:${C.navy};border-color:${C.navy}}
.ex{font-family:Poppins;font-size:44px;line-height:1.45;color:${C.slate};margin-top:110px;opacity:0}
.ex.k{font-family:'DM Serif Display';font-size:64px;line-height:1.15;color:${C.navy}}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">MYTH OR FACT?</p>
<p class="abs" id="count"></p>
<p class="abs" id="hook">Myth<br><span style="color:${C.chestnut}">or fact?</span></p>
${CARDS.map((c, i) => `<div class="card" id="c${i}"><div class="box"><p class="st">&quot;${c.s}&quot;</p><p class="ask" id="q${i}">Myth or fact?</p>
<span class="stamp ${c.myth ? "m" : "f"}" id="st${i}">${c.myth ? "MYTH" : "FACT"}</span></div><p class="ex${c.kestrel ? " k" : ""}" id="ex${i}">${c.e}</p></div>`).join("")}
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const T = ${JSON.stringify(T)}, N = ${CARDS.length};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const el = (id) => document.getElementById(id);
window.render = (t, cover = false) => {
  const h = out(span(t, 0.2, 0.8)); el("hook").style.opacity = h * (1 - span(t, T.first - 0.5, T.first - 0.1)); el("hook").style.transform = "scale(" + (0.9 + 0.1 * h) + ")";
  const on = span(t, T.first - 0.2, T.first + 0.3) * (1 - span(t, T.end - 0.3, T.end));
  el("label").style.opacity = on; el("count").style.opacity = cover ? 0 : on;
  let cur = 0;
  for (let i = 0; i < N; i++) {
    const a = T.first + i * T.each, b = a + T.each, c = el("c" + i);
    const k = out(span(t, a, a + 0.45)), o = span(t, b - 0.35, b);
    c.style.opacity = k * (1 - o); c.style.transform = "translateY(" + (40 * (1 - k) - 40 * o) + "px)";
    if (t >= a) cur = i;
    // A beat to guess, then the stamp thuds down: big and tilted, landing at its size with a small bounce.
    const s = span(t, a + 1.5, a + 1.75), st = el("st" + i);
    st.style.opacity = s > 0 ? 1 : 0;
    st.style.transform = "rotate(" + (i % 2 ? 8 : -8) + "deg) scale(" + (s < 1 ? 2.4 - 1.4 * s : 1 + 0.06 * Math.sin(span(t, a + 1.75, a + 2.05) * Math.PI)) + ")";
    el("q" + i).style.opacity = 1 - span(t, a + 1.45, a + 1.6);
    const e = out(span(t, a + 1.95, a + 2.4)); el("ex" + i).style.opacity = e; el("ex" + i).style.transform = "translateY(" + 24 * (1 - e) + "px)";
  }
  el("count").textContent = (cur + 1) + " of " + N;
  el("end").style.opacity = span(t, T.end - 0.2, T.end + 0.3);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.2);
};
// The cover: the first statement, still waiting for its answer.
window.cover = () => window.render(T.first + 1.0, true);
</script></body></html>`;

const file = join(OUT, "myth-fact-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.2, 4.0, 5.6, 13.6, 20.0, 23.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `mf-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "myth-fact-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "myth-fact-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

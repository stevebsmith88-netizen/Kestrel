// "3 questions to ask in an optician interview" Reel (Steve, 22nd November 2026), taken from the live guide "Questions to ask in an
// optician job interview" (content/posts.ts, slug optician-interview-questions, published 27th November 2026). Flip cards: the question
// on a navy front, why it matters on the cream back. Ends with the pay line, the guide in the link in bio, and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-questions-reel.mjs
// 1080 x 1920, 30 frames a second, 22.5 seconds, no sound. Needs ffmpeg. The cover (the first question) is built at the end.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672", buff: "#D8B48A" };
const FPS = 30;
const SECONDS = 22.5;

const QS = [
  { q: "What does a normal week look like?", w: "Including evenings, Saturdays and holiday cover. Better to know now than in week 2." },
  { q: "If there&apos;s commission or a bonus, how is it worked out?", w: "And what does a typical month look like? The detail matters more than the headline." },
  { q: "Why is the position open?", w: "A new role, a retirement and a replacement for someone who left are very different stories." },
];
const T = { first: 2.8, each: 4.4 };
T.msg = T.first + T.each * QS.length;
T.end = T.msg + 3.4;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>3 questions</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut};opacity:0}
#count{right:80px;top:268px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut};opacity:0}
#hook{left:80px;right:80px;top:660px;font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}}
#title{left:80px;right:80px;top:330px;font-family:'DM Serif Display';font-size:72px;line-height:1.06;color:${C.navy};opacity:0}
.flip{position:absolute;left:90px;right:90px;top:640px;height:820px;perspective:2600px;opacity:0}
.face{position:absolute;inset:0;border-radius:26px;display:flex;flex-direction:column;justify-content:center;padding:70px;box-sizing:border-box;backface-visibility:hidden}
.front{background:${C.navy};box-shadow:0 24px 50px rgba(27,43,75,.25)}
.back{background:${C.paper};border:3px solid ${C.line};box-shadow:0 24px 50px rgba(27,43,75,.12)}
.num{font-family:'DM Serif Display';font-size:120px;line-height:1;color:${C.buff}}
.q{font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.cream};margin-top:30px}
.bq{font-family:'DM Serif Display';font-size:52px;line-height:1.12;color:${C.navy}}
.w{font-family:Poppins;font-size:44px;line-height:1.45;color:${C.slate};margin-top:40px}
.why{font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:0.2em;color:${C.chestnut};margin-bottom:26px}
#msg{left:80px;right:80px;top:640px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">INTERVIEW TIPS</p>
<p class="abs" id="count"></p>
<p class="abs" id="hook">Got an optician interview coming up?<br><span style="color:${C.chestnut}">Ask these 3 questions.</span></p>
<p class="abs" id="title">3 questions to ask in<br><span style="color:${C.chestnut}">an optician interview.</span></p>
${QS.map((x, i) => `<div class="flip" id="c${i}"><div class="face front" id="fr${i}"><p class="num">${i + 1}</p><p class="q">${x.q}</p></div>
<div class="face back" id="bk${i}"><p class="why">WHY ASK</p><p class="bq">${x.q}</p><p class="w">${x.w}</p></div></div>`).join("")}
<div class="abs" id="msg">
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1.06;color:${C.navy}">On Kestrel, you won&apos;t need to ask<br><span style="color:${C.chestnut}">about the pay range.</span></p>
<p style="font-family:Poppins;font-size:44px;line-height:1.45;color:${C.slate};margin-top:50px">Every job shows it. More questions to ask, and what to watch for: the full guide is in the link in bio.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const T = ${JSON.stringify(T)}, N = ${QS.length};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const el = (id) => document.getElementById(id);
window.render = (t, cover = false) => {
  const h = out(span(t, 0.2, 0.9)); el("hook").style.opacity = h * (1 - span(t, T.first - 0.5, T.first - 0.1)); el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  const on = span(t, T.first - 0.2, T.first + 0.3) * (1 - span(t, T.msg - 0.3, T.msg));
  el("label").style.opacity = on; el("count").style.opacity = cover ? 0 : on; el("title").style.opacity = on;
  let cur = 0;
  for (let i = 0; i < N; i++) {
    const a = T.first + i * T.each, b = a + T.each, c = el("c" + i);
    const k = out(span(t, a, a + 0.5)), o = span(t, b - 0.4, b);
    c.style.opacity = k * (1 - o); c.style.transform = "translateX(" + (100 * (1 - k) - 100 * o) + "px)";
    if (t >= a) cur = i;
    // The flip: the card turns over after a beat, front face away, back face to us.
    const f = io(span(t, a + 1.8, a + 2.5)) * 180;
    el("fr" + i).style.transform = "rotateY(" + f + "deg)";
    el("bk" + i).style.transform = "rotateY(" + (f - 180) + "deg)";
  }
  el("count").textContent = (cur + 1) + " of " + N;
  const m = out(span(t, T.msg, T.msg + 0.6)); el("msg").style.opacity = m * (1 - span(t, T.end - 0.4, T.end)); el("msg").style.transform = "translateY(" + 30 * (1 - m) + "px)";
  el("end").style.opacity = span(t, T.end - 0.3, T.end + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.2);
};
// The cover: the title over the first question, not yet turned.
window.cover = () => window.render(T.first + 1.0, true);
</script></body></html>`;

const file = join(OUT, "questions-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 4.0, 4.95, 6.0, 15.0, 17.5, 21.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `qq-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "questions-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "questions-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

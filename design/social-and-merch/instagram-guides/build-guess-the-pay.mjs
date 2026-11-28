// "Guess the pay" Reels, a weekly series (Steve, 21st November 2026): a role and province, 3 answers to choose from, a 5 second countdown,
// then the typical pay from Job Bank, and Kestrel's promise. Multiple choice (comment A, B or C), agreed with Steve.
// Run from the repo root: EP=1 node design/social-and-merch/instagram-guides/build-guess-the-pay.mjs   (EP=all builds every episode)
// 1080 x 1920, 30 frames a second, 19.5 seconds, no sound. Needs ffmpeg. Each episode also gets a designed cover.
// Figures are the medians and quartiles in lib/pay-benchmark-data.ts (Job Bank wages file revised 18th November 2026, Labour Force Survey
// 2024 to 2025), under the Open Government Licence – Canada: the source is credited on screen and in the caption, and nothing suggests
// the Government of Canada endorses Kestrel. Optometrists are left out (2021 Census figures) and so is Quebec. Front desk and practice
// manager use Job Bank's closest groups (see docs/pay-benchmark.md).
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
const SECONDS = 19.5;

const EPISODES = {
  1: { role: "Optician", place: "Ontario", who: "opticians in Ontario", options: ["$22", "$29", "$36"], answer: 1, median: "$29.00", q1: "$23.44", q3: "$35.43" },
  2: { role: "Front desk and patient care", place: "British Columbia", who: "receptionists in British Columbia", options: ["$25", "$19", "$31"], answer: 0, median: "$24.62", q1: "$21.00", q3: "$28.00" },
  3: { role: "Optician", place: "Nova Scotia", who: "opticians in Nova Scotia", options: ["$22", "$26", "$30"], answer: 2, median: "$30.00", q1: "$25.00", q3: "$40.00" },
  4: { role: "Practice manager", place: "Ontario", who: "office and administrative supervisors in Ontario", options: ["$36", "$27", "$45"], answer: 0, median: "$35.75", q1: "$29.00", q3: "$46.00" },
};
const SOURCE = "Source: Job Bank wages, Employment and Social Development Canada, Labour Force Survey 2024 to 2025. Contains information licensed under the Open Government Licence – Canada.";

const page = (ep) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Guess the pay</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#big{left:80px;right:80px;top:700px;font-family:'DM Serif Display';font-size:150px;line-height:1;color:${C.navy}}
#role{left:80px;right:80px;top:330px;font-family:'DM Serif Display';font-size:96px;line-height:1.04;color:${C.navy};opacity:0}
#opts{position:absolute;left:80px;right:80px;top:${ep.role.length > 18 ? 700 : 620}px;display:flex;flex-direction:column;gap:30px}
.opt{display:flex;align-items:center;gap:34px;padding:30px 36px;border-radius:16px;background:${C.paper};border:3px solid ${C.line};box-shadow:0 10px 24px rgba(27,43,75,.08);opacity:0}
.let{width:92px;height:92px;border-radius:50%;background:${C.cream};border:3px solid ${C.navy};display:flex;align-items:center;justify-content:center;font-family:Poppins;font-weight:600;font-size:44px;color:${C.navy};flex:none}
.amt{font-family:'DM Serif Display';font-size:84px;color:${C.navy}}.amt small{font-family:Poppins;font-size:34px;color:${C.slate};margin-left:14px}
.opt.right{background:${C.navy};border-color:${C.navy}}.opt.right .amt,.opt.right .amt small{color:${C.cream}}.opt.right .let{background:${C.chestnut};border-color:${C.chestnut};color:${C.cream}}
#ask{left:80px;right:80px;font-family:Poppins;font-weight:600;font-size:38px;color:${C.chestnut};opacity:0}
#ring{position:absolute;right:80px;top:300px;width:170px;height:170px;opacity:0}
#reveal{left:80px;right:80px;opacity:0}
#src{left:80px;right:80px;top:1700px;font-family:Poppins;font-size:22px;line-height:1.4;color:${C.slate};opacity:0}
#promise{left:80px;right:80px;top:640px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">GUESS THE PAY</p>
<p class="abs" id="big">Guess<br><span style="color:${C.chestnut}">the pay.</span></p>
<p class="abs" id="role">${ep.role},<br><span style="color:${C.chestnut}">${ep.place}</span></p>
<svg id="ring" viewBox="0 0 170 170"><circle cx="85" cy="85" r="72" fill="none" stroke="${C.line}" stroke-width="12"/>
<circle id="arc" cx="85" cy="85" r="72" fill="none" stroke="${C.chestnut}" stroke-width="12" stroke-linecap="round" transform="rotate(-90 85 85)" stroke-dasharray="452.4" stroke-dashoffset="0"/>
<text id="num" x="85" y="106" text-anchor="middle" font-family="DM Serif Display" font-size="64" fill="${C.navy}">5</text></svg>
<div id="opts">${ep.options.map((o, i) => `<div class="opt${i === ep.answer ? " ans" : ""}" id="o${i}"><div class="let">${"ABC"[i]}</div><p class="amt">${o}<small>an hour</small></p></div>`).join("")}</div>
<p class="abs" id="ask">Comment A, B or C</p>
<div class="abs" id="reveal">
<p style="font-family:Poppins;font-size:34px;color:${C.slate}">Typical (median) pay</p>
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.05;color:${C.navy}">${ep.median}<span style="font-size:50px;color:${C.slate}"> an hour</span></p>
<p style="font-family:Poppins;font-size:34px;line-height:1.4;color:${C.slate};margin-top:10px">Half of ${ep.who} earn between ${ep.q1} and ${ep.q3} an hour.</p>
</div>
<p class="abs" id="src">${SOURCE}</p>
<div class="abs" id="promise">
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.navy}">On Kestrel, you&apos;ll never have to guess.</p>
<p style="font-family:'DM Serif Display';font-size:84px;line-height:1.1;color:${C.chestnut};margin-top:50px">Every job shows its pay.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const ANS = ${ep.answer};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const fadeIO = (id, a, b, d = 30) => (t) => { const i = out(span(t, a, a + 0.5)), o = span(t, b - 0.4, b); const e = el(id); e.style.opacity = i * (1 - o); e.style.transform = "translateY(" + d * (1 - i) + "px)"; };
// Timings (Steve, 21st November 2026: a 5 second countdown, and the promise held longer): title 0 to 1.9, question 1.9 to 8,
// countdown 3 to 8, reveal 8 to 12.2, promise 12.2 to 16.2, end 16.2 to 19.5.
const T = { q: 1.9, cd: 3.0, rv: 8.0, pr: 12.2, end: 16.2 };
window.render = (t, cover = false) => {
  el("label").style.opacity = out(span(t, T.q, T.q + 0.4)) * (1 - span(t, T.pr - 0.3, T.pr)); // only once the big title has gone, so it never repeats it
  fadeIO("big", 0.1, T.q, 40)(t);
  fadeIO("role", T.q, T.pr, 30)(t);
  for (let i = 0; i < 3; i++) { const e = el("o" + i), k = span(t, T.q + 0.3 + i * 0.25, T.q + 0.75 + i * 0.25);
    const gone = span(t, T.pr - 0.4, T.pr), shown = span(t, T.rv, T.rv + 0.3);
    e.style.opacity = (k > 0 ? 1 : 0) * (1 - gone) * (i === ANS ? 1 : 1 - 0.65 * shown);
    e.style.transform = "scale(" + (0.85 + 0.15 * back(k)) * (i === ANS ? 1 + 0.04 * Math.sin(Math.PI * shown) : 1) + ")";
    e.classList.toggle("right", i === ANS && t >= T.rv); }
  const opts = el("opts").getBoundingClientRect(), f = el("f").getBoundingClientRect();
  el("ask").style.top = (opts.bottom - f.top + 40) + "px"; fadeIO("ask", T.q + 1.1, T.rv, 20)(t);
  el("reveal").style.top = (opts.bottom - f.top + 50) + "px"; fadeIO("reveal", T.rv + 0.4, T.pr, 30)(t);
  fadeIO("src", T.rv + 0.6, T.pr, 0)(t);
  // The countdown: 3, 2, 1, the ring emptying as it goes.
  const cd = span(t, T.cd, T.rv); el("ring").style.opacity = cover ? 1 : span(t, T.cd - 0.3, T.cd) * (1 - span(t, T.rv, T.rv + 0.3));
  el("arc").setAttribute("stroke-dashoffset", 452.4 * (cover ? 0 : cd)); el("num").textContent = cover ? "?" : String(Math.max(1, 5 - Math.floor(cd * 5)));
  fadeIO("promise", T.pr, T.end, 30)(t);
  el("end").style.opacity = span(t, T.end - 0.2, T.end + 0.3);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.2);
};
// The cover: the question with the 3 answers and a "?" in the ring.
window.cover = () => window.render(6.0, true);
</script></body></html>`;

const which = process.env.EP === "all" ? Object.keys(EPISODES) : [process.env.EP ?? "1"];
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const n of which) {
  const ep = EPISODES[n];
  const file = join(OUT, `guess-the-pay-${n}.html`);
  writeFileSync(file, page(ep));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  const frame = tab.locator("#f");
  if (process.env.STILLS) {
    for (const t of [1.0, 4.2, 9.5, 14, 18.5]) {
      await tab.evaluate((x) => window.render(x), t);
      await frame.screenshot({ path: join(process.env.STILLS, `gtp${n}-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
    }
    if (process.env.STILLS_ONLY) continue;
  }
  const mp4 = join(OUT, `guess-the-pay-${n}.mp4`);
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
  await frame.screenshot({ path: join(OUT, `guess-the-pay-${n}-cover.jpg`), type: "jpeg", quality: 92 });
  console.log(`Built ${mp4}`);
}
await browser.close();

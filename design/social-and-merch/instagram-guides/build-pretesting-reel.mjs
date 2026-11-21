// "Pre testing, explained" Reel (Steve, 22nd November 2026): the 5 tests he chose, 1 at a time, each with a big line drawing in the
// website's icon style, in plain words (no jargon on screen), then "this is often the optometric assistant's job" and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-pretesting-reel.mjs
// 1080 x 1920, 30 frames a second, 25.5 seconds, no sound. Needs ffmpeg. The cover (all 5 as a grid) is built at the end.
// Kept general: "depending on the clinic" is on screen, since not every clinic runs every test or in this order.
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
const SECONDS = 25.5;

// Line drawings on a 24 pixel grid, round ends, drawn big.
const ART = {
  chart: `<rect x="5" y="2.5" width="14" height="19" rx="1.5"/><path d="M10 5.5v3.5M10 5.5h3.2M10 7.25h2.6M10 9h3.2"/><path d="M8.5 12h7M9.2 14.6h5.6M9.9 16.9h4.2M10.6 19h2.8"/>`,
  machine: `<rect x="2.5" y="16" width="19" height="4.5" rx="1.2"/><path d="M9 16V8.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 17 8.5V16"/><path d="M9 11H5.5"/><circle cx="4.4" cy="11" r="1.2"/><path d="M12.5 4.5v2.5M11 4.5h3"/><path d="M19.5 16v-6"/>`,
  puff: `<path d="M1.5 9.5h5.5l2 1.6v1.8l-2 1.6H1.5"/><path d="M10.6 10.4q.8 1.6 0 3.2M12.6 9.4q1.3 2.6 0 5.2"/><path d="M14.8 12Q18.6 6.8 22.4 12Q18.6 17.2 14.8 12Z"/><circle cx="18.6" cy="12" r="1.5"/>`,
  clipboard: `<rect x="5" y="4" width="14" height="17.5" rx="2"/><path d="M9 4V2.6h6V4"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5"/>`,
  oct: `<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M5 10q3.5-2.2 7 0t7 0M5 13q3.5-2.2 7 0t7 0M5 16q3.5-2.2 7 0t7 0"/><path d="M12 6.5v11.5" stroke-dasharray="1.2 1.8"/>`,
  camera: `<rect x="2.5" y="7" width="19" height="12.5" rx="2"/><path d="M8.5 7l1.6-2.5h3.8L15.5 7"/><circle cx="12" cy="13.2" r="4.2"/><circle cx="12" cy="13.2" r="2"/><path d="M18.5 9.5h.1"/>`,
};
const STEPS = [ // order and the OCT step from Steve, 22nd November 2026: the autorefractor usually comes first
  { art: "machine", t: "The machine you look into", l: "An automatic reading of how your eyes focus. A starting point for your prescription." },
  { art: "clipboard", t: "Checking your details", l: "Your reason for the visit, your health and any medication, so the optometrist has the full picture." }, // replaced reading the letters (Steve: not usually the assistant's job)
  { art: "puff", t: "The puff of air", l: "Measuring the pressure inside your eye, part of checking for glaucoma.", aside: "Sorry about the puff." },
  { art: "camera", t: "Photos of the back of your eye", l: "So the optometrist can look at the retina and see any changes over time." },
  { art: "oct", t: "Some clinics also offer an OCT scan", l: "A detailed scan of the layers at the back of your eye." },
];
const T = { steps: 3.4, each: 3.2 };
T.msg = T.steps + T.each * STEPS.length;
T.end = T.msg + 3.6;

const svg = (k, size, stroke, w = 1.3) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ART[k]}</svg>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pre testing, explained</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut};opacity:0}
#count{right:80px;top:268px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut};opacity:0}
#hook{left:80px;right:80px;top:640px;font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.navy}}
.step{position:absolute;left:80px;right:80px;top:380px;opacity:0;display:flex;flex-direction:column;align-items:flex-start}
.art{width:620px;height:620px;border-radius:50%;background:${C.paper};border:3px solid ${C.line};display:flex;align-items:center;justify-content:center;align-self:center;box-shadow:0 18px 40px rgba(27,43,75,.08)}
.st{font-family:'DM Serif Display';font-size:90px;line-height:1.06;color:${C.navy};margin-top:80px}
.sl{font-family:Poppins;font-size:44px;line-height:1.45;color:${C.slate};margin-top:22px}
.aside{font-family:'DM Serif Display';font-style:italic;font-size:48px;color:${C.chestnut};margin-top:26px;opacity:0}
#small{left:80px;right:80px;top:1640px;font-family:Poppins;font-size:26px;color:${C.slate};opacity:0}
#msg{left:80px;right:80px;top:600px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
#grid{position:absolute;left:80px;right:80px;top:600px;display:grid;grid-template-columns:1fr 1fr;gap:30px;opacity:0}
.g{padding:24px;border-radius:18px;background:${C.paper};border:2px solid ${C.line};display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px}
.g p{font-family:'DM Serif Display';font-size:40px;line-height:1.1;color:${C.navy}}
</style></head><body><div id="f">
<p class="abs" id="label">PRE TESTING, EXPLAINED</p>
<p class="abs" id="count"></p>
<p class="abs" id="hook">Ever wondered what happens<br><span style="color:${C.chestnut}">before you see the optometrist?</span></p>
${STEPS.map((s, i) => `<div class="step" id="s${i}"><div class="art" id="a${i}">${svg(s.art, 420, C.navy, 1.1)}</div><p class="st">${s.t}</p><p class="sl">${s.l}</p>${s.aside ? `<p class="aside" id="aside${i}">${s.aside}</p>` : ""}</div>`).join("")}
<p class="abs" id="small">Depending on the clinic, the tests and their order vary.</p>
<div class="abs" id="msg">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy}">This is often the<br><span style="color:${C.chestnut}">optometric assistant&apos;s job.</span></p>
<p style="font-family:Poppins;font-size:42px;line-height:1.45;color:${C.slate};margin-top:56px">Many clinics train you on the job. Curious? Create your account and set an alert for optometric assistant jobs near you.</p>
</div>
<p class="abs" id="ctitle" style="left:80px;right:80px;top:320px;font-family:'DM Serif Display';font-size:100px;line-height:1.04;color:${C.navy};opacity:0">Pre testing,<br><span style="color:${C.chestnut}">explained.</span></p>
<div id="grid">${STEPS.map((s, i) => `<div class="g"${i === 4 ? ' style="grid-column:1 / span 2"' : ""}>${svg(s.art, 180, C.navy, 1.4)}<p>${s.t}</p></div>`).join("")}</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const T = ${JSON.stringify(T)}, N = ${STEPS.length};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
window.render = (t, cover = false) => {
  const h = out(span(t, 0.2, 0.9)); el("hook").style.opacity = h * (1 - span(t, T.steps - 0.6, T.steps - 0.2)); el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  const inSteps = span(t, T.steps - 0.2, T.steps + 0.3) * (1 - span(t, T.msg - 0.3, T.msg));
  el("label").style.opacity = cover ? 1 : inSteps; el("count").style.opacity = cover ? 0 : inSteps; el("small").style.opacity = cover ? 0 : inSteps;
  let cur = 0;
  for (let i = 0; i < N; i++) {
    const a = T.steps + i * T.each, b = a + T.each, e = el("s" + i);
    const k = out(span(t, a, a + 0.55)), o = span(t, b - 0.4, b);
    // Each test slides in from the right and leaves to the left, the drawing popping in.
    e.style.opacity = cover ? 0 : k * (1 - o); e.style.transform = "translateX(" + (90 * (1 - k) - 90 * o) + "px)";
    el("a" + i).style.transform = "scale(" + (0.8 + 0.2 * back(span(t, a, a + 0.6))) + ")";
    if (t >= a) cur = i;
    const as = el("aside" + i); if (as) { const v = out(span(t, a + 1.9, a + 2.4)); as.style.opacity = v; as.style.transform = "translateY(" + 20 * (1 - v) + "px)"; }
  }
  el("count").textContent = (cur + 1) + " of " + N;
  const m = out(span(t, T.msg, T.msg + 0.6)); el("msg").style.opacity = cover ? 0 : m * (1 - span(t, T.end - 0.4, T.end)); el("msg").style.transform = "translateY(" + 30 * (1 - m) + "px)";
  el("grid").style.opacity = cover ? 1 : 0;
  el("end").style.opacity = cover ? 0 : span(t, T.end - 0.3, T.end + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.2);
  el("ctitle").style.opacity = cover ? 1 : 0; if (cover) { el("hook").style.opacity = 0; el("label").style.opacity = 0; }
};
// The cover: the question, with the 4 tests as a grid.
window.cover = () => window.render(1.5, true);
</script></body></html>`;

const file = join(OUT, "pretesting-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 5.0, 9.5, 14.5, 19.5, 23.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `pre-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  await tab.evaluate(() => window.cover());
  await frame.screenshot({ path: join(process.env.STILLS, "pre-cover.jpg"), type: "jpeg", quality: 80 });
  await tab.goto(pathToFileURL(file).href); await tab.evaluate(() => document.fonts.ready);
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "pretesting-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "pretesting-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

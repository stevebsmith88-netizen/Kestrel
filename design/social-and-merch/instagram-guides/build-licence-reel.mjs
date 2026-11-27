// "Hours to pay for your licence" Reel (Steve, 27th November 2026), from the licence fee section of the optician pay guide
// (content/posts.ts, optician-pay-canada, fees read on each regulator's website on 25th November 2026, hours at Job Bank's median of
// 18th November 2026). Each square is 1 hour of work; the provinces build from the lowest fee to Ontario's, the highest.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-licence-reel.mjs
// 1080 x 1920, 30 frames a second, 17 seconds, no sound. Needs ffmpeg. The cover is built at the end.
// If the blog's fee table changes, change ROWS to match it exactly.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", buff: "#D8B48A", slate: "#5A6672", line: "#E3D9C8", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 17;

// lo and hi are the hours in the blog's table ("About 24 to 30"); a single figure has lo === hi.
const ROWS = [
  { p: "Nova Scotia", fee: "$525 to $575", lo: 18, hi: 19 },
  { p: "Alberta", fee: "$680.10 to $839.85", lo: 24, hi: 30 },
  { p: "Manitoba", fee: "$833.77 to $894.36", lo: 29, hi: 31 },
  { p: "British Columbia", fee: "$1,005", lo: 35, hi: 35 },
  { p: "Ontario", fee: "$1,237.35", lo: 43, hi: 43 },
];
const PER_ROW = 22; // squares per line, so 43 hours wraps onto 2 lines
const SQ = 34, GAP = 6;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Licence hours</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#hook{left:80px;right:80px;top:640px}
#top{left:80px;right:80px;top:150px;opacity:0}
#rows{left:80px;right:80px;top:420px}
.row{margin-bottom:46px;opacity:0}
.rh{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
.pn{font-family:'DM Serif Display';font-size:52px;color:${C.navy}}
.hr{font-family:Poppins;font-weight:600;font-size:38px;color:${C.navy}}
.fee{font-family:Poppins;font-size:26px;color:${C.slate};margin-top:10px}
.sq{display:grid;grid-template-columns:repeat(${PER_ROW},${SQ}px);gap:${GAP}px}
.s{width:${SQ}px;height:${SQ}px;border-radius:4px;background:${C.navy};transform:scale(0)}
.s.r{background:transparent;border:3px solid ${C.navy};box-sizing:border-box}
.on .pn,.on .hr{color:${C.chestnut}}.on .s{background:${C.chestnut}}
#key{left:80px;right:80px;top:1690px;font-family:Poppins;font-size:24px;line-height:1.45;color:${C.slate};opacity:0}
#mid{left:80px;right:80px;top:600px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
</style></head><body><div id="f">
<div class="abs" id="hook">
<p style="font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.navy}">How many hours does an optician work</p>
<p style="font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.chestnut};margin-top:10px">just to pay for their licence?</p>
</div>
<div class="abs" id="top"><p style="font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:.24em;color:${C.chestnut}">HOURS OF WORK, EACH YEAR</p>
<p style="font-family:'DM Serif Display';font-size:64px;line-height:1.1;color:${C.navy};margin-top:20px">To pay the yearly licence fee</p>
<p style="font-family:Poppins;font-size:30px;color:${C.slate};margin-top:14px">1 square = 1 hour at the typical optician pay</p></div>
<div class="abs" id="rows">${ROWS.map((r, i) => `<div class="row${i === ROWS.length - 1 ? " last" : ""}" id="r${i}"><div class="rh"><p class="pn">${r.p}</p><p class="hr" id="h${i}">0</p></div>
<div class="sq">${Array.from({ length: r.hi }, (_, j) => `<span class="s${j >= r.lo ? " r" : ""}" id="s${i}-${j}"></span>`).join("")}</div><p class="fee">${r.fee} a year</p></div>`).join("")}</div>
<p class="abs" id="key">Yearly licence fees from each regulator&apos;s website, read on 25th November 2026. Hours at Job Bank&apos;s typical (median) optician pay for each province. Outlined squares: the higher fee, where there are 2 (contact lenses). 5 provinces checked so far.</p>
<div class="abs" id="mid">
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.05;color:${C.navy}">Ontario&apos;s fee is more than twice Nova Scotia&apos;s.</p>
<p style="font-family:'DM Serif Display';font-size:100px;line-height:1.05;color:${C.chestnut};margin-top:50px">Pay is only half the picture.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:60px;line-height:1.15;color:${C.navy};margin-top:80px">Every province&apos;s pay and licence fee is in our optician pay guide.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:42px;color:${C.chestnut};margin-top:40px">Link in bio</p>
</div>
</div>
<script>
const ROWS = ${JSON.stringify(ROWS)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const START = [2.9, 4.1, 5.3, 6.5, 7.8]; // when each province starts filling
const FILL = [0.7, 0.8, 0.8, 0.9, 1.3];  // how long its squares take
window.render = (t, cover = false) => {
  const h = out(span(t, 0, 0.5)) * (1 - span(t, 2.3, 2.7)); el("hook").style.opacity = cover ? 0 : h; el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  const stage = cover ? 1 : out(span(t, 2.6, 3.0)) * (1 - span(t, 11.6, 12.0));
  el("top").style.opacity = stage; el("key").style.opacity = stage;
  ROWS.forEach((r, i) => {
    const a = cover ? -10 : START[i], row = el("r" + i);
    row.style.opacity = stage * out(span(t, a - 0.3, a));
    const f = cover ? 1 : span(t, a, a + FILL[i]);
    for (let j = 0; j < r.hi; j++) { const v = span(f * r.hi, j, j + 1.6); el("s" + i + "-" + j).style.transform = "scale(" + back(v) + ")"; }
    const n = Math.round(f * r.hi), lo = Math.min(n, r.lo);
    el("h" + i).textContent = (f >= 1 ? (r.lo === r.hi ? "About " + r.hi : "About " + r.lo + " to " + r.hi) : n) + " hours";
    // Ontario turns chestnut once it has filled.
    row.classList.toggle("on", i === ROWS.length - 1 && (cover || t > START[i] + FILL[i] + 0.2));
  });
  const m = out(span(t, 12.0, 12.5)) * (1 - span(t, 14.2, 14.5)); el("mid").style.opacity = m; el("mid").style.transform = "translateY(" + 30 * (1 - m) + "px)";
  el("end").style.opacity = span(t, 14.4, 14.8);
  const show = (id, a) => { const v = out(span(t, a, a + 0.5)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 20 * (1 - v) + "px)"; };
  show("e1", 15.0); show("e2", 15.5);
};
window.cover = () => window.render(10.5, true);
</script></body></html>`;

const file = join(OUT, "licence-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 4.6, 8.4, 10.5, 13.0, 16.0]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `lic-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "licence-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "licence-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

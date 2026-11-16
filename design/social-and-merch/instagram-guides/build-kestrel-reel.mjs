// "Did you know" Reel about the kestrel (Steve, 16th November 2026). Navy, in the guide card frame.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-kestrel-reel.mjs
// 1080 x 1920, 30 frames a second, 20 seconds, no sound. Every frame is drawn by render(t), so it comes out the same each time. Needs ffmpeg.
// Facts are kept to what is well established about the American kestrel (Canada's kestrel). The ultraviolet fact comes from
// studies of the common kestrel in Europe, so it says so. The K mark and wordmark are used as they are, never redrawn.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", buff: "#D8B48A", mist: "#DCE3E6", slateBlue: "#7F93AE" };
const FPS = 30;
const SECONDS = 20;

const FACTS = [
  { head: "Canada's kestrel is the smallest falcon in North America.", line: "The American kestrel is smaller than a pigeon, and nests across most of Canada in summer.", art: "size" },
  { head: "It can hover in 1 spot.", line: "Facing into the wind, it holds still in the air while it watches the grass below.", art: "wind" },
  { head: "Kestrels may see ultraviolet light.", line: "Studies of kestrels in Europe found they can spot the trails voles leave, which reflect ultraviolet light.", art: "eye" },
  { head: "You can tell males and females apart.", line: "Males have slate blue wings. Females have chestnut wings with dark bars.", art: "wings" },
];
const START = 2.2; // first fact
const EACH = 3.6; // seconds per fact
const END = START + EACH * FACTS.length; // end card

// Line drawings in the website's icon style (24 pixel grid, round ends), drawn big.
const ART = {
  size: `<svg viewBox="0 0 120 40" width="420" height="140" fill="none" stroke="${C.buff}" stroke-width="2.4" stroke-linecap="round">
<path id="rule" d="M6 30H114"/>${Array.from({ length: 12 }, (_, i) => `<path class="tick" data-i="${i}" d="M${6 + i * 9.8} 30v${i % 3 === 0 ? -14 : -8}"/>`).join("")}</svg>`,
  wind: `<svg viewBox="0 0 120 60" width="420" height="210" fill="none" stroke="${C.buff}" stroke-width="2.4" stroke-linecap="round">
<path class="gust" d="M4 14h70a10 10 0 1 0-10-10"/><path class="gust" d="M4 30h96a10 10 0 1 1-10 10"/><path class="gust" d="M4 46h50"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" width="230" height="230" fill="none" stroke="${C.buff}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle id="iris" cx="12" cy="12" r="3"/><circle id="glow" cx="12" cy="12" r="3" stroke="${C.cream}" stroke-width="0.6"/></svg>`,
  wings: `<div style="display:flex;gap:28px"><div class="chip" style="background:${C.slateBlue}">Male</div><div class="chip" style="background:${C.chestnut}">Female</div></div>`,
};

const facts = FACTS.map((f, i) => `
<div class="fact" id="f${i}">
<div class="art">${ART[f.art]}</div>
<p class="num">${i + 1}</p>
<p class="fh">${f.head}</p>
<p class="fl">${f.line}</p>
</div>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kestrel reel</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
.fact{position:absolute;left:80px;right:80px;top:420px;opacity:0}
.art{height:260px;display:flex;align-items:flex-end}
.num{font-family:'DM Serif Display';font-size:96px;line-height:1;color:${C.buff};margin-top:70px}
.fh{font-family:'DM Serif Display';font-size:96px;line-height:1.04;color:${C.cream};margin-top:22px}
.fl{font-family:Poppins;font-size:40px;line-height:1.4;color:${C.mist};margin-top:44px}
.chip{width:190px;height:150px;border-radius:30px;display:flex;align-items:flex-end;padding:0 0 18px 22px;box-sizing:border-box;font-family:Poppins;font-weight:600;font-size:28px;color:${C.cream};box-shadow:0 16px 30px rgba(0,0,0,.25)}
</style></head><body><div id="f">
<div class="abs" style="left:80px;right:80px;top:270px;display:flex;justify-content:space-between;align-items:center">
<p id="tl" style="font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.buff}">DID YOU KNOW</p>
<p id="tr" style="font-family:'DM Serif Display';font-size:38px;color:${C.buff}">The kestrel</p></div>
<div class="abs" id="intro" style="left:80px;right:80px;top:640px">
<p style="font-family:'DM Serif Display';font-size:150px;line-height:1;color:${C.cream}">Did you know?</p>
<p style="font-family:'DM Serif Display';font-size:84px;line-height:1.1;color:${C.buff};margin-top:36px">4 things about the bird we&apos;re named after.</p></div>
${facts}
<div class="abs" id="end" style="left:80px;right:80px;top:560px;opacity:0">
<p style="font-family:'DM Serif Display';font-size:84px;color:${C.cream}">Hello, we&apos;re</p>
<img src="${brand("kestrel-wordmark-reversed.svg")}" alt="" style="display:block;width:760px;margin-top:30px">
<p style="font-family:Poppins;font-size:40px;line-height:1.4;color:${C.mist};margin-top:70px">A Canada-wide eye care job board, opening in early 2027. Every job shows its pay.</p>
<p style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.buff};margin-top:56px">Join the waitlist: link in bio</p></div>
<div class="abs" id="foot" style="left:80px;top:1560px;display:flex;align-items:center;gap:18px">
<img id="k" src="${brand("kestrel-k-mark-reversed.svg")}" alt="" style="width:64px;height:64px;display:block">
<p style="font-family:Poppins;font-size:28px;letter-spacing:0.06em;color:${C.mist}">eyecarejobs.ca</p></div>
</div>
<script>
const START = ${START}, EACH = ${EACH}, END = ${END};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const el = (id) => document.getElementById(id);
const show = (e, o, y) => { e.style.opacity = o; e.style.transform = "translateY(" + y + "px)"; };
// In over 0.5 seconds rising, out over 0.4 seconds lifting away.
const inOut = (t, a, b) => { const i = out(span(t, a, a + 0.5)), o = out(span(t, b - 0.4, b)); return [i * (1 - o), 60 * (1 - i) - 60 * o]; };
window.render = (t) => {
  const top = out(span(t, 0, 0.5)); el("tl").style.opacity = top; el("tr").style.opacity = top;
  el("foot").style.opacity = out(span(t, 0.3, 0.9));
  const [io, iy] = inOut(t, 0.2, START); show(el("intro"), io, iy);
  for (let i = 0; i < 4; i++) {
    const a = START + EACH * i, b = a + EACH;
    const [o, y] = inOut(t, a, b); const f = el("f" + i); show(f, o, y);
    const p = span(t, a + 0.3, b - 0.5); // progress for the drawing
    if (i === 0) { // the ruler draws itself, then the ticks pop up 1 by 1
      const r = f.querySelector("#rule"); r.style.strokeDasharray = 110; r.style.strokeDashoffset = 110 * (1 - out(span(p, 0, 0.35)));
      f.querySelectorAll(".tick").forEach((k) => { k.style.opacity = span(p, 0.3 + k.dataset.i * 0.04, 0.34 + k.dataset.i * 0.04); });
    }
    if (i === 1) { // gusts blow through from the left, again and again
      f.querySelectorAll(".gust").forEach((g, n) => { const L = 200; g.style.strokeDasharray = L * 0.55 + " " + L; g.style.strokeDashoffset = L * 0.55 - ((p * 2.2 + n * 0.25) % 1) * (L * 1.55); });
    }
    if (i === 2) { // the iris widens and a soft ring pulses out from it
      el("iris").setAttribute("r", 3 + 0.9 * Math.sin(Math.min(1, p * 2) * Math.PI / 2));
      const g = (p * 2.4) % 1; el("glow").setAttribute("r", 3.5 + 6 * g); el("glow").style.opacity = 0.9 * (1 - g);
    }
    if (i === 3) { // the 2 wing colours flip in like cards
      f.querySelectorAll(".chip").forEach((c, n) => { const q = out(span(p, n * 0.15, 0.25 + n * 0.15)); c.style.transform = "rotate(" + (n ? 6 : -6) * q + "deg) scale(" + (0.6 + 0.4 * q) + ")"; c.style.opacity = q; });
    }
  }
  const e = out(span(t, END, END + 0.7)); show(el("end"), e, 60 * (1 - e));
  // The K hovers gently, like the bird holding still in the wind.
  el("k").style.transform = "translateY(" + (-6 * Math.sin(t * 2.4)) + "px)";
};
</script></body></html>`;

const file = join(OUT, "kestrel-reel.html");
writeFileSync(file, html);
const mp4 = join(OUT, "kestrel-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(file).href);
await page.evaluate(() => document.fonts.ready);
const frame = page.locator("#f");
for (let n = 0; n < FPS * SECONDS; n++) {
  await page.evaluate((t) => window.render(t), n / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
// The cover: the intro, so the grid shows "Did you know?". Plus stills to check each fact without playing the video.
await page.evaluate(() => window.render(1.5));
await frame.screenshot({ path: join(OUT, "kestrel-reel-cover.jpg"), type: "jpeg", quality: 92 });
const STILLS = process.env.STILLS;
if (STILLS) for (const t of [4, 7.6, 11.4, 14.6, 19]) {
  await page.evaluate((x) => window.render(x), t);
  await frame.screenshot({ path: join(STILLS, `kestrel-still-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
}
await browser.close();
console.log(`Built ${mp4}`);

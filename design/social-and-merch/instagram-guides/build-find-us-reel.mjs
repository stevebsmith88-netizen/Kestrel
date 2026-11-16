// The find us Reel (Steve, 16th November 2026): the 4 tiles from the find us post drop in, take a turn each, then wave.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-find-us-reel.mjs
// 1080 x 1920, 30 frames a second, 12 seconds, no sound (add music from Instagram's own library when posting).
// Every frame is drawn by render(t) below, so the video comes out the same each time. Needs ffmpeg.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { C, ICONS, TILES } from "./find-us-shared.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const FPS = 30;
const SECONDS = 12;

// Words stay between y 260 and 1560, clear of Instagram's own buttons and inside the 3:4 crop the grid shows.
const SIZE = 190;
const GAP = 44;
const LEFT = (1080 - (4 * SIZE + 3 * GAP)) / 2;
const ROW_Y = 820;

const tiles = TILES.map((t, i) => `
<div class="tile" id="t${i}" style="left:${LEFT + i * (SIZE + GAP)}px;top:${ROW_Y}px;background:${t.bg};box-shadow:${t.edge === "none" ? "" : t.edge + ","} 0 16px 30px rgba(27,43,75,.18), 0 3px 8px rgba(27,43,75,.10)">
<svg viewBox="0 0 24 24" width="${SIZE / 2}" height="${SIZE / 2}" fill="none" stroke="${t.fg}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.key]}</svg></div>
<div class="spot" id="s${i}"><p class="sn">${t.name}</p><p class="sh">${t.handle}</p></div>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Find us reel</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
p{margin:0}
.abs{position:absolute}
.tile{position:absolute;width:${SIZE}px;height:${SIZE}px;border-radius:${SIZE * 0.2}px;display:flex;align-items:center;justify-content:center}
.spot{position:absolute;left:80px;right:80px;top:1130px;text-align:center;opacity:0}
.sn{font-family:'DM Serif Display';font-size:72px;line-height:1.1;color:${C.chestnut}}
.sh{font-family:Poppins;font-size:46px;color:${C.navy};margin-top:10px}
</style></head><body><div id="f">
<div class="abs" id="top" style="left:80px;right:80px;top:270px;display:flex;justify-content:space-between;align-items:center">
<p style="font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">EYE CARE JOBS</p>
<p style="font-family:'DM Serif Display';font-size:38px;color:${C.chestnut}">Find us</p></div>
<p class="abs" id="h1" style="left:80px;top:400px;font-family:'DM Serif Display';font-size:128px;line-height:1;color:${C.navy}">Find us here.</p>
<p class="abs" id="h2" style="left:80px;top:530px;font-family:'DM Serif Display';font-size:128px;line-height:1;color:${C.chestnut}">Before we open.</p>
${tiles}
<div class="abs" id="list" style="left:80px;right:80px;top:1110px;font-family:Poppins;font-size:38px;line-height:1.55;color:${C.navy};text-align:center">
${TILES.map((t) => `<p><span style="font-family:'DM Serif Display';color:${C.chestnut}">${t.name}</span>&nbsp; ${t.handle}</p>`).join("")}</div>
<p class="abs" id="cta" style="left:80px;right:80px;top:1440px;text-align:center;font-family:Poppins;font-weight:600;font-size:40px;color:${C.chestnut}">Join the waitlist: link in bio</p>
<div class="abs" id="foot" style="left:80px;top:1560px;display:flex;align-items:center;gap:18px">
<img src="${brand("kestrel-k-mark.svg")}" alt="" style="width:64px;height:64px;display:block">
<p style="font-family:Poppins;font-size:28px;letter-spacing:0.06em;color:${C.slate}">eyecarejobs.ca</p></div>
</div>
<script>
const TILT = ${JSON.stringify(TILES.map((t) => t.tilt))};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const set = (id, o, y = 0) => { const e = document.getElementById(id); e.style.opacity = o; e.style.transform = "translateY(" + y + "px)"; };
window.render = (t) => {
  set("top", out(span(t, 0, 0.6)));
  const h = out(span(t, 0.15, 0.9)); set("h1", h, 50 * (1 - h));
  const h2 = out(span(t, 7.6, 8.3)); set("h2", h2, 50 * (1 - h2));
  set("foot", out(span(t, 0.4, 1.0)));
  // Each tile drops from above with a little overshoot and spin, 0.25 seconds apart.
  // Then each takes a turn: it straightens, lifts and grows while its name shows below.
  // Then all 4 wave, like a Mexican wave along the row, and settle.
  for (let i = 0; i < 4; i++) {
    const d = span(t, 1.0 + 0.25 * i, 1.8 + 0.25 * i);
    let y = -1100 * (1 - back(d)), r = TILT[i] + (i % 2 ? 1 : -1) * 50 * (1 - out(d)), s = 1, o = d > 0 ? 1 : 0;
    const a = 3.0 + 1.1 * i;
    const on = out(span(t, a, a + 0.3)) * (1 - out(span(t, a + 0.85, a + 1.1)));
    const someone = t > 2.9 && t < 7.5;
    if (someone) { o = 0.35 + 0.65 * on; }
    if (someone && t > 7.2) o = Math.max(o, out(span(t, 7.2, 7.5)));
    y -= 40 * on; s += 0.2 * on; r = r * (1 - on);
    const w = span(t, 8.0, 10.0);
    if (w > 0 && w < 1) { y -= 34 * Math.max(0, Math.sin(Math.PI * (w * 3.2 - i * 0.35))) * (1 - w * 0.3); }
    const e = document.getElementById("t" + i);
    e.style.opacity = o;
    e.style.transform = "translateY(" + y + "px) rotate(" + r + "deg) scale(" + s + ")";
    set("s" + i, on, 20 * (1 - on));
  }
  const l = out(span(t, 7.9, 8.6)); set("list", l, 30 * (1 - l));
  const c = out(span(t, 9.4, 10.0)); set("cta", c, 20 * (1 - c));
};
</script></body></html>`;

const file = join(OUT, "find-us-reel.html");
writeFileSync(file, html);
const mp4 = join(OUT, "find-us-reel.mp4");
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
  if (n === FPS * SECONDS - 1) writeFileSync(join(OUT, "find-us-reel-cover.jpg"), jpg);
}
ff.stdin.end();
await done;
// A few stills to check the movement without playing the video.
for (const t of [1.4, 3.3, 5.5, 8.7]) {
  await page.evaluate((x) => window.render(x), t);
  await frame.screenshot({ path: join(OUT, `find-us-reel-still-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
}
await browser.close();
console.log(`Built ${mp4}`);

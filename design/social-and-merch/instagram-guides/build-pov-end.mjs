// The Kestrel ending for the "pov: personal number" Edits template (Steve, 28th November 2026): a short end card added after the
// template's last section in Edits. "Or... just put the pay in the ad." then the logo and "Every job on Kestrel shows it."
// Run from the repo root: node design/social-and-merch/instagram-guides/build-pov-end.mjs
// 1080 x 1920, 30 frames a second, 3 seconds. Needs ffmpeg.
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
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 3;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>pov end</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;background:${C.cream};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px;box-sizing:border-box}
</style></head><body><div id="f">
<p id="a" style="font-family:'DM Serif Display';font-size:92px;line-height:1.06;color:${C.navy}">Or&hellip; just put the pay in the ad.</p>
<img id="b" src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:820px;display:block;margin-top:110px">
<p id="c" style="font-family:'DM Serif Display';font-size:60px;color:${C.chestnut};margin-top:70px">Every job on Kestrel shows it.</p>
<p id="d" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.slate};margin-top:40px">Link in bio</p>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const out = (x) => 1 - Math.pow(1 - x, 3);
const show = (id, t, a) => { const v = out(clamp((t - a) / 0.4)), e = document.getElementById(id); e.style.opacity = v; e.style.transform = "translateY(" + 18 * (1 - v) + "px)"; };
window.render = (t) => { show("a", t, 0); show("b", t, 0.5); show("c", t, 0.9); show("d", t, 1.3); };
</script></body></html>`;

const file = join(OUT, "pov-end.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
const mp4 = join(OUT, "pov-end.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let i = 0; i < FPS * SECONDS; i++) {
  await tab.evaluate((t) => window.render(t), i / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
await tab.evaluate(() => window.render(3));
await frame.screenshot({ path: join(process.env.STILLS ?? OUT, "pov-end-still.jpg"), type: "jpeg", quality: 85 });
await browser.close();
console.log(`Built ${mp4}`);

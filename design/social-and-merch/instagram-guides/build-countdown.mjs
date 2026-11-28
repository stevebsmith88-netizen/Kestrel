// Launch countdown (Steve, 22nd November 2026): 3 short clips for Stories, "7 days", "3 days" and "Tomorrow", leading into the
// "Takes flight" Reel on launch day. The perched kestrel on Steve's skyline, as in "Takes flight": it looks around (7), hops (3),
// then crouches ready to fly and the clip cuts just as it lifts (Tomorrow). "Tomorrow" doubles as a Reel.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-countdown.mjs
// 1080 x 1920, 30 frames a second, 8 seconds each, no sound. Needs ffmpeg. No dates on screen, so the clips survive a change of launch
// date; only post them once the date is set and true. The wordmark image is used where Kestrel is named; the skyline is used as it is.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PERCH } from "./kestrel-bird-side.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const skyline = pathToFileURL(join(ROOT, "public/skyline.png")).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 8;
const PERCH_AT = [736, 1756];

const CLIPS = [
  { file: "countdown-7-days", big: "7", line: "days until we open.", cta: "Pre launch is open: create your account now.", move: "look" },
  { file: "countdown-3-days", big: "3", line: "days to go.", cta: "Create your account now, so you&apos;re ready.", move: "hop" },
  { file: "countdown-tomorrow", big: "Tomorrow.", line: "Follow the feather.", cta: "Pre launch is open: link in bio.", move: "crouch", word: true },
];

const page = (c) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${c.big}</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
</style></head><body><div id="f">
<img class="abs" id="sky" src="${skyline}" alt="" style="left:0;top:${1920 - 462}px;width:2000px;height:462px">
<div class="abs" id="txt" style="left:80px;right:80px;top:300px">
<img id="wm" src="${brand("kestrel-wordmark.svg")}" alt="" style="width:420px;display:block">
<p id="big" style="font-family:'DM Serif Display';font-size:${c.word ? 190 : 420}px;line-height:${c.word ? 1.1 : 0.95};color:${C.navy};margin-top:${c.word ? 60 : 20}px">${c.big}</p>
<p id="line" style="font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.chestnut};margin-top:10px">${c.line}</p>
<p id="cta" style="font-family:Poppins;font-weight:600;font-size:38px;line-height:1.4;color:${C.slate};margin-top:40px">${c.cta}</p>
</div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${PERCH}</g></svg>
</div>
<script>
const MOVE = "${c.move}", AT = ${JSON.stringify(PERCH_AT)};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const k = 1.7; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const show = (id, a, d = 30) => { const v = out(span(window.__t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + d * (1 - v) + "px)"; };
window.render = (t) => {
  window.__t = t;
  el("f").style.opacity = 1;
  show("wm", 0.2); const b = span(t, 0.6, 1.1); el("big").style.opacity = b > 0 ? 1 : 0; el("big").style.transformOrigin = "0 70%"; el("big").style.transform = "scale(" + (0.7 + 0.3 * back(b)) + ")";
  show("line", 1.3); show("cta", 2.0);
  // The bird: looks around (7), hops twice (3), or crouches and starts to lift just as the clip ends (Tomorrow).
  let y = 0, r = 0, sx = 1, sy = 1;
  if (MOVE === "look") { r = 5 * Math.sin(t * 1.6) + (t > 4 && t < 4.6 ? 10 * Math.sin((t - 4) / 0.6 * Math.PI) : 0); }
  if (MOVE === "hop") { for (const h of [2.8, 5.0]) { const k = span(t, h, h + 0.6); if (k > 0 && k < 1) { y -= 90 * Math.sin(k * Math.PI); }
      const pre = span(t, h - 0.25, h) * (1 - span(t, h, h + 0.05)), land = span(t, h + 0.6, h + 0.75) * (1 - span(t, h + 0.75, h + 0.95)); sy -= 0.1 * (pre + land); sx += 0.05 * (pre + land); } }
  if (MOVE === "crouch") { const c = out(span(t, 2.5, 3.6)); sy = 1 - 0.14 * c; sx = 1 + 0.05 * c; r = 10 * c + 1.5 * Math.sin(t * 40) * span(t, 5.5, 7.2);
    const lift = Math.pow(span(t, 7.3, 8.0), 2); y = -260 * lift; sy += 0.2 * lift; r -= 25 * lift; }
  el("bird").setAttribute("transform", "translate(" + AT[0] + " " + (AT[1] + y) + ") rotate(" + r + ") scale(" + 1.5 * sx + " " + 1.5 * sy + ")");
};
</script></body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const c of CLIPS) {
  const file = join(OUT, `${c.file}.html`);
  writeFileSync(file, page(c));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  const frame = tab.locator("#f");
  if (process.env.STILLS) {
    for (const t of [3.0, 7.7]) { await tab.evaluate((x) => window.render(x), t); await frame.screenshot({ path: join(process.env.STILLS, `${c.file}-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 }); }
    if (process.env.STILLS_ONLY) continue;
  }
  const mp4 = join(OUT, `${c.file}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
  for (let i = 0; i < FPS * SECONDS; i++) {
    await tab.evaluate((t) => window.render(t), i / FPS);
    const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
  // The cover (for the Reel version, and to check the Story): the finished frame before any lift.
  await tab.evaluate(() => window.render(6.5));
  await frame.screenshot({ path: join(OUT, `${c.file}-cover.jpg`), type: "jpeg", quality: 92 });
  console.log(`Built ${mp4}`);
}
await browser.close();

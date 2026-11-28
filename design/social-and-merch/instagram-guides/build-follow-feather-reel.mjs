// "Follow the feather to your next job in eye care" Reel (Steve, 22nd November 2026). The logo's own feather guides 4 real steps on
// Kestrel (pick your role, pick your province, get an alert, see the pay first), then flies back and settles into the K, as in "Takes flight".
// Run from the repo root: node design/social-and-merch/instagram-guides/build-follow-feather-reel.mjs
// 1080 x 1920, 30 frames a second, 22 seconds, no sound. Needs ffmpeg. The cover is built at the end.
// Brand rules: the feather is the 3 feather paths from public/brand/kestrel-lockup-full.svg, moved as they are, never redrawn; the last
// frame is the untouched lockup. Choices you can press have the buttons' squared corners (8px); capsules only for facts (the pay).
// Every step is something the site does today; the job card is an illustration (no clinic name). No Quebec.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 22;

// The lockup split into its parts (same method as build-takes-flight-reel.mjs).
const src = readFileSync(join(ROOT, "public/brand/kestrel-lockup-full.svg"), "utf8");
function lockup(mode) {
  let n = 0; const groupEnd = src.indexOf("</g>");
  return src.replace(/<(path|rect)\b/g, (m, tag, off) => {
    const i = n++; let part;
    if (off < groupEnd) part = i >= 2 ? "feather" : "letters";
    else { const e = src.slice(off, off + 120); part = tag === "rect" || /,477\)/.test(e) ? "ecj" : /,320\)/.test(e) ? "letters" : /,710\)/.test(e) ? "tag" : "leaf"; }
    const hide = mode === "feather" ? part !== "feather" : part === "feather";
    return `<${tag} class="lp-${part}"${hide ? ' style="display:none"' : ""}`;
  }).replace("<svg ", `<svg id="${mode === "feather" ? "fsvg" : "lsvg"}" `);
}
const LOCK = { left: 110, top: 560, width: 860 };

const ROLES = ["Optometrist", "Optician", "Optometric assistant", "Front desk", "Practice manager"];
const PROVINCES = ["British Columbia", "Alberta", "Saskatchewan", "Ontario", "Nova Scotia"];
const BELL = `<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/><path d="M12 3v2"/>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Follow the feather</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:980px;font-family:'DM Serif Display';font-size:120px;line-height:1.02;color:${C.navy}}
.step{position:absolute;left:80px;right:80px;top:330px;opacity:0}
.sh{font-family:'DM Serif Display';font-size:92px;line-height:1.04;color:${C.navy}}.sh b{font-weight:400;color:${C.chestnut};margin-right:24px}
.tags{display:flex;flex-wrap:wrap;gap:24px;margin-top:400px}
.t{padding:24px 34px;border-radius:8px;background:${C.paper};border:3px solid ${C.navy};font-family:Poppins;font-weight:600;font-size:40px;color:${C.navy}}
.t.on{background:${C.chestnut};border-color:${C.chestnut};color:${C.cream}}
.bellwrap{display:flex;flex-direction:column;align-items:center;margin-top:300px}
.bell{width:360px;height:360px;border-radius:50%;background:${C.paper};border:3px solid ${C.line};display:flex;align-items:center;justify-content:center;box-shadow:0 16px 36px rgba(27,43,75,.08)}
.bt{font-family:Poppins;font-size:44px;line-height:1.4;color:${C.slate};text-align:center;margin-top:70px}
.card{margin-top:380px;padding:44px 48px;border-radius:18px;background:${C.paper};border:2px solid ${C.line};box-shadow:0 16px 36px rgba(27,43,75,.10)}
.ct{font-family:'DM Serif Display';font-size:72px;color:${C.navy}}.cm{font-family:Poppins;font-size:36px;color:${C.slate};margin-top:8px}
.pay{display:inline-block;margin-top:30px;padding:16px 32px;border-radius:999px;background:${C.navy};font-family:Poppins;font-weight:600;font-size:42px;color:${C.cream}}
.facts{font-family:Poppins;font-size:30px;color:${C.slate};margin-top:26px}
.lk{position:absolute;left:${LOCK.left}px;top:${LOCK.top}px;width:${LOCK.width}px}
.lk svg{width:100%;height:auto;display:block}
#lock{opacity:0}
#cta{left:80px;right:80px;top:1280px;text-align:center;opacity:0}
</style></head><body><div id="f">
<p class="abs" id="label">EYE CARE JOBS</p>
<p class="abs" id="hook">Follow the feather<br><span style="color:${C.chestnut}">to your next job in eye care.</span></p>
<div class="step" id="s0"><p class="sh"><b>1</b>Pick your role</p><div class="tags">${ROLES.map((r, i) => `<span class="t" id="r${i}">${r}</span>`).join("")}</div></div>
<div class="step" id="s1"><p class="sh"><b>2</b>Pick your province</p><div class="tags">${PROVINCES.map((r, i) => `<span class="t" id="v${i}">${r}</span>`).join("")}</div></div>
<div class="step" id="s2"><p class="sh"><b>3</b>Get an alert</p><div class="bellwrap"><div class="bell" id="bell"><svg id="bsvg" viewBox="0 0 24 24" width="220" height="220" fill="none" stroke="${C.navy}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${BELL}</svg></div>
<p class="bt">We&apos;ll email you when a job that fits is posted.</p></div></div>
<div class="step" id="s3"><p class="sh"><b>4</b>See the pay first</p><div class="card"><p class="ct">Optician</p><p class="cm">Calgary, Alberta · Full time</p><span class="pay" id="pay">$27 to $33 an hour</span><p class="facts">Existing vacancy: Yes · Uses AI to screen candidates: No</p></div></div>
<div class="lk" id="lock">${lockup("main")}</div>
<div class="abs" id="cta">
<p style="font-family:'DM Serif Display';font-size:64px;color:${C.navy}">Follow the feather.</p>
<p style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:36px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
<div class="lk" id="feather">${lockup("feather")}</div>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a, b, x) => a + (b - a) * x;
const el = (id) => document.getElementById(id);
// Step windows (seconds).
const S = [[3.2, 7.2], [7.2, 11.2], [11.2, 14.4], [14.4, 17.6]];
const END = 17.6;
let HOME = null; // the feather's centre when it sits in the logo
const centre = (e, dx = 0, dy = 0) => { const b = el(e).getBoundingClientRect(), f = el("f").getBoundingClientRect(); return [b.left - f.left + b.width / 2 + dx, b.top - f.top + b.height / 2 + dy]; };
window.render = (t) => {
  if (!HOME) { const f = el("f").getBoundingClientRect(), g = Array.from(el("fsvg").querySelectorAll(".lp-feather")).map((e) => e.getBoundingClientRect());
    HOME = [(Math.min(...g.map((b) => b.left)) + Math.max(...g.map((b) => b.right))) / 2 - f.left, (Math.min(...g.map((b) => b.top)) + Math.max(...g.map((b) => b.bottom))) / 2 - f.top]; }
  el("label").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, END - 0.3, END));
  const h = out(span(t, 0.8, 1.6)); el("hook").style.opacity = h * (1 - span(t, S[0][0] - 0.5, S[0][0])); el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  for (let i = 0; i < 4; i++) { const [a, b] = S[i], k = out(span(t, a, a + 0.5)), o = span(t, b - 0.4, b); el("s" + i).style.opacity = k * (1 - o); el("s" + i).style.transform = "translateX(" + (70 * (1 - k) - 70 * o) + "px)"; }
  // Where the feather goes: in from the top, to Optician, to Alberta, to the bell, to the pay, then home to the K.
  const stops = [
    { t: 0.0, p: [760, -260], r: -40 }, { t: 2.6, p: [700, 760], r: -20 },
    { t: 5.0, p: centre("r1", 110, -90), r: -32 }, { t: 6.6, p: centre("r1", 110, -90), r: -32 },
    { t: 9.0, p: centre("v1", 100, -90), r: -32 }, { t: 10.6, p: centre("v1", 100, -90), r: -32 },
    { t: 12.4, p: centre("bell", 170, -190), r: -38 }, { t: 13.8, p: centre("bell", 170, -190), r: -38 },
    { t: 15.8, p: centre("pay", 330, 10), r: -30 }, { t: 17.0, p: centre("pay", 330, 10), r: -30 },
    { t: 19.4, p: HOME, r: 0 },
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i].t && t <= stops[i + 1].t) { a = stops[i]; b = stops[i + 1]; break; }
  if (t > b.t) a = b;
  const p = a === b ? 1 : io(span(t, a.t, b.t)), moving = a.p[0] !== b.p[0] || a.p[1] !== b.p[1];
  // A drifting sway while it travels, like a real feather, and none while it rests on something.
  const sway = moving ? Math.sin(p * Math.PI) * Math.sin(t * 3.2) : 0;
  const x = lerp(a.p[0], b.p[0], p) + 60 * sway, y = lerp(a.p[1], b.p[1], p);
  const r = lerp(a.r, b.r, p) + 14 * sway;
  const fe = el("feather"); fe.style.transformOrigin = (HOME[0] - ${LOCK.left}) + "px " + (HOME[1] - ${LOCK.top}) + "px";
  // Nearly twice its logo size while it guides, back to exactly its logo size as it lands in the K.
  const sc = lerp(1.8, 1, io(span(t, 17.0, 19.4)));
  fe.style.transform = "translate(" + (x - HOME[0]) + "px," + (y - HOME[1]) + "px) rotate(" + r + "deg) scale(" + sc + ")";
  // What the feather touches reacts: the tag is chosen, the bell rings, the pay pulses.
  el("r1").classList.toggle("on", t >= 5.0); el("v1").classList.toggle("on", t >= 9.0);
  const ring = span(t, 12.4, 13.6); el("bsvg").style.transform = "rotate(" + 16 * Math.sin(ring * Math.PI * 6) * (1 - ring) + "deg)";
  const pulse = span(t, 15.8, 16.5); el("pay").style.transform = "scale(" + (1 + 0.08 * Math.sin(pulse * Math.PI)) + ")";
  // The end: the wordmark waits without its feather, the feather settles into the K, then the rest of the lockup and the line.
  el("lock").style.opacity = out(span(t, END, END + 0.6));
  const rest = out(span(t, 19.5, 20.2)); el("lsvg").querySelectorAll(".lp-ecj, .lp-leaf, .lp-tag").forEach((e) => (e.style.opacity = rest));
  const c = out(span(t, 19.9, 20.6)); el("cta").style.opacity = c; el("cta").style.transform = "translateY(" + 24 * (1 - c) + "px)";
};
// The cover: the hook, with the feather drifting in beside it.
window.cover = () => window.render(2.2);
</script></body></html>`;

const file = join(OUT, "follow-feather-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [2.2, 5.5, 9.5, 12.8, 16.0, 18.6, 21]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `ff-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "follow-feather-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "follow-feather-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

// "Job ad makeover" Reel for clinics (Steve, 21st November 2026): a typical weak ad is rewritten on screen. The logo's feather scribbles
// out each weak line (the same scribble as the rules Reel) and the clear version appears beneath it; then the 2 questions every Kestrel
// post answers are added. Ends on the message and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-makeover-reel.mjs
// 1080 x 1920, 30 frames a second, 24 seconds, no sound. Needs ffmpeg. The cover (the finished makeover) is built at the end.
// The ad is an illustration: no clinic name, a province only. The pay tag is what Kestrel's pay guide would show: Job Bank's opticians
// in Alberta have a median of $28.00 and a middle half of $25.00 to $33.00 (lib/pay-benchmark-data.ts), so $27 to $33 is "in line".
// The ad builder line was confirmed by Steve (21st November 2026). The feather is the logo's own, never redrawn.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 24;

const ROWS = [
  { old: "Optician wanted", now: "Optician · Alberta · Full time", big: true },
  { old: "Competitive pay", now: "$27 to $33 an hour, plus an eyewear allowance", tag: "In line with what&apos;s typical in Alberta" },
  { old: "Fast paced, busy clinic", now: "4 days a week, Tuesday to Friday. About 25 patients a day." },
  { old: "Must be a team player", now: "You&apos;ll work alongside 2 opticians and an optometrist." },
];
const T = { card: 3.0, first: 6.0, each: 2.6 };
T.chips = T.first + T.each * ROWS.length + 0.2;
T.msg = T.chips + 2.0;
T.end = T.msg + 3.6;

const lock = readFileSync(join(ROOT, "public/brand/kestrel-lockup-full.svg"), "utf8");
const groupEnd = lock.indexOf("</g>");
let n = 0;
const featherSvg = lock.replace(/<(path|rect)\b/g, (m, tag, off) => { const i = n++; const keep = off < groupEnd && i >= 2; return `<${tag}${keep ? ' class="fp"' : ' style="display:none"'}`; })
  .replace("<svg ", '<svg id="fsvg" ');

const rows = ROWS.map((r, i) => `
<div class="row">
  <p class="old${r.big ? " big" : ""}"><span class="ot" id="ot${i}">${r.old}</span><svg class="scrib" id="sc${i}"><path id="sp${i}" fill="none" stroke="${C.chestnut}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></p>
  <div class="new" id="nw${i}"><p class="${r.big ? "nt" : "nl"}">${r.now}</p>${r.tag ? `<span class="tag">${r.tag}</span>` : ""}</div>
</div>`).join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Job ad makeover</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#label{left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}}
#hook{left:80px;right:80px;top:640px;font-family:'DM Serif Display';font-size:120px;line-height:1.02;color:${C.navy}}
#head{left:80px;right:80px;top:320px;font-family:'DM Serif Display';font-size:80px;line-height:1.04;color:${C.navy};opacity:0}
#card{position:absolute;left:60px;right:60px;top:520px;padding:44px 48px 40px;box-sizing:border-box;border-radius:20px;background:#fff;border:2px solid #D3D7DD;box-shadow:0 16px 40px rgba(27,43,75,.10);opacity:0}
.row{margin-bottom:24px}
.old{position:relative;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:42px;color:#555}
.old.big{font-weight:700;font-size:54px;color:#333}
.scrib{position:absolute;left:-14px;top:-6px;overflow:visible}
.new{margin-top:0;height:0;overflow:hidden;opacity:0}
.nt{font-family:'DM Serif Display';font-size:60px;line-height:1.08;color:${C.navy}}
.nl{font-family:Poppins;font-weight:600;font-size:40px;line-height:1.35;color:${C.navy}}
.tag{display:inline-block;margin-top:12px;padding:8px 20px;border-radius:999px;background:${C.mist};font-family:Poppins;font-size:26px;color:${C.navy}}
#chips{display:flex;flex-wrap:wrap;gap:14px;margin-top:8px}
.chip{padding:12px 24px;border-radius:999px;background:${C.navy};font-family:Poppins;font-weight:600;font-size:28px;color:${C.cream};opacity:0}
.chip b{color:${C.buff ?? "#D8B48A"}}
#feather{position:absolute;left:0;top:0;width:900px;pointer-events:none;opacity:0}
#feather svg{width:100%;height:auto;display:block}
#msg{left:80px;right:80px;top:640px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="label">FOR CLINICS</p>
<p class="abs" id="hook">Your job ad,<br><span style="color:${C.chestnut}">before and after.</span></p>
<p class="abs" id="head">Before and <span style="color:${C.chestnut}">after.</span></p>
<div id="card">${rows}<div id="chips"><span class="chip" id="c0">Existing vacancy: Yes</span><span class="chip" id="c1">Uses AI to screen candidates: No</span></div></div>
<div id="feather">${featherSvg}</div>
<div class="abs" id="msg">
<p style="font-family:'DM Serif Display';font-size:110px;line-height:1.04;color:${C.navy}">Clear ads get<br><span style="color:${C.chestnut}">better applicants.</span></p>
<p style="font-family:Poppins;font-size:42px;line-height:1.45;color:${C.slate};margin-top:60px">Kestrel&apos;s form asks for all of this, and the ad builder drafts it for you.</p>
</div>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:64px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Set up your clinic: link in bio</p>
</div>
</div>
<script>
const T = ${JSON.stringify(T)}, N = ${ROWS.length};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const el = (id) => document.getElementById(id);
const SCALE = 0.62;
let FB = null;
function scribble(i) { // 2 passes of tight slanted strokes, left to right and back, built once from the line's own size
  const p = el("sp" + i); if (p.dataset.len) return p;
  const ot = el("ot" + i).getBoundingClientRect(), W = ot.width + 28, H = ot.height + 12, sc = el("sc" + i);
  sc.setAttribute("width", W); sc.setAttribute("height", H);
  const pts = []; let j = 0;
  for (let x = 2; x < W - 4; x += 9 + ((j * 7) % 6), j++) pts.push([x + (j % 2 ? -6 : 6), j % 2 ? H * (0.08 + ((j * 13) % 5) / 50) : H * (0.92 - ((j * 11) % 5) / 50)]);
  for (let x = W - 6; x > 2; x -= 11 + ((j * 5) % 6), j++) pts.push([x + (j % 2 ? 5 : -5), j % 2 ? H * (0.18 + ((j * 7) % 5) / 40) : H * (0.8 - ((j * 3) % 5) / 40)]);
  p.setAttribute("d", "M " + pts.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" L "));
  p.dataset.len = p.getTotalLength(); return p;
}
window.render = (t) => {
  if (!FB) { const f = el("feather").getBoundingClientRect(); const g = Array.from(document.querySelectorAll("#fsvg .fp")).map((e) => e.getBoundingClientRect());
    FB = { x: Math.min(...g.map((b) => b.left)) - f.left, y: Math.min(...g.map((b) => b.top)) - f.top, w: Math.max(...g.map((b) => b.right)) - Math.min(...g.map((b) => b.left)), h: Math.max(...g.map((b) => b.bottom)) - Math.min(...g.map((b) => b.top)) }; }
  const fBox = el("f").getBoundingClientRect();
  el("label").style.opacity = out(span(t, 0, 0.5)) * (1 - span(t, T.end - 0.3, T.end));
  const h = out(span(t, 0.2, 0.9)); el("hook").style.opacity = h * (1 - span(t, T.card - 0.6, T.card - 0.2)); el("hook").style.transform = "translateY(" + 30 * (1 - h) + "px)";
  const gone = span(t, T.msg - 0.4, T.msg);
  el("head").style.opacity = out(span(t, T.card - 0.2, T.card + 0.4)) * (1 - gone);
  const cIn = out(span(t, T.card, T.card + 0.6)); el("card").style.opacity = cIn * (1 - gone); el("card").style.transform = "translateY(" + 40 * (1 - cIn) + "px)";
  let fOn = 0, fx = 0, fy = 0, fr = 0;
  for (let i = 0; i < N; i++) {
    const s = T.first + i * T.each, p = scribble(i), L = +p.dataset.len, k = span(t, s, s + 0.9);
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L * (1 - k);
    el("ot" + i).style.opacity = 1 - 0.55 * span(t, s + 0.9, s + 1.3);
    if (t >= s - 0.15 && t <= s + 1.15) { fOn = span(t, s - 0.15, s) * (1 - span(t, s + 0.9, s + 1.15));
      const pt = p.getPointAtLength(L * k), sb = el("sc" + i).getBoundingClientRect(); fx = sb.left - fBox.left + pt.x; fy = sb.top - fBox.top + pt.y; fr = 10 * Math.sin(k * 40); }
    // The row opens up as its rewrite arrives, so the "before" ad starts as tight as a real one.
    const nw = out(span(t, s + 1.0, s + 1.6)), ne = el("nw" + i); ne.style.height = (nw * ne.scrollHeight) + "px"; ne.style.marginTop = (12 * nw) + "px";
    ne.style.opacity = nw; ne.style.transform = "translateX(" + 30 * (1 - nw) + "px)";
  }
  const fe = el("feather"); fe.style.opacity = fOn;
  fe.style.transformOrigin = (FB.x + FB.w) + "px " + (FB.y + FB.h) + "px";
  fe.style.transform = "translate(" + (fx - (FB.x + FB.w)) + "px," + (fy - (FB.y + FB.h)) + "px) scale(" + SCALE + ")"; fe.style.rotate = fr + "deg";
  for (let i = 0; i < 2; i++) { const k = out(span(t, T.chips + i * 0.5, T.chips + i * 0.5 + 0.4)); el("c" + i).style.opacity = k; el("c" + i).style.transform = "scale(" + (0.8 + 0.2 * k) + ")"; }
  const m = out(span(t, T.msg, T.msg + 0.6)); el("msg").style.opacity = m * (1 - span(t, T.end - 0.4, T.end)); el("msg").style.transform = "translateY(" + 30 * (1 - m) + "px)";
  el("end").style.opacity = span(t, T.end - 0.3, T.end + 0.2);
  const show = (id, a) => { const v = out(span(t, a, a + 0.6)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 24 * (1 - v) + "px)"; };
  show("e1", T.end + 0.6); show("e2", T.end + 1.2);
};
// The cover: the finished makeover, nothing mid move.
window.cover = () => { window.render(T.msg - 0.6); el("feather").style.opacity = 0; };
</script></body></html>`;

const file = join(OUT, "makeover-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 5.0, 9.4, 17.4, 19.5, 23]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `makeover-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "makeover-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "makeover-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

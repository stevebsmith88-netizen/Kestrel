// "Auto apply" Reel (Steve, 20th November 2026): a dig at bots that apply to everything, aimed at the bots, not the people using them.
// A phone's "Auto apply" switch flicks on and job cards are swiped right on everything; then the clinic's inbox fills with the same
// letter; the kestrel swoops across and clears it; then Kestrel's 2 real rules and the logo.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-autoapply-reel.mjs
// 1080 x 1920, 30 frames a second, 20 seconds, no sound. Needs ffmpeg.
// Claims are true today: at most 30 applications in 24 hours (lib/apply-limit.ts), and only for roles that fit the candidate's
// profession (lib/role-fit.ts). The phone and cards are generic (no real app, job board or company names).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY } from "./kestrel-bird-side.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", mist: "#DCE3E6", line: "#E3D9C8", slate: "#5A6672" };
const FPS = 30;
const SECONDS = 20;

const ROLES = ["Optician", "Forklift operator", "Dental hygienist", "Chief executive", "Rockstar wanted!", "Barista", "Airline pilot", "Optometrist",
  "Welder", "Night security", "Yoga instructor", "Payroll clerk", "Brain surgeon", "Lifeguard", "Sous chef", "Crane operator", "Optometric assistant", "Tattoo artist"];
const SWIPE_START = 1.0, SWIPE_END = 5.0;
// Swipes speed up: each card's start time, packed closer together as the bot gets going.
const swipeTimes = []; for (let i = 0, t = SWIPE_START; t < SWIPE_END - 0.2; i++) { swipeTimes.push(t); t += Math.max(0.12, 0.45 - i * 0.035); }

const LETTER = "Dear Hiring Manager, I am excited to apply for the [Job Title] position at [Company]. I am a passionate self starter with a proven track record of";

function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r = rng(23);
const letters = Array.from({ length: 50 }, (_, i) => ({ x: -60 + r() * 700, y: 640 + r() * 1150, rot: -10 + r() * 20, at: 5.4 + i * 0.045 }));

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Auto apply</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#noise{position:absolute;inset:0;background:#E9EBEE;overflow:hidden;font-family:Arial,Helvetica,sans-serif}
#band{position:absolute;left:0;right:0;top:0;height:640px;background:${C.cream};box-shadow:0 10px 30px rgba(0,0,0,.08);z-index:5}
.hook{position:absolute;left:80px;right:80px;top:300px;font-family:'DM Serif Display';font-size:88px;line-height:1.04;color:${C.navy}}
#counter{position:absolute;right:80px;top:250px;font-weight:700;font-size:30px;color:#8A9099}
#phone{position:absolute;left:250px;top:720px;width:580px;height:1060px;border-radius:70px;background:#2B2F36;box-shadow:0 30px 60px rgba(0,0,0,.25)}
#screen{position:absolute;left:24px;top:24px;right:24px;bottom:24px;border-radius:50px;background:#F4F5F7;overflow:hidden}
#toggle{position:absolute;left:40px;right:40px;top:60px;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:34px;color:#333}
#sw{width:110px;height:60px;border-radius:30px;background:#C3C8CF;position:relative}#knob{position:absolute;top:6px;left:6px;width:48px;height:48px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.card{position:absolute;left:40px;right:40px;top:190px;height:600px;border-radius:30px;background:#fff;border:2px solid #D3D7DD;box-shadow:0 10px 26px rgba(0,0,0,.12);padding:50px 40px;box-sizing:border-box}
.card .t{font-weight:700;font-size:52px;line-height:1.15;color:#333}
.card .b{height:18px;background:#D9DDE2;border-radius:9px;margin-top:26px;width:75%}.card .b.s{width:50%}
.stamp{position:absolute;right:30px;top:40px;border:6px solid #3F9D58;color:#3F9D58;font-weight:700;font-size:40px;padding:6px 18px;border-radius:12px;transform:rotate(14deg);opacity:0}
.letter{position:absolute;width:520px;padding:30px 34px;box-sizing:border-box;background:#fff;border:2px solid #D3D7DD;border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.10);font-size:24px;line-height:1.45;color:#555;opacity:0}
.letter b{color:#333}
#calm{position:absolute;inset:0}
.ch{position:absolute;left:80px;right:80px;top:300px;font-family:'DM Serif Display';font-size:96px;line-height:1.04;color:${C.navy}}
#rules{position:absolute;left:80px;right:80px;top:700px;display:flex;flex-direction:column;gap:36px}
.rule{display:flex;align-items:center;gap:36px;padding:40px 44px;border-radius:14px;background:${C.paper};border:2px solid ${C.line};box-shadow:0 10px 24px rgba(27,43,75,.08);opacity:0}
.big{font-family:'DM Serif Display';font-size:130px;line-height:1;color:${C.chestnut};min-width:170px;text-align:center}
.rt{font-family:Poppins;font-size:40px;line-height:1.3;color:${C.navy}}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<div id="calm">
<p class="abs" style="left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">EYE CARE JOBS</p>
<p class="ch" id="ch">Fewer, better applications.<br><span style="color:${C.chestnut}">For jobs that fit.</span></p>
<div id="rules">
<div class="rule" id="r0"><p class="big">30</p><p class="rt">applications a day, at most, for each candidate</p></div>
<div class="rule" id="r1"><svg width="170" height="130" viewBox="0 0 24 24" fill="none" stroke="${C.chestnut}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><p class="rt">Only for roles that fit the candidate&apos;s profession</p></div>
</div></div>
<div id="noise">
<div id="phone"><div id="screen">
<div id="toggle"><span>Auto apply</span><div id="sw"><div id="knob"></div></div></div>
${swipeTimes.map((t, i) => `<div class="card" id="c${i}" data-at="${t}" style="z-index:${200 - i}"><p class="t">${ROLES[i % ROLES.length]}</p><div class="b"></div><div class="b s"></div><div class="b"></div><div class="stamp">APPLIED</div></div>`).join("")}
</div></div>
${letters.map((l, i) => `<div class="letter" id="l${i}" data-at="${l.at}" style="left:${l.x}px;top:${l.y}px;transform:rotate(${l.rot}deg)"><b>${LETTER.slice(0, 19)}</b>${LETTER.slice(19)}</div>`).join("")}
<div id="band"><p id="counter"></p>
<p class="hook" id="h1">Applied to 312 jobs.<br><span style="color:${C.chestnut}">Read none of them.</span></p>
<p class="hook" id="h2" style="opacity:0">The clinicMeanwhile, at the clinic:<br><span style="color:${C.chestnut}">the same letter, 50 times.</span>apos;s inbox:<br><span style="color:${C.chestnut}">1 letter, 50 times.</span></p>
</div></div>
<svg style="position:absolute;left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}</g></svg>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:72px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:38px;line-height:1.45;color:${C.chestnut};margin-top:44px">Pre launch is open.<br>Create your account: link in bio</p>
</div>
</div>
<script>
const SW = [${SWIPE_START}, ${SWIPE_END}];
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const CUT = [8.1, 9.0];
window.render = (t) => {
  // The switch flicks on.
  const on = out(span(t, 0.5, 0.8));
  el("knob").style.left = (6 + 50 * on) + "px"; el("sw").style.background = on > 0.5 ? "#3F9D58" : "#C3C8CF";
  // Swipe right on everything: each card is stamped, then flies off to the right.
  document.querySelectorAll(".card").forEach((c) => { const a = +c.dataset.at, s = span(t, a + 0.08, a + 0.3);
    c.style.transform = "translateX(" + 1000 * s * s + "px) rotate(" + 24 * s + "deg)"; c.style.opacity = t < a - 0.6 ? 0 : 1;
    c.querySelector(".stamp").style.opacity = span(t, a, a + 0.06); });
  // The phone leaves and the clinic's inbox fills with the same letter.
  el("phone").style.opacity = 1 - span(t, 5.0, 5.4);
  document.querySelectorAll(".letter").forEach((l) => { const a = +l.dataset.at, k = span(t, a, a + 0.25); l.style.opacity = k > 0 ? 1 : 0;
    l.style.scale = 0.6 + 0.4 * back(k); });
  el("counter").textContent = t < 5.2 ? Math.round(312 * out(span(t, 1.0, 5.0))) + " applications sent today" : Math.round(50 * span(t, 5.4, 7.7)) + " identical letters";
  el("h1").style.opacity = 1 - span(t, 5.0, 5.3); el("h2").style.opacity = span(t, 5.2, 5.5);
  // The kestrel swoops across and clears it all.
  const c = span(t, CUT[0], CUT[1]), bx = -500 + 2100 * c;
  el("noise").style.clipPath = t < CUT[0] ? "none" : "inset(0 0 0 " + Math.max(0, bx - 120) + "px)";
  el("noise").style.display = t > CUT[1] ? "none" : "block";
  const flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  el("bird").setAttribute("transform", "translate(" + bx + " " + (1060 - 140 * Math.sin(Math.PI * c)) + ") scale(2.7) rotate(" + (-8 + 16 * c) + ")");
  el("bird").style.opacity = t > CUT[0] - 0.05 && t < CUT[1] ? 1 : 0;
  // The calm: Kestrel's 2 rules.
  const show = (id, a, d = 40) => { const e = el(id); const k = out(span(t, a, a + 0.6)); e.style.opacity = k; e.style.transform = "translateY(" + d * (1 - k) + "px)"; };
  show("ch", 9.2); show("r0", 10.4); show("r1", 11.6);
  el("calm").style.opacity = 1 - span(t, 15.0, 15.5);
  el("end").style.opacity = span(t, 15.2, 15.7);
  show("e1", 16.2, 30); show("e2", 16.9, 30);
};
</script></body></html>`;

const file = join(OUT, "autoapply-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [0.9, 2.6, 4.6, 6.6, 8.5, 12.5, 18]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `auto-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "autoapply-reel.mp4");
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
for (let n = 0; n < FPS * SECONDS; n++) {
  await tab.evaluate((t) => window.render(t), n / FPS);
  const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
  if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await done;
await tab.evaluate(() => window.render(3.2));
await frame.screenshot({ path: join(OUT, "autoapply-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

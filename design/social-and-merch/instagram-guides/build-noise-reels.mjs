// "Cut the noise" Reels (Steve, 20th November 2026): 1 for candidates, 1 for clinics.
// Part 1, the noise: generic grey job cards (or applicants) flood the screen. Part 2, the cut: the kestrel swoops across and clears it.
// Part 3, the calm: how Kestrel works, then the logo and the sign up line.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-noise-reels.mjs
// 1080 x 1920, 30 frames a second, 18 seconds each, no sound. Needs ffmpeg.
// Rules: the noise is deliberately generic (plain grey cards in a plain system font, no names, logos, colours or layouts of any real
// job board, and no real clinic names anywhere). Claims about Kestrel are true today: every job shows its pay, the board is eye care only,
// and only a candidate whose profession fits the role can apply (lib/role-fit.ts). No "applicants from other countries" (Steve agreed):
// the clinic noise is people who did not read the ad.
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
const SECONDS = 18;

const VARIANTS = {
  candidates: {
    hook: ["Scrolling 4,000 jobs", "to find 1 that fits?"],
    counter: (n) => `${n.toLocaleString("en-CA")} results`, count: 4382,
    noise: ["Warehouse associate", "Sales rep, commission only", "Rockstar wanted!", "Customer service, remote?", "Delivery driver",
      "Retail, see description", "Healthcare, various roles", "Front desk, multiple locations", "Team member", "Optical, 2 hours away",
      "Assistant, details on request", "Brand ambassador", "Posted 30+ days ago", "Entry level, all welcome"],
    pay: ["Pay: competitive", "Salary: not stated", "Pay: DOE", "Salary: negotiable", "Pay: competitive", "Salary: not stated"],
    calmHead: ["1 search.", "Only eye care."],
    calmLine: "Choose your role and province. Every job shows its pay.",
    search: ["Optician", "Alberta"],
    cards: [
      { t: "Optician", m: "Independent clinic · Calgary", p: "$25 to $31 an hour", e: "Full time" },
      { t: "Licensed optician", m: "Independent clinic · Edmonton", p: "$27 to $33 an hour", e: "Full time" },
      { t: "Optician, part time", m: "Corporate practice · Red Deer", p: "$24 to $29 an hour", e: "Part time" },
    ],
    cta: "Pre launch is open.<br>Create your account: link in bio",
  },
  clinics: {
    hook: ["Your job post,", "on page 9."],
    hook2: ["And 247 applicants", "who didn't read it."],
    counter: (n) => `Page ${n}`, count: 9,
    counter2: (n) => `${n} applicants`, count2: 247,
    noise: ["Warehouse associate", "Sales rep, commission only", "Rockstar wanted!", "Customer service", "Delivery driver",
      "Retail associate", "Team member", "Brand ambassador", "Entry level, all welcome", "Front desk, various"],
    pay: ["Pay: competitive", "Salary: not stated", "Pay: DOE", "Salary: negotiable"],
    applicants: ["Applied for: dental assistant", "Cover letter: Dear Sir or Madam at [Company]", "Experience: barista", "Hi, is this still available?",
      "Applied for: forklift operator", "Didn't answer your questions", "Applied for: retail sales", "Cover letter: for a different job",
      "Experience: none listed", "Applied to every job in the city"],
    calmHead: ["Your post stays", "where eye care looks."],
    calmLine: "Only people in eye care see it. Only people whose role fits can apply.",
    post: { t: "Optician", m: "Your clinic · Calgary", p: "$25 to $31 an hour" },
    fits: [
      { t: "Licensed optician", m: "Calgary · 6 years in practice" },
      { t: "Optician", m: "Lethbridge · contact lens fitting" },
      { t: "Licensed optician", m: "Calgary · frame styling and dispensing" },
    ],
    cta: "Pre launch is open.<br>Set up your clinic: link in bio",
  },
};

// A fixed random sequence, so every build places the cards the same way.
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const grey = (title, line, i) => `<div class="g" data-i="${i}"><p class="gt">${title}</p><div class="gb"></div><div class="gb s"></div><p class="gp">${line}</p><p class="ga">Apply now</p></div>`;
const applicant = (line, i) => `<div class="g a" data-i="${i}"><div class="av"></div><div><div class="gb"></div><p class="gp">${line}</p></div></div>`;

function page(name, v) {
  const r = rng(name === "candidates" ? 7 : 11);
  // Pop up cards all over the screen; for clinics, a second wave of applicant cards after 3 seconds.
  const pops = [];
  for (let i = 0; i < 64; i++) {
    const app = name === "clinics" && i >= 34;
    pops.push({ x: -80 + r() * 860, y: 620 + r() * 1220, rot: -9 + r() * 18, at: app ? 3.0 + (i - 34) * 0.065 : 0.5 + i * (name === "clinics" ? 0.075 : 0.07),
      html: app ? applicant(v.applicants[i % v.applicants.length], i) : grey(v.noise[i % v.noise.length], v.pay[i % v.pay.length], i) });
  }
  const feed = Array.from({ length: 30 }, (_, i) => grey(v.noise[(i * 5) % v.noise.length], v.pay[(i * 3) % v.pay.length], 100 + i)).join("");
  const calm = name === "candidates" ? `
<div class="row" id="search"><div class="pill">${v.search[0]}</div><div class="pill">${v.search[1]}</div><div class="pill go">Search</div></div>
${v.cards.map((c, i) => `<div class="kc" id="k${i}"><p class="kt">${c.t}</p><p class="km">${c.m}</p><div class="tags"><span class="cap pay">${c.p}</span><span class="cap">${c.e}</span></div></div>`).join("")}`
    : `
<div class="kc post" id="k0"><p class="kt" style="color:${C.cream}">${v.post.t}</p><p class="km" style="color:${C.cream}">${v.post.m}</p><div class="tags"><span class="cap pay" style="background:${C.cream};color:${C.chestnut}">${v.post.p}</span></div></div>
<p class="sub" id="k1">Applicants</p>
${v.fits.map((c, i) => `<div class="kc app" id="k${i + 2}"><div class="av k"></div><div style="flex:1"><p class="kt" style="font-size:38px">${c.t}</p><p class="km">${c.m}</p></div><span class="cap fit">Fits the role</span></div>`).join("")}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Cut the noise</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
.abs{position:absolute}
#noise{position:absolute;inset:0;background:#E9EBEE;overflow:hidden}
#feed{position:absolute;left:30px;right:30px;top:0;display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
.g{width:420px;box-sizing:border-box;padding:22px 26px;background:#fff;border:2px solid #D3D7DD;border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.10);font-family:Arial,Helvetica,sans-serif;color:#333}
#feed .g{width:auto;opacity:.75}
.pop{position:absolute;opacity:0}
.gt{font-weight:700;font-size:30px;line-height:1.2}
.gb{height:14px;background:#D9DDE2;border-radius:7px;margin-top:14px;width:70%}.gb.s{width:45%}
.gp{font-size:24px;color:#8A9099;margin-top:14px}
.ga{display:inline-block;margin-top:14px;font-size:22px;font-weight:700;color:#fff;background:#9AA1AA;padding:8px 16px;border-radius:6px}
.g.a{display:flex;gap:18px;align-items:center}.av{width:64px;height:64px;border-radius:50%;background:#C9CED5;flex:none}
#yourpost{position:absolute;left:290px;top:1040px;width:500px;padding:26px 30px;box-sizing:border-box;background:${C.chestnut};border-radius:10px;color:${C.cream};font-family:Poppins;box-shadow:0 10px 26px rgba(0,0,0,.2);opacity:0}
#band{position:absolute;left:0;right:0;top:0;height:640px;background:${C.cream};box-shadow:0 10px 30px rgba(0,0,0,.08)}
.hook{position:absolute;left:80px;right:80px;top:300px;font-family:'DM Serif Display';font-size:88px;line-height:1.04;color:${C.navy}}
#counter{position:absolute;right:80px;top:250px;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:30px;color:#8A9099}
#calm{position:absolute;inset:0}
.ch{position:absolute;left:80px;right:80px;top:300px;font-family:'DM Serif Display';font-size:96px;line-height:1.04;color:${C.navy}}
.cl{position:absolute;left:80px;right:80px;top:530px;font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate}}
#calmbody{position:absolute;left:80px;right:80px;top:720px;display:flex;flex-direction:column;gap:28px}
.row{display:flex;gap:16px}.pill{padding:20px 30px;border-radius:8px;background:${C.paper};border:3px solid ${C.navy};font-family:Poppins;font-weight:600;font-size:34px;color:${C.navy}}
.pill.go{background:${C.navy};color:${C.cream}}
.kc{padding:30px 34px;border-radius:12px;background:${C.paper};border:2px solid ${C.line};box-shadow:0 10px 24px rgba(27,43,75,.08);font-family:Poppins;opacity:0}
.kc.post{background:${C.chestnut};border-color:${C.chestnut}}
.kc.app{display:flex;align-items:center;gap:24px;padding:24px 30px}
.av.k{width:72px;height:72px;background:${C.mist}}
.kt{font-family:'DM Serif Display';font-size:46px;line-height:1.1;color:${C.navy}}
.km{font-size:28px;color:${C.slate};margin-top:6px}
.tags{display:flex;gap:12px;margin-top:18px}.cap{padding:10px 22px;border-radius:999px;background:${C.mist};font-size:26px;color:${C.navy};white-space:nowrap}
.cap.pay{background:${C.navy};color:${C.cream};font-weight:600}.cap.fit{background:${C.chestnut};color:${C.cream};font-weight:600;font-size:24px}
.sub{font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:.2em;text-transform:uppercase;color:${C.chestnut};margin-top:18px;opacity:0}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<div id="calm">
<p class="abs" style="left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">EYE CARE JOBS</p>
<p class="ch" id="ch">${v.calmHead[0]}<br><span style="color:${C.chestnut}">${v.calmHead[1]}</span></p>
<p class="cl" id="cl">${v.calmLine}</p>
<div id="calmbody">${calm}</div>
</div>
<div id="noise">
<div id="feed">${feed}</div>
${name === "clinics" ? `<div id="yourpost"><p style="font-size:24px;letter-spacing:.2em;font-weight:600">YOUR POST</p><p style="font-family:'DM Serif Display';font-size:48px;margin-top:6px">${v.post.t}, Calgary</p></div>` : ""}
${pops.map((p, i) => `<div class="pop" id="p${i}" data-at="${p.at}" style="left:${p.x}px;top:${p.y}px">${p.html}</div>`).join("")}
<div id="band"><p id="counter"></p>
<p class="hook" id="h1">${v.hook[0]}<br><span style="color:${C.chestnut}">${v.hook[1]}</span></p>
${v.hook2 ? `<p class="hook" id="h2" style="opacity:0">${v.hook2[0]}<br><span style="color:${C.chestnut}">${v.hook2[1]}</span></p>` : ""}
</div></div>
<svg id="birdsvg" style="position:absolute;left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}</g></svg>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:72px;color:${C.navy};margin-top:80px">Every job shows its pay.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:38px;line-height:1.45;color:${C.chestnut};margin-top:44px">${v.cta}</p>
</div>
</div>
<script>
const V = ${JSON.stringify({ name, count: v.count, count2: v.count2 || 0 })};
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
const CUT = [5.2, 6.1];
window.render = (t) => {
  // The noise: the feed scrolls faster and faster, cards pop up everywhere, the counter races.
  const sp = 300 * t + 140 * t * t;
  el("feed").style.transform = "translateY(" + (-(sp % 1600)) + "px)";
  document.querySelectorAll(".pop").forEach((p) => { const a = +p.dataset.at, k = span(t, a, a + 0.3);
    p.style.opacity = k > 0 ? 1 : 0; p.style.transform = "scale(" + (0.6 + 0.4 * back(k)) + ") rotate(" + ((+p.dataset.at * 37) % 14 - 7) + "deg)"; });
  if (V.name === "candidates") el("counter").textContent = Math.round(V.count * out(span(t, 0.4, 4.8))).toLocaleString("en-CA") + " results";
  else {
    const yp = el("yourpost"), d = out(span(t, 0.2, 0.7)); yp.style.opacity = d; yp.style.transform = "translateY(" + (-300 * (1 - d) + 260 * out(span(t, 0.9, 3.0))) + "px)";
    el("counter").textContent = t < 3.0 ? "Page " + Math.max(1, Math.round(9 * out(span(t, 0.9, 2.9)))) : Math.round(V.count2 * out(span(t, 3.0, 5.0))) + " applicants";
    el("h1").style.opacity = 1 - span(t, 2.8, 3.1); el("h2").style.opacity = span(t, 3.0, 3.3);
  }
  // The cut: the kestrel swoops across, wings beating, and everything behind it is gone.
  const c = span(t, CUT[0], CUT[1]), bx = -500 + 2100 * c;
  el("noise").style.clipPath = t < CUT[0] ? "none" : "inset(0 0 0 " + Math.max(0, bx - 120) + "px)";
  el("noise").style.display = t > CUT[1] ? "none" : "block";
  const flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  el("bird").setAttribute("transform", "translate(" + bx + " " + (1060 - 140 * Math.sin(Math.PI * c)) + ") scale(2.7) rotate(" + (-8 + 16 * c) + ")");
  el("bird").style.opacity = t > CUT[0] - 0.05 && t < CUT[1] ? 1 : 0;
  // The calm: how Kestrel works.
  const show = (id, a, d = 40) => { const e = el(id); if (!e) return; const k = out(span(t, a, a + 0.6)); e.style.opacity = k; e.style.transform = "translateY(" + d * (1 - k) + "px)"; };
  show("ch", 6.2); show("cl", 6.8);
  if (el("search")) show("search", 7.3);
  for (let i = 0; i < 5; i++) show("k" + i, 7.8 + i * 0.55);
  el("calm").style.opacity = 1 - span(t, 13.2, 13.7);
  // The end: the logo, the promise, the sign up line.
  el("end").style.opacity = span(t, 13.4, 13.9);
  show("e1", 14.4, 30); show("e2", 15.1, 30);
};
</script></body></html>`;
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, v] of Object.entries(VARIANTS)) {
  const file = join(OUT, `noise-reel-${name}.html`);
  writeFileSync(file, page(name, v));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  const frame = tab.locator("#f");
  if (process.env.STILLS) {
    for (const t of [1.5, 3.6, 5.0, 5.6, 10, 16]) {
      await tab.evaluate((x) => window.render(x), t);
      await frame.screenshot({ path: join(process.env.STILLS, `noise-${name}-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
    }
    if (process.env.STILLS_ONLY) continue;
  }
  const mp4 = join(OUT, `noise-reel-${name}.mp4`);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", mp4], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (code) => (code === 0 ? res() : rej(new Error("ffmpeg " + code)))));
  for (let n = 0; n < FPS * SECONDS; n++) {
    await tab.evaluate((t) => window.render(t), n / FPS);
    const jpg = await frame.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
  // The cover: the noise at its peak, with the hook, so it stops the scroll.
  await tab.evaluate(() => window.render(4.8));
  await frame.screenshot({ path: join(OUT, `noise-reel-${name}-cover.jpg`), type: "jpeg", quality: 92 });
  console.log(`Built ${mp4}`);
}
await browser.close();

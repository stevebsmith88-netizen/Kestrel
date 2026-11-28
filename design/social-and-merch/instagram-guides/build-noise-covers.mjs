// Covers for the 3 "Cut the noise" Reels (Steve, 20th November 2026: covers should be designed, not screenshots).
// 1 series look: a headline on Cream, then the noise on the right and clean Cream on the left, split where the kestrel flies through,
// with 1 calm Kestrel card on the clean side. Everything that matters sits inside the middle 3:4, which the profile grid shows.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-noise-covers.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY, flyWings } from "./kestrel-bird-side.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", paper: "#FBF8F2", mist: "#DCE3E6", line: "#E3D9C8", slate: "#5A6672" };

const grey = (t, p) => `<div class="g"><p class="gt">${t}</p><div class="gb"></div><div class="gb s"></div><p class="gp">${p}</p></div>`;
const app = (p) => `<div class="g a"><div class="av"></div><div style="flex:1"><div class="gb"></div><p class="gp">${p}</p></div></div>`;
const letter = `<div class="g"><p class="gp" style="margin:0;color:#555"><b style="color:#333">Dear Hiring Manager,</b> I am excited to apply for the [Job Title] position at [Company]. I am a passionate self starter</p></div>`;

const COVERS = {
  candidates: { who: "FOR CANDIDATES", head: ["4,000 jobs.", "1 that fits."],
    noise: [grey("Warehouse associate", "Pay: competitive"), grey("Rockstar wanted!", "Salary: not stated"), grey("Sales rep, commission only", "Pay: DOE"),
      grey("Optical, 2 hours away", "Salary: negotiable"), grey("Team member", "Pay: competitive"), grey("Delivery driver", "Salary: not stated"), grey("Brand ambassador", "Pay: DOE")],
    calm: `<div class="kc"><p class="kt">Optician</p><p class="km">Independent clinic · Calgary</p><span class="cap pay">$25 to $31 an hour</span></div>` },
  clinics: { who: "FOR CLINICS", head: ["247 applicants.", "Who read the ad?"],
    noise: [app("Applied for: dental assistant"), app("Hi, is this still available?"), app("Experience: barista"), app("Cover letter: for a different job"),
      app("Applied for: forklift operator"), app("Didn't answer your questions"), app("Experience: none listed")],
    calm: `<div class="kc"><p class="kt">Licensed optician</p><p class="km">Calgary · 6 years in practice</p><span class="cap fit">Fits the role</span></div>` },
  autoapply: { who: "AUTO APPLY", head: ["312 applications.", "0 of them read."],
    noise: [letter, letter, letter, letter, letter, letter, letter],
    calm: `<div class="kc"><svg width="90" height="70" viewBox="0 0 24 24" fill="none" stroke="${C.chestnut}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><p class="km" style="font-size:32px;color:${C.navy};margin-top:8px">Only for roles that fit the candidate&apos;s profession</p></div>` },
};

const html = (c) => {
  const w = flyWings(0.3);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Cover</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}}
#noise{position:absolute;inset:0;background:#E9EBEE;clip-path:polygon(640px 700px,1080px 700px,1080px 1920px,520px 1920px);font-family:Arial,Helvetica,sans-serif}
.stack{position:absolute;left:560px;top:700px;width:560px}
.g{width:470px;box-sizing:border-box;padding:24px 28px;background:#fff;border:2px solid #D3D7DD;border-radius:10px;box-shadow:0 8px 22px rgba(0,0,0,.10);color:#333;margin:-30px 0 0 0}
.gt{font-weight:700;font-size:30px}.gb{height:14px;background:#D9DDE2;border-radius:7px;margin-top:14px;width:70%}.gb.s{width:45%}
.gp{font-size:24px;color:#8A9099;margin-top:14px;line-height:1.4}
.g.a{display:flex;gap:18px;align-items:center}.av{width:60px;height:60px;border-radius:50%;background:#C9CED5;flex:none}
.who{position:absolute;left:80px;top:300px;font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:0.24em;color:${C.chestnut}}
.head{position:absolute;left:80px;right:60px;top:360px;font-family:'DM Serif Display';font-size:118px;line-height:1.02;color:${C.navy}}
.kc{position:absolute;left:70px;top:1040px;width:470px;box-sizing:border-box;padding:34px 36px;border-radius:14px;background:${C.paper};border:2px solid ${C.line};box-shadow:0 14px 30px rgba(27,43,75,.12);font-family:Poppins}
.kt{font-family:'DM Serif Display';font-size:50px;line-height:1.1;color:${C.navy}}.km{font-size:26px;color:${C.slate};margin-top:6px}
.cap{display:inline-block;margin-top:20px;padding:10px 22px;border-radius:999px;font-size:26px;font-weight:600}
.cap.pay{background:${C.navy};color:${C.cream}}.cap.fit{background:${C.chestnut};color:${C.cream}}
.foot{position:absolute;left:80px;top:1560px;display:flex;align-items:center;gap:16px}
</style></head><body><div id="f">
<div id="noise"><div class="stack">${c.noise.map((n, i) => `<div style="transform:translateX(${(i % 3) * 30 - 20}px) rotate(${[-6, 5, -3, 7, -5, 4, -7][i]}deg)">${n}</div>`).join("")}</div></div>
<p class="who">${c.who}</p>
<p class="head">${c.head[0]}<br><span style="color:${C.chestnut}">${c.head[1]}</span></p>
${c.calm}
<svg style="position:absolute;left:0;top:0;overflow:visible" width="1080" height="1920"><g transform="translate(610 1420) scale(1.7) rotate(-8)">${FLY}</g></svg>
<div class="foot"><img src="${brand("kestrel-k-mark.svg")}" alt="" style="width:60px;height:60px"><p style="font-family:Poppins;font-size:28px;letter-spacing:0.06em;color:${C.slate}">eyecarejobs.ca</p></div>
<script>document.getElementById("nearwing").setAttribute("transform", ${JSON.stringify(w.near)}); document.getElementById("farwing").setAttribute("transform", ${JSON.stringify(w.far)});</script>
</div></body></html>`;
};

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, c] of Object.entries(COVERS)) {
  const file = join(OUT, `${name === "autoapply" ? "autoapply-reel" : `noise-reel-${name}`}-cover.html`);
  writeFileSync(file, html(c));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.locator("#f").screenshot({ path: file.replace(".html", ".jpg"), type: "jpeg", quality: 92 });
}
await browser.close();
console.log("Built noise covers");

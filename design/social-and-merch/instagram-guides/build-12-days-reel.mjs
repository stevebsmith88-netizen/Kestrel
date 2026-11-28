// "12 days of Christmas" Reel (Steve, 28th November 2026): the countdown from 10 to the partridge becomes 10 reasons to sign up to
// Kestrel, with an ornament added to the tree on each number, some of them optical (glasses, a trial lens, an ophthalmoscope, a contact
// lens case, an eye chart tag). The kestrel sits on top of the tree like the star.
// Timed to The Twelve Days of Christmas (feat. The Puppini Sisters; Bing Crosby, The Andrews Sisters, London Symphony Orchestra) from
// where Instagram's picker starts it (Steve's screen recording and words): "Ten lords" at 1.1 seconds, about 1.36 seconds a number,
// "five golden rings" held from 7.9 to 10.2, "three French hens" at 12.0, the partridge at 14.3. Steve adds the song in Instagram.
// Every reason is something Kestrel does: see CLAUDE.md (pay on every job, existing vacancy and AI screening answers, no "Canadian
// experience" requirements, clinic profiles, the apply rule, job alerts, the application tracker).
// Run from the repo root: node design/social-and-merch/instagram-guides/build-12-days-reel.mjs
// 1080 x 1920, 30 frames a second, 20 seconds, no sound. Needs ffmpeg. The cover is its own simple design.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { FLY, PERCH } from "./kestrel-bird-side.mjs";
import { HAT, BEAK, TREE } from "./kestrel-christmas.mjs";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", deep: "#8C4024", cream: "#F7F1E6", paper: "#FBF8F2", line: "#E3D9C8", buff: "#D8B48A", slate: "#5A6672", mist: "#DCE3E6" };
const FPS = 30;
const SECONDS = 20;
const SNOW = Array.from({ length: 30 }, (_, i) => ({ x: (i * 397) % 1080, y: (i * 613) % 1920, r: 4 + (i % 4) * 2, v: 50 + (i % 5) * 20, w: (i * 1.7) % 6.28 }));

// Ornaments, drawn in the tree's own space (tip at 0, 0; the tiers reach 620; gifts sit at about 700).
const hang = (x, y) => `<path d="M${x} ${y - 34} V${y - 16}" stroke="${C.cream}" stroke-width="3"/>`;
// Each ornament is drawn half as large again around its own spot, so the optical ones read on a phone.
const big = (fn) => (x, y, ...r) => `<g transform="translate(${x} ${y}) scale(1.5) translate(${-x} ${-y})">${fn(x, y, ...r)}</g>`;
const ORN0 = {
  bauble: (x, y, c) => `${hang(x, y)}<circle cx="${x}" cy="${y}" r="20" fill="${c}"/><circle cx="${x - 6}" cy="${y - 6}" r="6" fill="${C.cream}" opacity=".7"/>`,
  glasses: (x, y) => `${hang(x, y)}<g fill="none" stroke="${C.cream}" stroke-width="6"><circle cx="${x - 20}" cy="${y}" r="16"/><circle cx="${x + 20}" cy="${y}" r="16"/><path d="M${x - 4} ${y - 2} q4 -4 8 0"/></g>`,
  trial: (x, y) => `${hang(x, y)}<circle cx="${x}" cy="${y}" r="22" fill="${C.mist}" fill-opacity=".35" stroke="${C.cream}" stroke-width="6"/><rect x="${x + 16}" y="${y + 12}" width="14" height="34" rx="4" fill="${C.chestnut}" transform="rotate(-45 ${x + 16} ${y + 12})"/>`,
  rings: (x, y) => `${hang(x - 12, y)}<g fill="none" stroke="${C.buff}" stroke-width="9"><circle cx="${x - 14}" cy="${y}" r="24"/><circle cx="${x + 14}" cy="${y}" r="24"/></g>`,
  gift: (x, y, c) => `<rect x="${x - 44}" y="${y - 40}" width="88" height="70" rx="6" fill="${c}"/><path d="M${x} ${y - 40} V${y + 30} M${x - 44} ${y - 8} H${x + 44}" stroke="${C.cream}" stroke-width="9"/><path d="M${x} ${y - 40} q-22 -22 -30 -4 q12 8 30 4 q22 -22 30 -4 q-12 8 -30 4" fill="none" stroke="${C.cream}" stroke-width="6"/>`,
  scope: (x, y) => `<g transform="rotate(-12 ${x} ${y})"><rect x="${x - 14}" y="${y - 20}" width="28" height="96" rx="12" fill="${C.slate}"/><rect x="${x - 26}" y="${y - 66}" width="52" height="50" rx="12" fill="${C.cream}"/><circle cx="${x}" cy="${y - 42}" r="10" fill="${C.navy}"/><rect x="${x - 10}" y="${y - 2}" width="20" height="5" fill="${C.buff}"/></g>`,
  lenscase: (x, y) => `<rect x="${x - 50}" y="${y - 24}" width="100" height="48" rx="24" fill="${C.cream}"/><circle cx="${x - 24}" cy="${y}" r="17" fill="${C.chestnut}"/><circle cx="${x + 24}" cy="${y}" r="17" fill="${C.navy}"/><text x="${x - 24}" y="${y + 6}" font-family="Poppins" font-weight="600" font-size="16" fill="${C.cream}" text-anchor="middle">L</text><text x="${x + 24}" y="${y + 6}" font-family="Poppins" font-weight="600" font-size="16" fill="${C.cream}" text-anchor="middle">R</text>`,
  chart: (x, y) => `${hang(x, y - 6)}<rect x="${x - 28}" y="${y - 22}" width="56" height="72" rx="6" fill="${C.paper}"/><text x="${x}" y="${y + 6}" font-family="Arial" font-weight="700" font-size="26" fill="${C.navy}" text-anchor="middle">E</text><text x="${x}" y="${y + 26}" font-family="Arial" font-weight="700" font-size="13" fill="${C.navy}" text-anchor="middle">F P</text><text x="${x}" y="${y + 40}" font-family="Arial" font-weight="700" font-size="8" fill="${C.navy}" text-anchor="middle">T O Z</text>`,
};
// The countdown: when each number starts, its line, and the ornament it adds.
const ORN = Object.fromEntries(Object.entries(ORN0).map(([k, fn]) => [k, big(fn)]));
const DAYS = [
  { n: 10, at: 1.1, t: "Jobs only in eye care", o: ORN.bauble(-60, 190, C.chestnut) },
  { n: 9, at: 2.46, t: "Existing vacancy: yes or no, on every job", o: ORN.glasses(55, 270) },
  { n: 8, at: 3.82, t: "AI screening: yes or no, on every job", o: ORN.gift(-235, 680, C.chestnut) },
  { n: 7, at: 5.18, t: "No &quot;Canadian experience&quot; required", o: ORN.trial(-120, 430) },
  { n: 6, at: 6.54, t: "Clinic profiles to look around", o: ORN.bauble(130, 450, C.buff) },
  { n: 5, at: 7.9, t: "Every job shows its pay", o: ORN.rings(0, 360), big: true },
  { n: 4, at: 10.3, t: "Apply for the roles that fit you", o: ORN.scope(250, 650) },
  { n: 3, at: 12.0, t: "Job alerts for jobs that fit", o: ORN.lenscase(-80, 700) },
  { n: 2, at: 13.2, t: "Track every application in 1 place", o: ORN.chart(-10, 540) },
  { n: 1, at: 14.3, t: "&hellip;and a job board made for eye care in Canada", o: "" },
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>12 days</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.navy}}
.abs{position:absolute}
.day{position:absolute;left:80px;right:80px;top:220px;opacity:0}
.num{font-family:'DM Serif Display';font-size:210px;line-height:.9;color:${C.buff}}
.txt{font-family:'DM Serif Display';font-size:64px;line-height:1.08;color:${C.cream};margin-top:16px}
#end{position:absolute;inset:0;background:${C.cream};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px}
#cov{position:absolute;inset:0;background:${C.navy};display:none}
</style></head><body><div id="f">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s, i) => `<circle id="sn${i}" r="${s.r}" fill="${C.cream}" opacity=".5"/>`).join("")}</svg>
${DAYS.map((d, i) => `<div class="day" id="d${i}"><p class="num">${d.n === 1 ? "1" : d.n}</p><p class="txt"${d.big ? ` style="color:${C.buff}"` : ""}>${d.t}</p></div>`).join("")}
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="hero" transform="translate(540 905) scale(0.97)">${TREE}
${DAYS.map((d, i) => d.o ? `<g id="o${i}" opacity="0">${d.o}</g>` : "").join("")}
<g id="spark" opacity="0">${Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return `<line x1="${Math.cos(a) * 50}" y1="${360 + Math.sin(a) * 50}" x2="${Math.cos(a) * 90}" y2="${360 + Math.sin(a) * 90}" stroke="${C.buff}" stroke-width="7" stroke-linecap="round"/>`; }).join("")}</g>
<g id="perch">${PERCH.replace('id="perch"', 'id="pb"')}${BEAK(16, -186)}${HAT(16, -186)}</g></g></svg>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g id="bird">${FLY}${BEAK(96, -14)}${HAT(96, -14)}</g></svg>
<div id="end">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:'DM Serif Display';font-size:60px;line-height:1.15;color:${C.navy};margin-top:80px">Pre launch is open for candidates, clinics and suppliers.</p>
<p id="e2" style="font-family:Poppins;font-weight:600;font-size:40px;color:${C.chestnut};margin-top:40px">Link in bio</p>
</div>
<div id="cov">
<svg class="abs" style="left:0;top:0" width="1080" height="1920">${SNOW.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${C.cream}" opacity=".45"/>`).join("")}</svg>
<div class="abs" style="left:90px;right:90px;top:330px"><p style="font-family:'DM Serif Display';font-size:92px;line-height:1.04;color:${C.cream}">10 reasons to sign up</p>
<p style="font-family:'DM Serif Display';font-size:92px;line-height:1.04;color:${C.buff}">to Kestrel this Christmas.</p></div>
<svg class="abs" style="left:0;top:0;overflow:visible" width="1080" height="1920"><g transform="translate(540 960) scale(0.92)">${TREE}${DAYS.map((d) => d.o).join("")}${PERCH.replace('id="perch"', 'id="cpb"')}${BEAK(16, -186)}${HAT(16, -186)}</g></svg>
</div>
</div>
<script>
const SNOW = ${JSON.stringify(SNOW)}, AT = ${JSON.stringify(DAYS.map((d) => d.at))};
const END = 16.7, FLYAT = 15.7;
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const io = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c = 1.8; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
window.render = (t) => {
  SNOW.forEach((s, i) => { const c = el("sn" + i); c.setAttribute("cx", s.x + 18 * Math.sin(t * 0.8 + s.w)); c.setAttribute("cy", (s.y + s.v * t) % 1960 - 20); });
  // Each number pops in on its line and gives way to the next; the ornament for it pops onto the tree.
  AT.forEach((a, i) => {
    const next = i < AT.length - 1 ? AT[i + 1] : END, v = span(t, a - 0.05, a + 0.3), o = span(t, next - 0.2, next), e = el("d" + i);
    e.style.opacity = clamp(v * 2) * (1 - o); e.style.transform = "scale(" + (0.85 + 0.15 * back(v)) + ")"; e.style.transformOrigin = "0 0";
    const g = el("o" + i); if (g) { const p = span(t, a, a + 0.35); g.setAttribute("opacity", clamp(p * 3)); }
  });
  // Five golden rings: a burst of gold while the note is held.
  const sp = span(t, 7.9, 10.2); el("spark").setAttribute("opacity", sp > 0 && sp < 1 ? 0.8 * (0.6 + 0.4 * Math.sin(t * 9)) : 0);
  el("spark").setAttribute("transform", "translate(0 0) scale(1)");
  // The bird on top sways gently, then takes off on "in a pear tree".
  el("perch").setAttribute("transform", "rotate(" + 3 * Math.sin(t * 2.6) + " 0 -100)");
  el("perch").style.opacity = t < FLYAT ? 1 : 0;
  const s = span(t, FLYAT, FLYAT + 1.4), flap = Math.sin(t * 2 * Math.PI * 3), kk = 0.1 + 0.9 * flap;
  const wing = (dx, dy, m) => "translate(" + (10 + dx) + " " + (-18 + dy) + ") scale(" + 1.5 * m + " " + 1.5 * kk * m + ") rotate(28) translate(-10 18)";
  el("nearwing").setAttribute("transform", wing(0, 0, 1)); el("farwing").setAttribute("transform", wing(16, -6, 0.9));
  el("bird").setAttribute("transform", "translate(" + (556 + 900 * io(s)) + " " + (880 + 40 * Math.sin(Math.PI * s)) + ") scale(1.25) rotate(" + (-6 + 6 * s) + ")");
  el("bird").style.opacity = t >= FLYAT && s < 1 ? 1 : 0;
  el("end").style.opacity = span(t, END, END + 0.4);
  const show = (id, a) => { const v = out(span(t, a, a + 0.45)); el(id).style.opacity = v; el(id).style.transform = "translateY(" + 18 * (1 - v) + "px)"; };
  show("e1", END + 0.5); show("e2", END + 1.1);
};
window.cover = () => { window.render(0); el("cov").style.display = "block"; };
</script></body></html>`;

const file = join(OUT, "12-days-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.6, 5.6, 9.0, 12.4, 14.8, 16.1, 18.5]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `td-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  await tab.evaluate(() => window.cover());
  await frame.screenshot({ path: join(process.env.STILLS, `td-cover.jpg`), type: "jpeg", quality: 80 });
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
  await tab.goto(pathToFileURL(file).href); await tab.evaluate(() => document.fonts.ready);
}
const mp4 = join(OUT, "12-days-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "12-days-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

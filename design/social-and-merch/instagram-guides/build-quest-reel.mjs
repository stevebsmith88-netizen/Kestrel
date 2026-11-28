// "New quest unlocked" Reel (Steve, 21st November 2026): plays on video game culture in general (a quest pop up, a quest log, an XP bar,
// an achievement toast) in Kestrel's own colours and fonts. Deliberately not styled on any real game: no game names, logos, fonts or art
// styles (Steve asked about a GTA style; that look belongs to its publisher, so this stays generic). The game is named
// in words only, in Kestrel's fonts, at Steve's request.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-quest-reel.mjs
// 1080 x 1920, 30 frames a second, 17 seconds, no sound. Needs ffmpeg. The cover is built at the end.
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
const C = { navy: "#1B2B4B", deep: "#14213A", chestnut: "#A4502C", cream: "#F7F1E6", buff: "#D8B48A", mist: "#DCE3E6", soft: "#2B3F5F" };
const FPS = 30;
const SECONDS = 17;

const STEPS = [
  { t: "Pick your class", d: "Optician, optometrist, assistant, front desk, manager" },
  { t: "Choose your map", d: "Your province" },
  { t: "Turn on alerts", d: "We&apos;ll email you when a job that fits is posted" },
];
const check = `<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="${C.navy}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const star = `<svg viewBox="0 0 24 24" width="84" height="84" fill="none" stroke="${C.buff}" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></svg>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>New quest</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}
#f{width:1080px;height:1920px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 40%, ${C.navy} 0%, ${C.deep} 75%)}
.abs{position:absolute}
#pop{left:80px;right:80px;top:330px;text-align:center;opacity:0}
.tag{display:inline-block;padding:14px 34px;border:3px solid ${C.buff};border-radius:8px;font-family:Poppins;font-weight:600;font-size:34px;letter-spacing:.28em;color:${C.buff}}
.qt{font-family:'DM Serif Display';font-size:104px;line-height:1.04;color:${C.cream};margin-top:40px}
#log{left:80px;right:80px;top:820px;padding:44px;border-radius:18px;background:rgba(43,63,95,.75);border:3px solid ${C.soft};opacity:0}
.lh{font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:.24em;color:${C.buff};margin-bottom:24px}
.st{display:flex;gap:28px;align-items:flex-start;margin-bottom:26px}
.bx{width:64px;height:64px;border-radius:8px;border:4px solid ${C.cream};display:flex;align-items:center;justify-content:center;flex:none}
.bx.on{background:${C.buff};border-color:${C.buff}}
.tk{opacity:0}
.sn{font-family:Poppins;font-weight:600;font-size:42px;color:${C.cream}}.sd{font-family:Poppins;font-size:28px;color:${C.mist};margin-top:4px}
.xp{height:26px;border-radius:13px;background:${C.deep};border:2px solid ${C.soft};overflow:hidden;margin-top:14px}
#xpf{height:100%;width:0;background:linear-gradient(90deg, ${C.chestnut}, ${C.buff})}
.xl{font-family:Poppins;font-weight:600;font-size:26px;color:${C.mist};margin-top:12px;text-align:right}
#ach{left:80px;right:80px;top:250px;display:flex;gap:28px;align-items:center;padding:30px 36px;border-radius:16px;background:${C.cream};box-shadow:0 20px 50px rgba(0,0,0,.35);opacity:0}
#ach .i{width:120px;height:120px;border-radius:50%;background:${C.navy};display:flex;align-items:center;justify-content:center;flex:none}
#side{left:80px;right:80px;top:820px;opacity:0}
#end{position:absolute;inset:0;background:${C.navy};opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
</style></head><body><div id="f">
<p class="abs" id="gta" style="left:80px;right:80px;top:760px;text-align:center;font-family:'DM Serif Display';font-size:104px;line-height:1.05;color:${C.cream};opacity:0">Taking a break<br><span style='color:${C.buff}'>from GTA 6?</span></p>
<div class="abs" id="pop"><span class="tag">NEW QUEST UNLOCKED</span><p class="qt">Find your next job<br><span style="color:${C.buff}">in eye care.</span></p></div>
<div class="abs" id="log"><p class="lh">QUEST LOG</p>
${STEPS.map((s, i) => `<div class="st"><div class="bx" id="b${i}"><span class="tk" id="k${i}">${check}</span></div><div><p class="sn">${s.t}</p><p class="sd">${s.d}</p></div></div>`).join("")}
<div class="xp"><div id="xpf"></div></div><p class="xl" id="xpl">0 / 300 XP</p></div>
<div class="abs" id="ach"><div class="i">${star}</div><div><p style="font-family:Poppins;font-weight:600;font-size:28px;letter-spacing:.2em;color:${C.chestnut}">ACHIEVEMENT UNLOCKED</p>
<p style="font-family:'DM Serif Display';font-size:52px;line-height:1.1;color:${C.navy};margin-top:8px">You can see the pay before you apply.</p></div></div>
<div class="abs" id="side"><span class="tag">SIDE QUEST AVAILABLE</span>
<p style="font-family:'DM Serif Display';font-size:84px;line-height:1.08;color:${C.cream};margin-top:40px">Pre launch is open for candidates, clinics and suppliers.</p></div>
<div id="end">
<img src="${brand("kestrel-lockup-full-reversed.svg")}" alt="" style="width:860px;display:block">
<p id="e1" style="font-family:Poppins;font-weight:600;font-size:46px;letter-spacing:.2em;color:${C.buff};margin-top:90px">PRESS START</p>
<p id="e2" style="font-family:Poppins;font-size:40px;color:${C.mist};margin-top:20px">Link in bio</p>
</div>
</div>
<script>
const clamp = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp((t - a) / (b - a));
const out = (x) => 1 - Math.pow(1 - x, 3);
const back = (x) => { const c = 1.8; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const el = (id) => document.getElementById(id);
window.render = (t) => {
  // The opening line names the game in Kestrel's own words and fonts (Steve, 21st November 2026); no game artwork or logos.
  const g = out(span(t, 0, 0.4)) * (1 - span(t, 1.5, 1.8)); el("gta").style.opacity = g; el("gta").style.transform = "scale(" + (0.94 + 0.06 * g) + ")";
  // The quest pops in with a bounce, then moves up to make room for the log.
  const p = span(t, 1.8, 2.3); el("pop").style.opacity = (p > 0 ? 1 : 0) * (1 - span(t, 12.0, 12.3));
  el("pop").style.transform = "scale(" + (0.6 + 0.4 * back(p)) + ") translateY(" + (-80 * out(span(t, 3.0, 3.5))) + "px)";
  const l = out(span(t, 3.4, 3.9)); el("log").style.opacity = l * (1 - span(t, 12.0, 12.3)); el("log").style.transform = "translateY(" + 40 * (1 - l) + "px)";
  let xp = 0;
  for (let i = 0; i < 3; i++) { const a = 4.0 + i * 1.5, k = span(t, a, a + 0.25); el("k" + i).style.opacity = k; el("k" + i).style.display = "inline-block"; el("k" + i).style.transform = "scale(" + back(k) + ")"; el("b" + i).classList.toggle("on", k > 0.3); xp += 100 * out(span(t, a, a + 0.6)); }
  el("xpf").style.width = (xp / 3) + "%"; el("xpl").textContent = Math.round(xp) + " / 300 XP";
  // The achievement toast drops in from the top, holds, and slides away.
  const ai = out(span(t, 8.8, 9.2)), ao = span(t, 11.6, 12.0); el("ach").style.opacity = ai * (1 - ao); el("ach").style.transform = "translateY(" + (-160 * (1 - ai) - 160 * ao) + "px) scale(" + (0.9 + 0.1 * ai) + ")";
  const s = out(span(t, 12.2, 12.7)); el("side").style.opacity = s * (1 - span(t, 14.6, 14.9)); el("side").style.transform = "translateY(" + 40 * (1 - s) + "px)";
  el("end").style.opacity = span(t, 14.7, 15.1);
  const e1 = span(t, 15.3, 15.6); el("e1").style.opacity = e1 * (0.55 + 0.45 * Math.abs(Math.sin(t * 3))); // a gentle "press start" blink
  el("e2").style.opacity = out(span(t, 15.6, 16.1));
};
window.cover = () => window.render(8.6);
</script></body></html>`;

const file = join(OUT, "quest-reel.html");
writeFileSync(file, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(pathToFileURL(file).href);
await tab.evaluate(() => document.fonts.ready);
const frame = tab.locator("#f");
if (process.env.STILLS) {
  for (const t of [1.5, 6.5, 9.6, 13.5, 16.2]) {
    await tab.evaluate((x) => window.render(x), t);
    await frame.screenshot({ path: join(process.env.STILLS, `quest-${String(t).replace(".", "-")}.jpg`), type: "jpeg", quality: 80 });
  }
  if (process.env.STILLS_ONLY) { await browser.close(); process.exit(0); }
}
const mp4 = join(OUT, "quest-reel.mp4");
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
await frame.screenshot({ path: join(OUT, "quest-reel-cover.jpg"), type: "jpeg", quality: 92 });
await browser.close();
console.log(`Built ${mp4}`);

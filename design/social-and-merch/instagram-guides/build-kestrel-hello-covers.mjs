// Hello cover options for the pinned kestrel Reel (Steve, 16th November 2026): the same Cream "Hello, we're" design with the kestrel
// head (style A), with no bird, for comparing with the hovering bird version (built by build-kestrel-hover-eye-reel.mjs).
// Run from the repo root after build-kestrel-styles.mjs: node design/social-and-merch/instagram-guides/build-kestrel-hello-covers.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const brand = (f) => pathToFileURL(join(ROOT, "public/brand", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", cream: "#F7F1E6", slate: "#5A6672" };
// The style A bird, taken from the stills page so it is drawn once only.
const head = readFileSync(join(OUT, "kestrel-style-a-wide.html"), "utf8").match(/<g transform="[^"]*">([\s\S]*)<\/g><\/svg>/)[1];

const page = (bird) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Hello cover</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}</style></head><body>
<div id="f" style="width:1080px;height:1350px;position:relative;overflow:hidden;background:${C.cream}">
<p style="position:absolute;left:80px;top:88px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">EYE CARE JOBS</p>
<p style="position:absolute;right:80px;top:80px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut}">Hello</p>
<div style="position:absolute;left:80px;right:80px;top:${bird ? 180 : 380}px">
<p style="font-family:'DM Serif Display';font-size:96px;line-height:1;color:${C.navy}">Hello, we&apos;re</p>
<img src="${brand("kestrel-wordmark.svg")}" alt="" style="display:block;width:${bird ? 560 : 820}px;margin-top:18px">
<p style="font-family:Poppins;font-size:36px;line-height:1.4;color:${C.slate};margin-top:30px">A Canada-wide eye care job board, opening in early 2027. Every job shows its pay.</p></div>
${bird ? `<svg style="position:absolute;left:0;top:640px" width="1080" height="710" viewBox="0 0 1080 710"><g transform="translate(560 330) scale(1.15) translate(-300 -430)">${head}</g></svg>`
  : `<div style="position:absolute;left:80px;bottom:80px;display:flex;align-items:center;gap:16px"><img src="${brand("kestrel-k-mark.svg")}" alt="" style="width:56px;height:56px"><p style="font-family:Poppins;font-size:24px;letter-spacing:0.06em;color:${C.slate}">eyecarejobs.ca</p></div>`}
</div></body></html>`;

// The logo cover (Steve, 16th November 2026: "the focus on the cover picture needs to be the kestrel logo"): the full lockup on Cream,
// with the pay line under it, in Reel and grid sizes. The words sit inside the middle 3:4, so the grid crop keeps them.
const logoPage = (h) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Logo cover</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
body{margin:0}p{margin:0}</style></head><body>
<div id="f" style="width:1080px;height:${h}px;position:relative;overflow:hidden;background:${C.cream};display:flex;flex-direction:column;align-items:center;justify-content:center">
<img src="${brand("kestrel-lockup-full.svg")}" alt="" style="width:900px;display:block">
<p style="font-family:'DM Serif Display';font-size:72px;color:${C.navy};margin-top:${h > 1500 ? 90 : 60}px">Every job shows its pay.</p>
<p style="font-family:Poppins;font-weight:600;font-size:30px;letter-spacing:0.12em;color:${C.chestnut};margin-top:36px">PRE LAUNCH IS OPEN</p>
</div></body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [name, bird] of [["head", true], ["none", false]]) {
  const file = join(OUT, `kestrel-hello-${name}.html`);
  writeFileSync(file, page(bird));
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.locator("#f").screenshot({ path: join(OUT, `kestrel-hello-${name}-1080x1350.jpg`), type: "jpeg", quality: 92 });
}
for (const h of [1350, 1920]) {
  const file = join(OUT, `kestrel-logo-cover-${h}.html`);
  writeFileSync(file, logoPage(h));
  await tab.setViewportSize({ width: 1080, height: h });
  await tab.goto(pathToFileURL(file).href);
  await tab.evaluate(() => document.fonts.ready);
  await tab.locator("#f").screenshot({ path: join(OUT, `kestrel-logo-cover-1080x${h}.jpg`), type: "jpeg", quality: 92 });
}
await browser.close();
console.log("Built hello covers");

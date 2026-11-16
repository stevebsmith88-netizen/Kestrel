// Style options for the kestrel Reel (Steve, 16th November 2026): stills of 3 ways to draw the bird, each shown wide and with the eye zoomed in.
// Run from the repo root: node design/social-and-merch/instagram-guides/build-kestrel-styles.mjs
// A is the bird in the current Reel. B hovers in flight with its wings spread. C is a fine line drawing with 2 chestnut tones.
// None of them is the logo; the K and its feather are never redrawn.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // the copy already installed on the machine
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(".");
const OUT = join(ROOT, "design/social-and-merch/instagram-guides");
const font = (f) => pathToFileURL(join(ROOT, "node_modules/@fontsource", f)).href;
const C = { navy: "#1B2B4B", chestnut: "#A4502C", chestnutD: "#8C4024", cream: "#F7F1E6", paper: "#FBF8F2", buff: "#D8B48A", slate: "#5A6672", slateBlue: "#7F93AE" };

const eye = (x, y, k = 1) => `<circle cx="${x}" cy="${y}" r="${31 * k}" fill="${C.buff}"/><circle cx="${x}" cy="${y}" r="${24 * k}" fill="${C.navy}"/><circle cx="${x + 8 * k}" cy="${y - 8 * k}" r="${7 * k}" fill="${C.cream}"/>`;

// A: the current Reel's bird (flat shapes, profile).
const A = { eye: [340, 290], wide: { x: 300, y: 430, s: 1.25 }, svg: `
  <path d="M150 330 C 120 470, 110 600, 90 900 L 560 900 C 515 600, 480 500, 425 420 Z" fill="${C.paper}"/>
  ${[[300, 520], [360, 560], [250, 600], [330, 640], [400, 610], [280, 690], [370, 700]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="13" fill="${C.navy}" opacity=".85"/>`).join("")}
  <path d="M152 320 C 108 470, 86 600, 40 900 L 290 900 C 236 620, 205 500, 196 380 Z" fill="${C.chestnut}"/>
  <path d="M104 500 C 150 560, 205 640, 330 900 L 30 900 C 66 670, 80 580, 104 500 Z" fill="${C.slateBlue}"/>
  <ellipse cx="300" cy="300" rx="152" ry="146" fill="${C.paper}"/>
  <path d="M150 300 C 160 150, 430 132, 450 282 C 405 236, 222 232, 150 300 Z" fill="${C.slateBlue}"/>
  <ellipse cx="292" cy="188" rx="48" ry="27" fill="${C.chestnut}"/>
  <path d="M150 300 C 140 330, 146 360, 160 380 C 176 350, 182 322, 176 296 Z" fill="${C.chestnut}"/>
  <circle cx="190" cy="318" r="11" fill="${C.navy}"/>
  <path d="M325 322 C 322 360, 316 392, 308 426 L 332 426 C 338 392, 343 358, 346 324 Z" fill="${C.navy}"/>
  <path d="M232 306 C 224 344, 216 384, 208 418 L 230 418 C 238 384, 244 344, 252 308 Z" fill="${C.navy}"/>
  <path d="M410 280 Q 432 272 444 292 Q 430 304 412 302 Z" fill="${C.buff}"/>
  <path d="M424 282 C 462 276, 492 300, 484 344 C 474 326, 458 320, 438 322 C 432 310, 428 296, 424 282 Z" fill="${C.navy}"/>
  ${eye(340, 290)}` };

// B: hovering in flight, seen from the front, wings up in a V and tail fanned with its dark band.
const wing = `<path d="M262 330 C 200 300, 110 228, 22 150 C 70 240, 120 300, 160 362 C 196 386, 236 384, 266 372 Z" fill="${C.slateBlue}"/>
  <path d="M22 150 C 74 198, 116 236, 146 262 L 118 282 C 86 246, 56 206, 22 150 Z" fill="${C.navy}"/>
  ${[0, 1, 2].map((i) => `<path d="M${190 - i * 34} ${330 - i * 26} l-18 34" stroke="${C.paper}" stroke-width="6" stroke-linecap="round" opacity=".7"/>`).join("")}`;
const B = { eye: [326, 262], wide: { x: 300, y: 440, s: 1.75 }, svg: `
  <path d="M262 520 L 214 700 Q 300 736 386 700 L 338 520 Z" fill="${C.chestnut}"/>
  <path d="M222 668 Q 300 694 378 668 L 384 690 Q 300 718 216 690 Z" fill="${C.navy}"/>
  <g>${wing}</g><g transform="translate(600 0) scale(-1 1)">${wing}</g>
  <ellipse cx="300" cy="420" rx="70" ry="128" fill="${C.paper}"/>
  ${[[280, 380], [318, 400], [292, 440], [326, 460], [276, 480], [306, 510]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="10" fill="${C.navy}" opacity=".85"/>`).join("")}
  <circle cx="300" cy="270" r="62" fill="${C.paper}"/>
  <path d="M238 262 C 240 196, 360 196, 362 262 C 334 240, 266 240, 238 262 Z" fill="${C.slateBlue}"/>
  <ellipse cx="300" cy="222" rx="24" ry="14" fill="${C.chestnut}"/>
  <path d="M268 282 l-6 52 h12 l7 -50 Z M332 282 l6 52 h-12 l-7 -50 Z" fill="${C.navy}"/>
  <path d="M243 276 l-4 40 h10 l5 -38 Z M357 276 l4 40 h-10 l-5 -38 Z" fill="${C.navy}"/>
  <path d="M292 286 L 308 286 L 300 306 Z" fill="${C.navy}"/>
  ${eye(274, 262, 0.5)}${eye(326, 262, 0.5)}` };

// C: a fine line drawing, navy lines on cream with 2 chestnut tones.
const line = `fill="none" stroke="${C.navy}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
const Cc = { eye: [340, 290], wide: { x: 300, y: 430, s: 1.25 }, svg: `
  <path d="M152 320 C 108 470, 86 600, 40 900 L 290 900 C 236 620, 205 500, 196 380 Z" fill="${C.chestnutD}"/>
  <path d="M104 500 C 150 560, 205 640, 330 900 L 30 900 C 66 670, 80 580, 104 500 Z" fill="${C.chestnut}"/>
  <path d="M150 300 C 160 150, 430 132, 450 282 C 405 236, 222 232, 150 300 Z" fill="${C.chestnut}"/>
  <path d="M152 320 C 108 470, 86 600, 40 900" ${line}/><path d="M425 420 C 480 500, 515 600, 560 900" ${line}/>
  <path d="M104 500 C 150 560, 205 640, 330 900" ${line}/>
  <ellipse cx="300" cy="300" rx="152" ry="146" ${line}/>
  <path d="M150 300 C 222 232, 405 236, 450 282" ${line}/>
  <path d="M336 326 C 332 362, 326 394, 318 426" ${line} stroke-width="12"/>
  <path d="M242 308 C 234 346, 226 386, 218 418" ${line} stroke-width="12"/>
  ${[[300, 520], [360, 560], [250, 600], [330, 640], [400, 610]].map(([x, y]) => `<path d="M${x} ${y - 10}v20" ${line} stroke-width="8"/>`).join("")}
  <path d="M424 282 C 462 276, 492 300, 484 344 C 474 326, 458 320, 438 322" ${line}/>
  <circle cx="340" cy="290" r="31" ${line}/><circle cx="340" cy="290" r="20" fill="${C.navy}"/><circle cx="347" cy="283" r="6" fill="${C.cream}"/>` };

const STYLES = [["a", "A: flat shapes (current)", A], ["b", "B: hovering in flight", B], ["c", "C: fine line, 2 chestnuts", Cc]];

const frame = (title, bird, zoom) => {
  const c = zoom ? { x: bird.eye[0], y: bird.eye[1], s: 12, fx: 540, fy: 520 } : { ...bird.wide, fx: 540, fy: 560 };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>
@font-face{font-family:'DM Serif Display';src:url(${font("dm-serif-display/files/dm-serif-display-latin-400-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:600;src:url(${font("poppins/files/poppins-latin-600-normal.woff2")})}
@font-face{font-family:Poppins;font-weight:400;src:url(${font("poppins/files/poppins-latin-400-normal.woff2")})}
body{margin:0}p{margin:0}</style></head><body>
<div style="width:1080px;height:1920px;position:relative;overflow:hidden;background:${C.cream}">
<p style="position:absolute;left:80px;top:276px;font-family:Poppins;font-weight:600;font-size:26px;letter-spacing:0.24em;color:${C.chestnut}">DID YOU KNOW</p>
<p style="position:absolute;right:80px;top:268px;font-family:'DM Serif Display';font-size:38px;color:${C.chestnut}">${zoom ? "1 of 4" : "The kestrel"}</p>
<div style="position:absolute;left:80px;right:80px;top:370px">
${zoom ? `<p style="font-family:'DM Serif Display';font-size:86px;line-height:1.04;color:${C.navy}">Kestrels may see ultraviolet light.</p>`
  : `<p style="font-family:'DM Serif Display';font-size:140px;line-height:1.04;color:${C.navy}">Did you know?</p><p style="font-family:'DM Serif Display';font-size:68px;line-height:1.1;color:${C.chestnut};margin-top:24px">4 things about the bird we&apos;re named after.</p>`}</div>
<svg style="position:absolute;left:0;top:860px" width="1080" height="1060" viewBox="0 0 1080 1060">
<g transform="translate(${c.fx} ${c.fy}) scale(${c.s}) translate(${-c.x} ${-c.y})">${bird.svg}</g></svg>
</div></body></html>`;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [id, title, bird] of STYLES) for (const zoom of [false, true]) {
  const file = join(OUT, `kestrel-style-${id}-${zoom ? "eye" : "wide"}.html`);
  writeFileSync(file, frame(title, bird, zoom));
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file.replace(".html", ".jpg"), type: "jpeg", quality: 90 });
}
await browser.close();
console.log("Built kestrel style stills");

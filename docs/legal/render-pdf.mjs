// Turns docs/legal/Kestrel-lawyer-review-pack.html into a PDF with page numbers. Run from the repository root:
//   NODE_PATH=$(npm root -g) node docs/legal/render-pdf.mjs
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
const name = process.argv[2] || "Kestrel-lawyer-review-pack";
await page.goto(pathToFileURL(resolve(`docs/legal/${name}.html`)).href);
await page.pdf({
  path: `docs/legal/${name}.pdf`,
  format: "Letter",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#5A6672;font-family:Helvetica,Arial,sans-serif;">Kestrel Eye Care Jobs, legal review pack. Confidential. Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  margin: { top: "0.8in", bottom: "0.9in", left: "0.8in", right: "0.8in" },
});
await browser.close();
console.log("pdf written");

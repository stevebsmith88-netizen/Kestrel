// Run with: npm test
// The resume reader opens files from strangers, so these tests build awkward files and check that each one is dealt with quickly, and that an
// ordinary resume still reads the same as it always did.
import assert from "node:assert/strict";
import { test } from "node:test";
import { strToU8, zipSync } from "fflate";
import { pagesOpened, resumeText, textFromDocx, textFromPdf } from "./resume-text.ts";

function docx(documentXml: string): Uint8Array {
  return zipSync({ "[Content_Types].xml": strToU8("<Types/>"), "word/document.xml": strToU8(documentXml) });
}

function timed<T>(work: () => T): { result: T; ms: number } {
  const start = performance.now();
  const result = work();
  return { result, ms: performance.now() - start };
}

// How the Word text was cleaned before 12th November 2026. It is slow on hostile files and fine on ordinary ones, so it stays here as the
// reference for "an ordinary resume reads exactly as before".
function oldTextFromXml(xml: string): string {
  return xml
    .replace(/<w:(?:br|cr)\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\b[^>]*\/>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .slice(0, 200_000);
}

const p = (inner: string) => `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:after="0"/></w:pPr>${inner}</w:p>`;
const r = (text: string) => `<w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;

const NORMAL_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${p(r("Jordan Lee"))}
${p(r("Licensed Optician"))}
${p(r("Toronto, ON M5V 2T6") + "<w:r><w:tab/></w:r>" + r("416.555.0199 | jordan.lee@example.com"))}
${p("")}
${p(r("EXPERIENCE"))}
${p(r("Optician, Lakeview Eye Care &amp; Optical") + "<w:r><w:tab/></w:r>" + r("March 2019 to present"))}
${p(r("Fitted progressive lenses") + '<w:r><w:br/></w:r>' + r("Trained 2 new dispensers") + '<w:r><w:br w:type="textWrapping"/></w:r>' + r("Used Optosys &quot;daily&quot;"))}
${p(r("Sales &gt; $400,000 a year, returns &lt; 2%, the owner&apos;s target"))}
${p(r("Old typewriter line") + "<w:r><w:cr/></w:r>" + r("next line"))}
${p(r("Élodie Tremblay was my manager, café style frame bar"))}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>`;

test("an ordinary Word resume reads exactly as it did before", () => {
  const text = textFromDocx(docx(NORMAL_XML));
  assert.equal(text, oldTextFromXml(NORMAL_XML));
  // And spelled out, so the reference above cannot hide a mistake.
  assert.match(text, /Jordan Lee\n/);
  assert.match(text, /Toronto, ON M5V 2T6\s+416\.555\.0199 \| jordan\.lee@example\.com\n/);
  assert.match(text, /Lakeview Eye Care & Optical\s+March 2019 to present\n/);
  assert.match(text, /Fitted progressive lenses\nTrained 2 new dispensers\nUsed Optosys "daily"\n/);
  assert.match(text, /Sales > \$400,000 a year, returns < 2%, the owner's target\n/);
  assert.match(text, /Old typewriter line\nnext line\n/);
  assert.match(text, /Élodie Tremblay was my manager, café style frame bar\n/);
  assert.doesNotMatch(text, /w:|xmlns|<\/?[a-z]/);
});

test("a long ordinary Word resume also reads exactly as before", () => {
  const body = Array.from({ length: 400 }, (_, i) => p(r(`Line ${i + 1} of a long resume, with a tab`) + "<w:r><w:tab/></w:r>" + r("and an ampersand &amp; a line break") + "<w:r><w:br/></w:r>" + r("done"))).join("");
  const xml = `<w:document><w:body>${body}</w:body></w:document>`;
  assert.equal(textFromDocx(docx(xml)), oldTextFromXml(xml));
});

test("400 KB of '<' in a Word file is dealt with in well under 1 second", () => {
  const file = docx("<".repeat(400_000));
  assert.ok(file.length < 10_000, "the hostile file zips small enough to pass the upload checks");
  const { ms } = timed(() => textFromDocx(file));
  assert.ok(ms < 500, `took ${Math.round(ms)} ms`);
});

test("400 KB of unclosed '<w:br ' tags in a Word file is dealt with in well under 1 second", () => {
  const file = docx("<w:br ".repeat(Math.ceil(400_000 / 6)));
  const { ms } = timed(() => textFromDocx(file));
  assert.ok(ms < 500, `took ${Math.round(ms)} ms`);
});

test("other awkward shapes are quick too", () => {
  for (const xml of ["<w:tab ".repeat(60_000), "</w:p".repeat(80_000), "&amp".repeat(100_000), "<".repeat(300_000) + ">", "<w:br " .repeat(50_000) + "/>", "&".repeat(400_000)]) {
    const { ms } = timed(() => textFromDocx(docx(xml)));
    assert.ok(ms < 500, `${xml.slice(0, 8)}... took ${Math.round(ms)} ms`);
  }
});

test("a Word file whose text unzips to more than 1 MB is refused, quickly", () => {
  const file = docx(`<w:p>${"a".repeat(1024 * 1024 + 1)}</w:p>`);
  const { ms } = timed(() => assert.throws(() => textFromDocx(file), /too large/));
  assert.ok(ms < 500, `took ${Math.round(ms)} ms`);
  // Just under the limit still reads.
  assert.ok(textFromDocx(docx(`<w:p>${"a".repeat(900_000)}</w:p>`)).startsWith("aaaa"));
});

test("a Word file with no document inside gives no text", () => {
  assert.equal(textFromDocx(zipSync({ "hello.txt": strToU8("hello") })), "");
});

// A small hand written PDF with 1 short line of text on each page, so the tests need no PDF file in the repository.
function pdfWithPages(count: number, line: (page: number) => string = (n) => `Page ${n} of the test resume, optician in Toronto`): Uint8Array {
  const objects: string[] = [];
  const kids = Array.from({ length: count }, (_, i) => `${4 + i * 2} 0 R`).join(" ");
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${count} /Kids [${kids}] >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  for (let i = 0; i < count; i++) {
    const stream = `BT /F1 12 Tf 72 720 Td (${line(i + 1)}) Tj ET`;
    objects[4 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`;
    objects[5 + i * 2] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let n = 1; n < objects.length; n++) {
    offsets[n] = body.length;
    body += `${n} 0 obj\n${objects[n]}\nendobj\n`;
  }
  const xref = body.length;
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let n = 1; n < objects.length; n++) body += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return strToU8(body);
}

test("an ordinary 2 page PDF resume reads, page by page", async () => {
  const result = await resumeText(pdfWithPages(2), "resume.pdf");
  assert.ok(result.ok);
  assert.match(result.text, /Page 1 of the test resume, optician in Toronto/);
  assert.match(result.text, /Page 2 of the test resume/);
});

test("a PDF with 3,000 pages has only its first 12 pages read, and quickly", async () => {
  const file = pdfWithPages(3000);
  assert.ok(file.length < 3 * 1024 * 1024, "small enough to pass the upload size check");
  // Read a small PDF first, so the timing below measures the pages and leaves out the one time cost of starting the PDF library.
  await resumeText(pdfWithPages(1), "warm-up.pdf");
  const before = pagesOpened();
  const start = performance.now();
  const result = await resumeText(file, "resume.pdf");
  const ms = performance.now() - start;
  assert.ok(result.ok);
  assert.match(result.text, /Page 1 of the test resume/);
  assert.match(result.text, /Page 12 of the test resume/);
  assert.doesNotMatch(result.text, /Page 13 of/);
  assert.equal(pagesOpened() - before, 12, "only 12 pages were opened");
  assert.ok(ms < 1000, `took ${Math.round(ms)} ms`);
});

test("reading a PDF stops when the time limit is reached, and keeps what it has", async () => {
  // A limit of 0 means time is up before the first page: nothing is read and the file is reported as unreadable.
  await assert.rejects(() => textFromPdf(pdfWithPages(5), 0), /timed out/);
  const before = pagesOpened();
  await assert.rejects(() => textFromPdf(pdfWithPages(3000), 0), /timed out/);
  assert.equal(pagesOpened() - before, 0);
});

test("no timer is left running after a PDF is read", async () => {
  await resumeText(pdfWithPages(2), "resume.pdf");
  const timers = process.getActiveResourcesInfo().filter((kind) => kind === "Timeout").length;
  assert.equal(timers, 0);
});

test("a file that is not a PDF or a Word file is refused", async () => {
  assert.deepEqual(await resumeText(strToU8("plain text that is long enough to count"), "resume.txt"), { ok: false, reason: "unsupported" });
  assert.deepEqual(await resumeText(new Uint8Array(3 * 1024 * 1024 + 1), "resume.pdf"), { ok: false, reason: "failed" });
});

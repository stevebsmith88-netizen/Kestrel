// Run with: npm test
// The resume reader opens files from strangers, so these tests build awkward files and check that each one is dealt with quickly, and that an
// ordinary resume still reads the same as it always did.
import assert from "node:assert/strict";
import { test } from "node:test";
import { strToU8, zipSync } from "fflate";
import { textFromDocx } from "./resume-text.ts";

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

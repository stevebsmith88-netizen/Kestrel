// Run with: npm test
// Keeps the wording people read free of the obvious "written by a machine" habits. The rules come from the AI anti pattern checklist
// Steve shared on 31st October 2026 (see CLAUDE.md, Writing style). It reads the source files that hold public wording and checks:
//  1. words that AI writing leans on,
//  2. "not just X, but Y" and "rather than" style contrasts,
//  3. emoji used as icons, and curly quotes in strings,
//  4. em and en dashes in wording, and the numbers 2 to 12 spelled out (CLAUDE.md: no dashes as punctuation, numerals throughout).
// Lines that are only comments are skipped, since those are for developers.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOTS = ["app", "components", "content", "lib"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|md)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

const codeLines = (path: string) =>
  readFileSync(path, "utf8")
    .split("\n")
    .map((text, i) => ({ text, line: i + 1 }))
    .filter(({ text }) => !/^\s*(\/\/|\/\*|\*|\{\/\*)/.test(text));

const SOURCES = ROOTS.flatMap(files);

// Lines that are allowed to break a rule, each named with the reason. Never widen a pattern to get a pass: add the line here instead.
const EXCEPTIONS: { path: string; startsWith: string; why: string }[] = [
  { path: "lib/ad-builder.ts", startsWith: "- Avoid wording that reads as machine written.", why: "instructions to the AI, which list the banned words so it avoids them" },
  { path: "lib/found-listing-actions.ts", startsWith: "- Writing style for the summary:", why: "instructions to the AI, which list the banned words so it avoids them" },
  { path: "lib/places-data.ts", startsWith: '["Portugal Cove-St. Phillip’s"', why: "an alternate spelling of a place name, kept so a search for it matches" },
  { path: "lib/places.ts", startsWith: ".replace(/[.", why: "removes curly apostrophes from what someone types, to match place names" },
  { path: "lib/pay-benchmark.ts", startsWith: "export const LICENCE_STATEMENT", why: "the Open Government Licence attribution wording, which names the licence with an en dash exactly as the government publishes it" },
  { path: "lib/resume-reader.ts", startsWith: "const RANGE = new RegExp(", why: "a pattern that reads dashes in other people's resumes, not wording we show" },
];
const excepted = (path: string, text: string) => EXCEPTIONS.some((e) => e.path === path && text.trim().startsWith(e.startsWith));

const BANNED_WORDS = /\b(delve|tapestry|testament|vibrant|bespoke|robust|furthermore|intricate|intricacies|complexities|leverage|pivot|utili[sz]e|showcase|bolster|foster|seamless|seamlessly|transformative|scalable|cutting.edge|game.chang\w*|unlock|elevate|streamline|empower|journey)\b/i;
const ABSTRACT_PHRASES = /\b(align with|underscores?|serves as|stands as|functions as|functions to|plays a (key|vital|crucial) role)\b/i;
const NEGATIVE_PARALLEL = /\b(not just|isn['’]t just|more than just|not only [^.]{3,40} but|rather than|it['’]s not a [^.,]{2,40}[,;] it['’]s|it is not a [^.,]{2,40}[,;] it is)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2728}]/u;
const CURLY = /[‘’“”]/;

function scan(pattern: RegExp) {
  const hits: string[] = [];
  for (const path of SOURCES) for (const { text, line } of codeLines(path)) if (!excepted(path, text) && pattern.test(text)) hits.push(`${path}:${line}: ${text.trim().slice(0, 100)}`);
  return hits;
}

test("public wording avoids the words AI writing leans on", () => {
  assert.deepEqual(scan(BANNED_WORDS), []);
  assert.deepEqual(scan(ABSTRACT_PHRASES), []);
});

test("public wording makes direct statements, not 'not just X, but Y' contrasts", () => {
  assert.deepEqual(scan(NEGATIVE_PARALLEL), []);
});

test("no emoji are used as icons, and strings use straight quotes", () => {
  assert.deepEqual(scan(EMOJI), []);
  assert.deepEqual(scan(CURLY), []);
});

// The wording on a line: what is inside quotes or template strings, plus the text between tags in .tsx files.
function wording(path: string, text: string): string[] {
  const out: string[] = (text.replace(/https?:\/\/\S+/g, "").match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g) ?? []);
  if (path.endsWith(".tsx")) for (const m of text.matchAll(/>([^<>{}]+)(?=<)/g)) out.push(m[1]);
  return out;
}
function scanWording(pattern: RegExp) {
  const hits: string[] = [];
  for (const path of SOURCES) {
    if (path.endsWith("places-data.ts")) continue; // place names, not sentences
    for (const { text, line } of codeLines(path)) if (!excepted(path, text) && wording(path, text).some((w) => pattern.test(w))) hits.push(`${path}:${line}: ${text.trim().slice(0, 110)}`);
  }
  return hits;
}

const DASHES = /[\u2013\u2014]/;
const SPELLED_NUMBER = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;

test("wording has no em or en dashes", () => {
  assert.deepEqual(scanWording(DASHES), []);
});

test("wording uses numerals for 2 to 12, not words", () => {
  assert.deepEqual(scanWording(SPELLED_NUMBER), []);
});

test("the guard really reads the files (so a pass means something)", () => {
  assert.ok(SOURCES.length > 40, `only ${SOURCES.length} files were read`);
  assert.ok(SOURCES.some((p) => p.endsWith("posts.ts")));
  assert.ok(BANNED_WORDS.test("a vibrant community") && NEGATIVE_PARALLEL.test("It is not just a tool") && NEGATIVE_PARALLEL.test("rather than waiting"));
  assert.ok(DASHES.test("a \u2014 b") && DASHES.test("2\u20134") && SPELLED_NUMBER.test("Two quick questions") && SPELLED_NUMBER.test("one or two page") && !SPELLED_NUMBER.test("phone"));
  assert.ok(SOURCES.some((p) => p.startsWith("lib/")), "lib must be read");
  assert.ok(wording("x.ts", 'const a = "Two things";').length === 1 && wording("x.tsx", "<p>Three things</p>").length === 1);
});

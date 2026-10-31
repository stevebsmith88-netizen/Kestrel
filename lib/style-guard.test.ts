// Run with: npm test
// Keeps the wording people read free of the obvious "written by a machine" habits. The rules come from the AI anti pattern checklist
// Steve shared on 31st October 2026 (see CLAUDE.md, Writing style). It reads the source files that hold public wording and checks:
//  1. words that AI writing leans on,
//  2. "not just X, but Y" and "rather than" style contrasts,
//  3. emoji used as icons, and curly quotes in strings.
// Lines that are only comments are skipped, since those are for developers.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const ROOTS = ["app", "components", "content"];

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

const BANNED_WORDS = /\b(delve|tapestry|testament|vibrant|bespoke|robust|furthermore|intricate|intricacies|complexities|leverage|pivot|utili[sz]e|showcase|bolster|foster|seamless|seamlessly|transformative|scalable|cutting.edge|game.chang\w*|unlock|elevate|streamline|empower|journey)\b/i;
const ABSTRACT_PHRASES = /\b(align with|underscores?|serves as|stands as|functions as|functions to|plays a (key|vital|crucial) role)\b/i;
const NEGATIVE_PARALLEL = /\b(not just|isn['’]t just|more than just|not only [^.]{3,40} but|rather than|it['’]s not a [^.,]{2,40}[,;] it['’]s|it is not a [^.,]{2,40}[,;] it is)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2728}]/u;
const CURLY = /[‘’“”]/;

function scan(pattern: RegExp) {
  const hits: string[] = [];
  for (const path of SOURCES) for (const { text, line } of codeLines(path)) if (pattern.test(text)) hits.push(`${path}:${line}: ${text.trim().slice(0, 100)}`);
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

test("the guard really reads the files (so a pass means something)", () => {
  assert.ok(SOURCES.length > 40, `only ${SOURCES.length} files were read`);
  assert.ok(SOURCES.some((p) => p.endsWith("posts.ts")));
  assert.ok(BANNED_WORDS.test("a vibrant community") && NEGATIVE_PARALLEL.test("It is not just a tool") && NEGATIVE_PARALLEL.test("rather than waiting"));
});

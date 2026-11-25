// Run with: npm test
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

// Audit P1-12: the brand fonts used to arrive late with nothing preloaded, so text was drawn in a fallback and then jumped (layout shift
// 0.168 on a job page and 0.103 on Compare, measured on a phone profile). They now go through Next's font loader, which preloads the
// Latin files and draws the fallback at the same size. These checks stop the old way creeping back. The shift itself was measured with
// Playwright (docs/audit/AUDIT-FIXES-LOG.md, P1-12).

const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");

test("the brand fonts are loaded through next/font/local", () => {
  const fonts = read("app/fonts.ts");
  assert.match(fonts, /from "next\/font\/local"/, "app/fonts.ts should load the fonts with next/font/local");
  for (const name of ["dm-serif-display-latin-400", "source-serif-4-latin-600", "poppins-latin-400", "source-sans-3-latin-400", "source-sans-3-latin-600", "source-sans-3-latin-700"]) {
    assert.ok(fonts.includes(name), `app/fonts.ts should load ${name}`);
  }
  assert.match(read("app/layout.tsx"), /style=\{fontVariables\}/, "the root layout should set the font stacks on <html>");
});

test("no page loads the Latin font files the old way, without a preload", () => {
  assert.doesNotMatch(read("app/layout.tsx"), /@fontsource\//, "app/layout.tsx should not import @fontsource stylesheets directly");
  // A whole weight file such as @fontsource/source-sans-3/400.css includes the Latin face again, which would be fetched a second time.
  const others = read("app/fonts-other-letters.ts");
  for (const line of others.split("\n").filter((l) => l.startsWith("import"))) {
    assert.match(line, /@fontsource\/[a-z0-9-]+\/[a-z-]+-\d00\.css/, `only single letter set files belong in app/fonts-other-letters.ts: ${line}`);
    assert.doesNotMatch(line, /\/latin-\d00\.css/, `the basic Latin set is loaded by app/fonts.ts: ${line}`);
  }
});

test("the stylesheet uses the font stacks, never the family names", () => {
  const css = read("app/globals.css");
  for (const family of ['"DM Serif Display"', '"Source Serif 4"', '"Source Sans 3"', "Poppins"]) {
    assert.ok(!css.includes(family), `app/globals.css names ${family}: use var(--f-display), var(--f-serif), var(--f-tag) or var(--f-sans)`);
  }
});

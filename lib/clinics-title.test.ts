// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Audit P1-52 (d): "For clinics" told a searcher nothing. Steve chose "Post eye care jobs in Canada" on 12th November 2026.
test("the For clinics page has a title a clinic would search for", () => {
  const page = readFileSync("app/clinics/page.tsx", "utf8");
  assert.match(page, /title: "Post eye care jobs in Canada",/);
  // With " | Kestrel Eye Care Jobs" added, it still fits in a search result (about 60 characters).
  assert.ok("Post eye care jobs in Canada | Kestrel Eye Care Jobs".length <= 60);
});

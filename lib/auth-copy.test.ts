// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNext } from "./auth-copy.ts";

test("safeNext keeps ordinary pages on this site", () => {
  assert.equal(safeNext("/jobs/123/apply"), "/jobs/123/apply");
  assert.equal(safeNext("/jobs?role=optometrist&page=2#top"), "/jobs?role=optometrist&page=2#top");
  assert.equal(safeNext(null), "/dashboard");
  assert.equal(safeNext("", "/x"), "/x");
});

test("safeNext refuses anything that could leave the site", () => {
  for (const bad of [
    "https://evil.example",
    "//evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/\u0000/evil.example",
    "/ /evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "/ /evil.example",
    "evil.example",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeNext(bad, "/safe"), "/safe", JSON.stringify(bad));
  }
});

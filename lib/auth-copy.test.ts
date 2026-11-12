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

// Audit P1-34: a "next" address is carried from page to page only when it is safe.
import { withNext } from "./auth-copy.ts";

test("withNext adds a safe next address and drops an unsafe or missing one", () => {
  assert.equal(withNext("/candidate/profile", "/jobs/abc/apply"), "/candidate/profile?next=%2Fjobs%2Fabc%2Fapply");
  assert.equal(withNext("/candidate/profile", "/jobs/abc?x=1&y=2"), "/candidate/profile?next=%2Fjobs%2Fabc%3Fx%3D1%26y%3D2");
  for (const bad of [null, undefined, "", "https://evil.example", "//evil.example", "/\t/evil.example", "javascript:alert(1)", "/a b", "\\evil"]) {
    assert.equal(withNext("/candidate/profile", bad), "/candidate/profile", String(bad));
  }
});

test("the first step is wired to carry the next address through every hop", async () => {
  const { readFileSync } = await import("node:fs");
  const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  assert.match(read("app/candidate/page.tsx"), /withNext\("\/candidate\/start"/);
  assert.match(read("app/candidate/start/page.tsx"), /name="next"|<FirstStepForm next=/);
  assert.match(read("components/FirstStepForm.tsx"), /name="next"/);
  assert.match(read("lib/candidate-actions.ts"), /withNext\("\/candidate\/profile", String\(form\.get\("next"\)/);
});

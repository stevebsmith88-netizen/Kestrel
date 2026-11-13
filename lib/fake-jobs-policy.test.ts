// Run with: npm test
// Ontario's Employment Standards Act (since 1st January 2026) requires every job board to show a way to report fraudulent posts where
// users will see it, and to post a written policy on how they are dealt with, and keep it posted, where users will see it. This checks the
// report link and the policy stay on every job page, in the footer and on the report page.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";

const read = (p: string) => readFileSync(p, "utf8");

test("the written policy exists and keeps the promises Steve agreed", () => {
  assert.ok(existsSync("app/fake-jobs/page.tsx"));
  const page = read("app/fake-jobs/page.tsx");
  assert.match(page, /within 2 business days/);
  assert.match(page, /3 years after it is replaced/);
  assert.match(read("docs/legal/fake-jobs-policy-versions.md"), /13th November 2026/);
});

test("the report link and the policy are shown where users will see them", () => {
  const job = read("app/jobs/[id]/page.tsx");
  assert.match(job, /\/report`\}>.*Report this job/);
  assert.match(job, /href="\/fake-jobs"/);
  assert.match(read("components/AppFooter.tsx"), /href="\/fake-jobs"/);
  assert.match(read("app/jobs/[id]/report/page.tsx"), /href="\/fake-jobs"/);
  assert.match(read("lib/sitemap-entries.ts"), /\/fake-jobs/);
});

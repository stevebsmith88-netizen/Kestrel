// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { POSTS } from "../content/posts.ts";

// Audit P1-52 (f): 3 pages answer "what must a job ad include in Ontario". /resources/ontario-job-ads is the main page for that search
// (decided in this phase, docs/audit/AUDIT-FIXES-LOG.md), and the other 2 link to it so search engines can tell which one to show.
const MAIN = "/resources/ontario-job-ads";

test("the job ad checklist blog post links to the Ontario rules page", () => {
  const post = POSTS.find((p) => p.slug === "eye-care-job-ad-checklist");
  assert.ok(post, "the checklist post should exist");
  assert.ok(post.body.includes(`](${MAIN})`), `the post should link to ${MAIN}`);
});

test("the posting policy links to the Ontario rules page", () => {
  assert.ok(readFileSync("app/posting-policy/page.tsx", "utf8").includes(`href="${MAIN}"`), `the posting policy should link to ${MAIN}`);
});

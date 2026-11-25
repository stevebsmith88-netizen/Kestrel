// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// P1-46: the public pages must say everything the AI service is sent, and the code must still send no candidate data.
test("the privacy and security pages say what the AI provider receives", () => {
  for (const page of ["app/privacy/page.tsx", "app/security/page.tsx"]) {
    const s = read(page);
    assert.doesNotMatch(s, /sees only the job details a clinic types in/, `${page} still has the old sentence`);
    assert.match(s, /up to 8 of that clinic/, `${page} should mention the earlier ads`);
    assert.match(s, /careers page/, `${page} should mention public careers pages`);
    assert.match(s, /never receives (candidate information|anything about candidates)/, `${page} should keep the no candidate promise`);
  }
});

test("the ad builder really sends at most 8 earlier ads", () => {
  assert.match(read("lib/ad-builder.ts"), /\.limit\(8\)/);
});

test("the ad builder and admin tools never read candidate tables", () => {
  for (const f of ["lib/ad-builder.ts", "lib/found-listings.ts", "lib/found-listing-actions.ts"]) {
    assert.doesNotMatch(read(f), /from\("(candidate_profiles|applications|application_drafts|cover_letter_templates|candidate_job_hides)"\)|cv_path|storage/, `${f} touches candidate data`);
  }
});

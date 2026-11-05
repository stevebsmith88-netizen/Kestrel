// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { outreachProblems, type CheckInput } from "./outreach-check.ts";

const now = Date.parse("2026-11-06T12:00:00Z");
const good: CheckInput = {
  contactEmail: "careers@northsideeyecare.ca",
  emailSourceUrl: "https://www.northsideeyecare.ca/contact",
  emailFoundAt: "2026-11-01T12:00:00Z",
  website: "https://northsideeyecare.ca",
  suppressed: false,
  onKestrel: false,
  hasListing: true,
};

test("a published business address with a record, not suppressed, and a listing has no problems", () => {
  assert.deepEqual(outreachProblems(good, now), []);
});

test("each condition that fails is named", () => {
  assert.match(outreachProblems({ ...good, contactEmail: null }, now)[0], /No published email/);
  assert.ok(outreachProblems({ ...good, contactEmail: "dr.smith@gmail.com" }, now).some((p) => /personal address/.test(p)));
  assert.ok(outreachProblems({ ...good, contactEmail: "dr@bell.net" }, now).some((p) => /personal address/.test(p)));
  assert.ok(outreachProblems({ ...good, emailSourceUrl: "https://directory.example/clinics" }, now).some((p) => /different website/.test(p)));
  assert.ok(outreachProblems({ ...good, emailFoundAt: "2026-06-01T12:00:00Z" }, now).some((p) => /90 days/.test(p)));
  assert.ok(outreachProblems({ ...good, suppressed: true }, now).some((p) => /do not email/.test(p)));
  assert.ok(outreachProblems({ ...good, onKestrel: true }, now).some((p) => /own account/.test(p)));
  assert.ok(outreachProblems({ ...good, hasListing: false }, now).some((p) => /no listing/i.test(p)));
});

test("www and a plain address count as the same website", () => {
  assert.deepEqual(outreachProblems({ ...good, emailSourceUrl: "https://northsideeyecare.ca/contact-us" }, now), []);
});

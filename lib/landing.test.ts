// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { ROLE_CATEGORIES } from "./jobs.ts";
import { LANDING_PROVINCES, LANDING_ROLES, comboHref, comboTitle, landingDescription, landingIndexable, provinceFromSlug, provinceSlug, roleFromSlug, slugify } from "./landing.ts";

test("every role a job can have has a landing page, and slugs are unique", () => {
  assert.deepEqual(LANDING_ROLES.map((r) => r.role).sort(), [...ROLE_CATEGORIES].sort());
  assert.equal(new Set(LANDING_ROLES.map((r) => r.slug)).size, LANDING_ROLES.length);
});

test("provinces turn into addresses and back, and Quebec has no page", () => {
  assert.equal(provinceSlug("Newfoundland and Labrador"), "newfoundland-and-labrador");
  assert.equal(provinceFromSlug("british-columbia"), "British Columbia");
  assert.equal(provinceFromSlug("quebec"), null);
  assert.equal(provinceFromSlug("narnia"), null);
  assert.ok(!LANDING_PROVINCES.includes("Quebec"));
  assert.equal(LANDING_PROVINCES.length, 12);
});

test("a role and province page reads naturally and has a plain address", () => {
  const optician = roleFromSlug("optician")!;
  assert.equal(comboTitle(optician, "Ontario"), "Optician jobs in Ontario");
  assert.equal(comboHref("Ontario", optician), "/eye-care-jobs/ontario/optician");
  assert.equal(roleFromSlug("nope"), null);
  assert.equal(slugify("Patient care & reception"), "patient-care-and-reception");
});

test("only a page with live jobs is offered to Google", () => {
  assert.equal(landingIndexable(0), false);
  assert.equal(landingIndexable(1), true);
});

test("the description counts jobs only when there are some", () => {
  assert.match(landingDescription("Optician jobs in Ontario", 3), /^3 live jobs: optician jobs in ontario\./);
  assert.match(landingDescription("Optician jobs in Ontario", 1), /^1 live job:/);
  assert.match(landingDescription("Optician jobs in Ontario", 0), /^Optician jobs in Ontario on Kestrel Eye Care Jobs\./);
});

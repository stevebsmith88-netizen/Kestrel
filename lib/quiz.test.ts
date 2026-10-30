// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { QUESTIONS, ROLE_BLURBS, scoreRoles, searchLink, topMatches } from "./quiz.ts";
import { ROLE_CATEGORIES } from "./jobs.ts";

test("every role has a description, and every quiz option is complete", () => {
  for (const role of ROLE_CATEGORIES) assert.ok(ROLE_BLURBS[role], role);
  for (const q of QUESTIONS) {
    assert.ok(q.options.length >= 2, q.id);
    for (const o of q.options) assert.ok(o.value && o.label, q.id);
    assert.ok(!/[–—]/.test(q.title + q.options.map((o) => o.label).join("")), `${q.id} uses a dash`);
  }
  for (const b of Object.values(ROLE_BLURBS)) assert.ok(!/[–—]/.test(b));
});

test("a registered optician who likes fitting glasses gets Optician first", () => {
  const top = topMatches({ work: "optician", setting: "on_site", today: "optician", employer: "independent", hours: "Full time", province: "Ontario" });
  assert.equal(top[0].role, "Optician");
  assert.ok(top[0].reasons.length >= 2);
});

test("someone who wants to be on the road and sell is pointed at field roles", () => {
  const top = topMatches({ work: "sales", setting: "field", today: "managed", employer: "supplier", hours: "Full time", province: "any" });
  assert.equal(top[0].role, "Sales or territory representative");
  assert.ok(top.every((m) => /representative|Account|Trainer|Field/.test(m.role)));
});

test("someone new to eye care who likes the front desk gets Patient care first", () => {
  assert.equal(topMatches({ work: "reception", setting: "either", today: "new", employer: "any", hours: "any", province: "any" })[0].role, "Patient care or reception");
});

test("the same answers always give the same result, and no answers still gives something", () => {
  const a = { work: "trainer", setting: "either", today: "optician" };
  assert.deepEqual(scoreRoles(a), scoreRoles({ ...a }));
  assert.equal(topMatches({}).length, 1);
  assert.ok(topMatches({ work: "optometrist", today: "optometrist" }).length <= 3);
});

test("search links carry the right filters and never mix employer types and roles that cannot match", () => {
  const link = searchLink("Optician", { employer: "independent", hours: "Part time", province: "Ontario", setting: "on_site" });
  assert.match(link, /role=Optician/);
  assert.match(link, /province=Ontario/);
  assert.match(link, /type=Part\+time/);
  assert.match(link, /practice=independent/);
  assert.ok(!link.includes("arrangement"));
  const supplier = searchLink("Optician", { employer: "supplier" });
  assert.ok(!supplier.includes("practice"));
  const field = searchLink("Sales or territory representative", { employer: "supplier", setting: "field", province: "any" });
  assert.match(field, /practice=supplier/);
  assert.match(field, /arrangement=field/);
  assert.ok(!field.includes("province"));
});

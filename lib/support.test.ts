// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCESS_TEXT, accessEnds, accessOpen, HELP_REASONS, kindLabel, reasonLabel } from "./support.ts";

test("Kestrel may work in a clinic's account only while an open request allows it", () => {
  const now = new Date("2026-11-14T12:00:00Z");
  const until = accessEnds(now).toISOString();
  assert.equal(accessOpen({ status: "open", access_until: until }, now), true);
  assert.equal(accessOpen({ status: "done", access_until: until }, now), false);
  assert.equal(accessOpen({ status: "open", access_until: null }, now), false);
  assert.equal(accessOpen({ status: "open", access_until: until }, new Date("2026-11-22T12:00:00Z")), false);
  assert.equal(accessOpen(null, now), false);
});

test("the permission says what is and is not visible", () => {
  assert.match(ACCESS_TEXT, /7 days/);
  assert.match(ACCESS_TEXT, /cannot see applicants' resumes, cover letters or our private notes/);
  assert.ok(ACCESS_TEXT.length <= 600, "it must fit the database column");
});

test("labels", () => {
  assert.equal(reasonLabel("team"), HELP_REASONS[0].label);
  assert.equal(reasonLabel("idea"), "An idea or a feature request");
  assert.equal(kindLabel("help"), "Help request");
  assert.equal(kindLabel("bug"), "Something is not working");
});

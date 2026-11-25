// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { NAME_HOLD_DAYS, nameDiffers, nameLockedUntil, onlyCapitalsDiffer } from "./name-hold.ts";

const now = new Date("2026-11-12T12:00:00Z");

test("a name that has never been changed can be changed now", () => {
  assert.equal(nameLockedUntil(null, now), null);
  assert.equal(nameLockedUntil(undefined, now), null);
});

test("after a change the name is held for 30 days, then free again", () => {
  assert.equal(NAME_HOLD_DAYS, 30);
  const until = nameLockedUntil("2026-11-01T12:00:00Z", now);
  assert.equal(until?.toISOString(), "2026-12-01T12:00:00.000Z");
  assert.equal(nameLockedUntil("2026-10-13T12:00:00Z", now), null);
  assert.equal(nameLockedUntil("2026-10-01T12:00:00Z", now), null);
});

test("a bad date never locks anyone out", () => {
  assert.equal(nameLockedUntil("not a date", now), null);
});

test("only a real change counts: extra spaces and capital letters alone do not", () => {
  assert.equal(nameDiffers({ first: "jane", last: "smith" }, { first: "Jane", last: "Smith" }), false);
  assert.equal(onlyCapitalsDiffer({ first: "jane", last: "smith" }, { first: "Jane", last: "Smith" }), true);
  assert.equal(onlyCapitalsDiffer({ first: "Jane", last: "Smith" }, { first: "Jane ", last: "Smith" }), false);
  assert.equal(onlyCapitalsDiffer({ first: "Jane", last: "Smith" }, { first: "Jane", last: "Doe" }), false);
  assert.equal(nameDiffers({ first: "Jane", last: "Smith" }, { first: "Jane", last: "Smith" }), false);
  assert.equal(nameDiffers({ first: "Jane", last: "Smith" }, { first: " Jane ", last: "Smith" }), false);
  assert.equal(nameDiffers({ first: "Jane", last: "Smith" }, { first: "Jane", last: "Doe" }), true);
  assert.equal(nameDiffers({ first: "Jane", last: "" }, { first: "Jane", last: "Smith" }), true);
});

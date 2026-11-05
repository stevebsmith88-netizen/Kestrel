// Run with: npm test
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { homeBlogOn, seedingOn } from "./features.ts";

afterEach(() => {
  delete process.env.ENABLE_HOME_BLOG;
  delete process.env.ENABLE_SEEDING;
});

test("the home page blog section is off unless ENABLE_HOME_BLOG is exactly yes", () => {
  assert.equal(homeBlogOn(), false);
  for (const value of ["", "no", "true", "YES", "1"]) {
    process.env.ENABLE_HOME_BLOG = value;
    assert.equal(homeBlogOn(), false, value);
  }
  process.env.ENABLE_HOME_BLOG = "yes";
  assert.equal(homeBlogOn(), true);
});

test("publishing found listings is off unless ENABLE_SEEDING is exactly yes", () => {
  assert.equal(seedingOn(), false);
  for (const value of ["", "no", "true", "YES", "1"]) {
    process.env.ENABLE_SEEDING = value;
    assert.equal(seedingOn(), false, value);
  }
  process.env.ENABLE_SEEDING = "yes";
  assert.equal(seedingOn(), true);
});

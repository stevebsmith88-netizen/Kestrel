// Run with: npm test
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { homeBlogOn } from "./features.ts";

afterEach(() => {
  delete process.env.ENABLE_HOME_BLOG;
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

// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { TAGLINE, launchChoice } from "./launch-rules.ts";

test("the launch layout follows the sign up gate unless forced", () => {
  assert.equal(launchChoice(undefined, false), false);
  assert.equal(launchChoice("", true), true);
  assert.equal(launchChoice(" Yes ", false), true);
  assert.equal(launchChoice("no", true), false);
  assert.equal(launchChoice("maybe", true), true);
});

test("the tagline stays as the brand wording", () => {
  assert.equal(TAGLINE, "Canada-wide eye care job board");
});

// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { TAGLINE, homeMode } from "./launch-rules.ts";

test("before launch the original page shows, unless the pre launch look is chosen", () => {
  assert.equal(homeMode(undefined, undefined, false), "coming-soon");
  assert.equal(homeMode("", "no", false), "coming-soon");
  assert.equal(homeMode(undefined, " Yes ", false), "prelaunch");
});

test("opening sign up always wins, so a pre launch setting never blocks launch", () => {
  assert.equal(homeMode(undefined, undefined, true), "launch");
  assert.equal(homeMode(undefined, "yes", true), "launch");
});

test("LAUNCH_HOME forces a page either way", () => {
  assert.equal(homeMode("yes", undefined, false), "launch");
  assert.equal(homeMode("no", "yes", true), "coming-soon");
  assert.equal(homeMode("maybe", undefined, true), "launch");
});

test("the tagline stays as the brand wording", () => {
  assert.equal(TAGLINE, "Canada-wide eye care job board");
});

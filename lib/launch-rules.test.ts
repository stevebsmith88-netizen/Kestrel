// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { TAGLINE, homeMode } from "./launch-rules.ts";

test("before launch the pre launch look shows, unless the original page is asked for", () => {
  assert.equal(homeMode(undefined, undefined, false), "prelaunch");
  assert.equal(homeMode("", " Yes ", false), "prelaunch");
  assert.equal(homeMode(undefined, "no", false), "coming-soon");
});

test("opening sign up always wins, so a pre launch setting never blocks launch", () => {
  assert.equal(homeMode(undefined, undefined, true), "launch");
  assert.equal(homeMode(undefined, "no", true), "launch");
});

test("LAUNCH_HOME forces a page either way", () => {
  assert.equal(homeMode("yes", undefined, false), "launch");
  assert.equal(homeMode("no", undefined, true), "coming-soon");
  assert.equal(homeMode("prelaunch", undefined, true), "prelaunch");
  assert.equal(homeMode("maybe", undefined, true), "launch");
});

test("the tagline stays as the brand wording", () => {
  assert.equal(TAGLINE, "Canada-wide eye care job board");
});

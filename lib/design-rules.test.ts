// Run with: npm test
// Decisions of 13th November 2026 that are easy to undo by accident.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync("app/globals.css", "utf8");
const radiusOf = (selector: string) => {
  const m = css.match(new RegExp(`(?:^|\\n)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\{[^}]*border-radius:([^;}]+)`));
  return m?.[1].trim();
};

test("everything you can press has squared corners; capsules are only for information (Steve, 13th November 2026)", () => {
  for (const sel of [".btn", ".tab", ".landlinks a", ".sf-tag", ".sf-filterbtn"]) assert.notEqual(radiusOf(sel), "999px", `${sel} should not be a capsule`);
  for (const sel of [".chip", ".badge", ".pill"]) assert.equal(radiusOf(sel), "999px", `${sel} is a label and stays a capsule`);
});

test("the ad builder never adds 'internationally trained' by itself, and names Kestrel", () => {
  const ad = readFileSync("lib/ad-builder.ts", "utf8");
  assert.match(ad, /internationally trained applicants are welcome only if the clinic's facts say so/);
  assert.doesNotMatch(ad, /You may say internationally trained/);
  assert.match(ad, /apply through Kestrel/);
});

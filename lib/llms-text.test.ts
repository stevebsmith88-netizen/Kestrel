// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { llmsText } from "./llms-text.ts";

test("llms.txt starts with the name and summary, and lists the posts it is given", () => {
  const text = llmsText("https://eyecarejobs.ca", [{ slug: "a-post", title: "A post", description: "What it covers." }]);
  assert.ok(text.startsWith("# Kestrel Eye Care Jobs\n\n> "));
  assert.ok(text.includes("- [A post](https://eyecarejobs.ca/blog/a-post): What it covers."));
  assert.ok(text.includes("https://eyecarejobs.ca/resources/eye-care-pay-summary"));
});

test("llms.txt follows the house style", () => {
  const text = llmsText("https://eyecarejobs.ca", []);
  assert.ok(!/[–—]/.test(text), "no em or en dashes");
  assert.ok(!/\S[ \t]+-[ \t]+\S/.test(text.replace(/^- /gm, "")), "no hyphen used as punctuation");
});

// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { listedGroups, RESOURCE_GROUPS } from "./resources.ts";

const all = RESOURCE_GROUPS.flatMap((g) => g.links);

test("every resource link is a plain https or http address with a name and a note", () => {
  for (const l of all) {
    assert.ok(/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?$/i.test(l.url), `${l.name}: ${l.url}`);
    assert.ok(l.name.length > 3 && l.note.length > 3, l.name);
  }
});

test("no address is listed twice", () => {
  const urls = all.map((l) => l.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").toLowerCase());
  assert.equal(new Set(urls).size, urls.length);
});

test("only links with a check date are shown, and an empty group is left out", () => {
  const shown = listedGroups().flatMap((g) => g.links);
  assert.ok(shown.length > 0);
  assert.ok(shown.every((l) => l.checked !== null && /^\d{4}-\d{2}-\d{2}$/.test(l.checked)));
  const held = all.filter((l) => l.checked === null);
  assert.ok(held.length > 0, "the held back links are kept in the file");
  for (const l of held) assert.ok(!shown.some((s) => s.url === l.url));
  assert.deepEqual(listedGroups([{ id: "x", heading: "x", intro: "x", links: [{ name: "Held back", url: "https://example.ca", note: "note", checked: null }] }]), []);
});

test("the page links to no job board and no supplier", () => {
  for (const l of all) assert.ok(!/indeed|linkedin|jobs4ecps|eyerecommend|eye-recommend/i.test(l.url), l.url);
});

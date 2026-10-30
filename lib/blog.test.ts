// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBlocks, parseInline, readingMinutes, safeHref } from "./blog.ts";
import { POSTS } from "../content/posts.ts";

test("text becomes headings, lists and paragraphs", () => {
  const blocks = parseBlocks("Intro line\ncontinues here.\n\n## A heading\n\n- one\n- two\n\nLast.");
  assert.deepEqual(blocks, [
    { type: "p", text: "Intro line continues here." },
    { type: "h2", text: "A heading" },
    { type: "ul", items: ["one", "two"] },
    { type: "p", text: "Last." },
  ]);
});

test("only safe links are kept", () => {
  assert.equal(safeHref("/jobs"), true);
  assert.equal(safeHref("https://example.com"), true);
  assert.equal(safeHref("//evil.example"), false);
  assert.equal(safeHref("javascript:alert(1)"), false);
  assert.equal(safeHref("http://example.com"), false);
  const parts = parseInline("See [jobs](/jobs), **this**, and [bad](javascript:alert(1)).");
  assert.ok(parts.some((p) => p.type === "link" && p.href === "/jobs"));
  assert.ok(parts.some((p) => p.type === "bold" && p.text === "this"));
  assert.ok(!parts.some((p) => p.type === "link" && p.href.startsWith("javascript")));
});

test("every post is complete and follows the house style", () => {
  const slugs = new Set<string>();
  for (const post of POSTS) {
    assert.match(post.slug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(post.slug), `duplicate slug ${post.slug}`);
    slugs.add(post.slug);
    assert.ok(post.title.length <= 70, `${post.slug} title is too long for search results`);
    assert.ok(post.description.length >= 70 && post.description.length <= 160, `${post.slug} description should be 70 to 160 characters`);
    assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(readingMinutes(post.body) >= 2, `${post.slug} is very short`);
    assert.ok(!/[–—]/.test(`${post.title} ${post.description} ${post.body}`), `${post.slug} uses a dash as punctuation`);
    assert.ok(!/\S[ \t]+-[ \t]+\S/.test(post.body), `${post.slug} uses a hyphen as punctuation`);
  }
});

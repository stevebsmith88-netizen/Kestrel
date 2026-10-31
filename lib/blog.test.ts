// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublished, parseBlocks, parseInline, readingMinutes, safeHref, todayInToronto, visiblePosts } from "./blog.ts";
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

test("a post appears at the start of its date in Toronto, not before", () => {
  const post = { date: "2026-11-13" };
  // 13th November 2026 is on standard time (UTC minus 5), so midnight Eastern is 05:00 UTC.
  assert.equal(isPublished(post, new Date("2026-11-13T04:59:00Z")), false);
  assert.equal(isPublished(post, new Date("2026-11-13T05:00:00Z")), true);
  assert.equal(isPublished(post, new Date("2026-11-20T12:00:00Z")), true);
  assert.equal(todayInToronto(new Date("2026-11-13T04:59:00Z")), "2026-11-12");
});

test("on the live site scheduled posts are hidden, and on previews they are shown", () => {
  const posts = [{ date: "2026-10-30" }, { date: "2026-11-13" }, { date: "2026-11-27" }];
  const now = new Date("2026-11-14T15:00:00Z");
  assert.deepEqual(visiblePosts(posts, now, false), [{ date: "2026-10-30" }, { date: "2026-11-13" }]);
  assert.equal(visiblePosts(posts, now, true).length, 3);
});

test("the posts are spaced at least 2 weeks apart after the first 3, and none links to a post that is not out yet", () => {
  const dates = [...new Set(POSTS.map((p) => p.date))].sort();
  for (let i = 1; i < dates.length; i++) {
    const days = (Date.parse(dates[i]) - Date.parse(dates[i - 1])) / 86_400_000;
    // the first 3 posts were published together at the start; every later one waits at least 2 weeks for the one before
    if (dates[i - 1] >= "2026-10-30" && POSTS.filter((p) => p.date === dates[i - 1]).length === 1) assert.ok(days >= 14, `${dates[i]} is only ${days} days after ${dates[i - 1]}`);
  }
  for (const post of POSTS) {
    for (const match of post.body.matchAll(/\]\(\/blog\/([a-z0-9-]+)\)/g)) {
      const target = POSTS.find((p) => p.slug === match[1]);
      assert.ok(target, `${post.slug} links to a post that does not exist: ${match[1]}`);
      assert.ok(target.date <= post.date, `${post.slug} (${post.date}) links to ${target.slug}, which is not out until ${target.date}`);
    }
  }
});

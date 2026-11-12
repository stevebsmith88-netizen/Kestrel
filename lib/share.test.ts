// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { shareMetadata } from "./share.ts";

test("a shared link gets the page's own title and description, never the coming soon text", () => {
  const meta = shareMetadata({ title: "Optician at Test Clinic, Toronto, Ontario", description: "Toronto, Ontario. $60,000 to $70,000 a year.", path: "/jobs/abc", shareTitle: "Optician at Test Clinic" });
  assert.equal(meta.title, "Optician at Test Clinic, Toronto, Ontario | Kestrel Eye Care Jobs");
  assert.equal(meta.openGraph?.title, "Optician at Test Clinic");
  assert.equal(meta.openGraph?.description, "Toronto, Ontario. $60,000 to $70,000 a year.");
  assert.ok(!JSON.stringify(meta).includes("Coming soon"));
  assert.equal(meta.alternates?.canonical, "/jobs/abc");
});

test("every shared link carries a picture", () => {
  const meta = shareMetadata({ title: "For clinics", description: "x", path: "/clinics" });
  assert.ok(JSON.stringify(meta.openGraph).includes("/brand/kestrel-share-1200x630.png"));
  assert.ok(JSON.stringify(meta.twitter).includes("/brand/kestrel-share-1200x630.png"));
});

// Audit P1-52 (c): the share picture is 1200 by 630, so links shared on X and similar sites should show it full width, not as a thumbnail.
test("shared links use the large picture card", () => {
  const meta = shareMetadata({ title: "Help", description: "Answers", path: "/help" });
  const twitter = meta.twitter as { card?: string; images?: string[] };
  assert.equal(twitter.card, "summary_large_image");
  assert.deepEqual(twitter.images, ["/brand/kestrel-share-1200x630.png"]);
});

test("the home page, which uses the site's own details, asks for the large card too", () => {
  assert.match(readFileSync("app/layout.tsx", "utf8"), /twitter:\s*\{\s*card:\s*"summary_large_image"/);
});

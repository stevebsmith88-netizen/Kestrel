// Run with: npm test
import assert from "node:assert/strict";
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
  assert.ok(JSON.stringify(meta.openGraph).includes("/brand/kestrel-lockup-full.png"));
  assert.ok(JSON.stringify(meta.twitter).includes("/brand/kestrel-lockup-full.png"));
});

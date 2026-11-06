// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanAttribution, cleanPath, cleanTag, readAttribution, sourceLabel } from "./attribution.ts";

const site = "eyecarejobs.ca";

test("link tags are tidied into lower case words", () => {
  assert.equal(cleanTag(" Spring Launch!! "), "spring-launch");
  assert.equal(cleanTag("<script>alert(1)</script>"), "scriptalert1script");
  assert.equal(cleanTag(""), null);
  assert.equal(cleanTag(42), null);
  assert.equal(cleanTag("a".repeat(200))?.length, 60);
});

test("a path keeps no query string and no odd characters", () => {
  assert.equal(cleanPath("/blog/eye-care-cv?email=a@b.ca"), "/blog/eye-care-cv");
  assert.equal(cleanPath("https://evil.example"), null);
  assert.equal(cleanPath("/x<y>"), "/xy");
});

test("tagged links and referrers are read from the first visit", () => {
  const a = readAttribution({ search: "?utm_source=Newsletter&utm_medium=Email&utm_campaign=Nov-2026", referrer: "", siteHost: site, path: "/" });
  assert.deepEqual(a, { utm_source: "newsletter", utm_medium: "email", utm_campaign: "nov-2026", referrer_host: null, landing_path: "/" });
  const g = readAttribution({ search: "", referrer: "https://www.google.com/search?q=x", siteHost: site, path: "/blog/eye-care-cv" });
  assert.equal(g.referrer_host, "google.com");
  assert.equal(g.landing_path, "/blog/eye-care-cv");
});

test("a visit from our own pages, or a bad referrer, is not a source", () => {
  assert.equal(readAttribution({ search: "", referrer: "https://eyecarejobs.ca/blog", siteHost: "www.eyecarejobs.ca", path: "/" }).referrer_host, null);
  assert.equal(readAttribution({ search: "", referrer: "not a url", siteHost: site, path: "/" }).referrer_host, null);
});

test("anything sent by the browser is cleaned again on the server", () => {
  assert.deepEqual(cleanAttribution(null), { utm_source: null, utm_medium: null, utm_campaign: null, referrer_host: null, landing_path: null });
  assert.equal(cleanAttribution({ utm_source: "A B", referrer_host: "bad host!" }).utm_source, "a-b");
  assert.equal(cleanAttribution({ referrer_host: "nodots" }).referrer_host, null);
});

test("the admin label is short and plain", () => {
  assert.equal(sourceLabel({ utm_source: "newsletter", utm_medium: "email" }), "newsletter (email)");
  assert.equal(sourceLabel({ referrer_host: "google.com", landing_path: "/" }), "google.com");
  assert.equal(sourceLabel({ landing_path: "/" }), "Direct");
  assert.equal(sourceLabel({}), "Not recorded");
});

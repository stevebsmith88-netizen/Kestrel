// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { provinceFrom, siteDetails } from "./site-details.ts";

const page = (head: string, body = "<p>Our own page words, never read.</p>") => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

test("reads the name, description and place a business gives search engines", () => {
  const html = page(`
    <title>Northgate Eye Care | Optometrists in Kelowna</title>
    <meta content="Family eye care in Kelowna since 1998 &amp; still independent." name="description">
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"Site"},{"@type":["Optician","LocalBusiness"],"name":"Northgate Eye Care","address":{"@type":"PostalAddress","addressLocality":"Kelowna","addressRegion":"BC"}}]}</script>`);
  assert.deepEqual(siteDetails(html), { name: "Northgate Eye Care", about: "Family eye care in Kelowna since 1998 & still independent.", city: "Kelowna", province: "British Columbia" });
});

test("falls back to the share labels, then the page title", () => {
  assert.deepEqual(siteDetails(page(`<meta property="og:site_name" content="Harbourside Optometry"><meta property="og:description" content="Eye exams and glasses.">`)), { name: "Harbourside Optometry", about: "Eye exams and glasses." });
  assert.deepEqual(siteDetails(page(`<title>Lakeview Vision - Home</title>`)), { name: "Lakeview Vision" });
});

test("never reads the page's own words, and finds nothing on a bare page", () => {
  assert.deepEqual(siteDetails(page("", "<h1>Welcome to Bright Eyes</h1><p>We are hiring</p>")), {});
});

test("broken structured data does not stop the other labels", () => {
  assert.deepEqual(siteDetails(page(`<script type="application/ld+json">{not json</script><meta name="description" content="Still read.">`)), { about: "Still read." });
});

test("provinces are read in full or short, and Quebec is left out", () => {
  assert.equal(provinceFrom("ON"), "Ontario");
  assert.equal(provinceFrom("n.s."), "Nova Scotia");
  assert.equal(provinceFrom("Prince Edward Island"), "Prince Edward Island");
  assert.equal(provinceFrom("QC"), undefined);
  assert.equal(provinceFrom("Washington"), undefined);
});

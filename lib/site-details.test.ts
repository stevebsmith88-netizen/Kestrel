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

test("finds the clinic's own social pages in the structured data and the page links, and skips share buttons and posts", () => {
  const html = page(
    `<script type="application/ld+json">{"@type":"Optician","name":"Northgate","sameAs":["https://www.facebook.com/northgateeyecare/","https://twitter.com/northgate"]}</script>`,
    `<a href="https://www.facebook.com/sharer/sharer.php?u=x">Share</a><a href="https://www.instagram.com/p/Cabc123/">post</a><a href='https://instagram.com/northgate_eyes?utm=1'>ig</a><a href="https://www.linkedin.com/company/northgate-eye-care/">in</a><a href="https://www.linkedin.com/in/some-person">person</a>`,
  );
  assert.deepEqual(siteDetails(html), { name: "Northgate", facebook: "https://www.facebook.com/northgateeyecare", instagram: "https://instagram.com/northgate_eyes", linkedin: "https://www.linkedin.com/company/northgate-eye-care" });
});

test("provinces are read in full or short, and Quebec is left out", () => {
  assert.equal(provinceFrom("ON"), "Ontario");
  assert.equal(provinceFrom("n.s."), "Nova Scotia");
  assert.equal(provinceFrom("Prince Edward Island"), "Prince Edward Island");
  assert.equal(provinceFrom("QC"), undefined);
  assert.equal(provinceFrom("Washington"), undefined);
});

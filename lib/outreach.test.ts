// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { outreachEmail } from "./outreach.ts";

const mail = outreachEmail({
  clinicName: "Harbourside Optical",
  jobTitle: "Optician",
  sourceUrl: "https://harbourside.example/careers",
  listingUrl: "https://eyecarejobs.ca/jobs/abc",
  claimUrl: "https://eyecarejobs.ca/clinics",
  unsubscribeUrl: "https://eyecarejobs.ca/unsubscribe/xyz",
});

test("outreach email meets the CASL basics", () => {
  for (const body of [mail.html, mail.text]) {
    assert.match(body, /Kestrel Eye Care Jobs/, "says who is sending");
    assert.match(body, /6013 Yonge Street/, "gives the mailing address");
    assert.match(body, /unsubscribe/i, "has an unsubscribe");
    assert.match(body, /eyecarejobs\.ca\/unsubscribe\/xyz/, "unsubscribe link works");
    assert.match(body, /published on your website/, "says why we are writing");
    assert.ok(!/you asked to hear from/i.test(body), "does not claim they asked for it");
  }
});

test("outreach email follows the house writing style", () => {
  assert.ok(!/[–—]/.test(mail.text), "no dashes used as punctuation");
  assert.match(mail.text, /The Kestrel team/);
});

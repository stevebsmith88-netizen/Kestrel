// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { baseSlug, clinicIndexable, clinicJsonLd, clinicSlugs, openJobsText, slugify } from "./clinic-pages.ts";

test("clinic names become plain web addresses", () => {
  assert.equal(slugify("Northgate Eye Care"), "northgate-eye-care");
  assert.equal(slugify("Smith & Jones Optometry"), "smith-and-jones-optometry");
  assert.equal(slugify("Dr. O'Brien's Vision Clinic"), "dr-obriens-vision-clinic");
  assert.equal(slugify("Clinique Lévis"), "clinique-levis");
  assert.equal(slugify("  --  "), "");
});

test("the town is added, unless the name already has it", () => {
  assert.equal(baseSlug({ clinic_name: "Northgate Eye Care", city: "Kelowna" }), "northgate-eye-care-kelowna");
  assert.equal(baseSlug({ clinic_name: "Kelowna Eye Care", city: "Kelowna" }), "kelowna-eye-care");
  assert.equal(baseSlug({ clinic_name: "Eye Care Kelowna", city: "Kelowna" }), "eye-care-kelowna");
  assert.equal(baseSlug({ clinic_name: "???", city: "Halifax" }), "clinic-halifax");
});

test("2 clinics that would share an address each get a piece of their id", () => {
  const slugs = clinicSlugs([
    { id: "aaaaaaaa-1111-2222-3333-444444444444", clinic_name: "Vision Centre", city: "Toronto" },
    { id: "bbbbbbbb-1111-2222-3333-444444444444", clinic_name: "Vision Centre", city: "Toronto" },
    { id: "cccccccc-1111-2222-3333-444444444444", clinic_name: "Vision Centre", city: "Ottawa" },
  ]);
  assert.equal(slugs.get("aaaaaaaa-1111-2222-3333-444444444444"), "vision-centre-toronto-aaaaaa");
  assert.equal(slugs.get("bbbbbbbb-1111-2222-3333-444444444444"), "vision-centre-toronto-bbbbbb");
  assert.equal(slugs.get("cccccccc-1111-2222-3333-444444444444"), "vision-centre-ottawa");
});

test("only pages with jobs or a real description are offered to search engines", () => {
  assert.equal(clinicIndexable(null, 0), false);
  assert.equal(clinicIndexable("Short.", 0), false);
  assert.equal(clinicIndexable("x".repeat(80), 0), true);
  assert.equal(clinicIndexable(null, 1), true);
});

test("the job count reads naturally", () => {
  assert.equal(openJobsText(0), "No open jobs right now");
  assert.equal(openJobsText(1), "1 open job");
  assert.equal(openJobsText(3), "3 open jobs");
});

test("search engine data matches the page and never holds private details", () => {
  const data = clinicJsonLd({ id: "x", clinic_name: "Northgate Eye Care", practice_type: "independent", website: "https://northgate.example", province: "British Columbia", city: "Kelowna", about: "A friendly clinic." }, "northgate-eye-care-kelowna", "https://eyecarejobs.ca");
  assert.equal(data.url, "https://eyecarejobs.ca/clinics/northgate-eye-care-kelowna");
  assert.deepEqual(data.address, { "@type": "PostalAddress", addressLocality: "Kelowna", addressRegion: "British Columbia", addressCountry: "CA" });
  assert.deepEqual(Object.keys(data).sort(), ["@context", "@type", "address", "description", "name", "sameAs", "url"]);
});

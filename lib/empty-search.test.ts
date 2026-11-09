// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySearchSuggestions, searchHref } from "./empty-search.ts";

test("the example search (Independent, Optician, Prince Edward Island, a city and a radius) offers real ways to widen it", () => {
  const f = { practice: "independent", role: "Optician", province: "Prince Edward Island", city: "Charlottetown", radius: 25 };
  const s = emptySearchSuggestions(f, 10);
  assert.equal(s[0].label, "Widen the distance to 50 km");
  assert.ok(s[0].href.includes("radius=50") && s[0].href.includes("city=Charlottetown"));
  const wholeProvince = s.find((x) => x.label === "Search all of Prince Edward Island");
  assert.ok(wholeProvince && !wholeProvince.href.includes("city="));
  const anyRole = s.find((x) => x.label === "Any role");
  assert.ok(anyRole && !anyRole.href.includes("role=") && anyRole.href.includes("practice=independent"));
  assert.ok(s.every((x) => x.href.startsWith("/jobs")));
});

test("nothing is offered to widen the distance when it is already the widest", () => {
  const s = emptySearchSuggestions({ city: "Ottawa", radius: 50 }, 10);
  assert.ok(!s.some((x) => x.label.includes("Widen")));
});

test("a search with no filters has no suggestions, and the number is capped", () => {
  assert.deepEqual(emptySearchSuggestions({}), []);
  assert.equal(emptySearchSuggestions({ q: "x", role: "Optician", province: "Ontario", practice: "corporate", arrangement: "field", type: ["Locum"] }).length, 5);
});

test("a link keeps the other filters and never leaves a distance without a city", () => {
  assert.equal(searchHref({ role: "Optician", radius: 50 }), "/jobs?role=Optician");
  assert.equal(searchHref({}), "/jobs");
});

test("a search with ticked software or equipment can drop each group, and the links keep the other filters", () => {
  const f = { role: "Optometrist", tags: { software: ["Wink"], equipment: ["Optos"], specialties: ["Vision therapy"] } };
  const s = emptySearchSuggestions(f, 10);
  const software = s.find((x) => x.label === "Any practice software");
  assert.ok(software && !software.href.includes("software=") && software.href.includes("equipment=Optos") && software.href.includes("role=Optometrist"));
  assert.ok(s.find((x) => x.label === "Any specialty")?.href.includes("software=Wink"));
  assert.ok(searchHref(f).includes("specialty=Vision+therapy"));
});

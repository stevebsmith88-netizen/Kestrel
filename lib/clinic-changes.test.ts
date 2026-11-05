// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { clinicChangeParagraphs, clinicChanges } from "./clinic-changes.ts";

const before = { clinic_name: "Northside Eyecare", practice_type: "independent", website: "https://northside.example", province: "Ontario", city: "Ottawa", about: "A friendly clinic." };

test("nothing is listed when only spacing or empty values differ", () => {
  assert.deepEqual(clinicChanges(before, { ...before, about: "  A friendly clinic. " }), []);
  assert.deepEqual(clinicChanges({ ...before, website: null }, { ...before, website: "" }), []);
});

test("each changed field is listed with the old and new wording", () => {
  const changes = clinicChanges(before, { ...before, clinic_name: "Northside Optical", website: "", about: "Now part of a group." });
  assert.deepEqual(changes.map((c) => c.label), ["Clinic name", "Website", "About"]);
  assert.deepEqual(changes[1], { label: "Website", before: "https://northside.example", after: "(empty)" });
});

test("the email text names the clinic and shortens long About text", () => {
  const long = "x".repeat(500);
  const text = clinicChangeParagraphs("Northside Optical", clinicChanges(before, { ...before, about: long }));
  assert.match(text[0], /Northside Optical/);
  assert.ok(text[1].length < 400);
  assert.match(text[1], /\.\.\./);
});

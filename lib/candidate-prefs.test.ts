// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanPrefs, prefsFromProfile } from "./candidate-prefs.ts";

test("a town on the list is saved with its proper name and province", () => {
  const { row, errors } = cleanPrefs({ homeCity: "north york", homeProvince: "Ontario", radius: "50" }, "Optician");
  assert.deepEqual(errors, {});
  assert.equal(row.home_city, "Toronto");
  assert.equal(row.home_province, "Ontario");
  assert.equal(row.pref_radius_km, 50);
});

test("an unknown town, or a town with no province, is explained", () => {
  assert.ok(cleanPrefs({ homeCity: "Nowheresville", homeProvince: "Ontario" }, "Optician").errors.homeCity);
  assert.ok(cleanPrefs({ homeCity: "Toronto", homeProvince: "" }, "Optician").errors.homeProvince);
  assert.deepEqual(cleanPrefs({}, "Optician").errors, {});
});

test("a minimum pay needs a year or an hour, and bad amounts are explained", () => {
  assert.equal(cleanPrefs({ minPay: "28.50", payPeriod: "hour" }, "Optician").row.pref_min_pay, 28.5);
  assert.equal(cleanPrefs({ minPay: "62,000", payPeriod: "year" }, "Optician").row.pref_min_pay, 62000);
  assert.ok(cleanPrefs({ minPay: "62000" }, "Optician").errors.payPeriod);
  assert.ok(cleanPrefs({ minPay: "lots", payPeriod: "year" }, "Optician").errors.minPay);
  assert.equal(cleanPrefs({ minPay: "", payPeriod: "year" }, "Optician").row.pref_min_pay, null);
});

test("only known choices are kept, and the role they chose is not repeated in the other roles", () => {
  const { row } = cleanPrefs(
    { radius: "7", extraProvinces: ["Alberta", "Mars", "Alberta"], employmentTypes: ["Full time", "Whenever"], otherRoles: ["Optician", "Optometric assistant or technician", "Wizard"], practice: "either" },
    "Optician",
  );
  assert.equal(row.pref_radius_km, 25);
  assert.deepEqual(row.pref_provinces, ["Alberta"]);
  assert.deepEqual(row.pref_employment_types, ["Full time"]);
  assert.deepEqual(row.pref_other_roles, ["Optometric assistant or technician"]);
  assert.equal(row.pref_practice, null);
});

test("people in Quebec can say they would work in another province", () => {
  const { row, errors } = cleanPrefs({ homeCity: "Montreal", homeProvince: "Quebec", extraProvinces: ["Ontario"] }, "Optician");
  assert.deepEqual(errors, {});
  assert.deepEqual(row.pref_provinces, ["Ontario"]);
});

test("a saved profile turns into the rules' input, and a missing profile into an empty one", () => {
  assert.equal(prefsFromProfile(null).profession, null);
  assert.equal(prefsFromProfile(null).radiusKm, 25);
  const p = prefsFromProfile({ profession: "Optician", licensed_provinces: ["Ontario"], pref_min_pay: "28.5" as unknown as number, pref_pay_period: "hour", pref_provinces: ["Alberta"] });
  assert.equal(p.minPay, 28.5);
  assert.deepEqual(p.extraProvinces, ["Alberta"]);
  assert.equal(p.practice, null);
});

test("the field roles tick adds every field role for an optician, and not for an optometrist", async () => {
  const { FIELD_ROLES } = await import("./jobs.ts");
  const optician = cleanPrefs({ openToField: true, otherRoles: ["Optometrist", "Patient care or reception"] }, "Optician");
  assert.deepEqual(optician.row.pref_other_roles, ["Patient care or reception", ...FIELD_ROLES]);
  assert.deepEqual(cleanPrefs({ openToField: false, otherRoles: [...FIELD_ROLES] }, "Optician").row.pref_other_roles, []);
  assert.deepEqual(cleanPrefs({ openToField: true }, "Optometrist").row.pref_other_roles, []);
});

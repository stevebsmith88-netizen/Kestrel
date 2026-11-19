// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { registerLink, surnameOf, cleanLicence, doesSummary, licenceComplete, licenceProvinces, licenceRequiredFor, licenceSummary, registerAdvice, registerFor } from "./licence.ts";

test("opticians are not asked in the territories, optometrists are asked everywhere", () => {
  assert.ok(!licenceProvinces("Optician").some((p) => ["Yukon", "Northwest Territories", "Nunavut"].includes(p)));
  assert.ok(licenceProvinces("Optometrist").includes("Yukon"));
  assert.equal(registerFor("Optician", "Yukon"), null);
  assert.equal(registerFor("Optometrist", "Ontario")?.kind, "number");
  assert.equal(registerFor("Optician", "Alberta")?.kind, "name");
});

test("a number keeps its leading zero and is checked for shape", () => {
  const ok = cleanLicence("Optician", { province: "Alberta", number: " 02723 ", does: ["contact_lenses", "eyeglasses", "nonsense"], notYet: "" });
  assert.deepEqual(ok.licence, { province: "Alberta", number: "02723", does: ["eyeglasses", "contact_lenses"], notYet: false });
  assert.ok(cleanLicence("Optician", { province: "Alberta", number: "<script>", does: [], notYet: "" }).errors?.licenceNumber);
  assert.ok(cleanLicence("Optician", { province: "Alberta", number: "", does: [], notYet: "" }).errors?.licenceNumber, "a province with no number is a problem");
  assert.equal(cleanLicence("Optician", { province: "", number: "", does: ["eyeglasses"], notYet: "" }).licence?.number, null, "nothing entered is fine");
  assert.ok(cleanLicence("Optician", { province: "", number: "1234", does: [], notYet: "" }).errors?.licenceProvince);
  assert.ok(cleanLicence("Optician", { province: "Yukon", number: "1234", does: [], notYet: "" }).errors?.licenceProvince);
});

test("only an optician keeps the contact lens ticks, and not registered yet clears the rest", () => {
  assert.deepEqual(cleanLicence("Optometrist", { province: "Ontario", number: "0717", does: ["contact_lenses"], notYet: "" }).licence?.does, []);
  assert.deepEqual(cleanLicence("Optician", { province: "Ontario", number: "5841", does: ["eyeglasses"], notYet: "on" }).licence, { province: null, number: null, does: [], notYet: true });
  assert.deepEqual(cleanLicence(null, { province: "Ontario", number: "5841", does: [], notYet: "" }).licence, { province: null, number: null, does: [], notYet: false });
});

test("who must give a number to apply", () => {
  assert.equal(licenceRequiredFor("Optometrist", { role_category: "Optometrist", province: "Ontario" }), true);
  assert.equal(licenceRequiredFor("Optician", { role_category: "Optician", province: "Alberta" }), true);
  assert.equal(licenceRequiredFor("Optician", { role_category: "Optician", province: "Yukon" }), false, "no regulator in Yukon");
  assert.equal(licenceRequiredFor("Optometric assistant or technician", { role_category: "Optician", province: "Alberta" }), false, "only the same role is asked");
  assert.equal(licenceRequiredFor("Optician", { role_category: "Optometric assistant or technician", province: "Alberta" }), false);
});

test("complete means a number and province, or not registered yet", () => {
  assert.equal(licenceComplete({ province: "Ontario", number: "0717", does: [], notYet: false }), true);
  assert.equal(licenceComplete({ province: null, number: null, does: [], notYet: true }), true);
  assert.equal(licenceComplete({ province: "Ontario", number: null, does: [], notYet: false }), false);
  assert.equal(licenceComplete(null), false);
});

test("the wording a clinic reads says where the number is from, and the button fits the register", () => {
  assert.equal(licenceSummary("Optician", { province: "Alberta", number: "02723", does: [], notYet: false }), "02723, Alberta (College of Opticians of Alberta)");
  assert.equal(licenceSummary("Optician", { province: null, number: null, does: [], notYet: true }), "Not registered yet (says the candidate)");
  assert.equal(doesSummary({ province: "Alberta", number: "1", does: ["eyeglasses", "contact_lenses"], notYet: false }), "Eyeglasses and Contact lenses");
  assert.match(registerAdvice(registerFor("Optometrist", "Ontario")!).button, /Check this number/);
  assert.match(registerAdvice(registerFor("Optician", "Alberta")!).button, /Look this person up/);
  assert.match(registerAdvice(registerFor("Optometrist", "British Columbia")!).help, /last 2 digits/);
  assert.match(registerAdvice(registerFor("Optician", "Saskatchewan")!).button, /College's website/);
  assert.equal(registerFor("Optician", "Nova Scotia")?.url, "https://nscdo.ca/optician-directory");
  assert.equal(registerFor("Optician", "New Brunswick")?.url, "https://opticiansnb.com/find-optician/");
  assert.match(registerAdvice(registerFor("Optician", "New Brunswick")!).button, /Look this person up/);
  assert.match(registerAdvice(registerFor("Optician", "Nova Scotia")!).button, /Look this person up/);
});

test("the register button can open the register already searched for the candidate's surname", () => {
  assert.equal(surnameOf("Wayne (Manny) Smith"), "Smith");
  assert.equal(surnameOf("  Ana  Lopez-Garcia "), "Lopez-Garcia");
  assert.equal(surnameOf(null), "");
  const nb = registerFor("Optician", "New Brunswick")!;
  assert.equal(registerLink(nb, "Wayne Smith"), "https://opticiansnb.com/find-optician/?_search_by_name=Smith");
  assert.equal(registerLink(nb, "Zo\u00eb O'Brien"), "https://opticiansnb.com/find-optician/?_search_by_name=O'Brien");
  assert.equal(registerLink(nb, ""), "https://opticiansnb.com/find-optician/", "no name, no search");
  assert.equal(registerLink(registerFor("Optician", "Nova Scotia")!, "Sam Lee"), "https://nscdo.ca/optician-directory", "only registers seen to search from a link");
  assert.equal(registerLink(registerFor("Optician", "Prince Edward Island")!, "Sam Lee"), null);
});

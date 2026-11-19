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
  assert.match(registerAdvice(registerFor("Optician", "Prince Edward Island")!).button, /College's website/);
  assert.equal(registerFor("Optician", "Nova Scotia")?.url, "https://nscdo.ca/optician-directory");
  assert.equal(registerFor("Optician", "New Brunswick")?.url, "https://opticiansnb.com/find-optician/");
  assert.equal(registerFor("Optician", "Saskatchewan")?.url, "https://www.opticianry.ca/MemberRoster/MemberRoster.aspx?OrgID=SCO");
  assert.equal(registerLink(registerFor("Optician", "Saskatchewan")!, "Sam Lee"), "https://www.opticianry.ca/MemberRoster/MemberRoster.aspx?OrgID=SCO", "no link search seen, so the search page opens as it is");
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

test("a College with no online register we can find says so, and points to the College", () => {
  const nl = registerFor("Optician", "Newfoundland and Labrador")!;
  assert.match(registerAdvice(nl).help, /could not find an online register/);
  assert.match(registerAdvice(nl).button, /College's website/);
});

test("Alberta optometrists can be searched by licence number, which the register shows in full", () => {
  const ab = registerFor("Optometrist", "Alberta")!;
  assert.equal(ab.kind, "number");
  assert.equal(ab.numberShown, "full");
  assert.match(registerAdvice(ab).button, /Check this number/);
  assert.equal(registerFor("Optician", "Alberta")?.kind, "name", "the opticians register has no number box");
});

test("Nova Scotia optometrists are searched by name, show the licence number, and show no status line", () => {
  const ns = registerFor("Optometrist", "Nova Scotia")!;
  assert.equal(ns.url, "https://nsco.ca/site/findanoptometrist");
  assert.equal(ns.kind, "name");
  assert.match(registerAdvice(ns).help, /shows no status line/);
  assert.doesNotMatch(registerAdvice(registerFor("Optician", "Alberta")!).help, /no status line/);
});

test("New Brunswick optometrists are a directory with a code beside each name and no status line", () => {
  const nb = registerFor("Optometrist", "New Brunswick")!;
  assert.equal(nb.url, "https://www.nbao.ca/en/find-an-optometrist");
  assert.match(registerAdvice(nb).button, /Look this person up/);
  assert.match(registerAdvice(nb).help, /code in brackets/);
  assert.match(registerAdvice(registerFor("Optometrist", "Nova Scotia")!).help, /licence number matches/);
});

test("the Manitoba optometrists directory opens already searched for the surname, and says it is only a patient directory", () => {
  const mb = registerFor("Optometrist", "Manitoba")!;
  assert.equal(registerLink(mb, "Robert Lecker"), "https://optometrists.mb.ca/about/find-optometrist?name=Lecker");
  assert.match(registerAdvice(mb).button, /directory/);
  assert.match(registerAdvice(mb).help, /patient directory/);
});

test("the Saskatchewan optometrists page is only a patient directory, like Manitoba's", () => {
  const sk = registerFor("Optometrist", "Saskatchewan")!;
  assert.equal(sk.directoryOnly, true);
  assert.match(registerAdvice(sk).help, /patient directory/);
  assert.equal(registerLink(sk, "Rhea Anderson"), "https://optometrists.sk.ca/about/find-a-member/", "no link search seen, so the page opens as it is");
});

test("the Newfoundland and Labrador optometrists page is a public list of names and licence numbers", () => {
  const nl = registerFor("Optometrist", "Newfoundland and Labrador")!;
  assert.equal(nl.url, "https://nlco.ca/members_list/");
  assert.match(registerAdvice(nl).button, /on the list/);
  assert.match(registerAdvice(nl).help, /lists every registered optometrist/);
  assert.equal(cleanLicence("Optometrist", { province: "Newfoundland and Labrador", number: "2106-A", does: [], notYet: "" }).licence?.number, "2106-A", "the College's own format is accepted");
});

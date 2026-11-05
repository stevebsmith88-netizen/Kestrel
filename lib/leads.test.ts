// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { describeDropped, jsonFromAnswer, normaliseLeads, sourceOf, validateLead } from "./leads.ts";

const lead = (over: Record<string, unknown> = {}) => ({
  clinic_name: "Insight Optometry", city: "Halifax", province: "Nova Scotia", website: "https://insightoptometry.com/pages/careers",
  careers_url: "https://insightoptometry.com/pages/careers", job_title: "Licensed Dispensing Optician", role_category: "Optician",
  employment_type: "Full time", posted_text: "Posted 3 days ago", pay_as_written: "", source_url: "https://insightoptometry.com/pages/careers",
  practice_type: "independent", note: "", ...over,
});

test("a lead keeps what the page says and fills nothing in", () => {
  const { leads, dropped } = normaliseLeads({ leads: [lead({ posted_text: "", pay_as_written: "" })] }, "Nova Scotia");
  assert.equal(dropped, 0);
  assert.equal(leads[0].website, "https://insightoptometry.com", "the website is the home page");
  assert.equal(leads[0].postedText, "");
  assert.equal(leads[0].payAsWritten, "");
  assert.equal(leads[0].source, "own_site");
  assert.equal(leads[0].roleCategory, "Optician");
});

test("leads that name Indeed, LinkedIn, Jobs4ECPs, a college, a social network or Eye Recommend are dropped", () => {
  const bad = [
    lead({ clinic_name: "A", website: "https://a.ca", source_url: "https://ca.indeed.com/viewjob?jk=1" }),
    lead({ clinic_name: "B", website: "https://b.ca", source_url: "https://www.linkedin.com/jobs/view/1" }),
    lead({ clinic_name: "C", website: "https://c.ca", careers_url: "https://jobs4ecps.com/job/1" }),
    lead({ clinic_name: "D", website: "https://collegeoptom.on.ca" }),
    lead({ clinic_name: "E", website: "https://www.facebook.com/eclinic" }),
    lead({ clinic_name: "F", website: "https://f.ca", note: "Member of Eye Recommend" }),
    lead({ clinic_name: "G", website: "" }),
    lead({ clinic_name: "H", website: "https://www.workopolis.com/company/h" }),
    lead({ clinic_name: "I", website: "https://i.bamboohr.com/careers" }),
  ];
  const { leads, dropped } = normaliseLeads({ leads: bad }, "Ontario");
  assert.equal(leads.length, 0);
  assert.equal(dropped, bad.length);
});

test("a board result is kept as a lead when the clinic's own website is known, and is marked as a board lead", () => {
  const { leads } = normaliseLeads({ leads: [lead({ source_url: "https://www.workopolis.com/jobsearch/viewjob/1", careers_url: "https://www.workopolis.com/jobsearch/viewjob/1", website: "https://miller-optometry.ca/" })] }, "Nova Scotia");
  assert.equal(leads.length, 1);
  assert.equal(leads[0].source, "job_board");
  assert.equal(leads[0].careersUrl, "", "a board page is never offered to the reader");
  assert.equal(leads[0].website, "https://miller-optometry.ca");
});

test("the same clinic appears once, and unknown values are cleared", () => {
  const { leads } = normaliseLeads({ leads: [lead(), lead({ job_title: "Second job", website: "https://www.insightoptometry.com" }), lead({ clinic_name: "X", website: "https://x.ca", role_category: "Wizard", practice_type: "huge", province: "Atlantis" })] }, "Nova Scotia");
  assert.equal(leads.length, 2);
  assert.equal(leads[1].roleCategory, "");
  assert.equal(leads[1].practiceType, "");
  assert.equal(leads[1].province, "Nova Scotia");
  assert.equal(leads[1].locationConfirmed, false, "an unknown province is marked as unconfirmed");
  assert.equal(leads[0].locationConfirmed, true);
});

test("the answer can have words around its JSON, and nonsense gives nothing", () => {
  assert.deepEqual(jsonFromAnswer('Here you go:\n{"leads":[]}\nDone.'), { leads: [] });
  assert.equal(jsonFromAnswer("no json here"), null);
  assert.equal(jsonFromAnswer("{broken"), null);
  assert.deepEqual(normaliseLeads(null, "Ontario"), { leads: [], dropped: 0, reasons: { noWebsite: 0, neverSource: 0, duplicate: 0, otherProvince: 0 } });
  assert.equal(sourceOf("https://harbourside.bamboohr.com/careers"), "hiring_system");
});

test("an email is only saved with the page it was published on", () => {
  const ok = { clinicName: "Insight", website: "https://insightoptometry.com", province: "Nova Scotia", contactEmail: "info@insightoptometry.com", emailSourceUrl: "https://insightoptometry.com/pages/contact-us" };
  assert.deepEqual(validateLead(ok), {});
  assert.ok(validateLead({ ...ok, emailSourceUrl: "" }).contactEmail);
  assert.ok(validateLead({ ...ok, contactEmail: "nope" }).contactEmail);
  assert.deepEqual(validateLead({ ...ok, contactEmail: "", emailSourceUrl: "" }), {});
  assert.ok(validateLead({ ...ok, website: "" }).website);
});

test("a job in another province is left out of the search, with the reason counted", () => {
  const { leads, dropped, reasons } = normaliseLeads({ leads: [
    lead(),
    lead({ clinic_name: "Alberta Eyes", website: "https://albertaeyes.ca", province: "Alberta", city: "Calgary" }),
    lead({ clinic_name: "Toronto Optical", website: "https://torontooptical.ca", province: "Ontario", city: "Toronto" }),
    lead({ clinic_name: "No site", website: "" }),
  ] }, "Nova Scotia");
  assert.deepEqual(leads.map((l) => l.clinicName), ["Insight Optometry"]);
  assert.equal(dropped, 3);
  assert.deepEqual(reasons, { noWebsite: 1, neverSource: 0, duplicate: 0, otherProvince: 2 });
  assert.equal(describeDropped(reasons), "Left out: 2 in other provinces, 1 with no website for the clinic.");
  assert.equal(describeDropped({ noWebsite: 0, neverSource: 0, duplicate: 0, otherProvince: 0 }), "");
});

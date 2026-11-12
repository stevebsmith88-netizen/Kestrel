// Run with: npm test
// Made up resumes in a few different styles. The reader only suggests, so what matters is that it gets the common layouts right and says nothing
// when it is not sure.
import assert from "node:assert/strict";
import { test } from "node:test";
import { monthsOfWork, readResume, yearsBand } from "./resume-reader.ts";

const NOW = new Date("2026-11-12T12:00:00Z");

const OPTICIAN = `Jordan Lee
Licensed Optician
Toronto, ON M5V 2T6 | 416.555.0199 | jordan.lee@example.com

SUMMARY
Dispensing optician with a focus on progressive lenses and frame styling.

WORK EXPERIENCE
Licensed Optician, Riverside Optical, Toronto, ON
Mar 2019 - Present
- Fitted frames and lenses, took measurements and handled insurance claims in Visual Eyes.

Optical Assistant, Northgate Eyecare, Mississauga, ON
2016 - 2019
- Helped patients choose frames.

EDUCATION
Opticianry Diploma, Seneca College, 2014 - 2016

LICENSURE
Registered with the College of Opticians of Ontario`;

const ASSISTANT = `AMIR PATEL
Calgary, Alberta
(403) 555 0142

Optometric Assistant
Experience
Optometric Assistant | Bow River Vision | Jan 2021 – Dec 2024
Pre-testing, visual fields and OCT, working alongside optometrists and the front desk team.
Education
Ophthalmic Assistant Program, SAIT, 2019 - 2020
Skills
Pretesting, Optos, RevolutionEHR`;

const OPTOMETRIST = `Dr. Sam Okafor, OD
Vancouver, BC | 604-555-0111

Associate Optometrist
Doctor of Optometry, University of Waterloo, 2012 - 2016

Experience
Associate Optometrist, Harbour Eye Clinic, Vancouver, BC
06/2017 - Present

Registration
Licensed to practise in British Columbia and Alberta`;

const RECEPTION = `Priya Raman
Ottawa, ON
613 555 0188
Front Desk Receptionist
Experience
Front Desk Receptionist, Parkdale Optometry
Feb 2026 - Present
Booked appointments and greeted patients.`;

test("an optician resume gives the role, town, phone, years, registration and software", () => {
  const r = readResume(OPTICIAN, NOW);
  assert.equal(r.profession?.value, "Optician");
  assert.deepEqual(r.home?.value, { city: "Toronto", province: "Ontario" });
  assert.equal(r.phone?.value, "(416) 555-0199");
  assert.equal(r.yearsExperience?.value, "10 or more years");
  assert.deepEqual(r.licensedProvinces?.value, ["Ontario"]);
  assert.deepEqual(r.software?.value, ["Visual Eyes"]);
});

test("an assistant who works beside optometrists is read as an assistant, and the education years are not counted", () => {
  const r = readResume(ASSISTANT, NOW);
  assert.equal(r.profession?.value, "Optometric assistant or technician");
  assert.equal(r.yearsExperience?.value, "1 to 4 years");
  assert.deepEqual(r.home?.value, { city: "Calgary", province: "Alberta" });
  assert.equal(r.phone?.value, "(403) 555-0142");
  assert.deepEqual(r.software?.value, ["RevolutionEHR"]);
  assert.equal(r.licensedProvinces, undefined);
});

test("an optometrist resume with numeric dates and a registration line", () => {
  const r = readResume(OPTOMETRIST, NOW);
  assert.equal(r.profession?.value, "Optometrist");
  assert.equal(r.yearsExperience?.value, "5 to 9 years");
  assert.deepEqual(r.licensedProvinces?.value, ["British Columbia", "Alberta"]);
  assert.deepEqual(r.home?.value, { city: "Vancouver", province: "British Columbia" });
  assert.equal(r.phone?.value, "(604) 555-0111");
});

test("a reception resume with under a year of work", () => {
  const r = readResume(RECEPTION, NOW);
  assert.equal(r.profession?.value, "Patient care or reception");
  assert.equal(r.yearsExperience?.value, "Under 1 year");
  assert.deepEqual(r.home?.value, { city: "Ottawa", province: "Ontario" });
});

test("nothing is suggested from an empty or unrelated document", () => {
  assert.deepEqual(readResume("", NOW), {});
  assert.deepEqual(readResume("Recipe for soup\nTake 2 onions and a pot.", NOW), {});
});

test("overlapping jobs are not counted twice, and a future end date stops at today", () => {
  const all = ["Experience", "Optician, A Optical", "Jan 2020 - Dec 2022", "Optician, B Optical", "Jan 2022 - Dec 2024", "Optician, C", "2025 - 2035"];
  const { months } = monthsOfWork(all, NOW);
  // Jan 2020 to Dec 2024 is 59 months, then Jan 2025 to Nov 2026 adds 22 more
  assert.equal(months, 81);
});

test("the years bands match the profile's choices", () => {
  assert.equal(yearsBand(6), "Under 1 year");
  assert.equal(yearsBand(12), "1 to 4 years");
  assert.equal(yearsBand(59), "1 to 4 years");
  assert.equal(yearsBand(60), "5 to 9 years");
  assert.equal(yearsBand(120), "10 or more years");
});

test("a mention of optometrists in an assistant's duties does not make them an optometrist", () => {
  const r = readResume("Eye care assistant\nExperience\nEye care assistant, City Eye\n2022 - 2025\nAssisted optometrists and optometrists in training with patient flow.", NOW);
  assert.equal(r.profession?.value, "Optometric assistant or technician");
});

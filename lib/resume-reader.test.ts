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

// ---- Steve's samples (13th November 2026, audit P1-59) ----
// 5 resume templates from online resume builders, in different styles, written out the way a PDF reader hands over the text (columns side by
// side come out mixed together). Names, emails and phone numbers are changed. They are United States resumes outside eye care, so the right
// answer is no role and no town, but the dates and phone number should still be found.

// Photo top left, name and email on 1 line, a skills grid, then the job history under a small label.
const SAMPLE_PHOTO_BANNER = `MORGAN HALE morgan.hale@example.com
Marketing Manager (512) 555-0101
77 Serial Drive, Austin, TX 78705, United States
Experienced and energetic Marketing Manager with over seven years of experience effectively managing marketing projects from conception to completion.
Adept in using digital marketing platforms to increase sales and overall company productivity.
Skills
Excellent Communication Skills Project Management Skills Creativity and Problem Solving
Digital Marketing Industry Trends & Sales Forecasting
Employment History
Marketing Manager at Zane Telecommunications, Austin
November 2011 — August 2019
• Designed and implemented direct mail campaigns, resulting in a 10% sales increase per quarter.`;

// Labels in a left column, a date of birth in the header (never used), and dates with abbreviated months.
const SAMPLE_LEFT_LABELS = `Financial Analyst Market Street 1, Washington 1021, The USA
example@example.com
(412) 555-0102
JORDAN REYES
Nationality Date / Place Of Birth Driving License
American 12.12.1999 / Los Angeles B
PROFESSIONAL
SUMMARY
Experienced and driven Financial Analyst with an impressive background of managing multi-million dollar budgets.
Skills
Financial Analysis Trend Analysis Team Leadership
EMPLOYMENT
HISTORY
Financial Analyst at GEO Corp., New York
Oct 2012 — Jul 2017`;

// A dark banner with email, address and phone on 1 line (with a stray double comma), 2 jobs, and dates in the education section.
const SAMPLE_DARK_BANNER = `Casey Banks
DRIVER
casey.banks@example.com 4200 W Latham Street, , Phoenix, AZ 85009, United States (602) 555-0103
Profile
Experienced and reliable Driver with vast experience working in the transportation of goods and passengers.
Employment History
Driver, Albert's Trucking Company, Phoenix
April 2013 — August 2019
• Performed vehicle inspections and maintenance prior to trips.
Driver, Bears Transportation, Phoenix
September 2009 — March 2013
• Reached 700k accident free miles.
Education
Class B Commercial Driver's License, Phoenix Driving School, Phoenix
August 2005
High School Diploma, Moris High School, Morris
September 2005 — June 2009
Skills
Hand-Eye Coordination Safe Driving Skills
References`;

// A skills sidebar on the right: its heading comes out in the middle of the job history. Overlapping jobs, and an address in capitals.
const SAMPLE_SIDEBAR = `Riley Stone, Marketing Manager SKILLS
77 SERIAL DRIVE, AUSTIN, TX 78705, UNITED STATES · riley.stone@example.com · (512) 555-0104 Excellent
PROFILE Communication Skills
Experienced and energetic Marketing Manager with over seven years of experience. Project Management
EMPLOYMENT HISTORY
Marketing Manager, Zane Telecommunications Digital Marketing
Nov 2011 — Aug 2019, Austin
SKILLS
Industry Trends & Sales Forecasting
Online Marketing Consultant, Freelance
Aug 2009 — Jun 2017, Telecommute
Sales and Marketing Director, Bee Hive Printing
Oct 2009 — Oct 2011, Dallas
EDUCATION
Harvard College, Master of Marketing
Aug 2009 — Aug 2012, Cambridge
• Winner of the 2004 Hackley Fellowship.`;

// Numbered headings with circled numbers, and 2 jobs side by side, so the second job's end year drops onto the next line.
const SAMPLE_NUMBERED = `JACK
FARRELL
Warehouse Worker
800 Butterfly lane, New York, NY (718) 555-0105
10012, United States jack.farrell@example.com
① PROFILE
Experienced and dedicated Warehouse Worker with over six years of industry experience.
② SKILLS ③ LANGUAGES
Knowledge of Warehouse Operations Spanish
④ EMPLOYMENT HISTORY
Warehouse Worker Warehouse Worker
Plastix, New York Croy Packaging Facility, New York
October 2015 — September 2019 September 2013 — September
2015
• Completed production orders within strict deadlines. • Followed all instructions and safety procedures during assembly.`;

test("Steve's samples: the phone number is found on every layout", () => {
  const phones = [SAMPLE_PHOTO_BANNER, SAMPLE_LEFT_LABELS, SAMPLE_DARK_BANNER, SAMPLE_SIDEBAR, SAMPLE_NUMBERED].map((t) => readResume(t, NOW).phone?.value);
  assert.deepEqual(phones, ["(512) 555-0101", "(412) 555-0102", "(602) 555-0103", "(512) 555-0104", "(718) 555-0105"]);
});

test("Steve's samples: no eye care role and no Canadian town is invented", () => {
  for (const t of [SAMPLE_PHOTO_BANNER, SAMPLE_LEFT_LABELS, SAMPLE_DARK_BANNER, SAMPLE_SIDEBAR, SAMPLE_NUMBERED]) {
    const r = readResume(t, NOW);
    assert.equal(r.profession, undefined, `no role from: ${t.split("\n")[0]}`);
    assert.equal(r.home, undefined, `no town from: ${t.split("\n")[0]}`);
    assert.equal(r.licensedProvinces, undefined);
  }
});

test("Steve's samples: a date of birth is never counted as work", () => {
  assert.equal(readResume(SAMPLE_LEFT_LABELS, NOW).yearsExperience?.value, "1 to 4 years"); // Oct 2012 to Jul 2017, under 5 years
  assert.match(readResume(SAMPLE_LEFT_LABELS, NOW).yearsExperience?.why ?? "", /1 job/);
});

test("Steve's samples: years are added up on each layout", () => {
  assert.equal(readResume(SAMPLE_PHOTO_BANNER, NOW).yearsExperience?.value, "5 to 9 years"); // about 8 years
  const driver = readResume(SAMPLE_DARK_BANNER, NOW).yearsExperience;
  assert.equal(driver?.value, "5 to 9 years"); // September 2009 to August 2019; the school years do not count
  assert.match(driver?.why ?? "", /2 jobs/);
});

test("a skills sidebar heading in the middle of the job history does not cut off the jobs after it", () => {
  const r = readResume(SAMPLE_SIDEBAR, NOW).yearsExperience;
  assert.match(r?.why ?? "", /3 jobs/);
  assert.equal(r?.value, "10 or more years"); // August 2009 to August 2019, overlaps counted once; the degree does not count
});

test("numbered headings are recognised, and a date split over 2 lines is joined", () => {
  const { months, counted } = monthsOfWork(SAMPLE_NUMBERED.split("\n"), NOW);
  assert.equal(counted, 2);
  assert.equal(months, 71); // September 2013 to September 2019, counted month to month as everywhere else (about 6 years)
  assert.equal(readResume(SAMPLE_NUMBERED, NOW).yearsExperience?.value, "5 to 9 years");
});

test("a Canadian address in capitals is still found, and a trailing country is ignored", () => {
  const r = readResume(`SAM DOYLE\n77 MAIN STREET, KELOWNA, BC V1Y 1A1, CANADA · sam@example.com · (250) 555-0106\nOptician`, NOW);
  assert.deepEqual(r.home?.value, { city: "Kelowna", province: "British Columbia" });
});

// ---- Steve's second batch (13th November 2026): 5 real optician resumes, run here and not kept. These copy their layouts with made up details ----

test("a heading that joins 2 sections with AND still starts the education section, so school years are not counted as work", () => {
  const text = `Name: Sample Person
PROFESSIONAL EXPERIENCE
Licensed optician in Sample Optical Dec 2025-May2026
Managing Optician in Sample Store Sep 2024 –Aug 2025
                           Education AND ACCOMPLISHMENT:
Graduated optician program, Seneca College March 2009 –Oct 2012
Master Degree of Chemical Engineering 2004 -2008`;
  const r = readResume(text, NOW).yearsExperience;
  assert.match(r?.why ?? "", /2 jobs/);
  assert.equal(r?.value, "1 to 4 years");
});

test("an address written province first, with a label and a unit, still gives the town", () => {
  const r = readResume(`Name:                  Sample Person
Address:             10 Sample way, unit 1210, Ontario. Toronto, M2N7L4
Cell Phone:          416 555 0107
Licensed optician`, NOW);
  assert.deepEqual(r.home?.value, { city: "Toronto", province: "Ontario" });
});

test("the years in words never contradict the band", () => {
  // 9 years and 7 months of work
  const r = readResume(`Experience\nRegistered Optician, Sample Eye Care\nMarch 2017 - October 2026`, NOW).yearsExperience;
  assert.equal(r?.value, "5 to 9 years");
  assert.match(r?.why ?? "", /about 9 years/);
});

test("a layout with no address suggests no town, and a licence line with no province suggests no province", () => {
  const r = readResume(`SAMPLE PERSON\nPhone: 647 555 0108\nEmail: sample@example.com\nSummary\nFinished the opticianry diploma\nExperience\nLicenced Optician\nSample Optical 2019 - 2023`, NOW);
  assert.equal(r.profession?.value, "Optician");
  assert.equal(r.home, undefined);
  assert.equal(r.licensedProvinces, undefined);
});

test("a month touching its year is read, and a word ending in a month's letters is not", () => {
  assert.equal(monthsOfWork(["Optician, Sample Optical Dec 2025-May2026"], NOW).months, 5);
  assert.equal(monthsOfWork(["Optician, Sample Optical June 2020-July2024"], NOW).months, 49);
  // "Grammar 2019 - 2020" has no month: the range is the whole of 2019 to the end of 2020
  assert.equal(monthsOfWork(["Grammar 2019 - 2020"], NOW).months, 23);
});

test("a university's name is not read as the province of registration, and a new bullet is not read as the rest of the line", () => {
  const text = `SAMPLE PERSON\nOptician\nEDUCATION\n• Registered Optician, Seneca College, Toronto, Canada\n• Sales & Marketing Management, University of British Columbia, Vancouver, Canada`;
  assert.equal(readResume(text, NOW).licensedProvinces, undefined);
  const wrapped = readResume(`Optician\nRegistered with the College of\nOpticians of Ontario`, NOW);
  assert.deepEqual(wrapped.licensedProvinces?.value, ["Ontario"]);
  assert.equal(readResume(`Optician\nLicensed optician, graduate of the University of Alberta`, NOW).licensedProvinces, undefined);
});

// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { tidyTitle } from "./job-title.ts";

test("all capitals become title case, with small words in lower case", () => {
  assert.equal(tidyTitle("LICENSED OPTICIAN"), "Licensed Optician");
  assert.equal(tidyTitle("ASSISTANT AND RECEPTIONIST"), "Assistant and Receptionist");
  assert.equal(tidyTitle("DIRECTOR OF OPERATIONS"), "Director of Operations");
});

test("all lowercase gets capitals too", () => {
  assert.equal(tidyTitle("optometric assistant"), "Optometric Assistant");
});

test("a title that mixes cases is left as the clinic wrote it", () => {
  assert.equal(tidyTitle("Associate Optometrist in Established LC"), "Associate Optometrist in Established LC");
  assert.equal(tidyTitle("optician (Full-time) needed"), "optician (Full-time) needed");
});

test("eye care abbreviations stay in capitals and hyphens and brackets get capitals", () => {
  assert.equal(tidyTitle("ASSOCIATE OD - FULL-TIME"), "Associate OD - Full-Time");
  assert.equal(tidyTitle("OPTICIAN (PART TIME)"), "Optician (Part Time)");
  assert.equal(tidyTitle("CL FITTER"), "CL Fitter");
});

test("a word like ON inside a title is not turned into a province code", () => {
  assert.equal(tidyTitle("OPTICIAN ON CALL"), "Optician on Call");
});

test("the first word is always capitalised and spaces are tidied", () => {
  assert.equal(tidyTitle("  THE  BEST OPTICIAN "), "The Best Optician");
  assert.equal(tidyTitle(""), "");
});

import { suggestTitle } from "./job-title.ts";

test("a title is suggested from the role, the type of work and a single specialty", () => {
  assert.equal(suggestTitle({ role: "Optician", employmentType: "Full time" }), "Optician, Full time");
  assert.equal(suggestTitle({ role: "Optometric assistant or technician", employmentType: "Part time" }), "Optometric Assistant, Part time");
  assert.equal(suggestTitle({ role: "Optometrist", employmentType: "Locum" }), "Locum Optometrist");
  assert.equal(suggestTitle({ role: "Optometrist", employmentType: "Full time", specialties: ["Myopia control and ortho-k"] }), "Myopia Control Optometrist, Full time");
  assert.equal(suggestTitle({ role: "Optometrist", specialties: ["Dry eye and IPL", "Myopia control and ortho-k"] }), "Optometrist", "2 specialties add nothing");
  assert.equal(suggestTitle({ role: "Practice or clinic manager", employmentType: "Contract" }), "Practice Manager", "fixed term adds nothing");
  assert.equal(suggestTitle({ role: "" }), "");
});

test("an optometrist title is never suggested for another role, whatever is ticked", () => {
  const roles = ["Optician", "Optometric assistant or technician", "Practice or clinic manager", "Patient care or reception", "Vision therapist", "Sales or territory representative", "Trainer or clinical educator", "Field service or equipment technician", "Account or practice development manager"];
  for (const role of roles) {
    for (const employmentType of ["Full time", "Part time", "Locum", "Contract", ""]) {
      const title = suggestTitle({ role, employmentType, specialties: ["Dry eye and IPL", "Vision therapy"] });
      assert.ok(!/optometrist/i.test(title), `${role} gave ${title}`);
    }
  }
});

test("a suggested title never carries a town, pay or the clinic's name", () => {
  const title = suggestTitle({ role: "Optician", employmentType: "Full time" });
  assert.ok(!/\$|toronto|ontario|riverside/i.test(title));
});

import { levelFromTitle, levelsForRole } from "./job-title.ts";
import { cleanJob, validateJob } from "./jobs.ts";

test("a level word goes in front, and Associate is for optometrists only", () => {
  assert.equal(suggestTitle({ role: "Optician", employmentType: "Full time", level: "Lead" }), "Lead Optician, Full time");
  assert.equal(suggestTitle({ role: "Optometrist", level: "Associate", specialties: ["Dry eye and IPL"] }), "Associate Dry Eye Optometrist");
  assert.equal(suggestTitle({ role: "Optician", level: "Associate" }), "Optician", "Associate is ignored for an optician");
  assert.equal(suggestTitle({ role: "Optometrist", employmentType: "Locum", level: "Senior" }), "Locum Senior Optometrist");
  assert.deepEqual([...levelsForRole("Optician")], ["Lead", "Senior"]);
  assert.deepEqual([...levelsForRole("Optometrist")], ["Lead", "Senior", "Associate"]);
  assert.deepEqual([...levelsForRole("")], []);
});

test("a saved title tells the form which level it carries", () => {
  assert.equal(levelFromTitle("Lead Optician, Full time"), "Lead");
  assert.equal(levelFromTitle("Locum Senior Optometrist"), "Senior");
  assert.equal(levelFromTitle("Optician, Full time"), "");
  assert.equal(levelFromTitle(""), "");
});

test("once a role is chosen the server sets the title, whatever was typed", () => {
  const job = cleanJob({ title: "OPTOMETRIST WANTED!!", roleCategory: "Optician", employmentType: "Full time", titleLevel: "Lead" });
  assert.equal(job.title, "Lead Optician, Full time");
  assert.equal(job.titleLevel, "Lead");
  // A typed optometrist title cannot be put on another role's post.
  const sneaky = cleanJob({ title: "Optometrist", roleCategory: "Optometric assistant or technician", employmentType: "Part time" });
  assert.equal(sneaky.title, "Optometric Assistant, Part time");
  // A level that does not fit the role is dropped.
  assert.equal(cleanJob({ roleCategory: "Optician", titleLevel: "Associate" }).titleLevel, "");
});

test("a draft with no role yet keeps what was typed, and a submit still needs a title", () => {
  assert.equal(cleanJob({ title: "LICENSED OPTICIAN" }).title, "Licensed Optician");
  const empty = cleanJob({});
  assert.equal(validateJob(empty, false).title, "Choose a role and the job title is set for you.");
});

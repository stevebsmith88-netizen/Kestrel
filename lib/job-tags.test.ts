// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { jobFromForm } from "./job-form.ts";
import { EQUIPMENT_TAGS, SOFTWARE_TAGS, SPECIALTY_TAGS, cleanTagFilters, cleanTags, hasTagFilters, jobMatchesTags, tagLine, tagsFromRow } from "./job-tags.ts";
import { cleanPrefs, prefsFromProfile } from "./candidate-prefs.ts";

test("the lists are the ones Steve gave on 9th November 2026", () => {
  assert.deepEqual([...SOFTWARE_TAGS], ["Visual Eyes", "RevolutionEHR", "Wink", "Acuitas", "eVision", "iFile", "OD Office Pro", "Optosys"]);
  assert.deepEqual([...EQUIPMENT_TAGS], ["Optos", "OCT", "Humphrey visual field", "Topographer", "Retinal photographs"]);
  assert.deepEqual([...SPECIALTY_TAGS], ["Dry eye and IPL", "Myopia control and ortho-k", "Vision therapy", "On-site edging lab"]);
});

test("only names on the list get through, once each, in list order", () => {
  assert.deepEqual(cleanTags(["Optosys", "Wink", "Wink", "Epic", "<b>x</b>", ""], SOFTWARE_TAGS), ["Wink", "Optosys"]);
  assert.deepEqual(cleanTags("Wink", SOFTWARE_TAGS), ["Wink"]);
  assert.deepEqual(cleanTags(undefined, SOFTWARE_TAGS), []);
  assert.deepEqual(cleanTags([1, null, {}], SOFTWARE_TAGS), []);
});

test("tags tick on the form and are saved on the job", () => {
  const form = new FormData();
  form.set("title", "Optometrist");
  form.append("tagsSoftware", "Wink");
  form.append("tagsSoftware", "Not a real product");
  form.append("tagsEquipment", "Optos");
  form.append("tagsEquipment", "OCT");
  form.append("tagsSpecialties", "Dry eye and IPL");
  const { row, errors } = jobFromForm(form, false);
  assert.deepEqual(errors, {});
  assert.deepEqual(row.tags_software, ["Wink"]);
  assert.deepEqual(row.tags_equipment, ["Optos", "OCT"]);
  assert.deepEqual(row.tags_specialties, ["Dry eye and IPL"]);
  const none = new FormData();
  none.set("title", "x");
  assert.deepEqual(jobFromForm(none, false).row.tags_software, []);
});

test("the job card line shows up to 3 names, then how many more", () => {
  const t = (software: string[], equipment: string[] = [], specialties: string[] = []) => ({ software, equipment, specialties });
  assert.equal(tagLine(t([])), "");
  assert.equal(tagLine(t(["Wink"], ["Optos"])), "Wink, Optos");
  assert.equal(tagLine(t(["Wink", "Acuitas"], ["Optos"], ["Vision therapy"])), "Wink, Acuitas, Optos and 1 more");
  assert.equal(tagLine(t(["Wink", "Acuitas"], ["Optos", "OCT"], ["Vision therapy"])), "Wink, Acuitas, Optos and 2 more");
  assert.deepEqual(tagsFromRow({ tags_software: ["Wink", "Junk"], tags_equipment: null }), { software: ["Wink"], equipment: [], specialties: [] });
  assert.deepEqual(tagsFromRow(null), { software: [], equipment: [], specialties: [] });
});

test("search filters: any ticked item in a group, every ticked group must match", () => {
  const job = { software: ["Wink"], equipment: ["Optos", "OCT"], specialties: [] };
  const f = (raw: Record<string, string | string[]>) => cleanTagFilters(raw);
  assert.equal(jobMatchesTags(job, f({})), true);
  assert.equal(jobMatchesTags(job, f({ software: ["Wink", "Acuitas"] })), true, "any of the group");
  assert.equal(jobMatchesTags(job, f({ software: "Acuitas" })), false);
  assert.equal(jobMatchesTags(job, f({ software: "Wink", equipment: "OCT" })), true, "both groups match");
  assert.equal(jobMatchesTags(job, f({ software: "Wink", specialty: "Vision therapy" })), false, "one group does not match");
  assert.deepEqual(f({ software: ["Wink", "Nope"], specialty: "Dry eye and IPL" }), { software: ["Wink"], equipment: [], specialties: ["Dry eye and IPL"] });
  assert.equal(hasTagFilters(f({})), false);
  assert.equal(hasTagFilters(f({ equipment: "Optos" })), true);
});

test("candidate software skills: only listed names, and they reach the matching rules", () => {
  const { row } = cleanPrefs({ softwareSkills: ["Wink", "Epic", "Wink", "Acuitas"] }, "Optometrist");
  assert.deepEqual(row.software_skills, ["Wink", "Acuitas"]);
  assert.deepEqual(cleanPrefs({}, "Optometrist").row.software_skills, []);
  assert.deepEqual(prefsFromProfile({ profession: "Optometrist", licensed_provinces: [], software_skills: ["Wink"] }).software, ["Wink"]);
  assert.deepEqual(prefsFromProfile(null).software, []);
});

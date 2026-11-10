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

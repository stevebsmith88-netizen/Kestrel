// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCandidateRows, isDemoAccountEmail, searchCandidates } from "./admin-candidates.ts";

test("demo and test accounts are recognised, real people are not", () => {
  assert.equal(isDemoAccountEmail("kestrel+democandidate@eyecarejobs.ca"), true);
  assert.equal(isDemoAccountEmail("Kestrel+DemoClinic@eyecarejobs.ca"), true);
  assert.equal(isDemoAccountEmail("demo.person@example.com"), true);
  assert.equal(isDemoAccountEmail("anna.demorest@example.com"), false);
  assert.equal(isDemoAccountEmail("sam@demo.example.com"), false);
  assert.equal(isDemoAccountEmail("kestrel+candidate@eyecarejobs.ca"), true);
  assert.equal(isDemoAccountEmail("steve@eyecarejobs.ca"), true);
  assert.equal(isDemoAccountEmail("sam@eyecarejobs.ca.example.com"), false);
  assert.equal(isDemoAccountEmail("sam@gmail.com"), false);
  assert.equal(isDemoAccountEmail(null), false);
});

test("the list leaves out demo accounts, newest first, with place, resume and application counts", () => {
  const rows = buildCandidateRows({
    profiles: [
      { id: "a", full_name: "Ana Reid", created_at: "2026-11-02T10:00:00Z" },
      { id: "b", full_name: "Demo Candidate", created_at: "2026-11-03T10:00:00Z" },
      { id: "c", full_name: "", created_at: "2026-11-05T10:00:00Z" },
    ],
    emails: new Map([["a", "ana@example.com"], ["b", "kestrel+democandidate@eyecarejobs.ca"], ["c", "c@example.com"]]),
    candidateProfiles: [{ user_id: "a", profession: "Optician", home_city: "Guelph", home_province: "Ontario", cv_path: "x.pdf" }],
    applications: [{ candidate_id: "a" }, { candidate_id: "a" }],
  });
  assert.deepEqual(rows.map((r) => r.id), ["c", "a"]);
  assert.equal(rows[0].name, "Name not given");
  assert.equal(rows[1].place, "Guelph, Ontario");
  assert.equal(rows[1].hasResume, true);
  assert.equal(rows[1].applications, 2);
  assert.equal(searchCandidates(rows, "guelph").length, 1);
  assert.equal(searchCandidates(rows, "ANA@").length, 1);
  assert.equal(searchCandidates(rows, "").length, 2);
});

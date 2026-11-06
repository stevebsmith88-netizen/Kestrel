// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { recommend, type MatchJob, type Prefs } from "./recommend.ts";

const NOW = new Date("2026-11-06T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const job = (over: Partial<MatchJob> & { id: string }): MatchJob => ({
  role_category: "Optician",
  employment_type: "Full time",
  province: "Ontario",
  city: "Toronto",
  pay_period: "hour",
  pay_min: 28,
  pay_max: 34,
  posted_at: daysAgo(3),
  employers: { practice_type: "independent" },
  ...over,
});

const prefs = (over: Partial<Prefs> = {}): Prefs => ({
  profession: "Optician",
  otherRoles: [],
  licensedProvinces: ["Ontario"],
  homeCity: "Toronto",
  homeProvince: "Ontario",
  radiusKm: 25,
  extraProvinces: [],
  employmentTypes: [],
  minPay: null,
  payPeriod: null,
  practice: null,
  ...over,
});

const ids = (jobs: MatchJob[], p: Prefs, opts = {}) => recommend(p, jobs, { now: NOW, ...opts }).map((r) => r.job.id);

test("with no role chosen there is nothing to recommend", () => {
  assert.deepEqual(ids([job({ id: "a" })], prefs({ profession: null })), []);
});

test("only the role they chose, and the other roles they would consider, are suggested", () => {
  const jobs = [job({ id: "optician" }), job({ id: "assistant", role_category: "Optometric assistant or technician" }), job({ id: "optom", role_category: "Optometrist" })];
  assert.deepEqual(ids(jobs, prefs()), ["optician"]);
  assert.deepEqual(new Set(ids(jobs, prefs({ otherRoles: ["Optometric assistant or technician"] }))), new Set(["optician", "assistant"]));
});

test("a job outside the distance is left out, and one in a province they would work in is kept", () => {
  const jobs = [job({ id: "toronto" }), job({ id: "mississauga", city: "Mississauga" }), job({ id: "ottawa", city: "Ottawa" }), job({ id: "calgary", city: "Calgary", province: "Alberta" })];
  assert.deepEqual(new Set(ids(jobs, prefs())), new Set(["toronto", "mississauga"]));
  assert.deepEqual(new Set(ids(jobs, prefs({ extraProvinces: ["Alberta"] }))), new Set(["toronto", "mississauga", "calgary"]));
});

test("a nearer job ranks above a farther one, and says how far", () => {
  const out = recommend(prefs({ radiusKm: 50 }), [job({ id: "far", city: "Mississauga" }), job({ id: "here", city: "Toronto" })], { now: NOW });
  assert.equal(out[0].job.id, "here");
  assert.ok(out[0].reasons.includes("In Toronto"));
  assert.ok(out[1].reasons.some((r) => /km from Toronto/.test(r)), out[1].reasons.join("|"));
});

test("someone moving: no home town, a province they would work in", () => {
  const moving = prefs({ homeCity: null, homeProvince: null, licensedProvinces: [], extraProvinces: ["Alberta"] });
  const jobs = [job({ id: "toronto" }), job({ id: "calgary", city: "Calgary", province: "Alberta" })];
  assert.deepEqual(ids(jobs, moving), ["calgary"]);
});

test("with no place and no provinces chosen, the provinces they are registered in stand in", () => {
  const bare = prefs({ homeCity: null, homeProvince: null, licensedProvinces: ["Ontario"] });
  const jobs = [job({ id: "toronto" }), job({ id: "calgary", city: "Calgary", province: "Alberta" })];
  assert.deepEqual(ids(jobs, bare), ["toronto"]);
  assert.deepEqual(new Set(ids(jobs, prefs({ homeCity: null, homeProvince: null, licensedProvinces: [] }))), new Set(["toronto", "calgary"]));
});

test("employment type and practice type are hard filters when chosen", () => {
  const jobs = [job({ id: "ft" }), job({ id: "pt", employment_type: "Part time" }), job({ id: "corp", employers: { practice_type: "corporate" } })];
  assert.deepEqual(new Set(ids(jobs, prefs({ employmentTypes: ["Part time"] }))), new Set(["pt"]));
  assert.deepEqual(new Set(ids(jobs, prefs({ practice: "corporate" }))), new Set(["corp"]));
});

test("pay: a job that cannot reach their minimum is left out, hourly and yearly are compared fairly, and higher pay ranks higher", () => {
  const low = job({ id: "low", pay_min: 20, pay_max: 24 });
  const mid = job({ id: "mid", pay_min: 26, pay_max: 30 });
  const high = job({ id: "high", pay_min: 32, pay_max: 36 });
  const yearly = job({ id: "yearly", pay_period: "year", pay_min: 70000, pay_max: 80000 });
  const p = prefs({ minPay: 30, payPeriod: "hour" });
  assert.ok(!ids([low, mid, high, yearly], p).includes("low"));
  assert.ok(ids([low, mid, high, yearly], p).includes("yearly"), "70,000 to 80,000 a year is about 33.65 to 38.46 an hour");
  const order = ids([mid, high], p);
  assert.deepEqual(order, ["high", "mid"]);
  assert.ok(recommend(p, [mid], { now: NOW })[0].reasons.includes("The top of the pay range meets your minimum"));
  assert.ok(recommend(p, [high], { now: NOW })[0].reasons.includes("Pay starts at or above your minimum"));
});

test("jobs already applied to or hidden do not come back", () => {
  const jobs = [job({ id: "a" }), job({ id: "b" }), job({ id: "c" })];
  assert.deepEqual(new Set(ids(jobs, prefs(), { hidden: new Set(["a"]), applied: new Set(["b"]) })), new Set(["c"]));
});

test("newer jobs get a small lift, and each suggestion carries its reasons", () => {
  const out = recommend(prefs(), [job({ id: "old", posted_at: daysAgo(30) }), job({ id: "new", posted_at: daysAgo(2) })], { now: NOW });
  assert.equal(out[0].job.id, "new");
  assert.ok(out[0].reasons.includes("Posted this week"));
  assert.ok(out[0].reasons.includes("Optician role"));
  assert.ok(out[0].reasons.includes("You are registered in Ontario"));
});

test("the list is capped, and the same input always gives the same list", () => {
  const many = Array.from({ length: 20 }, (_, i) => job({ id: `j${i}`, posted_at: daysAgo(i) }));
  assert.equal(recommend(prefs(), many, { now: NOW, max: 5 }).length, 5);
  assert.deepEqual(ids(many, prefs()), ids(many, prefs()));
  assert.equal(recommend(prefs(), many, { now: NOW }).length, 8);
});

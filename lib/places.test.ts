// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { distanceKm, findPlace, largerTowns, nearbyKeys, norm, placeKey } from "./places.ts";

test("places are found by name, ignoring accents, full stops and capitals", () => {
  assert.equal(findPlace("toronto")?.province, "Ontario");
  assert.equal(findPlace("Montreal")?.province, "Quebec");
  assert.equal(findPlace("st. john's")?.province, "Newfoundland and Labrador");
  assert.equal(findPlace("Saint John")?.province, "New Brunswick");
  assert.equal(findPlace("Victoria, BC")?.province, "British Columbia");
  assert.equal(findPlace("nowhereville"), null);
  assert.equal(findPlace(""), null);
});

test("with a province given, the match stays in that province, otherwise the biggest place wins", () => {
  assert.equal(findPlace("Victoria")?.province, "British Columbia");
  assert.equal(findPlace("Victoria", "Newfoundland and Labrador")?.province, "Newfoundland and Labrador");
  assert.equal(findPlace("Victoria", "Ontario"), null);
});

test("distances are close to the real ones", () => {
  const toronto = findPlace("Toronto")!;
  const ottawa = findPlace("Ottawa")!;
  const km = distanceKm(toronto, ottawa);
  assert.ok(km > 340 && km < 365, `Toronto to Ottawa was ${km}`);
});

test("the radius includes close places and leaves out far ones", () => {
  const toronto = findPlace("Toronto")!;
  const within50 = nearbyKeys(toronto, 50);
  assert.ok(within50.has(placeKey("Mississauga", "Ontario")));
  assert.ok(within50.has(placeKey("Markham", "Ontario")));
  assert.ok(within50.has(placeKey("North York", "Ontario")), "a district of Toronto counts as Toronto");
  assert.ok(!within50.has(placeKey("Hamilton", "Ontario")));
  assert.ok(!within50.has(placeKey("Ottawa", "Ontario")));
  assert.ok(nearbyKeys(toronto, 10).size < within50.size);
  assert.ok(nearbyKeys(toronto, 10).has(placeKey("Toronto", "Ontario")));
});

test("the same city name in another province is a different place", () => {
  const victoriaBc = findPlace("Victoria", "British Columbia")!;
  assert.ok(!nearbyKeys(victoriaBc, 50).has(placeKey("Victoria", "Newfoundland and Labrador")));
  assert.equal(norm("Québec City"), "quebec city");
});

test("the larger towns of a province come biggest first, once each, and only those with enough people", () => {
  const towns = largerTowns("Nova Scotia");
  assert.equal(towns[0], "Halifax");
  assert.ok(towns.length >= 4 && towns.length <= 8);
  assert.equal(new Set(towns).size, towns.length);
  assert.ok(largerTowns("Nunavut").length <= 8);
  assert.deepEqual(largerTowns("Atlantis"), []);
  assert.ok(largerTowns("Ontario", 3).length === 3);
});

// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAINTENANCE_HTML, maintenanceOn } from "./maintenance.ts";

test("the switch is on only when MAINTENANCE_MODE is yes", () => {
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: "yes" }), true);
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: " YES " }), true);
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: "no" }), false);
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: "" }), false);
  assert.equal(maintenanceOn({}), false);
});

test("the back soon page is plain and does not use dashes as punctuation", () => {
  assert.ok(!/—|–/.test(MAINTENANCE_HTML));
  assert.match(MAINTENANCE_HTML, /The Kestrel team/);
});

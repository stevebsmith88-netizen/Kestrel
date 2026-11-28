// Run with: npm test
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { test } from "node:test";
import { adminMenuHrefs, buildAdminMenu, totalWaiting } from "./admin-menu.ts";

test("every admin page is in the menu", () => {
  const pages = readdirSync("app/admin", { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(`app/admin/${d.name}/page.tsx`))
    .map((d) => `/admin/${d.name}`);
  const listed = adminMenuHrefs();
  for (const page of pages) assert.ok(listed.includes(page), `${page} is not in lib/admin-menu.ts`);
  assert.ok(listed.includes("/admin"));
});

test("badges count what is waiting, and the Dashboard shows the total", () => {
  const counts = { review: 3, support: 2, claims: 1, reports: 0 };
  assert.equal(totalWaiting(counts), 6);
  const menu = buildAdminMenu(counts);
  assert.equal(menu.dashboard.badge, 6);
  assert.equal(menu.groups[0].items.find((i) => i.label === "Review queue")?.badge, 3);
  assert.equal(menu.groups[0].badge, 3);
  assert.equal(menu.groups[1].badge, 3);
  assert.equal(buildAdminMenu().dashboard.badge, 0);
});

test("the waitlist hides once sign up has opened", () => {
  const before = buildAdminMenu(undefined, false).groups[1].items.map((i) => i.label);
  const after = buildAdminMenu(undefined, true).groups[1].items.map((i) => i.label);
  assert.ok(before.includes("Waitlist"));
  assert.ok(!after.includes("Waitlist"));
  assert.ok(after.includes("Support"));
});

test("Support is the name for help requests", () => {
  assert.ok(adminMenuHrefs().includes("/admin/requests"));
  assert.ok(buildAdminMenu().groups[1].items.some((i) => i.href === "/admin/requests" && i.label === "Support"));
});

// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { EXPORT_PROBLEMS, exportCheck } from "./export-check.ts";

// P1-49: the data download asks for the password first, as delete does. Someone who signs in with Google types their email address.

test("a password account must give a password, which is then checked", () => {
  assert.equal(exportCheck({ hasPassword: true, email: "ann@example.com", password: "" }), "missing-password");
  assert.equal(exportCheck({ hasPassword: true, email: "ann@example.com", password: "secret" }), "check-password");
});

test("a Google account must type its own email address", () => {
  assert.equal(exportCheck({ hasPassword: false, email: "ann@example.com", confirmEmail: "" }), "wrong-email");
  assert.equal(exportCheck({ hasPassword: false, email: "ann@example.com", confirmEmail: "bo@example.com" }), "wrong-email");
  assert.equal(exportCheck({ hasPassword: false, email: "Ann@Example.com", confirmEmail: " ann@example.com " }), "ok");
});

test("every problem has a plain message", () => {
  for (const key of ["missing-password", "wrong-password", "wrong-email"] as const) assert.ok(EXPORT_PROBLEMS[key].length > 10);
});

test("the download route only hands over the file after a POST that passes the check", () => {
  const source = readFileSync(new URL("../app/account/export/route.ts", import.meta.url), "utf8");
  assert.match(source, /export async function POST\(/);
  const get = source.slice(source.indexOf("export async function GET("));
  assert.ok(source.includes("export async function GET("));
  assert.doesNotMatch(get.slice(0, get.indexOf("\n}\n")), /supabaseAdmin|JSON\.stringify/, "GET never builds the file");
  assert.match(source, /exportCheck\(/);
  assert.match(source, /signInWithPassword/);
});

test("the account page asks for the password or email in a form that posts to the download", () => {
  const view = readFileSync(new URL("../components/AccountView.tsx", import.meta.url), "utf8");
  assert.match(view, /<form method="post" action="\/account\/export"/);
  assert.doesNotMatch(view, /<a href="\/account\/export"/);
});

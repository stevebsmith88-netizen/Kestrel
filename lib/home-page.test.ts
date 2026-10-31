// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// A wording edit once removed the numbers box and the waitlist form from the home page without any error. This keeps the
// parts the home page cannot lose.
test("the home page keeps its waitlist form, its join anchor, the numbers box and the 2 cards", () => {
  const page = readFileSync("app/page.tsx", "utf8");
  for (const needed of ['id="join"', "<WaitlistForm />", "<EyeCareNumbers />", 'className="split"', "For clinics", "For eye care professionals", "Join the waitlist", "homeBlogOn()"]) {
    assert.ok(page.includes(needed), `app/page.tsx has lost: ${needed}`);
  }
  assert.equal(page.split("<article").length - 1, 2, "the home page should have 2 cards");
});

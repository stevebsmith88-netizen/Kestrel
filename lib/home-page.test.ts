// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// A wording edit once removed the numbers box and the waitlist form from the home page without any error. This keeps the
// parts the home page cannot lose.
test("the home page keeps its waitlist form, its join anchor, the numbers box and the 2 cards", () => {
  const page = readFileSync("app/page.tsx", "utf8") + readFileSync("components/HomeBelowHero.tsx", "utf8");
  for (const needed of ['id="join"', "<WaitlistForm />", "<EyeCareNumbers />", 'className="split"', "For clinics", "For eye care professionals", "Join the waitlist", "homeBlogOn()"]) {
    assert.ok(page.includes(needed), `the home page has lost: ${needed}`);
  }
  assert.equal(page.split("<article").length - 1, 2, "the home page should have 2 cards");
});

test("every version of the home page outputs the Organization and WebSite data (P1-11)", async () => {
  const { organizationJson } = await import("./organization-data.ts");
  const data = JSON.parse(organizationJson());
  assert.deepEqual(data["@graph"].map((n: { "@type": string }) => n["@type"]), ["Organization", "WebSite"]);
  const page = readFileSync("app/page.tsx", "utf8");
  const home = page.slice(page.indexOf("export default async function Home"), page.indexOf("function ComingSoon"));
  assert.ok(home.includes('type="application/ld+json"') && home.includes("organizationJson()"), "the Home function must output the data itself, so the launch, pre launch and coming soon pages all carry it");
  assert.equal(page.split("application/ld+json").length - 1, 1, "the data should be output in 1 place only");
});

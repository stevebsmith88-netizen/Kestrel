// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { firstProblem } from "../components/focus-problem.ts";

// A stand in for a form: it answers each selector with the element we set for it.
const form = (answers: Record<string, string | null>) =>
  ({ querySelector: (selector: string) => (answers[selector] ?? null) as unknown as Element | null }) as unknown as Pick<ParentNode, "querySelector">;

test("a field marked invalid is the first place to go", () => {
  const f = form({ '[aria-invalid="true"]': "field", ".invalid input, .invalid select, .invalid textarea": "row", ".form-err": "message" });
  assert.equal(firstProblem(f) as unknown, "field");
});

test("without one, the first control inside an invalid row, then the form message", () => {
  assert.equal(firstProblem(form({ ".invalid input, .invalid select, .invalid textarea": "row", ".form-err": "message" })) as unknown, "row");
  assert.equal(firstProblem(form({ ".form-err": "message" })) as unknown, "message");
});

test("nothing to focus when nothing is wrong", () => {
  assert.equal(firstProblem(form({})), null);
});

// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileBadge } from "./file-badge.ts";

test("a PDF resume shows PDF, a Word resume shows DOC (D-09)", () => {
  assert.equal(fileBadge("Jane Smith resume.pdf"), "PDF");
  assert.equal(fileBadge("RESUME.PDF "), "PDF");
  assert.equal(fileBadge("resume.docx"), "DOC");
  assert.equal(fileBadge("resume.doc"), "DOC");
});

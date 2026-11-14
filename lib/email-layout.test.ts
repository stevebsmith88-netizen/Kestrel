// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { emailLayout, previewText } from "./email-layout.ts";

test("every email gets a preview line from its first real sentence", () => {
  assert.equal(previewText(["Hi Sam,", "Priya invited you to Northgate Eye Care."]), "Priya invited you to Northgate Eye Care.");
  const long = previewText(["We have approved your Optician job, and candidates can see it on Kestrel now. It stays up until the 14th of December."]);
  assert.ok(long.length <= 113 && long.endsWith("..."), long);
  assert.equal(previewText([]), "");
});

test("the preview is hidden in the email, can be set by hand, and the sign off shows once", () => {
  const { html, text } = emailLayout({ heading: "Your job is live", paragraphs: ["Good news, it is live.", "The Kestrel team"], preview: "Live now" });
  assert.match(html, /display:none[^>]*>Live now/);
  assert.equal(html.match(/The Kestrel team/g)?.length, 1);
  assert.equal(text.match(/The Kestrel team/g)?.length, 1);
});

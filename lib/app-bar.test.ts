// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// The envelope and its unread count must be in view on a phone too, beside the Menu button (P1-38). AppBar needs a signed in page to
// render, so this checks the markup and the style rules that put it there.
test("the envelope with its count sits beside the Menu button on a phone", () => {
  const bar = readFileSync("components/AppBar.tsx", "utf8");
  const narrow = bar.slice(bar.indexOf('className="topbar-narrow"'), bar.indexOf("</details>"));
  assert.ok(narrow.includes("{envelope}"), "the narrow group must hold the envelope");
  assert.ok(narrow.indexOf("{envelope}") < narrow.indexOf("<details"), "the envelope comes before the Menu button");
  assert.ok(bar.includes("`Inbox, ${unread} unread`"), "the count is in the accessible name");
  assert.equal(bar.split("{envelope}").length - 1, 2, "once for wide screens, once for phones");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /@media \(max-width:700px\)\{\.topbar-narrow\{display:flex\}\}/);
  assert.match(css, /\.inboxlink\{[^}]*width:44px;height:44px/, "keeps the 44 pixel tap size");
});

// Run with: npm test
// Keeps the site free of plain underlined links that stand on a line of their own, which look like old fashioned hyperlinks (Steve, November 2026).
// A link that is the only thing on its line is either a button (class "btn"), a quiet action, or a navigation link styled by its container.
// Links inside a sentence are fine and keep a thin underline. This is a simple check on the page code, not a full proof: it catches the common
// slip of writing <p><Link href="...">Words</Link></p> with no class. A mailto link is allowed, since an email address is read as one.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return name.endsWith(".tsx") ? [path] : [];
  });

// <p> or <p className="help"> and so on, holding one link with no class and nothing else.
const ALONE = /^<p(?: className="(?:help|small-note|readmore|stripmore|alt)")?>\s*<(Link|a)\s([^>]*)>[^<]*<\/\1>\s*<\/p>$/;

test("a link that stands alone on its line is a button or a styled navigation link, never a plain underlined one", () => {
  const found: string[] = [];
  for (const path of [...files("app"), ...files("components")]) {
    readFileSync(path, "utf8").split("\n").forEach((line, i) => {
      const m = ALONE.exec(line.trim());
      if (!m) return;
      const attrs = m[2];
      if (/className=/.test(attrs) || /href="mailto:/.test(attrs)) return;
      // The sign in pages' small "alt" links are styled as navigation links by their container (.alt a in app/globals.css).
      if (/className="alt"/.test(line)) return;
      found.push(`${path}:${i + 1}: ${line.trim().slice(0, 110)}`);
    });
  }
  assert.deepEqual(found, [], "Give these a button class (btn sm ghost) or style them through their container");
});

// Steve's rule (12th November 2026): links, titles and menu options highlight on hover with a soft box and a thin ring, like the footer. An
// underline on hover is not used. Links inside a sentence keep their thin underline all the time, from the base link rule, so they need no hover rule.

test("no style rule underlines a link only on hover", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const found = css.split("\n").filter((line) => /:hover[^{]*\{[^}]*text-decoration:\s*underline/.test(line) || /:focus-visible[^{]*\{[^}]*text-decoration:\s*underline/.test(line));
  assert.deepEqual(found, [], "Use the box highlight, not an underline:\n" + found.join("\n"));
});

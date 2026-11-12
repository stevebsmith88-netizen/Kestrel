// Run with: npm test
// Steve's rule (November 2026): Kestrel says "resume", never "CV". Code names such as cv_path, CvCard and the /cv routes stay as they are, since
// they are not read by anyone, so this only looks for the capital word CV. The help search keeps a lower case "cv" keyword on purpose.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

test("no public wording says CV", () => {
  const found: string[] = [];
  for (const dir of ["app", "components", "content", "lib"]) {
    for (const file of walk(dir)) {
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (/\bCVs?\b/.test(line)) found.push(`${file}:${i + 1}: ${line.trim().slice(0, 90)}`);
      });
    }
  }
  assert.deepEqual(found, [], "Say resume, not CV:\n" + found.join("\n"));
});

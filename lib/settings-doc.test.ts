// Run with: npm test
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// P1-18: every setting the code reads has a row in docs/settings.md, and every setting that is not secret is in .env.example.
const root = new URL("..", import.meta.url).pathname;

function files(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(join(root, path)).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

const used = new Set<string>();
for (const file of [...files("app"), ...files("lib"), ...files("components"), "proxy.ts"]) {
  for (const m of readFileSync(join(root, file), "utf8").matchAll(/(?:process\.)?env\.([A-Z][A-Z0-9_]{2,})/g)) used.add(m[1]);
}

test("every setting the code reads is in docs/settings.md", () => {
  assert.ok(existsSync(join(root, "docs/settings.md")));
  const doc = readFileSync(join(root, "docs/settings.md"), "utf8");
  const missing = [...used].filter((name) => !doc.includes(`\`${name}\``));
  assert.deepEqual(missing, []);
});

test(".env.example lists every setting the table marks as not secret, and no secret has a real value", () => {
  const doc = readFileSync(join(root, "docs/settings.md"), "utf8");
  const example = readFileSync(join(root, ".env.example"), "utf8");
  const rows = doc.split("\n").filter((line) => /^\| `[A-Z_0-9]+` \|.*\| (No|No \(.*\)|\*\*Yes\*\*) \|$/.test(line));
  assert.ok(rows.length > 20, "the table has rows");
  for (const row of rows) {
    const name = row.match(/^\| `([A-Z_0-9]+)`/)![1];
    assert.match(example, new RegExp(`^#? ?${name}=`, "m"), `${name} is in .env.example`);
  }
});

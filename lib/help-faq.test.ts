// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { HELP } from "../content/help.ts";
import { parseInline } from "./blog.ts";
import { helpFaqJsonLd } from "./help.ts";

// Audit P1-52 (a): /help carries FAQPage data built from content/help.ts, so search engines and AI assistants can read the questions
// and answers. Google expects it to match the page, so every question is a topic title and every answer is that topic's visible text.
const plain = (s: string) => parseInline(s).map((p) => p.text).join("");

test("every help topic is a question, with the answer exactly as the page shows it", () => {
  const data = helpFaqJsonLd(HELP) as { "@type": string; mainEntity: { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[] };
  assert.equal(data["@type"], "FAQPage");
  const topics = HELP.flatMap((s) => s.topics);
  assert.equal(data.mainEntity.length, topics.length);
  data.mainEntity.forEach((q, i) => {
    const t = topics[i];
    assert.equal(q["@type"], "Question");
    assert.equal(q.name, t.title);
    assert.equal(q.acceptedAnswer["@type"], "Answer");
    // Exactly the paragraphs and numbered steps the page shows, as plain text. Nothing else: the keywords are for the search box only.
    const shown = [...t.answer.map(plain), ...(t.steps ?? []).map((step, n) => `${n + 1}. ${plain(step)}`)].join("\n");
    assert.equal(q.acceptedAnswer.text, shown, `${t.id}: the answer does not match the page`);
    assert.doesNotMatch(q.acceptedAnswer.text, /\*\*|\]\(/);
  });
});

test("the help page puts the FAQ data on the page", () => {
  const page = readFileSync("app/help/page.tsx", "utf8");
  assert.match(page, /helpFaqJsonLd\(HELP\)/);
  assert.match(page, /application\/ld\+json/);
});

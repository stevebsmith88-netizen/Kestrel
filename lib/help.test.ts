// Run with: npm test
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { HELP } from "../content/help.ts";
import { HELP_DESCRIPTION, HELP_OPEN_BY_DEFAULT, HELP_SECTION_ORDER, HELP_TITLE, helpIds, linkedHelpIds, searchWords, topicHaystack, topicMatches, topicText } from "./help.ts";
import { parseInline } from "./blog.ts";

const allText = HELP.flatMap((s) => [s.title, s.intro, ...s.topics.flatMap(topicText)]);

test("the page title and description fit search results", () => {
  assert.ok(HELP_TITLE.length <= 60, `title is ${HELP_TITLE.length} characters`);
  assert.ok(HELP_DESCRIPTION.length >= 70 && HELP_DESCRIPTION.length <= 160, `description is ${HELP_DESCRIPTION.length} characters`);
  assert.ok(!/[–—]/.test(`${HELP_TITLE} ${HELP_DESCRIPTION}`));
});

test("sections come in the agreed order, and every id is unique and link safe", () => {
  const order = HELP.map((s) => s.id);
  assert.deepEqual(order, [...HELP_SECTION_ORDER], "sections must be General, Candidates, Clinics, in that order");
  const ids = helpIds(HELP);
  assert.equal(new Set(ids).size, ids.length, "duplicate id");
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  for (const s of HELP) assert.ok(s.topics.length > 0, `${s.id} has no topics`);
});

test("every topic has an answer, and the text follows the house style", () => {
  for (const s of HELP) {
    for (const t of s.topics) {
      assert.ok(t.title.trim().length > 0 && t.answer.length > 0 && t.answer.every((p) => p.trim().length > 0), `${t.id} needs a title and an answer`);
      if (t.steps) assert.ok(t.steps.length > 0 && t.steps.every((p) => p.trim().length > 0), `${t.id} has an empty step`);
    }
  }
  for (const text of allText) {
    assert.ok(!/[–—]/.test(text), `uses a dash as punctuation: ${text.slice(0, 60)}`);
    assert.ok(!/\S[ \t]+-[ \t]+\S/.test(text), `uses a hyphen as punctuation: ${text.slice(0, 60)}`);
    assert.ok(!/[‘’“”]/.test(text), `has curly quotes: ${text.slice(0, 60)}`);
  }
});

test("there are no prices, because checkout is not built yet", () => {
  for (const text of allText) assert.ok(!/\$\s?\d/.test(text.replace(/\$50,000|\$200,000/g, "")), `a dollar amount other than the pay range rule: ${text.slice(0, 60)}`);
});

test("every link to another topic points at a topic that exists", () => {
  const ids = new Set(helpIds(HELP));
  for (const text of allText) for (const id of linkedHelpIds(text)) assert.ok(ids.has(id), `links to /help#${id}, which does not exist`);
});

function pageExists(href: string): boolean {
  const path = href.split("#")[0].split("?")[0].replace(/^\//, "");
  if (path === "") return true;
  const segments = path.split("/");
  // Walk app/ allowing a dynamic folder such as [id] for any segment.
  const walk = (dir: string, rest: string[]): boolean => {
    if (rest.length === 0) return existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "route.ts"));
    const [head, ...tail] = rest;
    if (existsSync(join(dir, head)) && statSync(join(dir, head)).isDirectory() && walk(join(dir, head), tail)) return true;
    return readdirSync(dir).some((name) => /^\[.+\]$/.test(name) && statSync(join(dir, name)).isDirectory() && walk(join(dir, name), tail));
  };
  return walk("app", segments);
}

test("every link and button goes to a page that exists, and only safe links are used", () => {
  for (const s of HELP) {
    for (const t of s.topics) {
      for (const l of t.links ?? []) {
        assert.ok(l.href.startsWith("/") && !l.href.startsWith("//"), `${t.id}: ${l.href} should be a page on this site`);
        assert.ok(pageExists(l.href), `${t.id}: ${l.href} is not a page`);
      }
      for (const text of [...t.answer, ...(t.steps ?? [])]) {
        for (const part of parseInline(text)) {
          if (part.type !== "link") continue;
          assert.ok(part.href.startsWith("/") || part.href.startsWith("https://"), `${t.id}: unsafe link ${part.href}`);
          if (part.href.startsWith("/")) assert.ok(pageExists(part.href), `${t.id}: ${part.href} is not a page`);
        }
      }
    }
  }
});

// ---------------------------------------------------------------- search

const found = (query: string) => HELP.flatMap((s) => s.topics).filter((t) => topicMatches(query, topicHaystack(t))).map((t) => t.id);

test("search ignores capitals, accents, punctuation and plurals, and matches the start of words", () => {
  assert.deepEqual(searchWords("Resumé, CVs!"), ["resume", "cv"]);
  assert.ok(topicMatches("ALERTS", "Set up a job alert"));
  assert.ok(topicMatches("short", "Shortlisted applicants"));
  assert.ok(!topicMatches("cv", "Recommended for you"), "a short word must not match the middle of another word");
  assert.ok(!topicMatches("withdraw payroll", "How do I withdraw"), "every word typed has to match");
  assert.ok(topicMatches("   ", "anything"), "an empty search shows everything");
});

test("every topic can be found by its own title, and by each of its keywords", () => {
  for (const s of HELP) {
    for (const t of s.topics) {
      assert.ok(found(t.title).includes(t.id), `${t.id} is not found by its own title`);
      for (const k of t.keywords ?? []) assert.ok(found(k).includes(t.id), `${t.id} is not found by its keyword "${k}"`);
    }
  }
});

test("keywords are plain lower case words, with no dashes or markup", () => {
  for (const s of HELP) {
    for (const t of s.topics) {
      assert.ok((t.keywords ?? []).length > 0, `${t.id} has no keywords`);
      for (const k of t.keywords ?? []) {
        assert.equal(k, k.toLowerCase(), `${t.id}: keyword "${k}" should be lower case`);
        assert.match(k, /^[a-z0-9 ]+$/, `${t.id}: keyword "${k}" should be plain words`);
      }
    }
  }
});

test("the words people really type find the right topic", () => {
  const expect: Record<string, string> = {
    "forgot password": "sign-in-and-password",
    "resume": "profile-and-cv",
    "cancel application": "withdraw-an-application",
    "delete account": "delete-or-download",
    "unsubscribe": "email-choices",
    "quebec": "provinces-and-quebec",
    "shortlist several": "bulk-actions-on-applicants",
    "salary": "why-pay-is-shown",
    "hourly": "pay-options-by-role",
    "scam": "report-a-job",
    "renew": "extend-close-fill-and-post-again",
    "template": "job-templates",
    "analytics": "views-and-apply-clicks",
    "credit card": "is-it-free",
    "near me": "search-and-filter-jobs",
  };
  for (const [query, id] of Object.entries(expect)) assert.ok(found(query).includes(id), `"${query}" should find ${id}`);
  assert.deepEqual(found("zzzz nothing"), []);
});

test("only General starts open, and every section that starts open really exists", () => {
  assert.deepEqual([...HELP_OPEN_BY_DEFAULT], ["general"]);
  for (const id of HELP_OPEN_BY_DEFAULT) assert.ok(HELP.some((s) => s.id === id), `${id} is not a section`);
});

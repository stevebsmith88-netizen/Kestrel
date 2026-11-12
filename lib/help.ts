// The help centre at /help: what a topic looks like, and small helpers the page and the tests share. The words live in content/help.ts.
import { parseInline } from "./blog.ts";

export type HelpLink = { label: string; href: string };

export type HelpTopic = {
  id: string; // the link to this topic, for example "post-a-job" gives /help#post-a-job. Lower case letters, numbers and hyphens.
  title: string;
  answer: string[]; // short paragraphs. [text](/path) makes a link and **text** makes bold text, as in the blog.
  steps?: string[]; // optional numbered steps, in the order a person sees them
  links?: HelpLink[]; // optional buttons to the real page where the thing is done
  keywords?: string[]; // optional extra words people use for this (resume, cancel, forgot). Only the search reads them; they are never shown.
};

export type HelpSectionId = "general" | "candidates" | "clinics";

export type HelpSection = { id: HelpSectionId; title: string; intro: string; topics: HelpTopic[] };

export const HELP_SECTION_ORDER: readonly HelpSectionId[] = ["general", "candidates", "clinics"];

// The sections that start open, so the page does not look bare. Every topic inside still starts closed (Steve, 10th November 2026).
export const HELP_OPEN_BY_DEFAULT: readonly HelpSectionId[] = ["general"];

export const HELP_TITLE = "Help centre for candidates and clinics";
export const HELP_DESCRIPTION = "Step by step answers for candidates and clinics using Kestrel Eye Care Jobs: accounts, applying, posting, applicants, pay, privacy and how to reach us.";

// Every id a link can point at: the 3 sections and every topic.
export function helpIds(sections: readonly HelpSection[]): string[] {
  return sections.flatMap((s) => [s.id, ...s.topics.map((t) => t.id)]);
}

// The topic ids that a piece of help text links to, for example "[claim it](/help#claim-a-listing)" gives "claim-a-listing".
export function linkedHelpIds(text: string): string[] {
  return [...text.matchAll(/\]\(\/help#([A-Za-z0-9_-]+)\)/g)].map((m) => m[1]);
}

// Every piece of text a topic holds, so the tests can check them all the same way.
export function topicText(topic: HelpTopic): string[] {
  return [topic.title, ...topic.answer, ...(topic.steps ?? []), ...(topic.links ?? []).map((l) => l.label), ...(topic.keywords ?? [])];
}

// ---------------------------------------------------------------- search
// The search box on /help. Kept free of the page so the rules can be tested (lib/help.test.ts). A search matches a topic when every word typed
// is the start of a word in the topic's title, answer, steps or keywords. Capitals, accents and punctuation do not matter, and a plural
// matches its singular ("alerts" finds "alert").

const fold = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const stem = (word: string) => (word.length >= 3 && word.endsWith("s") ? word.slice(0, -1) : word);

export const searchWords = (text: string): string[] => fold(text).split(" ").filter(Boolean).map(stem);

export function topicMatches(query: string, haystack: string): boolean {
  const wanted = searchWords(query);
  if (wanted.length === 0) return true;
  const words = searchWords(haystack);
  return wanted.every((w) => words.some((h) => h.startsWith(w)));
}

// Everything the search can read for a topic, without the link addresses and bold marks.
export function topicHaystack(topic: HelpTopic): string {
  const plain = (t: string) => t.replace(/\]\([^)]*\)/g, "").replace(/[*[]/g, "");
  return [...topicText(topic).map(plain), ...(topic.keywords ?? [])].join(" ");
}

// When this many topics or fewer match, the search opens them so the answer is already showing.
export const SEARCH_OPEN_LIMIT = 5;

// The FAQPage structured data for /help (audit P1-52): each topic's title as the question and its visible text as the answer, in page
// order. Links and bold are turned into plain words, exactly as the page shows them, and the search keywords are left out.
export function helpFaqJsonLd(sections: readonly HelpSection[]) {
  const plain = (text: string) => parseInline(text).map((p) => p.text).join("");
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "en-CA",
    mainEntity: sections.flatMap((s) =>
      s.topics.map((t) => ({
        "@type": "Question",
        name: t.title,
        acceptedAnswer: { "@type": "Answer", text: [...t.answer.map(plain), ...(t.steps ?? []).map((step, n) => `${n + 1}. ${plain(step)}`)].join("\n") },
      })),
    ),
  };
}

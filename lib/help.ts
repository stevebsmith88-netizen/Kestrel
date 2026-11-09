// The help centre at /help: what a topic looks like, and small helpers the page and the tests share. The words live in content/help.ts.

export type HelpLink = { label: string; href: string };

export type HelpTopic = {
  id: string; // the link to this topic, for example "post-a-job" gives /help#post-a-job. Lower case letters, numbers and hyphens.
  title: string;
  answer: string[]; // short paragraphs. [text](/path) makes a link and **text** makes bold text, as in the blog.
  steps?: string[]; // optional numbered steps, in the order a person sees them
  links?: HelpLink[]; // optional buttons to the real page where the thing is done
};

export type HelpSectionId = "general" | "candidates" | "clinics";

export type HelpSection = { id: HelpSectionId; title: string; intro: string; topics: HelpTopic[] };

export const HELP_SECTION_ORDER: readonly HelpSectionId[] = ["general", "candidates", "clinics"];

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
  return [topic.title, ...topic.answer, ...(topic.steps ?? []), ...(topic.links ?? []).map((l) => l.label)];
}

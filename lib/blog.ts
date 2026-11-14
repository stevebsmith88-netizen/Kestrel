// The blog is written as plain text in content/posts.ts. This turns that text into blocks the page can show.
// Supported: a blank line between paragraphs, "## " for a heading, "- " for a bullet list,
// **bold**, and [link text](address) where the address starts with / or https://.
// Since 13th November 2026 (Steve: break up the plain structure), 3 more blocks, each separated by blank lines like a paragraph:
// - A pull quote: every line starts with "> ". A last line "> source: Name" credits someone else; without it the quote repeats a line
//   from the post, so it is hidden from screen readers (they have already read it).
// - A table: every line starts with "|". The first row is the header, the second is the "| --- | --- |" divider.
// - An image: a line "![Alt text](/images/blog/file.png)", optionally followed by a caption line. Only files listed in
//   lib/blog-images.ts can be used, so every image has its size and exists in /public.

// The topics that group posts on the blog page (Steve, 14th November 2026: the page was getting crowded). Topics, not months, because
// people search by subject; a post's address never changes when it is grouped.
export const BLOG_TOPICS = [
  { id: "careers", label: "Getting into eye care", blurb: "The roles, how to qualify for each, and where a career can lead." },
  { id: "applying", label: "Applying and interviews", blurb: "Resumes, cover letters, phone screens and interviews." },
  { id: "pay", label: "Pay", blurb: "What eye care roles pay, how offers are built, and how to ask for more." },
  { id: "clinics", label: "For clinics", blurb: "Writing job ads, hiring well and keeping good people." },
] as const;
export type BlogTopic = (typeof BLOG_TOPICS)[number]["id"];

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // 2026-10-30
  topic: BlogTopic;
  updated?: string;
  body: string;
};

export type Block =
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "p"; text: string }
  | { type: "quote"; text: string; source?: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "figure"; src: string; alt: string; caption?: string };

const cells = (line: string) => line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const DIVIDER = /^\|(\s*:?-{3,}:?\s*\|)+$/;
const IMAGE = /^!\[([^\]]+)\]\((\/images\/blog\/[a-z0-9-]+\.(?:png|jpg|webp))\)$/;

export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.trim().split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.length === 1 && lines[0].startsWith("## ")) blocks.push({ type: "h2", text: lines[0].slice(3) });
    else if (lines.every((l) => l.startsWith("> "))) {
      const text = lines.map((l) => l.slice(2).trim());
      const last = text[text.length - 1];
      const source = last.startsWith("source: ") ? last.slice(8).trim() : undefined;
      blocks.push({ type: "quote", text: (source ? text.slice(0, -1) : text).join(" "), ...(source ? { source } : {}) });
    } else if (lines.length >= 3 && lines.every((l) => l.startsWith("|")) && DIVIDER.test(lines[1].replace(/\s/g, ""))) {
      blocks.push({ type: "table", head: cells(lines[0]), rows: lines.slice(2).map(cells) });
    } else if (IMAGE.test(lines[0]) && lines.length <= 2) {
      const [, alt, src] = lines[0].match(IMAGE)!;
      blocks.push({ type: "figure", src, alt, ...(lines[1] ? { caption: lines[1] } : {}) });
    }
    else if (lines.every((l) => l.startsWith("- "))) blocks.push({ type: "ul", items: lines.map((l) => l.slice(2)) });
    else blocks.push({ type: "p", text: lines.join(" ") });
  }
  return blocks;
}

// The first image in a post, for the search engine data. Undefined when the post has none.
export function firstImage(body: string): string | undefined {
  const fig = parseBlocks(body).find((b) => b.type === "figure");
  return fig && fig.type === "figure" ? fig.src : undefined;
}

// A link is only used if it stays on this site or goes to a secure address.
export const safeHref = (href: string) => (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("https://");

export type Inline = { type: "text"; text: string } | { type: "bold"; text: string } | { type: "link"; text: string; href: string };

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  for (const piece of text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/)) {
    if (!piece) continue;
    const bold = piece.match(/^\*\*([^*]+)\*\*$/);
    const link = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (bold) parts.push({ type: "bold", text: bold[1] });
    else if (link && safeHref(link[2])) parts.push({ type: "link", text: link[1], href: link[2] });
    else parts.push({ type: "text", text: piece });
  }
  return parts;
}

export const wordCount = (body: string) => body.trim().split(/\s+/).filter(Boolean).length;
export const readingMinutes = (body: string) => Math.max(1, Math.round(wordCount(body) / 220));

// Scheduled posts. A post is shown from the start of its date in Toronto, so a post dated 13th November 2026 appears at midnight
// Eastern on the 13th. Before that it is not on the blog, the home page or the sitemap, and its own address is a 404.
// On the live site only published posts are shown. Previews and local work show scheduled ones too (marked as scheduled),
// so a post can be read and approved before its date.
export const todayInToronto = (now: Date = new Date()) => now.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });

export const isPublished = (post: { date: string }, now: Date = new Date()) => post.date <= todayInToronto(now);

export const scheduledPostsVisible = () => process.env.VERCEL_ENV !== "production";

export function visiblePosts<T extends { date: string }>(posts: T[], now: Date = new Date(), showScheduled: boolean = scheduledPostsVisible()): T[] {
  return showScheduled ? posts : posts.filter((p) => isPublished(p, now));
}

// The opening paragraph of a post as plain text, for a teaser. It stops at the end of a sentence if it can, and otherwise at a word.
export function excerpt(body: string, max = 230) {
  const first = parseBlocks(body).find((b) => b.type === "p");
  if (!first || first.type !== "p") return "";
  const plain = first.text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (sentenceEnd > max * 0.5) return cut.slice(0, sentenceEnd + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

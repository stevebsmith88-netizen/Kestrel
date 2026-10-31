// The blog is written as plain text in content/posts.ts. This turns that text into blocks the page can show.
// Supported: a blank line between paragraphs, "## " for a heading, "- " for a bullet list,
// **bold**, and [link text](address) where the address starts with / or https://.

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // 2026-10-30
  updated?: string;
  body: string;
};

export type Block = { type: "h2"; text: string } | { type: "ul"; items: string[] } | { type: "p"; text: string };

export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.trim().split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.length === 1 && lines[0].startsWith("## ")) blocks.push({ type: "h2", text: lines[0].slice(3) });
    else if (lines.every((l) => l.startsWith("- "))) blocks.push({ type: "ul", items: lines.map((l) => l.slice(2)) });
    else blocks.push({ type: "p", text: lines.join(" ") });
  }
  return blocks;
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

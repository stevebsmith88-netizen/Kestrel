import { POSTS } from "@/content/posts";
import { visiblePosts } from "@/lib/blog";
import { demoMode } from "@/lib/demo";
import { llmsText } from "@/lib/llms-text";

// A plain summary for AI assistants (lib/llms-text.ts). Rebuilt hourly so a blog post appears on its date. Never lists a scheduled post,
// even on a preview. The demo site serves nothing, as it asks every crawler to stay away.
export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export function GET() {
  if (demoMode()) return new Response("Not found", { status: 404 });
  const posts = visiblePosts(POSTS, new Date(), false);
  return new Response(llmsText(SITE, posts), { headers: { "content-type": "text/plain; charset=utf-8" } });
}

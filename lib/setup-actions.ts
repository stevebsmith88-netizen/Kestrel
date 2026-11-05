"use server";

import Anthropic from "@anthropic-ai/sdk";
import { claudeClient } from "@/lib/anthropic-client";
import { requireRole } from "@/lib/auth";
import type { JobFormState } from "@/lib/jobs";
import { SEARCH_BLOCKED_DOMAINS } from "@/lib/page-reader";
import { explainClaudeError } from "@/lib/setup-check";

const MODEL = process.env.PAGE_READER_MODEL || "claude-sonnet-5-5";

// The Setup check's test buttons (admin only). Each sends one tiny request to Claude, so a few thousandths of a cent, and says
// plainly whether it worked. The second also tries web search, which costs about 1 cent.
export async function testClaude(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: "There is no ANTHROPIC_API_KEY on this copy of the site. Add it in Vercel for Production and redeploy without the build cache." };
  const withSearch = form.get("which") === "search";
  try {
    const client = claudeClient(key, { timeout: 60_000, maxRetries: 0 });
    const response = await client.messages.create(
      withSearch
        ? ({ model: MODEL, max_tokens: 600, tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 1, blocked_domains: SEARCH_BLOCKED_DOMAINS }], messages: [{ role: "user", content: "Use web search once to find the home page of Specsavers Canada. Reply with just its web address." }] } as never)
        : { model: MODEL, max_tokens: 100, messages: [{ role: "user", content: "Reply with the single word: working" }] },
    );
    const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join(" ").replace(/\s+/g, " ").trim().slice(0, 120);
    return { message: withSearch ? `Web search works. Claude answered: ${text || "(no text)"}` : `Claude answered: "${text}". The key works, so the ad builder, the reader and the search can all use it.` };
  } catch (error) {
    if (error instanceof Anthropic.APIError) return { error: explainClaudeError(error.status, String(error.message)) };
    return { error: explainClaudeError(null, error instanceof Error ? error.message : String(error)) };
  }
}

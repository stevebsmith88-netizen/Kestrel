// Who may read the site (app/robots.ts). Kept free of app imports so lib/crawlers.test.ts can check it.

// Pages that hold accounts, sign in or admin. No crawler reads these.
export const PRIVATE_PATHS = [
  "/admin", "/candidate", "/clinic/", "/clinic$", "/dashboard", "/account", "/claim", "/welcome", "/goodbye", "/auth", "/unsubscribe",
  "/launch-preview", "/sign-in", "/sign-up", "/forgot-password", "/reset-password",
] as const;

// The crawlers AI assistants use, allowed to every public page (decided 13th November 2026, docs/discoverability-plan.md).
// Search crawlers fetch pages to quote and link in answers: OAI-SearchBot and ChatGPT-User (ChatGPT), PerplexityBot and Perplexity-User,
// Claude-SearchBot and Claude-User (Claude). Training crawlers decide what the models learn: GPTBot (OpenAI), ClaudeBot (Anthropic),
// Google-Extended (Gemini), Applebot-Extended (Apple) and CCBot (Common Crawl, used by many). Bingbot (Copilot) and Googlebot are covered by "*".
// Being in what the models learn helps them know the Kestrel name, so training crawlers are allowed too. To keep a crawler out, give it its
// own group with disallow "/" in app/robots.ts.
export const AI_CRAWLERS = [
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",
  "PerplexityBot", "Perplexity-User",
  "Claude-SearchBot", "Claude-User", "ClaudeBot",
  "Google-Extended", "Applebot-Extended", "CCBot",
] as const;

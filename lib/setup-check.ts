// What the admin's "Setup check" box shows: which settings this copy of the site can see. It reports whether each is there and
// nothing that would help someone use it. A key is never shown, only whether it is present and looks right. Pure, so it can be
// tested (lib/setup-check.test.ts).

type Env = Record<string, string | undefined>;
export type Check = { label: string; ok: boolean; detail: string; fix?: string };

export function setupChecks(env: Env): Check[] {
  const key = env.ANTHROPIC_API_KEY;
  const where = env.DEMO_MODE === "yes" ? "the demo site" : env.VERCEL_ENV === "preview" ? "a preview copy" : env.VERCEL_ENV === "production" ? "the live site" : "this copy of the site";
  const keyProblem = !key
    ? "Missing. In Vercel, add ANTHROPIC_API_KEY for Production, then redeploy without the build cache."
    : key !== key.trim()
      ? "There is a space or line break at the start or end of the key. Paste it again with nothing around it."
      : /^["']|["']$/.test(key)
        ? "The key has quote marks around it. Paste it again without them."
        : !key.startsWith("sk-ant-")
          ? "It does not look like an Anthropic key. It should start with sk-ant-."
          : "";
  return [
    { label: "You are on", ok: true, detail: `${where}${env.VERCEL_GIT_COMMIT_SHA ? `, build ${env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` : ""}` },
    { label: "ANTHROPIC_API_KEY (ad builder, reader, search)", ok: !keyProblem, detail: keyProblem || `Set, ${key?.length} characters` },
    { label: "ANTHROPIC_WORKSPACE_ID", ok: true, detail: env.ANTHROPIC_WORKSPACE_ID?.trim() ? "Set. Only needed if the key is not made inside a workspace." : "Not set. Fine if the key was made inside a workspace." },
    { label: "Database", ok: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY), detail: env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? "Connected" : "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing" },
    { label: "Publishing found listings (ENABLE_SEEDING)", ok: true, detail: env.ENABLE_SEEDING === "yes" ? "On" : "Off, as it should be until your disclosure conversation has happened" },
  ];
}

// Turns an error from the test call into a plain next step. Never includes the key.
export function explainClaudeError(status: number | null | undefined, message: string): string {
  const text = message.replace(/sk-ant-[\w-]+/g, "[key]").slice(0, 300);
  if (/workspace/i.test(text)) return "The key is not made inside a workspace. Create a key inside your Kestrel workspace in the Anthropic console (or set ANTHROPIC_WORKSPACE_ID), then redeploy.";
  if (status === 401) return "Anthropic did not accept the key. Make a new one, paste it into Vercel, and redeploy without the build cache.";
  if (status === 403) return `Anthropic refused this key or this feature (${text}). Check the key's workspace and the account's settings.`;
  if (status === 429) return "Anthropic says the key is being used too fast or has reached its limit. Check the spend limit on the workspace.";
  if (/credit|billing|balance/i.test(text)) return "The Anthropic account has no credit left. Add credit in the console's billing page.";
  if (/web.?search/i.test(text)) return `Web search is not switched on for your Anthropic account. Turn it on in the console's settings (${text}).`;
  return `Anthropic answered: ${status ?? "no status"}: ${text}`;
}

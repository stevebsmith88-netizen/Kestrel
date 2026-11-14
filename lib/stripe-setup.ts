// What the Payments page's "Stripe setup" box shows: whether this copy of the site can see the 2 Stripe keys, whether they
// look right, and whether they are both test keys or both live keys. A key is never shown, only whether it is present, how
// long it is and which mode it is in. Pure, so it can be tested (lib/stripe-setup.test.ts). Step 1 of docs/plans/stripe-plan.md.

type Env = Record<string, string | undefined>;
export type StripeCheck = { label: string; ok: boolean; detail: string };
export type StripeMode = "test" | "live";

// sk_ is a full secret key, rk_ a restricted key (Stripe's safer choice, with only the permissions we pick). Both work.
export function secretKeyMode(key: string | undefined): StripeMode | null {
  const m = key?.match(/^(?:sk|rk)_(test|live)_[A-Za-z0-9]+$/);
  return m ? (m[1] as StripeMode) : null;
}

export function publishableKeyMode(key: string | undefined): StripeMode | null {
  const m = key?.match(/^pk_(test|live)_[A-Za-z0-9]+$/);
  return m ? (m[1] as StripeMode) : null;
}

// A slip made while pasting, in plain words, or "" when the key looks right.
function pasteProblem(name: string, key: string | undefined, wanted: string, mode: StripeMode | null): string {
  if (!key) return `Missing. In Vercel, add ${name} for Production and Preview, then redeploy without the build cache.`;
  if (key !== key.trim()) return "There is a space or line break at the start or end. Paste it again with nothing around it.";
  if (/^["']|["']$/.test(key)) return "It has quote marks around it. Paste it again without them.";
  if (!mode) return `It does not look like the right Stripe key. It should start with ${wanted}.`;
  return "";
}

export function stripeChecks(env: Env): StripeCheck[] {
  const secret = env.STRIPE_SECRET_KEY;
  const publishable = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const sMode = secretKeyMode(secret);
  const pMode = publishableKeyMode(publishable);
  const sProblem = pasteProblem("STRIPE_SECRET_KEY", secret, "sk_test_ (or rk_test_ for a restricted key)", sMode);
  const pProblem = pasteProblem("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", publishable, "pk_test_", pMode);
  const describe = (key: string | undefined, mode: StripeMode | null) => `Set, ${mode} mode, ${key?.length} characters`;
  const checks: StripeCheck[] = [
    { label: "STRIPE_SECRET_KEY (server only)", ok: !sProblem, detail: sProblem || describe(secret, sMode) },
    { label: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (the public key)", ok: !pProblem, detail: pProblem || describe(publishable, pMode) },
  ];
  if (sMode && pMode) {
    const same = sMode === pMode;
    checks.push({
      label: "The 2 keys match",
      ok: same,
      detail: same ? `Both are ${sMode} keys` : "One is a test key and the other a live key. Copy both from the same mode in Stripe (the Test mode switch at the top of the dashboard).",
    });
  }
  // The webhook secret is optional: card saving works through the clinic's own return to the site, but without the webhook a clinic who
  // closes the tab right after saving a card would be missed.
  const hook = env.STRIPE_WEBHOOK_SECRET;
  const hookBad = hook ? (hook !== hook.trim() || !/^whsec_[A-Za-z0-9]+$/.test(hook) ? "It does not look like a Stripe webhook signing secret. It should start with whsec_ and have nothing around it." : "") : "";
  checks.push({
    label: "STRIPE_WEBHOOK_SECRET (confirms saved cards)",
    ok: !hookBad,
    detail: hookBad || (hook ? `Set, ${hook.length} characters` : "Not set yet. Add it once the webhook is made in Stripe (see docs/plans/stripe-plan.md). Saving a card works without it, but a clinic who closes the tab straight after saving would be missed."),
  });
  // Prices are switched on only when Steve says so (docs/plans/stripe-plan.md), so until then a live key is a mistake.
  const live = sMode === "live" || pMode === "live";
  checks.push({
    label: "Test mode",
    ok: !live,
    detail: live
      ? "A live key is in use, so real cards could be charged. Prices are not switched on yet: swap in the test keys (sk_test_ and pk_test_) until you decide to take real payments."
      : "Yes. Nothing real is charged.",
  });
  return checks;
}

// What the test button learned from Stripe, in plain lines. Takes the account and tax settings as Stripe sends them.
type Account = {
  id?: string;
  country?: string;
  default_currency?: string;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  business_profile?: { name?: string | null } | null;
  settings?: { dashboard?: { display_name?: string | null } | null; payments?: { statement_descriptor?: string | null } | null } | null;
};
type TaxSettings = { status?: string } | null;

export function describeAccount(account: Account, tax: TaxSettings, mode: StripeMode): string[] {
  const name = account.business_profile?.name || account.settings?.dashboard?.display_name || "";
  const descriptor = account.settings?.payments?.statement_descriptor || "";
  const lines = [
    `Stripe accepted the key (${mode} mode).`,
    name ? `Business name customers see: ${name}${name === "Kestrel Eye Care Jobs" ? "." : ". The plan says Kestrel Eye Care Jobs, so check this in Stripe, Settings, Business."}` : "No public business name yet. Add Kestrel Eye Care Jobs in Stripe, Settings, Business.",
    descriptor ? `On card statements: ${descriptor}.` : "No statement descriptor yet (what appears on a card statement). Add one in Stripe, Settings, Business, for example KESTREL EYECARE.",
  ];
  if (account.country) lines.push(`Country: ${account.country}${account.default_currency ? `, currency ${account.default_currency.toUpperCase()}` : ""}${account.country === "CA" ? "." : ". Kestrel sells in Canada, so this should be CA."}`);
  if (mode === "live") lines.push(account.charges_enabled ? "The account can take real payments." : "The account cannot take real payments yet. Stripe needs more details first.");
  else if (!account.details_submitted) lines.push("Stripe's identity and bank details are not finished yet. That is fine for test mode, and needed before real payments.");
  lines.push(
    tax?.status === "active"
      ? "Stripe Tax is on."
      : "Stripe Tax is off. That is expected until your HST number arrives; prices show \"plus HST\" until then.",
  );
  return lines;
}

// Turns an error from the test call into a plain next step. Never includes a key.
export function explainStripeError(status: number | null | undefined, message: string): string {
  const text = message.replace(/\b(?:sk|rk|pk)_(?:test|live)_[A-Za-z0-9*]+/g, "[key]").slice(0, 300);
  if (status === 401) return "Stripe did not accept the secret key. Copy it again from Stripe, Developers, API keys, paste it into Vercel, and redeploy without the build cache.";
  if (status === 403) return `Stripe accepted the key but it is not allowed to read the account (${text}). If it is a restricted key, give it read access to Account and Tax settings, or use the standard secret key.`;
  if (status === 429) return "Stripe says too many requests were sent. Wait a minute and try again.";
  if (!status) return `Stripe could not be reached (${text}). Try again in a minute.`;
  return `Stripe answered: ${status}: ${text}`;
}

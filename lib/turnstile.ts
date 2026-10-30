import "server-only";

// The bot check (Cloudflare Turnstile). It only runs when both keys are set in Vercel, so until then
// every form works exactly as it did. Setting only one of the two keys does nothing, so a half finished
// setup can never lock people out of the forms.
export const turnstileEnforced = () => Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export const TURNSTILE_MESSAGE = "Please complete the security check and try again.";

// Asks Cloudflare whether the token a form sent came from a real person. Each token works once.
// If Cloudflare cannot be reached, the answer is no, so a bot cannot get through by waiting for an outage.
export async function passesTurnstile(token: unknown): Promise<boolean> {
  if (!turnstileEnforced()) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY ?? "", response: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Security check could not be verified:", error instanceof Error ? error.message : error);
    return false;
  }
}

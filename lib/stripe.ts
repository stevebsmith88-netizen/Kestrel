import "server-only";

// The 1 place the site talks to Stripe. Plain web requests to Stripe's API with the secret key, so there is no extra library
// to keep up to date. Server only: the secret key never reaches a browser. Test mode or live mode follows the key itself.
export const STRIPE_API = "https://api.stripe.com/v1";

export class StripeError extends Error {
  constructor(public status: number | null, message: string) {
    super(message);
  }
}

export function stripeKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

// A GET request to Stripe, returning the JSON or throwing a StripeError with Stripe's own message.
export async function stripeGet<T>(path: string, key: string, timeoutMs = 15_000): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${STRIPE_API}${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    throw new StripeError(null, error instanceof Error ? error.message : String(error));
  }
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!response.ok) throw new StripeError(response.status, body.error?.message || response.statusText);
  return body as T;
}

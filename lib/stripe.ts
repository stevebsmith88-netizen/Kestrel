import "server-only";

// The 1 place the site talks to Stripe. Plain web requests to Stripe's API with the secret key, so there is no extra library
// to keep up to date. Server only: the secret key never reaches a browser. Test mode or live mode follows the key itself.
export const STRIPE_API = "https://api.stripe.com/v1";

export class StripeError extends Error {
  status: number | null;
  type: string | null; // "card_error" when a card was refused, other values for a problem with the request or the account
  code: string | null;
  constructor(status: number | null, message: string, type: string | null = null, code: string | null = null) {
    super(message);
    this.status = status;
    this.type = type;
    this.code = code;
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
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string; type?: string; code?: string } };
  if (!response.ok) throw new StripeError(response.status, body.error?.message || response.statusText, body.error?.type ?? null, body.error?.code ?? null);
  return body as T;
}

// Stripe wants form fields, with nested values written as a[b][c] and lists as a[0]. This turns an object into that.
export function formEncode(data: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [name, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    const key = prefix ? `${prefix}[${name}]` : name;
    if (Array.isArray(value)) value.forEach((item, i) => (typeof item === "object" ? out.push(...formEncode(item as Record<string, unknown>, `${key}[${i}]`)) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`)));
    else if (typeof value === "object") out.push(...formEncode(value as Record<string, unknown>, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return out;
}

// A POST to Stripe (this creates or changes something), returning the JSON or throwing a StripeError with Stripe's own message.
// An idempotency key makes a repeated request (a double click, a retry) do its work only once: Stripe returns the first answer.
export async function stripePost<T>(path: string, key: string, data: Record<string, unknown>, options: { timeoutMs?: number; idempotencyKey?: string } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${STRIPE_API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}) },
      body: formEncode(data).join("&"),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
    });
  } catch (error) {
    throw new StripeError(null, error instanceof Error ? error.message : String(error));
  }
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string; type?: string; code?: string } };
  if (!response.ok) throw new StripeError(response.status, body.error?.message || response.statusText, body.error?.type ?? null, body.error?.code ?? null);
  return body as T;
}

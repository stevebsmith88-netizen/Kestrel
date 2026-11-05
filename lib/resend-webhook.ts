// Resend tells the site when an email bounces or someone marks it as spam, through a webhook signed with a secret
// (RESEND_WEBHOOK_SECRET, which starts whsec_). Resend signs the way Svix does: an HMAC of "id.timestamp.body".
// Kept free of the database so the checks can be tested.
import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;

export function webhookIsGenuine(
  secret: string | undefined,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!secret || !secret.startsWith("whsec_") || !headers.id || !headers.timestamp || !headers.signature) return false;
  const sent = Number(headers.timestamp);
  // An old or future timestamp could be a replay of a message someone captured.
  if (!Number.isFinite(sent) || Math.abs(nowSeconds - sent) > TOLERANCE_SECONDS) return false;
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const expected = createHmac("sha256", key).update(`${headers.id}.${headers.timestamp}.${body}`).digest();
  // The header can hold several signatures ("v1,abc v1,def") while a secret is being rotated. Any one may match.
  return headers.signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export type WebhookAction = { addresses: string[]; reason: "bounced" | "complaint" } | null;

// What to do about an event. A bounce that Resend calls temporary (a full inbox, for example) is ignored,
// since the address still works. Anything else we do not act on.
export function actionFor(event: unknown): WebhookAction {
  if (!event || typeof event !== "object") return null;
  const { type, data } = event as { type?: unknown; data?: { to?: unknown; bounce?: { type?: unknown } } };
  const to = Array.isArray(data?.to) ? data.to : typeof data?.to === "string" ? [data.to] : [];
  const addresses = to.map((a) => String(a).trim().toLowerCase()).filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)).slice(0, 50);
  if (!addresses.length) return null;
  if (type === "email.complained") return { addresses, reason: "complaint" };
  if (type === "email.bounced") {
    const kind = String(data?.bounce?.type ?? "").toLowerCase();
    if (kind === "transient" || kind === "temporary") return null;
    return { addresses, reason: "bounced" };
  }
  return null;
}

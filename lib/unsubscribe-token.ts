import { createHmac, timingSafeEqual } from "node:crypto";

// Pure helpers for the do not email list, kept apart so they can be tested without a database.

export const normaliseAddress = (address: string) => address.trim().toLowerCase();

// The entries that would block this address: the address itself and its whole domain.
export function suppressionKeys(address: string) {
  const email = normaliseAddress(address);
  const at = email.lastIndexOf("@");
  return at > 0 ? [email, email.slice(at)] : [email];
}

const sign = (secret: string, address: string) => createHmac("sha256", secret).update(`unsubscribe:${normaliseAddress(address)}`).digest("hex");

// A link only the site could have made, so nobody can unsubscribe someone else by guessing.
export function unsubscribeQuery(secret: string, address: string) {
  const e = Buffer.from(normaliseAddress(address)).toString("base64url");
  return `e=${e}&s=${sign(secret, address)}`;
}

// Returns the address when the link is genuine, otherwise null.
export function addressFromUnsubscribe(secret: string, e: string | undefined, s: string | undefined) {
  if (!e || !s) return null;
  let address: string;
  try {
    address = normaliseAddress(Buffer.from(e, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!address || address.length > 254) return null;
  const expected = Buffer.from(sign(secret, address));
  const given = Buffer.from(s);
  return expected.length === given.length && timingSafeEqual(expected, given) ? address : null;
}

// The same idea for other links we email, such as confirming a waitlist address. The `purpose`
// keeps a link made for one job from working for another.
export const signValue = (secret: string, purpose: string, value: string) => createHmac("sha256", secret).update(`${purpose}:${value}`).digest("hex");

export function valueIsGenuine(secret: string, purpose: string, value: string | undefined, signature: string | undefined) {
  if (!value || !signature) return false;
  const expected = Buffer.from(signValue(secret, purpose, value));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

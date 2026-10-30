import "server-only";
import { signValue } from "@/lib/unsubscribe-token";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";
export const WAITLIST_PURPOSE = "waitlist-confirm";

// The link in the confirmation email. It is signed, so only a link we sent can confirm an address.
export const waitlistConfirmUrl = (id: string) => `${SITE}/waitlist/confirm?id=${id}&s=${signValue(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", WAITLIST_PURPOSE, id)}`;

import { SITE_URL } from "./email-layout.ts";
import { signValue, valueIsGenuine } from "./unsubscribe-token.ts";

// The unsubscribe link for a waitlist entry or an account. It carries a signature, because account ids can be seen
// by other signed in people and an id on its own must not be enough to switch someone's emails off.
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const unsubscribeIdUrl = (id: string) => `${SITE_URL}/unsubscribe/${id}?s=${signValue(secret(), "unsubscribe-id", id)}`;

export const unsubscribeIdIsGenuine = (id: string, signature: string | undefined) => Boolean(secret()) && valueIsGenuine(secret(), "unsubscribe-id", id, signature);

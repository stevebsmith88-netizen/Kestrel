import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Where an email about a candidate's application should go, and whether they want it. The address comes from
// their account as it is now, so a candidate who has changed their email still gets it. The address saved with
// the application (as it was on the day they applied) is only a fallback.
export async function candidateRecipient(admin: SupabaseClient, candidateId: string, fallbackEmail?: string) {
  const [{ data: user }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(candidateId),
    admin.from("profiles").select("notify_application_updates").eq("id", candidateId).maybeSingle(),
  ]);
  return { email: user?.user?.email ?? fallbackEmail ?? "", wants: profile?.notify_application_updates !== false };
}

"use server";

import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { INTEREST_LIMIT, INTEREST_THANKS, cleanInterest } from "@/lib/clinic-interest";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

// A candidate says they would like to work for a clinic or company that is not on Kestrel (migration 0055). Saved with the server key. Nothing
// is sent to the clinic, and the candidate is told that their name and details are not shared.
export async function saveInterest(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const admin = supabaseAdmin();
  if (!admin) return { error: NOT_CONNECTED };
  const checked = cleanInterest({ clinicName: form.get("clinicName"), town: form.get("town"), province: form.get("province"), website: form.get("website") });
  if (!checked.value) return { errors: checked.errors, error: Object.values(checked.errors)[0] };
  const v = checked.value;
  const { count } = await admin.from("employer_interest").select("id", { count: "exact", head: true }).eq("candidate_id", session.userId);
  if ((count ?? 0) >= INTEREST_LIMIT) return { error: `You have told us about ${INTEREST_LIMIT} places already, which is the most we keep for 1 person.` };
  const { error } = await admin.from("employer_interest").insert({ candidate_id: session.userId, clinic_name: v.clinicName, town: v.town, province: v.province, website: v.website, name_key: v.key });
  if (error) {
    if (error.code === "23505") return { message: INTEREST_THANKS };
    console.error("Clinic interest not saved:", error.code, error.message);
    return { error: "We couldn't save that just now. Please try again in a moment." };
  }
  return { message: INTEREST_THANKS };
}

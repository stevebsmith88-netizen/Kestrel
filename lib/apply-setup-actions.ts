"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { uploadCv } from "@/lib/candidate-actions";
import { FIELD_ROLES, PROVINCES, ROLE_CATEGORIES, type JobFormState } from "@/lib/jobs";
import { findPlace } from "@/lib/places";
import { readResumeBasics, type ResumeBasics } from "@/lib/resume-actions";
import { canHaveFieldRoles, neverTogether } from "@/lib/role-fit";
import { supabaseServer } from "@/lib/supabase/server";

// The first application, done on the apply page itself (Steve, 13th November 2026, from the tap count in
// docs/audit/CLICK-COUNT-2026-11-12.md). Step 1 saves the resume with exactly the same checks as the profile page (uploadCv) and reads
// it on Kestrel's own server to suggest the role, town and province. Step 2 saves those 3 once the candidate has checked them. Nothing
// read from the resume is saved until the candidate presses Save and continue.

export type ApplySetupState = JobFormState & { uploaded?: boolean; basics?: ResumeBasics };

export async function uploadForApply(prev: ApplySetupState, form: FormData): Promise<ApplySetupState> {
  await requireRole("candidate");
  const saved = await uploadCv(prev, form);
  if (saved.error) return { error: saved.error };
  // A resume that cannot be read is still saved: the candidate fills in the 3 answers by hand.
  const read = await readResumeBasics();
  return { uploaded: true, basics: read.error ? {} : { profession: read.profession, city: read.city, province: read.province } };
}

// Suggestions for someone whose resume is already saved but who still needs a role or a town.
export async function suggestFromSavedResume(): Promise<ResumeBasics> {
  await requireRole("candidate");
  const read = await readResumeBasics();
  return read.error ? {} : { profession: read.profession, city: read.city, province: read.province };
}

export async function saveApplyBasics(_prev: ApplySetupState, form: FormData): Promise<ApplySetupState> {
  const session = await requireRole("candidate");
  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { data: now } = await db.from("candidate_profiles").select("profession, home_city, home_province, pref_other_roles").eq("user_id", session.userId).maybeSingle();

  const errors: Record<string, string> = {};
  const row: Record<string, unknown> = {};
  if (form.has("profession")) {
    const profession = String(form.get("profession") ?? "").trim();
    if (!(ROLE_CATEGORIES as readonly string[]).includes(profession)) errors.profession = "Choose the role that fits you best.";
    else if (profession !== now?.profession) {
      row.profession = profession;
      const field = FIELD_ROLES as readonly string[];
      row.pref_other_roles = ((now?.pref_other_roles as string[] | null) ?? []).filter((r) => r !== profession && !neverTogether(profession, r) && (canHaveFieldRoles(profession) || !field.includes(r)));
    }
  }
  if (form.has("homeCity")) {
    const city = String(form.get("homeCity") ?? "").trim().slice(0, 80);
    const province = String(form.get("homeProvince") ?? "").trim();
    if (!(PROVINCES as readonly string[]).includes(province)) errors.homeProvince = "Choose your province or territory.";
    if (!city) errors.homeCity = "Enter your town or city.";
    else if (!errors.homeProvince) {
      const place = findPlace(city, province);
      if (!place) errors.homeCity = "We do not have that town on our list. Try the nearest larger town.";
      else {
        row.home_city = place.name;
        row.home_province = place.province;
      }
    }
  }
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };
  if (Object.keys(row).length) {
    const { data: exists } = await db.from("candidate_profiles").select("user_id").eq("user_id", session.userId).maybeSingle();
    const { error } = exists
      ? await db.from("candidate_profiles").update(row).eq("user_id", session.userId)
      : await db.from("candidate_profiles").insert({ ...row, user_id: session.userId });
    if (error) {
      console.error("Apply basics not saved:", error.code, error.message);
      return { error: "We couldn't save that. Please try again." };
    }
  }
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  return { message: "saved" };
}

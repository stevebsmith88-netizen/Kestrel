"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { FIELD_ROLES, PROVINCES, ROLE_CATEGORIES, type JobFormState } from "@/lib/jobs";
import { readResume, type ResumeSuggestions } from "@/lib/resume-reader";
import { resumeText } from "@/lib/resume-text";
import { canHaveFieldRoles, neverTogether } from "@/lib/role-fit";
import { SOFTWARE_TAGS } from "@/lib/job-tags";
import { findPlace } from "@/lib/places";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

// "Fill in from my resume" (no AI). Kestrel's own server reads the saved resume's text, suggests profile answers, and shows each one with where it
// came from. Nothing is saved until the person ticks what to keep (applyResumeAnswers). The text is never stored.

export type ReaderRow = { key: string; label: string; display: string; why: string };
export type ReaderState = JobFormState & { rows?: ReaderRow[] };

const LABELS: Record<string, string> = {
  profession: "Your role",
  yearsExperience: "Years of experience",
  licensedProvinces: "Registered in",
  phone: "Phone",
  home: "Your town and province",
  software: "Practice software you have used",
};

async function suggestionsFor(userId: string): Promise<{ suggestions: ResumeSuggestions } | { error: string }> {
  const db = await supabaseServer();
  const admin = supabaseAdmin();
  if (!db || !admin) return { error: NOT_CONNECTED };
  const { data: profile } = await db.from("candidate_profiles").select("cv_path, cv_filename").eq("user_id", userId).maybeSingle();
  if (!profile?.cv_path) return { error: "Save your resume first, and then we can read it." };
  const { data: file, error } = await admin.storage.from("cvs").download(profile.cv_path);
  if (error || !file) return { error: "We could not open your saved resume. Please try again, or upload it again." };
  const result = await resumeText(new Uint8Array(await file.arrayBuffer()), profile.cv_filename ?? "");
  if (!result.ok) {
    if (result.reason === "unsupported") return { error: "We can read PDF and Word (.docx) files. This looks like an older Word file, so please save it as a PDF and upload it again." };
    if (result.reason === "empty") return { error: "We could not find any text in this file. It may be a scan or a picture of a page. A PDF saved straight from Word or Google Docs works best." };
    return { error: "We could not read this file. You can fill in your profile by hand below." };
  }
  return { suggestions: readResume(result.text) };
}

function describe(key: string, s: ResumeSuggestions): ReaderRow | null {
  switch (key) {
    case "profession": return s.profession ? { key, label: LABELS[key], display: s.profession.value, why: s.profession.why } : null;
    case "yearsExperience": return s.yearsExperience ? { key, label: LABELS[key], display: s.yearsExperience.value, why: s.yearsExperience.why } : null;
    case "licensedProvinces": return s.licensedProvinces ? { key, label: LABELS[key], display: s.licensedProvinces.value.join(", "), why: s.licensedProvinces.why } : null;
    case "phone": return s.phone ? { key, label: LABELS[key], display: s.phone.value, why: s.phone.why } : null;
    case "home": return s.home ? { key, label: LABELS[key], display: `${s.home.value.city}, ${s.home.value.province}`, why: s.home.why } : null;
    case "software": return s.software ? { key, label: LABELS[key], display: s.software.value.join(", "), why: s.software.why } : null;
  }
  return null;
}

export async function readMyResume(): Promise<ReaderState> {
  const session = await requireRole("candidate");
  const found = await suggestionsFor(session.userId);
  if ("error" in found) return { error: found.error };
  const rows = Object.keys(LABELS).map((k) => describe(k, found.suggestions)).filter((r): r is ReaderRow => r !== null);
  if (rows.length === 0) return { error: "We could not find anything to suggest in this resume. You can fill in your profile by hand below." };
  return { rows };
}

export async function applyResumeAnswers(_prev: ReaderState, form: FormData): Promise<ReaderState> {
  const session = await requireRole("candidate");
  const chosen = new Set(form.getAll("use").map(String));
  if (chosen.size === 0) return { error: "Tick at least one answer to keep, or leave them out." };
  // Read the resume again here, so only what the reader really found can be saved, whatever the page sent.
  const found = await suggestionsFor(session.userId);
  if ("error" in found) return { error: found.error };
  const s = found.suggestions;

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { data: now } = await db.from("candidate_profiles").select("profession, licensed_provinces, software_skills, pref_other_roles").eq("user_id", session.userId).maybeSingle();
  const row: Record<string, unknown> = {};
  let profession = (now?.profession as string | null) ?? "";
  if (chosen.has("profession") && s.profession && (ROLE_CATEGORIES as readonly string[]).includes(s.profession.value)) {
    profession = s.profession.value;
    row.profession = profession;
    // Roles that no longer make sense for the new role are dropped from "other roles you would consider".
    const field = FIELD_ROLES as readonly string[];
    row.pref_other_roles = ((now?.pref_other_roles as string[] | null) ?? []).filter((r) => r !== profession && !neverTogether(profession, r) && (canHaveFieldRoles(profession) || !field.includes(r)));
  }
  if (chosen.has("yearsExperience") && s.yearsExperience) row.years_experience = s.yearsExperience.value;
  if (chosen.has("licensedProvinces") && s.licensedProvinces) {
    const valid = s.licensedProvinces.value.filter((p) => (PROVINCES as readonly string[]).includes(p));
    row.licensed_provinces = [...new Set([...((now?.licensed_provinces as string[] | null) ?? []), ...valid])];
  }
  if (chosen.has("phone") && s.phone) row.phone = s.phone.value;
  if (chosen.has("home") && s.home) {
    const place = findPlace(s.home.value.city, s.home.value.province);
    if (place) {
      row.home_city = place.name;
      row.home_province = place.province;
    }
  }
  if (chosen.has("software") && s.software) {
    row.software_skills = [...new Set([...((now?.software_skills as string[] | null) ?? []), ...s.software.value.filter((n) => (SOFTWARE_TAGS as readonly string[]).includes(n))])];
  }
  if (Object.keys(row).length === 0) return { error: "Nothing there could be saved. You can fill in your profile by hand below." };
  const { error } = await db.from("candidate_profiles").update(row).eq("user_id", session.userId);
  if (error) {
    console.error("Resume answers not saved:", error.code, error.message);
    return { error: "We could not save those. Please try again." };
  }
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  return { message: "Saved. Your profile below now shows them, and you can change anything." };
}

// The 3 things a first application needs (role, town and province), read from the saved resume so the apply page can offer them
// already filled in. Nothing is saved here: the candidate checks them and presses Save and continue (lib/apply-setup-actions.ts).
export type ResumeBasics = { profession?: string; city?: string; province?: string };
export async function readResumeBasics(): Promise<ResumeBasics & { error?: string }> {
  const session = await requireRole("candidate");
  const found = await suggestionsFor(session.userId);
  if ("error" in found) return { error: found.error };
  const s = found.suggestions;
  const out: ResumeBasics = {};
  if (s.profession && (ROLE_CATEGORIES as readonly string[]).includes(s.profession.value)) out.profession = s.profession.value;
  if (s.home) {
    const place = findPlace(s.home.value.city, s.home.value.province);
    if (place) {
      out.city = place.name;
      out.province = place.province;
    }
  }
  return out;
}

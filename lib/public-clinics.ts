import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { QUEBEC } from "@/lib/jobs";
import { clinicSlugs, type PublicClinic } from "@/lib/clinic-pages";

// Which clinics have a public page, and the details shown on it. Read with the server key, because a clinic with no live job today is
// hidden from the visitor's key (migration 0040), and its page should still work. Only these public columns are ever read: never the owner,
// the alert email, the staff count or anything else private.
//
// A clinic has a page when it is active, claimed (found listings that nobody has claimed have none), not a supplier (supplier pages come
// next), not in Quebec, and Kestrel has approved at least 1 of its jobs. That last rule means every page belongs to a clinic a person at
// Kestrel has already checked, so an account cannot publish a page of text without a review.
const PUBLIC_COLUMNS = "id, clinic_name, practice_type, website, province, city, about";
const APPROVED_STATUSES = ["live", "closed", "expired"];

export type ClinicIndex = { clinics: PublicClinic[]; slugs: Map<string, string> };

export async function listPublicClinics(): Promise<ClinicIndex> {
  const empty = { clinics: [], slugs: new Map<string, string>() };
  const db = supabaseAdmin();
  if (!db) return empty;
  const [{ data: rows, error }, { data: approved, error: jobsError }] = await Promise.all([
    db.from("employers").select(PUBLIC_COLUMNS).eq("status", "active").eq("claimed", true).in("practice_type", ["independent", "corporate"]).neq("province", QUEBEC).limit(5000),
    db.from("jobs").select("employer_id").in("status", APPROVED_STATUSES).not("posted_at", "is", null).limit(20000),
  ]);
  if (error || jobsError) {
    console.error("Listing clinic pages failed:", (error ?? jobsError)?.message);
    return empty;
  }
  const withJobs = new Set((approved ?? []).map((j) => j.employer_id as string));
  const clinics = ((rows ?? []) as PublicClinic[]).filter((c) => withJobs.has(c.id));
  // Addresses are worked out across every clinic, so 2 with the same name and town never swap pages when one gains its first job.
  return { clinics, slugs: clinicSlugs((rows ?? []) as PublicClinic[]) };
}

export async function getPublicClinic(slug: string): Promise<{ clinic: PublicClinic; slug: string } | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const { clinics, slugs } = await listPublicClinics();
  const clinic = clinics.find((c) => slugs.get(c.id) === slug);
  return clinic ? { clinic, slug } : null;
}

// The address of 1 clinic's page, or null when it has none. Used to link a job page to its clinic.
export async function clinicSlugFor(employerId: string): Promise<string | null> {
  const { clinics, slugs } = await listPublicClinics();
  return clinics.some((c) => c.id === employerId) ? (slugs.get(employerId) ?? null) : null;
}

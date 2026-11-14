import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { QUEBEC } from "@/lib/jobs";
import { clinicSlugs, employerHref, type PublicClinic } from "@/lib/clinic-pages";
import { emailMatchesWebsite } from "@/lib/claims";

// Which clinics and suppliers have a public page, and the details shown on it. Read with the server key, because an employer with no live
// job today is hidden from the visitor's key (migration 0040), and its page should still work. Only these public columns are shown: never
// the owner, the alert email, the staff count or anything else private.
//
// An employer has a page when it is active, claimed (found listings that nobody has claimed have none), not in Quebec, and Kestrel has
// approved at least 1 of its jobs. That last rule means every page belongs to an employer a person at Kestrel has already checked, so an
// account cannot publish a page of text without a review. Clinics live at /clinics/<name-town>, suppliers at /companies/<name-town>
// (Steve, 14th November 2026).
const COLUMNS = "id, clinic_name, practice_type, website, province, city, about, owner_id";
const APPROVED_STATUSES = ["live", "closed", "expired"];

export type ClinicIndex = { clinics: PublicClinic[]; slugs: Map<string, string> };
type Row = PublicClinic & { owner_id: string | null };

export async function listPublicClinics(): Promise<ClinicIndex> {
  const empty = { clinics: [], slugs: new Map<string, string>() };
  const db = supabaseAdmin();
  if (!db) return empty;
  const [{ data: rows, error }, { data: approved, error: jobsError }] = await Promise.all([
    db.from("employers").select(COLUMNS).eq("status", "active").eq("claimed", true).neq("province", QUEBEC).limit(5000),
    db.from("jobs").select("employer_id").in("status", APPROVED_STATUSES).not("posted_at", "is", null).limit(20000),
  ]);
  if (error || jobsError) {
    console.error("Listing clinic pages failed:", (error ?? jobsError)?.message);
    return empty;
  }
  const withJobs = new Set((approved ?? []).map((j) => j.employer_id as string));
  // The owner id is only used below to check a supplier's email domain, and is dropped before anything is returned.
  const all = ((rows ?? []) as Row[]).map(({ owner_id: _owner, ...rest }) => rest as PublicClinic);
  // Addresses are worked out across every employer, so 2 with the same name and town never swap pages when one gains its first job.
  return { clinics: all.filter((c) => withJobs.has(c.id)), slugs: clinicSlugs(all) };
}

// A supplier whose owner signed in with an address at the company's own website domain (lib/company-domain.ts).
async function companyEmailConfirmed(id: string, website: string | null) {
  const db = supabaseAdmin();
  if (!db || !website) return false;
  const { data } = await db.from("employers").select("owner_id").eq("id", id).maybeSingle();
  if (!data?.owner_id) return false;
  const { data: owner } = await db.auth.admin.getUserById(data.owner_id as string);
  return emailMatchesWebsite(owner.user?.email ?? "", website);
}

export async function getPublicClinic(slug: string, kind: "clinic" | "supplier" = "clinic"): Promise<{ clinic: PublicClinic; slug: string; confirmed: boolean } | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  const { clinics, slugs } = await listPublicClinics();
  const clinic = clinics.find((c) => slugs.get(c.id) === slug && (c.practice_type === "supplier") === (kind === "supplier"));
  if (!clinic) return null;
  return { clinic, slug, confirmed: kind === "supplier" ? await companyEmailConfirmed(clinic.id, clinic.website) : false };
}

// The address of 1 employer's page, or null when it has none. Used to link a job page to its clinic or company.
export async function clinicHrefFor(employerId: string): Promise<string | null> {
  const { clinics, slugs } = await listPublicClinics();
  const c = clinics.find((x) => x.id === employerId);
  const slug = c ? slugs.get(c.id) : null;
  return c && slug ? employerHref(slug, c.practice_type) : null;
}

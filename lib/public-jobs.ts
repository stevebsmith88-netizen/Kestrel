import { clampPage, pageOrLast } from "./paging.ts";
import "server-only";
import { supabasePublic } from "@/lib/supabase/public";
import { withExpected } from "@/lib/expected-columns";
import { cleanEmploymentTypes, PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";
import { cleanTagFilters, type TagFilters } from "@/lib/job-tags";
import type { PayFields } from "@/lib/job-pay";
import { RADIUS_OPTIONS, findPlace, nearbyKeys, placeKey, type Place } from "@/lib/places";

export const PAGE_SIZE = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JobFilters = { q?: string; city?: string; radius?: number; province?: string; role?: string; type?: string[]; practice?: string; arrangement?: string; page?: number; tags?: TagFilters };

// With a city chosen, jobs are matched in code against the places within the radius, from at most this many live jobs.
const RADIUS_SEARCH_LIMIT = 1000;

export type JobSummary = PayFields & {
  tags_software?: string[] | null;
  tags_equipment?: string[] | null;
  tags_specialties?: string[] | null;
  id: string;
  title: string;
  role_category: string;
  employment_type: string;
  province: string;
  city: string;
  posted_at: string;
  is_seeded: boolean;
  work_arrangement: string;
  employers: { clinic_name: string; practice_type: string; claimed: boolean } | null;
};

// Only these filter values are ever used, so nothing odd reaches the database query.
export function cleanFilters(raw: Record<string, string | string[] | undefined>): JobFilters {
  const one = (k: string) => {
    const v = raw[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  };
  const pick = <T extends string>(value: string, allowed: readonly T[]) => (allowed.includes(value as T) ? value : "");
  const page = Number.parseInt(one("page"), 10);
  return {
    q: one("q").replace(/[,()%*\\"]/g, " ").slice(0, 80).trim(),
    city: one("city").replace(/[()%*\\"]/g, " ").slice(0, 80).trim(),
    radius: RADIUS_OPTIONS.find((r) => String(r) === one("radius")) ?? 25,
    province: pick(one("province"), PROVINCES),
    role: pick(one("role"), ROLE_CATEGORIES),
    type: cleanEmploymentTypes(raw.type),
    practice: pick(one("practice"), PRACTICE_TYPES.map((p) => p.value)),
    arrangement: pick(one("arrangement"), ["on_site", "field"] as const),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
    tags: cleanTagFilters(raw),
  };
}

// `page` is the page actually shown: a page past the end is moved back to the last page.
export type SearchResult = { jobs: JobSummary[]; total: number; page?: number; place?: Place | null; placeNotFound?: boolean };

const SUMMARY_COLUMNS = "id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, posted_at, is_seeded, work_arrangement, employers!inner(clinic_name, practice_type, claimed)";

// With `everything`, every matching job comes back in one list (newest first, up to a limit) and the caller orders and pages it. That is how the
// "For me" view and the Closest sort work, because they cannot be done by the database one page at a time.
export async function searchJobs(filters: JobFilters, opts: { everything?: boolean } = {}): Promise<SearchResult> {
  const db = supabasePublic();
  if (!db) return { jobs: [], total: 0 };
  const page = filters.page ?? 1;
  // A city that is not on the list of places cannot be searched, so say so instead of showing nothing.
  const place = filters.city ? findPlace(filters.city, filters.province || undefined) : null;
  if (filters.city && !place) return { jobs: [], total: 0, place: null, placeNotFound: true };

  const nowIso = new Date().toISOString();
  const summaryColumns = await withExpected(SUMMARY_COLUMNS);
  const build = (columns: string, head = false) => {
  let query = db.from("jobs").select(columns, { count: "exact", head }).eq("status", "live").gt("expires_at", nowIso);
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.role) query = query.eq("role_category", filters.role);
  if (filters.type?.length) query = query.in("employment_type", filters.type);
  if (filters.arrangement) query = query.eq("work_arrangement", filters.arrangement);
  if (filters.practice) query = query.eq("employers.practice_type", filters.practice);
  // Within one group a job matches if it has any ticked name; every group with something ticked must match.
  if (filters.tags?.software.length) query = query.overlaps("tags_software", filters.tags.software);
  if (filters.tags?.equipment.length) query = query.overlaps("tags_equipment", filters.tags.equipment);
  if (filters.tags?.specialties.length) query = query.overlaps("tags_specialties", filters.tags.specialties);
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,city.ilike.%${filters.q}%`);
  return query.order("posted_at", { ascending: false });
  };
  const query = build(summaryColumns);

  if (!place) {
    if (opts.everything) {
      const { data, count, error } = await query.range(0, RADIUS_SEARCH_LIMIT - 1);
      if (error) {
        console.error("Job search failed:", error.code, error.message);
        return { jobs: [], total: 0 };
      }
      return { jobs: (data ?? []) as unknown as JobSummary[], total: count ?? 0 };
    }
    // A page past the end (for example ?page=400) shows the last page instead of a count with no jobs (lib/paging.ts).
    const result = await pageOrLast<JobSummary>(
      page,
      PAGE_SIZE,
      async (p) => {
        const { data, count, error } = await build(summaryColumns).range((p - 1) * PAGE_SIZE, p * PAGE_SIZE - 1);
        if (error && error.code !== "PGRST103") console.error("Job search failed:", error.code, error.message);
        return { rows: (data ?? []) as unknown as JobSummary[], count: count ?? null, error: Boolean(error) };
      },
      async () => (await build("id", true)).count ?? 0,
    );
    return { jobs: result.rows, total: result.total, page: result.page };
  }

  // City and radius: jobs in or near the place, and field based jobs, which are not tied to one town, always show too.
  const { data, error } = await query.range(0, RADIUS_SEARCH_LIMIT - 1);
  if (error) {
    console.error("Job search failed:", error.code, error.message);
    return { jobs: [], total: 0, place };
  }
  const near = nearbyKeys(place, filters.radius ?? 25);
  const all = ((data ?? []) as unknown as JobSummary[]).filter((j) => j.work_arrangement === "field" || near.has(placeKey(j.city, j.province)));
  const at = clampPage(page, all.length, PAGE_SIZE);
  return { jobs: opts.everything ? all : all.slice((at - 1) * PAGE_SIZE, at * PAGE_SIZE), total: all.length, page: at, place };
}

// Live jobs for the "Recommended for you" rules to choose from (newest first, at most this many).
export async function listLiveJobsForMatching(limit = 1000): Promise<JobSummary[]> {
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db.from("jobs").select(await withExpected(SUMMARY_COLUMNS)).eq("status", "live").gt("expires_at", new Date().toISOString()).order("posted_at", { ascending: false }).limit(limit);
  if (error) {
    console.error("Listing live jobs for recommendations failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as JobSummary[];
}

// One clinic's live jobs, newest first, for its public clinic page (lib/public-clinics.ts).
export async function listLiveJobsForEmployer(employerId: string): Promise<JobSummary[]> {
  if (!UUID.test(employerId)) return [];
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db.from("jobs").select(await withExpected(SUMMARY_COLUMNS)).eq("employer_id", employerId).eq("status", "live").gt("expires_at", new Date().toISOString()).order("posted_at", { ascending: false }).limit(50);
  if (error) {
    console.error("Listing a clinic's jobs failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as unknown as JobSummary[];
}

// How many live jobs there are for each role and each province, so the filters only offer choices that have jobs.
export async function getFilterCounts(): Promise<{ total: number; roles: Record<string, number>; provinces: Record<string, number> }> {
  const empty = { total: 0, roles: {}, provinces: {} };
  const db = supabasePublic();
  if (!db) return empty;
  const { data, error } = await db.from("jobs").select("role_category, province").eq("status", "live").gt("expires_at", new Date().toISOString()).limit(2000);
  if (error) {
    console.error("Filter counts failed:", error.code, error.message);
    return empty;
  }
  const roles: Record<string, number> = {};
  const provinces: Record<string, number> = {};
  for (const j of data ?? []) {
    if (j.role_category) roles[j.role_category] = (roles[j.role_category] ?? 0) + 1;
    if (j.province) provinces[j.province] = (provinces[j.province] ?? 0) + 1;
  }
  return { total: data?.length ?? 0, roles, provinces };
}

export type LiveJob = JobSummary & {
  employer_id: string;
  is_existing_vacancy: boolean | null;
  uses_ai_screening: boolean | null;
  description: string;
  territory: string | null;
  pay_extras: string | null;
  apply_method: string;
  apply_url: string | null;
  expires_at: string;
  employers: { clinic_name: string; practice_type: string; claimed: boolean; website: string | null; city: string; province: string; about: string | null } | null;
};

export async function getLiveJob(id: string): Promise<LiveJob | null> {
  if (!UUID.test(id)) return null;
  const db = supabasePublic();
  if (!db) return null;
  const { data, error } = await db
    .from("jobs")
    .select(await withExpected("id, employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, is_existing_vacancy, uses_ai_screening, description, territory, pay_extras, apply_method, apply_url, is_seeded, work_arrangement, posted_at, expires_at, employers(clinic_name, practice_type, claimed, website, city, province, about)"))
    .eq("id", id)
    .eq("status", "live")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) console.error("Job lookup failed:", error.code, error.message);
  return (data as unknown as LiveJob | null) ?? null;
}

// For the sitemap. If the database cannot be read this throws, so Next keeps the last good sitemap instead of
// publishing one with no jobs in it. With no database set up at all (a local build) it is an empty list.
// The public (anonymous) database role can read only certain columns of jobs (migrations 0005 and 0013), and updated_at is not one of them,
// so the sitemap dates a job by when it went live. lib/public-columns.test.ts checks every public read against those grants.
export async function listLiveJobIds(): Promise<{ id: string; posted_at: string; employer_id: string }[]> {
  const db = supabasePublic();
  if (!db) return [];
  const { data, error } = await db.from("jobs").select("id, posted_at, employer_id").eq("status", "live").gt("expires_at", new Date().toISOString()).order("posted_at", { ascending: false }).limit(1000);
  if (error) {
    // While the site is being built, a failed read must not stop the deployment. After that, throwing keeps the last good copy.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error("Sitemap build could not read the jobs:", error.message);
      return [];
    }
    throw new Error(`Sitemap could not read the jobs: ${error.message}`);
  }
  return data ?? [];
}

// Live jobs for each province and role together, for the landing pages and the sitemap. Keys are "Province|Role".
export async function getComboCounts(): Promise<Record<string, number>> {
  const db = supabasePublic();
  if (!db) return {};
  const { data, error } = await db.from("jobs").select("role_category, province").eq("status", "live").gt("expires_at", new Date().toISOString()).limit(2000);
  if (error) {
    console.error("Combo counts failed:", error.code, error.message);
    return {};
  }
  const out: Record<string, number> = {};
  for (const j of data ?? []) if (j.role_category && j.province) out[`${j.province}|${j.role_category}`] = (out[`${j.province}|${j.role_category}`] ?? 0) + 1;
  return out;
}

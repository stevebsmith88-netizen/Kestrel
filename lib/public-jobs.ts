import "server-only";
import { supabasePublic } from "@/lib/supabase/public";
import { EMPLOYMENT_TYPES, PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";

export const PAGE_SIZE = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type JobFilters = { q?: string; province?: string; role?: string; type?: string; practice?: string; page?: number };

export type JobSummary = {
  id: string;
  title: string;
  role_category: string;
  employment_type: string;
  province: string;
  city: string;
  pay_period: string;
  pay_min: number;
  pay_max: number;
  posted_at: string;
  is_seeded: boolean;
  employers: { clinic_name: string; practice_type: string } | null;
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
    province: pick(one("province"), PROVINCES),
    role: pick(one("role"), ROLE_CATEGORIES),
    type: pick(one("type"), EMPLOYMENT_TYPES),
    practice: pick(one("practice"), PRACTICE_TYPES.map((p) => p.value)),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
  };
}

export async function searchJobs(filters: JobFilters): Promise<{ jobs: JobSummary[]; total: number }> {
  const db = supabasePublic();
  if (!db) return { jobs: [], total: 0 };
  const page = filters.page ?? 1;
  let query = db
    .from("jobs")
    .select("id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, posted_at, is_seeded, employers!inner(clinic_name, practice_type)", { count: "exact" })
    .eq("status", "live")
    .gt("expires_at", new Date().toISOString());
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.role) query = query.eq("role_category", filters.role);
  if (filters.type) query = query.eq("employment_type", filters.type);
  if (filters.practice) query = query.eq("employers.practice_type", filters.practice);
  if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,city.ilike.%${filters.q}%`);
  const { data, count, error } = await query.order("posted_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) {
    console.error("Job search failed:", error.code, error.message);
    return { jobs: [], total: 0 };
  }
  return { jobs: (data ?? []) as unknown as JobSummary[], total: count ?? 0 };
}

export type LiveJob = JobSummary & {
  employer_id: string;
  is_existing_vacancy: boolean;
  uses_ai_screening: boolean;
  description: string;
  apply_method: string;
  apply_url: string | null;
  expires_at: string;
  employers: { clinic_name: string; practice_type: string; website: string | null; city: string; province: string; about: string | null } | null;
};

export async function getLiveJob(id: string): Promise<LiveJob | null> {
  if (!UUID.test(id)) return null;
  const db = supabasePublic();
  if (!db) return null;
  const { data, error } = await db
    .from("jobs")
    .select("id, employer_id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, is_seeded, posted_at, expires_at, employers(clinic_name, practice_type, website, city, province, about)")
    .eq("id", id)
    .eq("status", "live")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) console.error("Job lookup failed:", error.code, error.message);
  return (data as unknown as LiveJob | null) ?? null;
}

export async function listLiveJobIds(): Promise<{ id: string; posted_at: string }[]> {
  const db = supabasePublic();
  if (!db) return [];
  const { data } = await db.from("jobs").select("id, posted_at").eq("status", "live").gt("expires_at", new Date().toISOString()).order("posted_at", { ascending: false }).limit(1000);
  return data ?? [];
}

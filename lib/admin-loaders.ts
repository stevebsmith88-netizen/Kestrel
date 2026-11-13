// The database reads behind the admin pages (review item X-16), kept out of the pages so they can be tested against a stand in database
// (lib/admin-loaders.test.ts). Each takes the server key connection, since only admins reach these pages, or null when the database is not
// set up, and then returns empty lists. The review queue has its own file (lib/review-queue.ts). Kept free of app imports.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Supabase builder, or a stand in for it in the tests
type Db = { from(table: string): any };
type Row = Record<string, unknown>;

// ---- Outreach: leads with a published email that are not yet in the sequence, and everyone in it ----
export async function loadOutreach(db: Db | null) {
  if (!db) return { ready: [] as Row[], contacts: [] as Row[], leadError: null, contactError: null };
  const [{ data: leadRows, error: leadError }, { data: contactRows, error: contactError }] = await Promise.all([
    db.from("clinic_leads").select("id, clinic_name, city, province, contact_email, email_source_url").not("contact_email", "is", null).neq("status", "skipped").order("found_at", { ascending: false }).limit(300),
    db.from("outreach_contacts").select("id, email, clinic_name, steps_sent, status, stop_reason, next_due_at, last_sent_at").order("approved_at", { ascending: false }).limit(500),
  ]);
  const contacts = (contactRows ?? []) as Row[];
  // The same address is never added twice, whatever its capitals.
  const inSequence = new Set(contacts.map((c) => String(c.email).toLowerCase()));
  const ready = ((leadRows ?? []) as Row[]).filter((l) => !inSequence.has(String(l.contact_email).toLowerCase()));
  return { ready, contacts, leadError, contactError };
}

// ---- Waitlist: newest 500 with the total, and the source columns when the database has them (migration 0032) ----
const WAITLIST_BASE = "id, created_at, audience, first_name, last_name, email, clinic_name, role, province, unsubscribed_at, confirmed_at, confirmation_sent_at";
export async function loadWaitlist(db: Db | null) {
  if (!db) return { rows: [] as Row[], count: null as number | null };
  const load = (columns: string) => db.from("waitlist").select(columns, { count: "exact" }).order("created_at", { ascending: false }).limit(500);
  let result = await load(`${WAITLIST_BASE}, utm_source, utm_medium, utm_campaign, referrer_host, landing_path`);
  // Before migration 0032 is run, the list still shows, without the source column.
  if (result?.error) result = await load(WAITLIST_BASE);
  return { rows: (result?.data ?? []) as Row[], count: (result?.count ?? null) as number | null };
}

// ---- Post for a clinic: search clinics that have an account (an owner) by name ----
// Characters that would change the meaning of the search are turned into spaces.
export const clinicSearchPattern = (q: string) => {
  const search = q.trim().slice(0, 80);
  return search ? `%${search.replace(/[%,()]/g, " ")}%` : "%";
};
export async function loadClinicsForPosting(db: Db | null, q: string) {
  if (!db) return [] as Row[];
  const { data } = await db.from("employers").select("id, clinic_name, city, province, claimed").not("owner_id", "is", null).ilike("clinic_name", clinicSearchPattern(q)).order("clinic_name").limit(50);
  return (data ?? []) as Row[];
}
export async function loadClinicForPosting(db: Db | null, employerId: string) {
  if (!db) return null;
  const { data } = await db.from("employers").select("id, clinic_name, city, province").eq("id", employerId).maybeSingle();
  return (data ?? null) as Row | null;
}

// ---- Listing claims waiting for a decision, oldest first, with a live job of each clinic to look at ----
export async function loadClaims(db: Db | null) {
  const liveJobByEmployer: Record<string, string> = {};
  if (!db) return { claims: [] as Row[], liveJobByEmployer };
  const { data } = await db.from("listing_claims").select("id, claimant_name, claimant_email, role_at_clinic, method, note, verified_at, created_at, employers(id, clinic_name, website, city, province)").eq("status", "pending_review").order("created_at", { ascending: true });
  const claims = (data ?? []) as Row[];
  const employerIds = claims.map((c) => (c.employers as { id?: string } | null)?.id).filter(Boolean) as string[];
  if (employerIds.length) {
    const { data: jobs } = await db.from("jobs").select("id, employer_id").in("employer_id", employerIds).eq("status", "live");
    ((jobs ?? []) as { id: string; employer_id: string }[]).forEach((j) => { liveJobByEmployer[j.employer_id] = j.id; });
  }
  return { claims, liveJobByEmployer };
}

// ---- Reported jobs: open reports, oldest first ----
export async function loadReports(db: Db | null) {
  if (!db) return [] as Row[];
  const { data } = await db.from("job_reports").select("id, job_id, reason, details, reporter_email, created_at, jobs(title, status, city, province, employers(clinic_name))").eq("status", "open").order("created_at", { ascending: true });
  return (data ?? []) as Row[];
}

// ---- Found listings: the latest leads, the found jobs sorted into drafts, live and ended, and this admin's page reads in the last day ----
export async function loadFound(db: Db | null, userId: string, now: number = Date.now()) {
  const empty = { leads: [] as Row[], drafts: [] as Row[], live: [] as Row[], ended: [] as Row[], readsToday: 0, needsMigration: false };
  if (!db) return empty;
  const since = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const { data: leadRows } = await db.from("clinic_leads").select("id, clinic_name, province, city, job_title, website, contact_email, email_source_url, status, found_at").order("found_at", { ascending: false }).limit(100);
  const [{ data }, reads] = await Promise.all([
    db.from("jobs")
      .select("id, title, status, city, province, employment_type, pay_min, pay_max, pay_period, source_url, apply_url, found_at, posted_at, expires_at, updated_at, is_existing_vacancy, uses_ai_screening, description, employers(clinic_name, claimed, website)")
      .eq("is_seeded", true)
      .order("created_at", { ascending: false })
      .limit(200),
    // Searches are counted separately, so only page reads count towards the daily limit.
    db.from("page_reads").select("id", { count: "exact", head: true }).eq("read_by", userId).not("url", "like", "search:%").gte("read_at", since),
  ]);
  const jobs = (data ?? []) as Row[];
  const isLive = (j: Row) => j.status === "live" && j.expires_at !== null && j.expires_at !== undefined && new Date(String(j.expires_at)).getTime() > now;
  return {
    leads: (leadRows ?? []) as Row[],
    drafts: jobs.filter((j) => j.status === "draft"),
    live: jobs.filter(isLive),
    // A live job past its date counts as ended, even before the daily job marks it expired. The 20 most recent are shown.
    ended: jobs.filter((j) => j.status !== "draft" && !isLive(j)).slice(0, 20),
    readsToday: (reads?.count ?? 0) as number,
    needsMigration: Boolean(reads?.error),
  };
}

// ---- Email suppressions: the newest 500 ----
export async function loadSuppressions(db: Db | null) {
  if (!db) return [] as Row[];
  const { data } = await db.from("email_suppressions").select("id, address, reason, source, created_at").order("created_at", { ascending: false }).limit(500);
  return (data ?? []) as Row[];
}

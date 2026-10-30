import "server-only";
import { countIn, investorNumbers, percent, periodRange, ratio, topCounts, weeklyCounts, type JobRow, type Period } from "@/lib/admin-stats";
import { supabaseAdmin } from "@/lib/supabase-server";

type Db = NonNullable<ReturnType<typeof supabaseAdmin>>;

// Reads every row of a table a page at a time (the database returns at most 1,000 at once).
async function fetchAll<T>(db: Db, table: string, columns: string, filter?: (q: ReturnType<Db["from"]>["select"] extends (...a: never[]) => infer R ? R : never) => unknown): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const base = db.from(table).select(columns);
    const query = (filter ? filter(base as never) : base) as unknown as { range: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: unknown }> };
    const { data, error } = await query.range(from, from + 999);
    if (error || !data) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const head = async (db: Db, table: string, apply?: (q: never) => unknown) => {
  const base = db.from(table).select("*", { count: "exact", head: true });
  const { count, error } = (await (apply ? apply(base as never) : base)) as { count: number | null; error: unknown };
  return error ? null : count;
};

export type Stats = Awaited<ReturnType<typeof loadStats>>;

// Everything the admin numbers page shows, worked out from the database.
export async function loadStats(period: Period) {
  const db = supabaseAdmin();
  if (!db) return null;
  const range = periodRange(period);

  const [profiles, waitlist, employers, jobs, applications, candidateProfiles, inReview, openReports, pendingClaims] = await Promise.all([
    fetchAll<{ role: string; created_at: string }>(db, "profiles", "role, created_at"),
    fetchAll<{ created_at: string; confirmed_at: string | null; unsubscribed_at: string | null }>(db, "waitlist", "created_at, confirmed_at, unsubscribed_at"),
    fetchAll<{ id: string; claimed: boolean; owner_id: string | null; created_at: string }>(db, "employers", "id, claimed, owner_id, created_at"),
    fetchAll<JobRow & { id: string }>(db, "jobs", "id, employer_id, status, posted_at, province, created_at"),
    fetchAll<{ job_id: string; candidate_id: string; created_at: string }>(db, "applications", "job_id, candidate_id, created_at"),
    fetchAll<{ user_id: string; cv_path: string | null; profession: string | null }>(db, "candidate_profiles", "user_id, cv_path, profession"),
    head(db, "jobs", (q) => (q as { eq: (a: string, b: string) => unknown }).eq("status", "in_review")),
    head(db, "job_reports", (q) => (q as { eq: (a: string, b: string) => unknown }).eq("status", "open")),
    head(db, "listing_claims", (q) => (q as { eq: (a: string, b: string) => unknown }).eq("status", "pending_review")),
  ]);

  const candidates = profiles.filter((p) => p.role === "candidate");
  const clinicAccounts = profiles.filter((p) => p.role === "clinic");
  const live = jobs.filter((j) => j.status === "live");
  const published = jobs.map((j) => j.posted_at);
  const employerOfJob = new Map<string, string>();
  jobs.forEach((j) => employerOfJob.set(j.id, j.employer_id));

  const publishedNow = countIn(published, range.start, range.end);
  const publishedBefore = countIn(published, range.previousStart, range.previousEnd);
  const candidatesNow = countIn(candidates.map((c) => c.created_at), range.start, range.end);
  const candidatesBefore = countIn(candidates.map((c) => c.created_at), range.previousStart, range.previousEnd);
  const applicationsNow = countIn(applications.map((a) => a.created_at), range.start, range.end);
  const applicationsBefore = countIn(applications.map((a) => a.created_at), range.previousStart, range.previousEnd);
  const waitlistNow = countIn(waitlist.map((w) => w.created_at), range.start, range.end);
  const waitlistBefore = countIn(waitlist.map((w) => w.created_at), range.previousStart, range.previousEnd);

  const owned = employers.filter((e) => e.owner_id);
  const submitted = new Set(jobs.filter((j) => j.status !== "draft").map((j) => j.employer_id));
  const wentLive = new Set(jobs.filter((j) => j.posted_at).map((j) => j.employer_id));
  const gotApplication = new Set(applications.map((a) => employerOfJob.get(a.job_id)).filter(Boolean) as string[]);
  const ready = candidateProfiles.filter((c) => c.cv_path && c.profession).length;
  const applicants = new Set(applications.map((a) => a.candidate_id));

  return {
    period,
    asOf: new Date().toISOString(),
    liveJobs: live.length,
    publishedNow, publishedBefore,
    employers: employers.length,
    claimedEmployers: employers.filter((e) => e.claimed).length,
    foundEmployers: employers.filter((e) => !e.claimed).length,
    candidateAccounts: candidates.length, candidatesNow, candidatesBefore,
    clinicAccounts: clinicAccounts.length,
    applicationsTotal: applications.length, applicationsNow, applicationsBefore,
    applicationsPerLiveJob: ratio(applications.length, live.length),
    waitlistTotal: waitlist.length,
    waitlistConfirmed: waitlist.filter((w) => w.confirmed_at && !w.unsubscribed_at).length,
    waitlistNow, waitlistBefore,
    weekly: weeklyCounts(published, 12),
    byProvince: topCounts(live.map((j) => j.province), 4),
    clinicFunnel: [
      { label: "Clinic accounts", count: clinicAccounts.length },
      { label: "Set up a clinic profile", count: owned.length },
      { label: "Submitted a job", count: [...submitted].filter((id) => owned.some((e) => e.id === id)).length },
      { label: "Had a job go live", count: [...wentLive].filter((id) => owned.some((e) => e.id === id)).length },
      { label: "Received an application", count: [...gotApplication].filter((id) => owned.some((e) => e.id === id)).length },
    ],
    candidateFunnel: [
      { label: "Candidate accounts", count: candidates.length },
      { label: "Profile ready to apply (role and CV)", count: ready },
      { label: "Sent an application", count: applicants.size },
    ],
    investor: investorNumbers(jobs, live.length, applications.length),
    jobsInReview: inReview ?? 0,
    openReports: openReports ?? 0,
    pendingClaims: pendingClaims ?? 0,
    claimedShare: percent(employers.filter((e) => e.claimed).length, employers.length),
  };
}

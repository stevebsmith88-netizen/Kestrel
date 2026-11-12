import { readMyApplications } from "@/lib/my-applications";
import "server-only";
import { prefsFromProfile } from "@/lib/candidate-prefs";
import type { CandidateProfile } from "@/lib/candidate";
import { listLiveJobsForMatching, type JobSummary } from "@/lib/public-jobs";
import { hasWhere, recommend, type Recommendation } from "@/lib/recommend";
import { supabaseServer } from "@/lib/supabase/server";

export type RecommendationsView = {
  recs: Recommendation<JobSummary>[];
  needsRole: boolean; // no role chosen yet, so nothing can be suggested
  needsWhere: boolean; // suggestions are showing, but with no town or provinces chosen they are wider than they could be
};

// The signed in candidate's "Recommended for you" list. The rules are in lib/recommend.ts (no AI). Jobs they hid, and jobs they have
// already applied to, are left out.
export async function getRecommendations(profile: CandidateProfile | null, appliedJobIds: readonly string[]): Promise<RecommendationsView> {
  const prefs = prefsFromProfile(profile);
  if (!prefs.profession) return { recs: [], needsRole: true, needsWhere: false };
  const db = await supabaseServer();
  const [jobs, hiddenRows] = await Promise.all([
    listLiveJobsForMatching(),
    db ? db.from("candidate_job_hides").select("job_id") : Promise.resolve({ data: [] as { job_id: string }[] }),
  ]);
  const hidden = new Set((hiddenRows.data ?? []).map((r) => r.job_id));
  const recs = recommend(prefs, jobs, { hidden, applied: new Set(appliedJobIds) });
  return { recs, needsRole: false, needsWhere: !hasWhere(prefs) && prefs.licensedProvinces.length === 0 };
}

// The "For me" view on Find jobs: every job in the list that fits the candidate, best first. Same rules as above, with no limit on how many.
// Jobs they hid and jobs they have already applied to are left out. Returns null when no role is chosen yet, so the page shows every job.
export async function rankForMe(profile: CandidateProfile | null, jobs: readonly JobSummary[]): Promise<Recommendation<JobSummary>[] | null> {
  const prefs = prefsFromProfile(profile);
  if (!prefs.profession) return null;
  const db = await supabaseServer();
  const [hiddenRows, appliedRows] = await Promise.all([
    db ? db.from("candidate_job_hides").select("job_id") : Promise.resolve({ data: [] as { job_id: string }[] }),
    db ? readMyApplications<{ job_id: string }[]>(db, (source) => source.select("job_id")) : Promise.resolve({ data: [] as { job_id: string }[] }),
  ]);
  const hidden = new Set((hiddenRows.data ?? []).map((r) => r.job_id));
  const applied = new Set((appliedRows.data ?? []).map((r) => r.job_id));
  return recommend(prefs, jobs, { hidden, applied, max: Number.POSITIVE_INFINITY });
}

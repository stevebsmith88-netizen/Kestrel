import "server-only";
import { readyToApply } from "./profile-ready.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deliverEmail, type SendResult } from "@/lib/email";
import { dueStep, onboardingAddress, onboardingEmail, type Facts } from "@/lib/onboarding-emails";
import type { makeBudget } from "@/lib/send-budget";
import { unsubscribeIdUrl } from "@/lib/unsubscribe-link";

const DAY = 24 * 60 * 60 * 1000;
const chunks = <T,>(list: T[], size = 100) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// Reads in pieces, so a long list of ids never makes the address too long.
async function readIn<T>(admin: SupabaseClient, table: string, columns: string, column: string, ids: string[]): Promise<T[]> {
  const out: T[] = [];
  for (const part of chunks(ids)) {
    const { data } = await admin.from(table).select(columns).in(column, part);
    out.push(...((data ?? []) as unknown as T[]));
  }
  return out;
}

// Part of the daily job (app/api/cron/daily/route.ts), only while ENABLE_ONBOARDING_EMAILS is "yes". It looks at accounts opened in the
// last 12 days, works out what each person has done, and sends at most 1 first week email each, if one is due and still helps.
export async function runOnboarding(admin: SupabaseClient, ctx: { now: Date; budget: ReturnType<typeof makeBudget>; note: (r: SendResult) => boolean; outOfTime: () => boolean }) {
  const result = { sent: 0, heldBack: 0, problems: [] as string[] };
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, role, first_name, created_at")
    .in("role", ["candidate", "clinic"])
    .is("unsubscribed_at", null)
    .gte("created_at", new Date(ctx.now.getTime() - 12 * DAY).toISOString())
    .limit(500);
  if (error) {
    result.problems.push(`Reading new accounts: ${error.message}`);
    return result;
  }
  if (!profiles?.length) return result;

  const ids = profiles.map((p) => p.id as string);
  const clinicIds = profiles.filter((p) => p.role === "clinic").map((p) => p.id as string);
  const candidateIds = profiles.filter((p) => p.role === "candidate").map((p) => p.id as string);

  const sentRows = await readIn<{ user_id: string; step: string }>(admin, "onboarding_emails", "user_id, step", "user_id", ids);
  const sentBy = new Map<string, Set<string>>();
  sentRows.forEach((r) => sentBy.set(r.user_id, (sentBy.get(r.user_id) ?? new Set()).add(r.step)));

  const [cvProfiles, alerts, candApps, employers] = await Promise.all([
    readIn<{ user_id: string; cv_path: string | null; profession: string | null; home_city: string | null; home_province: string | null }>(admin, "candidate_profiles", "user_id, cv_path, profession, home_city, home_province", "user_id", candidateIds),
    readIn<{ user_id: string }>(admin, "job_alerts", "user_id", "user_id", candidateIds),
    readIn<{ candidate_id: string }>(admin, "applications", "candidate_id", "candidate_id", candidateIds),
    readIn<{ id: string; owner_id: string }>(admin, "employers", "id, owner_id", "owner_id", clinicIds),
  ]);
  const jobs = await readIn<{ id: string; employer_id: string; status: string; posted_at: string | null }>(admin, "jobs", "id, employer_id, status, posted_at", "employer_id", employers.map((e) => e.id));
  const clinicApps = await readIn<{ job_id: string }>(admin, "applications", "job_id", "job_id", jobs.map((j) => j.id));

  const employerOf = new Map(employers.map((e) => [e.owner_id, e.id]));
  const jobEmployer = new Map(jobs.map((j) => [j.id, j.employer_id]));
  const appsFor = new Map<string, number>();
  clinicApps.forEach((a) => {
    const emp = jobEmployer.get(a.job_id);
    if (emp) appsFor.set(emp, (appsFor.get(emp) ?? 0) + 1);
  });

  const factsFor = (p: { id: string; role: string }): Facts => {
    if (p.role === "clinic") {
      const emp = employerOf.get(p.id);
      const mine = emp ? jobs.filter((j) => j.employer_id === emp) : [];
      return { role: "clinic", hasProfile: Boolean(emp), hasSubmitted: mine.some((j) => j.status !== "draft"), hasLive: mine.some((j) => j.posted_at), applications: emp ? appsFor.get(emp) ?? 0 : 0 };
    }
    const cv = cvProfiles.find((c) => c.user_id === p.id);
    return { role: "candidate", profileReady: readyToApply(cv ?? null), hasAlert: alerts.some((a) => a.user_id === p.id), applications: candApps.filter((a) => a.candidate_id === p.id).length };
  };

  for (const p of profiles) {
    if (ctx.outOfTime()) break;
    const facts = factsFor(p);
    const step = dueStep({ createdAt: new Date(p.created_at), now: ctx.now, sent: sentBy.get(p.id) ?? new Set(), facts });
    if (!step) continue;
    if (!ctx.budget.take()) {
      result.heldBack += 1;
      break;
    }
    const { data: user } = await admin.auth.admin.getUserById(p.id);
    // Only an address the person has confirmed (P1-06).
    const email = onboardingAddress(user?.user);
    if (!email) {
      ctx.budget.refund();
      continue;
    }
    // Claim the step before sending, so a second copy of the daily job could never send the same email. Put it back if sending fails.
    const { error: claimError } = await admin.from("onboarding_emails").insert({ user_id: p.id, step });
    if (claimError) {
      ctx.budget.refund();
      if (!/duplicate|23505/.test(claimError.message + (claimError.code ?? ""))) result.problems.push(`Recording a first week email (has migration 0033 been run?): ${claimError.message}`);
      continue;
    }
    const unsubscribeUrl = unsubscribeIdUrl(p.id);
    const mail = onboardingEmail({ step, firstName: p.first_name ?? "", facts, unsubscribeUrl });
    const sent = await deliverEmail({ to: email, unsubscribeUrl, ...mail });
    if (ctx.note(sent)) result.sent += 1;
    else await admin.from("onboarding_emails").delete().eq("user_id", p.id).eq("step", step);
  }
  return result;
}

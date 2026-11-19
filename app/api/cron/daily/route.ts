import { timingSafeEqual } from "node:crypto";
import { POSTS } from "@/content/posts";
import { APP_LABELS } from "@/lib/applications";
import { DIGEST_GAP_HOURS, applicantDigestEmail, digestDue, jobEndingEmail } from "@/lib/clinic-emails";
import { SITE_URL, deliverEmail, emailLayout, type SendResult } from "@/lib/email";
import { longDate } from "@/lib/jobs";
import { ALERT_PAY_COLUMNS, alertLine, type AlertJob } from "@/lib/job-alert-text";
import { CLOSING_SOON_DAYS, alertHeading, alertSubject, closingLine, followedLine } from "@/lib/follows";
import { INTEREST_JOINED_BODY, INTEREST_JOINED_TITLE, matchPublicClinic } from "@/lib/clinic-interest";
import { employerHref } from "@/lib/clinic-pages";
import { listPublicClinics } from "@/lib/public-clinics";
import { withExpected } from "@/lib/expected-columns";
import { retentionCutoffs } from "@/lib/retention";
import type { PayFields } from "@/lib/job-pay";
import { notifyAdmin } from "@/lib/notify-admin";
import { sendDailyDigest, sendWaitingReminder } from "@/lib/slack-digest";
import { sendMilestones } from "@/lib/slack-milestones";
import { notifySlack } from "@/lib/notify-slack";
import { sendFoundingReminders } from "@/lib/founding-flow";
import { notify } from "@/lib/notifications";
import { applicationNoUpdate, closedAfterTalksText } from "@/lib/notify-text";
import { submitToIndexNow } from "@/lib/indexnow";
import { recentlyChangedPages } from "@/lib/page-dates";
import { runOnboarding } from "@/lib/onboarding-run";
import { onboardingOn, outreachDailyLimit, outreachOn } from "@/lib/features";
import { nextDueAt, outreachSequenceEmail, sameClinicPattern, stopReason } from "@/lib/outreach-sequence";
import { addressUnsubscribeUrl, isSuppressed } from "@/lib/suppression";
import { candidateRecipient } from "@/lib/recipient";
import { budgetAfterClicks, dailyBudget, makeBudget } from "@/lib/send-budget";
import { emailsSentToday } from "@/lib/email-count";
import { supabaseAdmin } from "@/lib/supabase-server";
import { unsubscribeIdUrl } from "@/lib/unsubscribe-link";
import { maintenanceApiResponse } from "@/lib/maintenance";
import { refreshJobPages } from "@/lib/job-cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const TIME_LIMIT = 50_000; // stop starting new work after 50 of the 60 seconds, and leave the rest for tomorrow
const chunks = <T,>(list: T[], size = 100) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// Runs once a day (see vercel.json). It:
//  1. marks live jobs that have passed their 30 days as expired,
//  2. tells clinics when a job closes in 3 days, asking whether it is filled (and how) or offering 30 more days,
//  3. closes out applications still waiting on a job that ended a week ago, and those at Interview or Offer on a job that
//     ran out 14 days ago without being marked filled, so candidates are never left waiting,
//  4. reminds clinics about applications they have not opened for 14 days,
//     and sends the summary email to clinics who chose one every 2 to 3 days or weekly,
//  5. emails candidates one digest of new jobs that match their job alerts,
//     then sends the clinic outreach emails that are due (only while ENABLE_OUTREACH is "yes"),
//     and, while ENABLE_ONBOARDING_EMAILS is "yes", the first week emails for new accounts,
//  6. tells Steve about anything that has waited more than a day for him.
// Vercel sends the secret in the Authorization header, so nobody else can trigger it.
// Only one run can go at a time, it sends no more than the day's email budget, and it records when it last finished well,
// so the health check (and the uptime monitor) can notice a missed day.
export async function GET(request: Request) {
  const stopped = maintenanceApiResponse();
  if (stopped) return stopped;
  try {
    return await runDaily(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Daily job crashed:", message);
    await notifyAdmin("The daily housekeeping job failed", ["It stopped with this error:", message.slice(0, 300)]);
    // Slack too, so a failed day is seen on the phone. Best effort.
    await notifySlack("The daily housekeeping job failed", ["It stopped with this error:", message.slice(0, 300)], { path: "/admin", text: "Open the admin dashboard" }, "daily").catch(() => undefined);
    return new Response("Failed", { status: 500 });
  }
}

async function runDaily(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  // Compared in constant time, so the secret cannot be guessed from how long the answer takes. No secret set means nobody gets in.
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) return new Response("Unauthorized", { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return new Response("Not available", { status: 503 });

  const started = Date.now();
  const outOfTime = () => Date.now() - started > TIME_LIMIT;
  const now = new Date();
  const summary = { expiredJobs: 0, closingSoonEmails: 0, closedOutApplications: 0, reminders: 0, applicantSummaries: 0, alertsSent: 0, interestTold: 0, onboardingSent: 0, indexNowSent: 0, outreachSent: 0, outreachStopped: 0, emailsFailed: 0, emailsHeldBack: 0 };
  const problems: string[] = [];

  // Only one run at a time. If two copies started together, every email would go twice.
  const { data: gotLock, error: lockError } = await admin.rpc("claim_job_run", { p_name: "daily", p_minutes: 15 });
  if (lockError) problems.push(`Run lock unavailable (has migration 0020 been run?): ${lockError.message}`);
  else if (gotLock === false) return Response.json({ ok: true, skipped: "another run is already going" });

  // What button presses have already sent today comes off the budget first, so the day's total stays within it (P1-24).
  const budget = makeBudget(budgetAfterClicks(dailyBudget(), await emailsSentToday(admin)));
  // Counts what happened to each send. Skipped (do not email list, no key) is deliberate and costs nothing.
  const note = (result: SendResult) => {
    if (result === "failed") summary.emailsFailed += 1;
    if (result === "skipped") budget.refund();
    return result === "sent";
  };

  // 1. Expire jobs. The public pages already stop showing them the moment they pass their date.
  const { data: expired, error: expireError } = await admin.from("jobs").update({ status: "expired" }).eq("status", "live").lt("expires_at", now.toISOString()).select("id");
  if (expireError) problems.push(`Expiring jobs: ${expireError.message}`);
  summary.expiredJobs = expired?.length ?? 0;
  // Saved job pages and province and role pages are cleared, so an expired job disappears at once (audit P1-10).
  if (expired?.length) refreshJobPages();

  // 1b. Tell search engines (IndexNow) about jobs that went live or ended in the last day, blog posts dated in that time, and pages whose
  // last updated date is new (lib/page-dates.ts), so Bing
  // does not have to wait to find them. Does nothing until INDEXNOW_KEY is set, and a failure here never stops the rest of the job.
  {
    const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";
    const since = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();
    const { data: fresh } = await admin.from("jobs").select("id").eq("status", "live").or(`posted_at.gte.${since},updated_at.gte.${since}`).limit(500);
    const ids = [...new Set([...(fresh ?? []).map((j) => j.id as string), ...(expired ?? []).map((j) => j.id as string)])];
    const today = now.toISOString().slice(0, 10);
    const dayAgo = new Date(now.getTime() - DAY).toISOString().slice(0, 10);
    const posts = POSTS.filter((p) => p.date >= dayAgo && p.date <= today).map((p) => `${SITE}/blog/${p.slug}`);
    const pinged = await submitToIndexNow([...ids.map((id) => `${SITE}/jobs/${id}`), ...posts, ...recentlyChangedPages(SITE, now)]);
    summary.indexNowSent = pinged.sent;
  }

  // 2. Tell clinics a job closes in 3 days, once.
  const { data: closing, error: closingError } = await admin
    .from("jobs")
    .select("id, title, employer_id, expires_at")
    .eq("status", "live")
    .eq("is_seeded", false)
    .is("expiry_reminded_at", null)
    .gt("expires_at", now.toISOString())
    .lte("expires_at", new Date(now.getTime() + 3 * DAY).toISOString())
    .limit(200);
  if (closingError) problems.push(`Reading jobs that close soon: ${closingError.message}`);
  for (const job of closing ?? []) {
    if (outOfTime()) break;
    const { data: contact } = await admin.from("employer_contacts").select("notify_email, notify_reminders").eq("employer_id", job.employer_id).maybeSingle();
    if (!contact?.notify_email || contact.notify_reminders === false) {
      await admin.from("jobs").update({ expiry_reminded_at: now.toISOString() }).eq("id", job.id);
      continue;
    }
    if (!budget.take()) {
      summary.emailsHeldBack += 1;
      continue;
    }
    const mail = jobEndingEmail({ title: job.title, jobId: job.id, endsLabel: longDate(job.expires_at) });
    if (note(await deliverEmail({ to: contact.notify_email, ...mail }))) {
      await admin.from("jobs").update({ expiry_reminded_at: now.toISOString() }).eq("id", job.id);
      summary.closingSoonEmails += 1;
    }
  }

  // 3. Applications still waiting on a job that ended a week or more ago. Then (review item X-04) people at Interview or Offer on a job
  // that ended 14 days or more ago, so nobody is left at Interview for ever. Those get kinder words. A job the clinic marked as filled is
  // left out of the second group: the clinic chose then who to close, and "Don't close this one yet" is its call to keep.
  const closeOutGroups = [
    { statuses: ["applied", "viewed", "shortlisted"], days: 7, afterTalks: false, onlyUnfilled: false },
    { statuses: ["interview", "offer"], days: 14, afterTalks: true, onlyUnfilled: true },
  ] as const;
  for (const group of closeOutGroups) {
  let endedQuery = admin.from("jobs").select("id").in("status", ["expired", "closed"]).lt("updated_at", new Date(now.getTime() - group.days * DAY).toISOString());
  if (group.onlyUnfilled) endedQuery = endedQuery.is("filled_at", null);
  const { data: ended } = await endedQuery;
  for (const ids of chunks((ended ?? []).map((j) => j.id))) {
    const { data: waiting } = await admin.from("applications").select("id, applicant, job_title, clinic_name, candidate_id").in("job_id", ids).in("status", [...group.statuses]);
    for (const app of waiting ?? []) {
      if (outOfTime()) break;
      const { email, wants } = await candidateRecipient(admin, app.candidate_id, (app.applicant as { email?: string } | null)?.email);
      const sendIt = Boolean(email && wants);
      // If the day's budget is spent, leave it for tomorrow rather than closing it out without telling the candidate.
      if (sendIt && !budget.take()) {
        summary.emailsHeldBack += 1;
        continue;
      }
      const stamp = new Date().toISOString();
      await admin.from("applications").update({ status: "no_update", status_changed_at: stamp, updated_at: stamp }).eq("id", app.id);
      await admin.from("application_events").insert({ application_id: app.id, status: "no_update" });
      summary.closedOutApplications += 1;
      // The inbox message goes whether or not the email does, as it does when a clinic moves an application (lib/applicant-actions.ts).
      await notify(admin, app.candidate_id, applicationNoUpdate({ jobTitle: app.job_title, clinicName: app.clinic_name, label: APP_LABELS.no_update, applicationId: app.id, afterTalks: group.afterTalks }));
      if (sendIt && email) {
        const mail = emailLayout({
          heading: "An update on your application",
          paragraphs: group.afterTalks
            ? [`Your application for ${app.job_title} is now marked: ${APP_LABELS.no_update}.`, closedAfterTalksText(app.clinic_name), "We would love to help you find the next one."]
            : [`The job you applied for, ${app.job_title} at ${app.clinic_name}, has closed, and the clinic did not send a decision. Your application is now marked: ${APP_LABELS.no_update}.`, "Thank you for applying. We would love to help you find the next one."],
          buttonText: "Find more jobs",
          buttonUrl: `${SITE_URL}/jobs`,
        });
        note(await deliverEmail({ to: email, subject: `Update on your application: ${app.job_title}`, ...mail }));
      }
    }
  }
  }

  // 4. Reminders for applications unopened for 14 days, one email per clinic.
  const { data: stale } = await admin.from("applications").select("id, job_id").eq("status", "applied").is("reminded_at", null).lt("created_at", new Date(now.getTime() - 14 * DAY).toISOString());
  if (stale?.length) {
    const jobIds = [...new Set(stale.map((a) => a.job_id))];
    const employerOf = new Map<string, string>();
    for (const ids of chunks(jobIds)) {
      const { data: jobs } = await admin.from("jobs").select("id, employer_id").in("id", ids);
      (jobs ?? []).forEach((j) => employerOf.set(j.id, j.employer_id));
    }
    const perEmployer = new Map<string, string[]>();
    stale.forEach((a) => {
      const emp = employerOf.get(a.job_id);
      if (emp) perEmployer.set(emp, [...(perEmployer.get(emp) ?? []), a.id]);
    });
    for (const [employerId, appIds] of perEmployer) {
      if (outOfTime()) break;
      const { data: contact } = await admin.from("employer_contacts").select("notify_email, notify_reminders").eq("employer_id", employerId).maybeSingle();
      if (!contact?.notify_email || contact.notify_reminders === false) continue;
      if (!budget.take()) {
        summary.emailsHeldBack += 1;
        continue;
      }
      const mail = emailLayout({
        heading: "Applications are waiting for you",
        paragraphs: [`${appIds.length === 1 ? "An application has" : `${appIds.length} applications have`} been waiting for 2 weeks without being opened. A quick look lets candidates know where they stand, and it only takes a moment.`],
        buttonText: "Open your dashboard",
        buttonUrl: `${SITE_URL}/clinic`,
      });
      if (note(await deliverEmail({ to: contact.notify_email, subject: "Applications are waiting for you", ...mail }))) {
        await admin.from("applications").update({ reminded_at: new Date().toISOString() }).in("id", appIds);
        summary.reminders += 1;
      }
    }
  }

  // 4b. Summary emails for clinics who chose "every 2 to 3 days" or "weekly" instead of one email per application.
  const { data: digestContacts, error: digestError } = await admin
    .from("employer_contacts")
    .select("employer_id, notify_email, notify_frequency, last_digest_at")
    .in("notify_frequency", ["few_days", "weekly"])
    .order("last_digest_at", { ascending: true, nullsFirst: true })
    .limit(500);
  if (digestError) problems.push(`Applicant summaries could not run (has migration 0022 been run?): ${digestError.message}`);
  for (const c of digestContacts ?? []) {
    if (outOfTime()) break;
    if (!c.notify_email) continue;
    const frequency = c.notify_frequency as "few_days" | "weekly";
    const gapHours = DIGEST_GAP_HOURS[frequency];
    const last = c.last_digest_at ? new Date(c.last_digest_at) : null;
    if (!digestDue(frequency, last, now)) continue;
    const since = (last ?? new Date(now.getTime() - gapHours * 60 * 60 * 1000)).toISOString();
    const { data: theirJobs } = await admin.from("jobs").select("id, title").eq("employer_id", c.employer_id);
    if (!theirJobs?.length) continue;
    const { data: fresh } = await admin.from("applications").select("job_id").in("job_id", theirJobs.map((j) => j.id)).gt("created_at", since);
    if (!fresh?.length) continue;
    const counts = new Map<string, number>();
    fresh.forEach((a) => counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1));
    const jobs = theirJobs.filter((j) => counts.has(j.id)).map((j) => ({ title: j.title, count: counts.get(j.id) ?? 0 }));
    if (!budget.take()) {
      summary.emailsHeldBack += 1;
      continue;
    }
    if (note(await deliverEmail({ to: c.notify_email, ...applicantDigestEmail({ jobs }) }))) {
      await admin.from("employer_contacts").update({ last_digest_at: now.toISOString() }).eq("employer_id", c.employer_id);
      summary.applicantSummaries += 1;
    }
  }

  // 5. Job alerts. Each person gets at most one email a day, covering the alerts that are due (daily, weekly or monthly).
  // Read in pages (the database hands back at most 1,000 rows at a time), longest waiting first so nobody is always last.
  type AlertRow = { id: string; user_id: string; role_category: string | null; province: string | null; practice_type: string | null; frequency: string; last_sent_at: string };
  const alerts: AlertRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("job_alerts")
      .select("id, user_id, role_category, province, practice_type, frequency, last_sent_at")
      .order("last_sent_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      problems.push(`Reading job alerts: ${error.message}`);
      break;
    }
    alerts.push(...((data ?? []) as AlertRow[]));
    if ((data?.length ?? 0) < 1000) break;
  }
  // A little under the full gap, so the once a day schedule never skips a turn.
  const GAP_HOURS: Record<string, number> = { daily: 20, weekly: 7 * 24 - 4, monthly: 30 * 24 - 4 };
  const due = alerts.filter((a) => now.getTime() - new Date(a.last_sent_at).getTime() >= (GAP_HOURS[a.frequency] ?? GAP_HOURS.weekly) * 60 * 60 * 1000);
  const byUser = new Map<string, AlertRow[]>();
  due.forEach((a) => byUser.set(a.user_id, [...(byUser.get(a.user_id) ?? []), a]));
  // Clinics and companies a candidate follows (migration 0057) are folded into the same daily email, so nobody gets more than 1 a day.
  // `last_sent_at` starts the moment they follow, so they hear only about jobs posted after that. Before the SQL is run this just finds nothing.
  type FollowRow = { user_id: string; employer_id: string; last_sent_at: string };
  const followRows: FollowRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from("employer_follows").select("user_id, employer_id, last_sent_at").order("last_sent_at", { ascending: true }).order("user_id", { ascending: true }).order("employer_id", { ascending: true }).range(from, from + 999);
    if (error) {
      problems.push(`Reading follows (has migration 0057 been run?): ${error.message}`);
      break;
    }
    followRows.push(...((data ?? []) as FollowRow[]));
    if ((data?.length ?? 0) < 1000) break;
  }
  const followsByUser = new Map<string, FollowRow[]>();
  followRows
    .filter((f) => now.getTime() - new Date(f.last_sent_at).getTime() >= GAP_HOURS.daily * 60 * 60 * 1000)
    .forEach((f) => followsByUser.set(f.user_id, [...(followsByUser.get(f.user_id) ?? []), f]));
  // Saved jobs that end within 3 days, for candidates who have not applied (migration 0059). Each is mentioned once, in the same daily email.
  type ClosingRow = { user_id: string; job_id: string; jobs: (PayFields & { id: string; title: string; province: string; city: string; employers: { clinic_name: string } | null }) | null };
  const closingByUser = new Map<string, ClosingRow[]>();
  {
    const soon = new Date(now.getTime() + CLOSING_SOON_DAYS * DAY).toISOString();
    const { data: closingRows, error: closingError } = await admin
      .from("saved_jobs")
      .select(`user_id, job_id, jobs!inner(id, title, province, city, status, expires_at, ${ALERT_PAY_COLUMNS}, employers(clinic_name))`)
      .is("reminded_at", null)
      .eq("jobs.status", "live")
      .gt("jobs.expires_at", now.toISOString())
      .lte("jobs.expires_at", soon)
      .limit(2000);
    if (closingError) problems.push(`Reading saved jobs that are closing (has migration 0059 been run?): ${closingError.message}`);
    ((closingRows ?? []) as unknown as ClosingRow[]).forEach((c) => closingByUser.set(c.user_id, [...(closingByUser.get(c.user_id) ?? []), c]));
  }
  const alertUsers = new Set([...byUser.keys(), ...followsByUser.keys(), ...closingByUser.keys()]);
  let leftForTomorrow = 0;
  for (const userId of alertUsers) {
    const mine = byUser.get(userId) ?? [];
    const myFollows = followsByUser.get(userId) ?? [];
    if (outOfTime()) {
      leftForTomorrow += 1;
      continue;
    }
    const { data: profile } = await admin.from("profiles").select("unsubscribed_at").eq("id", userId).maybeSingle();
    if (!profile || profile.unsubscribed_at) continue;
    const found = new Map<string, AlertJob>();
    for (const alert of mine) {
      let query = admin
        .from("jobs")
        .select(await withExpected(`id, title, province, city, ${ALERT_PAY_COLUMNS}, employers!inner(clinic_name, practice_type)`))
        .eq("status", "live")
        .gt("expires_at", now.toISOString())
        .gt("posted_at", alert.last_sent_at)
        .order("posted_at", { ascending: false })
        .limit(20);
      if (alert.role_category) query = query.eq("role_category", alert.role_category);
      if (alert.province) query = query.eq("province", alert.province);
      if (alert.practice_type) query = query.eq("employers.practice_type", alert.practice_type);
      const { data: jobs } = await query;
      for (const job of (jobs ?? []) as unknown as (PayFields & { id: string; title: string; province: string; city: string; employers: { clinic_name: string } | null })[]) {
        found.set(job.id, { ...job, title: job.title, clinic: job.employers?.clinic_name ?? "", place: `${job.city}, ${job.province}` });
      }
    }
    // Jobs from places this person follows, posted since they followed (or since they were last emailed).
    const followedFound = new Set<string>();
    if (myFollows.length) {
      const oldest = myFollows.reduce((min, f) => (f.last_sent_at < min ? f.last_sent_at : min), myFollows[0].last_sent_at);
      const { data: followedJobs } = await admin
        .from("jobs")
        .select(await withExpected(`id, title, province, city, employer_id, posted_at, ${ALERT_PAY_COLUMNS}, employers!inner(clinic_name, practice_type)`))
        .eq("status", "live")
        .gt("expires_at", now.toISOString())
        .gt("posted_at", oldest)
        .in("employer_id", myFollows.map((f) => f.employer_id))
        .order("posted_at", { ascending: false })
        .limit(40);
      for (const job of (followedJobs ?? []) as unknown as (PayFields & { id: string; title: string; province: string; city: string; employer_id: string; posted_at: string; employers: { clinic_name: string } | null })[]) {
        const since = myFollows.find((f) => f.employer_id === job.employer_id)?.last_sent_at;
        if (!since || job.posted_at <= since) continue;
        if (!found.has(job.id)) {
          found.set(job.id, { ...job, title: job.title, clinic: job.employers?.clinic_name ?? "", place: `${job.city}, ${job.province}` });
          followedFound.add(job.id);
        }
      }
    }
    // Saved jobs about to close, unless the person has already applied to them (or they are in the list above anyway).
    const closingFound = new Map<string, AlertJob>();
    const myClosing = closingByUser.get(userId) ?? [];
    if (myClosing.length) {
      const { data: appliedRows } = await admin.from("applications").select("job_id").eq("candidate_id", userId).in("job_id", myClosing.map((c) => c.job_id));
      const appliedIds = new Set((appliedRows ?? []).map((a) => a.job_id as string));
      for (const c of myClosing) {
        if (!c.jobs || appliedIds.has(c.job_id) || found.has(c.job_id)) continue;
        closingFound.set(c.job_id, { ...c.jobs, title: c.jobs.title, clinic: c.jobs.employers?.clinic_name ?? "", place: `${c.jobs.city}, ${c.jobs.province}` });
      }
    }
    if (found.size === 0 && closingFound.size === 0) continue;
    const { data: user } = await admin.auth.admin.getUserById(userId);
    const email = user?.user?.email;
    if (!email) continue;
    if (!budget.take()) {
      summary.emailsHeldBack += 1;
      continue;
    }
    // Claim these alerts before emailing, so a second copy of this job could never send the same email. Put them back if it fails.
    const stamp = now.toISOString();
    const claims = await Promise.all([
      ...mine.map((a) => admin.from("job_alerts").update({ last_sent_at: stamp }).eq("id", a.id).eq("last_sent_at", a.last_sent_at).select("id")),
      ...myFollows.map((f) => admin.from("employer_follows").update({ last_sent_at: stamp }).eq("user_id", f.user_id).eq("employer_id", f.employer_id).eq("last_sent_at", f.last_sent_at).select("user_id")),
      ...[...closingFound.keys()].map((jobId) => admin.from("saved_jobs").update({ reminded_at: stamp }).eq("user_id", userId).eq("job_id", jobId).is("reminded_at", null).select("job_id")),
    ]);
    const putBack = () => Promise.all([
      ...mine.map((a) => admin.from("job_alerts").update({ last_sent_at: a.last_sent_at }).eq("id", a.id).eq("last_sent_at", stamp)),
      ...myFollows.map((f) => admin.from("employer_follows").update({ last_sent_at: f.last_sent_at }).eq("user_id", f.user_id).eq("employer_id", f.employer_id).eq("last_sent_at", stamp)),
      ...[...closingFound.keys()].map((jobId) => admin.from("saved_jobs").update({ reminded_at: null }).eq("user_id", userId).eq("job_id", jobId).eq("reminded_at", stamp)),
    ]);
    if (claims.some((c) => c.error || !c.data?.length)) {
      await putBack();
      budget.refund();
      continue;
    }
    const unsubscribeUrl = unsubscribeIdUrl(userId);
    const mail = emailLayout({
      heading: alertHeading(found.size + closingFound.size, followedFound.size, closingFound.size),
      paragraphs: [
        found.size ? "Here is what has been posted since we last emailed you." : "A job you saved is about to end.",
        ...(followedFound.size ? ["Jobs marked \"From a place you follow\" come from clinics and companies you follow. You can change who you follow under Job alerts in your account."] : []),
        ...(closingFound.size ? [`Jobs marked "Closing soon" are ones you saved that end within ${CLOSING_SOON_DAYS} days. You can apply from Saved jobs in your account.`] : []),
      ],
      items: [
        ...[...closingFound].map(([id, j]) => ({ text: closingLine(alertLine(j)), url: `${SITE_URL}/jobs/${id}` })),
        ...[...found].map(([id, j]) => ({ text: followedFound.has(id) ? followedLine(alertLine(j)) : alertLine(j), url: `${SITE_URL}/jobs/${id}` })),
      ].slice(0, 15),
      buttonText: "See all jobs",
      buttonUrl: `${SITE_URL}/jobs`,
      unsubscribeUrl,
    });
    if (note(await deliverEmail({ to: email, subject: alertSubject(found.size + closingFound.size, followedFound.size, closingFound.size), unsubscribeUrl, ...mail }))) {
      summary.alertsSent += 1;
    } else {
      await putBack();
    }
  }

  // 5d. Tell candidates when a clinic or company they asked about has joined (migration 0058). The "tell us you would like to work for them"
  // form promises it. Each request is claimed before anything is sent, so nobody is told twice, and the clinic is never told who asked.
  if (!outOfTime()) {
    const { data: waiting, error: waitingError } = await admin.from("employer_interest").select("id, candidate_id, name_key, province").is("notified_at", null).order("created_at", { ascending: true }).limit(500);
    if (waitingError) problems.push(`Reading clinic requests (has migration 0058 been run?): ${waitingError.message}`);
    else if (waiting?.length) {
      const { clinics, slugs } = await listPublicClinics();
      for (const row of waiting) {
        if (outOfTime()) break;
        const match = matchPublicClinic(row as { name_key: string; province: string | null }, clinics);
        const slug = match ? slugs.get(match.id) : null;
        if (!match || !slug) continue;
        const { data: claimed } = await admin.from("employer_interest").update({ notified_at: now.toISOString(), notified_employer_id: match.id }).eq("id", row.id).is("notified_at", null).select("id");
        if (!claimed?.length) continue;
        const href = employerHref(slug, match.practice_type);
        await notify(admin, row.candidate_id, { kind: "clinic_joined", title: INTEREST_JOINED_TITLE(match.clinic_name), body: INTEREST_JOINED_BODY, href });
        const [{ email, wants }, { data: asker }] = await Promise.all([candidateRecipient(admin, row.candidate_id), admin.from("profiles").select("unsubscribed_at").eq("id", row.candidate_id).maybeSingle()]);
        if (!email || !wants || asker?.unsubscribed_at) continue;
        if (!budget.take()) {
          summary.emailsHeldBack += 1;
          continue;
        }
        const mail = emailLayout({ heading: INTEREST_JOINED_TITLE(match.clinic_name), paragraphs: [INTEREST_JOINED_BODY], buttonText: "See their page", buttonUrl: `${SITE_URL}${href}` });
        if (note(await deliverEmail({ to: email, subject: INTEREST_JOINED_TITLE(match.clinic_name), ...mail }))) summary.interestTold += 1;
      }
    }
  }

  // 5c. First week emails for new accounts (day 1, 3 and 7), only while ENABLE_ONBOARDING_EMAILS is "yes". At most 1 each a day.
  if (onboardingOn() && !outOfTime()) {
    const onboarding = await runOnboarding(admin, { now, budget, note, outOfTime });
    summary.onboardingSent = onboarding.sent;
    summary.emailsHeldBack += onboarding.heldBack;
    problems.push(...onboarding.problems);
  }

  // 5a. Clinic outreach sequence, only while it is switched on. Each clinic was added by Steve on the Outreach page.
  // Before every email, it checks the clinic has not unsubscribed, joined or claimed a listing, and stops if so.
  if (outreachOn()) {
    let outreachLeft = outreachDailyLimit();
    const { data: due, error: dueError } = await admin
      .from("outreach_contacts")
      .select("id, email, clinic_name, steps_sent")
      .eq("status", "active")
      .lte("next_due_at", now.toISOString())
      .order("next_due_at", { ascending: true })
      .limit(200);
    if (dueError) problems.push(`Reading outreach (has migration 0029 been run?): ${dueError.message}`);
    for (const contact of due ?? []) {
      if (outOfTime() || outreachLeft <= 0) break;
      const sameClinic = sameClinicPattern(contact.email);
      const [suppressed, onWaitlist, hasAccount, claimed] = await Promise.all([
        isSuppressed(contact.email),
        admin.from("waitlist").select("id", { count: "exact", head: true }).eq("email", contact.email).then((r) => (r.count ?? 0) > 0),
        admin.from("employer_contacts").select("employer_id", { count: "exact", head: true }).ilike("notify_email", sameClinic).then((r) => (r.count ?? 0) > 0),
        admin.from("listing_claims").select("id", { count: "exact", head: true }).ilike("claimant_email", sameClinic).then((r) => (r.count ?? 0) > 0),
      ]);
      const stop = stopReason({ suppressed, onWaitlist, hasAccount, claimed });
      if (stop) {
        await admin.from("outreach_contacts").update({ status: "stopped", stop_reason: stop, next_due_at: null, updated_at: now.toISOString() }).eq("id", contact.id);
        summary.outreachStopped += 1;
        continue;
      }
      if (!budget.take()) {
        summary.emailsHeldBack += 1;
        break;
      }
      const step = contact.steps_sent + 1;
      const mail = outreachSequenceEmail({ step, clinicName: contact.clinic_name, unsubscribeUrl: addressUnsubscribeUrl(contact.email) });
      const result = await deliverEmail({ to: contact.email, unsubscribeUrl: addressUnsubscribeUrl(contact.email), ...mail });
      if (!note(result)) continue;
      outreachLeft -= 1;
      const sentAt = new Date();
      const next = nextDueAt(step, sentAt);
      await admin
        .from("outreach_contacts")
        .update({ steps_sent: step, last_sent_at: sentAt.toISOString(), next_due_at: next?.toISOString() ?? null, status: next ? "active" : "finished", updated_at: sentAt.toISOString() })
        .eq("id", contact.id);
      await admin.from("outreach_sends").insert({ contact_id: contact.id, step, subject: mail.subject });
      summary.outreachSent += 1;
    }
  }

  // 5b. Found listings tool: forget the copy check numbers of careers pages read more than 30 days ago. The record of
  // where and when each page was read stays.
  const { error: printError } = await admin.from("page_reads").update({ fingerprint: null }).not("fingerprint", "is", null).lt("read_at", new Date(now.getTime() - 30 * DAY).toISOString());
  if (printError) problems.push(`Clearing old page readings (has migration 0023 been run?): ${printError.message}`);

  // 6. Anything waiting for Steve for more than a day.
  const dayAgo = new Date(now.getTime() - DAY).toISOString();
  const [waitingJobs, waitingClaims, openReports] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "in_review").lt("updated_at", dayAgo),
    admin.from("listing_claims").select("id", { count: "exact", head: true }).eq("status", "pending_review").lt("created_at", dayAgo),
    admin.from("job_reports").select("id", { count: "exact", head: true }).eq("status", "open").lt("created_at", dayAgo),
  ]);
  const waiting = [
    waitingJobs.count ? `${waitingJobs.count} job${waitingJobs.count === 1 ? "" : "s"} waiting for review` : "",
    waitingClaims.count ? `${waitingClaims.count} listing claim${waitingClaims.count === 1 ? "" : "s"} waiting for a decision` : "",
    openReports.count ? `${openReports.count} report${openReports.count === 1 ? "" : "s"} about a job still open` : "",
  ].filter(Boolean);
  if (waiting.length) await notifyAdmin("Waiting for you for more than a day", [...waiting.map((w) => `${w}.`), "Clinics and candidates are waiting on these."], "/admin/review");

  if (summary.emailsHeldBack > 0 || leftForTomorrow > 0) {
    await notifyAdmin("The daily job held some work back until tomorrow", [
      summary.emailsHeldBack > 0 ? `${summary.emailsHeldBack} emails were held back to stay within today's send budget (${budget.limit} were left for the daily job after the emails people's clicks had already sent).` : "",
      leftForTomorrow > 0 ? `${leftForTomorrow} people's job alerts ran out of time and wait for tomorrow.` : "",
      "If this keeps happening, raise DAILY_EMAIL_BUDGET and check the Resend plan.",
    ].filter(Boolean));
  }
  if (summary.emailsFailed > 0) problems.push(`${summary.emailsFailed} emails could not be sent. Check the Resend dashboard.`);

  // Tidy the sign in guard's counts. Anything older than a day has long since run out. A problem here is logged, not alerted.
  const { error: attemptsError } = await admin.from("sign_in_attempts").delete().lt("window_started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (attemptsError) console.error("Clearing old sign in attempts:", attemptsError.code, attemptsError.message);

  // Delete what has passed its retention period (lib/retention.ts, and "How long we keep it" in the privacy policy). Reports and claims still
  // waiting for a decision are kept. A problem here is logged, not alerted, and is tried again the next day.
  const cut = retentionCutoffs(now);
  const retention = await Promise.all([
    admin.from("waitlist").delete().is("confirmed_at", null).lt("created_at", cut.unconfirmedWaitlist),
    admin.from("notifications").delete().lt("created_at", cut.inboxMessages),
    admin.from("job_reports").delete().neq("status", "open").lt("created_at", cut.reportsAndClaims),
    admin.from("listing_claims").delete().neq("status", "pending_review").lt("created_at", cut.reportsAndClaims),
  ]);
  for (const r of retention) if (r.error) console.error("Retention clean up:", r.error.code, r.error.message);
  // Help requests and feedback once done (0046), and the record of changes Kestrel made for a clinic (0045), after 2 years. On a database
  // without those tables this is only logged.
  for (const r of await Promise.all([
    admin.from("support_requests").delete().eq("status", "done").lt("created_at", cut.supportAndAdminRecords),
    admin.from("admin_actions").delete().lt("created_at", cut.supportAndAdminRecords),
  ])) if (r.error) console.error("Retention clean up (help and admin records):", r.error.code, r.error.message);
  // Applications kept for the candidate after the clinic left (migration 0044), 2 years on, with the copy of the resume sent with each.
  // On a database without 0044 the column is missing, and this is only logged.
  const { data: oldKept, error: keptError } = await admin.from("applications").select("id, cv_path").is("job_id", null).lt("clinic_left_at", cut.applicationsAfterClinicLeft).limit(500);
  if (keptError) console.error("Retention clean up (applications):", keptError.code, keptError.message);
  else if (oldKept?.length) {
    const files = oldKept.map((a) => a.cv_path).filter((p): p is string => Boolean(p));
    if (files.length) await admin.storage.from("cvs").remove(files);
    const { error } = await admin.from("applications").delete().in("id", oldKept.map((a) => a.id));
    if (error) console.error("Retention clean up (applications):", error.code, error.message);
  }

  // Record the run, so a missed or failing day shows up in the health check.
  const finished = new Date().toISOString();
  const ok = problems.length === 0;
  const { error: recordError } = await admin.from("job_runs").upsert(
    { name: "daily", locked_until: null, last_finished_at: finished, ...(ok ? { last_ok_at: finished } : {}), last_result: { ...summary, problems: problems.length } },
    { onConflict: "name" },
  );
  if (recordError) problems.push(`Recording the run: ${recordError.message}`);

  if (problems.length) {
    await notifyAdmin("The daily housekeeping job had problems", problems.map((p) => p.slice(0, 300)));
    await notifySlack("The daily housekeeping job had problems", problems.slice(0, 5).map((p) => p.slice(0, 300)), { path: "/admin", text: "Open the admin dashboard" }, "daily").catch(() => undefined);
  }
  // The 30 days notice to Founding clinics whose price lock is about to end. Best effort, and each pass is told once.
  try {
    await sendFoundingReminders(admin);
  } catch (e) {
    console.error("Founding reminders failed:", e instanceof Error ? e.message : e);
  }
  // The morning summary for Slack. Best effort: it never changes the result of the run.
  try {
    await sendDailyDigest(admin);
  } catch (e) {
    console.error("Slack summary not sent:", e instanceof Error ? e.message : e);
  }
  // A reminder when a support request or a reported job has waited more than 1 business day.
  try {
    await sendWaitingReminder(admin);
  } catch (e) {
    console.error("Slack reminder not sent:", e instanceof Error ? e.message : e);
  }
  // A cheer when a round number is passed (10th clinic, 100th waitlist sign up). Best effort.
  try {
    await sendMilestones(admin);
  } catch (e) {
    console.error("Slack milestones not sent:", e instanceof Error ? e.message : e);
  }
  return Response.json({ ok: problems.length === 0, ...summary });
}

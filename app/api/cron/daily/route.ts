import { timingSafeEqual } from "node:crypto";
import { APP_LABELS } from "@/lib/applications";
import { SITE_URL, deliverEmail, emailLayout, type SendResult } from "@/lib/email";
import { longDate } from "@/lib/jobs";
import { notifyAdmin } from "@/lib/notify-admin";
import { candidateRecipient } from "@/lib/recipient";
import { dailyBudget, makeBudget } from "@/lib/send-budget";
import { supabaseAdmin } from "@/lib/supabase-server";
import { unsubscribeIdUrl } from "@/lib/unsubscribe-link";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const TIME_LIMIT = 50_000; // stop starting new work after 50 of the 60 seconds, and leave the rest for tomorrow
const chunks = <T,>(list: T[], size = 100) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// Runs once a day (see vercel.json). It:
//  1. marks live jobs that have passed their 30 days as expired,
//  2. tells clinics when a job closes in 3 days,
//  3. closes out applications still waiting on a job that ended a week ago, so candidates
//     are never left waiting,
//  4. reminds clinics about applications they have not opened for 14 days,
//  5. emails candidates one digest of new jobs that match their job alerts,
//  6. tells Steve about anything that has waited more than a day for him.
// Vercel sends the secret in the Authorization header, so nobody else can trigger it.
// Only one run can go at a time, it sends no more than the day's email budget, and it records when it last finished well,
// so the health check (and the uptime monitor) can notice a missed day.
export async function GET(request: Request) {
  try {
    return await runDaily(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Daily job crashed:", message);
    await notifyAdmin("The daily housekeeping job failed", ["It stopped with this error:", message.slice(0, 300)]);
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
  const summary = { expiredJobs: 0, closingSoonEmails: 0, closedOutApplications: 0, reminders: 0, alertsSent: 0, emailsFailed: 0, emailsHeldBack: 0 };
  const problems: string[] = [];

  // Only one run at a time. If two copies started together, every email would go twice.
  const { data: gotLock, error: lockError } = await admin.rpc("claim_job_run", { p_name: "daily", p_minutes: 15 });
  if (lockError) problems.push(`Run lock unavailable (has migration 0020 been run?): ${lockError.message}`);
  else if (gotLock === false) return Response.json({ ok: true, skipped: "another run is already going" });

  const budget = makeBudget(dailyBudget());
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
    const mail = emailLayout({
      heading: `Your ${job.title} job closes in 3 days`,
      paragraphs: [
        `Your ${job.title} job comes down from Kestrel on ${longDate(job.expires_at)}, after its 30 days. Applicants you have already received stay in your dashboard.`,
        "If you are still hiring, you can post it again once it closes. Your details are kept, so it only takes a minute.",
      ],
      buttonText: "Open your dashboard",
      buttonUrl: `${SITE_URL}/clinic`,
    });
    if (note(await deliverEmail({ to: contact.notify_email, subject: `Your ${job.title} job closes in 3 days`, ...mail }))) {
      await admin.from("jobs").update({ expiry_reminded_at: now.toISOString() }).eq("id", job.id);
      summary.closingSoonEmails += 1;
    }
  }

  // 3. Applications still waiting on a job that ended a week or more ago.
  const { data: ended } = await admin.from("jobs").select("id").in("status", ["expired", "closed"]).lt("updated_at", new Date(now.getTime() - 7 * DAY).toISOString());
  for (const ids of chunks((ended ?? []).map((j) => j.id))) {
    const { data: waiting } = await admin.from("applications").select("id, applicant, job_title, clinic_name, candidate_id").in("job_id", ids).in("status", ["applied", "viewed", "shortlisted"]);
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
      if (sendIt && email) {
        const mail = emailLayout({
          heading: "An update on your application",
          paragraphs: [`The job you applied for, ${app.job_title} at ${app.clinic_name}, has closed, and the clinic did not send a decision. Your application is now marked: ${APP_LABELS.no_update}.`, "Thank you for applying. We would love to help you find the next one."],
          buttonText: "Find more jobs",
          buttonUrl: `${SITE_URL}/jobs`,
        });
        note(await deliverEmail({ to: email, subject: `Update on your application: ${app.job_title}`, ...mail }));
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
  let leftForTomorrow = 0;
  for (const [userId, mine] of byUser) {
    if (outOfTime()) {
      leftForTomorrow += 1;
      continue;
    }
    const { data: profile } = await admin.from("profiles").select("unsubscribed_at").eq("id", userId).maybeSingle();
    if (!profile || profile.unsubscribed_at) continue;
    const found = new Map<string, { title: string; clinic: string; place: string }>();
    for (const alert of mine) {
      let query = admin
        .from("jobs")
        .select("id, title, province, city, employers!inner(clinic_name, practice_type)")
        .eq("status", "live")
        .gt("expires_at", now.toISOString())
        .gt("posted_at", alert.last_sent_at)
        .order("posted_at", { ascending: false })
        .limit(20);
      if (alert.role_category) query = query.eq("role_category", alert.role_category);
      if (alert.province) query = query.eq("province", alert.province);
      if (alert.practice_type) query = query.eq("employers.practice_type", alert.practice_type);
      const { data: jobs } = await query;
      for (const job of (jobs ?? []) as unknown as { id: string; title: string; province: string; city: string; employers: { clinic_name: string } | null }[]) {
        found.set(job.id, { title: job.title, clinic: job.employers?.clinic_name ?? "", place: `${job.city}, ${job.province}` });
      }
    }
    if (found.size === 0) continue;
    const { data: user } = await admin.auth.admin.getUserById(userId);
    const email = user?.user?.email;
    if (!email) continue;
    if (!budget.take()) {
      summary.emailsHeldBack += 1;
      continue;
    }
    // Claim these alerts before emailing, so a second copy of this job could never send the same email. Put them back if it fails.
    const stamp = now.toISOString();
    const claims = await Promise.all(mine.map((a) => admin.from("job_alerts").update({ last_sent_at: stamp }).eq("id", a.id).eq("last_sent_at", a.last_sent_at).select("id")));
    const putBack = () => Promise.all(mine.map((a) => admin.from("job_alerts").update({ last_sent_at: a.last_sent_at }).eq("id", a.id).eq("last_sent_at", stamp)));
    if (claims.some((c) => c.error || !c.data?.length)) {
      await putBack();
      budget.refund();
      continue;
    }
    const unsubscribeUrl = unsubscribeIdUrl(userId);
    const mail = emailLayout({
      heading: found.size === 1 ? "A new job matches your alert" : `${found.size} new jobs match your alerts`,
      paragraphs: ["Here is what has been posted since we last emailed you."],
      items: [...found].slice(0, 15).map(([id, j]) => ({ text: `${j.title}, ${j.clinic}, ${j.place}`, url: `${SITE_URL}/jobs/${id}` })),
      buttonText: "See all jobs",
      buttonUrl: `${SITE_URL}/jobs`,
      unsubscribeUrl,
    });
    if (note(await deliverEmail({ to: email, subject: found.size === 1 ? "New job alert: 1 new job" : `New job alert: ${found.size} new jobs`, unsubscribeUrl, ...mail }))) {
      summary.alertsSent += 1;
    } else {
      await putBack();
    }
  }

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
      summary.emailsHeldBack > 0 ? `${summary.emailsHeldBack} emails were held back to stay within today's send budget of ${budget.limit}.` : "",
      leftForTomorrow > 0 ? `${leftForTomorrow} people's job alerts ran out of time and wait for tomorrow.` : "",
      "If this keeps happening, raise DAILY_EMAIL_BUDGET and check the Resend plan.",
    ].filter(Boolean));
  }
  if (summary.emailsFailed > 0) problems.push(`${summary.emailsFailed} emails could not be sent. Check the Resend dashboard.`);

  // Record the run, so a missed or failing day shows up in the health check.
  const finished = new Date().toISOString();
  const ok = problems.length === 0;
  const { error: recordError } = await admin.from("job_runs").upsert(
    { name: "daily", locked_until: null, last_finished_at: finished, ...(ok ? { last_ok_at: finished } : {}), last_result: { ...summary, problems: problems.length } },
    { onConflict: "name" },
  );
  if (recordError) problems.push(`Recording the run: ${recordError.message}`);

  if (problems.length) await notifyAdmin("The daily housekeeping job had problems", problems.map((p) => p.slice(0, 300)));
  return Response.json({ ok: problems.length === 0, ...summary });
}

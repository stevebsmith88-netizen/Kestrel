import { APP_LABELS } from "@/lib/applications";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { notifyAdmin } from "@/lib/notify-admin";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const chunks = <T,>(list: T[], size = 100) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// Runs once a day (see vercel.json). It:
//  1. marks live jobs that have passed their 30 days as expired,
//  2. closes out applications still waiting on a job that ended a week ago, so candidates
//     are never left waiting,
//  3. reminds clinics about applications they have not opened for 14 days,
//  4. emails candidates one digest of new jobs that match their job alerts.
// Vercel sends the secret in the Authorization header, so nobody else can trigger it.
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
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return new Response("Not available", { status: 503 });

  const now = new Date();
  const summary = { expiredJobs: 0, closedOutApplications: 0, reminders: 0, alertsSent: 0 };
  const problems: string[] = [];

  // 1. Expire jobs. The public pages already stop showing them the moment they pass their date.
  const { data: expired, error: expireError } = await admin.from("jobs").update({ status: "expired" }).eq("status", "live").lt("expires_at", now.toISOString()).select("id");
  if (expireError) problems.push(`Expiring jobs: ${expireError.message}`);
  summary.expiredJobs = expired?.length ?? 0;

  // 2. Applications still waiting on a job that ended a week or more ago.
  const { data: ended } = await admin.from("jobs").select("id").in("status", ["expired", "closed"]).lt("updated_at", new Date(now.getTime() - 7 * DAY).toISOString());
  for (const ids of chunks((ended ?? []).map((j) => j.id))) {
    const { data: waiting } = await admin.from("applications").select("id, applicant, job_title, clinic_name").in("job_id", ids).in("status", ["applied", "viewed", "shortlisted"]);
    for (const app of waiting ?? []) {
      const stamp = new Date().toISOString();
      await admin.from("applications").update({ status: "no_update", status_changed_at: stamp, updated_at: stamp }).eq("id", app.id);
      await admin.from("application_events").insert({ application_id: app.id, status: "no_update" });
      summary.closedOutApplications += 1;
      const email = (app.applicant as { email?: string } | null)?.email;
      if (email) {
        const mail = emailLayout({
          heading: "An update on your application",
          paragraphs: [`The job you applied for, ${app.job_title} at ${app.clinic_name}, has closed, and the clinic did not send a decision. Your application is now marked: ${APP_LABELS.no_update}.`, "Thank you for applying. We would love to help you find the next one."],
          buttonText: "Find more jobs",
          buttonUrl: `${SITE_URL}/jobs`,
        });
        await sendEmail({ to: email, subject: `Update on your application: ${app.job_title}`, ...mail });
      }
    }
  }

  // 3. Reminders for applications unopened for 14 days, one email per clinic.
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
      const { data: contact } = await admin.from("employer_contacts").select("notify_email").eq("employer_id", employerId).maybeSingle();
      if (!contact?.notify_email) continue;
      const mail = emailLayout({
        heading: "Applications are waiting for you",
        paragraphs: [`${appIds.length === 1 ? "An application has" : `${appIds.length} applications have`} been waiting for 2 weeks without being opened. A quick look lets candidates know where they stand, and it only takes a moment.`],
        buttonText: "Open your dashboard",
        buttonUrl: `${SITE_URL}/clinic`,
      });
      const sent = await sendEmail({ to: contact.notify_email, subject: "Applications are waiting for you", ...mail });
      if (sent) {
        await admin.from("applications").update({ reminded_at: new Date().toISOString() }).in("id", appIds);
        summary.reminders += 1;
      }
    }
  }

  // 4. Job alerts. Each person gets at most one email a day, covering the alerts that are due (daily, weekly or monthly).
  const { data: alerts, error: alertsError } = await admin.from("job_alerts").select("id, user_id, role_category, province, practice_type, frequency, last_sent_at");
  if (alertsError) problems.push(`Reading job alerts: ${alertsError.message}`);
  // A little under the full gap, so the once a day schedule never skips a turn.
  const GAP_HOURS: Record<string, number> = { daily: 20, weekly: 7 * 24 - 4, monthly: 30 * 24 - 4 };
  const due = (alerts ?? []).filter((a) => now.getTime() - new Date(a.last_sent_at).getTime() >= (GAP_HOURS[a.frequency] ?? GAP_HOURS.weekly) * 60 * 60 * 1000);
  const byUser = new Map<string, typeof due>();
  due.forEach((a) => byUser.set(a.user_id, [...(byUser.get(a.user_id) ?? []), a]));
  for (const [userId, mine] of byUser) {
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
    const unsubscribeUrl = `${SITE_URL}/unsubscribe/${userId}`;
    const mail = emailLayout({
      heading: found.size === 1 ? "A new job matches your alert" : `${found.size} new jobs match your alerts`,
      paragraphs: ["Here is what has been posted since we last emailed you."],
      items: [...found].slice(0, 15).map(([id, j]) => ({ text: `${j.title}, ${j.clinic}, ${j.place}`, url: `${SITE_URL}/jobs/${id}` })),
      buttonText: "See all jobs",
      buttonUrl: `${SITE_URL}/jobs`,
      unsubscribeUrl,
    });
    const sent = await sendEmail({ to: email, subject: found.size === 1 ? "New job alert: 1 new job" : `New job alert: ${found.size} new jobs`, unsubscribeUrl, ...mail });
    if (sent) {
      await admin.from("job_alerts").update({ last_sent_at: now.toISOString() }).in("id", mine.map((a) => a.id));
      summary.alertsSent += 1;
    }
  }

  if (problems.length) await notifyAdmin("The daily housekeeping job had problems", problems.map((p) => p.slice(0, 300)));
  return Response.json({ ok: problems.length === 0, ...summary });
}

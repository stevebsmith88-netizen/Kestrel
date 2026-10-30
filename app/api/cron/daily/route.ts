import { APP_LABELS } from "@/lib/applications";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 24 * 60 * 60 * 1000;
const chunks = <T,>(list: T[], size = 100) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// Runs once a day (see vercel.json). It:
//  1. marks live jobs that have passed their 30 days as expired,
//  2. closes out applications still waiting on a job that ended a week ago, so candidates
//     are never left waiting,
//  3. reminds clinics about applications they have not opened for 14 days.
// Vercel sends the secret in the Authorization header, so nobody else can trigger it.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const admin = supabaseAdmin();
  if (!admin) return new Response("Not available", { status: 503 });

  const now = new Date();
  const summary = { expiredJobs: 0, closedOutApplications: 0, reminders: 0 };

  // 1. Expire jobs. The public pages already stop showing them the moment they pass their date.
  const { data: expired } = await admin.from("jobs").update({ status: "expired" }).eq("status", "live").lt("expires_at", now.toISOString()).select("id");
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

  return Response.json({ ok: true, ...summary });
}

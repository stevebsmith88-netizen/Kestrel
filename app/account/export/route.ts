import { candidateHistory, candidateStatus } from "@/lib/applications";
import { getSession } from "@/lib/auth";
import { candidateExtras, type ExportDb } from "@/lib/data-export";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";
import { exportCheck, type ExportProblem } from "@/lib/export-check";

export const dynamic = "force-dynamic";

const back = (request: Request, problem?: ExportProblem) => Response.redirect(new URL(`/account${problem ? `?download=${problem}` : ""}#ac-download`, request.url), 303);

// Opening the address directly hands over nothing: it goes back to the account page, where the download asks for the password (P1-49).
export async function GET(request: Request) {
  return back(request);
}

// A signed in person downloads the information Kestrel holds about them, as a file they can open
// or keep. Everything is looked up by their own account id, which comes from their sign in.
// For clinics this covers their own profile and jobs, not other people's applications.
// The form on the account page posts the password (or, for Google sign in, the email address) first, as delete does (P1-49).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "admin") return new Response("Please sign in.", { status: 401 });
  const form = await request.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");
  const check = exportCheck({ hasPassword: session.hasPassword, email: session.email, password, confirmEmail: String(form?.get("confirmEmail") ?? "") });
  if (check !== "ok" && check !== "check-password") return back(request, check);
  if (check === "check-password") {
    const auth = await supabaseServer();
    if (!auth) return new Response("Not available right now.", { status: 503 });
    const { error } = await auth.auth.signInWithPassword({ email: session.email, password });
    if (error) return back(request, "wrong-password");
  }
  const db = supabaseAdmin();
  if (!db) return new Response("Not available right now.", { status: 503 });

  const id = session.userId;
  const [profile, alerts] = await Promise.all([
    db.from("profiles").select("role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at, unsubscribed_at, created_at").eq("id", id).maybeSingle(),
    db.from("job_alerts").select("role_category, province, practice_type, frequency, created_at").eq("user_id", id),
  ]);

  const data: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    note: "This is the personal information Kestrel Eye Care Jobs holds about your account. Your resume file can be downloaded from your profile page.",
    account: { email: session.email, ...(profile.data ?? {}) },
    jobAlerts: alerts.data ?? [],
    inbox: (await db.from("notifications").select("kind, title, body, href, read_at, created_at").eq("user_id", id).order("created_at", { ascending: false })).data ?? [],
  };

  if (session.role === "candidate") {
    const [cp, apps] = await Promise.all([
      db.from("candidate_profiles").select("profession, licensed_provinces, software_skills, years_experience, available_from, phone, cv_filename, cv_uploaded_at, created_at, updated_at").eq("user_id", id).maybeSingle(),
      db.from("applications").select("id, job_title, clinic_name, job_location, status, cover_letter, keep_details, applicant, cv_filename, clinic_message, viewed_at, status_changed_at, created_at").eq("candidate_id", id).order("created_at", { ascending: false }),
    ]);
    const [letters, drafts] = await Promise.all([
      db.from("cover_letter_templates").select("name, body, created_at, updated_at").eq("user_id", id),
      db.from("application_drafts").select("cover_letter, updated_at").eq("user_id", id),
    ]);
    data.savedCoverLetters = letters.data ?? [];
    data.applicationDrafts = drafts.data ?? [];
    const appIds = (apps.data ?? []).map((a) => a.id);
    const events = appIds.length ? await db.from("application_events").select("application_id, status, note, created_at").in("application_id", appIds).order("created_at") : { data: [] };
    data.candidateProfile = cp.data ?? null;
    // What the candidate chose for "Recommended for you", the career stage answer, hidden jobs and the name change date. All private to them.
    const extras = await candidateExtras(db as unknown as ExportDb, id);
    data.preferences = extras.preferences;
    data.careerStage = extras.careerStage;
    data.jobsMarkedNotInterested = extras.jobsMarkedNotInterested;
    (data.account as Record<string, unknown>).name_last_changed_at = extras.nameLastChangedAt;
    // A shortlist is the clinic's own working list, so the download shows it as Viewed, like the candidate's own pages do.
    data.applications = (apps.data ?? []).map(({ id: appId, ...a }) => ({
      ...a,
      status: candidateStatus(a.status),
      clinic_message: a.status === "shortlisted" ? null : a.clinic_message,
      history: candidateHistory((events.data ?? []).filter((e) => e.application_id === appId)).map(({ status, note, created_at }) => ({ status, note, at: created_at })),
    }));
  } else {
    const employer = await db.from("employers").select("id, clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at, created_at").eq("owner_id", id).maybeSingle();
    const contact = employer.data ? await db.from("employer_contacts").select("notify_email, employee_band").eq("employer_id", employer.data.id).maybeSingle() : { data: null };
    const jobs = employer.data
      ? await db.from("jobs").select("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, pay_extras, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status, posted_at, expires_at, created_at").eq("employer_id", employer.data.id).order("created_at", { ascending: false })
      : { data: [] };
    const templates = employer.data ? await db.from("job_templates").select("name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, description, apply_method, apply_url, work_arrangement, territory, pay_extras, updated_at").eq("employer_id", employer.data.id) : { data: [] };
    data.jobTemplates = templates.data ?? [];
    data.clinic = employer.data ? { ...employer.data, id: undefined, alertEmail: contact.data?.notify_email ?? null, employeeCount: contact.data?.employee_band ?? null } : null;
    data.jobs = jobs.data ?? [];
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kestrel-my-information-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

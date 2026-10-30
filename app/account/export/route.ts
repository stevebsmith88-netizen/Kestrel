import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// A signed in person downloads the information Kestrel holds about them, as a file they can open
// or keep. Everything is looked up by their own account id, which comes from their sign in.
// For clinics this covers their own profile and jobs, not other people's applications.
export async function GET() {
  const session = await getSession();
  if (!session || session.role === "admin") return new Response("Please sign in.", { status: 401 });
  const db = supabaseAdmin();
  if (!db) return new Response("Not available right now.", { status: 503 });

  const id = session.userId;
  const [profile, alerts] = await Promise.all([
    db.from("profiles").select("role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at, unsubscribed_at, created_at").eq("id", id).maybeSingle(),
    db.from("job_alerts").select("role_category, province, practice_type, frequency, created_at").eq("user_id", id),
  ]);

  const data: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    note: "This is the personal information Kestrel Eye Care Jobs holds about your account. Your CV file can be downloaded from your profile page.",
    account: { email: session.email, ...(profile.data ?? {}) },
    jobAlerts: alerts.data ?? [],
  };

  if (session.role === "candidate") {
    const [cp, apps] = await Promise.all([
      db.from("candidate_profiles").select("profession, licensed_provinces, years_experience, available_from, phone, cv_filename, cv_uploaded_at, created_at, updated_at").eq("user_id", id).maybeSingle(),
      db.from("applications").select("id, job_title, clinic_name, job_location, status, cover_letter, keep_details, applicant, cv_filename, clinic_message, viewed_at, status_changed_at, created_at").eq("candidate_id", id).order("created_at", { ascending: false }),
    ]);
    const appIds = (apps.data ?? []).map((a) => a.id);
    const events = appIds.length ? await db.from("application_events").select("application_id, status, note, created_at").in("application_id", appIds).order("created_at") : { data: [] };
    data.candidateProfile = cp.data ?? null;
    data.applications = (apps.data ?? []).map(({ id: appId, ...a }) => ({ ...a, history: (events.data ?? []).filter((e) => e.application_id === appId).map(({ status, note, created_at }) => ({ status, note, at: created_at })) }));
  } else {
    const employer = await db.from("employers").select("id, clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at, created_at").eq("owner_id", id).maybeSingle();
    const contact = employer.data ? await db.from("employer_contacts").select("notify_email").eq("employer_id", employer.data.id).maybeSingle() : { data: null };
    const jobs = employer.data
      ? await db.from("jobs").select("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status, posted_at, expires_at, created_at").eq("employer_id", employer.data.id).order("created_at", { ascending: false })
      : { data: [] };
    data.clinic = employer.data ? { ...employer.data, id: undefined, alertEmail: contact.data?.notify_email ?? null } : null;
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

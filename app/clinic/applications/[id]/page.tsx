import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { AppStatusBadge, Steps } from "@/components/AppStatus";
import NoteForm from "@/components/NoteForm";
import StatusForm from "@/components/StatusForm";
import { requireRole } from "@/lib/auth";
import { APP_LABELS, type AppStatus } from "@/lib/applications";
import { getApplication } from "@/lib/candidate";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Application | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClinicApplication({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  // The database only returns this if the application is to one of this clinic's own jobs.
  const found = await getApplication(id);
  if (!found) notFound();
  let { application: a, history } = found;

  // Opening an application marks it as viewed, so the candidate can see it has been read.
  if (a.status === "applied") {
    const admin = supabaseAdmin();
    if (admin) {
      const now = new Date().toISOString();
      await admin.from("applications").update({ status: "viewed", viewed_at: now, status_changed_at: now, updated_at: now }).eq("id", id).eq("status", "applied");
      await admin.from("application_events").insert({ application_id: id, status: "viewed" });
      a = { ...a, status: "viewed", viewed_at: now };
      history = [...history, { status: "viewed", note: null, created_at: now }];
    }
  }

  const db = await supabaseServer();
  const { data: noteRow } = db ? await db.from("application_notes").select("note").eq("application_id", id).maybeSingle() : { data: null };
  const who = a.applicant;

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main className="app">
        <div className="wrap">
          <p className="back"><Link href={`/clinic/jobs/${a.job_id}/applicants`}>Back to all applicants</Link></p>
          <p className="kicker">{a.job_title}</p>
          <h1>{who.name ?? "Applicant"}</h1>

          <div className="appgrid">
            <div className="stackcards">
              <section className="card">
                <div className="listhead tight"><h2>Where it stands</h2><AppStatusBadge status={a.status} /></div>
                <Steps current={a.status} history={history.map((h) => h.status)} />
              </section>

              <section className="card">
                <h2>Cover letter</h2>
                {a.cover_letter ? <div className="adbody letter">{a.cover_letter}</div> : <p className="help">They did not include a cover letter.</p>}
              </section>

              <section className="card">
                <h2>Their details</h2>
                <dl className="facts">
                  <div><dt>Email</dt><dd><a href={`mailto:${who.email}`}>{who.email}</a></dd></div>
                  {who.phone && <div><dt>Phone</dt><dd>{who.phone}</dd></div>}
                  <div><dt>Role</dt><dd>{who.profession ?? "Not given"}</dd></div>
                  <div><dt>Licensed in</dt><dd>{who.licensed_provinces?.length ? who.licensed_provinces.join(", ") : "Not given"}</dd></div>
                  <div><dt>Experience</dt><dd>{who.years_experience ?? "Not given"}</dd></div>
                  <div><dt>Available from</dt><dd>{who.available_from ? longDate(who.available_from) : "Not given"}</dd></div>
                  <div><dt>Applied</dt><dd>{longDate(a.created_at)}</dd></div>
                  <div><dt>May keep details for future roles</dt><dd>{a.keep_details ? "Yes" : "No"}</dd></div>
                </dl>
                {a.cv_filename && <p><a className="btn sm" href={`/clinic/applications/${a.id}/cv`}>Download their CV ({a.cv_filename})</a></p>}
              </section>

              <section className="card">
                <h2>History</h2>
                <ul className="tl">
                  {history.map((h, i) => (
                    <li key={`${h.status}-${h.created_at}`} className={i === history.length - 1 ? "now" : ""}>
                      <strong>{APP_LABELS[h.status as AppStatus] ?? h.status}</strong>
                      <span className="meta">{longDate(h.created_at)}</span>
                      {h.note && <span className="meta">{h.note}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="stackcards">
              <section className="card">
                <h2>Update this application</h2>
                <StatusForm id={a.id} current={a.status} keepDetails={a.keep_details} clinicName={a.clinic_name} />
              </section>
              <section className="card">
                <NoteForm id={a.id} initial={noteRow?.note ?? ""} />
              </section>
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

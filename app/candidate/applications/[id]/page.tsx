import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { AppStatusBadge, Steps } from "@/components/AppStatus";
import { requireRole } from "@/lib/auth";
import { APP_EXPLAINERS, APP_LABELS, isClosed, type AppStatus } from "@/lib/applications";
import { getApplication } from "@/lib/candidate";
import { withdrawApplication } from "@/lib/candidate-actions";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Your application | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("candidate");
  const { id } = await params;
  const { notice } = await searchParams;
  if (!UUID.test(id)) notFound();
  const found = await getApplication(id);
  if (!found) notFound();
  const { application: a, history } = found;
  const closed = isClosed(a.status);
  const statuses = history.map((h) => h.status);

  return (
    <>
      <AppBar session={session} current="/candidate/applications" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href="/candidate/applications">Back to my applications</Link></p>
          <p className="kicker">{a.clinic_name} · {a.job_location}</p>
          <h1>{a.job_title}</h1>
          {notice === "applied" && <p className="notice" role="status">Your application is sent. We will email you when the clinic updates it.</p>}
          {notice === "withdrawn" && <p className="notice" role="status">You have withdrawn this application.</p>}

          <section className="card">
            <div className="listhead tight">
              <h2>Where it stands</h2>
              <AppStatusBadge status={a.status} />
            </div>
            <p className="meta">{APP_EXPLAINERS[a.status as AppStatus]}</p>
            <Steps current={a.status} history={statuses} />
          </section>

          {a.clinic_message && (
            <section className="card">
              <h2>A message from {a.clinic_name}</h2>
              <blockquote className="msg">{a.clinic_message}</blockquote>
              <p className="help">Clinics choose what to tell you. Their private notes are never shown.</p>
            </section>
          )}

          <section className="card">
            <h2>History</h2>
            <ul className="tl">
              {history.map((h, i) => (
                <li key={`${h.status}-${h.created_at}`} className={i === history.length - 1 && !closed ? "now" : ""}>
                  <strong>{APP_LABELS[h.status as AppStatus] ?? h.status}</strong>
                  <span className="meta">{longDate(h.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>What you sent</h2>
            <dl className="facts">
              <div><dt>CV</dt><dd>{a.cv_filename ?? "Not available"}</dd></div>
              <div><dt>Applied</dt><dd>{longDate(a.created_at)}</dd></div>
              <div><dt>Keep my details for future roles</dt><dd>{a.keep_details ? "Yes" : "No"}</dd></div>
            </dl>
            {a.cover_letter ? <div className="adbody letter">{a.cover_letter}</div> : <p className="help">You did not include a cover letter.</p>}
          </section>

          {!closed && (
            <section className="card">
              <h2>Need to step back?</h2>
              <p className="help">Withdrawing tells the clinic you are no longer interested. You can apply again later if the job is still open.</p>
              <form action={withdrawApplication}>
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="btn ghost">Withdraw my application</button>
              </form>
            </section>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

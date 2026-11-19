import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/jobs";
import { removeSaved } from "@/lib/saved-actions";
import { closesText, daysLeft, SAVE_LIMIT } from "@/lib/saved-jobs";
import { listSaved } from "@/lib/saved-server";

export const metadata: Metadata = { title: "Saved jobs | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function SavedJobs() {
  const session = await requireRole("candidate");
  const jobs = await listSaved(session.userId);
  return (
    <>
      <AppBar session={session} current="/candidate/saved" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Saved jobs</h1>
          <p className="lede2">Jobs you saved to apply for later. Open ones come first, with the soonest to close at the top. Only you can see this list, and a clinic is never told you saved its job. You can save up to {SAVE_LIMIT}.</p>
          {jobs.length === 0 ? (
            <section className="card">
              <p className="help">You have not saved any jobs yet. Press <strong>Save job</strong> on a job to keep it here. <Link href="/jobs">Find jobs</Link></p>
            </section>
          ) : (
            <ul className="savedlist">
              {jobs.map((j) => {
                const closes = j.open ? closesText(daysLeft(j.expires_at)) : "";
                return (
                  <li key={j.id} className="card">
                    <div>
                      <h2>{j.open ? <Link href={`/jobs/${j.id}`}>{j.title}</Link> : j.title}</h2>
                      <p className="meta">{[j.clinic, j.place].filter(Boolean).join(" · ")}</p>
                      {j.chips.length > 0 && <p className="chips">{j.chips.map((c) => <span className="chip paychip" key={c}>{c}</span>)}</p>}
                      <p className="meta">Saved {longDate(j.saved_at)}{closes ? ` · ${closes}` : ""}</p>
                      {!j.open && <p className="help">{j.why}</p>}
                    </div>
                    <div className="formbtns">
                      {j.open && !j.applied && <Link href={j.external ? `/jobs/${j.id}` : `/jobs/${j.id}/apply`} className="btn sm">{j.external ? "View and apply" : "Apply"}</Link>}
                      {j.applied && <Link href="/candidate/applications" className="btn sm ghost">You applied</Link>}
                      <form action={removeSaved}><input type="hidden" name="jobId" value={j.id} /><button type="submit" className="linkbtn">Remove</button></form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

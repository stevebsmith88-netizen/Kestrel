import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { AppStatusBadge } from "@/components/AppStatus";
import { requireRole } from "@/lib/auth";
import { groupOf } from "@/lib/applications";
import { getMyApplications, getMyCandidateProfile, profileReady, profileStrength } from "@/lib/candidate";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Your home | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function CandidateHome() {
  const session = await requireRole("candidate");
  const [profile, applications] = await Promise.all([getMyCandidateProfile(session.userId), getMyApplications()]);
  const first = session.firstName || "there";
  const strength = profileStrength(profile);
  const active = applications.filter((a) => groupOf(a.status) !== "closed").length;
  const latest = applications.slice(0, 3);

  return (
    <>
      <AppBar session={session} current="/candidate" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">Your home</p>
          <h1>Welcome, {first}</h1>
          <p className="lede2">Keep your CV and details here, and apply to any job in a few clicks.</p>

          <div className="tiles">
            <section className="card">
              <p className="kicker">Your profile</p>
              <h2>{profileReady(profile) ? "Ready to apply" : "Finish your profile"}</h2>
              <div className="meter" role="img" aria-label={`Profile ${strength} percent complete`}><i style={{ width: `${strength}%` }} /></div>
              <p>{profileReady(profile) ? "Your CV and details are saved." : "Add your role and save your CV, and you can apply to any job in a few clicks."}</p>
              <Link href="/candidate/profile" className="btn sm ghost">{profileReady(profile) ? "Edit my profile" : "Complete my profile"}</Link>
            </section>
            <section className="card">
              <p className="kicker">Applications</p>
              <h2>{applications.length === 0 ? "None yet" : `${active} in progress`}</h2>
              <p>{applications.length === 0 ? "When you apply, each application appears here with its progress, from applied to offer." : `You have sent ${applications.length} ${applications.length === 1 ? "application" : "applications"}.`}</p>
              <Link href="/candidate/applications" className="btn sm ghost">My applications</Link>
            </section>
            <section className="card">
              <p className="kicker">Jobs</p>
              <h2>Find your next role</h2>
              <p>Search by role, province, and independent or corporate practice. Every job shows its pay.</p>
              <Link href="/jobs" className="btn sm">Find jobs</Link>
            </section>
          </div>

          {latest.length > 0 && (
            <>
              <div className="listhead"><h2>Latest on your applications</h2><Link href="/candidate/applications">See all</Link></div>
              <div className="joblist">
                {latest.map((a) => (
                  <article className="card jobrow" key={a.id}>
                    <div className="jobmain">
                      <h3><Link href={`/candidate/applications/${a.id}`}>{a.job_title}</Link></h3>
                      <p className="meta">{a.clinic_name} · {a.job_location} · applied {longDate(a.created_at)}</p>
                    </div>
                    <div className="jobside"><AppStatusBadge status={a.status} /></div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

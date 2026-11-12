import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import Icon from "@/components/Icon";
import { AppStatusBadge } from "@/components/AppStatus";
import GettingStarted from "@/components/GettingStarted";
import { requireRole } from "@/lib/auth";
import { groupOf } from "@/lib/applications";
import { candidateSteps } from "@/lib/checklist";
import { getMyApplications, getMyCandidateProfile, needsFirstStep, profileReady, profileStrength } from "@/lib/candidate";
import { employmentLabel, longDate } from "@/lib/jobs";
import { payChips } from "@/lib/job-pay";
import { hideRecommendation } from "@/lib/recommendation-actions";
import { getRecommendations } from "@/lib/recommendations";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your home | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function CandidateHome() {
  const session = await requireRole("candidate");
  const [profile, applications] = await Promise.all([getMyCandidateProfile(session.userId), getMyApplications()]);
  // A brand new candidate is shown the first step page once (needsFirstStep in lib/candidate.ts).
  if (await needsFirstStep(session.userId, profile)) redirect("/candidate/start");
  const first = session.firstName || "there";
  const strength = profileStrength(profile);
  const active = applications.filter((a) => groupOf(a.status) !== "closed").length;
  const latest = applications.slice(0, 3);
  const { recs, needsRole, needsWhere } = await getRecommendations(profile, applications.map((a) => a.job_id));
  const db = await supabaseServer();
  const { count: alertCount } = db ? await db.from("job_alerts").select("id", { count: "exact", head: true }) : { count: 0 };

  return (
    <>
      <AppBar session={session} current="/candidate" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">Your home</p>
          <h1>Welcome, {first}</h1>
          <p className="lede2">Keep your resume and details here, and apply to any job in a few clicks.</p>

          <GettingStarted
            title="Your first application"
            steps={candidateSteps({ profileReady: profileReady(profile), lookingFor: !needsRole && !needsWhere, hasAlert: (alertCount ?? 0) > 0, applications: applications.length })}
          />

          <div className="tiles">
            <section className="card">
              <p className="kicker">Your profile</p>
              <h2>{profileReady(profile) ? "Ready to apply" : "Finish your profile"}</h2>
              <div className="meter" role="img" aria-label={`Profile ${strength} percent complete`}><i style={{ width: `${strength}%` }} /></div>
              <p>{profileReady(profile) ? "Your resume and details are saved." : "Add your role, town and resume, and you can apply to any job in a few clicks."}</p>
              <Link href="/candidate/profile" className="btn sm ghost">{profileReady(profile) ? "Edit my profile" : "Complete my profile"}</Link>
              <p className="help"><Link href="/candidate/letters" className="btn sm ghost">My saved cover letters</Link></p>
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

          <div className="listhead"><h2>Recommended for you</h2><Link href="/candidate/profile#looking-for" className="btn sm ghost">Edit what you are looking for</Link></div>
          {needsRole ? (
            <section className="card">
              <p>Choose your role in your profile and we will suggest jobs that fit.</p>
              <Link href="/candidate/profile" className="btn sm">Choose my role</Link>
            </section>
          ) : (
            <>
              {needsWhere && <p className="help">Add your town, or the provinces you would work in, to sharpen these. <Link href="/candidate/profile#looking-for">Add where</Link></p>}
              {recs.length === 0 ? (
                <section className="card">
                  <h3>Nothing matches yet</h3>
                  <p>Clinics add jobs as they post them. You can widen your distance or lower your pay minimum, or set a job alert and we will email you when something fits.</p>
                  <p className="formbtns">
                    <Link href="/candidate/profile#looking-for" className="btn sm ghost">Change what I am looking for</Link>
                    <Link href="/candidate/alerts" className="btn sm ghost">Job alerts</Link>
                  </p>
                </section>
              ) : (
                <div className="joblist">
                  {recs.map(({ job: j, reasons }) => (
                    <article className="card jobrow" key={j.id}>
                      <div className="jobmain">
                        <h3><Link href={`/jobs/${j.id}`}>{j.title}</Link></h3>
                        <p className="meta">{j.employers?.clinic_name} · {j.city}, {j.province}</p>
                        <p className="chips">
                          <span className="chip">{employmentLabel(j.employment_type)}</span>
                          {payChips(j).map((c) => <span className="chip paychip" key={c}>{c}</span>)}
                        </p>
                        <p className="why"><strong>Why this fits:</strong> {reasons.slice(0, 4).join(" · ")}</p>
                      </div>
                      <div className="jobside">
                        <Link href={`/jobs/${j.id}`} className="btn sm" aria-label={`View job: ${j.title}`}>View job</Link>
                        <form action={hideRecommendation}>
                          <input type="hidden" name="jobId" value={j.id} />
                          <button type="submit" className="btn sm ghost" aria-label={`Not interested in ${j.title}`}><Icon name="close" />Not interested</button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <p className="help">These come from simple rules applied to what you told us. There is no AI in them, and nothing about you is shared with clinics.</p>
            </>
          )}

          {latest.length > 0 && (
            <>
              <div className="listhead"><h2>Latest on your applications</h2><Link href="/candidate/applications" className="btn sm ghost">See all applications</Link></div>
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

import Link from "next/link";
import { PERIODS, change, type Period } from "@/lib/admin-stats";
import type { Stats } from "@/lib/admin-stats-data";

const n = (value: number | null | undefined) => (value === null || value === undefined ? "Not enough yet" : value.toLocaleString("en-CA"));

// A simple row of bars. Every bar also has its number written out, so nothing depends on colour or sight.
function Bars({ rows, label }: { rows: { label: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="bars" aria-label={label}>
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <span className="bar" aria-hidden="true"><i style={{ width: `${(r.count / max) * 100}%` }} /></span>
          <strong>{r.count.toLocaleString("en-CA")}</strong>
        </li>
      ))}
    </ul>
  );
}

// The numbers on the admin overview page.
export default function AdminNumbers({ s, period }: { s: NonNullable<Stats>; period: Period }) {
  const label = PERIODS.find((p) => p.value === period)?.label.toLowerCase() ?? "";
  return (
    <>
            {s.jobsInReview > 0 && <p className="notice" role="status">{s.jobsInReview} {s.jobsInReview === 1 ? "job is" : "jobs are"} waiting for your review. <Link href="/admin/review">Open the review queue</Link></p>}
            {s.pendingClaims > 0 && <p className="notice" role="status">{s.pendingClaims} {s.pendingClaims === 1 ? "clinic is" : "clinics are"} waiting to claim a listing. <Link href="/admin/claims">Open the claims</Link></p>}
            {s.openReports > 0 && <p className="notice" role="status">{s.openReports} {s.openReports === 1 ? "job has" : "jobs have"} been reported. <Link href="/admin/reports">Open the reports</Link></p>}

            <div className="periodbar">
              <nav aria-label="Period">
                {PERIODS.map((p) => (
                  <Link key={p.value} href={`/admin?period=${p.value}`} className={`btn sm ${p.value === period ? "" : "ghost"}`} aria-current={p.value === period ? "true" : undefined}>{p.label}</Link>
                ))}
              </nav>
              <a href={`/admin/numbers.csv?period=${period}`} className="btn sm ghost">Export CSV</a>
            </div>

            <div className="tiles stats">
              <section className="card tile"><p className="kicker">Live jobs</p><p className="num">{n(s.liveJobs)}</p><p>{s.publishedNow} published in the {label}. {change(s.publishedNow, s.publishedBefore)}</p></section>
              <section className="card tile"><p className="kicker">Clinics and suppliers</p><p className="num">{n(s.employers)}</p><p>{s.claimedEmployers} claimed, {s.foundEmployers} found online</p></section>
              <section className="card tile"><p className="kicker">Candidate accounts</p><p className="num">{n(s.candidateAccounts)}</p><p>{s.candidatesNow} joined in the {label}. {change(s.candidatesNow, s.candidatesBefore)}</p></section>
              <section className="card tile"><p className="kicker">Applications</p><p className="num">{n(s.applicationsNow)}</p><p>In the {label}. {s.applicationsPerLiveJob === null ? "No live jobs yet" : `${s.applicationsPerLiveJob} per live job overall`}. {change(s.applicationsNow, s.applicationsBefore)}</p></section>
              <section className="card tile"><p className="kicker">Waitlist</p><p className="num">{n(s.waitlistConfirmed)}</p><p>Confirmed, of {s.waitlistTotal} who joined. {s.waitlistNow} joined in the {label}. <Link href="/admin/waitlist">See the list</Link></p></section>
              <section className="card tile"><p className="kicker">Revenue</p><p className="num">Not on yet</p><p>Appears here when payments are switched on.</p></section>
            </div>

            <div className="twocol">
              <section className="card">
                <h2>Jobs published each week</h2>
                <p className="help">The last 12 weeks. The bottom row is the current week.</p>
                <Bars rows={s.weekly.map((w) => ({ label: `Week of ${w.label}`, count: w.count }))} label="Jobs published each week, last 12 weeks" />
              </section>
              <section className="card">
                <h2>Live jobs by province</h2>
                {s.byProvince.length === 0 ? <p className="help">No live jobs yet.</p> : <Bars rows={s.byProvince} label="Live jobs by province" />}
              </section>
            </div>

            <div className="twocol">
              <section className="card">
                <h2>Clinics: from sign up to results</h2>
                <Bars rows={s.clinicFunnel} label="Clinic funnel" />
              </section>
              <section className="card">
                <h2>Candidates: from sign up to applying</h2>
                <Bars rows={s.candidateFunnel} label="Candidate funnel" />
              </section>
            </div>

            <section className="card">
              <h2>Investor snapshot</h2>
              <p className="help">The numbers an investor will ask about first. Revenue figures start when payments are switched on.</p>
              <dl className="facts">
                <div><dt>Monthly recurring revenue</dt><dd>Not on yet</dd></div>
                <div><dt>Free to paid conversion</dt><dd>Not on yet</dd></div>
                <div><dt>Posts per clinic</dt><dd>{n(s.investor.postsPerClinic)}</dd></div>
                <div><dt>Clinics that post again</dt><dd>{s.investor.clinicsThatRepost === null ? "Not enough yet" : `${s.investor.clinicsThatRepost}%`}</dd></div>
                <div><dt>Applications per live job</dt><dd>{n(s.investor.applicationsPerLiveJob)}</dd></div>
              </dl>
              <a href={`/admin/numbers.csv?period=${period}&kind=investor`} className="btn sm ghost">Download investor summary</a>
            </section>
    </>
  );
}

import Link from "next/link";
import { PERIODS, type Period } from "@/lib/admin-stats";
import { moneyText, type FinanceSummary } from "@/lib/admin-finance";
import type { Stats } from "@/lib/admin-stats-data";
import { showCount } from "@/lib/insights";

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

// The numbers on the admin Dashboard.
export default function AdminNumbers({ s, period, finance, launched }: { s: NonNullable<Stats>; period: Period; finance: FinanceSummary | null; launched: boolean }) {
  const label = PERIODS.find((p) => p.value === period)?.label.toLowerCase() ?? "";
  return (
    <>
            <h2 className="subhead">Needs you</h2>
            <div className="tiles quad">
              <Link href="/admin/review" prefetch className="card tile tilelink"><p className="kicker">Review queue</p><p className="num">{s.jobsInReview}</p><p>{s.jobsInReview === 0 ? "All clear" : "Jobs waiting"}</p></Link>
              <Link href="/admin/requests" prefetch className="card tile tilelink"><p className="kicker">Support</p><p className="num">{s.openSupport}</p><p>{s.openSupport === 0 ? "All clear" : "Open requests"}</p></Link>
              <Link href="/admin/claims" prefetch className="card tile tilelink"><p className="kicker">Claims</p><p className="num">{s.pendingClaims}</p><p>{s.pendingClaims === 0 ? "All clear" : "Waiting"}</p></Link>
              <Link href="/admin/reports" prefetch className="card tile tilelink"><p className="kicker">Reported jobs</p><p className="num">{s.openReports}</p><p>{s.openReports === 0 ? "All clear" : "Open reports"}</p></Link>
            </div>

            <div className="periodbar">
              <nav aria-label="Period">
                {PERIODS.map((p) => (
                  <Link key={p.value} href={`/admin?period=${p.value}`} className={`btn sm ${p.value === period ? "" : "ghost"}`} aria-current={p.value === period ? "true" : undefined}>{p.label}</Link>
                ))}
              </nav>
              <a href={`/admin/numbers.csv?period=${period}`} className="btn sm ghost">Export CSV</a>
            </div>

            <div className="tiles stats">
              <Link href="/admin/jobs?status=live" prefetch className="card tile tilelink"><p className="kicker">Live jobs</p><p className="num">{n(s.liveJobs)}</p><p>{s.publishedNow} new in the {label}</p></Link>
              <Link href="/admin/clinics" prefetch className="card tile tilelink"><p className="kicker">Clinics and suppliers</p><p className="num">{n(s.employers)}</p><p>{s.claimedEmployers} claimed</p></Link>
              <Link href="/admin/candidates" prefetch className="card tile tilelink"><p className="kicker">Candidates</p><p className="num">{n(s.candidateAccounts)}</p><p>{s.candidatesNow} new in the {label}</p></Link>
              <div className="card tile"><p className="kicker">Applications</p><p className="num">{n(s.applicationsNow)}</p><p>In the {label}</p></div>
              {!launched && <Link href="/admin/waitlist" prefetch className="card tile tilelink"><p className="kicker">Waitlist</p><p className="num">{n(s.waitlistConfirmed)}</p><p>{s.waitlistNow} new in the {label}</p></Link>}
              <Link href="/admin/payments" prefetch className="card tile tilelink">
                <p className="kicker">Finance</p>
                <p className="num">{finance?.any ? moneyText(finance.chargedCents) : "Not on yet"}</p>
                <p>{finance?.any ? `${finance.chargedCount} paid ${finance.chargedCount === 1 ? "post" : "posts"}, before HST` : "Payments and Stripe"}</p>
              </Link>
            </div>

            {finance && (finance.any || finance.waitingToCharge > 0 || finance.refused > 0) && (
              <div className="tiles stats">
                <div className="card tile mini"><p className="kicker">Waiting to charge</p><p className="num">{finance.waitingToCharge}</p><p>Card saved</p></div>
                <div className="card tile mini"><p className="kicker">Refused cards</p><p className="num">{finance.refused}</p><p>To fix</p></div>
                <div className="card tile mini"><p className="kicker">Free or pass</p><p className="num">{finance.freeOrPass}</p><p>In the {label}</p></div>
              </div>
            )}

            <section className="card" aria-labelledby="gatec">
              <h2 id="gatec">Gate C: ready for the paid launch?</h2>
              <p className="help">The 4 things to show before prices are switched on. The first 2 are counted for you. The other 2 are checks only you can make.</p>
              <ul className="gate">
                <li>
                  <label htmlFor="gate-jobs">Live jobs: <strong>{s.gateC.jobs.have} of {s.gateC.jobs.need}</strong>{s.gateC.jobs.met ? " (met)" : ""}</label>
                  <progress id="gate-jobs" value={Math.min(s.gateC.jobs.have, s.gateC.jobs.need)} max={s.gateC.jobs.need} />
                </li>
                <li>
                  <label htmlFor="gate-prov">Provinces with a live job: <strong>{s.gateC.provinces.have} of {s.gateC.provinces.need}</strong>{s.gateC.provinces.met ? " (met)" : ""}</label>
                  <progress id="gate-prov" value={Math.min(s.gateC.provinces.have, s.gateC.provinces.need)} max={s.gateC.provinces.need} />
                </li>
              </ul>
              <p className="help"><strong>Job pages indexed:</strong> check in Google Search Console (Pages) and Bing Webmaster Tools. Not countable here.</p>
              <p className="help"><strong>Free to paid data recorded:</strong> starts when checkout is built. Until then Kestrel records who posted and when, but not what they paid.</p>
              <p className="help"><strong>Quebec check (later):</strong> Quebec planning starts when yearly revenue is close to half the $150,000 target, about $75,000, which you check yourself. Quebec interest so far: {showCount(s.quebec.waitlist)} on the waitlist and {showCount(s.quebec.candidates)} candidate profiles with Quebec as home. Plan: docs/plans/quebec.md.</p>
            </section>

            <details className="card foldcard">
              <summary><h2>Charts and funnels</h2></summary>
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

            </details>

            <details className="card foldcard" id="hires">
              <summary><h2>Hires and where clinics fill roles</h2></summary>
              <p className="help">What clinics tell us when they mark a job as filled. It is self reported, so treat it as a floor: a clinic that never answers is not counted.</p>
              <dl className="facts">
                <div><dt>Hired through Kestrel (the clinic named the person)</dt><dd>{n(s.hires.hiredThroughKestrel)}</dd></div>
                <div><dt>Filled through Kestrel, nobody named</dt><dd>{n(s.hires.viaKestrelUnnamed)}</dd></div>
                <div><dt>Filled another way</dt><dd>{n(s.hires.filledElsewhere)}</dd></div>
                <div><dt>Clinics that told us, of jobs that have ended</dt><dd>{s.hires.answerRate === null ? "No ended jobs yet" : `${s.hires.answerRate}% (${s.hires.answered} of ${s.hires.ended})`}</dd></div>
              </dl>
              {s.hires.filledElsewhere > 0 && <Bars rows={s.hires.elsewhere} label="Where clinics found the person, other than Kestrel" />}
            </details>

            <details className="card foldcard">
              <summary><h2>Investor snapshot</h2></summary>
              <p className="help">The numbers an investor will ask about first. Revenue figures start when payments are switched on.</p>
              <dl className="facts">
                <div><dt>Monthly recurring revenue</dt><dd>Not on yet</dd></div>
                <div><dt>Free to paid conversion</dt><dd>Not on yet</dd></div>
                <div><dt>Posts per clinic</dt><dd>{n(s.investor.postsPerClinic)}</dd></div>
                <div><dt>Clinics that post again</dt><dd>{s.investor.clinicsThatRepost === null ? "Not enough yet" : `${s.investor.clinicsThatRepost}%`}</dd></div>
                <div><dt>Applications per published job</dt><dd>{n(s.investor.applicationsPerJob)}</dd></div>
                <div><dt>Hired through Kestrel</dt><dd>{n(s.hires.hiredThroughKestrel)}</dd></div>
                <div><dt>Clinics that post again within 60 days</dt><dd>{s.repeat60.percent === null ? "Not enough yet" : `${s.repeat60.percent}% (${s.repeat60.repeat} of ${s.repeat60.clinicsWithPosts})`}</dd></div>
              </dl>
              <a href={`/admin/numbers.csv?period=${period}&kind=investor`} className="btn sm ghost">Download investor summary</a>
            </details>
    </>
  );
}

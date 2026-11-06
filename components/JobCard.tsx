import Link from "next/link";
import { employmentLabel, formatPay, longDate, practiceLabel } from "@/lib/jobs";
import type { JobSummary } from "@/lib/public-jobs";

// One job in a list of results: the search page and the landing pages use the same card.
export default function JobCard({ job: j }: { job: JobSummary }) {
  return (
    <article className="card jobcard">
      <div>
        <h2><Link href={`/jobs/${j.id}`}>{j.title}</Link></h2>
        <p className="meta">
          {j.employers?.clinic_name} · {j.city}, {j.province}
        </p>
        <p className="chips">
          <span className="chip">{employmentLabel(j.employment_type)}</span>
          <span className="chip paychip">{formatPay(j.pay_min, j.pay_max, j.pay_period)}</span>
          <span className="chip">{practiceLabel(j.employers?.practice_type)}</span>
          {j.work_arrangement === "field" && <span className="chip">Field based</span>}
        </p>
        {j.is_seeded && !j.employers?.claimed && <p className="seedlabel">Found on the clinic&apos;s website, not yet claimed</p>}
      </div>
      <div className="jobside">
        <span className="meta">Posted {longDate(j.posted_at)}</span>
        <Link href={`/jobs/${j.id}`} className="btn sm" aria-label={`View job: ${j.title}`}>View job</Link>
      </div>
    </article>
  );
}

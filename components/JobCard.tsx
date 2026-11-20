import Link from "next/link";
import { employmentLabel, longDate, practiceLabel } from "@/lib/jobs";
import { payChips } from "@/lib/job-pay";
import { postedLines } from "@/lib/renewed";
import { tagLine, tagsFromRow } from "@/lib/job-tags";
import type { JobSummary } from "@/lib/public-jobs";
import SaveJobButton from "@/components/SaveJobButton";

// One job in a list of results: the search page and the landing pages use the same card. `applied` puts an "Applied" badge on a job
// the signed in candidate has already applied to, so they need not open it to find out (audit P1-58). `saved` (set only for a signed in candidate) adds
// the Save job button, which keeps a job to apply for later.
export default function JobCard({ job: j, applied = false, saved }: { job: JobSummary; applied?: boolean; saved?: boolean }) {
  return (
    <article className="card jobcard">
      <div>
        <h2><Link href={`/jobs/${j.id}`}>{j.title}</Link></h2>
        {j.headline && <p className="headline">{j.headline}</p>}
        <p className="meta">
          {j.employers?.clinic_name} · {j.city}, {j.province}
        </p>
        <p className="chips">
          <span className="chip">{employmentLabel(j.employment_type)}</span>
          {payChips(j).map((c) => <span className="chip paychip" key={c}>{c}</span>)}
          <span className="chip">{practiceLabel(j.employers?.practice_type)}</span>
          {j.work_arrangement === "field" && <span className="chip">Field based</span>}
        </p>
        {tagLine(tagsFromRow(j)) && <p className="tagline">{tagLine(tagsFromRow(j))}</p>}
        {j.is_seeded && !j.employers?.claimed && <p className="seedlabel">Found on the clinic&apos;s website, not yet claimed</p>}
      </div>
      <div className="jobside">
        {applied && <span className="badge a-applied">Applied</span>}
        {(() => {
          // A renewed job shows when it was renewed and keeps its first posting date (Steve, 20th November 2026).
          const dates = postedLines(j, longDate);
          return dates.renewed ? <><span className="meta">Renewed {dates.renewed}</span><span className="meta">First posted {dates.posted}</span></> : <span className="meta">Posted {dates.posted}</span>;
        })()}
        <Link href={`/jobs/${j.id}`} className="btn sm" aria-label={`View job: ${j.title}`}>View job</Link>
        {saved !== undefined && !applied && <SaveJobButton jobId={j.id} initial={saved ? "saved" : "not-saved"} small />}
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// A button for the clinic that owns a job, on the job's public page (Steve, 19th November 2026). The page is saved once and shown to everyone, so
// the button asks the website in the browser, with the clinic's own sign in, whether this job is theirs. Anyone else sees nothing at all.
export default function ViewApplicantsButton({ jobId }: { jobId: string }) {
  const [info, setInfo] = useState<{ total: number; waiting: number } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/job-applicants?job=${encodeURIComponent(jobId)}`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { mine: false }))
      .then((d: { mine: boolean; total?: number; waiting?: number }) => live && d.mine && setInfo({ total: d.total ?? 0, waiting: d.waiting ?? 0 }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [jobId]);
  if (!info) return null;
  return (
    <section className="card viewapplicants">
      <h2>Your applicants</h2>
      <p className="help">{info.total === 0 ? "No applications yet." : `${info.total} ${info.total === 1 ? "application" : "applications"}${info.waiting ? `, ${info.waiting} waiting for you` : ""}.`}</p>
      <p><Link href={`/clinic/jobs/${jobId}/applicants`} className="btn">View applicants{info.total ? ` (${info.total})` : ""}</Link></p>
    </section>
  );
}

import Link from "next/link";
import type { AdminJob, AdminPayment } from "@/components/admin-job-types";
import JobActivity from "@/components/JobActivity";
import StatusBadge from "@/components/StatusBadge";
import { paymentLine } from "@/lib/checkout-mode";
import type { ActivityRow } from "@/lib/job-activity";
import { longDate } from "@/lib/jobs";

// A job as one line that opens when pressed (Steve, 14th November 2026), for the Jobs list and Recently handled under the review queue.
// The line shows the title, clinic, state and when it last changed. Open it for the payment, the notes and a button to the job page.
export default function AdminJobRow({ job, payment, activity }: { job: AdminJob; payment: AdminPayment | undefined; activity: ActivityRow[] }) {
  return (
    <details className="adminrow">
      <summary>
        <span className="adminrow-main">
          <strong>{job.title}</strong>
          <span className="meta">{job.employers?.clinic_name ?? "A clinic"} · {job.city}, {job.province}</span>
        </span>
        <span className="adminrow-side">
          <StatusBadge status={job.status} />
          <span className="meta">{longDate(job.updated_at)}</span>
        </span>
      </summary>
      <div className="adminrow-body">
        <p className="meta">
          {job.role_category}
          {job.posted_at ? ` · live since ${longDate(job.posted_at)}` : ""}
          {job.status === "live" && job.expires_at ? ` until ${longDate(job.expires_at)}` : ""}
        </p>
        <dl className="facts">
          <div><dt>Payment</dt><dd>{paymentLine(payment, job.role_category)}</dd></div>
        </dl>
        <JobActivity rows={activity} />
        {job.status === "live" && <p><Link href={`/jobs/${job.id}`} className="btn sm ghost">View the job page</Link></p>}
      </div>
    </details>
  );
}

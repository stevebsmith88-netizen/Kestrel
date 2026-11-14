import Link from "next/link";
import JobActivity from "@/components/JobActivity";
import StatusBadge from "@/components/StatusBadge";
import { paymentLine } from "@/lib/checkout-mode";
import type { ActivityRow } from "@/lib/job-activity";
import { longDate, type JobStatus } from "@/lib/jobs";

export type AdminJob = {
  id: string;
  title: string;
  status: JobStatus;
  role_category: string | null;
  city: string;
  province: string;
  posted_at: string | null;
  expires_at: string | null;
  updated_at: string;
  employers: { clinic_name: string } | null;
};
export type AdminPayment = { status: string; amount_cents: number; band: string; failure_message: string | null };

// A job in the admin lists that are not the review itself (Admin, Jobs, and Recently handled under the review queue): who, what state, its
// payment, and the closed Activity drop down. The review queue's own cards show the whole advert and the buttons instead.
export default function AdminJobCard({ job, payment, activity }: { job: AdminJob; payment: AdminPayment | undefined; activity: ActivityRow[] }) {
  return (
    <article className="card review">
      <div className="listhead">
        <div>
          <h2>{job.title}</h2>
          <p className="meta">
            {job.employers?.clinic_name} · {job.role_category} · {job.city}, {job.province}
            {job.posted_at ? ` · live since ${longDate(job.posted_at)}` : ""}
            {job.status === "live" && job.expires_at ? ` until ${longDate(job.expires_at)}` : ""}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <dl className="facts">
        <div><dt>Payment</dt><dd>{paymentLine(payment, job.role_category)}</dd></div>
      </dl>
      <JobActivity rows={activity} />
      {job.status === "live" && <p className="meta"><Link href={`/jobs/${job.id}`}>View the job page</Link></p>}
    </article>
  );
}

import { STATUS_LABELS, type JobStatus } from "@/lib/jobs";

export default function StatusBadge({ status }: { status: JobStatus }) {
  return <span className={`badge b-${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

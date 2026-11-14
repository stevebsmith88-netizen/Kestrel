import type { ActivityRow } from "@/lib/job-activity";

const when = (iso: string) => new Date(iso).toLocaleString("en-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" });

// The notes for a job, closed until opened so the page stays tidy (Steve, 14th November 2026). Technical detail, such as what Stripe said,
// sits under each line in smaller type. For Kestrel's admin only.
export default function JobActivity({ rows }: { rows: ActivityRow[] }) {
  return (
    <details className="activity">
      <summary>Activity ({rows.length})</summary>
      {rows.length === 0 ? (
        <p className="meta">Nothing recorded yet.</p>
      ) : (
        <ul>
          {rows.map((r, i) => (
            <li key={`${r.created_at}-${i}`}>
              <span className="when">{when(r.created_at)}</span> {r.text}
              {r.detail && <span className="meta"> {r.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

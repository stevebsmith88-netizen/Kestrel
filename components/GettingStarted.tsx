import Link from "next/link";
import { allDone, nextStep, type Step } from "@/lib/checklist";

// A short checklist at the top of the home page for a new clinic or candidate. It disappears once every step is done.
export default function GettingStarted({ title, steps }: { title: string; steps: Step[] }) {
  if (allDone(steps)) return null;
  const next = nextStep(steps);
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <section className="card checklist" aria-labelledby="gs-title">
      <h2 id="gs-title">{title}</h2>
      <p className="help">{doneCount} of {steps.length} done</p>
      <ol>
        {steps.map((s) => (
          <li key={s.label} className={s.done ? "gs-done" : s === next ? "gs-next" : undefined}>
            <p className="gs-label"><span className="gs-mark" aria-hidden="true" /><strong>{s.label}</strong><span className="sr">{s.done ? " (done)" : s === next ? " (next)" : ""}</span></p>
            {!s.done && <p className="gs-detail">{s.detail}</p>}
            {s === next && <Link href={s.href} className="btn sm">{s.cta}</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
}

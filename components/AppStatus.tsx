import { APP_LABELS, CANDIDATE_STEPS, STEPS, isClosed, reachedStep, type AppStatus } from "@/lib/applications";

export function AppStatusBadge({ status }: { status: string }) {
  return <span className={`badge a-${status}`}>{APP_LABELS[status as AppStatus] ?? status}</span>;
}

// The progress bar: 5 steps for a clinic, 4 for a candidate (who is never shown Shortlisted). For a closed application it shows how far it got, in grey.
export function Steps({ current, history, forCandidate = false }: { current: string; history: string[]; forCandidate?: boolean }) {
  const steps: readonly string[] = forCandidate ? CANDIDATE_STEPS : STEPS;
  const closed = isClosed(current);
  const reached = reachedStep(history, current, steps);
  const active = closed ? -1 : steps.indexOf(current);
  return (
    <ol className="steps" aria-label="Progress of this application">
      {steps.map((step, i) => {
        let cls = "step";
        if (closed) {
          if (i <= reached) cls += " done mute";
        } else if (i < active) cls += " done";
        else if (i === active) cls += " now";
        return (
          <li key={step} className={cls} aria-current={i === active ? "step" : undefined}>
            <div className="bar" />
            {APP_LABELS[step as AppStatus]}
          </li>
        );
      })}
    </ol>
  );
}

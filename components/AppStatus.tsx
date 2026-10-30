import { APP_LABELS, STEPS, isClosed, reachedStep, type AppStatus } from "@/lib/applications";

export function AppStatusBadge({ status }: { status: string }) {
  return <span className={`badge a-${status}`}>{APP_LABELS[status as AppStatus] ?? status}</span>;
}

// The five step progress bar. For a closed application it shows how far it got, in grey.
export function Steps({ current, history }: { current: string; history: string[] }) {
  const closed = isClosed(current);
  const reached = reachedStep(history, current);
  const active = closed ? -1 : (STEPS as readonly string[]).indexOf(current);
  return (
    <ol className="steps" aria-label="Progress of this application">
      {STEPS.map((step, i) => {
        let cls = "step";
        if (closed) {
          if (i <= reached) cls += " done mute";
        } else if (i < active) cls += " done";
        else if (i === active) cls += " now";
        return (
          <li key={step} className={cls} aria-current={i === active ? "step" : undefined}>
            <div className="bar" />
            {APP_LABELS[step]}
          </li>
        );
      })}
    </ol>
  );
}

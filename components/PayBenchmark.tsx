"use client";

import { parseMoney } from "@/lib/jobs";
import { describeBenchmark, findBenchmark, LICENCE_STATEMENT, LICENCE_URL, type OwnPayStat } from "@/lib/pay-benchmark";

// The pay guide on the post a job form. It follows the role, province, pay basis and range as the clinic fills them in.
// It is guidance only and never stops a post, so it has no effect on the form's checks or on saving.
export default function PayBenchmark({ role, province, period, min, max, own }: { role: string; province: string; period: string; min: string; max: string; own: readonly OwnPayStat[] }) {
  const benchmark = role && province ? findBenchmark(role, province, own) : null;
  if (!benchmark) return null;
  const low = parseMoney(min);
  const high = parseMoney(max);
  const m = describeBenchmark({ role, province, period, min: low ?? 0, max: high ?? 0 }, benchmark);
  return (
    <aside className={`payguide pg-${m.verdict ?? "none"}`} aria-labelledby="pg-h" aria-live="polite">
      <p className="pg-kicker" id="pg-h">{m.heading}</p>
      <p className="pg-lead">{m.lead}</p>
      {m.detail && <p>{m.detail}</p>}
      <p className="help">{m.short}</p>
      <details className="pgdetails">
        <summary><span className="plus" aria-hidden="true">+</span> Source and details</summary>
        <p className="help">{m.source}</p>
        <p className="help">{m.caution}</p>
        {m.licence && (
          <p className="help">
            {LICENCE_STATEMENT} <a href={LICENCE_URL} target="_blank" rel="noopener noreferrer">Licence</a>. Kestrel has adapted the figures (hourly and yearly pay shown on one basis) and is not endorsed by the Government of Canada.
          </p>
        )}
      </details>
    </aside>
  );
}

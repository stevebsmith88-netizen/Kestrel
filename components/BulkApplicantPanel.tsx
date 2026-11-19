"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { showToast } from "@/components/toast";
import { BULK_PROBLEMS } from "@/lib/bulk-notices";
import { DASHBOARD_NOTICES, noticeTone, type QuickState } from "@/lib/dashboard-notices";

type BulkAction = (prev: QuickState, form: FormData) => Promise<QuickState>;

// A button that sends the ticked applicants (and the message) to the server and shows the answer in a small message, without
// leaving the page. It is disabled while it saves, so a double click cannot act twice.
function BulkButton({ action, className, onCheck, children }: { action: BulkAction; className: string; onCheck: (e: MouseEvent<HTMLButtonElement>) => void; children: ReactNode }) {
  const { pending } = useFormStatus();
  async function run(form: FormData) {
    try {
      const result = await action(null, form);
      const text = result?.text ?? (result?.notice ? DASHBOARD_NOTICES[result.notice] : "");
      if (text && result) showToast(text, result.tone ?? noticeTone(result.notice));
    } catch (e) {
      // A redirect (for example to sign in again) is not a failure, so let it through.
      if (String((e as { digest?: unknown } | null)?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e;
      showToast("We couldn't do that just now. Please try again in a moment.", "warn");
    }
  }
  return (
    <button type="submit" formAction={run} className={className} disabled={pending} aria-busy={pending} onClick={onCheck}>
      {children}
    </button>
  );
}

// The "With the ticked applicants" box on the applicants page. It sits inside the page's form, so the 3 buttons send the ticked
// applicants (and the message) to the server. The check for "nothing ticked" happens here, on the
// page, before anything is sent, so the ticks and the message are never lost. The server checks again (lib/applicant-actions.ts).
// When a button works, the applicants list refreshes where it stands, the ticks and message clear, and a small message appears.
export default function BulkApplicantPanel({ shortlist, decline }: { shortlist: BulkAction; decline: BulkAction }) {
  const [problem, setProblem] = useState("");

  function check(e: MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form;
    if (!form) return;
    if (!form.querySelector('input[name="ids"]:checked')) {
      e.preventDefault();
      setProblem(BULK_PROBLEMS.none);
      return;
    }
    setProblem("");
  }

  return (
    <section className="card bulkpanel" aria-labelledby="bulk-title">
      <h2 id="bulk-title">With the ticked applicants</h2>
      <ul className="bulkhelp">
        <li><strong>Shortlist</strong> is your own working list. No email is sent.</li>
        <li><strong>Send a kind no</strong> gives each person the same warm message you would send one at a time, by email and in their account.</li>
      </ul>
      <p className="help">Interviews and offers are never made in bulk, because each needs its own time, place and details. Open the application to invite someone.</p>
      {problem && <p className="notice warn bulkproblem" id="bulk-problem" role="alert">{problem}</p>}
      <div className="bulkbtns">
        <BulkButton action={shortlist} className="btn sm" onCheck={check}>Shortlist</BulkButton>
        <BulkButton action={decline} className="btn sm ghost" onCheck={check}>Send a kind no</BulkButton>
      </div>
    </section>
  );
}

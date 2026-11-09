"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
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
// applicants (and the message) to the server. The checks for "nothing ticked" and "no interview message" happen here, on the
// page, before anything is sent, so the ticks and the message are never lost. The server checks again (lib/applicant-actions.ts).
// When a button works, the applicants list refreshes where it stands, the ticks and message clear, and a small message appears.
export default function BulkApplicantPanel({ shortlist, interview, decline }: { shortlist: BulkAction; interview: BulkAction; decline: BulkAction }) {
  const [problem, setProblem] = useState("");
  const message = useRef<HTMLTextAreaElement>(null);

  function check(e: MouseEvent<HTMLButtonElement>, needsMessage: boolean) {
    const form = e.currentTarget.form;
    if (!form) return;
    if (!form.querySelector('input[name="ids"]:checked')) {
      e.preventDefault();
      setProblem(BULK_PROBLEMS.none);
      return;
    }
    if (needsMessage) {
      const text = message.current?.value.trim() ?? "";
      if (!text) {
        e.preventDefault();
        setProblem(BULK_PROBLEMS.message);
        message.current?.focus();
        return;
      }
      if (/\[[^\]]+\]/.test(text)) {
        e.preventDefault();
        setProblem(BULK_PROBLEMS.brackets);
        message.current?.focus();
        return;
      }
    }
    setProblem("");
  }

  return (
    <section className="card bulkpanel" aria-labelledby="bulk-title">
      <h2 id="bulk-title">With the ticked applicants</h2>
      <ul className="bulkhelp">
        <li><strong>Shortlist</strong> is your own working list. No email is sent.</li>
        <li><strong>Invite to interview</strong> sends everyone you tick the message below, by email and in their account. For different times, open each application.</li>
        <li><strong>Send a kind no</strong> gives each person the same warm message you would send one at a time, by email and in their account.</li>
      </ul>
      <label className="lab" htmlFor="bulkMessage">Interview invitation (used only for Invite to interview)</label>
      <textarea
        ref={message}
        id="bulkMessage"
        name="message"
        rows={3}
        maxLength={1500}
        aria-describedby={problem ? "bulk-problem" : undefined}
        onChange={() => problem && setProblem("")}
        placeholder="For example: We would like to meet you at the clinic on Tuesday 24th November at 2 pm. We will contact you using the details on your application to confirm."
      />
      <p className="help">Offers are never made in bulk. Open the application to make one.</p>
      {problem && <p className="notice warn bulkproblem" id="bulk-problem" role="alert">{problem}</p>}
      <div className="bulkbtns">
        <BulkButton action={shortlist} className="btn sm" onCheck={(e) => check(e, false)}>Shortlist</BulkButton>
        <BulkButton action={interview} className="btn sm" onCheck={(e) => check(e, true)}>Invite to interview</BulkButton>
        <BulkButton action={decline} className="btn sm ghost" onCheck={(e) => check(e, false)}>Send a kind no</BulkButton>
      </div>
    </section>
  );
}

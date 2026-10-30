"use client";

import Link from "next/link";
import { Choices, Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { submitReport } from "@/lib/report-actions";
import { REPORT_REASONS } from "@/lib/reports";

export default function ReportForm({ jobId }: { jobId: string }) {
  const { state, pending, submit } = useServerForm(submitReport);
  if (state.message) {
    return (
      <section className="card setup" role="status">
        <h2>Report received</h2>
        <p>{state.message}</p>
        <Link href="/jobs" className="btn">Back to all jobs</Link>
      </section>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <input type="hidden" name="jobId" value={jobId} />
      {/* A trap for automated sign ups. People never see or reach it. */}
      <div className="hp" aria-hidden="true">
        <label>Leave this empty <input type="text" name="website2" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <Choices name="reason" label="What is wrong with this job?" options={REPORT_REASONS} />
      <Field id="rp-details" label="Tell us more" hint="Optional, unless you chose Something else. Please do not include sensitive personal details.">
        <textarea id="rp-details" name="details" rows={4} maxLength={1000} />
      </Field>
      <Field id="rp-email" label="Your email" hint="Optional. Only if you would like us to write back. We use it for nothing else.">
        <input id="rp-email" name="email" type="email" autoComplete="email" />
      </Field>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Sending" : "Send report"}</button>
    </form>
  );
}

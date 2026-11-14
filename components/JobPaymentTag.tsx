import Link from "next/link";
import { dollars } from "@/lib/checkout-mode";
import type { JobPayment } from "@/lib/clinic-payments";

// What a clinic sees about the money for 1 job, under the job on its dashboard. A refused card, or a card that was never saved, is a button
// that opens Stripe's card page for that job (the same page as the link in the email). Someone who can only view sees the words, not the button.
export default function JobPaymentTag({ jobId, jobStatus, payment, editor }: { jobId: string; jobStatus: string; payment: JobPayment | undefined; editor: boolean }) {
  if (!payment) return null;
  const pay = `/clinic/jobs/${jobId}/pay`;
  if (payment.status === "charged") {
    return <p className="meta"><span className="badge b-live">Paid {dollars(payment.amount_cents)}</span> plus HST</p>;
  }
  if (payment.status === "failed" && jobStatus === "in_review") {
    return (
      <div className="paynote">
        <p className="meta">Your card was refused. The job goes live as soon as a card works.</p>
        {editor && <Link href={pay} className="btn sm">Card payment error: update card</Link>}
      </div>
    );
  }
  if (payment.status === "awaiting_card" && (jobStatus === "draft" || jobStatus === "in_review")) {
    return (
      <div className="paynote">
        <p className="meta">No card saved yet, so the job has not been sent.</p>
        {editor && <Link href={pay} className="btn sm">Save a card to send it</Link>}
      </div>
    );
  }
  if (payment.status === "card_saved" && jobStatus === "in_review") {
    return <p className="meta">Card saved. We charge {dollars(payment.amount_cents)} plus HST when the job is approved.</p>;
  }
  return null;
}

import { paymentStatusLabel, totalPaidCents } from "@/lib/billing-text";
import { dollars } from "@/lib/checkout-mode";
import type { PaymentHistoryRow } from "@/lib/clinic-payments";
import { longDate } from "@/lib/jobs";

// Every payment for the location being worked in, with its invoice and receipt links (Plans and billing, Payment history). Amounts are before HST.
export default function PaymentHistory({ payments }: { payments: PaymentHistoryRow[] }) {
  if (payments.length === 0) {
    return <section className="card"><p>Nothing here yet. When a job is approved and paid for, it appears here with its invoice. Jobs posted during the free launch show as free.</p></section>;
  }
  return (
    <section className="card">
      <table className="locationsum">
        <thead>
          <tr><th scope="col">Date</th><th scope="col">Job</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Invoice and receipt</th></tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{longDate(p.charged_at ?? p.created_at)}</td>
              <td>{p.job_title}</td>
              <td>{dollars(p.amount_cents)}</td>
              <td>{paymentStatusLabel(p.status)}</td>
              <td>
                {p.invoice_pdf_url ? <a href={p.invoice_pdf_url} className="linkbtn" target="_blank" rel="noopener noreferrer">Invoice PDF</a> : null}
                {p.invoice_pdf_url && p.invoice_url ? " · " : null}
                {p.invoice_url ? <a href={p.invoice_url} className="linkbtn" target="_blank" rel="noopener noreferrer">View{p.invoice_number ? ` ${p.invoice_number}` : ""} and receipt</a> : null}
                {!p.invoice_pdf_url && !p.invoice_url ? <span className="meta">None</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta">Total paid so far: {dollars(totalPaidCents(payments))} before HST.</p>
    </section>
  );
}

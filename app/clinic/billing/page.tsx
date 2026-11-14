import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import LocationPicker from "@/components/LocationPicker";
import { requireRole } from "@/lib/auth";
import { paymentStatusLabel, totalPaidCents } from "@/lib/billing-text";
import { dollars } from "@/lib/checkout-mode";
import { getMyClinics, getMyEmployer } from "@/lib/clinic";
import { getMyPaymentHistory } from "@/lib/clinic-payments";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Billing | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// My clinic, Billing (Steve, 14th November 2026). Every payment for the location being worked in, with the invoice and a receipt to download
// again. Amounts are before HST. Receipts open on Stripe's own invoice page.
export default async function ClinicBilling() {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");
  const clinics = await getMyClinics(session.userId);
  const payments = await getMyPaymentHistory(employer.id);
  const total = totalPaidCents(payments);
  return (
    <>
      <AppBar session={session} current="/clinic/billing" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">{employer.clinic_name}</p>
          <h1>Billing</h1>
          <LocationPicker clinics={clinics} current={employer.id} back="/clinic/billing" />
          <p className="lede2">Every payment for this location, with the invoice and a receipt you can download again. Amounts are before HST.</p>
          {payments.length === 0 ? (
            <section className="card"><p>Nothing here yet. When a job is approved and paid for, it appears here with its receipt. Jobs posted during the free launch show as free.</p></section>
          ) : (
            <section className="card">
              <table className="locationsum">
                <thead>
                  <tr><th scope="col">Date</th><th scope="col">Job</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Receipt</th></tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{longDate(p.charged_at ?? p.created_at)}</td>
                      <td>{p.job_title}</td>
                      <td>{dollars(p.amount_cents)}</td>
                      <td>{paymentStatusLabel(p.status)}</td>
                      <td>
                        {p.invoice_pdf_url ? <a href={p.invoice_pdf_url} className="linkbtn" target="_blank" rel="noopener noreferrer">Download</a> : null}
                        {p.invoice_pdf_url && p.invoice_url ? " · " : null}
                        {p.invoice_url ? <a href={p.invoice_url} className="linkbtn" target="_blank" rel="noopener noreferrer">View{p.invoice_number ? ` ${p.invoice_number}` : ""}</a> : null}
                        {!p.invoice_pdf_url && !p.invoice_url ? <span className="meta">None</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="meta">Total paid so far: {dollars(total)} before HST.</p>
            </section>
          )}
          <p className="help">Questions about a payment? Use <Link href="/account/help">Help and feedback</Link>.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

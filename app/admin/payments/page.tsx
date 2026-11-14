import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import StripeSetupCheck from "@/components/StripeSetupCheck";
import { requireRole } from "@/lib/auth";
import { stripeChecks } from "@/lib/stripe-setup";

export const metadata: Metadata = { title: "Payments | Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Admin, Payments. Step 1 of docs/plans/stripe-plan.md: is Stripe connected? Products, checkout and the Sales and HST page
// come here in later steps.
export default async function AdminPayments() {
  const session = await requireRole("admin");
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href="/admin">Back to the overview</Link></p>
          <h1>Payments</h1>
          <p className="lede2">Whether Stripe is connected. Checkout is not built yet, so no clinic is asked to pay and posting stays free.</p>
          <StripeSetupCheck checks={stripeChecks(process.env)} />
        </div>
      </main>
      <AppFooter />
    </>
  );
}

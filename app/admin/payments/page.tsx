import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import StripeSetupCheck from "@/components/StripeSetupCheck";
import { requireRole } from "@/lib/auth";
import SlackCheck from "@/components/SlackCheck";
import StripeCatalogPanel from "@/components/StripeCatalogPanel";
import { slackStatus } from "@/lib/slack-text";
import { FOUNDING_CLINICS, FREE_LAUNCH_ENDS } from "@/lib/pricing";
import { listFounding } from "@/lib/founding-flow";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { stripeKey } from "@/lib/stripe";
import { loadCatalogStatus } from "@/lib/stripe-catalog-sync";
import { secretKeyMode, stripeChecks } from "@/lib/stripe-setup";

export const metadata: Metadata = { title: "Payments | Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Admin, Payments. Step 1 of docs/plans/stripe-plan.md: is Stripe connected? Products, checkout and the Sales and HST page
// come here in later steps.
export default async function AdminPayments() {
  const session = await requireRole("admin");
  const key = stripeKey();
  const testKey = secretKeyMode(key ?? undefined) === "test";
  const catalog = testKey && key ? await loadCatalogStatus(key) : null;
  const admin = supabaseAdmin();
  const founding = admin ? await listFounding(admin) : [];
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href="/admin">Back to the dashboard</Link></p>
          <h1>Payments</h1>
          <p className="lede2">Whether Stripe and Slack are connected, the products and prices Stripe holds, and the Founding clinics.</p>
          <StripeSetupCheck checks={stripeChecks(process.env)} />
          <SlackCheck {...slackStatus(process.env.SLACK_WEBHOOK_URL)} />
          <section className="card">
            <h2>Founding clinics: {founding.length} of {FOUNDING_CLINICS.places}</h2>
            <p className="help">The first {FOUNDING_CLINICS.places} clinic locations to have a job approved during the free launch, in that order. Each carries a Founding clinic mark on its public page. The offer is open until {FREE_LAUNCH_ENDS}.</p>
            {founding.length === 0 ? (
              <p>None yet. The first clinic takes number 1 when its first job is approved.</p>
            ) : (
              <ul className="plainlist">
                {founding.map((f) => <li key={f.employerId}>{f.number}. {f.clinicName}, {f.city}, {f.province} · {longDate(f.claimedAt)}</li>)}
              </ul>
            )}
          </section>
          {catalog && <StripeCatalogPanel rows={catalog.rows} coupon={catalog.coupon} endsOn={FREE_LAUNCH_ENDS} canSync readError={catalog.error} />}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

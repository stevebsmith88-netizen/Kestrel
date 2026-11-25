import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { EndAccessForm, FeedbackForm, HelpRequestForm } from "@/components/SupportForms";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { clinicAccess } from "@/lib/support-server";

export const metadata: Metadata = { title: "Help and feedback | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Help and feedback (Steve, 14th November 2026; migration 0046): a clinic asks Kestrel for help, and anyone tells us about a problem or an idea.
export default async function HelpAndFeedback() {
  const session = await requireRole("candidate", "clinic");
  const employer = session.role === "clinic" ? await getMyEmployer(session.userId) : null;
  const admin = supabaseAdmin();
  const access = employer && admin ? await clinicAccess(admin, employer.id) : null;
  return (
    <>
      <AppBar session={session} current="/account/help" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Help and feedback</h1>
          <p className="lede2">Most answers are in the <Link href="/help">help centre</Link>. If yours is not, a person at Kestrel reads everything sent here.</p>

          {session.role === "clinic" && (
            <section className="supportblock">
              <h2>Ask Kestrel for help</h2>
              {access && (
                <div className="notice noticerow" role="status">
                  <p>Kestrel can see and change your clinic&apos;s account until {longDate(access.access_until as string)}, to help with your request.</p>
                  {employer?.level === "owner" && <EndAccessForm id={access.id as string} />}
                </div>
              )}
              <HelpRequestForm owner={employer?.level === "owner"} />
            </section>
          )}

          <section className="supportblock">
            <h2>Found a problem, or have an idea?</h2>
            <FeedbackForm />
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

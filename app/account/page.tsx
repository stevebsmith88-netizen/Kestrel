import type { Metadata } from "next";
import { cleanFrequency } from "@/lib/clinic-emails";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import AccountView from "@/components/AccountView";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { longDate } from "@/lib/jobs";
import { nameLockedUntil } from "@/lib/name-hold";

export const metadata: Metadata = { title: "My account | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const session = await requireRole("candidate", "clinic");
  const { email: emailNotice } = await searchParams;
  const admin = supabaseAdmin();

  const { data: profile } = admin ? await admin.from("profiles").select("first_name, last_name, marketing_consent, unsubscribed_at, notify_application_updates").eq("id", session.userId).maybeSingle() : { data: null };
  const { data: employer } = admin && session.role === "clinic" ? await admin.from("employers").select("id").eq("owner_id", session.userId).maybeSingle() : { data: null };
  const { data: contact } = admin && employer ? await admin.from("employer_contacts").select("*").eq("employer_id", employer.id).maybeSingle() : { data: null };

  // When the name can next be changed (lib/name-hold.ts). A missing column means no hold yet, so a database without migration 0039 still works.
  const { data: held, error: heldError } = admin ? await admin.from("profiles").select("name_changed_at").eq("id", session.userId).maybeSingle() : { data: null, error: null };
  const lockedUntil = !heldError && held?.name_changed_at ? nameLockedUntil(held.name_changed_at) : null;
  const first = profile?.first_name || session.firstName;
  const last = profile?.last_name ?? "";
  return (
    <>
      <AppBar session={session} current="/account" />
      <main id="main" tabIndex={-1} className="app">
        <AccountView
          role={session.role === "clinic" ? "clinic" : "candidate"}
          email={session.email}
          first={first}
          last={last}
          nameLockedUntil={lockedUntil ? longDate(lockedUntil) : null}
          hasClinic={Boolean(employer)}
          hasPassword={session.hasPassword}
          emailNotice={emailNotice}
          prefs={{
            news: Boolean(profile?.marketing_consent) && !profile?.unsubscribed_at,
            applicationUpdates: profile?.notify_application_updates !== false,
            applicantEmails: cleanFrequency(contact?.notify_new_applications === false ? "off" : contact?.notify_frequency),
            reminders: contact?.notify_reminders !== false,
          }}
        />
      </main>
      <AppFooter />
    </>
  );
}

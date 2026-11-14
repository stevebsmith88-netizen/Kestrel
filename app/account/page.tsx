import { hasApplicationInPlay } from "@/lib/live-applications";
import type { Metadata } from "next";
import { cleanFrequency } from "@/lib/clinic-emails";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import AccountView from "@/components/AccountView";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { longDate } from "@/lib/jobs";
import { nameLockedUntil } from "@/lib/name-hold";

import { isExportProblem } from "@/lib/export-check";

export const metadata: Metadata = { title: "My account | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ email?: string; download?: string }> }) {
  const session = await requireRole("candidate", "clinic");
  const { email: emailNotice, download } = await searchParams;
  const admin = supabaseAdmin();

  const { data: profile } = admin ? await admin.from("profiles").select("first_name, last_name, marketing_consent, unsubscribed_at, notify_application_updates").eq("id", session.userId).maybeSingle() : { data: null };
  const { data: employer } = admin && session.role === "clinic" ? await admin.from("employers").select("id").eq("owner_id", session.userId).maybeSingle() : { data: null };
  // An owner with a team cannot delete the clinic out from under them (Steve, 14th November 2026). No team table yet means no team.
  const { count: teamCount } = admin && employer ? await admin.from("employer_members").select("user_id", { count: "exact", head: true }).eq("employer_id", employer.id) : { count: 0 };
  const { data: contact } = admin && employer ? await admin.from("employer_contacts").select("*").eq("employer_id", employer.id).maybeSingle() : { data: null };

  // When the name can next be changed (lib/name-hold.ts). A missing column means no hold yet, so a database without migration 0039 still works.
  const { data: held, error: heldError } = admin ? await admin.from("profiles").select("name_changed_at").eq("id", session.userId).maybeSingle() : { data: null, error: null };
  const lockedUntil = !heldError && held?.name_changed_at ? nameLockedUntil(held.name_changed_at) : null;
  // A candidate with an application still in play cannot change their name (lib/live-applications.ts).
  const nameInPlay = session.role === "candidate" && !lockedUntil ? await hasApplicationInPlay(admin as unknown as Parameters<typeof hasApplicationInPlay>[0], session.userId) : false;
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
          nameInPlay={nameInPlay}
          hasClinic={Boolean(employer)}
          teamCount={teamCount ?? 0}
          hasPassword={session.hasPassword}
          emailNotice={emailNotice}
          downloadProblem={isExportProblem(download) ? download : undefined}
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

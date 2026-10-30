import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Account() {
  const session = await requireRole("candidate", "clinic");
  const db = await supabaseServer();
  const { data: profile } = db ? await db.from("profiles").select("marketing_consent").eq("id", session.userId).maybeSingle() : { data: null };
  const home = session.role === "clinic" ? "/clinic" : "/candidate";
  return (
    <>
      <AppBar session={session} current="/account" />
      <main className="app">
        <div className="wrap narrow">
          <p className="back"><Link href={home}>Back to my home</Link></p>
          <p className="kicker">My account</p>
          <h1>Your account</h1>
          <section className="card">
            <dl className="facts">
              <div><dt>Name</dt><dd>{session.fullName || "Not given"}</dd></div>
              <div><dt>Email</dt><dd>{session.email}</dd></div>
              <div><dt>Account type</dt><dd>{session.role === "clinic" ? "Clinic" : "Candidate"}</dd></div>
              <div><dt>Updates by email</dt><dd>{profile?.marketing_consent ? "You agreed to hear from us" : "Not signed up"}</dd></div>
            </dl>
            <p className="help">To change your name or email, or to stop marketing emails, write to <a href="mailto:privacy@eyecarejobs.ca">privacy@eyecarejobs.ca</a>. Every marketing email also has an unsubscribe link.</p>
          </section>
          <section className="card">
            <DeleteAccountForm role={session.role === "clinic" ? "clinic" : "candidate"} />
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

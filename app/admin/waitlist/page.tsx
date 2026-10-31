import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Waitlist | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Row = { id: string; created_at: string; audience: string; first_name: string; last_name: string | null; email: string; clinic_name: string | null; role: string | null; province: string; unsubscribed_at: string | null; confirmed_at: string | null; confirmation_sent_at: string | null };

export default async function Waitlist() {
  const session = await requireRole("admin");
  const db = supabaseAdmin();
  const { data, count } = db
    ? await db.from("waitlist").select("id, created_at, audience, first_name, last_name, email, clinic_name, role, province, unsubscribed_at, confirmed_at, confirmation_sent_at", { count: "exact" }).order("created_at", { ascending: false }).limit(500)
    : { data: null, count: null };
  const rows = (data ?? []) as Row[];
  return (
    <>
      <AppBar session={session} current="/admin/waitlist" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">Admin</p>
          <h1>Waitlist</h1>
          <p className="lede2">
            {count ?? rows.length} {(count ?? rows.length) === 1 ? "person" : "people"} on the list. <a href="/admin/waitlist.csv">Download the ready to email list</a> (confirmed, not unsubscribed, with each person's unsubscribe link) or <a href="/admin/waitlist.csv?all=1">everyone, with a status column</a>
          </p>
          <p className="help">People now confirm their address by email. Only email people from the ready to email download, never from the full list. Anyone marked "Joined before confirmation emails" ticked the consent box, but we never checked their address.</p>
          {rows.length === 0 ? (
            <section className="card"><p>Nobody has joined yet.</p></section>
          ) : (
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr><th>Joined</th><th>Name</th><th>Email</th><th>Is a</th><th>Clinic</th><th>Role</th><th>Province</th><th>Emails</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{longDate(r.created_at)}</td>
                      <td>{[r.first_name, r.last_name].filter(Boolean).join(" ")}</td>
                      <td>{r.email}</td>
                      <td>{r.audience === "clinic" ? "Clinic" : "Candidate"}</td>
                      <td>{r.clinic_name ?? ""}</td>
                      <td>{r.role ?? ""}</td>
                      <td>{r.province}</td>
                      <td>{r.unsubscribed_at ? `Unsubscribed ${longDate(r.unsubscribed_at)}` : r.confirmed_at ? `Confirmed ${longDate(r.confirmed_at)}` : r.confirmation_sent_at ? "Waiting to confirm" : "Joined before confirmation emails"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

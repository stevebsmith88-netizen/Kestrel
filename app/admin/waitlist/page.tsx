import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { sourceLabel, type Attribution } from "@/lib/attribution";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Waitlist | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Row = { id: string; created_at: string; audience: string; first_name: string; last_name: string | null; email: string; clinic_name: string | null; role: string | null; province: string; unsubscribed_at: string | null; confirmed_at: string | null; confirmation_sent_at: string | null } & Partial<Attribution>;

export default async function Waitlist() {
  const session = await requireRole("admin");
  const db = supabaseAdmin();
  const base = "id, created_at, audience, first_name, last_name, email, clinic_name, role, province, unsubscribed_at, confirmed_at, confirmation_sent_at";
  const load = (columns: string) => db!.from("waitlist").select(columns, { count: "exact" }).order("created_at", { ascending: false }).limit(500);
  let result = db ? await load(`${base}, utm_source, utm_medium, utm_campaign, referrer_host, landing_path`) : null;
  // Before migration 0032 is run, the list still shows, without the source column.
  if (db && result?.error) result = await load(base);
  const rows = (result?.data ?? []) as unknown as Row[];
  const count = result?.count ?? null;
  const bySource = new Map<string, number>();
  for (const r of rows) bySource.set(sourceLabel(r), (bySource.get(sourceLabel(r)) ?? 0) + 1);
  const sources = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
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
          {sources.length > 0 && (
            <p className="help">
              <strong>Where people came from</strong> (latest {rows.length}): {sources.map(([label, n]) => `${label} ${n}`).join(", ")}. "Not recorded" means they joined before sources were saved. See docs/utm-guide.md for how to tag links.
            </p>
          )}
          {rows.length === 0 ? (
            <section className="card"><p>Nobody has joined yet.</p></section>
          ) : (
            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr><th>Joined</th><th>Name</th><th>Email</th><th>Is a</th><th>Clinic</th><th>Role</th><th>Province</th><th>Came from</th><th>Emails</th></tr>
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
                      <td>{sourceLabel(r)}{r.landing_path ? ` on ${r.landing_path}` : ""}</td>
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

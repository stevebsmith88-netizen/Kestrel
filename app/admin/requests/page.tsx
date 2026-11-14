import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { accessOpen, kindLabel, reasonLabel } from "@/lib/support";
import { closeSupportRequest } from "@/lib/support-actions";

export const metadata: Metadata = { title: "Help requests and feedback | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Row = { id: string; kind: string; reason: string | null; message: string; page: string | null; access_until: string | null; status: string; created_at: string; employer_id: string | null; user_id: string | null; employers: { clinic_name: string } | null };

// Help requests from clinics and feedback from everyone (migration 0046), newest first. Closing a help request ends Kestrel's access.
export default async function AdminRequests({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const session = await requireRole("admin");
  const { show } = await searchParams;
  const admin = supabaseAdmin();
  const done = show === "done";
  const { data } = admin
    ? await admin.from("support_requests").select("id, kind, reason, message, page, access_until, status, created_at, employer_id, user_id, employers(clinic_name)").eq("status", done ? "done" : "open").order("created_at", { ascending: false }).limit(100)
    : { data: [] };
  const rows = (data ?? []) as unknown as Row[];
  const emails = new Map<string, string>();
  if (admin) for (const id of new Set(rows.map((r) => r.user_id).filter(Boolean) as string[])) emails.set(id, (await admin.auth.admin.getUserById(id)).data.user?.email ?? "");
  return (
    <>
      <AppBar session={session} current="/admin/requests" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Help requests and feedback</h1>
          <p className="lede2">Each one was also emailed to support@. Reply by email; mark it done here when it is sorted. Closing a help request ends Kestrel&apos;s access to that clinic&apos;s account.</p>
          <nav className="tabs" aria-label="Show">
            <Link href="/admin/requests" className={`tab ${done ? "" : "on"}`} aria-current={done ? undefined : "page"}>Open</Link>
            <Link href="/admin/requests?show=done" className={`tab ${done ? "on" : ""}`} aria-current={done ? "page" : undefined}>Done</Link>
          </nav>
          {rows.length === 0 ? <p className="help">Nothing here.</p> : (
            <ul className="teamlist">
              {rows.map((r) => (
                <li key={r.id} className="card">
                  <div>
                    <strong>{kindLabel(r.kind)}{r.kind === "help" ? `: ${reasonLabel(r.reason)}` : ""}</strong>
                    <p className="meta">{longDate(r.created_at)} · {emails.get(r.user_id ?? "") || "account deleted"}{r.employers ? ` · ${r.employers.clinic_name}` : ""}{r.page ? ` · from ${r.page}` : ""}</p>
                    <p className="adbody">{r.message}</p>
                    {r.kind === "help" && <p className="meta">{accessOpen(r) ? `Access to the clinic's account until ${longDate(r.access_until as string)}` : r.access_until ? "Access has ended" : "No access given: reply by email"}</p>}
                  </div>
                  <div className="teamacts">
                    {r.employer_id && <Link href={`/admin/clinics/${r.employer_id}`} className="btn sm ghost">Open the clinic</Link>}
                    {!done && <form action={closeSupportRequest}><input type="hidden" name="id" value={r.id} /><button type="submit" className="btn sm">Mark done</button></form>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

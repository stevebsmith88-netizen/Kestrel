import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Admin | Kestrel Eye Care Jobs", robots: { index: false } };

async function count(table: "profiles" | "waitlist", role?: string) {
  const db = supabaseAdmin();
  if (!db) return null;
  let query = db.from(table).select("*", { count: "exact", head: true });
  if (role) query = query.eq("role", role);
  const { count: total, error } = await query;
  return error ? null : total;
}

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await requireRole("admin");
  const [candidates, clinics, waitlist] = await Promise.all([count("profiles", "candidate"), count("profiles", "clinic"), count("waitlist")]);
  const show = (n: number | null) => (n === null ? "Not available" : n.toLocaleString("en-CA"));
  return (
    <>
      <AppBar session={session} />
      <main className="app">
        <div className="wrap">
          <p className="kicker">Admin</p>
          <h1>Overview</h1>
          <p className="lede2">Only your account can open this page. More numbers will appear here as Kestrel grows.</p>
          <div className="tiles">
            <section className="card tile">
              <p className="kicker">Candidates</p>
              <p className="num">{show(candidates)}</p>
              <p>Accounts created</p>
            </section>
            <section className="card tile">
              <p className="kicker">Clinics</p>
              <p className="num">{show(clinics)}</p>
              <p>Accounts created</p>
            </section>
            <section className="card tile">
              <p className="kicker">Waitlist</p>
              <p className="num">{show(waitlist)}</p>
              <p>People waiting for launch</p>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

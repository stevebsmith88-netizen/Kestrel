import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import AdminNumbers from "@/components/AdminNumbers";
import { parsePeriod } from "@/lib/admin-stats";
import { loadStats } from "@/lib/admin-stats-data";
import { periodRange } from "@/lib/admin-stats";
import { summariseFinance, type PaymentRow } from "@/lib/admin-finance";
import { launchLayoutOn } from "@/lib/launch";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await requireRole("admin");
  const period = parsePeriod((await searchParams).period);
  const s = await loadStats(period);
  const launched = await launchLayoutOn();
  // The finance tiles. A database without the payments table just shows "Not on yet".
  const db = supabaseAdmin();
  let finance = null as ReturnType<typeof summariseFinance> | null;
  if (db) {
    try {
      const { data } = await db.from("job_payments").select("status, amount_cents, created_at").limit(5000);
      const range = periodRange(period);
      finance = summariseFinance((data ?? []) as PaymentRow[], range.start, range.end);
    } catch {
      finance = null;
    }
  }
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <h1>Dashboard</h1>
          <p className="lede2">What needs you, and how Kestrel is doing.</p>
          <p><Link className="btn sm ghost" href="/admin/insights">Insights for blog posts</Link></p>
          {s ? <AdminNumbers s={s} period={period} finance={finance} launched={launched} /> : <section className="card"><p>The numbers are not available because the database is not connected.</p></section>}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

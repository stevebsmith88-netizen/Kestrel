import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

async function count(table: "profiles" | "waitlist" | "jobs" | "employers" | "applications" | "job_reports" | "listing_claims", filter?: [string, string]) {
  const db = supabaseAdmin();
  if (!db) return null;
  let query = db.from(table).select("*", { count: "exact", head: true });
  if (filter) query = query.eq(filter[0], filter[1]);
  const { count: total, error } = await query;
  return error ? null : total;
}

export default async function AdminHome() {
  const session = await requireRole("admin");
  const [candidates, clinics, waitlist, live, inReview, profiles, applications, openReports, pendingClaims] = await Promise.all([
    count("profiles", ["role", "candidate"]),
    count("profiles", ["role", "clinic"]),
    count("waitlist"),
    count("jobs", ["status", "live"]),
    count("jobs", ["status", "in_review"]),
    count("employers"),
    count("applications"),
    count("job_reports", ["status", "open"]),
    count("listing_claims", ["status", "pending_review"]),
  ]);
  const show = (n: number | null) => (n === null ? "Not available" : n.toLocaleString("en-CA"));
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">Admin</p>
          <h1>Overview</h1>
          <p className="lede2">Only your account can open this page.</p>

          {inReview ? (
            <p className="notice" role="status">
              {inReview} {inReview === 1 ? "job is" : "jobs are"} waiting for your review. <Link href="/admin/review">Open the review queue</Link>
            </p>
          ) : null}

          {pendingClaims ? (
            <p className="notice" role="status">
              {pendingClaims} {pendingClaims === 1 ? "clinic is" : "clinics are"} waiting to claim a listing. <Link href="/admin/claims">Open the claims</Link>
            </p>
          ) : null}

          {openReports ? (
            <p className="notice" role="status">
              {openReports} {openReports === 1 ? "job has" : "jobs have"} been reported. <Link href="/admin/reports">Open the reports</Link>
            </p>
          ) : null}

          <div className="tiles stats">
            <section className="card tile"><p className="kicker">Live jobs</p><p className="num">{show(live)}</p><p>Visible to candidates</p></section>
            <section className="card tile"><p className="kicker">In review</p><p className="num">{show(inReview)}</p><p><Link href="/admin/review">Review queue</Link></p></section>
            <section className="card tile"><p className="kicker">Clinic profiles</p><p className="num">{show(profiles)}</p><p>Set up their clinic</p></section>
            <section className="card tile"><p className="kicker">Applications</p><p className="num">{show(applications)}</p><p>Sent so far</p></section>
            <section className="card tile"><p className="kicker">Candidates</p><p className="num">{show(candidates)}</p><p>Accounts created</p></section>
            <section className="card tile"><p className="kicker">Clinic accounts</p><p className="num">{show(clinics)}</p><p>Accounts created</p></section>
            <section className="card tile"><p className="kicker">Waitlist</p><p className="num">{show(waitlist)}</p><p><Link href="/admin/waitlist">See the list</Link></p></section>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

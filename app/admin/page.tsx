import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import AdminNumbers from "@/components/AdminNumbers";
import { parsePeriod } from "@/lib/admin-stats";
import { loadStats } from "@/lib/admin-stats-data";
import { notifySearchEnginesAll } from "@/lib/indexnow-actions";

export const metadata: Metadata = { title: "Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ period?: string; indexnow?: string; n?: string; why?: string }> }) {
  const session = await requireRole("admin");
  const query = await searchParams;
  const period = parsePeriod(query.period);
  const s = await loadStats(period);
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">Admin</p>
          <h1>Overview</h1>
          <p className="lede2">How Kestrel is doing. Only your account can open this page.</p>
          <p className="help">More tools: <Link href="/admin/found">Found listings</Link>, for jobs from a clinic&apos;s own careers page, and <Link href="/admin/post-for-clinic">Post for a clinic</Link>, for when a clinic is having trouble with the form, and <Link href="/admin/outreach">Outreach</Link>, for the clinic email sequence.</p>
          {query.indexnow === "sent" && <p className="notice" role="status">Told search engines about {query.n} pages. Bing usually starts crawling within hours to days.</p>}
          {query.indexnow === "failed" && <p className="notice" role="status">Search engines were not told. {query.why}</p>}
          <form action={notifySearchEnginesAll} className="help">
            <button type="submit" className="btn sm ghost">Tell search engines about every page</button> Sends the sitemap to Bing through IndexNow. Needs INDEXNOW_KEY in Vercel (docs/marketing/search-engines.md).
          </form>
          {s ? <AdminNumbers s={s} period={period} /> : <section className="card"><p>The numbers are not available because the database is not connected.</p></section>}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

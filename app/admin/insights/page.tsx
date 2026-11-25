import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import type { Counted } from "@/lib/insights";
import { loadInsights } from "@/lib/insights-data";

export const metadata: Metadata = { title: "Insights | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

function Table({ title, rows }: { title: string; rows: Counted[] }) {
  return (
    <div>
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="meta">Nothing yet.</p>
      ) : (
        <table className="table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.shown}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function Insights() {
  const session = await requireRole("admin");
  const i = await loadInsights();
  return (
    <>
      <AppBar session={session} current="/admin/insights" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <h1>Insights</h1>
          <p className="lede2">Figures for blog posts. Totals only, never a name, an email or a resume. A count under 5 shows as &quot;fewer than 5&quot;, so a post never points to 1 clinic or 1 person.</p>
          {!i ? (
            <section className="card"><p>The figures are not available because the database is not connected.</p></section>
          ) : (
            <>
              <p><Link className="btn sm ghost" href="/admin/insights.csv" prefetch={false}>Download as a spreadsheet</Link></p>
              <section className="card">
                <h2>Candidates and roles</h2>
                <p className="meta">{i.candidates.totalShown} candidate accounts.</p>
                <Table title="By profession" rows={i.candidates.byProfession} />
                <Table title="By province" rows={i.candidates.byProvince} />
              </section>
              <section className="card">
                <h2>Clinics</h2>
                <p className="meta">{i.clinics.registeredShown} registered, {i.clinics.postsShown} jobs posted and approved.</p>
                <Table title="Jobs posted by role" rows={i.clinics.postsByRole} />
                <Table title="Jobs posted by province" rows={i.clinics.postsByProvince} />
              </section>
              <section className="card">
                <h2>Suppliers</h2>
                <p className="meta">{i.suppliers.registeredShown} registered, {i.suppliers.rolesShown} roles posted.</p>
                <Table title="Roles posted by type" rows={i.suppliers.rolesByRole} />
              </section>
              <section className="card">
                <h2>Pay posted on Kestrel</h2>
                <p className="meta">{i.payRule}</p>
                {i.pay.length === 0 ? (
                  <p>Not enough posts yet for any role and province.</p>
                ) : (
                  <table className="table">
                    <thead><tr><th>Role</th><th>Province</th><th>Typical (median)</th><th>Middle half</th><th>Based on</th></tr></thead>
                    <tbody>
                      {i.pay.map((p) => (
                        <tr key={`${p.role}|${p.province}`}>
                          <td>{p.role}</td><td>{p.province}</td><td>{p.median}</td><td>{p.low} to {p.high}</td><td>{p.posts} posts, {p.clinics} clinics</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
          <p><Link className="btn sm ghost" href="/admin">Back to the dashboard</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

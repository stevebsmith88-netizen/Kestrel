import type { Metadata } from "next";
import Link from "next/link";
import AdminSearch from "@/components/AdminSearch";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { searchCandidates } from "@/lib/admin-candidates";
import { loadCandidates } from "@/lib/admin-candidates-data";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Candidates | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const PAGE = 50;

// Admin, Candidates (Steve, 19th November 2026): who has registered, without the demo accounts. No resumes here.
export default async function AdminCandidates({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requireRole("admin");
  const { q = "", page = "1" } = await searchParams;
  const search = q.trim().slice(0, 120);
  const everyone = await loadCandidates();
  const found = everyone ? searchCandidates(everyone, search) : [];
  const pages = Math.max(1, Math.ceil(found.length / PAGE));
  const current = Math.min(pages, Math.max(1, Number.parseInt(page, 10) || 1));
  const rows = found.slice((current - 1) * PAGE, current * PAGE);
  const link = (p: number) => `/admin/candidates?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(p) })}`;
  return (
    <>
      <AppBar session={session} current="/admin/candidates" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Candidates</h1>
          <p className="lede2">Everyone who has registered as a candidate, newest first, without the demo accounts. You see who they are and what they have set up, never a resume or what an application says.</p>
          <AdminSearch id="ac-cq" label="Name, email, town or profession" defaultValue={search} clearHref="/admin/candidates" />
          {!everyone ? (
            <p className="help">The list is not available because the database is not connected.</p>
          ) : rows.length === 0 ? (
            <p className="help">{search ? "No candidates found." : "Candidates who register are listed here."}</p>
          ) : (
            <>
              <p className="meta">{found.length} {found.length === 1 ? "candidate" : "candidates"}{search ? " found" : ""}.</p>
              <ul className="alertlist">
                {rows.map((c) => (
                  <li key={c.id}>
                    <span>
                      <strong>{c.name}</strong><br />
                      <span className="help">{[c.profession, c.place].filter(Boolean).join(" · ") || "Profile not filled in yet"} · joined {longDate(c.joined)}</span>
                    </span>
                    <span className="jobactions"><Link href={`/admin/candidates/${c.id}`} className="btn sm">Open</Link></span>
                  </li>
                ))}
              </ul>
              {pages > 1 && (
                <p className="jobactions">
                  {current > 1 && <Link href={link(current - 1)} className="btn sm ghost">Newer</Link>}
                  <span className="meta">Page {current} of {pages}</span>
                  {current < pages && <Link href={link(current + 1)} className="btn sm ghost">Older</Link>}
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

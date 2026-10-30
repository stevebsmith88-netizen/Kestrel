import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { AppStatusBadge } from "@/components/AppStatus";
import { requireRole } from "@/lib/auth";
import { GROUP_LABELS, groupOf, type Group } from "@/lib/applications";
import { getMyJob } from "@/lib/clinic";
import { longDate } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Applicants | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILTERS: (Group | "all")[] = ["all", "review", "interview", "offer", "closed"];

type Row = { id: string; status: string; created_at: string; cover_letter: string | null; applicant: { name?: string; profession?: string | null; years_experience?: string | null; licensed_provinces?: string[] } };

export default async function Applicants({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filter?: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await params;
  const { filter } = await searchParams;
  if (!UUID.test(id)) notFound();
  const job = await getMyJob(id);
  if (!job) notFound();
  const db = await supabaseServer();
  const { data } = db
    ? await db.from("applications").select("id, status, created_at, cover_letter, applicant").eq("job_id", id).order("created_at", { ascending: false })
    : { data: null };
  const rows = (data ?? []) as Row[];
  const active: Group | "all" = (FILTERS as string[]).includes(filter ?? "") ? (filter as Group | "all") : "all";
  const count = (f: Group | "all") => (f === "all" ? rows.length : rows.filter((r) => groupOf(r.status) === f).length);
  const shown = active === "all" ? rows : rows.filter((r) => groupOf(r.status) === active);

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href="/clinic">Back to your dashboard</Link></p>
          <p className="kicker">Applicants</p>
          <h1>{job.title}</h1>
          <p className="lede2">{rows.length} {rows.length === 1 ? "applicant" : "applicants"}. Open an application to read their cover letter and CV, and to let them know where they stand.</p>

          <nav className="tabs" aria-label="Filter applicants">
            {FILTERS.map((f) => (
              <Link key={f} href={f === "all" ? `/clinic/jobs/${id}/applicants` : `/clinic/jobs/${id}/applicants?filter=${f}`} className={`tab ${active === f ? "on" : ""}`} aria-current={active === f ? "page" : undefined}>
                {f === "all" ? "All" : GROUP_LABELS[f]} ({count(f)})
              </Link>
            ))}
          </nav>

          {shown.length === 0 ? (
            <section className="card emptystate"><h2>{rows.length === 0 ? "No applicants yet" : "Nothing here"}</h2><p>{rows.length === 0 ? "When someone applies, they appear here and we email you." : "Try another tab."}</p></section>
          ) : (
            <div className="joblist">
              {shown.map((r) => (
                <article className="card jobrow" key={r.id}>
                  <div className="jobmain">
                    <h3><Link href={`/clinic/applications/${r.id}`}>{r.applicant.name ?? "Applicant"}</Link></h3>
                    <p className="meta">{[r.applicant.profession, r.applicant.years_experience, r.applicant.licensed_provinces?.length ? `Licensed in ${r.applicant.licensed_provinces.join(", ")}` : null].filter(Boolean).join(" · ")}</p>
                    <p className="meta">Applied {longDate(r.created_at)} · {r.cover_letter ? "Includes a cover letter" : "No cover letter"}</p>
                  </div>
                  <div className="jobside">
                    <AppStatusBadge status={r.status} />
                    <Link href={`/clinic/applications/${r.id}`} className="btn sm">Open</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { AppStatusBadge } from "@/components/AppStatus";
import { requireRole } from "@/lib/auth";
import { APP_EXPLAINERS, GROUP_LABELS, groupOf, type AppStatus, type Group } from "@/lib/applications";
import { getMyApplications } from "@/lib/candidate";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "My applications | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const FILTERS: (Group | "all")[] = ["all", "review", "interview", "offer", "closed"];

export default async function MyApplications({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await requireRole("candidate");
  const { filter } = await searchParams;
  const applications = await getMyApplications();
  const active: Group | "all" = (FILTERS as string[]).includes(filter ?? "") ? (filter as Group | "all") : "all";
  const count = (f: Group | "all") => (f === "all" ? applications.length : applications.filter((a) => groupOf(a.status) === f).length);
  const shown = active === "all" ? applications : applications.filter((a) => groupOf(a.status) === active);
  const needsAttention = applications.filter((a) => a.status === "offer" || a.status === "interview");

  return (
    <>
      <AppBar session={session} current="/candidate/applications" />
      <main className="app">
        <div className="wrap">
          <p className="kicker">My applications</p>
          <h1>Where each application stands</h1>
          <p className="lede2">Clinics update the status as they review your application. Their private notes are never shown to you.</p>

          {needsAttention.length > 0 && (
            <p className="notice" role="status">
              {needsAttention.map((a) => `${a.clinic_name}: ${a.status === "offer" ? "you have an offer" : "interview"}`).join(" · ")}
            </p>
          )}

          <nav className="tabs" aria-label="Filter applications">
            {FILTERS.map((f) => (
              <Link key={f} href={f === "all" ? "/candidate/applications" : `/candidate/applications?filter=${f}`} className={`tab ${active === f ? "on" : ""}`} aria-current={active === f ? "page" : undefined}>
                {f === "all" ? "All" : GROUP_LABELS[f]} ({count(f)})
              </Link>
            ))}
          </nav>

          {shown.length === 0 ? (
            <section className="card emptystate">
              <h2>{applications.length === 0 ? "No applications yet" : "Nothing here"}</h2>
              <p>{applications.length === 0 ? "When you apply to a job, it shows up here with its progress." : "Try another tab."}</p>
              {applications.length === 0 && <Link href="/jobs" className="btn">Find jobs</Link>}
            </section>
          ) : (
            <div className="joblist">
              {shown.map((a) => (
                <article className="card jobrow" key={a.id}>
                  <div className="jobmain">
                    <h3><Link href={`/candidate/applications/${a.id}`}>{a.job_title}</Link></h3>
                    <p className="meta">{a.clinic_name} · {a.job_location}</p>
                    <p className="meta">Applied {longDate(a.created_at)} · {APP_EXPLAINERS[a.status as AppStatus]}</p>
                  </div>
                  <div className="jobside">
                    <AppStatusBadge status={a.status} />
                    <Link href={`/candidate/applications/${a.id}`} className="btn sm ghost">View details</Link>
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

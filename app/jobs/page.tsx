import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { EMPLOYMENT_TYPES, PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES, WORK_ARRANGEMENTS, formatPay, longDate, practiceLabel } from "@/lib/jobs";
import { PAGE_SIZE, cleanFilters, searchJobs, type JobFilters } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// Every search and page number is its own address with the same title, so only the plain /jobs page is offered to Google.
// Searches and later pages can still be followed to the jobs, but they are not listed.
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const filters = cleanFilters(await searchParams);
  const narrowed = Boolean(filters.q || filters.province || filters.role || filters.type || filters.practice || filters.arrangement || (filters.page ?? 1) > 1);
  return {
    ...shareMetadata({
      title: "Find eye care jobs",
      description: "Eye care jobs across Canada, in independent and corporate practices. Every job shows its pay.",
      path: "/jobs",
    }),
    ...(narrowed ? { robots: { index: false, follow: true } } : {}),
  };
}

export const dynamic = "force-dynamic";

function pageHref(filters: JobFilters, page: number) {
  const params = new URLSearchParams();
  (["q", "province", "role", "type", "practice", "arrangement"] as const).forEach((k) => filters[k] && params.set(k, filters[k] as string));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export default async function Jobs({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = cleanFilters(await searchParams);
  const { jobs, total } = await searchJobs(filters);
  const filtered = Boolean(filters.q || filters.province || filters.role || filters.type || filters.practice || filters.arrangement);
  const page = filters.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="jobsearch">
        <div className="wrap">
          <h1>Find your next eye care job</h1>
          <p className="lede2">Independent and corporate practices across Canada. Every job shows its pay.</p>

          <form method="get" action="/jobs" className="searchform" role="search" aria-label="Search jobs">
            <div className="sf-main">
              <label className="sr" htmlFor="s-q">Role, keyword or city</label>
              <input id="s-q" name="q" type="text" placeholder="Role, keyword or city" defaultValue={filters.q} />
              <button type="submit" className="btn">Search</button>
            </div>
            <div className="sf-filters">
              <label className="sr" htmlFor="s-role">Role</label>
              <select id="s-role" name="role" defaultValue={filters.role}>
                <option value="">Any role</option>
                {ROLE_CATEGORIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <label className="sr" htmlFor="s-province">Province or territory</label>
              <select id="s-province" name="province" defaultValue={filters.province}>
                <option value="">All of Canada</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <label className="sr" htmlFor="s-practice">Type of employer</label>
              <select id="s-practice" name="practice" defaultValue={filters.practice}>
                <option value="">Any type of employer</option>
                {PRACTICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label} only</option>)}
              </select>
              <label className="sr" htmlFor="s-arrangement">Where the person works</label>
              <select id="s-arrangement" name="arrangement" defaultValue={filters.arrangement}>
                <option value="">On site or field based</option>
                {WORK_ARRANGEMENTS.map((w) => <option key={w.value} value={w.value}>{w.value === "field" ? "Field based only" : "On site only"}</option>)}
              </select>
              <label className="sr" htmlFor="s-type">Employment type</label>
              <select id="s-type" name="type" defaultValue={filters.type}>
                <option value="">Any type</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </form>

          {jobs.length === 0 ? (
            <section className="card emptystate">
              {filtered ? (
                <>
                  <h2>No jobs match yet</h2>
                  <p>Try fewer filters, or <Link href="/jobs">start again</Link>. New jobs are added all the time.</p>
                </>
              ) : (
                <>
                  <h2>Job search opens soon</h2>
                  <p>We are still building Kestrel, and the first jobs will appear here shortly. Join the waitlist and we will tell you the moment they do.</p>
                  <Link href="/#join" className="btn">Join the waitlist</Link>
                </>
              )}
            </section>
          ) : (
            <>
              <p className="resultcount" role="status">{total} {total === 1 ? "job" : "jobs"}</p>
              <div className="joblist">
                {jobs.map((j) => (
                  <article className="card jobcard" key={j.id}>
                    <div>
                      <h2><Link href={`/jobs/${j.id}`}>{j.title}</Link></h2>
                      <p className="meta">
                        {j.employers?.clinic_name} · {j.city}, {j.province}
                      </p>
                      <p className="chips">
                        <span className="chip">{j.employment_type}</span>
                        <span className="chip paychip">{formatPay(j.pay_min, j.pay_max, j.pay_period)}</span>
                        <span className="chip">{practiceLabel(j.employers?.practice_type)}</span>
                        {j.work_arrangement === "field" && <span className="chip">Field based</span>}
                      </p>
                      {j.is_seeded && !j.employers?.claimed && <p className="seedlabel">Found on the clinic&apos;s website, not yet claimed</p>}
                    </div>
                    <div className="jobside">
                      <span className="meta">Posted {longDate(j.posted_at)}</span>
                      <Link href={`/jobs/${j.id}`} className="btn sm" aria-label={`View job: ${j.title}`}>View job</Link>
                    </div>
                  </article>
                ))}
              </div>
              {pages > 1 && (
                <nav className="pager" aria-label="Pages of jobs">
                  {page > 1 ? <Link href={pageHref(filters, page - 1)} className="btn sm ghost">Previous</Link> : <span />}
                  <span>Page {page} of {pages}</span>
                  {page < pages ? <Link href={pageHref(filters, page + 1)} className="btn sm ghost">Next</Link> : <span />}
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

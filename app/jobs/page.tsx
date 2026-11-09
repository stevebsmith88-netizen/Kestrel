import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import JobCard from "@/components/JobCard";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { emptySearchSuggestions } from "@/lib/empty-search";
import { launchLayoutOn } from "@/lib/launch";
import { EMPLOYMENT_TYPES, employmentLabel, PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES, WORK_ARRANGEMENTS } from "@/lib/jobs";
import { RADIUS_OPTIONS, placeLabel } from "@/lib/places";
import { PAGE_SIZE, cleanFilters, getFilterCounts, searchJobs, type JobFilters } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// Every search and page number is its own address with the same title, so only the plain /jobs page is offered to Google.
// Searches and later pages can still be followed to the jobs, but they are not listed.
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const filters = cleanFilters(await searchParams);
  const narrowed = Boolean(filters.q || filters.city || filters.province || filters.role || filters.type?.length || filters.practice || filters.arrangement || (filters.page ?? 1) > 1);
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
  (["q", "city", "province", "role", "practice", "arrangement"] as const).forEach((k) => filters[k] && params.set(k, filters[k] as string));
  if (filters.city && filters.radius) params.set("radius", String(filters.radius));
  filters.type?.forEach((t) => params.append("type", t));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export default async function Jobs({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = cleanFilters(await searchParams);
  const [{ jobs, total, place, placeNotFound }, counts] = await Promise.all([searchJobs(filters), getFilterCounts()]);
  const session = await getSession();
  const launched = await launchLayoutOn();
  // Alerts are for candidates. A signed out visitor is sent to create an account once sign up is open, and to the waitlist before that.
  const alertHref = session ? (session.role === "candidate" ? "/candidate/alerts" : null) : launched ? "/sign-up?next=%2Fcandidate%2Falerts" : null;
  const filtered = Boolean(filters.q || filters.city || filters.province || filters.role || filters.type?.length || filters.practice || filters.arrangement);
  const page = filters.page ?? 1;
  const suggestions = filtered && jobs.length === 0 && !placeNotFound ? emptySearchSuggestions(filters) : [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <SiteHeader session={session} />
      <main id="main" tabIndex={-1} className="jobsearch">
        <div className="wrap">
          <h1>Find your next eye care job</h1>
          <p className="lede2">Independent and corporate practices across Canada. Every job shows its pay.</p>

          <form method="get" action="/jobs" className="searchform" role="search" aria-label="Search jobs">
            <div className="sf-main">
              <label className="sr" htmlFor="s-q">Role or keyword</label>
              <input id="s-q" name="q" type="text" placeholder="Role or keyword" defaultValue={filters.q} />
              <button type="submit" className="btn">Search</button>
            </div>
            <div className="sf-filters">
              <label className="sr" htmlFor="s-role">Role</label>
              <select id="s-role" name="role" defaultValue={filters.role}>
                <option value="">Any role</option>
                {ROLE_CATEGORIES.filter((r) => counts.roles[r] || r === filters.role).map((r) => <option key={r} value={r}>{r} ({counts.roles[r] ?? 0})</option>)}
              </select>
              <label className="sr" htmlFor="s-province">Province or territory</label>
              <select id="s-province" name="province" defaultValue={filters.province}>
                <option value="">All of Canada</option>
                {PROVINCES.filter((p) => counts.provinces[p] || p === filters.province).map((p) => <option key={p} value={p}>{p} ({counts.provinces[p] ?? 0})</option>)}
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
            </div>
            <div className="sf-filters sf-place">
              <label className="sr" htmlFor="s-city">City or town</label>
              <input id="s-city" name="city" type="text" placeholder="City or town, for example Ottawa" defaultValue={filters.city} autoComplete="off" />
              <label className="sr" htmlFor="s-radius">How far from there</label>
              <select id="s-radius" name="radius" defaultValue={String(filters.radius ?? 25)}>
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>Within {r} km</option>)}
              </select>
            </div>
            <fieldset className="sf-types">
              <legend>Type of work</legend>
              {EMPLOYMENT_TYPES.map((t) => (
                <label key={t} className="sf-tick">
                  <input type="checkbox" name="type" value={t} defaultChecked={filters.type?.includes(t)} />
                  <span>{employmentLabel(t)}</span>
                </label>
              ))}
            </fieldset>
          </form>

          {jobs.length === 0 ? (
            <section className="card emptystate">
              {placeNotFound ? (
                <>
                  <h2>We could not find that place</h2>
                  <p>Check the spelling, or try the nearest larger town. We cover towns of about 1,000 people or more. You can also <Link href="/jobs">start again</Link>.</p>
                </>
              ) : filtered ? (
                <>
                  <h2>No jobs match this search yet</h2>
                  <p>That is not a dead end. Here are quick ways to look a little wider:</p>
                  <ul className="emptylinks">
                    {suggestions.map((s) => <li key={s.label}><Link href={s.href}>{s.label}</Link></li>)}
                    <li><Link href="/jobs">Start again with every job</Link></li>
                  </ul>
                  {alertHref ? (
                    <>
                      <p>Or let the job find you. A job alert emails you when a new job is posted for a role, province and type of employer you choose. Alerts do not use distance.</p>
                      <Link href={alertHref} className="btn">{session?.role === "candidate" ? "Set up a job alert" : "Create an account to set an alert"}</Link>
                    </>
                  ) : session ? null : (
                    <>
                      <p>New jobs are added all the time. Join the waitlist and we will tell you when Kestrel opens, and you can set a job alert for your role and province.</p>
                      <Link href="/#join" className="btn">Join the waitlist</Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h2>We are still building Kestrel</h2>
                  <p>There are no jobs here yet, and we are sorry to say so. If you know a clinic that is hiring, please tell them we exist. Join the waitlist and we will tell you the moment the first jobs appear.</p>
                  <p className="emptyactions">
                    <Link href="/#join" className="btn">Join the waitlist</Link>{" "}
                    <a className="btn ghost" href="mailto:?subject=A%20new%20eye%20care%20job%20board&body=Kestrel%20Eye%20Care%20Jobs%20is%20a%20new%20job%20board%20for%20eye%20care%20in%20Canada.%20Clinics%20can%20post%20jobs%20at%20https%3A%2F%2Feyecarejobs.ca%2Fclinics">Tell a clinic you know</a>
                  </p>
                </>
              )}
            </section>
          ) : (
            <>
              <p className="resultcount" role="status">{total} {total === 1 ? "job" : "jobs"}{place ? ` within ${filters.radius ?? 25} km of ${placeLabel(place)}, and field based jobs` : ""}</p>
              <div className="joblist">
                {jobs.map((j) => <JobCard key={j.id} job={j} />)}
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
          <p className="help"><Link href="/eye-care-jobs">Browse eye care jobs by province and role</Link></p>
          <p className="help creditline">Place data from <a href="https://www.geonames.org/" rel="noopener">GeoNames</a>, used under CC BY 4.0.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

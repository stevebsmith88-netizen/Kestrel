// Search, filter, sort and paging for Admin, Jobs (Steve, 14th November 2026). Kept free of the database so it can be tested.

export const JOBS_PAGE_SIZE = 25;

export const JOB_STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "in_review", label: "In review" },
  { value: "live", label: "Live" },
  { value: "rejected", label: "Sent back" },
  { value: "expired", label: "Expired" },
  { value: "closed", label: "Closed" },
] as const;

export type JobsQuery = { q: string; status: string; order: "newest" | "oldest"; page: number };

// Text that is safe inside a database search pattern. Commas, brackets, quotes, percent signs, stars and backslashes are dropped
// because they have a meaning in the filter language, and the rest is cut to 60 characters.
export function searchTerm(raw: unknown): string {
  return String(raw ?? "").replace(/[,()%*\\"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function parseJobsQuery(raw: { q?: string; status?: string; order?: string; page?: string }): JobsQuery {
  const status = JOB_STATUS_FILTERS.some((s) => s.value === raw.status) ? String(raw.status) : "all";
  const page = Math.min(Math.max(Math.floor(Number(raw.page)) || 1, 1), 1000);
  return { q: searchTerm(raw.q), status, order: raw.order === "oldest" ? "oldest" : "newest", page };
}

export function pageRange(page: number, size = JOBS_PAGE_SIZE): { from: number; to: number } {
  return { from: (page - 1) * size, to: page * size - 1 };
}

// The address of a page of results with the same search, so Previous and Next keep the filters.
export function jobsHref(query: JobsQuery, page: number): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.status !== "all") p.set("status", query.status);
  if (query.order !== "newest") p.set("order", query.order);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/admin/jobs?${s}` : "/admin/jobs";
}

export const filtersInUse = (q: JobsQuery) => Boolean(q.q) || q.status !== "all" || q.order !== "newest";

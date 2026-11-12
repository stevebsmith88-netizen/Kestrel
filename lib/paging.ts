// Asking a list for a page past the end (for example /jobs?page=400) must show the last page, not a count with no jobs.
// Kept free of app imports so it can be tested on its own (lib/paging.test.ts).

export const lastPage = (total: number, size: number) => Math.max(1, Math.ceil(total / size));
export const clampPage = (page: number, total: number, size: number) => Math.min(Math.max(1, page), lastPage(total, size));

export type PageFetch<T> = { rows: T[]; count: number | null; error: boolean };

// Fetches the page asked for. If it comes back empty or with an error (the database refuses a range that starts past the end), the
// total is counted and the last page is fetched instead. Returns the page that was actually shown.
export async function pageOrLast<T>(page: number, size: number, fetchPage: (p: number) => Promise<PageFetch<T>>, countAll: () => Promise<number>): Promise<{ rows: T[]; total: number; page: number; error: boolean }> {
  const first = await fetchPage(page);
  if (!first.error && (first.rows.length > 0 || page <= 1)) return { rows: first.rows, total: first.count ?? first.rows.length, page, error: false };
  if (page <= 1) return { rows: [], total: 0, page: 1, error: first.error };
  const total = await countAll();
  if (total === 0) return { rows: [], total: 0, page: 1, error: false };
  const at = clampPage(page, total, size);
  if (at === page) return { rows: first.rows, total, page, error: first.error };
  const again = await fetchPage(at);
  return { rows: again.rows, total: again.count ?? total, page: at, error: again.error };
}

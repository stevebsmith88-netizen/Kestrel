// How a candidate's own pages read their applications (audit P1-15, design chosen by Steve on 12th November 2026).
// Since migration 0040 the database hands a candidate a masked copy: my_applications() and my_application_events() show a shortlist as
// "viewed", and the candidate can no longer read the 2 tables directly. Each read here tries the masked copy first. On a database that has
// not had migration 0040 the function is missing, the call fails, and the read falls back to the table, as before. Every caller still puts
// the result through lib/application-view.ts, so the mask holds either way.
// Kept free of app imports so it can be tested on its own (lib/my-applications.test.ts).

type Result<T> = { data: T | null; error: { code?: string; message: string } | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;
export type MineDb = { rpc(name: string, args?: Record<string, unknown>): Query; from(table: string): Query };

// `build` adds the columns, filters and order, and is used on whichever source answers.
export async function readMyApplications<T>(db: MineDb, build: (source: Query) => PromiseLike<Result<T>>): Promise<Result<T>> {
  const masked = await build(db.rpc("my_applications"));
  if (!masked.error) return masked;
  return build(db.from("applications"));
}

export type MyEvent = { status: string; note: string | null; created_at: string };

export async function readMyApplicationEvents(db: MineDb, applicationId: string): Promise<MyEvent[]> {
  const columns = "status, note, created_at";
  const masked: Result<MyEvent[]> = await db.rpc("my_application_events", { application: applicationId }).select(columns).order("created_at", { ascending: true });
  if (!masked.error) return masked.data ?? [];
  const direct: Result<MyEvent[]> = await db.from("application_events").select(columns).eq("application_id", applicationId).order("created_at", { ascending: true });
  return direct.data ?? [];
}

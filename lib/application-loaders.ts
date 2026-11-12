// The loaders behind the candidate's and the clinic's application pages. They take the database as an argument, so they can be tested against
// a stand in (lib/application-loaders.test.ts, audit P1-19), and lib/candidate.ts hands them the signed in person's own connection.
// What each reader may see is decided by the database (row level security) and by lib/application-view.ts.
// Kept free of app imports.

import { readMyApplicationEvents, readMyApplications, type MineDb } from "./my-applications.ts";
import { viewApplication, viewForCandidate, type HistoryEvent } from "./application-view.ts";

export type Application = {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string | null;
  keep_details: boolean;
  job_title: string;
  clinic_name: string;
  job_location: string;
  cv_filename: string | null;
  clinic_message: string | null;
  viewed_at: string | null;
  status_changed_at: string;
  created_at: string;
  applicant: { name?: string; email?: string; phone?: string | null; profession?: string | null; licensed_provinces?: string[]; years_experience?: string | null; available_from?: string | null };
};

export const APPLICATION_COLUMNS =
  "id, job_id, status, cover_letter, keep_details, job_title, clinic_name, job_location, cv_filename, clinic_message, viewed_at, status_changed_at, created_at, applicant";

export type LoadedApplication = { application: Application; history: HistoryEvent[] };

// The candidate's own applications, newest first, from the database's masked copy (lib/my-applications.ts) or the table on a database
// without migration 0040. Always put through the candidate view, so a shortlist shows as Viewed either way.
export async function loadMyApplications(db: MineDb): Promise<Application[]> {
  const { data } = await readMyApplications<Application[]>(db, (source) => source.select(APPLICATION_COLUMNS).order("created_at", { ascending: false }));
  return (data ?? []).map(viewForCandidate);
}

// One application and its history, as the given reader should see it. The database only returns it if the reader may see it
// (the candidate's own, or one to a job of the clinic's own).
export async function loadApplicationWith(db: MineDb, id: string, audience: "candidate" | "clinic"): Promise<LoadedApplication | null> {
  if (audience === "candidate") {
    // Since migration 0040 a candidate cannot read these 2 tables directly, so their copy comes through lib/my-applications.ts.
    const { data } = await readMyApplications<Application>(db, (source) => source.select(APPLICATION_COLUMNS).eq("id", id).maybeSingle());
    if (!data) return null;
    return viewApplication(data, await readMyApplicationEvents(db, id), audience);
  }
  const { data } = await db.from("applications").select(APPLICATION_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: events } = await db.from("application_events").select("status, note, created_at").eq("application_id", id).order("created_at", { ascending: true });
  return viewApplication(data as Application, events ?? [], audience);
}

// Run with: npm test
// The admin review queue loader (review item X-16), against a stand in database that answers the way Supabase does.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadReviewQueue } from "./review-queue.ts";

const TABLES: Record<string, any[]> = {
  jobs: [
    { id: "j1", title: "Optician", status: "in_review", created_at: "2026-11-03", employer_id: "e1", posted_at: null },
    { id: "j2", title: "Optometrist", status: "in_review", created_at: "2026-11-01", employer_id: "e2", posted_at: "2026-10-01" },
    { id: "j3", title: "Live one", status: "live", created_at: "2026-10-01", employer_id: "e1", posted_at: "2026-10-01" },
  ],
  employer_contacts: [
    { employer_id: "e1", notify_email: "hiring@one.example", employee_band: "1_9" },
    { employer_id: "e2", notify_email: "jobs@two.example", employee_band: null },
  ],
  job_versions: [
    { job_id: "j2", snapshot: { title: "Old title" }, saved_at: "2026-10-01" },
    { job_id: "j2", snapshot: { title: "Newer title" }, saved_at: "2026-10-20" },
  ],
};

function fakeDb() {
  const asked: string[] = [];
  return {
    asked,
    db: {
      from(table: string) {
        asked.push(table);
        let list = [...(TABLES[table] ?? [])];
        const q: any = {
          select: () => q,
          eq: (col: string, v: string) => { list = list.filter((r) => r[col] === v); return q; },
          in: (col: string, vs: string[]) => { list = list.filter((r) => vs.includes(r[col])); return q; },
          order: (col: string, o: { ascending: boolean }) => { list.sort((x, y) => String(x[col]).localeCompare(String(y[col])) * (o.ascending ? 1 : -1)); return q; },
          then: (ok: any, bad: any) => Promise.resolve({ data: list, error: null }).then(ok, bad),
        };
        return q;
      },
    },
  };
}

test("only jobs waiting for review, oldest first", async () => {
  const { db } = fakeDb();
  const { jobs } = await loadReviewQueue(db);
  assert.deepEqual(jobs.map((j) => j.id), ["j2", "j1"]);
});

test("each clinic's alert address and size come with it", async () => {
  const { db } = fakeDb();
  const { notifyEmails, bands } = await loadReviewQueue(db);
  assert.equal(notifyEmails.get("e1"), "hiring@one.example");
  assert.equal(bands.get("e2"), null);
});

test("an edited live job shows the most recent wording candidates saw", async () => {
  const { db } = fakeDb();
  const { liveWording } = await loadReviewQueue(db);
  assert.deepEqual(liveWording.get("j2"), { title: "Newer title" });
  assert.equal(liveWording.has("j1"), false, "a brand new job has no earlier wording");
});

test("an empty queue asks nothing more, and no database gives an empty queue", async () => {
  const empty = fakeDb();
  TABLES.jobs.forEach((j) => (j.status = j.status === "in_review" ? "parked" : j.status));
  const r = await loadReviewQueue(empty.db);
  assert.equal(r.jobs.length, 0);
  assert.deepEqual(empty.asked, ["jobs"]);
  assert.equal((await loadReviewQueue(null)).jobs.length, 0);
});

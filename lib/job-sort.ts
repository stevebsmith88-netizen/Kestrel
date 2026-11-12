// How the Find jobs list is ordered (Steve, November 2026). Best match is the order from the "For me" rules and is only offered to a signed in
// candidate with a role on their profile. Newest is the default for everyone else. Closest needs a place to measure from, so it is offered
// only when a town was searched or a home town is saved. Pay is not a sort, because pay comes in different shapes. Kept free of app imports so
// it can be tested on its own (lib/job-sort.test.ts).

import { distanceKm, findPlace, type Place } from "./places.ts";

export const SORTS = ["best", "new", "near"] as const;
export type Sort = (typeof SORTS)[number];

export function parseSort(value: unknown): Sort | null {
  return typeof value === "string" && (SORTS as readonly string[]).includes(value) ? (value as Sort) : null;
}

// Which sorts can be offered, and which one is on. A sort that cannot be used falls back to the default.
export function sortChoice(asked: Sort | null, opts: { forMe: boolean; hasPlace: boolean }): { options: Sort[]; sort: Sort } {
  const options: Sort[] = [...(opts.forMe ? (["best"] as Sort[]) : []), "new", ...(opts.hasPlace ? (["near"] as Sort[]) : [])];
  const fallback: Sort = opts.forMe ? "best" : "new";
  return { options, sort: asked && options.includes(asked) ? asked : fallback };
}

type Orderable = { posted_at: string; city: string; province: string; work_arrangement?: string | null };

// Kilometres from the place to the job. A field based job is not tied to one town, and an unknown town cannot be measured, so both go last.
export function kmFrom(ref: Place, job: Orderable): number {
  if (job.work_arrangement === "field") return Number.POSITIVE_INFINITY;
  const there = findPlace(job.city, job.province);
  return there ? distanceKm(ref, there) : Number.POSITIVE_INFINITY;
}

export function orderJobs<T extends Orderable>(jobs: readonly T[], sort: "new" | "near", ref: Place | null): T[] {
  const newest = (a: T, b: T) => Date.parse(b.posted_at) - Date.parse(a.posted_at);
  const list = [...jobs];
  if (sort === "near" && ref) {
    const km = new Map(list.map((j) => [j, kmFrom(ref, j)] as const));
    return list.sort((a, b) => {
      const da = km.get(a) as number;
      const db = km.get(b) as number;
      if (da === db) return newest(a, b);
      return da < db ? -1 : 1;
    });
  }
  return list.sort(newest);
}
